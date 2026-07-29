import { expect, test } from '@playwright/test';

test('opens the game history panel and lists recent events chronologically', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Quick Skirmish/i }).click();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();

  const carthageTerritory = page.getByRole('button', { name: /^Carthage/i });
  const sicilyTerritory = page.getByRole('button', { name: /^Sicily/i });
  await carthageTerritory.locator('.unit-p1').first().click();
  await sicilyTerritory.click({ force: true });
  await page.getByRole('button', { name: /End turn/i }).click();

  await page.getByRole('button', { name: /^History$/i }).click();
  const dialog = page.getByRole('dialog', { name: /Game history/i });
  await expect(dialog).toBeVisible();

  const entries = dialog.locator('.history-list li');
  await expect(entries).not.toHaveCount(0);
  await expect(entries.first()).toContainText('Turn 1');
  await expect(dialog).toContainText(/moves to Sicily/i);
  await expect(dialog).toContainText(/receives/i);

  // Keyboard operable: Escape closes it.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('history panel is usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByRole('button', { name: /Quick Skirmish/i }).click();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();

  await page.getByRole('button', { name: /^History$/i }).click();
  const dialog = page.getByRole('dialog', { name: /Game history/i });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(390);

  await dialog.getByRole('button', { name: /Close/i }).click();
  await expect(dialog).toBeHidden();
});
