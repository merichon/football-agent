# Expo SDK 55 Upgrade

## Summary

Football Agent was upgraded from Expo SDK 51 to Expo SDK 55.

Core runtime versions after the upgrade:

- Expo: `~55.0.25`
- React: `^19.2.0`
- React DOM: `^19.2.0`
- React Native: `0.83.6`
- React Native Web: `^0.21.2`
- React Native Reanimated: `4.2.1`
- React Native Worklets: `0.7.4`
- TypeScript: `~5.9.2`

## Why

The previous SDK 51 dependency chain produced high and moderate npm audit findings through Expo and React Native transitive packages. SDK 55 resolves the current npm audit report in this project.

## Notes

- Expo SDK 55 uses React Native 0.83 and React 19.2.
- SDK 55 requires the React Native New Architecture; there is no legacy architecture fallback.
- `npx expo install --check` reports dependencies are aligned.
- `npm audit --audit-level=moderate` reports zero vulnerabilities after the upgrade.

## Verification

Completed successfully:

```bash
npm run test:all
npx tsc --noEmit
npm run build:web:pages
npm run release:check
npm audit --audit-level=moderate
```

Expo Doctor note:

- `npx expo-doctor` passes 17/18 checks in this local environment.
- The remaining warning says `.expo/` is not ignored, but `.gitignore` contains `.expo`, `.expo/`, and `.expo/*`.
- This machine currently does not expose a working `git` command to the shell, so the ignore check may be a local false positive. Re-run Doctor in the real Git environment before store release.

## Remaining QA

- Run iOS and Android simulator/dev build smoke tests.
- Tap through onboarding, data pack import, match day, cards, negotiation, and save/load on a real mobile viewport.
- Watch for third-party New Architecture issues from animation/UI libraries.
