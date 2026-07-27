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
