# Asset Licenses

This file tracks every shippable external, generated, or commissioned art/audio asset. Unknown license means the asset must not ship.

## Policy

- Do not ship official club logos, league logos, real player photos, real kits, real sponsors, club songs, fan chants, TV broadcast audio, or copyrighted music without explicit rights.
- Prefer internal/original assets, generated assets with project ownership, CC0, public-domain, or clearly commercial-safe CC-BY assets with attribution.
- Record the license page or source terms at the time the asset is added.
- If attribution is required, add it to the credits/store/legal surface before release.
- Treat fan data pack media as untrusted until validated.

## License Register

| Asset ID | File Path | Type | Source URL | Creator | License | Commercial Use | Attribution Required | Modified | Ship Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| template-example | assets/art/ui/example.png | art | internal placeholder | Football Agent team | internal | yes | no | no | do-not-ship | Replace this row with real assets. |

## Status Values

- `approved`: complete metadata, commercial use allowed, ready to ship.
- `needs-attribution`: commercial use allowed but credits/legal work remains.
- `review`: incomplete verification, do not ship yet.
- `blocked`: license/IP risk, must not ship.
- `do-not-ship`: placeholder, prototype, or internal draft only.

## Existing Asset Audit Backlog

The current repository already contains prototype art under `assets/art`, `assets/backgrounds`, `assets/clubs`, and `assets/players`. Before a store or public monetized release, audit each existing file into the table above or remove it from the shippable bundle.
