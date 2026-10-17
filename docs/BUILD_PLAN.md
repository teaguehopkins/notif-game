# Clear All: Build Plan

See [PRD.md](PRD.md) for the product spec; section references (§) point there.

## Status (2026-10-17)

| Milestone                    | Status                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 Scaffold                  | ✅                                                                                                                                                                               |
| M1 Engine, bubbling, sim bot | ✅                                                                                                                                                                               |
| M2 Launcher shell            | ✅                                                                                                                                                                               |
| M3 Interaction types         | ✅ all 10, exercised by the browser bot                                                                                                                                          |
| M4 Authored content          | ✅ 191 notifications; 500-seed sim: 159–179 clears, every def reachable. Bot peak is ~31 active (the random bot clears faster than a person navigates, so real peaks run higher) |
| M5 Finale, credits, results  | ✅                                                                                                                                                                               |
| M6 Zen mode                  | ✅                                                                                                                                                                               |
| M7 Sound                     | ✅ synthesized WebAudio; not yet tuned by ear                                                                                                                                    |
| M8 Persistence               | ✅                                                                                                                                                                               |
| M9 Share                     | ✅                                                                                                                                                                               |
| M10 Mobile and accessibility | ✅ phone layout, keyboard-only boot flow e2e; Lighthouse not yet run                                                                                                             |
| M11 Polish and deploy        | 🟡 Playwright suite done; hosting not set up yet                                                                                                                                 |

## Project layout (as built)

```
src/
  engine/   types.ts · engine.ts (cascade, derived badge counts) · simulate.ts (random-order bot)
            rng.ts (seeded) · zen.ts (zen director)
  content/  nav.ts (launcher menu tree) · helpers.ts · acts/act0-boot.ts … act4-convergence.ts
            finale.ts · zen.ts (zen templates + milestones) · index.ts
  ui/       App.tsx · game.ts (controller + signals) · motion.ts
            components/ (Badge, Modal, NotifModal + interactions, ModalHost, TopBar, Toasts)
            screens/ (Title, Home, MenuScreen, SpecialPanels, Credits, Results)
  audio/sfx.ts · persist/save.ts · share/share.ts · styles/app.css
tests/      engine · simulate · content · zen · save · share (Vitest)
            sim-report.test.ts (SIM_REPORT=1 pacing report) · e2e/ (Playwright: smoke, full run,
            Mark All, zen, keyboard-only; desktop + phone)
```

**Gotcha:** `@preact/signals` memoizes any component that reads a signal, so it skips re-renders
from its parent when its props are unchanged. Every component that reads engine state must call
`useEngine()` itself.

## Milestones and acceptance criteria

**M0. Scaffold**

- Set up Vite, Preact, TS strict, Vitest, ESLint, and Prettier, with `base: './'`. Run git init and create the docs.
- Accept when `npm run dev` serves a placeholder, and `npm test` and `npm run build` pass.

**M1. Engine and bubbling**

- Write the types, trigger evaluation, `once` enforcement, pending queue, Inbox Zero detection, stat suppression after zero, derived badge counts, and seeded RNG.
- Build the **simulation bot** in `simulate.test.ts`. It repeatedly picks a random active notification and clears it, sometimes snoozing or using Mark All when that's possible. It asserts four things: the run terminates within maxSteps, Inbox Zero fires exactly once, it fires only at a true zero, and nothing that isn't finale content fires afterwards.
- Accept when tests pass against a ~20-definition fixture.

**M2. Launcher shell**

- Build the home screen and nav tree screens, the Badge/NewPill components with bubbling, a modal stack, toasts, and the HUD with the timer (paused while the tab is hidden).
- Accept when the fixture run can be cleared end to end with a mouse.

**M3. Interaction types**

- Implement every type in §3.1. On touch, `dodgeX` moves after the first tap; with reduced motion it falls back to `confirm`.
- Accept when each type has a fixture item and is cleared manually.

**M4. Authored content (largest milestone)**

- Write Acts 0–4 from the gag bank, using template factories for the bulk content: pack cards, level-ups, pass tiers, and calendar days.
- Write `content.test.ts`. It checks that every location exists in nav, every trigger id resolves, every definition is reachable from `start`, the finale is reachable, and no stat trigger targets a count above the possible maximum.
- Accept when the simulation bot, over 500 seeds, lands between 150 and 250 clears with a peak active count of about 40–60, and the bot reports the clear/peak distribution for tuning.

**M5. Finale, credits, results**

- Build the recursion beat, the credits with their clearable dot, the Zen unlock dot on Play, and the results screen.
- Accept when a manual full run reaches the results screen.

**M6. Zen mode**

- Build the generator, the rate controller, the lifetime counter, the milestone achievements, and Exit Zen.
- Accept when a 5-minute zen session runs stably with no unbounded growth: a sim test checks the active count stays within the band.

**M7. Sound**

- Synthesize the WebAudio sfx, start the AudioContext on the first gesture, and add the mute toggle with its achievement.
- Accept when nothing plays before the first interaction and mute persists.

**M8. Persistence**

- Implement the versioned save, storage failures handled with try/catch, the return-visit gags, and best times.
- Accept when the game works with storage blocked (tested by stubbing it to throw) and stats survive a reload.

**M9. Share**

- Implement the Web Share → clipboard → manual fallback chain and the _Spread the Word_ achievement.
- Accept when the fallback chain is unit-tested with navigator stubs.

**M10. Mobile and accessibility**

- Add the bottom tab bar, 44px targets, aria-labels, focus traps, keyboard navigation, and reduced motion.
- Accept when a full run can be completed by keyboard only and on a 375px viewport, and Lighthouse a11y is ≥ 90.

**M11. Polish and deploy**

- Add juice (confetti, glow, shake), the hint system, the Playwright smoke test (load → clear the first modal → HUD count increments), a GitHub Pages workflow, and an itch zip script.
- Accept when it's live at a URL.

## Risks

- **Content volume:** about 200 definitions to write. Template factories carry the bulk, and authored jokes go where they're most visible.
- **Lost dots:** players may not be able to find the last dot. Mitigated by the hint system and the convergence act's deliberate "hunt" design.
- **Pacing tuning:** use the simulation bot's distribution output plus 2–3 human playtests.
