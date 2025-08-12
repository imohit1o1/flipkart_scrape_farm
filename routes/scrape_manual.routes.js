import express from 'express';
import { validationMiddleware } from '../middlewares/index.js';
import { singleUserValidation } from '../validations/index.js';
import { ReportController } from '../controllers/index.js';

const router = express.Router();

// POST - Submit manual scraping job
router.post('/', singleUserValidation(), validationMiddleware, ReportController.scrapeManual);


export { router as scrapeManualRouter };