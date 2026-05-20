# Football Agent Professionalization Notes

## Repo Scan

- Framework: Expo React Native with React Native Web.
- UI: mostly `App.tsx`, custom StyleSheet, Moti animations, local artwork under `assets/art/`.
- State and routing: local React state, `screen` string routing, no external router.
- Game logic: deterministic rules in `src/game/engine.js`; match flavor in `src/game/match2d.js`; AI-like scoring in `src/game/aiModels.js`.
- Save: AsyncStorage key `agent-kariyeri-save-v3`; now wrapped by `src/game/saveSystem.js` with schema version `4`.
- Data pack: `manifest.json` + `database.json` zip import; license filtering exists in `src/game/licensePolicy.js`.
- Backend/auth/cloud: no backend or auth implementation yet.
- Build/test commands: `npm run test:engine`, `npx tsc --noEmit`, `npm run build:web:pages`.

## Integration Direction

The game should stay text-first and deterministic. AI, ads, payments, analytics, and cloud sync must sit around the game, not inside the outcome engine.

- Core gameplay remains in `engine.js`.
- Save metadata, settings, entitlements, content pack references, and privacy flags are separated from the career payload.
- Monetization and platform systems go through `src/game/platformServices.js` so future SDK work has one boundary.
- Fan/mod data stays untrusted until schema and license validation pass.
- Real club logos, real player likenesses, official kits, and unofficial license claims stay out of the core repo.

## Current Safe Architecture

- `saveSystem.js`: versioned save envelope, legacy career JSON reader, content pack references, basic payload validation.
- `platformServices.js`: no-op analytics, product catalog, ad placement caps, entitlement snapshot, liveops defaults, cloud sync interface.
- `.env.example`: placeholders only; real keys must live outside the frontend bundle.

## Implementation Priorities

1. Keep onboarding clear: start with no player, pick a market, sign the first low-commission prospect.
2. Make each weekly action explain risk and reward.
3. Use one forced card per week to avoid economy spam.
4. Keep match day compact on mobile and focus live events on represented players.
5. Add real SDKs only behind the service interfaces, never directly inside screens.
