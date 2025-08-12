import express from 'express';
import { SystemMonitorController } from '../controllers/index.js';

const router = express.Router();

// GET - Current CPU usage
router.get('/cpu', SystemMonitorController.getCpuUsage);

// GET - Current memory usage
router.get('/memory', SystemMonitorController.getMemoryUsage);

// GET - Optimal batch size
router.get('/batch-size', SystemMonitorController.getOptimalBatchSize);

// GET - Worker capacity check
router.get('/worker-capacity', SystemMonitorController.getWorkerCapacity);

// GET - Complete system snapshot
router.get('/snapshot', SystemMonitorController.getSystemSnapshot);

// POST - Reset monitoring history
router.post('/reset', SystemMonitorController.resetMonitoring);

export { router as systemMonitorRouter };