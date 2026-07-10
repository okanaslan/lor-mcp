# EAS Operator Runbook

Run commands from the Expo app directory unless repo docs say otherwise.

## Command Selection

### Build

```bash
npx eas build --platform ios --profile production
npx eas build --platform android --profile production
npx eas build --platform all --profile production
```

Use preview/development profiles only when explicitly requested:

```bash
npx eas build --platform ios --profile preview
npx eas build --platform android --profile development
```

### Submit Latest/Selected Build

```bash
npx eas submit --platform ios --profile production
npx eas submit --platform android --profile production
```

If the CLI prompts for a build, let the user choose unless they gave a build ID or artifact.

### Submit Local Artifact

Verify the path exists first.

```bash
npx eas submit --platform ios --profile production --path ./build/app.ipa
npx eas submit --platform android --profile production --path ./build/app.aab
```

### Status And History

Use EAS CLI status/history commands appropriate to the user's request. If exact command flags are uncertain, fetch current Expo/EAS docs before running.

Common patterns:

```bash
npx eas build:list --platform ios
npx eas build:list --platform android
npx eas build:view <build-id>
```

## Preflight Steps

1. Identify app directory and package manager.
2. Read `eas.json` and confirm the requested profile exists.
3. Read app config and confirm bundle/package IDs are present.
4. Check selected profile env for required public config.
5. For production iOS, verify the profile is not simulator-only.
6. For production Android, verify `android.buildType` is `app-bundle` for Play release.
7. For submit, confirm submit profile exists or explain the minimal config needed.
8. For artifact submit, verify file extension and path.

## Approval Boundary

EAS commands require network and may use credentials. Request approval/escalation before running when the environment requires it. State platform, profile, command, and expected side effect.

## Handoff Summary

After command completion, report:

- Command run.
- Build/submit ID or URL when available.
- Final status.
- Artifact URL/path or processing location when available.
- Next manual action in App Store Connect or Play Console.
- Any warnings that remain.
