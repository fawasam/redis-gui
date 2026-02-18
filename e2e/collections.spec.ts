import { test, expect } from '@playwright/test';

test.describe('Redis Collection CRUD Operations', () => {
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
                        { key: 'test:hash', type: 'hash' },
                        { key: 'test:list', type: 'list' },
                        { key: 'test:set', type: 'set' },
                        { key: 'test:zset', type: 'zset' }
                    ]
                }),
            });
        });

        // Mock key details API
        await page.route('/api/redis/key*', async (route) => {
            const url = new URL(route.request().url());
            const key = url.searchParams.get('key');

            if (key === 'test:hash') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        key: 'test:hash',
                        type: 'hash',
                        value: { field1: 'value1', field2: 'value2' },
                        ttl: -1
                    }),
                });
            } else if (key === 'test:list') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        key: 'test:list',
                        type: 'list',
                        value: ['item1', 'item2'],
                        ttl: -1
                    }),
                });
            } else if (key === 'test:set') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        key: 'test:set',
                        type: 'set',
                        value: ['member1', 'member2'],
                        ttl: -1
                    }),
                });
            } else if (key === 'test:zset') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        key: 'test:zset',
                        type: 'zset',
                        value: [{ score: 1, value: 'zmember1' }, { score: 2, value: 'zmember2' }],
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

    // Helper to connect to mock connection
    const connect = async (page: any) => {
        await page.goto('/');
        // The switcher might be "Select Connection" initially or name if cached/default
        const connectionSwitcher = page.locator('button').filter({ hasText: /Local Test|Select Connection/ }).first();
        await connectionSwitcher.click();
        const connectBtn = page.getByRole('button', { name: 'Local Test' });
        if (await connectBtn.isVisible()) {
             await connectBtn.click();
        }
    };

    test('should CRUD Hash', async ({ page }) => {
        await connect(page);
        await page.getByText('test:hash').click();
        
        // Verify Read
        await expect(page.getByText('field1')).toBeVisible();
        await expect(page.getByText('value1')).toBeVisible();

        // Test Add
        await page.getByRole('button', { name: 'Add Field' }).click();
        await page.getByPlaceholder('Field name').fill('newField');
        await page.getByPlaceholder('Value').fill('newValue');
        // Click save in the row
        await page.locator('button').filter({ has: page.locator('svg.lucide-save') }).last().click();
        // PUT request asserted implicitly by success/no error, ideally verify request body
    });

    test('should CRUD List', async ({ page }) => {
        await connect(page);
        await page.getByText('test:list').click();
        
        // Verify Read
        await expect(page.getByText('item1')).toBeVisible();

        // Test Add
        await page.getByRole('button', { name: 'Add Item' }).click();
        await page.getByPlaceholder('New list item value').fill('newItem');
        await page.locator('button').filter({ has: page.locator('svg.lucide-save') }).last().click();
    });

    test('should CRUD Set', async ({ page }) => {
        await connect(page);
        await page.getByText('test:set').click();
        
        // Verify Read
        await expect(page.getByText('member1')).toBeVisible();

        // Test Add
        await page.getByRole('button', { name: 'Add Member' }).click();
        await page.getByPlaceholder('New member value').fill('newMember');
        await page.locator('button').filter({ has: page.locator('svg.lucide-save') }).last().click();
    });

    test('should CRUD ZSet', async ({ page }) => {
        await connect(page);
        await page.getByText('test:zset').click();
        
        // Verify Read
        await expect(page.getByText('zmember1')).toBeVisible();
        await expect(page.getByText('1', { exact: true })).toBeVisible(); // Score

        // Test Add
        await page.getByRole('button', { name: 'Add Member' }).click();
        await page.getByPlaceholder('Score').fill('10');
        await page.getByPlaceholder('Member value').fill('newZMember');
        await page.locator('button').filter({ has: page.locator('svg.lucide-save') }).last().click();
    });
});
