# Football Agent Art Direction

Football Agent is a text-first football agent simulation. Art should make the world feel richer without making contracts, scout reports, cards, negotiation text, or match reports harder to read.

## Visual Pillars

- Premium agency mood: dark office, green pitch, black UI, gold confidence, restrained blue data accents.
- Football without licenses: fictional clubs, fictional players, fictional sponsors, fictional competitions.
- Mobile-first readability: faces, badges, icons, and backgrounds must remain clear at small sizes.
- Dashboard clarity: art supports tables, cards, decision modals, and story beats instead of becoming decoration noise.

## UI Art Direction

- Use subtle border glow, soft panels, controlled highlights, and compact game HUD spacing.
- Avoid overusing bright green blocks. Green should feel like pitch/context, not every button.
- Keep cards readable: one strong image zone, one clear decision/title zone, one consequence zone.
- Use motion sparingly: reveal, press feedback, and modal entrance are enough for most screens.

## Fictional Badges And Generic Logos

Badges should be simple, fictional, and easy to identify in small UI lists.

Allowed motifs:

- Shield shapes, initials, diagonal bands, stars, waves, towers, bridges, abstract birds, abstract lions, crowns, anchors, or geometric city marks.
- Fictional color pairings that do not imitate a famous club too closely.
- Generic sponsor marks with invented names only.

Blocked motifs:

- Official club, league, federation, sponsor, or kit marks.
- Badge layouts that clearly mimic famous clubs.
- Real player photos, real manager photos, or celebrity likenesses.

## Background Language

- Home/dashboard: dark green pitch grid with low contrast and enough quiet space for text.
- Story: office lobby, negotiation room, training ground, night stadium, airport lounge, media corridor.
- Match day: simplified stadium/pitch atmosphere, not TV broadcast imitation.
- Finance/agency: clean office desk, contract paper, phone glow, subtle city lights.

## Portrait And Card Art

- Player portraits need visible eyes, hair, skin tone, kit color, and attitude.
- Keep portraits centered with padding so they do not crop badly in circular or square masks.
- Event card art should show the situation quickly: media pressure, family request, secret meeting, injury concern, sponsor opportunity, or contract tension.

## Typography And Color Atmosphere

- Headings may be bold and game-like.
- Body copy must stay plain, high contrast, and readable.
- Preferred palette direction: near-black, deep green, warm gold, cool blue, off-white, muted red for risk.
- Avoid one-note palettes and noisy gradients behind text.

## Production Notes

- New art should go under `assets/art/ui`, `assets/art/badges`, `assets/art/backgrounds`, or `assets/art/icons`.
- Existing legacy folders can be migrated later, but new work should follow the pipeline structure.
- Every external or generated asset must be logged in `docs/ASSET_LICENSES.md` before shipping.
