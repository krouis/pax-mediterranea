import { expect, test } from '@playwright/test';

test('honestly labels online play as unavailable and offers working alternatives', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByTestId('mode-online')).toContainText(/not yet available/i);

  await page.getByTestId('mode-online').click();
  await expect(page.getByRole('heading', { name: /Online Room/i })).toContainText(/coming soon/i);
  await expect(page.getByText(/not available in this build yet/i)).toBeVisible();
  await expect(page.getByText(/Quick Skirmish against the AI or Local Hot Seat/i)).toBeVisible();

  const joinButton = page.getByRole('button', { name: /Join room/i });
  await expect(joinButton).toBeDisabled();

  // Working alternatives are offered directly from this screen.
  await page.getByRole('button', { name: /^Quick Skirmish$/i }).click();
  await expect(page.getByRole('heading', { name: /Choose your civilization/i })).toBeVisible();
});
