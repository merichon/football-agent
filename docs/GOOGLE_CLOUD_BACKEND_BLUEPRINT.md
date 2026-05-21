# Google Cloud Backend Blueprint

This project can use `google/skills` for backend, cloud save, analytics, security, AI proxy, and cost control. It is not a UI dependency and should not be used to make the app heavier.

## Skill Mapping

| Google skill | Football Agent layer | Use |
| --- | --- | --- |
| Firebase Basics | Account and cloud sync | Guest-first auth, optional Google Sign-In, Remote Config defaults, analytics wrapper. |
| Cloud Run Basics | Backend entitlements | Purchase validation, cloud save API, AI narrator proxy, entitlement server. |
| Authenticating to Google Cloud | Secret management | Service accounts, local ADC, CI auth, backend-only API keys. |
| Well-Architected Security | API security | Auth, authorization, IAM, request validation, rate limits. |
| Well-Architected Reliability | Cloud save reliability | Offline fallback, idempotent writes, backup before overwrite. |
| Well-Architected Cost Optimization | Business ops | Budget alerts, min instances at zero, BigQuery partitioning, AI caps. |
| BigQuery Basics | Analytics growth | Retention, first client, first negotiation, match day, purchase/ad funnel. |
| Gemini API on Agent Platform | AI narrator | Optional scout reports, inbox text, journalist questions, season recaps. |

## Architecture

The client stays local-first. The game engine decides outcomes deterministically. Google services sit around it:

- Firebase Auth identifies signed-in players, but guest play remains available.
- Cloud Run validates purchases and owns entitlements.
- Cloud Run stores/syncs save envelopes and returns conflicts instead of overwriting.
- Firebase Remote Config can tune safe experience values only.
- BigQuery receives privacy-safe, low-cardinality analytics events.
- Gemini/OpenAI calls happen through a backend proxy only.

## Cloud Run Endpoints

- `POST /v1/auth/session`
- `GET /v1/entitlements`
- `POST /v1/purchases/validate`
- `GET /v1/saves/current`
- `PUT /v1/saves/current`
- `GET /v1/liveops/config`
- `POST /v1/ai/narrate`
- `POST /v1/privacy/delete-account`

## Privacy-Safe Analytics

Allowed event examples:

- `career_started`
- `first_client_selected`
- `first_week_plan_selected`
- `match_day_completed`
- `negotiation_started`
- `first_transfer`
- `rewarded_ad_completed`
- `purchase_completed`
- `cloud_save_conflict`
- `data_pack_imported`

Never send raw user text, email, receipts, full save files, or real personal data.

## Secrets

Do not put privileged Google secrets in the Expo app or web bundle. `.env.example` can contain placeholders only. Real values belong in backend runtime secrets or CI secrets.

Required backend-only values later:

- Firebase service account
- Store purchase validation credentials
- Gemini/OpenAI API keys
- Cloud Run service identity

## Release Order

1. Keep local save and guest play stable.
2. Add Cloud Run API with fake/local provider tests.
3. Add Firebase Auth behind optional sign-in.
4. Add cloud save conflict UI.
5. Add server-side entitlement validation.
6. Add Remote Config with local fallback.
7. Add BigQuery export after consent policy is final.
8. Add Gemini/OpenAI proxy with deterministic fallback text.

