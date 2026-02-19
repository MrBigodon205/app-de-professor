import { test, expect } from '@playwright/test';

test('Visual Check for Blinks/Flicadas', async ({ page }) => {
    // 1. Go to Login Page
    await page.goto('/');

    // Check if we are already logged in (persistence) or need to login
    const isLoginPage = await page.locator('input[type="email"]').count() > 0;

    if (isLoginPage) {
        console.log('Logging in...');
        await page.fill('input[type="email"]', 'admin@acerta.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');
    }

    // 2. Wait for Dashboard
    await expect(page.locator('text=Início').or(page.locator('text=Dashboard'))).toBeVisible({ timeout: 15000 });

    // 3. Navigation Stress Test (to trigger blinks)
    console.log('Starting Navigation Stress Test...');

    // Navigate to Timetable
    await page.goto('/timetable');
    await expect(page).toHaveURL(/.*timetable/);
    await page.waitForTimeout(1000); // Visual check pause

    // Navigate to Grades/Boletim (if link exists in menu, or direct)
    // We'll use direct navigation to be faster and stress the router
    await page.goto('/grades');
    // If /grades doesn't exist, it might 404, so let's try a known route like /attendance
    // Adjust based on actual routes. Assuming /attendance exists.
    await page.goto('/attendance');
    await page.waitForTimeout(1000);

    // Back to Dashboard
    await page.goto('/');
    await page.waitForTimeout(1000);

    // 4. Scroll Test
    console.log('Scrolling...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    console.log('Test Complete. Check trace for blinks.');
});
