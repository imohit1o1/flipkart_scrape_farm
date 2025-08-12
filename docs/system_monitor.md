# System Monitor Service

A lightweight, real-time system monitoring service for Node.js applications that provides CPU usage, memory monitoring, and resource-aware batch size optimization.

## Features

- **Real-time CPU Usage**: Accurate CPU usage calculation using delta measurements
- **Memory Monitoring**: Current memory usage and available memory tracking
- **Dynamic Batch Sizing**: Optimal batch size calculation based on system load
- **Worker Capacity Check**: Determine if system can handle more background workers
- **Resource Status Classification**: Categorize system load (LOW, MEDIUM, HIGH, CRITICAL)
- **System Snapshot**: Comprehensive system metrics in a single call

## Installation

```javascript
import { SystemMonitorService } from './services/system_monitor.service.js';
```

## Usage

### Basic CPU Monitoring

```javascript
// Get current CPU usage percentage (0-100)
const cpuUsage = await SystemMonitorService.getCurrentCpuUsage();
console.log(`CPU Usage: ${cpuUsage}%`);
```

### Memory Monitoring

```javascript
// Get current memory usage percentage
const memoryUsage = SystemMonitorService.getCurrentMemoryUsage();
console.log(`Memory Usage: ${memoryUsage}%`);

// Get free memory in MB
const freeMemoryMB = SystemMonitorService.getFreeMemoryMB();
console.log(`Free Memory: ${freeMemoryMB}MB`);
```

### Dynamic Batch Sizing

```javascript
// Get optimal batch size based on current system load
const batchSize = await SystemMonitorService.getOptimalBatchSize();
console.log(`Optimal Batch Size: ${batchSize}`);
```

### Worker Capacity Check

```javascript
// Check if system can handle more background workers
const canSpawn = await SystemMonitorService.canSpawnMoreWorkers();
if (canSpawn) {
    console.log('System can handle more workers');
} else {
    console.log('System at capacity - avoid spawning more workers');
}
```

### Complete System Snapshot

```javascript
// Get comprehensive system metrics
const snapshot = await SystemMonitorService.getSystemSnapshot();
console.log('System Snapshot:', snapshot);

/*
Output example:
{
  timestamp: "2024-01-15T10:30:00.000Z",
  cpu: { current: 45 },
  memory: {
    current: 68,
    freeMemoryMB: 2048,
    totalMemoryMB: 8192
  },
  system: {
    loadAverage: [1.2, 1.5, 1.8],
    uptime: 86400,
    platform: "linux",
    cpuCount: 8
  },
  recommendations: {
    optimalBatchSize: 16,
    canSpawnMoreWorkers: true,
    resourceStatus: "MEDIUM"
  }
}
*/
```

## Configuration

The service uses `SYSTEM_RESOURCE_CONFIG` from your constants file:

```javascript
// constants.js
export const SYSTEM_RESOURCE_CONFIG = {
  BATCH_THRESHOLDS: {
    LOW_LOAD: { CPU: 50, MEMORY: 60 },
    MEDIUM_LOAD: { CPU: 70, MEMORY: 75 },
    HIGH_LOAD: { CPU: 80, MEMORY: 85 }
  },
  BATCH_SIZES: {
    MAXIMUM: 20,
    STANDARD: 16,
    REDUCED: 12,
    MINIMUM: 8
  },
  LIMITS: {
    MAX_CPU_USAGE_PERCENT: 80,
    MAX_MEMORY_USAGE_PERCENT: 85
  }
};
```

## Resource Status Classifications

| Status | CPU Usage | Memory Usage | Free Memory | Description |
|--------|-----------|--------------|-------------|-------------|
| **LOW** | < 60% | < 70% | > 1GB | Optimal performance |
| **MEDIUM** | 60-80% | 70-85% | 512MB-1GB | Good performance |
| **HIGH** | 80-90% | 85-90% | 256-512MB | Approaching limits |
| **CRITICAL** | > 90% | > 90% | < 256MB | System overloaded |

## API Reference

### Methods

#### `getCurrentCpuUsage()`
- **Returns**: `Promise<number>` - CPU usage percentage (0-100)
- **Description**: Real-time CPU usage calculation using delta measurements
- **Note**: First call returns 0 as baseline is established

#### `getCurrentMemoryUsage()`
- **Returns**: `number` - Memory usage percentage (0-100)
- **Description**: Current memory usage based on total vs free memory

#### `getFreeMemoryMB()`
- **Returns**: `number` - Free memory in megabytes
- **Description**: Available system memory

#### `getOptimalBatchSize()`
- **Returns**: `Promise<number>` - Recommended batch size
- **Description**: Dynamic batch size based on CPU and memory load

#### `canSpawnMoreWorkers()`
- **Returns**: `Promise<boolean>` - True if system can handle more workers
- **Description**: Checks if system resources allow spawning background workers

#### `getSystemSnapshot()`
- **Returns**: `Promise<Object>` - Complete system metrics
- **Description**: Comprehensive system state including recommendations

#### `resetHistory()`
- **Returns**: `void`
- **Description**: Reset internal CPU monitoring state (use when restarting monitoring)

## Integration Examples

### With Queue Manager

```javascript
// Dynamic batch processing
const processJobs = async () => {
  const batchSize = await SystemMonitorService.getOptimalBatchSize();
  const jobs = await getJobsFromQueue(batchSize);
  
  if (jobs.length > 0) {
    await processBatch(jobs);
  }
};
```

### With Worker Pool

```javascript
// Dynamic worker scaling
const scaleWorkers = async () => {
  const canSpawn = await SystemMonitorService.canSpawnMoreWorkers();
  const queueLength = getFileQueueLength();
  
  if (canSpawn && queueLength > 10) {
    spawnNewWorker();
  }
};
```

### Health Check Endpoint

```javascript
// Express.js health check
app.get('/health', async (req, res) => {
  const snapshot = await SystemMonitorService.getSystemSnapshot();
  
  res.json({
    status: snapshot.recommendations.resourceStatus,
    healthy: snapshot.recommendations.resourceStatus !== 'CRITICAL',
    metrics: snapshot
  });
});
```

## Performance Considerations

- **CPU Calculation**: Requires delta measurement, so first call returns 0
- **Memory Overhead**: Minimal - only stores previous CPU state
- **Call Frequency**: Safe to call every 1-5 seconds for real-time monitoring
- **Thread Safety**: Service is stateful but designed for single-threaded Node.js

## Troubleshooting

### CPU Usage Always Returns 0
- **Cause**: First call or recent reset
- **Solution**: Wait for second call to get accurate reading

### High Memory Usage Reported
- **Check**: Verify with system tools (`htop`, `free -m`)
- **Cause**: May include cached memory as "used"

### Batch Size Too Small
- **Check**: Current CPU/memory thresholds in constants
- **Solution**: Adjust `BATCH_THRESHOLDS` values if needed

## Dependencies

- **Node.js**: Built-in `os` module
- **Constants**: `SYSTEM_RESOURCE_CONFIG` from your constants file

## License

Part of Flipkart Scrape Farm project.