# Football Agent Studio Operating System

Inspired by the lightweight workflow ideas in `Donchitos/Claude-Code-Game-Studios` (MIT), adapted for this Expo Football Agent project. Do not copy the full `.claude` system into this repo; this file is the compact Codex-friendly version.

## Studio Roles

Use these roles as review lenses, not separate tools:

| Role | Owns | Must protect |
| --- | --- | --- |
| Product Director | Roadmap, scope, release priority | The game stays playable and focused. |
| Game Designer | Agent loop, reputation, scouting, transfers | Every decision has a visible consequence. |
| Economy Designer | Money, commission, reputation rewards | Early game cannot inflate or feel pay-to-win. |
| UX/UI Lead | Mobile layout, readability, visual hierarchy | No crowded screens, overlap, or tiny tap targets. |
| Art Director | Pixel portraits, crests, story/card art | Fictional assets only, readable in small cards. |
| QA Lead | Smoke tests, regressions, playtest notes | Main loop works from new career to week report. |
| Security/Privacy Lead | Secrets, data packs, cloud save, analytics | No real secrets, no unsafe mod input, no silent cloud overwrite. |
| Release Manager | Build, live URL, checklist, patch notes | Release candidate has evidence. |

## Quality Gates

Run `npm run studio:check` before commits that affect gameplay, UI, save/data, backend, or release docs.

### Gate 1: Product Fit

- The change supports the football agent fantasy.
- It does not turn the game into club management first.
- It reduces confusion or adds meaningful decision depth.

### Gate 2: Mobile UX

- Important screens fit a phone width.
- Buttons are understandable and large enough.
- Cards do not hide artwork or overflow text.
- The next action is obvious on the home screen.

### Gate 3: Gameplay

- Starting career has zero players until the first client choice.
- Weekly flow is: choose/handle action -> advance week -> match/report -> next decision.
- Cards are resolved by accept/reject; no useless defer loop.
- Reputation changes access, offers, capacity, or trust.

### Gate 4: Economy

- Early agency cannot sign too many players.
- Commission and money growth scale with reputation and progress.
- Ads/purchases never decide transfer success.
- One weekly card by default keeps pressure readable.

### Gate 5: Content And Legal

- No real player likeness, official logos, official kits, or trademarked club branding in bundled assets.
- Fan packs stay separate and validated.
- Unknown/copyright-restricted datasets are blocked.

### Gate 6: Security And Cloud

- `.env.example` has placeholders only.
- Cloud save must require conflict choice.
- Purchase entitlements are server-owned when backend exists.
- AI narrator uses backend proxy and deterministic fallback.

### Gate 7: Release Evidence

- `npx tsc --noEmit`
- `npm run test:all`
- `npm run build:web:pages`
- Browser smoke on home, first client, players, scout, match day.
- Live URL responds after push.

## Recommended Iteration Rhythm

1. Pick one player-facing problem.
2. Make the smallest cohesive code change.
3. Run `npm run studio:check`.
4. Play the affected flow.
5. Commit with a concrete message.
6. Push and verify the GitHub Pages URL.

## Current Focus Areas

- Reduce screen clutter across Players, Scout, Empire, Match Report.
- Improve event card presentation and art fit.
- Make match day readable without scrolling.
- Add clearer season/year-end summary.
- Keep Google/cloud/backend work behind service interfaces.

