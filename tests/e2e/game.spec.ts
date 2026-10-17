import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { freshStart, keyboardPlayUntil, playUntil } from './bot';

const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (e) => errors.push(String(e)));
});

test.afterEach(({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

test('smoke: start, clear the first popup, the HUD counts it', async ({ page }) => {
  await freshStart(page);
  await expect(page.getByRole('dialog', { name: 'Welcome to Legends of Loot!' })).toBeVisible();
  const cleared = page.locator('[data-stat=cleared]');
  await expect(cleared).toHaveText(/^\D*0 cleared$/);
  await page.getByRole('button', { name: "Let's go!" }).click();
  await expect(cleared).toHaveText(/^\D*1 cleared$/);
  // The next popup is aria-modal, which hides the launcher from role queries; check the tile directly.
  await expect(page.locator('.menu-tile', { hasText: 'Achievements' })).toHaveAccessibleName(
    /Achievements \(\d+ new\)/,
  );
});

test('full run reaches Inbox Zero, credits, and results', async ({ page }) => {
  await freshStart(page);
  await playUntil(page, async () => (await page.locator('.results').count()) > 0);
  await expect(page.getByRole('heading', { name: 'You Cleared All Notifications' })).toBeVisible();
  const cleared = Number(await page.locator('.results__stats div:nth-child(2) dd').innerText());
  expect(cleared).toBeGreaterThanOrEqual(150);
  // The share image is drawn up front and actually renders.
  const card = page.getByRole('img', { name: /^Result card: \d+ notifications cleared/ });
  await expect(card).toBeVisible();
  expect(await card.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1080);
  // The save remembers it, and Zen is unlocked on the title screen.
  await page.reload();
  await expect(page.getByRole('button', { name: /Zen Mode/ })).toBeVisible({ timeout: 8000 });
});

test('Mark All As Read clears everything and spawns the FOMO popup', async ({ page }) => {
  await freshStart(page);
  const markAll = page.getByRole('button', { name: /Mark All As Read/ });
  await playUntil(
    page,
    async () => (await markAll.count()) > 0 && (await page.locator('[role=dialog]').count()) === 0,
  );
  await markAll.click();
  await expect(page.getByRole('dialog', { name: 'FOMO Alert' })).toBeVisible();
  await expect(markAll).toHaveCount(0);
});

test('zen mode keeps spawning and counts lifetime clears', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem('clear-all/save', JSON.stringify({ v: 1, zenUnlocked: true })),
  );
  await page.reload();
  await page.getByRole('button', { name: /Zen Mode/ }).click({ timeout: 8000 });
  await expect(page.getByRole('button', { name: /Exit Zen/ })).toBeVisible();
  await playUntil(
    page,
    async () =>
      Number((await page.locator('[data-stat=zen]').innerText()).replace(/\D/g, '')) >= 10,
    60_000,
  );
  // Popups sit above everything, Exit Zen included, and zen keeps spawning them.
  await playUntil(page, async () =>
    page
      .getByRole('button', { name: /Exit Zen/ })
      .click({ timeout: 500 })
      .then(() => true)
      .catch(() => false),
  );
  await page.getByRole('button', { name: 'Leave' }).click();
  await expect(page.getByText(/Zen: \d+/)).toBeVisible();
});

test('keyboard only: start and clear the boot popups', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const start = page.getByRole('button', { name: 'Start' });
  await expect(start).toBeEnabled({ timeout: 8000 });
  await start.focus();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 8; i++) {
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible();
    const box = dialog.locator('.scroll-box');
    if (await box.count()) {
      await box.focus();
      await page.keyboard.press('End');
      // Keyboard scrolling is animated; Accept enables once it reaches the bottom.
      await expect(dialog.locator('.modal__actions .btn--gold')).toBeEnabled();
      // Tab past the box to the first action, then to the enabled primary button.
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
    }
    // Chests and packs animate before their next button appears; focus must land on it.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.activeElement as HTMLButtonElement | null;
            return !!el && el.tagName === 'BUTTON' && !el.disabled && !!el.closest('[role=dialog]');
          }),
        { message: `popup ${i} has an enabled focused button` },
      )
      .toBe(true);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  await expect(page.locator('[data-stat=cleared]')).not.toHaveText(/^\D*0 cleared$/);
});

test('keyboard only: a full run, start to results', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Start takes focus by itself once loading finishes.
  await expect(page.getByRole('button', { name: 'Start' })).toBeFocused({ timeout: 8000 });
  await page.keyboard.press('Enter');
  await keyboardPlayUntil(page, async () => (await page.locator('.results').count()) > 0);
  await expect(page.getByRole('heading', { name: 'You Cleared All Notifications' })).toBeVisible();
});

test('no axe violations on home, a menu, and a popup', async ({ page }) => {
  await freshStart(page);
  const scan = async (where: string) => {
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${where}: ${v.id} (${v.nodes.length}) ${v.help}`)).toEqual([]);
  };
  await scan('popup');
  await playUntil(page, async () => (await page.locator('[role=dialog]').count()) === 0);
  await page.waitForTimeout(400);
  await scan('home');
  await page.getByRole('button', { name: /^.*Achievements/ }).click();
  await page.waitForTimeout(400);
  await scan('menu');
});

test('the hidden sound check page lists every sound and plays without errors', async ({ page }) => {
  await page.goto('/?sfx');
  await expect(page.getByRole('heading', { name: 'Sound check' })).toBeVisible();
  const buttons = page.locator('.sfx-lab__grid button');
  expect(await buttons.count()).toBeGreaterThan(30);
  for (const name of ['Legendary', 'Sad trombone (duplicate)', 'launcher', 'off']) {
    await page.getByRole('button', { name, exact: true }).click();
  }
});
