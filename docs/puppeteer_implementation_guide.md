# **Puppeteer Multi-Core Scraping Implementation Guide**

## **System Overview**

This document explains how to implement the multi-core scraping system using Puppeteer plugins and a priority-based queue system, along with the required file worker pool and file queue for optimal performance.

---

## **Architecture Components**

### **Main Process Structure**
```
Main Process
├── Queue Management (Manual + Bulk)
├── Puppeteer Cluster (Multiple Browsers)
├── Job Coordination
├── File Queue (NEW!)
└── File Worker Pool (NEW!)
```

### **Complete System Flow**
```
[Manual Queue]   [Bulk Queue]
      |                |
      v                v
   [Scraping Jobs] (Browsers)
      |
      v
   [File Queue]  ← NEW!
      |
      v
   [File Workers] (Processes/Threads)
```

### **Key Benefits of This Approach**
✅ **No dedicated auto-download worker needed**  
✅ **Auto-download is just re-queuing the same task**  
✅ **Same workers handle both request and download phases**  
✅ **Cooldown logic is just timing management**  
✅ **File operations don't block scraping**  
✅ **Maximum resource utilization**  

---

## **Queue System Implementation**

### **1. Dual Queue Architecture**
```javascript
// Priority-based queue system
const createQueueManager = () => {
    const manualQueue = [];      // High priority - single routes
    const bulkQueue = [];        // Lower priority - bulk operations
    const fileQueue=[];          // medium priority- backgournd process using worker
    
    return {
        manualQueue,
        bulkQueue
        fileQueue
    };
};
```

### **2. Priority Handling Logic**
```javascript
// Single queue always has high priority
const addToQueue = (queueManager, job) => {
    if (job.type === 'single') {
        // Single routes get high priority
        queueManager.manualQueue.unshift(job);  // Add to front
    } else {
        // Bulk operations go to lower priority queue
        queueManager.bulkQueue.push(job);
    }
};

// Next batch size is determined dynamically by system monitoring
const getNextBatch = (queueManager, systemMonitor) => {
    const batch = [];
    const maxBatchSize = systemMonitor.getOptimalBatchSize(); // Dynamic based on CPU/RAM
    
    // First, fill batch with high-priority single routes
    while (batch.length < maxBatchSize && queueManager.manualQueue.length > 0) {
        batch.push(queueManager.manualQueue.shift());
    }
    
    // Then fill remaining slots with bulk operations
    while (batch.length < maxBatchSize && queueManager.bulkQueue.length > 0) {
        batch.push(queueManager.bulkQueue.shift());
    }
    
    return batch;
};
```

---

## **File Worker Pool & Queue (NEW!)**

### **1. File Queue Implementation**
```javascript
const createFileQueue = () => {
    const tasks = [];
    const processing = new Set();
    const maxConcurrent = 8;  // Separate from browser concurrency
    
    const addTask = (task) => {
        tasks.push({
            id: task.id,
            type: task.type,  // 'download', 'upload', 'db_update'
            data: task.data,
            priority: task.priority || 'normal',
            timestamp: Date.now()
        });
    };
    
    const getNextTask = () => {
        // Prioritize high-priority tasks
        const highPriority = tasks.filter(t => t.priority === 'high');
        if (highPriority.length > 0) {
            const task = highPriority[0];
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            tasks.splice(taskIndex, 1);
            return task;
        }
        
        // Return oldest normal priority task
        return tasks.shift();
    };
    
    const getQueueLength = () => tasks.length;
    const getProcessingCount = () => processing.size;
    const getQueueStatus = () => ({
        pending: tasks.length,
        processing: processing.size,
        total: tasks.length + processing.size
    });
    
    return {
        tasks,
        processing,
        maxConcurrent,
        addTask,
        getNextTask,
        getQueueLength,
        getProcessingCount,
        getQueueStatus
    };
};
```

### **2. File Worker Pool**
```javascript
const createFileWorkerPool = (maxWorkers = 8) => {
    const workers = [];
    const activeWorkers = new Map();
    const fileQueue = createFileQueue();
    
    const initialize = async () => {
        // Spawn file worker processes
        for (let i = 0; i < maxWorkers; i++) {
            const worker = new Worker('./fileWorker.js');
            workers.push(worker);
            
            // Set up message handling
            worker.on('message', (result) => {
                handleWorkerResult(worker, result);
            });
            
            worker.on('error', (error) => {
                handleWorkerError(worker, error);
            });
        }
        
        // Start processing tasks
        startProcessing();
    };
    
    const startProcessing = () => {
        setInterval(() => {
            processNextTask();
        }, 100); // Check every 100ms
    };
    
    const processNextTask = async () => {
        if (activeWorkers.size >= maxWorkers) {
            return; // All workers busy
        }
        
        const task = fileQueue.getNextTask();
        if (!task) {
            return; // No tasks available
        }
        
        // Find available worker
        const availableWorker = workers.find(w => !activeWorkers.has(w));
        if (availableWorker) {
            activeWorkers.set(availableWorker, task.id);
            availableWorker.postMessage(task);
        }
    };
    
    const handleWorkerResult = (worker, result) => {
        const taskId = activeWorkers.get(worker);
        activeWorkers.delete(worker);
        
        // Handle result (update DB, notify main process, etc.)
        console.log(`File task ${taskId} completed:`, result);
    };
    
    const handleWorkerError = (worker, error) => {
        const taskId = activeWorkers.get(worker);
        activeWorkers.delete(worker);
        
        // Handle error (retry, mark as failed, etc.)
        console.error(`File task ${taskId} failed:`, error);
    };
    
    const getPoolStatus = () => ({
        totalWorkers: workers.length,
        activeWorkers: activeWorkers.size,
        availableWorkers: workers.length - activeWorkers.size,
        queueLength: fileQueue.getQueueLength(),
        processingCount: fileQueue.getProcessingCount()
    });
    
    return {
        workers,
        maxWorkers,
        activeWorkers,
        fileQueue,
        initialize,
        startProcessing,
        processNextTask,
        getPoolStatus
    };
};
```

---

## **Puppeteer Cluster Implementation**

### **1. Browser Pool Management**
```javascript
const createPuppeteerCluster = (maxBrowsers = 16) => {
    const browsers = [];
    const availableBrowsers = [];
    const busyBrowsers = new Map(); // jobId -> browser
    
    const initialize = async () => {
        // Launch multiple browser instances
        for (let i = 0; i < maxBrowsers; i++) {
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            browsers.push(browser);
            availableBrowsers.push(browser);
        }
    };
    
    const getClusterStatus = () => ({
        totalBrowsers: browsers.length,
        availableBrowsers: availableBrowsers.length,
        busyBrowsers: busyBrowsers.size,
        utilization: (busyBrowsers.size / browsers.length) * 100
    });
    
    return {
        browsers,
        maxBrowsers,
        availableBrowsers,
        busyBrowsers,
        initialize,
        getClusterStatus
    };
};
```

### **2. Browser Assignment Strategy**
```javascript
const assignBrowserToJob = async (cluster, jobId) => {
    if (cluster.availableBrowsers.length === 0) {
        throw new Error('No available browsers');
    }
    
    const browser = cluster.availableBrowsers.pop();
    cluster.busyBrowsers.set(jobId, browser);
    
    return browser;
};

const releaseBrowser = async (cluster, jobId) => {
    const browser = cluster.busyBrowsers.get(jobId);
    if (browser) {
        cluster.busyBrowsers.delete(jobId);
        cluster.availableBrowsers.push(browser);
    }
};
```

---

## **Job Coordination System**

### **1. Job Lifecycle Management**
```javascript
const createJobCoordinator = (queueManager, puppeteerCluster, fileWorkerPool) => {
    const activeJobs = new Map();
    const jobResults = new Map();
    
    const processBatch = async () => {
        const batch = getNextBatch(queueManager, systemMonitor); // Pass systemMonitor
        
        // Process all jobs in parallel
        const promises = batch.map(job => processJob(job));
        await Promise.allSettled(promises);
    };
    
    const processJob = async (job) => {
        try {
            // Phase 1: Scraping
            const browser = await assignBrowserToJob(puppeteerCluster, job.id);
            const scrapedData = await scrapeData(browser, job);
            
            // Phase 2: Queue file operations (don't block scraping)
            if (job.requiresDownload) {
                queueFileOperations(job, scrapedData);
            }
            
            // Store results
            jobResults.set(job.id, scrapedData);
            
        } finally {
            // Always release browser immediately
            await releaseBrowser(puppeteerCluster, job.id);
        }
    };
    
    const queueFileOperations = (job, scrapedData) => {
        // Add file operations to file queue (non-blocking)
        fileWorkerPool.fileQueue.addTask({
            id: `${job.id}_download`,
            type: 'download',
            data: { job, scrapedData },
            priority: 'high'
        });
    };
    
    return {
        activeJobs,
        jobResults,
        processBatch,
        processJob,
        queueFileOperations
    };
};
```

### **2. Auto-Download Logic (Updated)**
```javascript
const queueDownload = (originalJob, scrapedData) => {
    // Create download job with operation tagging
    const downloadJob = {
        ...originalJob,
        id: `${originalJob.id}_download`,
        operation: 'download',  // NEW: operation field
        mode: 'auto',           // NEW: mode field
        phase: 'download',
        scrapedData: scrapedData,
        priority: 'high'        // Downloads get high priority
    };
    
    // Add to bulk queue with operation: "download"
    queueManager.bulkQueue.push(downloadJob);
};
```

---

## **Resource Management & Monitoring**

### **1. System Resource Monitoring**
```javascript
const createResourceMonitor = () => {
    const cpuThreshold = 80;      // Pause if >80%
    const memoryThreshold = 85;   // Pause if >85%
    const minFreeMemory = 1024;   // MB
    
    const monitorResources = async () => {
        const cpuUsage = await getCPUUsage();
        const memoryUsage = await getMemoryUsage();
        const freeMemory = await getFreeMemory();
        
        if (cpuUsage > cpuThreshold || 
            memoryUsage > memoryThreshold || 
            freeMemory < minFreeMemory) {
            return false; // Pause spawning new workers
        }
        
        return true; // Safe to spawn new workers
    };
    
    const getOptimalBatchSize = () => {
        // Dynamic batch size based on current system resources
        const cpuUsage = getCPUUsage();
        const memoryUsage = getMemoryUsage();
        
        if (cpuUsage < 50 && memoryUsage < 60) {
            return 20; // High capacity - larger batches
        } else if (cpuUsage < 70 && memoryUsage < 75) {
            return 16; // Medium capacity - standard batches
        } else if (cpuUsage < 80 && memoryUsage < 85) {
            return 12; // Lower capacity - smaller batches
        } else {
            return 8;  // Limited capacity - minimal batches
        }
    };
    
    const getCPUUsage = async () => {
        // Implementation to get current CPU usage
        return 0; // Placeholder
    };
    
    const getMemoryUsage = async () => {
        // Implementation to get current memory usage
        return 0; // Placeholder
    };
    
    const getFreeMemory = async () => {
        // Implementation to get free memory
        return 0; // Placeholder
    };
    
    return {
        cpuThreshold,
        memoryThreshold,
        minFreeMemory,
        monitorResources,
        getOptimalBatchSize,
        getCPUUsage,
        getMemoryUsage,
        getFreeMemory
    };
};
```

### **2. Dynamic Scaling Logic**
```javascript
const createDynamicScaler = (resourceMonitor, fileWorkerPool) => {
    let scalingEnabled = true;
    
    const checkScaling = async () => {
        if (!scalingEnabled) return;
        
        const canScale = await resourceMonitor.monitorResources();
        const queueLength = fileWorkerPool.fileQueue.tasks.length;
        
        // Scale up if queue is long and resources allow
        if (queueLength > 10 && canScale && 
            fileWorkerPool.activeWorkers.size < fileWorkerPool.maxWorkers) {
            await scaleUp();
        }
        
        // Scale down if queue is short and resources are tight
        if (queueLength < 3 && !canScale && 
            fileWorkerPool.activeWorkers.size > 4) {
            await scaleDown();
        }
    };
    
    const scaleUp = async () => {
        // Add new file worker if possible
        console.log('Scaling up file workers');
    };
    
    const scaleDown = async () => {
        // Reduce file workers if possible
        console.log('Scaling down file workers');
    };
    
    return {
        scalingEnabled,
        checkScaling,
        scaleUp,
        scaleDown
    };
};
```

---

## **Multi-Core Utilization**

### **1. How It Works**
- **Each Puppeteer browser is a separate OS process**
- **OS automatically schedules these processes across all CPU cores**
- **File workers run in separate processes/threads**
- **No manual CPU core management needed**
- **Natural load balancing across your 8-core CPU**

### **2. Concurrency Control**
```javascript
// Optimal configuration for 8-core CPU
const SYSTEM_CONFIG = {
    resourceLimits: {
        maxCPUUsage: 80,       // Pause if >80%
        maxMemoryUsage: 85,    // Pause if >85%
        minFreeMemory: 1024    // MB
    }
};
```

---

## **Cooldown and Timing Management**

### **1. Built-in Cooldown Logic**
```javascript
const createCooldownManager = () => {
    const lastRequestTime = new Map();  // per-domain
    const cooldownPeriods = new Map();  // per-domain
    
    const enforceCooldown = async (domain) => {
        const lastTime = lastRequestTime.get(domain) || 0;
        const cooldown = cooldownPeriods.get(domain) || 1000; // 1 second default
        
        const timeSinceLastRequest = Date.now() - lastTime;
        
        if (timeSinceLastRequest < cooldown) {
            const waitTime = cooldown - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        lastRequestTime.set(domain, Date.now());
    };
    
    return {
        lastRequestTime,
        cooldownPeriods,
        enforceCooldown
    };
};
```

### **2. Integration with Job Processing**
```javascript
const processJobWithCooldown = async (job, cooldownManager) => {
    // Enforce cooldown before processing
    await cooldownManager.enforceCooldown(job.domain);
    
    // Process the job
    const browser = await assignBrowserToJob(puppeteerCluster, job.id);
    // ... rest of processing
};
```

---

## **Complete System Flow**

### **1. Job Submission**
```
User Request → Queue Manager → Priority Assignment → Queue Placement
```

### **2. Batch Processing**
```
Queue Manager → Get Next Batch → Job Coordinator → Parallel Processing
```

### **3. Browser Management**
```
Job Coordinator → Puppeteer Cluster → Browser Assignment → Scraping → Browser Release
```

### **4. File Operations (Non-blocking)**
```
Scraping Complete → Queue File Operations → File Queue → File Workers Process
```

---

## **Configuration Example**

### **1. System Settings**
```javascript
const SYSTEM_CONFIG = {
    resourceLimits: {
        maxCPUUsage: 80,       // Pause if >80%
        maxMemoryUsage: 85,    // Pause if >85%
        minFreeMemory: 1024    // MB
    }
};
```

### **2. Queue Priorities**
```javascript
const QUEUE_PRIORITIES = {
    SINGLE_ROUTE: 'high',      // Manual queue
    BULK_OPERATION: 'low',     // Bulk queue
    DOWNLOAD: 'high'           // Auto-download jobs
};
```

---

## **Key Implementation Points**

### **1. What Makes This Multi-Core**
- **Multiple Puppeteer processes** = Multiple OS processes for scraping
- **File worker pool** = Separate processes/threads for file operations
- **OS scheduling** = Automatic CPU core distribution
- **Parallel job processing** = Maximum resource utilization

### **2. What Makes This Efficient**
- **Browser reuse** = No process spawning overhead
- **File worker pool** = File operations don't block scraping
- **Priority queuing** = Important jobs get processed first
- **Auto-download integration** = Seamless two-phase processing

### **3. What Makes This Scalable**
- **Configurable browser count** = Adjust based on server capacity
- **Dynamic file worker scaling** = Adjust based on queue length and resources
- **Resource monitoring** = Prevent system overload
- **Queue management** = Handle varying load levels

---

## **Monitoring and Metrics**

### **1. Key Metrics to Track**
```javascript
const getMetrics = async (puppeteerCluster, queueManager, fileWorkerPool, resourceMonitor) => ({
    // Browser metrics
    browsersActive: puppeteerCluster.busyBrowsers.size,
    browsersAvailable: puppeteerCluster.availableBrowsers.length,
    browserUtilization: puppeteerCluster.getClusterStatus().utilization,
    
    // Queue metrics
    manualQueueLength: queueManager.manualQueue.length,
    bulkQueueLength: queueManager.bulkQueue.length,
    fileQueueLength: fileWorkerPool.fileQueue.getQueueLength(),
    fileQueueStatus: fileWorkerPool.fileQueue.getQueueStatus(),
    
    // Worker metrics
    fileWorkersActive: fileWorkerPool.activeWorkers.size,
    fileWorkersTotal: fileWorkerPool.workers.length,
    fileWorkerPoolStatus: fileWorkerPool.getPoolStatus(),
    
    // Job metrics
    activeJobs: activeJobs.size,
    
    // System metrics
    cpuUsage: await resourceMonitor.getCPUUsage(),
    memoryUsage: await resourceMonitor.getMemoryUsage(),
    freeMemory: await resourceMonitor.getFreeMemory(),
    optimalBatchSize: resourceMonitor.getOptimalBatchSize()
});
```

### **2. Performance Indicators**
- **Throughput**: Jobs processed per minute
- **Browser utilization**: Percentage of browsers actively working
- **File worker utilization**: Percentage of file workers actively working
- **Queue efficiency**: Time jobs spend waiting vs. processing
- **Resource usage**: CPU and memory utilization
- **File operation latency**: Time from queue to completion

---

## **Implementation Priority**

1. **Phase 1**: Implement file worker pool and file queue
2. **Phase 2**: Add resource monitoring and basic scaling
3. **Phase 3**: Implement dynamic worker scaling and advanced monitoring
4. **Phase 4**: Optimize and fine-tune based on production metrics

---

**This implementation gives you the multi-core scraping system you already have, with the added benefits of priority queuing, efficient browser management, seamless auto-download integration, AND the required file worker pool and queue system for maximum performance and stability.** 