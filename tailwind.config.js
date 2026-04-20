/** @type {import('tailwindcss').Config} */

// 🎨 BRAND: Change 'accent' to your brand color.
// All NativeWind classes using bg-accent, text-accent, border-accent update automatically.
// Also update Theme.accent in lib/theme.ts to match.

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0d0d0d',
        accent: '#0ea5a4',      // 🎨 BRAND: your primary accent color
        surface: '#1a1a1a',
        surface2: '#242424',
        muted: '#6b7280',
      },
    },
  },
  plugins: [],
}
