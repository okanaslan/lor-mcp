# Expo Release Commands

Run commands from the Expo app directory unless the project documents another location.

## Local Validation

```bash
npm run api:check
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo-doctor
npx expo install --check
```

Only run commands that exist in `package.json`; skip or adapt missing scripts.

## Dependency Alignment

```bash
npx expo install --fix
npx expo-doctor
```

Use this when Expo Doctor reports SDK package patch mismatches.

## EAS Build

```bash
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
```

For both platforms:

```bash
npx eas build --platform all --profile production
```

## Local iOS Archive Alternative

Use only when native iOS project ownership and signing are configured locally. For Expo managed apps, prefer EAS Build unless the user intentionally uses `expo prebuild` and Xcode.

## EAS Submit

```bash
npx eas submit --platform ios --profile production
npx eas submit --platform android --profile production
```

If submitting a local artifact:

```bash
npx eas submit --platform ios --profile production --path ./build/app.ipa
npx eas submit --platform android --profile production --path ./build/app.aab
```

## EAS Update

```bash
npx eas update --channel production --message "<release message>"
```

Use only for JS/assets changes compatible with the installed native runtime version.

## Post-Build Checks

- Install or TestFlight the iOS build on a real device.
- Verify production API, auth/guest flow, subscriptions, restore purchases, push permission denial, deep links if present, dark/light mode, and localization.
- Confirm store dashboards show expected build number/version and processing state.
