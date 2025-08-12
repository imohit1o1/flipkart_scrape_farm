import express from 'express';
import { scrapeManualRouter } from './scrape_manual.routes.js';
import { scrapeBulkRouter } from './scrape_bulk.routes.js';
import { progressRouter } from './progress.routes.js';
import { reportTypeRouter } from './report_type.routes.js';
import { systemMonitorRouter } from './system_monitor.routes.js';

const router = express.Router();


//* Single user scraping
router.use('/scrape/manual', scrapeManualRouter);

//* Parallel/bulk user scraping
router.use('/scrape/bulk', scrapeBulkRouter);

//* Progress
router.use('/progress', progressRouter);

//* Flipkart Report Types (Admin)
router.use('/report-types', reportTypeRouter);


// export { mainDocsRouter } from "./docs.routes.js";
router.use('/system-monitor', systemMonitorRouter);
export { router as routes };
