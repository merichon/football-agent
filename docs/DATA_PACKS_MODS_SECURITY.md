# Data Packs, Mods, Security, and Privacy

## Fan Data Pack Contract

Zip layout:

- `manifest.json`
- `database.json`
- Optional image assets in a declared folder, if a future importer supports them.

Required database arrays:

- `countries[]`
- `leagues[]`
- `clubs[]`
- `players[]`

License handling:

- Allow only redistributable sources such as CC0, CC-BY, ODbL, PDDL, ODC-BY, and DbCL.
- Block `unknown`, `other`, and `copyright-authors`.
- Keep source attribution in metadata.
- Do not bundle real club logos, official kits, player photos, or trademarked badges in the core repo.

Mod safety:

- Mods are data only.
- Mods must not execute JavaScript or load remote code.
- Every imported pack should pass schema validation before it can replace the active database.
- Treat markdown/HTML/user text as unsafe unless rendered as plain text.
- Imported zip paths are rejected if they contain traversal patterns, absolute paths, or Windows drive paths.
- `manifest.json` and `database.json` are size-limited before parsing.
- Packs that declare official logos, real player photos, official kits, or trademarked badges are rejected.
- Duplicate IDs and broken league/club references are rejected or warned before activation.

## Security Boundaries

- Offline single-player saves can be editable by the player, but paid ownership, cloud saves, receipts, and shared services must not trust client flags alone.
- Future backend endpoints need authentication, ownership checks, request validation, rate limits, and safe error messages.
- Purchase validation should happen server-side for synced or entitlement-bearing products.
- Cloud conflict resolution must ask the user; never silently overwrite a newer local career.

## Secrets

- No OpenAI keys, AdMob secrets, service accounts, store credentials, or private tokens in the frontend bundle.
- `.env.example` contains placeholders only.
- Real `.env`, service account JSON, signing keys, and platform credential files are ignored by `.gitignore`.

## Privacy and Store Review

- Guest/local save should remain the first path.
- If Google Sign-In is added on iOS, Sign in with Apple is likely required.
- Account deletion, restore purchases, privacy policy, app privacy labels, ATT/consent, and ad/analytics disclosures must be prepared before store release.
- Store copy must not imply official football league, club, or player partnerships.
