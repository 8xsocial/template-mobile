# 8x React Native Template

Production-ready React Native Expo template. Clone it, rename it, brand it, ship it.
Supabase auth + DB, RevenueCat subscriptions, Sentry, PostHog, and TanStack Query are all pre-wired.
No boilerplate to write — just build your features.

---

## What's pre-built

| Feature | What you get |
|---|---|
| **Auth** | Passwordless OTP email — no passwords, no user support headaches |
| **Social login** | Google + Apple OAuth wired via Supabase — buttons work, just add credentials |
| **Onboarding** | One-step display name capture with Supabase profile upsert |
| **Auth routing** | Three-zone guard (public → onboarding → authenticated) — zero manual navigation |
| **Subscriptions** | RevenueCat IAP fully wired — `useSubscription().isPremium` anywhere in the app |
| **Paywall** | Full upgrade screen — monthly/yearly packages, savings badge, restore, promo code redeem |
| **Data fetching** | TanStack Query with retry, 30s cache, and placeholder data — screens never flash empty |
| **Database** | Full domain schema — items, tasks, notifications, activity feed — all with RLS + soft deletes |
| **Toast system** | Animated bottom toasts with success/error/info variants — `useToast()` anywhere |
| **Bottom sheet modals** | All confirmations slide up from the bottom — no jarring center popups |
| **Settings** | Toggle preferences persisted to AsyncStorage — survive app restarts |
| **Error tracking** | Sentry wired and disabled in dev — zero noise during development |
| **Analytics** | PostHog with typed event names + automatic screen tracking on every navigation |
| **Feature flags** | `useFeatureFlag('flag')` hook backed by PostHog — safe rollouts from day one |
| **Offline UX** | Mid-session banner + full launch-offline overlay — handles both cases |
| **CI/CD** | GitHub Actions — typecheck + tests run on every push and PR |
| **Tests** | Jest + jest-expo setup with 14 passing utility tests out of the box |
| **Deep linking** | App scheme + Android intent filters + iOS associated domains scaffold |
| **Dev skip** | Tap "Skip to Home" in dev — bypasses auth instantly with no network call |
| **Design system** | 59 theme tokens — change one `ACCENT` hex to rebrand the entire app |
| **Typography** | Inter via `@expo-google-fonts` — `<Text>` auto-applies correct weight, fixes Android bug |
| **Component library** | Button (5 variants), Card, StatusBadge, SettingsRow, TextInputField, AppModal |
| **Navigation** | Expo Router file-based routing — add a file, get a screen |
| **i18n** | i18next with English locale ready — drop a JSON file to add a language |
| **RevenueCat webhook** | Supabase edge function syncs `plan_type` on every subscription event |

---

## Stack

| Layer | Package | Version |
|---|---|---|
| Framework | expo | ~55.0.14 |
| Runtime | react-native | 0.83.4 |
| Language | TypeScript | ~5.9 |
| Routing | expo-router | ~55.0.12 |
| Styling | nativewind + tailwindcss | ^4.2 / ^3.4 |
| Auth + DB | @supabase/supabase-js | ^2.100 |
| Data fetching | @tanstack/react-query | ^5.99 |
| Subscriptions | react-native-purchases | ^9.15 |
| Error tracking | @sentry/react-native | ~7.11 |
| Analytics | posthog-react-native | ^4.39 |
| i18n | i18next + react-i18next | ^26 / ^17 |
| Animations | react-native-reanimated | 4.2.1 |
| Icons | lucide-react-native + @expo/vector-icons | latest |
| Testing | jest + jest-expo | ^29 / ^55 |

---

## Prerequisites

Install these once on your machine before starting any project.

```bash
# Node.js — use v20 LTS
# https://nodejs.org/en/download

# Expo CLI
npm install -g expo-cli

# EAS CLI (for builds and submissions)
npm install -g eas-cli

# Supabase CLI (for local DB)
# macOS:
brew install supabase/tap/supabase
# Windows:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
# Other: https://supabase.com/docs/guides/cli/getting-started

# Docker Desktop — required for local Supabase
# https://www.docker.com/products/docker-desktop
```

For running on a device/simulator:
- **iOS**: Xcode (Mac only) — install from the App Store
- **Android**: Android Studio — install from developer.android.com

---

## Starting a new project from this template

### Step 1 — Copy the template

```bash
# Option A: Copy the folder directly
cp -r 8x-rn-template my-new-app

# Option B: Clone from GitHub
git clone https://github.com/your-org/8x-rn-template my-new-app
```

```bash
cd my-new-app

# Reset git history so the new app starts clean
rm -rf .git
git init
git add .
git commit -m "feat: initial commit from 8x-rn-template"
```

### Step 2 — Install dependencies

```bash
npm install
```

If `npm install` fails with `ERESOLVE`:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Step 3 — Rename the app

Open `app.json` and replace all placeholder values:

```json
{
  "expo": {
    "name": "YourAppName",
    "slug": "your-app-name",
    "scheme": "yourapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "associatedDomains": ["applinks:yourdomain.com"]
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    },
    "extra": {
      "eas": { "projectId": "REPLACE_AFTER_EAS_CONFIGURE" }
    },
    "owner": "your-expo-username"
  }
}
```

Then open `lib/constants.ts` — this is the single file for all app identity:

```ts
export const APP_NAME          = 'YourAppName'
export const APP_TAGLINE       = 'Your tagline here.'
export const APP_SCHEME        = 'yourapp'          // must match app.json scheme
export const APP_SUPPORT_EMAIL = 'support@yourapp.com'
export const APP_DOCS_URL      = 'https://yourapp.com/docs'
```

### Step 4 — Set your brand color

Open `lib/theme.ts` and change one line:

```ts
export const ACCENT = '#6366f1'   // change to any hex
```

Then open `tailwind.config.js` and set the same hex:

```js
colors: {
  accent: '#your-hex-color',   // must match lib/theme.ts
}
```

Also update the derived opacity values to match:
```ts
export const ACCENT_DIM    = 'rgba(r,g,b,0.12)'
export const ACCENT_BORDER = 'rgba(r,g,b,0.30)'
export const ACCENT_GLOW   = 'rgba(r,g,b,0.20)'
export const ACCENT_LIGHT  = '#lighter-variant'
```

That's the full rebrand — every button, tab, badge, and active state updates.

### Step 5 — Replace app icons

Drop your own images into `assets/`:

| File | Size | Used for |
|---|---|---|
| `icon.png` | 1024×1024 | App Store / Play Store icon |
| `splash-icon.png` | 200×200 | Splash screen centre image |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground |
| `favicon.png` | 32×32 | Web browser tab |

Tip: [appicon.co](https://appicon.co) — upload one 1024×1024 PNG and it exports all required sizes.

### Step 6 — Set up Supabase locally

Start Docker Desktop first, then:

```bash
supabase start
supabase db reset   # applies all migrations in supabase/migrations/
```

When it finishes you'll see:
```
API URL: http://127.0.0.1:54321
anon key: eyJhbGci...
```

Copy those for the next step.

### Step 7 — Create your .env.local file

```bash
cp .env.example .env.local
```

Fill in the values:

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

# Leave empty — these degrade gracefully when unconfigured:
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Step 8 — Run the app

```bash
npx expo start
```

- Press `a` → Android emulator
- Press `i` → iOS simulator (Mac only)
- Scan QR code → Expo Go on your phone

> RevenueCat requires a native build. For purchase testing: `npx expo run:android` or `npx expo run:ios`.

---

## How the app is structured

```
app/
  _layout.tsx          Root layout — all providers + auth routing
  index.tsx            Public landing page
  upgrade.tsx          Paywall (always accessible)
  privacy.tsx          Privacy policy placeholder
  terms.tsx            Terms of service placeholder
  settings.tsx         Preferences — persisted to AsyncStorage
  support.tsx          FAQ accordion + contact links
  (auth)/
    login.tsx          OTP email + Google/Apple OAuth
  (onboarding)/
    index.tsx          Display name capture — runs once after first login
  (tabs)/
    _layout.tsx        Tab bar config
    index.tsx          Home — stats, recent items, activity feed
    explore.tsx        Search + filter all items
    activity.tsx       Notifications with read/unread state
    profile.tsx        Profile, subscription badge, sign out
  detail/
    [id].tsx           Item detail — tasks, metrics, status

contexts/
  SubscriptionContext.tsx   isPremium + purchase/restore/refresh
  ToastContext.tsx          useToast() — show toasts from anywhere

hooks/
  useItems.ts          Items list + single item + item tasks
  useNotifications.ts  User notifications
  useProfile.ts        Authenticated user profile
  useActivityFeed.ts   Activity feed (optional item filter)

lib/
  constants.ts         🏷️ APP_NAME, APP_SCHEME, support contacts — rebrand here
  theme.ts             🎨 All 59 color tokens — change ACCENT to rebrand
  typography.ts        Font weight → Inter family name mapping
  featureFlags.ts      useFeatureFlag() backed by PostHog
  queryClient.ts       TanStack Query client with retry + stale config
  supabase.ts          Supabase client (reads from env vars)
  purchases.ts         RevenueCat helpers
  analytics.ts         PostHog wrapper with typed event names
  mockData.ts          Placeholder data — used as placeholderData in hooks
  utils.ts             getInitials, formatDate, adjustBrightness, clamp, etc.
  i18n.ts              i18next init + language switching

components/
  ui/
    Text.tsx           RN Text with Inter auto-applied + Android fontWeight fix
    Button.tsx         primary / secondary / outline / ghost / destructive
    Card.tsx           Generic surface card
    AppModal.tsx       AlertModal (bottom sheet) + ActionSheet
    StatusBadge.tsx    Status pill — active / pending / archived
    SettingsRow.tsx    Icon + label row for settings/profile lists
    TextInputField.tsx Styled text input with optional label + error
  TabBar.tsx           Custom animated bottom tab bar
  OfflineBanner.tsx    Slides down mid-session on disconnect
  OfflineOverlay.tsx   Full-screen block when app launches offline

supabase/
  migrations/
    *_init.sql               profiles table + RLS + auto-create trigger
    *_app_domain.sql         items, tasks, notifications, activity_feed + RLS
  functions/
    revenuecat-webhook/      Syncs plan_type on subscription events

__tests__/
  utils.test.ts        14 utility function tests

.github/
  workflows/
    ci.yml             typecheck + test on every push and PR
```

---

## How auth routing works

```
isAuthed = false
  → landing page + login

isAuthed = true, onboarding not done
  → onboarding screen

isAuthed = true, onboarding done
  → tabs + all authenticated screens
```

Handled by `Stack.Protected` in `_layout.tsx` — no manual navigation needed. Auth state comes from Supabase session; onboarding state from `user.user_metadata.onboarding_completed`.

---

## How data fetching works

Every screen uses a TanStack Query hook. The hooks return `placeholderData` from `lib/mockData.ts` while the real Supabase query loads — so screens never flash empty.

```ts
// hooks/useItems.ts pattern:
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => supabase.from('items').select('*'),
    placeholderData: mockItems,   // instant content while loading
  })
}
```

Pull-to-refresh invalidates the relevant query keys:
```ts
await queryClient.invalidateQueries({ queryKey: ['items'] })
```

---

## How to add features

### Add a new tab

1. Create `app/(tabs)/newscreen.tsx`
2. Add to `app/(tabs)/_layout.tsx`:

```tsx
<Tabs.Screen name="newscreen" options={{ tabBarLabel: 'Label', tabBarIcon: ... }} />
```

### Add a new authenticated screen

1. Create `app/myscreen.tsx`
2. Register in the authenticated `Stack.Protected` block in `app/_layout.tsx`
3. Navigate: `router.push('/myscreen')`

### Gate content behind subscription

```tsx
const { isPremium } = useSubscription()

if (!isPremium) return router.replace('/upgrade')
```

### Add a Supabase data hook

```ts
export function useMyData() {
  return useQuery({
    queryKey: ['my_data'],
    queryFn: async () => {
      const { data } = await supabase.from('my_table').select('*')
      return data ?? []
    },
    placeholderData: [],
  })
}
```

### Add a typed analytics event

Open `lib/analytics.ts`, add to `EventName`:
```ts
| 'your_event_name'
```

Then call it:
```ts
track('your_event_name', { property: 'value' })
```

### Show a toast

```tsx
const { showToast } = useToast()
showToast('Saved successfully', 'success')
showToast('Something went wrong', 'error')
```

### Use a feature flag

```tsx
import { useFeatureFlag } from '@/lib/featureFlags'

const showNewUI = useFeatureFlag('new_ui', false)
```

---

## RevenueCat setup

1. Create products in App Store Connect + Google Play Console
2. Go to [app.revenuecat.com](https://app.revenuecat.com) → create project
3. Create an entitlement called `premium`, attach your products
4. Create a `default` offering with monthly + yearly packages
5. Get your API keys → add to `eas.json` and `.env.local`:
```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxx
```

If your entitlement name differs from `premium`, update `lib/purchases.ts`:
```ts
export const ENTITLEMENT_ID = 'your_entitlement_name'
```

---

## Deploying Supabase to production

```bash
# Link to your remote project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

Add production credentials to `eas.json`:
```json
"EXPO_PUBLIC_SUPABASE_URL": "https://xxxx.supabase.co",
"EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_xxx"
```

Enable email auth: Supabase dashboard → Authentication → Providers → Email.

---

## Building for the stores

```bash
# First time only
eas login
eas build:configure

# Test build (Android APK)
eas build --platform android --profile preview

# Production
eas build --platform all --profile production

# Submit
eas submit --platform android
eas submit --platform ios
```

---

## Checklist before shipping

### Identity
- [ ] `app.json` — `name`, `slug`, `scheme`, `bundleIdentifier`, `package`, `projectId`, `owner`
- [ ] `lib/constants.ts` — `APP_NAME`, `APP_TAGLINE`, `APP_SCHEME`, `APP_SUPPORT_EMAIL`, `APP_DOCS_URL`
- [ ] `assets/icon.png` replaced (1024×1024)
- [ ] `assets/splash-icon.png` replaced
- [ ] `assets/adaptive-icon.png` replaced (Android)

### Branding
- [ ] `lib/theme.ts` — `ACCENT` + derived opacity values
- [ ] `tailwind.config.js` — `accent` matches `ACCENT`
- [ ] `app/upgrade.tsx` — `PRO_FEATURES` list updated

### Legal
- [ ] Real privacy policy in `app/privacy.tsx`
- [ ] Real terms of service in `app/terms.tsx`

### Backend
- [ ] Supabase production project created + `supabase db push` run
- [ ] Production Supabase URL + key in `eas.json` production env
- [ ] Email auth enabled in Supabase dashboard

### Subscriptions
- [ ] Products created in App Store Connect + Google Play Console
- [ ] RevenueCat project set up, `premium` entitlement + default offering created
- [ ] RevenueCat API keys in `eas.json`
- [ ] Tested purchase + restore on a real device

### Observability
- [ ] Sentry DSN in `eas.json` (+ `app.json` plugin `project` + `organization`)
- [ ] PostHog API key in `eas.json`

### Sentry config
- [ ] `app.json` Sentry plugin — `project` + `organization` set to your Sentry values

### Final
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm test` — all tests passing
- [ ] Full flow tested: landing → login → onboarding → home → profile → upgrade → sign out

---

## Common issues

**`supabase start` fails**
Make sure Docker Desktop is running. Try `supabase stop` then `supabase start`.

**RevenueCat not working in Expo Go**
Expected — RevenueCat requires native. Use `npx expo run:android` / `npx expo run:ios`.

**App shows blank screen on launch**
Check `.env.local` has a valid `EXPO_PUBLIC_SUPABASE_URL` and key, and `supabase start` is running.

**TypeScript errors after changes**
```bash
npm run typecheck
```
