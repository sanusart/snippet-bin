import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Gist Flows', () => {
  const testUser = {
    username: `gist_e2e_${uuidv4().substring(0, 8)}`,
    email: `gist_e2e_${uuidv4().substring(0, 8)}@example.com`,
    password: 'password123',
    name: 'Gist Creator'
  };

  test.beforeEach(async ({ page }) => {
    // Register and Login fresh for each test
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await page.getByPlaceholder('you@example.com').fill(testUser.email);
    await page.getByPlaceholder('Your full name').fill(testUser.name);
    await page.getByPlaceholder('e.g., codeuser').fill(testUser.username);
    await page.getByPlaceholder('At least 6 characters').fill(testUser.password);

    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/');
  });

  test('user can create, edit, star, and delete a snippet', async ({ page }) => {
    // 1. Create a Snippet
    await page.getByRole('button', { name: '+ New gist' }).click();
    await expect(page).toHaveURL('/new');

    await page.getByPlaceholder('What does this gist do?').fill('Playwright E2E Snippet');
    await page.getByPlaceholder('filename.js').fill('hello_world.js');
    await page.getByRole('combobox').selectOption('javascript');
    await page.getByPlaceholder('Paste your code...').fill('console.log("Hello from Playwright!");');

    // Add a second file
    await page.getByText('+ Add file').click();
    await page.getByPlaceholder('filename.js').nth(1).fill('style.css');
    await page.getByRole('combobox').nth(1).selectOption('css');
    await page.getByPlaceholder('Paste your code...').nth(1).fill('body { color: blue; }');

    await page.getByRole('button', { name: 'Create gist' }).click();

    // URL pattern matches /gists/[uuid]
    await expect(page).toHaveURL(/\/gists\/[a-f0-9-]+$/);
    await expect(page.getByText('Playwright E2E Snippet')).toBeVisible();
    await expect(page.getByText('hello_world.js')).toBeVisible();
    await expect(page.getByText('style.css')).toBeVisible();

    // 2. Star the Snippet
    const starButton = page.getByRole('button', { name: 'Star' });
    await starButton.click();
    await expect(page.getByRole('button', { name: 'Unstar' })).toBeVisible();

    // 3. Edit the Snippet
    await page.getByRole('link', { name: 'Edit' }).click();

    await page.locator('#description').fill('Updated Playwright E2E Snippet');
    await page.getByPlaceholder('filename.js').first().fill('goodbye_world.js');

    // Delete second file (use .last() since both files have a Remove button)
    await page.getByRole('button', { name: 'Remove file' }).last().click();

    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL(/\/gists\/[a-f0-9-]+$/);

    await expect(page.getByText('Updated Playwright E2E Snippet')).toBeVisible();
    await expect(page.getByText('goodbye_world.js')).toBeVisible();
    await expect(page.getByText('style.css')).not.toBeVisible();

    // 4. Delete the Snippet
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    // Should be redirected home
    await expect(page).toHaveURL('/');
  });
});
