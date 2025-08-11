import { TIMEOUT_MS } from "../constants.js";

// Browser configuration settings
export const BROWSER_CONFIG = {
    launchOptions: {
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--start-maximized',
            '--disable-popup-blocking',
            '--disable-notifications',
            '--disable-infobars',
            '--disable-translate',
            '--allow-running-insecure-content',
            '--disable-save-password-bubble',
            '--disable-site-isolation-trials',
            '--disable-features=TranslateUI,IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled'
        ]
    },
    navigationTimeout: TIMEOUT_MS.NAVIGATION,
    url: "https://www.seller.flipkart.com",
    defaultViewport: null
};
