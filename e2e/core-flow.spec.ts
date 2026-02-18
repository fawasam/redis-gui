import { test, expect } from '@playwright/test';

test.describe('Redis GUI E2E Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock connection list API
        await page.route('/api/redis/connection', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        { _id: 'mock-conn-id', name: 'Local Test', host: 'localhost', port: 6379, db: 0 }
                    ]),
                });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ _id: 'mock-conn-id', name: 'Added Connection', host: 'localhost', port: 6379, db: 0 }),
                });
            } else {
                await route.continue();
            }
        });

        // Mock connect API
        await page.route('/api/redis/connection/connect', async (route) => {
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, id: 'mock-conn-id' }),
            });
        });

        // Mock keys scan API
        await page.route('/api/redis/scan*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    cursor: '0',
                    keys: [
                        { key: 'test:key:1', type: 'string' },
                        { key: 'test:key:2', type: 'hash' }
                    ]
                }),
            });
        });

        // Mock key details API
        await page.route('/api/redis/key*', async (route) => {
            const url = new URL(route.request().url());
            if (url.searchParams.get('key') === 'test:key:1') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        key: 'test:key:1',
                        type: 'string',
                        value: 'Hello World',
                        ttl: -1
                    }),
                });
            } else {
                await route.continue();
            }
        });

         // Mock update key API
         await page.route('/api/redis/key', async (route) => {
            if (route.request().method() === 'PUT') {
                 await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true }),
                });
            } else {
                await route.continue();
            }
        });
    });

    test('should navigate, select connection, view keys, and edit value', async ({ page }) => {
        // 1. Visit Home
        await page.goto('/');
        await expect(page).toHaveTitle(/Redis Desktop Viewer/);

        // 2. Click connection switcher (it should be listing 'Local Test' based on mock)
        // Wait for connection list to load
        // Assuming there is a select or button to open connection list
        const connectionSwitcher = page.locator('button', { hasText: 'Local Test' }).or(page.locator('button', { hasText: 'Select Connection' }));
        await expect(connectionSwitcher).toBeVisible();
        await connectionSwitcher.click();

        // 3. Select the connection (if dropdown) or verify it's active
        // If the state is managed, we might need to click "Connect"
        const connectBtn = page.getByRole('button', { name: 'Local Test' });
        if (await connectBtn.isVisible()) {
             await connectBtn.click();
        }

        // 4. Verify keys are loaded
        const keyItem = page.getByText('test:key:1');
        await expect(keyItem).toBeVisible();

        // 5. Click a key to view details
        await keyItem.click();

        // 6. Verify value is displayed
        // Since monaco is complex to test, we look for the value in the DOM if possible or fallback to specific container
        // Assuming a simple textarea or div for now based on typical editor implementations
        
        // Wait for editor to load content
        // Note: Monaco editor content is hard to select directly by text sometimes, but let's try broadly
        await expect(page.getByText('Hello World', { exact: false })).toBeVisible();

        // 7. Edit value (simplified: assume a save button exists and we click it)
        // Mocked PUT request ensures success
        const saveBtn = page.getByRole('button', { name: 'Save Changes' });
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // 8. Verify success toast or notification
        await expect(page.getByText('Key updated successfully')).toBeVisible();
    });
});
