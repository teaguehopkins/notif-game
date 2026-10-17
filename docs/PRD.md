# Clear All: Product Requirements

## 1. Pitch

**Working title:** _Clear All_. Inside the fiction, the launcher belongs to a made-up F2P game called **"Legends of Loot"**. You open the game and never get to play it. Every button has a red dot. Every dot leads to a menu, and every menu has more dots. Clearing one earns _"Achievement: You Cleared a Notification!"_, which is itself a notification. The goal is Inbox Zero.

## 2. Goals and non-goals

**Goals**

- A cathartic, funny 5–10 minute run with a clear arc: the dots trickle in, swell to peak chaos, then drain to zero, followed by the payoff.
- The core feeling is the Hearthstone one: a dot on a parent menu means something deep inside is new, and you have to dig to find it.
- Easy to replay: a speedrun timer, a share line, and Zen mode.
- Works with mouse, touch, and keyboard.

**Non-goals**

- No actual card game behind the Play button. It leads to "Finding opponent…", which turns into another notification.
- No real monetization, accounts, or backend.
- No use of real IP. Names, logos, art, and UI must be original. No Hearthstone or Battlefield look-alikes.

## 3. Core mechanics

### 3.1 Notifications

A notification is a piece of authored content at a **location** in the launcher's navigation tree, for example `collection › cardBacks › emberBack`. Each one has an **interaction type** that defines how you clear it:

| Type             | How it clears                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `view`           | Navigate to the leaf; the "NEW" tag clears when it's seen                                    |
| `dismiss`        | Modal with an OK/Claim button                                                                |
| `scroll`         | Scroll to the bottom before Accept enables (ToS, patch notes)                                |
| `chest` / `pack` | Click to open → spawns reward items (each its own NEW)                                       |
| `snooze`         | Offers "Remind me later" (it comes back; max 2 snoozes, then the option becomes "Ugh, fine") |
| `tinyX`          | A huge "Watch ad for 2× reward" button next to a 12px ✕ (the hitbox is still ≥44px on touch) |
| `dodgeX`         | The ✕ jumps away 1–2 times; on touch it moves after the first tap                            |
| `hold`           | Hold-to-claim for 1.5s                                                                       |
| `confirm`        | "Are you sure you want to dismiss this?"                                                     |
| `locked`         | "Mark all as read" stays locked until account Level 10                                       |

### 3.2 Badge bubbling (derived, never stored)

A parent's badge count is **computed** from the active notifications under its path, never stored. Home buttons show a dot, or a count when the count is above 1. Some leaves show "NEW" pills instead of dots. Deriving the counts means a parent can never drift out of sync with its children.

### 3.3 Achievements

Achievements are notifications too: a toast appears, and a dot is added under `achievements › <category>`. Opening the Achievements page clears nothing by itself. Each achievement has to be viewed, and viewing the page unlocks _"Looked at Your Achievements"_.

### 3.4 Cascade engine (data-driven)

Content is declarative data, kept separate from the engine. Each definition has:

- `trigger`: one of `start`, `cleared(id)`, `allCleared(ids[])`, `stat(name ≥ N)`, `event(name)`, or `level(N)`.
- `once: true` for everything in the authored run. This is what guarantees the run converges.
- Optional `rewards`: gold, gems, packs, XP, keys. A reward can trigger further notifications, for example "you can afford something" on the Shop.

### 3.5 Convergence invariant (authored mode)

- Every definition fires at most once. Snoozes re-add the same instance at most twice. Together these put a finite upper bound on the number of clears.
- **Inbox Zero** fires only when three things are all true: the active set is empty, the pending/delayed queue is empty, and the trigger evaluation pass yields nothing new.
- After Inbox Zero, only finale content can fire. Stat triggers such as "200 cleared!" are suppressed.
- The run must complete **regardless of clear order**. A Vitest simulation bot enforces this (see Build Plan, M1/M4).

### 3.6 HUD

The HUD shows the run timer, a "Cleared: N" count, and an "Active: N" count. The timer pauses while the tab is hidden (`visibilitychange`). Coming back to the tab unlocks _"Welcome Back!"_ once, which is another notification.

## 4. The authored run: pacing

Target: **150–250 clears** in 5–10 minutes. That assumes about 2–3 seconds per clear, menu navigation included. The peak is about 40–60 simultaneous active notifications.

| Act           | Time      | Clears | Beats                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Boot        | 0:00–0:30 | ~10    | Fake loading bar with "Did you know?" tips → stacked modals: Welcome, ToS updated, Privacy Policy updated, Patch Notes v4.20.1, Daily Login Day 1. _Opened the Game._                                                                                                                                                                                    |
| 1 Tutorial    | 0:30–1:30 | ~30    | Meta achievements: First Achievement, Cleared a Notification, Looked at Achievements, Clicked a Red Dot. A tooltip says "Tip: red dots mean something new!"                                                                                                                                                                                              |
| 2 Escalation  | 1:30–4:00 | ~80    | Chest → key in Mail → gold → the Shop dot appears → a free pack gives 5 NEW cards → Collection dots → "Collection 1% complete". Quests, Battle Pass Season 1, level-ups. New currencies keep arriving.                                                                                                                                                   |
| 3 Peak chaos  | 4:00–6:30 | ~80    | The Harvest Festival event adds a new tab with its own currency, pass, and quests. Gary sends a friend request. A guild invite. Level 10 unlocks **Mark All As Read**.                                                                                                                                                                                   |
| 4 Convergence | 6:30–8:00 | ~30    | Spawns dwindle. Stragglers are buried in deep menus. _"Can't Find the Last Dot?"_ hint achievement.                                                                                                                                                                                                                                                      |
| Finale        | —         | 3–4    | Inbox Zero → modal _"Achievement: You Cleared All Notifications 🔴"_ → clearing it gives _"You Cleared the 'Cleared All Notifications' Notification"_ → **credits roll**. The credits have a red dot of their own; clearing it gives _"Watched the Credits"_ + _"New Mode Unlocked: Zen"_, shown as a dot on Play → results screen (time, count, share). |

**Mark All As Read trap:** it marks the currently active notifications as read, which spawns _"Used Mark All As Read"_ and _"FOMO: You Missed 14 Things"_. Each counts as a clear.

## 5. Gag bank (authoring source)

**Meta-achievements:** Opened the Game · First Achievement · Cleared a Notification · Clicked a Red Dot · Looked at Your Achievements · Achievement Hunter (10) · Achievement Achievement Achievement (25) · Fifty Shades of Red (50) · Centurion (100) · "Halfway There?" (fires at the "50%" mark; the % estimate then drops) · Speed Reader (closed patch notes in under 1s) _or_ Actually Read the Patch Notes (scrolled to the bottom); these are mutually exclusive · Muted Us · Welcome Back · Notification Notification ("You have 37 unread notifications"; it counts itself).

**Boot and legal:** ToS updated (scroll-locked Accept; Decline reopens the same modal) · Privacy Policy updated too · Patch Notes: "Fixed a bug where players could clear all notifications" · a "What's New" carousel of 5 slides, each with a dot · Cookie consent with "Accept All" and "Manage Preferences" (pre-ticked toggles) · a maintenance notice for a date in the past.

**Daily login and rewards:** a 28-day calendar where Day 1 is claimable and Days 2–28 show "Come back tomorrow!" previews · "Your reward is waiting!" (1 gold) · a chest that needs a key, and the key is in Mail · "New currency unlocked!" for Gold, Gems, Dust, Event Tokens, and Pass XP, each once.

**Shop:** "NEW!" on every item · a limited-time offer of 92% OFF (was $1,299.99) · free pack → open → 5 NEW cards · "Starter Bundle: only for your first 72 hours" with a cosmetic countdown · "You can afford something!"

**Collection:** NEW tags on cards, card backs, avatars, and emotes · a duplicate card ("You can disenchant this!") · Deck Builder: "You have an incomplete deck" · Collection 1% Complete.

**Quests:** a daily quest, "Clear 10 Notifications", which pays out a reward notification · "New quest available!" · the weekly quest "Log in 7 days (1/7)" is a dot that clears when viewed and can never be completed.

**Battle pass and levels:** "Season 1 has begun!" · free tiers 1–5, each claimable · premium tiers show an "Upgrade!" dot that clears on view (the "No thanks" link is tiny) · Level Up ×N · Level 10 unlocks Mark All As Read.

**Mail:** Welcome, Commander! · A Gift from the Developers (it contains the chest key) · "We miss you!" (sent while you're playing) · a survey, "Your feedback matters" · "Re: Re: Re: Your account" · Rate Us ★★★★★: under 5 stars you get "We're sorry, tell us more"; 5 stars asks you to "leave a store review?"

**Social:** a friend request from xX_Gary_Xx. Accepting gets "Gary sent you a gift!" and then "Send one back?". Declining gets "Gary is sad." Also "Gary is now online", "Gary is now offline", and a guild invite from "<CLEAR ALL GANG>".

**Events:** "Harvest Festival begins!" adds a new home tab with its own currency, pass, and quests · "Event ends in 2:59:59" is cosmetic and only counts down.

**Settings and dark patterns:** "New setting: Notification Preferences!" opens a page where every toggle reads "Coming soon"; touching anything triggers "Your notification preferences have been saved" · Remind Me Later (snooze) · Tiny ✕ vs "Watch ad for 2×" (a 5-second fake ad for… a notification app) · the dodging ✕ · hold-to-claim · "Are you sure?" confirmation · "Complete your profile (20%)" → set an avatar → "New avatar unlocked!" · Play → "Finding opponent…" → "Matchmaking unavailable during event! Check out the event instead" (another dot).

**Return-visit (persistence):** "Welcome back, Commander! You have rewards waiting" · "Opened the Game (Again)" · "Opened the Game for the Nth Time".

## 6. Zen mode

- It unlocks when the authored run is completed. The unlock is saved to localStorage.
- A procedural generator draws from **templates**: the gag-bank patterns with randomized names, items, numbers, and Gary variants. It uses a seeded RNG.
- It spawns gently and keeps the active count around 8–20. The spawn rate eases up slightly when the player clears quickly.
- It has no win and no end. It shows a lifetime counter and Zen-specific milestone achievements (100, 500, 1000…), which are notifications too.
- An "Exit Zen" button sits in the corner, and it has a dot.

## 7. Extras (v1)

- **Sound:** synthesized with WebAudio (no assets, so no licensing). Sounds include a ding whose pitch rises with fast-clear combos, a chest fanfare, coins, and an increasingly insistent ping when new dots spawn. The AudioContext starts only on the first user gesture. A global mute toggle unlocks _Muted Us_.
- **Persistence:** localStorage with a versioned schema `{ v, lifetimeCleared, runsCompleted, bestTimeMs, bestCleared, zenUnlocked, zenLifetime, metaAchievements[], muted }`. Every read and write is wrapped in try/catch, and the game works the same when storage is unavailable. There is no mid-run save in v1.
- **Share:** a results line such as `"I cleared 214 notifications in 6:42 in Clear All 🔴 <url>"`. It uses `navigator.share` on mobile, then `navigator.clipboard`, then a select-the-text fallback. Sharing unlocks _Spread the Word_, a post-game notification.
- **Mobile:** a responsive layout with a bottom tab bar on narrow screens and touch targets of at least 44px. Nothing depends on hover. Modals fill the screen on phones.

## 8. Accessibility

- Every badge has an `aria-label` such as "Collection, 3 new", so the dot isn't conveyed by color alone. The count is also shown as text.
- Full keyboard navigation. Modals trap focus and close on Esc when the gag allows it.
- `prefers-reduced-motion` turns off shakes, confetti, and the X-dodging (the ✕ asks "Are you sure?" instead).

## 9. Tech

- **Vite + TypeScript (strict) + Preact** (about 4KB; components suit nested menus and stacked modals) + `@preact/signals` for UI state.
- The **engine is pure TS** with no DOM dependency, so it can be unit-tested and simulated. The UI subscribes to it.
- Vitest covers the engine, content validation, and the simulation bot. Playwright runs one end-to-end smoke test.
- `vite.config` sets `base: './'` so the same build runs on GitHub Pages or as an itch.io HTML5 zip.

## 10. Success criteria

- In 500 random-order seeds, the simulation bot finishes every run with 150–250 clears and exactly one Inbox Zero, fired at a true zero.
- A human playtest is fun and finishes in 5–10 minutes with no "I'm stuck and can't find the dot" dead ends. A hint system is the fallback.
- Lighthouse mobile ≥ 90 for performance and accessibility. The bundle is under 150KB gzipped.

## 11. Open questions / defaults chosen

- **Name:** _Clear All_, with the fictional launcher game "Legends of Loot". Easy to change.
- **Hosting:** GitHub Pages by default, with an itch.io zip as a secondary option.
- **Art:** CSS, SVG, and emoji only, with no image assets in v1. The look is a gold-and-wood gradient UI with chunky buttons and a lot of glow.
- **Hint system:** after 20 seconds with no clear, the deepest unseen dot pulses and the parent chain glows. Using it unlocks _"Needed a Hint"_.
