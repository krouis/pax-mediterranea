import { expect, test, type Page } from '@playwright/test';

async function startSoloMatchWithSicily(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: /Quick Skirmish/i }).click();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
  const carthageTerritory = page.getByRole('button', { name: /^Carthage/i });
  const sicilyTerritory = page.getByRole('button', { name: /^Sicily/i });
  await carthageTerritory.locator('.unit-p1').first().click();
  await sicilyTerritory.click({ force: true });
  await expect(sicilyTerritory).toHaveClass(/owner-p1/);
  return { carthageTerritory, sicilyTerritory };
}

test('highlights every eligible destination and places the recruit where chosen', async ({
  page,
}) => {
  const { carthageTerritory, sicilyTerritory } = await startSoloMatchWithSicily(page);
  const coinsBefore = await page.locator('.topbar dl dd').first().innerText();

  await page.locator('.recruit-row button', { hasText: 'Infantry' }).click();
  await expect(carthageTerritory).toHaveClass(/legal/);
  await expect(sicilyTerritory).toHaveClass(/legal/);

  await sicilyTerritory.click({ force: true });

  // Sicily already held the unit that captured it; the recruit adds a second
  // one there instead of defaulting to the Carthage capital. Same-type units
  // collapse into a single badge showing the stack count.
  await expect(sicilyTerritory.locator('.unit-p1')).toHaveCount(1);
  await expect(sicilyTerritory.locator('.unit-count')).toHaveText('2');
  await expect(carthageTerritory.locator('.unit-p1')).toHaveCount(0);
  const coinsAfter = await page.locator('.topbar dl dd').first().innerText();
  expect(coinsAfter).not.toBe(coinsBefore);

  // The freshly placed unit already acted and offers no legal destinations.
  await sicilyTerritory.locator('.unit-p1').first().click();
  await expect(page.locator('.territory.legal')).toHaveCount(0);
});

test('cancel returns to the previous state without charging coins', async ({ page }) => {
  await startSoloMatchWithSicily(page);
  const coinsBefore = await page.locator('.topbar dl dd').first().innerText();

  await page.locator('.recruit-row button', { hasText: 'Cavalry' }).click();
  await expect(page.getByRole('button', { name: /^Cancel$/i })).toBeVisible();
  await page.getByRole('button', { name: /^Cancel$/i }).click();

  await expect(page.locator('.territory.legal')).toHaveCount(0);
  const coinsAfter = await page.locator('.topbar dl dd').first().innerText();
  expect(coinsAfter).toBe(coinsBefore);
});

test('rejects placement on an ineligible territory and stays in placement mode', async ({
  page,
}) => {
  await startSoloMatchWithSicily(page);
  await page.locator('.recruit-row button', { hasText: 'Infantry' }).click();
  // Numidia is controlled but is plains, not a city or port.
  const numidia = page.getByRole('button', { name: /^Numidia/i });
  await expect(numidia).not.toHaveClass(/legal/);
  await numidia.click({ force: true });
  await expect(page.locator('.action-panel > .status')).not.toHaveText('');
  await expect(page.getByRole('button', { name: /^Cancel$/i })).toBeVisible();
});

test('supports keyboard operation for recruitment placement', async ({ page }) => {
  const { sicilyTerritory } = await startSoloMatchWithSicily(page);
  const infantryButton = page.locator('.recruit-row button', { hasText: 'Infantry' });
  await infantryButton.focus();
  await page.keyboard.press('Enter');
  await expect(sicilyTerritory).toHaveClass(/legal/);
  await sicilyTerritory.focus();
  await page.keyboard.press('Enter');
  await expect(sicilyTerritory.locator('.unit-p1')).toHaveCount(1);
  await expect(sicilyTerritory.locator('.unit-count')).toHaveText('2');
});
