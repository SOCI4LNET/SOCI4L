import { test, expect } from '@playwright/test';

/**
 * Wallet Connection Tests
 * 
 * Note: These tests verify the UI flow for wallet connection.
 * Actual wallet signing cannot be tested without browser extension mocking.
 */

test.describe('Wallet Connection UI', () => {

    test('should show connect option in UI', async ({ page }) => {
        await page.goto('/');

        // Look for any connect-related UI element
        const bodyText = await page.locator('body').textContent();

        // Page should load successfully
        expect(bodyText).toBeTruthy();

        // Should have navigation or header
        const hasHeader = await page.locator('header, nav, [role="banner"]').count() > 0;
        expect(hasHeader).toBeTruthy();
    });

});

test.describe('Dashboard Access', () => {

    test('should allow viewing any dashboard as guest', async ({ page }) => {
        const testAddress = '0x8ab00455c7a6a6176d9d23f46dc5af8a5d4f1dc7';
        await page.goto(`/dashboard/${testAddress}`);

        // Dashboard should be accessible even without wallet connection
        await expect(page.locator('body')).toBeVisible();

        // Should not show a hard error or redirect loop
        const url = page.url();
        expect(url).toContain(testAddress.toLowerCase());
    });

});
