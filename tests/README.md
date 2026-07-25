# Tests

`smoke.spec.js` is a Playwright regression test for the scene-transition
race bugs this project hit a few times (Reward sometimes skipped, Mountain
sometimes ending early). It was written without access to a browser or a
running copy of the game, so **it has not actually been run or debugged
yet** — treat the first attempt as shaking out the test itself, not just
the game.

## Running it

```bash
npm i -D @playwright/test
npx playwright install chromium
python3 -m http.server 8080   # or any static server, from the project root
npx playwright test tests/smoke.spec.js
```

If your server runs on a different port, set `SMOKE_BASE_URL`:

```bash
SMOKE_BASE_URL=http://localhost:5500 npx playwright test tests/smoke.spec.js
```

## What it checks

- The full loop (island → adventure → win → Reward → 3 gift cards) for
  Lagoon, as a template — copy the pattern for Mountain/Bazaar if it works.
- A rapid double-tap on a box doesn't fire two competing scene transitions
  (checked via the `[SceneManager]` console logs `goTo()` now prints).
- Tapping "← Острів" during the win sequence doesn't skip past Reward.

## Likely things to fix on the first run

- `skipIntro()`'s selectors and timings are my best guess at the intro's
  actual DOM — they may not match exactly (e.g. the start button's real
  id). Check `index.html` against the selectors if it fails immediately.
- The fixed `waitForTimeout` calls are a blunt stand-in for "wait until
  the intro/countdown/etc. is done" — replacing them with waiting on a
  specific element becoming visible would make the test faster and less
  flaky.
