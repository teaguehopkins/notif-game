# Pizzazz backlog

Ideas for more sound, images and animation. Nothing here is committed to yet; pick, reorder, cut.

**What exists today**

- **Sound:** 7 synthesized sounds (`clear`, `spawn`, `achievement`, `fanfare`, `coins`, `snooze`, `error`) in `src/audio/sfx.ts`.
- **Visuals:** emoji icons and a CSS wood-and-gold theme, with no image assets.
- **Animation:** a dozen CSS keyframes (pop, glow, wobble, burst, flip, shake, credits roll).

**Constraints to keep**

- `prefers-reduced-motion` turns animation off.
- Mute silences everything.
- The bundle stays under 150 KB gzipped (it's ~32 KB now).
- All art and sound stay original.
- Nothing plays before the first gesture.

Effort: **S** about an hour · **M** half a day · **L** a day or more.

## Sound

- [ ] **S: Combo pitch ladder.** Fast consecutive clears step up a scale (do-re-mi…), resetting after ~1.5s idle. The PRD promised this and it isn't built yet.
- [ ] **S: Per-interaction sounds:**
  - paper rustle for scroll-gated ToS
  - lock clunk + creak for chests
  - foil rip for packs
  - drumroll for hold-to-claim (pitch rises with the hold)
  - "boing" when the ✕ dodges
  - fake ad jingle for the 2× ad
- [ ] **S: Card reveal rarity stingers:** common blip, rare shimmer, "legendary" orchestral hit that turns out to be a duplicate.
- [ ] **S: Distinct sounds by kind:** popup thunk, item ding, achievement chime. Then the ear tells you what just arrived.
- [ ] **M: Escalating spawn ping.** As active count climbs, the ping gets faster, higher and slightly detuned, until the peak sounds like a phone in a drawer. At Inbox Zero the room goes silent for a beat before the final chime.
- [ ] **M: Launcher music loop.** A generative, synthesized "epic fantasy menu" ostinato that never resolves. It gains a layer each act and drops to a single pad at Inbox Zero. It gets its own toggle, separate from sfx.
- [ ] **S: Gary has a voice:** a little two-note "heyy" blip on every Gary notification.
- [ ] **S: Credits theme:** a slow, sincere 8-bar synth melody under the roll.
- [ ] **S: Zen ambience:** soft rain/pad bed, gentler bell sounds instead of pings.
- [ ] **S: Volume slider** in Audio settings. Moving it unlocks "Adjusted the Volume" (another notification, naturally).

## Images and visual identity

- [ ] **M: SVG logo and crest** for Legends of Loot. Inline it so there are no extra requests. Use it on the title, the loading screen and the favicon.
- [ ] **M: Illustrated card faces** for the free pack: a frame per rarity, and portrait art from SVG shapes + emoji, procedurally tinted. Names like "Goblin Middle Manager".
- [ ] **S: Card backs that actually differ.** CSS-pattern backs (ember, frost, wood grain, "Notification Red").
- [ ] **M: Avatar frames and portraits.** The avatar picker gets framed portraits, and the top bar shows the chosen one with a level ring.
- [ ] **S: Currency icons.** Small inline SVG coins/gems/dust instead of emoji so they read as "game currency".
- [ ] **M: Home screen backdrop.** A layered parallax tavern/castle scene in SVG with a slowly drifting fog layer. It dims as notifications pile up.
- [ ] **S: Event re-skin.** During the Harvest Festival, the launcher gets autumn trim, falling leaves and an orange tint on gold accents.
- [ ] **S: Fake ad creative.** The 5-second ad gets a little animated "Notifly Pro: Never miss a notification!" mock app screenshot.
- [ ] **S: Real badge numerals.** Badges over 99 show "99+". In the finale, one badge shows "∞" for a frame.

## Animation

- [ ] **S: Dot pop on clear.** The red dot squashes, then bursts into 6–8 red particles. Parent badges tick down with a little flip.
- [ ] **S: Achievement toast slam.** It slides in, slams with a squash, then shines once across the banner.
- [ ] **M: Pack opening sequence.** Shake → tear → 5 cards fan out face-down → flip one by one on tap. A rarity glow plays before the flip.
- [ ] **M: Chest opening.** Lid bounces, light beams rotate behind, coins arc into the currency counter (and the counter rolls up).
- [ ] **S: Level-up ring.** The XP bar fills, flashes, and a "LEVEL UP" banner sweeps across.
- [ ] **S: Red-dot creep.** At peak chaos, a faint red vignette pulses at the screen edges, tied to the active count.
- [ ] **S: Notifications stack physically.** Stacked popups offset and tilt slightly, like a pile of cards, so the backlog is visible.
- [ ] **M: Inbox Zero moment.** Time slows (CSS scale/blur), every dot on screen drains away, the HUD turns green. Then the final achievement drops in with a screen shake.
- [ ] **S: Dodging ✕ personality.** It squashes before jumping and leaves a puff of dust. On its last dodge it looks back (a little eyes emoji?).
- [ ] **S: Hold-to-claim.** The button fills with liquid gold and wobbles as it nears full.
- [ ] **S: Idle wiggle.** If you idle, a random dotted button does a tiny "notice me" wiggle every few seconds, before the hint kicks in.
- [ ] **S: Title screen.** The logo shimmers, embers float upward, and the loading bar stalls at 99% for a beat before finishing.

## Juice and satire beats

- [ ] **M: Confetti** on achievements, Inbox Zero and the credits dot. Use a tiny canvas emitter (no library), and disable it under reduced motion. It sometimes rains red dots instead of confetti.
- [ ] **S: Screen shake budget.** Small shake on chests, bigger on the "Cleared All Notifications" achievement.
- [ ] **S: Number roll-ups.** HUD "Cleared" and currencies count up instead of jumping.
- [ ] **S: "Rarity" for notifications.** Some notifications arrive with a gold border and sparkle, "LEGENDARY NOTIFICATION", and contain nothing.
- [ ] **S: Loading-tip variety.** 20+ more "Did you know?" tips, rotating on the title and between modes.
- [ ] **M: Results screen card.** Render the share result as a collectible-card image (canvas → PNG) for Web Share with files. This gives a real shareable image, not just text.
- [ ] **S: Haptics on mobile:** `navigator.vibrate` short ticks on clear and a buzz pattern on popups, where supported. Toggled with sound.

## Suggested first batch

These give the most noticeable difference for the effort:

1. Combo pitch ladder
2. Dot pop particles
3. Pack opening sequence
4. Inbox Zero moment
5. Confetti
6. Per-interaction sounds
