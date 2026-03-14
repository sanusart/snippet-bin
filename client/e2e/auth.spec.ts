import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Authentication Flows', () => {
  const testUser = {
    username: `e2e_user_${uuidv4().substring(0, 8)}`,
    email: `e2e_${uuidv4().substring(0, 8)}@example.com`,
    password: 'password123',
    name: 'E2E Tester',
  };

  test('user can register, login, and access settings', async ({ page }) => {
    // 1. Navigate to Login page and switch to Sign up
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // 2. Fill registration form (use placeholders — labels lack htmlFor in stale Vite)
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('Your full name').fill(testUser.name);
    await page.getByPlaceholder('e.g., codeuser').fill(testUser.username);
    await page.getByPlaceholder('At least 6 characters').fill(testUser.password);

    // 3. Submit
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/');

    // 4. Sign out
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');

    // 5. Login again
    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('At least 6 characters').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/');

    // 6. Navigate to Settings and update display name
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings/profile');

    // Settings page has only one textbox — the display name input
    const nameInput = page.getByRole('textbox');
    await nameInput.fill('E2E Tester Updated');

    // Wait for the input to be filled
    await expect(nameInput).toHaveValue('E2E Tester Updated');

    const saveButton = page.getByRole('button', { name: 'Save name' });
    await saveButton.click();

    // Wait for button to be enabled again (API call completed)
    await expect(saveButton).toBeEnabled({ timeout: 10000 });

    // Wait for the header to update with new name
    await expect(page.getByText('Signed in as E2E Tester Updated')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('E2E Tester Updated')).toBeVisible();
  });
});
