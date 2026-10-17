# Legends of Loot

A satirical browser game about clearing notifications. You open **Legends of Loot**, a free-to-play
game you never get to play, and every menu has a red dot. Clearing one unlocks an achievement, and
every achievement is another red dot. Reach Inbox Zero and you get one more.

**Play it:** https://teaguehopkins.github.io/notif-game/

- [Product requirements](docs/PRD.md)
- [Build plan and status](docs/BUILD_PLAN.md)

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (relative paths, so it works on any host or as an itch.io zip)
```

## Test it

```sh
npm test                                              # engine, content, zen, save, share (Vitest)
SIM_REPORT=1 npx vitest run tests/sim-report.test.ts --reporter=verbose   # pacing report over 500 runs
npx playwright install chromium                       # once
npm run test:e2e                                      # browser bot plays full runs, desktop + phone
```

## Writing content

Notifications are data in `src/content/acts/`. Each has a trigger (`start`, `after(id)`,
`afterAll(...)`, `stat('cleared', 50)`, `on('event')`) and fires at most once, which is what
guarantees a run always ends. `npm test` checks every location, trigger, and outcome, and plays 500
random-order runs to make sure all of them reach Inbox Zero within 150–250 clears.
