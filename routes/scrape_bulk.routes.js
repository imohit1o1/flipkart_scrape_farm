import express from 'express';
import { validationMiddleware } from '../middlewares/index.js';
import { bulkUserValidation } from '../validations/index.js';
import { ReportController } from '../controllers/index.js';

const router = express.Router();


// POST - Submit bulk scraping job
router.post('/', bulkUserValidation, validationMiddleware, ReportController.scrapeBulk);


export { router as scrapeBulkRouter };