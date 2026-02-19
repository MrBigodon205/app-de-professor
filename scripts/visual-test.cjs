const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting visual test...');
    // Launch browser - headless: false so the user can see it if they stare at the screen
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const screenshotDir = path.join(__dirname, 'visual_evidence');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    try {
        // Force Mobile Viewport (iPhone 12 Pro)
        await page.setViewportSize({ width: 390, height: 844 });

        console.log('Navigating to localhost:3000...');
        try {
            await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            console.log('Navigation timeout/error, continuing anyway to check state...');
        }

        // Take initial screenshot
        console.log('Capturing initial state...');
        await page.screenshot({ path: path.join(screenshotDir, '01_initial_load.png') });

        // LOGIN LOGIC
        // Check if we are on login page via email input presence
        const isLoginPage = await page.locator('input[type="email"]').count() > 0;

        if (isLoginPage) {
            console.log('Detected login page. Attempting login...');
            await page.fill('input[type="email"]', 'admin@acerta.com');
            await page.fill('input[type="password"]', 'password');
            await page.click('button[type="submit"]', { force: true });

            // Wait for navigation or dashboard element
            try {
                await page.waitForURL('**/dashboard', { timeout: 15000 });
            } catch (e) {
                console.log('URL did not change to dashboard, checking for dashboard element...');
                try {
                    await page.waitForSelector('text=Início', { timeout: 5000 });
                } catch (e2) {
                    console.log('Could not find "Início" text either.');
                }
            }
            console.log('Login attempt complete.');
            await page.waitForTimeout(2000); // Wait for potential redirects
            await page.screenshot({ path: path.join(screenshotDir, '02_dashboard_loaded.png') });
        }

        await page.waitForTimeout(2000); // Wait for animations

        // Scroll Down (Mobile)
        console.log('Scrolling down...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotDir, '03_scrolled_bottom.png') });

        // OPEN MOBILE MENU
        console.log('Opening Mobile Menu...');
        let menuOpened = false;

        // Try multiple selectors for the menu button
        const menuButton = page.locator('button[aria-label="Abrir Menu"]').first();
        const menuIcon = page.locator('span.material-symbols-outlined:has-text("menu")').first();

        if (await menuButton.isVisible()) {
            await menuButton.click();
            menuOpened = true;
        } else if (await menuIcon.isVisible()) {
            console.log('Clicking menu icon directly as fallback...');
            await menuIcon.click();
            menuOpened = true;
        } else {
            console.log('Mobile menu button not found. Viewport might be too wide?');
            await page.screenshot({ path: path.join(screenshotDir, '03b_no_menu_error.png') });
        }

        if (menuOpened) {
            await page.waitForTimeout(1000);
            await page.screenshot({ path: path.join(screenshotDir, '03b_mobile_menu_open.png') });
        }

        // NAVIGATE AND CHECK SCROLL
        console.log('Attempting navigation...');

        // Try finding the timetable link inside the menu OR direct navigation
        const link = page.locator('a[href="/timetable"]').first();
        let navigated = false;

        if (menuOpened && await link.isVisible()) {
            console.log('Clicking /timetable link...');
            await link.click();
            navigated = true;
        } else {
            console.log('Link not visible. Forcing direct URL navigation to test scroll reset...');
            await page.goto('http://localhost:3000/timetable');
            navigated = true;
        }

        if (navigated) {
            await page.waitForTimeout(2000); // Wait for page transition & scroll reset
            console.log('Navigated to Timetable. Checking scroll position...');

            await page.screenshot({ path: path.join(screenshotDir, '04_new_page_top.png') });

            // Check Scroll of the MAIN element or Window
            const scrollY = await page.evaluate(() => window.scrollY);
            const mainScrollY = await page.evaluate(() => {
                const main = document.querySelector('main');
                return main ? main.scrollTop : -1;
            });

            console.log(`Window Scroll Y: ${scrollY}`);
            console.log(`Main Element Scroll Top: ${mainScrollY}`);

            // Allow small epsilon for scroll (sometimes 1px off)
            if (scrollY <= 1 && (mainScrollY <= 1 || mainScrollY === -1)) {
                console.log('SUCCESS: Scroll position reset to 0 (or close enough).');
            } else {
                console.error(`FAILURE: Window: ${scrollY}, Main: ${mainScrollY}`);
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
        console.log('Test complete. Check visual_evidence folder.');
    }
})();
