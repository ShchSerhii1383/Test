// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * smoke.spec.js
 * -------------
 * Regression coverage for the class of bug this project hit a few times:
 * scene transitions racing each other and silently dropping the player
 * back on the island without ever reaching the Reward screen.
 *
 * NOT independently verified — written and reasoned through carefully,
 * but there is no browser available in the environment that wrote this,
 * so treat first runs as debugging the test itself as much as the game.
 * Run with: npx playwright test tests/smoke.spec.js
 * (requires `npm i -D @playwright/test` and a local static server, e.g.
 * `npx serve .` or `python3 -m http.server`, pointed at by baseURL below.)
 */

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:8080';

/** Get through the opening sequence as fast as the UI allows. */
async function skipIntro(page) {
  await page.goto(BASE_URL);

  // Title card: tap "Почати" once it appears.
  await page.locator('#intro-start-btn').click({ timeout: 15000 });

  // Registration scroll: type a team name, tap the wooden button once it
  // appears (it only shows once the input has text).
  const nameInput = page.locator('#team-name-input');
  await nameInput.waitFor({ state: 'visible', timeout: 15000 });
  await nameInput.fill('Test Crew');
  await page.locator('#start-adventure').click({ timeout: 15000 }).catch(() => {});

  // The rest of the intro (stamp, camera tour, boxes growing) is timed
  // and can't be skipped without changing the game itself — just wait
  // generously for it to finish and hand control to the island.
  await page.waitForTimeout(16000);
}

/** Tap the given adventure's box on the island and wait for its scene. */
async function enterAdventure(page, adventureId, sceneSelector) {
  await page.locator(`.box[data-adventure="${adventureId}"]`).click();
  await page.locator(sceneSelector).waitFor({ state: 'visible', timeout: 8000 });
}

test.describe('Full adventure -> reward loop', () => {
  test('Lagoon: winning reaches the Reward scene with 3 cards', async ({ page }) => {
    const logs = [];
    page.on('console', (msg) => logs.push(msg.text()));

    await skipIntro(page);
    await enterAdventure(page, 'lagoon', '.scene--lagoon.is-active');

    // Fast-forward through reveal/story/rules/countdown by waiting; then
    // tap every lagoon-item until the three targets are found. This is a
    // blunt "click everything" approach rather than reading which icons
    // are the real targets, since that's exactly what a real player
    // can't do either — it just takes longer than a precise script would.
    await page.waitForSelector('.lagoon-item', { timeout: 20000 });
    for (let round = 0; round < 6; round++) {
      const items = await page.locator('.lagoon-item').all();
      for (const item of items) {
        await item.click({ trial: false }).catch(() => {});
      }
      const rewardVisible = await page.locator('.scene--reward.is-active').isVisible().catch(() => false);
      if (rewardVisible) break;
      await page.waitForTimeout(1500);
    }

    await expect(page.locator('.scene--reward.is-active')).toBeVisible({ timeout: 10000 });
    await page.locator('#reward-box').click();
    await expect(page.locator('.reward-card')).toHaveCount(3, { timeout: 5000 });

    console.log('--- SceneManager transition log ---');
    console.log(logs.filter((l) => l.includes('[SceneManager]')).join('\n'));
  });
});

test.describe('Race-condition regressions', () => {
  test('Rapid double-tap on a box does not fire two transitions', async ({ page }) => {
    const logs = [];
    page.on('console', (msg) => logs.push(msg.text()));

    await skipIntro(page);

    const box = page.locator('.box[data-adventure="lagoon"]');
    await box.click();
    await box.click({ force: true }).catch(() => {}); // fires while Mickey is mid-run; should be a no-op

    await page.waitForTimeout(3000);
    const transitions = logs.filter((l) => l.startsWith('[SceneManager]') && l.includes('-> lagoon'));
    expect(transitions.length).toBeLessThanOrEqual(1);
  });

  test('Tapping "back" during the win sequence does not skip Reward', async ({ page }) => {
    const logs = [];
    page.on('console', (msg) => logs.push(msg.text()));

    await skipIntro(page);
    await enterAdventure(page, 'lagoon', '.scene--lagoon.is-active');

    await page.waitForSelector('.lagoon-item', { timeout: 20000 });
    // Click everything repeatedly to win, then immediately slam "back".
    for (let round = 0; round < 6; round++) {
      const items = await page.locator('.lagoon-item').all();
      for (const item of items) {
        await item.click().catch(() => {});
      }
      await page.locator('#lagoon-back').click({ force: true }).catch(() => {});
      const rewardVisible = await page.locator('.scene--reward.is-active').isVisible().catch(() => false);
      if (rewardVisible) break;
      await page.waitForTimeout(1000);
    }

    // The back button should have been ignored once the win sequence
    // started (it becomes .is-disabled) — we should still land on Reward.
    await expect(page.locator('.scene--reward.is-active')).toBeVisible({ timeout: 10000 });
  });
});
