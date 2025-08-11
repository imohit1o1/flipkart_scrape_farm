import express from 'express';
import { scrapeSingleRouter } from './scrape_single.routes.js';
import { scrapeParallelRouter } from './scrape_parallel.routes.js';
import { progressRouter } from './progress.routes.js';
import { reportTypeRouter } from './report_type.routes.js';

const router = express.Router();


//* Single user scraping
router.use('/scrape/single', scrapeSingleRouter);

//* Parallel/bulk user scraping
router.use('/scrape/parallel', scrapeParallelRouter);

//* Progress
router.use('/progress', progressRouter);

//* Flipkart Report Types (Admin)
router.use('/report-types', reportTypeRouter);


// export { mainDocsRouter } from "./docs.routes.js";
// export { systemInfoRouter } from "./system_info.routes.js"
export { router as routes };
