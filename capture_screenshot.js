
import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Capture Console Logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
        page.on('requestfailed', request => console.error('FAILED REQUEST:', request.url(), request.failure().errorText));

        console.log('Navigating to http://localhost:4200...');
        await page.setViewport({ width: 1280, height: 800 });

        // Increased timeout and changed waitUntil to networkidle2 to be more robust
        await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'screenshot_error_debug.png', fullPage: true });

        await browser.close();
        console.log('Screenshot saved to screenshot_error_debug.png');
    } catch (error) {
        console.error('Error executing script:', error);
        process.exit(1);
    }
})();
