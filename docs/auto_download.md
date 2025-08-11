
---

Here’s a clear summary of what we **finalized for auto-download and retry logic** regarding queues and tagging:

---

## **Auto-Download & Retry: Final Agreed Approach**

### 1. **Queues**
- **Do NOT create a new queue** for auto-download jobs.
- **Continue using your existing queues:**  
  - `manualQueue` for user/manual jobs  
  - `bulkQueue` for batch/auto jobs

### 2. **Tagging Jobs**
- **Add an `operation` field** to each job object:
  - Values: `"request"`, `"download"`, etc.
- **(Optional) Add a `mode` field** to indicate `"manual"`, `"bulk"`, or `"auto"` for further clarity.

### 3. **Dispatcher Logic**
- **Prioritize jobs as follows:**
  1. Always process `manualQueue` first.
  2. In `bulkQueue`, process jobs with `operation: "request"` before those with `operation: "download"`.
- **Auto-download jobs** are just jobs in the `bulkQueue or manaualQueue` with `operation: "download"` and (optionally) `mode: "auto"`.

### 4. **Auto-Download Trigger**
- When both `enqueued_jobs` and `retried_jobs` are empty (i.e., all request jobs are done), start a timer controlled by env file.
- After it hits the timer limit, enqueue download jobs (with `operation: "download"`) for all items that were successfully requested.

### 5. **Retry Handling**
- If a job fails, increment its retry count and re-enqueue it (with updated `attempts`).
- If it fails after all retries, mark it as permanently failed.

### 6. **Metrics**
- **Metrics are for monitoring only** (not for driving queue logic).
- Update metrics as jobs move through their lifecycle (enqueued, in progress, retried, failed, completed, etc.).

---

## **Summary Table**

| What?                | How?                                                                 |
|----------------------|----------------------------------------------------------------------|
| Queues               | Use existing `manualQueue` and `bulkQueue`                           |
| Job type/phase       | Tag jobs with `operation` (`"request"`, `"download"`, etc.)          |
| Auto-download jobs   | Enqueue as `bulkQueue` jobs with `operation: "download"`             |
| Prioritization       | `manualQueue` > `bulkQueue` (`request` ops first, then `download`)   |
| Retry                | Re-enqueue failed jobs with incremented retry count; mark as failed after max attempts |
| Metrics              | For monitoring/reporting only, not for orchestration                 |

---

## **Benefits**
- **No queue proliferation**—system stays simple.
- **Clear job intent**—dispatcher can easily prioritize and handle jobs by type.
- **Easy to monitor**—metrics and tracking data give you full visibility.
- **Extensible**—add more operations or modes as needed.

---

**If you want, I can help you with code snippets for tagging jobs, dispatcher logic, or metrics updates!**



When a request step finishes—whether in success or failure—you update its `status`, `attempts`, and `error`. Only **after** a successful request do you calculate and record the download’s scheduled time. Here’s the end‑to‑end flow:

---

## 1. Request Step Error Handling

```jsonc
"request": {
  "status": "failed",              // changed from "in_progress" to "failed"
  "attempts": 2,                   // number of times you tried already
  "last_attempt_at": "2025-07-23T20:58:15+05:30",
  "error": "TimeoutError: 30 s exceeded"
},
"download": {
  "status": "pending",             // still waiting—you won’t even schedule it until request succeeds
  "attempts": 0,
  "scheduled_for": null,           // remains null so your dispatcher knows “don’t touch me yet”
  "error": null
}
```

* On **each** retry of the request job, bump `attempts` and set `last_attempt_at`.
* If it ultimately **fails permanently** (after max retries), set `status: "failed"` and record the final `error`.
* **Do not** schedule or enqueue the download step in this case—your UI can render this as “Request failed; download skipped.”

---

## 2. Scheduling the Download Step

When the request **succeeds**, you do two things in your worker:

1. **Update the request step** in your tracking doc:

   ```js
   operations.return_tracking.steps.request.status = "completed";
   operations.return_tracking.steps.request.last_attempt_at = now;
   ```

2. **Compute the download schedule** and enqueue the download job:

   ```js
   const delayMs = 15 * 60 * 1000;                 // 15 minutes
   const scheduledAt = new Date(Date.now() + delayMs).toISOString();

   // Update tracking document:
   operations.return_tracking.steps.download = {
     status: "pending",
     attempts: 0,
     scheduled_for: scheduledAt,
     error: null
   };

   // Enqueue your download job with a delay:
   downloadQueue.add(
     "scraper:download",
     { jobId, item: "return_tracking", operation: "download" },
     { delay: delayMs }
   );
   ```

* **`scheduled_for`** holds the absolute timestamp when you expect the download to run.
* Your queue driver (e.g., BullMQ) honors the `{ delay }` option and won’t hand the job to a worker until that time.
* If your queue implementation doesn’t support delays, you can alternatively use:

  ```js
  setTimeout(() => enqueueDownloadJob(...), delayMs);
  ```

---

## 3. Download Step Execution & Errors

When the download job actually runs:

* **Before** starting, compare `now` vs. `scheduled_for`. If you’re early (e.g. after a server restart), you can re‑enqueue or wait.

* **On success**, set:

  ```jsonc
  "download": {
    "status": "completed",
    "attempts": 1,
    "scheduled_for": "2025-07-23T21:11:15+05:30", // unchanged
    "error": null
  }
  ```

* **On retryable failure**, bump `attempts`, record `error`, and let your retry policy re‑enqueue the same job (no need to recalc `scheduled_for` since it already ran).

* **On permanent failure**, set:

  ```jsonc
  "download": {
    "status": "failed",
    "attempts": 3,
    "scheduled_for": "2025-07-23T21:11:15+05:30",
    "error": "DownloadError: 404 Not Found"
  }
  ```

---


# Auto-Download & Retry: Final Agreed Approach

---

## **Queue, Concurrency, and Retry Policy Overview**

- The system uses **manualQueue** (for user/manual jobs) and **bulkQueue** (for batch/auto jobs, including auto-download and retries).
- **Manual jobs** always have higher priority than bulk jobs.
- **Max concurrency** is always respected: at most N jobs (manual, bulk, download, retry) are processed at once.
- **Auto-download jobs** are just jobs in the bulk queue with `operation: "download"`.
- **Retry jobs** (for both request and download) are re-enqueued into the appropriate queue, and are subject to the same concurrency and priority rules.
- **No job type (including retries or downloads) can starve manual jobs.**

---

## **Auto-Download & Retry: Batch-Oriented (Conservative) Approach [CHOSEN]**

- **Requests:**
  - Process all request jobs (including retries as they become eligible) before moving on to downloads.
  - Only when all requests are either completed or permanently failed, schedule downloads for the successful ones.
  - If a request fails permanently (after max retries), the download step is never scheduled for that item (UI can show “Request failed; download skipped”).
- **Downloads:**
  - Process all downloads (including retries as they become eligible) as a batch.
  - After all downloads are done, retry any failed downloads as a batch (if their delay is up).
- **After Max Retries:**
  - If any job (request or download) is retried the maximum number of times (see `MAX_RETRIES` in constants.js), and still fails, it is marked as **permanently failed** in `server_metrics_manager.js` (added to `permanently_failed_jobs`).

---

## **Retry Policy**
- **Max retries:** See `MAX_RETRIES` in constants.js (e.g., 3).
- **Retry delays:** See `RETRY_DELAYS` in constants.js (e.g., [1 min, 3 min, 5 min]).
- **On each retry:** Bump `attempts` and set `last_attempt_at`.
- **After max retries:** Mark as permanently failed; do not retry further.

---

## **Queue/Dispatcher Example**

- See `retry_mechanism.md` for a full example scenario and step-by-step dispatcher logic covering manual, bulk, auto-download, and retry jobs under concurrency limits.

---

## **Why This Works**
- **No starvation:** Manual jobs are never blocked by bulk, download, or retry jobs.
- **Predictable:** Batch-based, windowed processing matches the auto-download flow.
- **Robust:** Failed jobs are retried up to a limit, then marked as permanently failed for monitoring and UI.
- **Extensible:** All logic is driven by queue/dispatcher rules and constants, not hardcoded values.

---

**For full details, see the merged `retry_mechanism.md`.**

---

**See also:**
- [retry_mechanism.md](./retry_mechanism.md)
- [structure.md](./structure.md)
- [server_metrics.md](./server_metrics.md)
