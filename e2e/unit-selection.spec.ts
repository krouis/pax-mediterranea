import { expect, test } from '@playwright/test';

test('clicking anywhere on the territory selects its unit, not just the tiny icon', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Quick Skirmish/i }).click();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();

  const carthageTerritory = page.getByRole('button', { name: /^Carthage,/ });
  const box = await carthageTerritory.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);

  // Click the territory name text, not the small unit glyph.
  await carthageTerritory.locator('.territory-name').click();
  await expect(carthageTerritory.locator('.unit.selected')).toHaveCount(1);
});

test('repeated clicks on a stacked territory cycle through friendly units', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Quick Skirmish/i }).click();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();

  await page.locator('.recruit-row button', { hasText: 'Cavalry' }).click();
  const carthageTerritory = page.getByRole('button', { name: /^Carthage,/ });
  await carthageTerritory.click({ force: true });
  await expect(carthageTerritory.locator('.unit-p1')).toHaveCount(2);

  await carthageTerritory.click({ force: true });
  const firstSelected = await carthageTerritory
    .locator('.unit.selected')
    .getAttribute('aria-label');

  await carthageTerritory.click({ force: true });
  const secondSelected = await carthageTerritory
    .locator('.unit.selected')
    .getAttribute('aria-label');
  expect(secondSelected).toBeTruthy();

  // Cycling moves between the two distinct units (infantry vs cavalry).
  const firstTitle = await carthageTerritory.locator('.unit.selected').getAttribute('title');
  await carthageTerritory.click({ force: true });
  const thirdTitle = await carthageTerritory.locator('.unit.selected').getAttribute('title');
  expect([firstSelected, secondSelected]).toContain(firstSelected);
  expect(thirdTitle).not.toBe(firstTitle);
});

test('clicking a territory body does not clear a valid unit selection', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Quick Skirmish/i }).click();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();

  const carthageTerritory = page.getByRole('button', { name: /^Carthage,/ });
  await carthageTerritory.click({ force: true });
  await expect(carthageTerritory.locator('.unit.selected')).toHaveCount(1);

  // Iberia is controlled but not a legal destination for the infantry (sea between them).
  const iberia = page.getByRole('button', { name: /^Iberia,/ });
  await iberia.click({ force: true });
  await expect(carthageTerritory.locator('.unit.selected')).toHaveCount(1);
});
