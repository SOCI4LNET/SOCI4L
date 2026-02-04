import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {

    test('should navigate to docs page', async ({ page }) => {
        await page.goto('/docs');

        // Verify docs page loads
        await expect(page.locator('body')).toBeVisible();

        // Should have some content (not a blank page)
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(100); // Has substantial content
    });

    test('should handle 404 gracefully', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');

        // Next.js should return 404 page
        expect(response?.status()).toBe(404);

        // Verify 404 page renders (not a blank screen)
        await expect(page.locator('body')).toBeVisible();
    });

});

test.describe('Profile Discovery Tests', () => {

    test('should load profile page for any address', async ({ page }) => {
        // Use a random address
        const randomAddress = '0x0000000000000000000000000000000000000001';

        await page.goto(`/p/${randomAddress}`);

        // Page should load without crashing
        await expect(page.locator('body')).toBeVisible();

        // Should have some content
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
    });

    test('should load dashboard for valid address', async ({ page }) => {
        // Use a known address
        const testAddress = '0x8ab00455c7a6a6176d9d23f46dc5af8a5d4f1dc7';

        await page.goto(`/dashboard/${testAddress}`);

        // Dashboard should load
        await expect(page.locator('body')).toBeVisible();

        // Should have content
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

});
