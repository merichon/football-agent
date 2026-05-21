# Football Agent Audio Direction

Football Agent audio should make decisions feel responsive and the football world feel alive without tiring the player. Most screens are reading screens, so audio must stay calm.

## Music

- Use short, low-intensity loops for menu/dashboard screens.
- Avoid lyrics, famous melodies, real club chants, TV themes, or anything that feels like a broadcast sample.
- Reading-heavy screens should have either very quiet music or no music.
- Match day may use a slightly more energetic loop, but it should still allow event text to stay mentally foregrounded.

## UI Sound Effects

SFX should be short, soft, and varied enough that repeated tapping does not become annoying.

Recommended event map:

| Event | Sound Direction | Notes |
| --- | --- | --- |
| Button tap | soft click or leather tick | 2-4 variants |
| Menu transition | low paper swipe | under 500 ms |
| Inbox notification | calm two-note ping | no alarm tone |
| Transfer offer reveal | paper/terminal shimmer | avoid casino-like reward sounds |
| Contract signing | pen stroke + stamp hit | confident but not loud |
| Reputation gain | small warm rise | no slot-machine feel |
| Reputation loss | muted downward tap | no harsh failure sting |
| Achievement | short restrained flourish | celebratory but not childish |
| Own-player goal | brief crowd swell abstraction | no real chants or broadcast audio |
| Match finished | clean whistle-like synthetic cue | avoid real referee sample unless licensed |

## Ambience

- Match day ambience should be abstract stadium air: low crowd bed, distant movement, soft PA texture.
- Office ambience can use quiet room tone, keyboard, phone vibration, and paper movement.
- Do not use real chants, club songs, TV commentary, copyrighted broadcast snippets, or identifiable stadium recordings without explicit rights.

## Mixing And Comfort

- SFX should be lower than typical mobile game defaults.
- Loops must be tested for at least 10 minutes on repeat.
- Provide separate mute/music/SFX controls before release.
- Respect reduced motion/audio comfort preferences where possible.

## File Organization

Use:

```text
assets/audio/music/
assets/audio/sfx/
assets/audio/ambience/
```

Use descriptive lowercase filenames such as `sfx-contract-sign-01.ogg`, `sfx-inbox-ping-02.ogg`, or `ambience-matchday-low.ogg`.

Every external audio file must be logged in `docs/ASSET_LICENSES.md` before being wired into the game.
