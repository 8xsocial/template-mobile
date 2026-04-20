module.exports = {
    preset: 'jest-expo',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|posthog-react-native)',
    ],
    testPathPattern: '__tests__',
}
