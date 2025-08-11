import os from 'os';
import { CPU_ANALYTICS } from '../constants.js';

// Returns recommended/effective concurrency and RAM stats
function getConcurrencyLimits() {
  const cpuCoreCount = os.cpus().length;
  const recommendedMaxConcurrency = cpuCoreCount * 2;

  const environmentConcurrencyCap = process.env.MAX_CONCURRENCY !== undefined
    ? Number(process.env.MAX_CONCURRENCY)
    : null;

  const effectiveConcurrencyUsage = environmentConcurrencyCap !== null
    ? environmentConcurrencyCap
    : recommendedMaxConcurrency;

  const totalSystemRAMInGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  const availableFreeRAMInGB = Math.round(os.freemem() / 1024 / 1024 / 1024);
  const freeRAMPercent = Math.round((os.freemem() / os.totalmem()) * 100);

  return {
    platform: os.platform(),
    architecture: os.arch(),
    cpu_cores_detected: cpuCoreCount,
    recommended_max_concurrency: recommendedMaxConcurrency,
    environment_concurrency_cap: environmentConcurrencyCap,
    effective_concurrency_usage: effectiveConcurrencyUsage,
    total_system_RAM_in_GB: totalSystemRAMInGB,
    available_free_RAM_in_GB: availableFreeRAMInGB,
    free_RAM_percent: freeRAMPercent,
  };
}

// Internal: read aggregate CPU times
function readCpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    const times = cpu.times;
    idle += times.idle;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
  }
  return { idle, total };
}

// Samples CPU usage over a short interval (default 100ms)
async function getCPUUsagePercent(sampleMs = 100) {
  const start = readCpuTimes();
  await new Promise(resolve => setTimeout(resolve, sampleMs));
  const end = readCpuTimes();

  const idleDiff = end.idle - start.idle;
  const totalDiff = end.total - start.total;
  if (totalDiff <= 0) return 0;

  const usage = 100 * (1 - idleDiff / totalDiff);
  return Math.max(0, Math.min(100, Number(usage.toFixed(2))));
}

function getMemoryUsagePercent() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const pct = (used / total) * 100;
  return Math.max(0, Math.min(100, Number(pct.toFixed(2))));
}

function getFreeMemoryMB() {
  return Math.round(os.freemem() / 1024 / 1024);
}

function getLoadAverage() {
  const [one, five, fifteen] = os.loadavg();
  return { one, five, fifteen };
}

// Returns a rich snapshot of the current system metrics
async function getSystemSnapshot() {
  const concurrency = getConcurrencyLimits();
  const cpuUsagePercent = await getCPUUsagePercent();
  const memoryUsagePercent = getMemoryUsagePercent();
  const freeMemoryMB = getFreeMemoryMB();
  const loadavg = getLoadAverage();
  return {
    ...concurrency,
    cpu_usage_percent: cpuUsagePercent,
    memory_usage_percent: memoryUsagePercent,
    free_memory_mb: freeMemoryMB,
    load_average: loadavg,
    system_uptime_seconds: os.uptime(),
  };
}

// Threshold-driven resource health check
async function monitorResources(thresholds = {
  maxCPUUsagePercent: CPU_ANALYTICS.MAX_CPU_USAGE_PERCENT,
  maxMemoryUsagePercent: CPU_ANALYTICS.MAX_MEMORY_USAGE_PERCENT,
  minFreeMemoryMB: CPU_ANALYTICS.MIN_FREE_MEMORY_MB,
}) {
  const cpu = await getCPUUsagePercent();
  const mem = getMemoryUsagePercent();
  const freeMB = getFreeMemoryMB();

  const reasons = [];
  if (cpu > thresholds.maxCPUUsagePercent) {
    reasons.push(`CPU usage ${cpu}% exceeds ${thresholds.maxCPUUsagePercent}%`);
  }
  if (mem > thresholds.maxMemoryUsagePercent) {
    reasons.push(`Memory usage ${mem}% exceeds ${thresholds.maxMemoryUsagePercent}%`);
  }
  if (freeMB < thresholds.minFreeMemoryMB) {
    reasons.push(`Free memory ${freeMB}MB below ${thresholds.minFreeMemoryMB}MB`);
  }

  return {
    ok: reasons.length === 0,
    reasons,
    metrics: {
      cpu_usage_percent: cpu,
      memory_usage_percent: mem,
      free_memory_mb: freeMB,
    },
    thresholds,
  };
}

// Batch sizing heuristic based on current resource usage
async function getOptimalBatchSize() {
  const cpu = await getCPUUsagePercent();
  const mem = getMemoryUsagePercent();

  if (cpu < 50 && mem < 60) return 20;
  if (cpu < 70 && mem < 75) return 16;
  if (cpu < 80 && mem < 85) return 12;
  return 8;
}

// Indicates whether it is safe to spawn more heavy jobs (browsers/workers)
async function canSpawnMoreHeavyTasks(thresholds = {
  maxCPUUsagePercent: 80,
  maxMemoryUsagePercent: 85,
  minFreeMemoryMB: 1024,
}) {
  const { ok } = await monitorResources(thresholds);
  return ok;
}

const CPUAnalytics = {
  getConcurrencyLimits,
  getCPUUsagePercent,
  getMemoryUsagePercent,
  getFreeMemoryMB,
  getLoadAverage,
  getSystemSnapshot,
  monitorResources,
  getOptimalBatchSize,
  canSpawnMoreHeavyTasks,
};

export { CPUAnalytics };
