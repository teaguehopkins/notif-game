import type { Locator, Page } from '@playwright/test';

/** Clears whatever modal is on top, the way a (very patient) player would. */
async function handleDialog(page: Page, dlg: Locator): Promise<void> {
  const scroll = dlg.locator('.scroll-box');
  if (await scroll.count()) await scroll.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  if (await dlg.locator('.btn--hold').count()) {
    const b = (await dlg.locator('.btn--hold').boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1700);
    await page.mouse.up();
    return;
  }
  if (await dlg.locator('.tiny-x').count()) return dlg.locator('.tiny-x').click();
  if (await dlg.locator('.dodge-x').count()) {
    for (let i = 0; i < 5 && (await dlg.locator('.dodge-x').count()); i++) {
      await dlg.locator('.dodge-x').click({ force: true });
      await page.waitForTimeout(250);
    }
    return;
  }
  const gold = dlg.locator('.modal__actions button.btn--gold:not([disabled])').first();
  if (await gold.count()) return gold.click();
  const any = dlg.locator('.modal__actions button:not([disabled])').first();
  if (await any.count()) return any.click();
  await page.waitForTimeout(300);
}

/** One step of play: handle a modal, open a dotted thing, or go back. Returns false when idle. */
export async function step(page: Page): Promise<boolean> {
  if (await page.locator('.credits').count()) {
    const dot = page.locator('.credits__dot');
    if (await dot.count()) await dot.click();
    else await page.waitForTimeout(500);
    return true;
  }
  const dialogs = page.locator('.modal-backdrop [role=dialog]');
  if (await dialogs.count()) {
    await handleDialog(page, dialogs.last());
    return true;
  }
  if (await page.locator('.screen').count()) {
    const item = page.locator('.item-card--new').first();
    if (await item.count()) return item.click().then(() => true);
    const tab = page.locator('.tab:has(.badge)').first();
    if (await tab.count()) return tab.click().then(() => true);
    return page
      .locator('.back-btn')
      .click()
      .then(() => true);
  }
  const target = page.locator('.play-btn:has(.badge), .menu-tile:has(.badge)').first();
  if (await target.count()) return target.click().then(() => true);
  await page.waitForTimeout(400);
  return false;
}

/** Plays until `done()` is true. Popups can appear between a check and a click; just retry. */
export async function playUntil(
  page: Page,
  done: () => Promise<boolean>,
  maxMs = 150_000,
): Promise<void> {
  page.setDefaultTimeout(2500);
  const t0 = Date.now();
  while (!(await done())) {
    if (Date.now() - t0 > maxMs) throw new Error('bot timed out');
    try {
      await step(page);
    } catch {
      // Raced with a new popup; next step will deal with it.
    }
  }
}

export async function freshStart(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start' }).click({ timeout: 8000 });
}

/** Presses Tab until `target` has focus. Throws if it can't get there, which is the bug. */
async function tabTo(page: Page, target: Locator, max = 80): Promise<void> {
  const handle = await target.elementHandle();
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((el) => el === document.activeElement, handle)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`could not Tab to ${await target.evaluate((el) => el.outerHTML.slice(0, 80))}`);
}

/** Like step(), but using only the keyboard: Tab to the thing, then Enter (or hold Space). */
export async function keyboardStep(page: Page): Promise<void> {
  const press = async (target: Locator, key = 'Enter') => {
    await tabTo(page, target.first());
    await page.keyboard.press(key);
  };
  if (await page.locator('.credits').count()) {
    const dot = page.locator('.credits__dot');
    if (await dot.count()) await press(dot);
    else await page.waitForTimeout(500);
    return;
  }
  const dialogs = page.locator('.modal-backdrop [role=dialog]');
  if (await dialogs.count()) {
    const dlg = dialogs.last();
    const box = dlg.locator('.scroll-box');
    if (await box.count()) {
      await tabTo(page, box);
      await page.keyboard.press('End');
      await dlg.locator('.modal__actions .btn--gold:not([disabled])').waitFor();
    }
    if (await dlg.locator('.btn--hold').count()) {
      await tabTo(page, dlg.locator('.btn--hold'));
      await page.keyboard.down(' ');
      await page.waitForTimeout(1700);
      await page.keyboard.up(' ');
      return;
    }
    if (await dlg.locator('.tiny-x').count()) return press(dlg.locator('.tiny-x'));
    if (await dlg.locator('.dodge-x').count()) {
      await tabTo(page, dlg.locator('.dodge-x'));
      for (let i = 0; i < 4 && (await dlg.locator('.dodge-x').count()); i++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
      }
      return;
    }
    const gold = dlg.locator('.modal__actions button.btn--gold:not([disabled])');
    if (await gold.count()) return press(gold);
    const any = dlg.locator('.modal__actions button:not([disabled])');
    if (await any.count()) return press(any);
    await page.waitForTimeout(300);
    return;
  }
  if (await page.locator('.screen').count()) {
    for (const sel of ['.item-card--new', '.tab:has(.badge)', '.back-btn']) {
      if (await page.locator(sel).count()) return press(page.locator(sel));
    }
  }
  const target = page.locator('.play-btn:has(.badge), .menu-tile:has(.badge)');
  if (await target.count()) return press(target);
  await page.waitForTimeout(400);
}

/** playUntil, keyboard edition. Tab failures are real failures, so only click races are retried. */
export async function keyboardPlayUntil(
  page: Page,
  done: () => Promise<boolean>,
  maxMs = 240_000,
): Promise<void> {
  page.setDefaultTimeout(2500);
  const t0 = Date.now();
  while (!(await done())) {
    if (Date.now() - t0 > maxMs) throw new Error('keyboard bot timed out');
    try {
      await keyboardStep(page);
    } catch (e) {
      if (String(e).includes('could not Tab')) throw e;
    }
  }
}
