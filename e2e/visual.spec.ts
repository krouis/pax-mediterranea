import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Expanded visual-regression coverage beyond the menu screen (see e2e/i18n.spec.ts's
// "localized visual baselines" block). Curated, not exhaustive: one representative capture per
// major screen/state, using the same deterministic seeds the rest of the e2e suite already
// relies on (createGame's default solo/campaign seeds), so no `--update-snapshots` should be
// needed unless the screen genuinely changed. See docs/TESTING.md for policy.

test.describe('expanded visual regression', () => {
  test('game board (English, desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Baselines are captured on chromium only.');
    await page.goto('./');
    await page.getByRole('button', { name: /Quick Skirmish/i }).click();
    await page.getByRole('button', { name: /Baal Hammon/i }).click();
    await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
    await expect(page.locator('.game-page')).toHaveScreenshot('game-board-en-desktop.png', {
      animations: 'disabled',
    });
  });

  test('faction select (English, desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Baselines are captured on chromium only.');
    await page.goto('./');
    await page.getByRole('button', { name: /Quick Skirmish/i }).click();
    await expect(page.getByRole('heading', { name: /Choose your civilization/i })).toBeVisible();
    await expect(page.locator('.sub-page')).toHaveScreenshot('faction-select-en-desktop.png', {
      animations: 'disabled',
    });
  });

  test('recruitment placement (English, desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Baselines are captured on chromium only.');
    await page.goto('./');
    await page.getByRole('button', { name: /Quick Skirmish/i }).click();
    await page.getByRole('button', { name: /Baal Hammon/i }).click();
    await page
      .locator('.recruit-row')
      .getByRole('button', { name: /Infantry/i })
      .click();
    await expect(page.locator('.game-page')).toHaveScreenshot(
      'recruitment-placement-en-desktop.png',
      { animations: 'disabled' },
    );
  });

  test('attack preview dialog (English, desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Baselines are captured on chromium only.');
    await page.goto('./');
    await page.getByRole('button', { name: /Campaign/i }).click();
    await page.getByRole('button', { name: /Begin match|Play/i }).click();
    await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
    const carthageTerritory = page.getByRole('button', { name: /^Carthage/i });
    const sicilyTerritory = page.getByRole('button', { name: /^Sicily/i });
    await carthageTerritory.locator('.unit-p1').first().click();
    await sicilyTerritory.click({ force: true });
    await page.getByRole('button', { name: /End turn/i }).click();
    await sicilyTerritory.locator('.unit-p1').first().click();
    const magnaGraeciaTerritory = page.getByRole('button', { name: /Magna Graecia/i });
    page.once('dialog', (dialog) => dialog.dismiss());
    await magnaGraeciaTerritory.click({ force: true });
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByRole('alertdialog')).toHaveScreenshot('attack-preview-en-desktop.png', {
      animations: 'disabled',
    });
  });

  test('historical codex (English, desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Baselines are captured on chromium only.');
    await page.goto('./');
    await page.getByRole('button', { name: /Historical Codex/i }).click();
    await expect(page.getByRole('heading', { name: /Historical Codex/i })).toBeVisible();
    await expect(page.locator('.codex-page')).toHaveScreenshot('codex-en-desktop.png', {
      animations: 'disabled',
    });
  });

  test('game board (mobile portrait)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Baselines are captured on chromium only.');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    await page.getByRole('button', { name: /Quick Skirmish/i }).click();
    await page.getByRole('button', { name: /Baal Hammon/i }).click();
    await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
    await expect(page.locator('.game-page')).toHaveScreenshot('game-board-mobile-portrait.png', {
      animations: 'disabled',
    });
  });

  test('game board (Arabic, RTL, desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Baselines are captured on chromium only.');
    await page.goto('./');
    await page.getByTestId('language-selector').selectOption('ar-TN');
    await page.getByTestId('mode-quick').click();
    await page.getByTestId('patron-baal-hammon').click();
    await expect(page.locator('.game-page')).toBeVisible();
    await expect(page.locator('.game-page')).toHaveScreenshot('game-board-ar-TN-desktop.png', {
      animations: 'disabled',
    });
  });

  test('historical codex has no serious accessibility violations', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: /Historical Codex/i }).click();
    await expect(page.getByRole('heading', { name: /Historical Codex/i })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious'),
    ).toEqual([]);
  });

  test('combat confirmation dialog traps focus and returns it on close', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: /Campaign/i }).click();
    await page.getByRole('button', { name: /Begin match|Play/i }).click();
    await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
    const carthageTerritory = page.getByRole('button', { name: /^Carthage/i });
    const sicilyTerritory = page.getByRole('button', { name: /^Sicily/i });
    await carthageTerritory.locator('.unit-p1').first().click();
    await sicilyTerritory.click({ force: true });
    await page.getByRole('button', { name: /End turn/i }).click();
    await sicilyTerritory.locator('.unit-p1').first().click();
    const magnaGraeciaTerritory = page.getByRole('button', { name: /Magna Graecia/i });
    page.once('dialog', (dialog) => dialog.dismiss());
    await magnaGraeciaTerritory.click({ force: true });

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    // Focus starts inside the dialog (the first focusable element, Cancel).
    await expect(dialog.getByRole('button', { name: /^Cancel$/i })).toBeFocused();
    // Shift+Tab from the first element wraps to the last, staying inside the dialog.
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: /^Attack$/i })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    // Focus returns to whatever was focused before the dialog opened.
    await expect(magnaGraeciaTerritory).toBeFocused();
  });
});
