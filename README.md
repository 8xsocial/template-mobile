# 8x React Native Template

Production-ready React Native Expo template for building any kind of app — SaaS, tools, marketplaces, etc. — with authentication, subscriptions, and observability wired in from day one.

## Stack

| Layer | Tech |
|---|---|
| Framework | Expo SDK 55 (React Native 0.83, React 19) |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind for RN) |
| Auth + DB | Supabase (OTP email, PostgreSQL, RLS) |
| Subscriptions | RevenueCat (iOS + Android IAP) |
| Error tracking | Sentry |
| Analytics | PostHog |
| i18n | i18next |
| Animations | React Native Reanimated |
| Icons | Lucide + @expo/vector-icons |

---

## Quick Start

### 1. Clone & install

```bash
git clone <this-repo> my-new-app
cd my-new-app
bun install          # or npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values (see below for how to get each one).

### 3. Start local Supabase

```bash
# Requires: supabase CLI (brew install supabase/tap/supabase)
supabase start
# ✓ Started — copy the API URL and anon key into .env.local
supabase db reset    # applies migrations
```

### 4. Start the dev server

```bash
npx expo start
# Press 'a' for Android, 'i' for iOS
```

---

## Branding (start here)

### 1. App name & bundle ID

Edit `app.json`:
```json
{
  "expo": {
    "name": "YourAppName",
    "slug": "your-app-name",
    "scheme": "yourapp",
    "ios": { "bundleIdentifier": "com.yourcompany.yourapp" },
    "android": { "package": "com.yourcompany.yourapp" }
  }
}
```

### 2. Accent color (one change = full rebrand)

`lib/theme.ts` — change `ACCENT`:
```ts
export const ACCENT = '#your-hex-color'
```

`tailwind.config.js` — change `accent` to the same value:
```js
colors: {
  accent: '#your-hex-color',
}
```

### 3. App icon & splash

Replace:
- `assets/icon.png` — 1024×1024 PNG (iOS + Android)
- `assets/splash-icon.png` — centered logo for splash screen

### 4. Custom fonts (optional)

1. Add `.ttf` files to `assets/fonts/`
2. Load them in `app/_layout.tsx` with `useFonts()`
3. Set names in `lib/typography.ts`:
```ts
export const Fonts = {
  regular:  'YourFont-Regular',
  medium:   'YourFont-Medium',
  bold:     'YourFont-Bold',
  // ...
}
```

---

## Adding Screens & Tabs

### New tab

1. Create `app/(tabs)/explore.tsx`
2. Add to `app/(tabs)/_layout.tsx`:
```tsx
<Tabs.Screen
  name="explore"
  options={{
    tabBarLabel: 'Explore',
    tabBarIcon: ({ color, size }) => <Compass size={size} color={color} strokeWidth={1.6} />,
  }}
/>
```

### New authenticated screen (full screen, not tab)

1. Create `app/detail.tsx` (or `app/detail/[id].tsx`)
2. Add to the authenticated `Stack.Protected` block in `app/_layout.tsx`:
```tsx
<Stack.Protected guard={!!isAuthed && onboardingCompleted === true}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="detail" />   {/* ← add this */}
</Stack.Protected>
```

### New public screen (no auth required)

Add to the bottom of the Stack in `app/_layout.tsx`:
```tsx
<Stack.Screen name="your-public-page" />
```

---

## RevenueCat Setup

1. Create a RevenueCat project at [app.revenuecat.com](https://app.revenuecat.com)
2. Add your iOS app (App Store Connect bundle ID) + Android app (Play Console package)
3. Create Products in App Store Connect + Google Play Console
4. Add them to RevenueCat → Products
5. Create an Entitlement: `premium` (or change `ENTITLEMENT_ID` in `lib/purchases.ts`)
6. Create an Offering with your packages
7. Add API keys to `eas.json` (or `.env.local` for local dev)

The `SubscriptionContext` handles the rest — check `useSubscription().isPremium` anywhere.

---

## Supabase — Local → Production

Local dev uses `supabase start` (Docker). Going to production is just an env var swap:

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations: `supabase db push`
3. Update `eas.json` production env vars with your production URL + anon key
4. No code changes needed

### Adding a new table

1. Create `supabase/migrations/<timestamp>_your_feature.sql`
2. Run locally: `supabase db reset`
3. Push to production: `supabase db push`

Pattern for every table:
```sql
create table public.your_table (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  -- your columns
  created_at timestamptz default now()
);

alter table public.your_table enable row level security;

create policy "Users can read own rows" on public.your_table
  for select using (auth.uid() = user_id);

create policy "Users can insert own rows" on public.your_table
  for insert with check (auth.uid() = user_id);
```

---

## Adding Languages

1. Copy `locales/en.json` → `locales/es.json` (translate values)
2. In `lib/i18n.ts`:
```ts
import es from '../locales/es.json'

export const SUPPORTED_LOCALES = ['en', 'es'] as const

// In init:
resources: {
  en: { translation: en },
  es: { translation: es },
}
```

---

## EAS Build (App Store / Play Store)

### Prerequisites
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Update app.json
Set your real EAS project ID (from `eas build:configure`) and Expo owner.

### Build

```bash
# Internal APK (Android, for testers)
eas build --platform android --profile preview

# Production AAB (Android, for Play Store)
eas build --platform android --profile production

# Production IPA (iOS, for App Store)
eas build --platform ios --profile production
```

---

## Project Structure

```
app/
  _layout.tsx          Root layout — all providers + auth guards
  index.tsx            Public landing page
  upgrade.tsx          Subscription paywall (always public)
  privacy.tsx          Privacy policy
  terms.tsx            Terms of service
  (auth)/
    login.tsx          OTP login + placeholder social buttons
  (onboarding)/
    index.tsx          Display name step (add more steps as needed)
  (tabs)/
    _layout.tsx        Bottom tab navigator
    index.tsx          Home tab  ← replace with your content
    profile.tsx        Profile + sub status + settings + logout

contexts/
  SubscriptionContext.tsx   RevenueCat state (isPremium, purchase, restore)

lib/
  theme.ts             🎨 Brand colors — change ACCENT to rebrand
  supabase.ts          Supabase client
  purchases.ts         RevenueCat helpers
  analytics.ts         PostHog wrapper
  i18n.ts              i18next setup
  typography.ts        Font size scale + custom font mapping
  utils.ts             Shared helpers (getInitials, formatDate, etc.)
  useNetworkStatus.ts  Network status hook

components/
  ui/
    Text.tsx           Font-aware Text (fixes Android fontWeight)
    Button.tsx         Multi-variant button (primary, secondary, outline, ghost)
    Card.tsx           Generic surface card
    AppModal.tsx       AlertModal + ActionSheet
  TabBar.tsx           Animated custom bottom tab bar
  OfflineBanner.tsx    Slides in when offline mid-session
  OfflineOverlay.tsx   Full-screen overlay on launch-offline

supabase/
  config.toml          Local dev config
  migrations/
    20260101000000_init.sql   profiles table + RLS + trigger

locales/
  en.json              English strings (add es.json, pt.json, etc.)
```

---

## Checklist Before Launch

- [ ] Replace `REPLACE_WITH_*` values in `app.json` and `eas.json`
- [ ] Add real app icon and splash image to `assets/`
- [ ] Set `ACCENT` in `lib/theme.ts` and `tailwind.config.js`
- [ ] Update `PRO_FEATURES` in `app/upgrade.tsx`
- [ ] Replace placeholder privacy policy in `app/privacy.tsx`
- [ ] Replace placeholder terms in `app/terms.tsx`
- [ ] Wire up RevenueCat (products + entitlement + API keys)
- [ ] Configure Sentry DSN and PostHog key
- [ ] Run `supabase db push` to deploy schema to production
- [ ] Build with EAS and test on a real device
- [ ] Check subscription purchase + restore flow on a real device
