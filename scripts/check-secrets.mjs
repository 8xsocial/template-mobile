#!/usr/bin/env node
// Scans text for credentials that must never be committed. Shared by
// .githooks/pre-commit (local, over the staged blobs of every commit) and the
// CI `check:secrets` job (every PR, over all tracked files) — one
// implementation, so the two enforcement points can never drift, the same way
// scripts/check-commit-message.mjs backs both the commit-msg hook and its CI
// job. Edit the rules here, not in either caller.
//
// The risk this exists for: an agent session transcript is committed verbatim
// to .claude-logs/ or .codex-logs/ (see docs/rules/secrets.md), and a real
// DATABASE_URL, Supabase secret key or bearer token that scrolled past in the
// session rides along into git history. `.env*` files are gitignored so the
// files themselves can't be committed; a transcript that quotes their values
// is the hole this closes. It also catches a hardcoded key that lands in
// source anywhere else in the tree.
//
// This is the commit-time cousin of src/server/lib/logger/redact.ts, which
// scrubs the same shapes out of structured log fields at runtime. They stay
// separate on purpose: redact() walks known-structure values in the log
// pipeline and rewrites them; this greps arbitrary file text and refuses the
// commit. Different inputs, different jobs — sharing would couple a bundled
// runtime module to a zero-dependency build script for no real reuse.
//
// Precision over recall by design: a false positive blocks a commit, so every
// rule allowlists the placeholder shapes the repo genuinely carries
// (`postgresql://user:password@host`, `Bearer $CRON_SECRET`, `sk-...` written
// as prose). Escape hatches for a genuine false positive: put `allowlist
// secret` in a comment on the line, or add a glob to `.secretsallow`.
//
// Usage:
//   node scripts/check-secrets.mjs --staged     # ACM-staged blobs (the hook)
//   node scripts/check-secrets.mjs --all        # every tracked file (CI)
//   node scripts/check-secrets.mjs <path> ...   # named files
//
// Exit codes: 0 nothing found, 1 at least one finding, 2 bad invocation.

import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// ---------------------------------------------------------------------------
// Allowlisting
// ---------------------------------------------------------------------------

// Never scanned. This file and its test carry example secrets as fixtures;
// lockfiles are a wall of high-entropy hashes; .secretsallow is the allowlist
// itself. Paths are matched as suffixes so they hold under --root too.
const SKIP_PATHS = [
	'scripts/check-secrets.mjs',
	'scripts/check-secrets.test.mjs',
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',
	'bun.lockb',
	'.secretsallow'
]

// Binary and generated-asset extensions: no credential worth catching lives in
// one, and scanning them is noise and wasted work.
const SKIP_EXTENSIONS = new Set([
	'png',
	'jpg',
	'jpeg',
	'gif',
	'webp',
	'avif',
	'ico',
	'bmp',
	'tiff',
	'woff',
	'woff2',
	'ttf',
	'otf',
	'eot',
	'pdf',
	'zip',
	'gz',
	'tar',
	'tgz',
	'bz2',
	'xz',
	'br',
	'7z',
	'mp4',
	'webm',
	'mov',
	'avi',
	'mp3',
	'wav',
	'ogg',
	'flac',
	'wasm',
	'node',
	'so',
	'dylib',
	'dll',
	'exe',
	'bin'
])

// Files above this size are almost always generated (bundles, snapshots); a
// hand-authored secret does not hide in a megabyte of one line.
const MAX_BYTES = 1_000_000

// Values that look like a secret's slot but are a placeholder, a template
// reference, or a well-known fake. Kept lowercase; matched as whole words.
const PLACEHOLDER_WORDS = new Set([
	'placeholder',
	'example',
	'sample',
	'changeme',
	'change',
	'your',
	'yours',
	'yourkey',
	'yourtoken',
	'yoursecret',
	'todo',
	'tbd',
	'dummy',
	'fake',
	'mock',
	'test',
	'testing',
	'redacted',
	'hidden',
	'masked',
	'secret',
	'password',
	'passwd',
	'pwd',
	'pass',
	'user',
	'username',
	'postgres',
	'root',
	'admin',
	'local',
	'localhost',
	'none',
	'null',
	'undefined',
	'nil',
	'abc',
	'abc123',
	'foo',
	'bar',
	'baz',
	'qux',
	'hunter2',
	's3cret',
	's3cr3t',
	'xxx',
	'xxxx',
	'xxxxx'
])

// Substrings that mark a value as a template or reference rather than a live
// credential: `${VAR}`, `process.env.X`, `<your-token>`, `%PLACEHOLDER%`, a
// test/example/local hostname.
const REFERENCE_MARKERS = [
	'${',
	'{{',
	'<',
	'>',
	'%',
	'process.env',
	'import.meta',
	'os.environ',
	'getenv',
	'your-',
	'your_',
	'example.com',
	'example.org',
	'example.net',
	'.example',
	'.test',
	'.local',
	'.invalid',
	'changeme',
	'placeholder'
]

function isPlaceholderValue(raw) {
	if (raw == null) return true
	const value = String(raw)
		.trim()
		.replace(/^['"`]+|['"`]+$/g, '')
	if (value === '') return true
	const lower = value.toLowerCase()
	if (REFERENCE_MARKERS.some((marker) => lower.includes(marker))) return true
	if (/^(.)\1*$/.test(value)) return true // all one character: xxxx, 0000
	if (/^[a-z]{1,12}$/.test(value)) return true // short lowercase dictionary word
	if (/^[a-z0-9]{1,10}$/.test(value)) return true // short lowercase+digit token
	// Any whole word inside the value is a known placeholder (my-placeholder-key).
	if (value.length <= 24 && words(value).some((word) => PLACEHOLDER_WORDS.has(word))) return true
	return false
}

// Shannon entropy in bits per character — a random API key sits high, a slug or
// a sentence sits low. Used to keep the sensitive-assignment rule off ordinary
// identifiers and prose.
function shannon(value) {
	const counts = new Map()
	for (const char of value) counts.set(char, (counts.get(char) ?? 0) + 1)
	let entropy = 0
	for (const count of counts.values()) {
		const p = count / value.length
		entropy -= p * Math.log2(p)
	}
	return entropy
}

// camelCase / snake_case / kebab-case all reduce to the same words, so
// STRIPE_API_KEY, apiKey and x-api-key are one rule and `monkey` is not a
// match. Mirrors src/server/lib/logger/redact.ts's splitter.
function words(name) {
	return name
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean)
		.map((word) => word.toLowerCase())
}

// Only names for a *reusable* credential, so the sensitive-assignment rule
// fires on `API_KEY=…` but not on `x-moad-signature: …` (a per-request HMAC,
// derived from a secret that isn't itself present) or a session/cookie value.
// Those are handled — where they are handled — by the header and URL rules.
const CREDENTIAL_WORDS = new Set([
	'authorization',
	'credential',
	'credentials',
	'key',
	'apikey',
	'passphrase',
	'passwd',
	'password',
	'pwd',
	'secret',
	'token'
])

function isCredentialKey(name) {
	return words(name).some((word) => CREDENTIAL_WORDS.has(word))
}

// A value long and disordered enough to be an actual credential rather than a
// short fake, a slug, or an english-word example. The entropy floor is what
// keeps `Bearer sk-or-not-a-real-key` (reads as words) out.
function isLiveSecret(value, { minLen = 12, minEntropy = 3.6 } = {}) {
	if (value.length < minLen) return false
	if (isPlaceholderValue(value)) return false
	return shannon(value) >= minEntropy
}

function looksLikeSecretValue(value) {
	if (!/^[A-Za-z0-9._+/=~-]{20,}$/.test(value)) return false
	// Supabase's publishable key is public by design (it ships in the browser
	// bundle), so it may sit in .env.example or a CI workflow in the clear.
	if (value.startsWith('sb_publishable_')) return false
	if (!/[0-9]/.test(value) || !/[A-Za-z]/.test(value)) return false
	if (isPlaceholderValue(value)) return false
	// A long hex blob is a hash/token; Shannon entropy caps near 4 bits for
	// base16, so a 40-char API token would slip under the floor. Judge it by
	// shape instead.
	if (/^[0-9a-fA-F]{32,}$/.test(value)) return true
	return shannon(value) >= 4.0
}

// ---------------------------------------------------------------------------
// Rules — each finds a shape, then validate() decides if the specific hit is a
// live credential or an allowlisted placeholder.
// ---------------------------------------------------------------------------

const RULES = [
	{
		// A kilobyte-plus base64 run in a transcript is a file, not a value. The
		// 2026-09 audit found an entire Android signing keystore inlined in an EAS
		// build error; a signing identity cannot be rotated, so this is the most
		// expensive shape to miss. Threshold is high enough to ignore an inline
		// icon or a scraped page's assets.
		id: 'large-base64-blob',
		description: 'a large base64 blob (an inlined keystore, certificate or key file)',
		regex: /\b[A-Za-z0-9+/]{1000,}={0,2}/g
	},
	{
		// A PostHog project/personal key. `phc_` ships to the browser, but a
		// transcript quoting one usually quotes `phx_`/the personal token beside
		// it, and the audit of 2026-09 found both shapes in .claude-logs.
		id: 'posthog-key',
		description: 'a PostHog API key',
		regex: /\bph[cx]_[A-Za-z0-9]{30,}\b/g,
		validate: (secret) => !isPlaceholderValue(secret)
	},
	{
		// RapidAPI keys are a hex blob with a literal `jsn` in the middle. Four
		// of them sat in .claude-logs for nine months before the 2026-09 audit.
		id: 'rapidapi-key',
		description: 'a RapidAPI key',
		regex: /\b[0-9a-f]{20,60}jsn[0-9a-f]{8,}\b/g
	},
	{
		// The sign-in bypass shipped as `?dev=<secret>` and magic links arrive as
		// `?token=`/`?otp=`. The generic sensitive-query-param rule keys on
		// key/token/secret/... and so misses `dev`, `otp` and `magic`.
		id: 'auth-query-param',
		description: 'a credential in a dev / otp / magic-link query parameter',
		regex: /[?&][\w.-]*(?:otp|magic|dev|session|bearer)[\w.-]*=([^&\s"'`]+)/gi,
		group: 1,
		validate: (value) => isLiveSecret(value, { minEntropy: 3.0 })
	},
	{
		id: 'private-key',
		description: 'a PEM private-key block',
		regex: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/g
	},
	{
		id: 'aws-access-key-id',
		description: 'an AWS access key id',
		regex: /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA)[0-9A-Z]{16}\b/g
	},
	{
		id: 'github-token',
		description: 'a GitHub personal-access / app token',
		regex: /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[0-9A-Za-z_]{22,255})\b/g
	},
	{
		id: 'slack-token',
		description: 'a Slack token',
		regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g
	},
	{
		id: 'stripe-secret-key',
		description: 'a Stripe live secret key',
		regex: /\b(?:sk|rk)_live_[0-9A-Za-z]{16,}\b/g
	},
	{
		id: 'openai-anthropic-key',
		description: 'an OpenAI / Anthropic API key',
		regex: /\b(?:sk-ant-[A-Za-z0-9_-]{20,}|sk-(?:proj-|svcacct-)?[A-Za-z0-9]{32,})\b/g,
		validate: (secret) => !isPlaceholderValue(secret)
	},
	{
		id: 'google-api-key',
		description: 'a Google API key',
		regex: /\bAIza[0-9A-Za-z_-]{35}\b/g
	},
	{
		id: 'sendgrid-key',
		description: 'a SendGrid API key',
		regex: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g
	},
	{
		// Supabase's current secret key. The publishable key (sb_publishable_…)
		// is public by design and deliberately not a rule.
		id: 'supabase-secret-key',
		description: 'a Supabase secret key',
		regex: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g,
		validate: (secret) => !isPlaceholderValue(secret)
	},
	{
		id: 'jwt',
		description: 'a JWT (a legacy Supabase service-role / anon key is one)',
		regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}\b/g,
		validate: (secret) => !isPlaceholderValue(secret)
	},
	{
		// proto://user:PASSWORD@host — the DATABASE_URL shape. The password is the
		// secret; benign when it is a placeholder (user:password, postgres:postgres)
		// or a short lowercase token (the fakes the repo's tests and .env.example use).
		id: 'url-credentials',
		description: 'a connection string with an inline password',
		regex: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:([^\s/@]+)@/g,
		group: 1,
		validate: (password) => !isPlaceholderValue(password)
	},
	{
		id: 'sensitive-query-param',
		description: 'a secret in a URL query parameter',
		regex:
			/[?&][\w.-]*(?:key|token|secret|password|passwd|pwd|auth|credential|signature)[\w.-]*=([^&\s"'`]+)/gi,
		group: 1,
		validate: (value) => isLiveSecret(value, { minEntropy: 3.0 })
	},
	{
		id: 'auth-header',
		description: 'an Authorization header value',
		regex: /\b(?:Bearer|Basic)\s+([A-Za-z0-9._~+/=-]{16,})/g,
		group: 1,
		validate: (token) => isLiveSecret(token)
	},
	{
		// A sensitively-named key assigned a high-entropy literal:
		// MY_SERVICE_KEY=<40 random chars>. Deliberately strict — sensitive key
		// name AND a token-shaped, high-entropy, non-placeholder value — so it
		// stays off `secret: z.string()` and `apiKey: opts.apiKey`.
		id: 'sensitive-assignment',
		description: 'a secret-looking value assigned to a sensitively-named key',
		regex: /([A-Za-z_][A-Za-z0-9_.-]{2,40})\s*[:=]\s*['"`]?([A-Za-z0-9._+/=~-]{20,})['"`]?/g,
		group: 2,
		validate: (value, match) => isCredentialKey(match[1]) && looksLikeSecretValue(value)
	}
]

function maskSecret(secret) {
	if (secret.length <= 8) return `${secret[0] ?? ''}***`
	return `${secret.slice(0, 4)}…${secret.slice(-2)} (${secret.length} chars)`
}

// Every finding in one file's text: { line, column, ruleId, description, preview }.
// RULES run most-specific-first, and one secret can match two rules (a JWT is
// also an auth-header value); the first hit per (line, masked value) wins, so
// each secret is reported once, by its most specific rule.
export function scanText(text) {
	const findings = []
	const lines = text.split('\n')
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index]
		if (/allowlist secret/i.test(line)) continue // inline escape hatch
		const seen = new Set()
		for (const rule of RULES) {
			rule.regex.lastIndex = 0
			let match
			while ((match = rule.regex.exec(line)) !== null) {
				const secret = (rule.group != null ? match[rule.group] : match[0]) ?? match[0]
				if (rule.validate && !rule.validate(secret, match)) continue
				const preview = maskSecret(secret)
				if (seen.has(preview)) continue
				seen.add(preview)
				findings.push({
					line: index + 1,
					column: match.index + 1,
					ruleId: rule.id,
					description: rule.description,
					preview
				})
			}
		}
	}
	return findings
}

// ---------------------------------------------------------------------------
// File selection and IO
// ---------------------------------------------------------------------------

function git(...args) {
	return spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function extensionOf(path) {
	const base = path.slice(path.lastIndexOf('/') + 1)
	const dot = base.lastIndexOf('.')
	return dot > 0 ? base.slice(dot + 1).toLowerCase() : ''
}

function globToRegExp(glob) {
	const escaped = glob
		.trim()
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/\*\*/g, ' ')
		.replace(/\*/g, '[^/]*')
		.replace(/ /g, '.*')
		.replace(/\?/g, '.')
	return new RegExp(`(^|/)${escaped}$`)
}

function loadAllowlist() {
	if (!existsSync('.secretsallow')) return []
	return readFileSync('.secretsallow', 'utf8')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '' && !line.startsWith('#'))
		.map(globToRegExp)
}

function isSkipped(path, allowlist) {
	if (SKIP_PATHS.some((skip) => path === skip || path.endsWith(`/${skip}`))) return true
	if (SKIP_EXTENSIONS.has(extensionOf(path))) return true
	return allowlist.some((pattern) => pattern.test(path))
}

// Text-or-binary: a NUL byte in the first chunk is git's own heuristic.
function isProbablyBinary(text) {
	return text.slice(0, 8000).includes('\u0000')
}

function stagedFiles() {
	const out = git('diff', '--cached', '--name-only', '-z', '--diff-filter=ACM')
	return out.status === 0 ? out.stdout.split('\0').filter(Boolean) : []
}

function trackedFiles() {
	const out = git('ls-files', '-z')
	return out.status === 0 ? out.stdout.split('\0').filter(Boolean) : []
}

// --staged reads the blob that is actually being committed (`git show :path`),
// not the working tree, so a partially `git add -p`'d secret can't slip past.
function readStaged(path) {
	const out = git('show', `:${path}`)
	return out.status === 0 ? out.stdout : null
}

function readDisk(path) {
	try {
		return readFileSync(path, 'utf8')
	} catch {
		return null
	}
}

function collect(mode, paths) {
	if (mode === 'staged') return stagedFiles().map((path) => [path, readStaged(path)])
	if (mode === 'all') return trackedFiles().map((path) => [path, readDisk(path)])
	return paths.map((path) => [path, readDisk(path)])
}

export function run({ mode, paths = [] }) {
	const allowlist = loadAllowlist()
	const findings = []
	for (const [path, text] of collect(mode, paths)) {
		if (text == null || isSkipped(path, allowlist)) continue
		// Session transcripts are routinely over 1MB and are exactly where a
		// credential lands, so the generated-bundle size cap does not apply to them.
		const isTranscript = /(^|\/)\.(claude|codex)-logs\//.test(path)
		if ((!isTranscript && text.length > MAX_BYTES) || isProbablyBinary(text)) continue
		for (const finding of scanText(text)) findings.push({ path, ...finding })
	}
	return findings
}

function main() {
	const args = process.argv.slice(2)
	let mode = null
	const paths = []
	for (const arg of args) {
		if (arg === '--staged') mode = 'staged'
		else if (arg === '--all') mode = 'all'
		else if (arg.startsWith('--')) {
			console.error(`Unknown flag: ${arg}`)
			process.exit(2)
		} else paths.push(arg)
	}
	if (mode == null) mode = paths.length > 0 ? 'paths' : null
	if (mode == null) {
		console.error('Usage: check-secrets.mjs --staged | --all | <path> ...')
		process.exit(2)
	}

	const findings = run({ mode, paths })
	if (findings.length === 0) process.exit(0)

	console.error(
		`\n✗ check:secrets found ${findings.length} possible secret${findings.length === 1 ? '' : 's'}:\n`
	)
	for (const finding of findings) {
		console.error(`  ${finding.path}:${finding.line}:${finding.column}  ${finding.ruleId}`)
		console.error(`      ${finding.description} — ${finding.preview}`)
	}
	console.error(
		'\nRemove or redact the value (a session transcript should never carry a live\n' +
			'credential — see docs/rules/secrets.md). If this is genuinely not a secret,\n' +
			'add `allowlist secret` in a comment on the line, or a glob to .secretsallow.\n'
	)
	process.exit(1)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main()
}
