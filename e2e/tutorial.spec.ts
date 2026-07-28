import { expect, test } from '@playwright/test';

test('completes the guided tutorial end to end from real game events', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('mode-tutorial').click();
  await page.getByTestId('patron-baal-hammon').click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();

  const tip = page.locator('.tutorial-tip');
  await expect(tip).toContainText('1/4');
  await expect(tip).toContainText(/Select a unit/i);

  const carthageTerritory = page.getByRole('button', { name: /^Carthage/i });
  const sicilyTerritory = page.getByRole('button', { name: /^Sicily/i });

  // Step 1 -> 2: selecting the unit advances the tip, it does not move it yet.
  await carthageTerritory.locator('.unit-p1').first().click();
  await expect(tip).toContainText('2/4');
  await expect(tip).toContainText(/Move to a highlighted territory/i);

  // Step 2 -> 3: moving to and capturing Sicily advances the tip.
  await sicilyTerritory.click({ force: true });
  await expect(sicilyTerritory).toHaveClass(/owner-p1/);
  await expect(tip).toContainText('3/4');
  await expect(tip).toContainText(/Recruit infantry/i);

  // The tip must survive an intervening turn change if the player has not
  // recruited yet — end the turn first to prove it is not lost.
  await page.getByRole('button', { name: /End turn/i }).click();
  await expect(tip).toContainText('3/4');

  // Step 3 -> 4: recruiting through the placement flow advances the tip.
  await page.locator('.recruit-row button', { hasText: 'Infantry' }).click();
  await carthageTerritory.click({ force: true });
  await expect(tip).toContainText('4/4');
  await expect(tip).toContainText(/Play a card, invoke favor/i);

  // Step 4 -> done: ending the turn completes and hides the tutorial tip.
  await page.getByRole('button', { name: /End turn/i }).click();
  await expect(tip).toHaveCount(0);
});

test('can be skipped and restarted', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('mode-tutorial').click();
  await page.getByTestId('patron-baal-hammon').click();
  const tip = page.locator('.tutorial-tip');
  await expect(tip).toBeVisible();
  await tip.getByRole('button', { name: /Skip/i }).click();
  await expect(tip).toHaveCount(0);

  await page.getByRole('button', { name: /return to menu/i }).click();
  await page.getByTestId('mode-tutorial').click();
  await page.getByTestId('patron-baal-hammon').click();
  await expect(page.locator('.tutorial-tip')).toContainText('1/4');
});

test('an incorrect action does not break tutorial progression', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('mode-tutorial').click();
  await page.getByTestId('patron-baal-hammon').click();
  const tip = page.locator('.tutorial-tip');

  const carthageTerritory = page.getByRole('button', { name: /^Carthage/i });
  await carthageTerritory.locator('.unit-p1').first().click();
  await expect(tip).toContainText('2/4');

  // Attempt an illegal recruit destination before completing the move step.
  await page.locator('.recruit-row button', { hasText: 'Cavalry' }).click();
  const numidia = page.getByRole('button', { name: /^Numidia/i });
  await numidia.click({ force: true });
  await expect(tip).toContainText('2/4');
  await page.getByRole('button', { name: /^Cancel$/i }).click();

  const sicilyTerritory = page.getByRole('button', { name: /^Sicily/i });
  await carthageTerritory.locator('.unit-p1').first().click();
  await sicilyTerritory.click({ force: true });
  await expect(tip).toContainText('3/4');
});
