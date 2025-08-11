import { ENTITY_PREFIXES, LOG_ACTIONS } from '../constants.js';
import { logger, DelayManager } from './index.js';

/**
 * Utility class for finding elements on the page
 */
const ElementFinder = {
    /**
     * Find element by text content
     * @param {Page} page - Puppeteer page object
     * @param {string} selector - CSS selector
     * @param {string} text - Text to match
     * @returns {Promise<ElementHandle|null>} - Found element or null
     */
    async findElementByText(page, selector, text) {
        try {
            await DelayManager.delay(DelayManager.DELAY_TYPES.SHORT);
            const elements = await page.$$(selector);
            for (const element of elements) {
                const elementText = await page.evaluate(el => el.textContent.trim(), element);
                if (elementText === text) {
                    logger.info(`${ENTITY_PREFIXES.ELEMENT_FINDER} ${LOG_ACTIONS.COMPLETED} Found element with text: ${text}`);
                    return element;
                }
            }
            logger.warn(`${ENTITY_PREFIXES.ELEMENT_FINDER} ${LOG_ACTIONS.NOT_FOUND} Element with text "${text}" not found`);
            return null;
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.ELEMENT_FINDER} ${LOG_ACTIONS.FAILED} Error finding element by text: ${error.message}`);
            return null;
        }
    }
};

export { ElementFinder }; 