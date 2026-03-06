import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1, // Disable parallel tests to prevent DB locking conflicts
  reporter: 'html',
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../server && npm run dev',
      port: 3001,
      timeout: 10000,
      reuseExistingServer: !process.env.CI,
      env: {
        SNIPPETBIN_DB_PATH: path.join(__dirname, '..', 'server', 'data', 'e2e.db'),
        PORT: '3001'
      }
    },
    {
      command: 'npm run dev',
      port: 5173,
      timeout: 10000,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
