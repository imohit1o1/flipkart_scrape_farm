# Queue Manager Documentation

## Overview

The Queue Manager is a two-lane job scheduling system designed for the Flipkart scraping farm. It manages two queues, `manual` and `bulk`, plus a separate file queue. Manual jobs are always processed before bulk jobs. Auto-downloads are scheduled internally after successful requests.

## Architecture

### Queue Structure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Manual (manual)│    │    Bulk (bulk) │    │   File Queue    │
│  High precedence │    │  Lower precedence│   │ Non-blocking ops│
│  Single routes   │    │  Parallel routes │   │ downloads/upload│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Batch Dispatcher│
                    │                 │
                    │ • Resource aware │
                    │ • Manual before  │
                    │   bulk ordering  │
                    └─────────────────┘
```

### Key Features

- Manual before bulk ordering
- Automatic route-based mode: `/scrape/single` → manual; `/scrape/parallel` → bulk
- Resource-aware batch sizing via cpu analytics
- Auto-download scheduling after successful requests
- Exponential backoff retries with configurable attempts/delays
- File operations in separate queue

## Installation & Setup

```javascript
import { createQueueManager } from '../utils/queue_manager.js';
import { RETRY_CONFIG } from '../constants.js';

const queueManager = createQueueManager({
  maxBatchSize: 16,
  retryConfig: RETRY_CONFIG,
  cooldownMs: 1000,
  defaultDownloadDelayMs: 15 * 60 * 1000, // 15 minutes
});
```

## Job Structure

### Basic Job
```javascript
const job = {
  jobId: 'unique_job_id',
  seller_id: 'seller123',
  identifier: 'user@example.com',
  reportType: {
    gst_report:{ enabled:true }
  },
  parameters: {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }
  // Do not send mode/operation; routes decide mode, phases tracked via steps in DB
};
```

### Job with Retry History
```javascript
const jobWithRetries = {
  ...basicJob,
  attempts: 2,
  last_attempt_at: new Date('2024-01-15T10:30:00Z'),
  scheduled_for: new Date('2024-01-15T10:35:00Z'), // retry delay
  error: 'Previous error message'
};
```

## Core APIs

### Enqueue Operations

- addManualJob(job): enqueues to manual
- addBulkJob(job): enqueues to bulk
- addJob(job): backward compatible helper; defaults to bulk
- addJobs(jobs): bulk-enqueue; defaults each to bulk

```javascript
const job1 = queueManager.addManualJob({ /* ... */ });
const job2 = queueManager.addBulkJob({ /* ... */ });
```

### Mode Management

- setMode(jobId, 'manual' | 'bulk')
- bumpJob(jobId) // moves job to start of manual queue and sets mode to manual

```javascript
queueManager.setMode('job_123', 'manual');
queueManager.bumpJob('job_456');
```

### Batch Processing
```javascript
const batch = await queueManager.getNextBatch();
queueManager.reserveBatch(batch);
for (const job of batch) {
  try {
    const result = await processJob(job);
    queueManager.markJobCompleted(job.jobId, result);
  } catch (error) {
    queueManager.markJobFailed(job.jobId, error);
  }
}
```

### Lifecycle Updates
```javascript
queueManager.markJobCompleted('job_123', { files: ['report.xlsx'] });
queueManager.markJobFailed('job_123', new Error('Network timeout'));
queueManager.updateJobProgress('job_123', { 'steps.request.status': 'completed' });
```

### Download Scheduling
- Auto-scheduled after request completion; download jobs are enqueued as mode 'bulk'
```javascript
const downloadJob = queueManager.scheduleDownloadForSuccessfulRequest(requestJob);
const dueDownloads = queueManager.enqueueDueDownloads();
```

### File Queue Operations
```javascript
const fileTasks = queueManager.getNextFileTasks(5);
queueManager.markFileTaskCompleted('download_123', { filePath: '/tmp/report.xlsx' });
```

## Monitoring & Metrics
```javascript
const status = queueManager.getQueuesStatus();
const snapshot = await queueManager.getSystemSnapshot();
const preview = queueManager.getBatchPreview();
const inFlight = queueManager.getInFlightJobs();
const manualJobs = queueManager.getPendingJobs({ mode: 'manual' });
```

## Integration Patterns

### Express Routes
```javascript
// POST /scrape/single → manual
a.post('/scrape/single', async (req, res) => {
  try {
    const job = queueManager.addManualJob({ ...req.body, jobId: generateJobId() });
    res.json({ jobId: job.jobId, status: 'enqueued' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /scrape/parallel → bulk
a.post('/scrape/parallel', async (req, res) => {
  const results = queueManager.addJobs(req.body.map(job => ({ ...job, jobId: generateJobId() })));
  res.json({ results });
});
```

## Best Practices
- Use `/scrape/single` for manual and `/scrape/parallel` for bulk; don’t send mode/operation in payloads
- Always reserve batches before processing
- Monitor system snapshot for resource limits

## Troubleshooting
- Jobs not processing: check cooldowns/scheduled_for and resource thresholds
- Downloads not scheduling: ensure request jobs completed successfully
- Queue starvation: verify route usage (manual vs bulk) and batch sizes 