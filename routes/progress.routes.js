import express from 'express';

const router = express.Router();

// // Get complete progress data for a job
// router.get('/:jobId',
//     ValidationManager.validateJobIdParam,
//     ProgressController.getJobProgress
// );

// // Get progress summary for a job
// router.get('/:jobId/summary',
//     ValidationManager.validateJobIdParam,
//     ProgressController.getJobProgressSummary
// );

// // Get detailed operations progress for a job
// router.get('/:jobId/operations',
//     ValidationManager.validateJobIdParam,
//     ProgressController.getJobOperationsProgress
// );

// // Get list of all jobs with progress summaries
// router.get('/list',
//     ValidationManager.validateProgressListQuery,
//     ProgressController.getJobsList
// );

export { router as progressRouter }; 