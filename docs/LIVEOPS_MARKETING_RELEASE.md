# LiveOps, Marketing, and Release Checklist

## LiveOps

Use remote config only for experience tuning:

- Fictional seasonal events.
- Feature flags.
- Ad placement enablement.
- Copy/config for limited scenarios.
- Kill switches for optional online systems.

Do not use remote config as a security boundary. Offline fallback must keep the game playable.

## Store Positioning

Short description:

> Start as an unknown football agent, discover lower-league prospects, negotiate contracts, manage reputation, and grow a global agency.

Feature list:

- Scout hidden prospects.
- Sign players to your agency.
- Negotiate transfer and sponsor deals.
- Manage reputation, media pressure, and club relationships.
- Survive weekly story cards and season reports.
- Import license-safe fan data packs.

Screenshot captions:

- "Start with no players and earn your first client."
- "Negotiate salary, commission, bonuses, and club trust."
- "Follow match day through your represented players."
- "Build reputation without burning relationships."
- "Use fan data packs while keeping core content fictional."

Trailer beats:

1. Small office, no portfolio.
2. First scout report.
3. First player signs.
4. A tense transfer negotiation.
5. Match day event and goal.
6. Season report and agency growth.

Trust rules:

- No fake gameplay.
- No fake ratings.
- No official license claims without a license.
- Do not oversell AI as deciding the whole world if logic is deterministic.

## Release Checklist

- `npm run test:engine`
- `npx tsc --noEmit`
- `npm run build:web:pages`
- Save/load smoke test with a legacy save and a new envelope save.
- Data pack import test: valid pack, missing manifest, invalid JSON, blocked license.
- Mobile UI smoke test: dashboard, setup, match, modal, settings.
- Secret scan: `.env`, service account JSON, signing keys, receipts.
- Dependency audit and license review.
- Privacy policy, account deletion, restore purchases, app privacy labels.
- Monetization review: no pay-to-win, no forced ad near decisions.
- Release notes with honest changes and known limitations.
