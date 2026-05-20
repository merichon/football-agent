# Monetization, Ads, and Analytics Plan

## Monetization

Safe products for Football Agent:

- Remove ads.
- Supporter pack with cosmetic UI themes and profile badges.
- Fictional career scenario packs.
- Extra local career slots.
- Optional cosmetic portrait/frame packs.

Avoid:

- Pay-to-win negotiation boosts.
- Paid random packs that look like gambling.
- Aggressive timers or forced ads near story/contract decisions.
- Client-only purchase ownership for anything shared, synced, or paid.

All product checks should flow through `getEntitlementSnapshot()` and future server/store validation, not scattered UI flags.

## Ads

Allowed natural breaks:

- After match day report.
- After a week is fully completed.
- Returning from a long menu session.
- Optional rewarded ad for an extra scout report refresh.

Rules:

- Never place ads beside story choices, contract choices, or negotiation accept buttons.
- Respect remove-ads entitlement.
- Use frequency caps. Current placeholder blocks repeated non-rewarded placement within 12 minutes.
- Rewarded ad rewards should be capped and validated when backend support exists.

## Analytics

Privacy-safe events currently allowed:

- `app_boot`
- `career_started`
- `tutorial_completed`
- `week_prepared`
- `match_day_completed`
- `card_resolved`
- `first_negotiation`
- `first_transfer`
- `data_pack_imported`
- `data_pack_failed`
- `settings_changed`

Do not log:

- Raw player/user text.
- Email, device identifiers, or account tokens.
- Full save files.
- Imported fan pack raw content.
- Secret keys or store receipts.

Analytics should be opt-in/config-aware in production. Development logs may be visible locally only.
