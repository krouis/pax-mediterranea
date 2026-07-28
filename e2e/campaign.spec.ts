import { expect, test } from '@playwright/test';

test('completes The Sicilian Question campaign at the Turn 6 boundary and persists across reload', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Campaign/i }).click();
  await expect(page.getByText(/Control Sicily at the end of turn 6/i)).toBeVisible();
  await page.getByRole('button', { name: /Begin match|Play/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
  await expect(page.getByText(/Control Sicily at the end of turn 6/i)).toBeVisible();

  const carthageTerritory = page.getByRole('button', { name: /^Carthage/i });
  const sicilyTerritory = page.getByRole('button', { name: /^Sicily/i });

  // Turn 1: move the starting infantry into Sicily and hold it there.
  await carthageTerritory.locator('.unit-p1').first().click();
  await sicilyTerritory.click({ force: true });
  await expect(sicilyTerritory).toHaveClass(/owner-p1/);

  // Turns 1 through 6: end the turn without abandoning Sicily.
  for (let turn = 1; turn <= 6; turn += 1) {
    await page.getByRole('button', { name: /End turn/i }).click();
    await page.waitForTimeout(150);
  }

  await expect(sicilyTerritory).toHaveClass(/owner-p1/);
  const victoryDialog = page.locator('.dialog.victory');
  await expect(victoryDialog).toBeVisible();
  await expect(victoryDialog).toContainText(/campaign mission/i);
  await expect(page.getByText(/^Turn 7/)).toHaveCount(0);

  const saved = await page.evaluate(() => localStorage.getItem('pax.autosave.v1'));
  expect(saved).toBeTruthy();
  const savedState = JSON.parse(saved ?? '{}').state;
  expect(savedState.turn).toBe(6);
  expect(savedState.winnerId).toBeTruthy();
  expect(savedState.scenarioId).toBe('sicilian-question');

  const campaignProgress = await page.evaluate(() => localStorage.getItem('pax.campaign.v1'));
  expect(JSON.parse(campaignProgress ?? '{}').completedScenarios).toContain('sicilian-question');

  await page.reload();
  await page.getByRole('button', { name: /Continue/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
  await expect(page.getByText(/Control Sicily at the end of turn 6/i)).toBeVisible();
  await expect(page.locator('.dialog.victory')).toBeVisible();
});
