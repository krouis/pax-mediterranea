import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('starts a Carthaginian solo match and exposes core actions', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Pax Mediterranea/i })).toBeVisible();
  await page.getByRole('button', { name: /Quick Skirmish/i }).click();
  await expect(page.getByRole('heading', { name: /Choose your civilization/i })).toBeVisible();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await expect(page.getByLabel('Mediterranean strategy map')).toBeVisible();
  await expect(page.getByRole('button', { name: /End turn/i })).toBeVisible();
  await page.getByRole('button', { name: /Save/i }).click();
  await expect(page.getByRole('status')).toContainText('saved');
});

test('supports keyboard and mobile layouts without serious accessibility violations', async ({
  page,
}) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  const results = await new AxeBuilder({ page }).exclude('.territory').analyze();
  expect(
    results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious'),
  ).toEqual([]);
});

test('creates a concealed hot-seat transition', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: /Local Hot Seat/i }).click();
  await page.getByRole('button', { name: /Baal Hammon/i }).click();
  await page.getByRole('button', { name: /End turn/i }).click();
  await expect(page.getByText(/Pass the device/i)).toBeVisible();
});

test('shows an in-app combat confirmation dialog and executes the attack', async ({ page }) => {
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
  await expect(magnaGraeciaTerritory).toHaveClass(/legal/);

  let nativeDialogFired = false;
  page.once('dialog', async (dialog) => {
    nativeDialogFired = true;
    await dialog.dismiss();
  });
  await magnaGraeciaTerritory.click({ force: true });

  const combatDialog = page.getByRole('alertdialog');
  await expect(combatDialog).toBeVisible();
  expect(nativeDialogFired).toBe(false);

  await combatDialog.getByRole('button', { name: /^Attack$/i }).click();
  await expect(combatDialog).toBeHidden();
  await expect(page.getByRole('status')).not.toHaveText('');
});
