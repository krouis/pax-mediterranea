import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function selectLocale(page: Page, locale: 'en' | 'fr' | 'ar-TN') {
  await page.getByTestId('language-selector').selectOption(locale);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

test.describe('required launch locales', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('launches in English and switches immediately to long French UI', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await selectLocale(page, 'fr');
    await expect(page.getByTestId('mode-quick')).toContainText('Escarmouche rapide');
    await expect(page.getByTestId('mode-hotseat')).toContainText('Tour par tour local');
    await expect(page.getByTestId('mode-quick')).toHaveCSS('overflow', 'visible');
  });

  test('switches to Tunisian Arabic, applies RTL, and never mirrors the map', async ({ page }) => {
    await selectLocale(page, 'ar-TN');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByTestId('language-selector')).toContainText('🇹🇳');
    await page.getByTestId('mode-quick').click();
    await page.getByTestId('patron-tanit').click();
    const map = page.getByTestId('game-map');
    await expect(map).toHaveAttribute('dir', 'ltr');
    await expect(map).toHaveCSS('transform', 'none');
    await expect(page.getByText('قرطاج', { exact: true }).first()).toBeVisible();
  });

  test('completes the Arabic tutorial entry path with Carthage and Tanit', async ({ page }) => {
    await selectLocale(page, 'ar-TN');
    await page.getByTestId('mode-tutorial').click();
    await expect(page.getByRole('heading', { name: 'اختار حضارتك' })).toBeVisible();
    await page.getByTestId('patron-tanit').click();
    await expect(page.getByRole('heading', { name: /اختار وحدة/ })).toBeVisible();
    await page.getByRole('button', { name: /كمّل الدور/ }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('keeps keyboard focus logical and accessibility clean in every required locale', async ({
    page,
  }) => {
    for (const locale of ['en', 'fr', 'ar-TN'] as const) {
      await selectLocale(page, locale);
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious'),
      ).toEqual([]);
    }
  });

  test('persists Arabic after reload and keeps room codes LTR', async ({ page }) => {
    await selectLocale(page, 'ar-TN');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar-TN');
    await page.getByTestId('mode-online').click();
    const room = page.getByPlaceholder('PAX-270');
    await expect(room).toHaveAttribute('dir', 'ltr');
    await room.fill('PAX-270');
    await expect(room).toHaveValue('PAX-270');
  });

  test('contains no visible missing-key markers in all required locales', async ({ page }) => {
    for (const locale of ['en', 'fr', 'ar-TN'] as const) {
      await page.goto('./');
      await selectLocale(page, locale);
      await expect(page.locator('body')).not.toContainText(/missing translation|content:|game:/i);
    }
  });

  test('reloads offline in each required locale after the shell is cached', async ({
    page,
    context,
  }) => {
    for (const locale of ['en', 'fr', 'ar-TN'] as const) {
      await page.goto('./');
      await selectLocale(page, locale);
      await page.evaluate(() => navigator.serviceWorker.ready);
      await context.setOffline(true);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByTestId('mode-quick')).toBeVisible();
      await context.setOffline(false);
    }
  });
});

test.describe('localized visual baselines', () => {
  for (const locale of ['en', 'fr', 'ar-TN'] as const) {
    test(`${locale} desktop menu`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium', 'Visual baselines use desktop Chromium.');
      await page.goto('./');
      await selectLocale(page, locale);
      await expect(page.locator('.menu-page')).toHaveScreenshot(`menu-${locale}-desktop.png`, {
        animations: 'disabled',
      });
    });
  }

  test('Arabic mobile portrait and landscape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Viewport baselines use desktop Chromium.');
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('./');
    await selectLocale(page, 'ar-TN');
    await expect(page.locator('.menu-page')).toHaveScreenshot('menu-ar-TN-mobile-portrait.png', {
      animations: 'disabled',
    });
    await page.setViewportSize({ width: 640, height: 360 });
    await expect(page.locator('.menu-page')).toHaveScreenshot('menu-ar-TN-mobile-landscape.png', {
      animations: 'disabled',
    });
  });
});
