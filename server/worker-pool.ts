/**
 * Worker Fleet Engine: Autonomous asynchronous task execution,
 * heartbeat telemetry generation, failure backoff simulation,
 * and graceful shutdown handling.
 */

import { db } from './db';
import { Job, Worker, WorkerHeartbeat } from '../src/types';

class WorkerPoolEngine {
  private pollerInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[WorkerPool] Worker Fleet execution engine started.');

    // 1. Polling loop (atomic claiming across workers)
    this.pollerInterval = setInterval(() => {
      this.pollAndExecute();
    }, 1500);

    // 2. Heartbeat emitter loop (every 3 seconds)
    this.heartbeatInterval = setInterval(() => {
      this.emitHeartbeats();
    }, 3000);
  }

  stop() {
    if (this.pollerInterval) clearInterval(this.pollerInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.pollerInterval = null;
    this.heartbeatInterval = null;
    this.isRunning = false;
  }

  private pollAndExecute() {
    const activeWorkers = Array.from(db.workers.values()).filter(
      w => w.status === 'HEALTHY' || w.status === 'IDLE' || w.status === 'BUSY'
    );

    for (const worker of activeWorkers) {
      if (worker.activeJobsCount >= worker.concurrencyLimit) continue;

      const claimedJob = db.claimNextJobAtomic(worker.id);
      if (claimedJob) {
        this.executeJob(worker, claimedJob);
      }
    }
  }

  private async executeJob(worker: Worker, job: Job) {
    job.state = 'RUNNING';
    job.startedAt = new Date().toISOString();

    const queue = db.queues.get(job.queueId);
    if (queue) {
      queue.stats.claimedCount = Math.max(0, queue.stats.claimedCount - 1);
      queue.stats.runningCount += 1;
    }

    db.appendLog(job.id, 'info', `Worker ${worker.name} started execution in sandbox container`, {
      concurrencySlot: worker.activeJobsCount,
      workerHost: worker.hostname
    });

    db.emitEvent({
      id: 'evt-' + Date.now(),
      type: 'job:started',
      timestamp: new Date().toISOString(),
      data: { jobId: job.id, workerId: worker.id },
      message: `Job "${job.name}" running on ${worker.name}`
    });

    // Determine execution duration based on job type or payload
    const executionDurationMs = job.payload?.durationMs || (1500 + Math.floor(Math.random() * 3000));
    
    // Simulate intermediate progress logs
    const progressTimer = setTimeout(() => {
      if (job.state === 'RUNNING') {
        db.appendLog(job.id, 'info', `Execution progress 50% - processing batch records...`);
        // Refresh lock lease during long execution
        job.lockExpiresAt = new Date(Date.now() + 30000).toISOString();
      }
    }, executionDurationMs / 2);

    // Wait for execution completion
    await new Promise(resolve => setTimeout(resolve, executionDurationMs));
    clearTimeout(progressTimer);

    // Evaluate success or failure
    const shouldFail = job.payload?.simulateFailure || (job.payload?.forceError ? true : Math.random() < 0.08);

    if (shouldFail) {
      this.handleJobFailure(worker, job, executionDurationMs);
    } else {
      this.handleJobSuccess(worker, job, executionDurationMs);
    }

    // Release worker concurrency slot
    worker.activeJobsCount = Math.max(0, worker.activeJobsCount - 1);
    worker.currentJobIds = worker.currentJobIds.filter(id => id !== job.id);
    worker.status = worker.activeJobsCount >= worker.concurrencyLimit ? 'BUSY' : 'HEALTHY';
  }

  private handleJobSuccess(worker: Worker, job: Job, durationMs: number) {
    const now = new Date().toISOString();
    job.state = 'COMPLETED';
    job.completedAt = now;
    job.result = {
      status: 'SUCCESS',
      statusCode: 200,
      processedAt: now,
      executionDurationMs: durationMs,
      workerHost: worker.hostname,
      summary: `Successfully processed task [${job.name}] with payload parameters.`
    };

    worker.totalCompletedJobs += 1;

    const queue = db.queues.get(job.queueId);
    if (queue) {
      queue.stats.runningCount = Math.max(0, queue.stats.runningCount - 1);
      queue.stats.completedCount += 1;
      queue.stats.totalProcessed += 1;
      // Rolling average
      queue.stats.avgExecutionDurationMs = Math.round((queue.stats.avgExecutionDurationMs * 0.9) + (durationMs * 0.1));
    }

    // Update execution record
    const executionId = `exec-${job.id}-${job.attemptCount}`;
    const execution = db.jobExecutions.get(executionId);
    if (execution) {
      execution.status = 'COMPLETED';
      execution.endedAt = now;
      execution.durationMs = durationMs;
      execution.output = job.result;
    }

    db.appendLog(job.id, 'info', `Task execution completed successfully in ${durationMs}ms with return code 0.`, { output: job.result });

    db.emitEvent({
      id: 'evt-' + Date.now(),
      type: 'job:completed',
      timestamp: now,
      data: { jobId: job.id, workerId: worker.id, durationMs },
      message: `Job "${job.name}" completed successfully (${durationMs}ms)`
    });

    // If part of workflow DAG, mark workflow node as completed!
    if (job.workflowId && job.workflowStepId) {
      const wf = db.workflows.get(job.workflowId);
      if (wf) {
        const step = wf.nodes.find(n => n.id === job.workflowStepId);
        if (step) step.status = 'COMPLETED';
      }
    }
  }

  private handleJobFailure(worker: Worker, job: Job, durationMs: number) {
    const now = new Date().toISOString();
    const errorMessage = job.payload?.customErrorMessage || `Downstream service timeout (HTTP 503 Service Unavailable / Connection Reset)`;
    const errorStack = `Error: ${errorMessage}\n    at TaskExecutor.run (/srv/workers/task-runner.ts:89:14)\n    at WorkerSandbox.execute (${worker.name}:142:9)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

    job.errorMessage = errorMessage;
    job.errorStack = errorStack;
    worker.totalFailedJobs += 1;

    const queue = db.queues.get(job.queueId);
    if (queue) {
      queue.stats.runningCount = Math.max(0, queue.stats.runningCount - 1);
    }

    // Update execution record
    const executionId = `exec-${job.id}-${job.attemptCount}`;
    const execution = db.jobExecutions.get(executionId);
    if (execution) {
      execution.status = 'FAILED';
      execution.endedAt = now;
      execution.durationMs = durationMs;
      execution.errorMessage = errorMessage;
    }

    db.appendLog(job.id, 'error', `Execution attempt #${job.attemptCount} failed: ${errorMessage}`, { stack: errorStack });

    // Check retry threshold
    if (job.attemptCount < job.maxRetries) {
      const backoffDelay = db.calculateBackoffDelay(job.retryPolicyId, job.attemptCount);
      job.state = 'RETRYING';
      job.scheduledAt = new Date(Date.now() + backoffDelay).toISOString();
      job.workerId = undefined;
      job.workerName = undefined;
      job.lockToken = undefined;
      job.lockExpiresAt = undefined;

      if (queue) queue.stats.failedCount += 1;

      db.appendLog(job.id, 'warn', `Job queued for retry in ${(backoffDelay / 1000).toFixed(1)}s (Attempt ${job.attemptCount}/${job.maxRetries})`);

      db.emitEvent({
        id: 'evt-' + Date.now(),
        type: 'job:retrying',
        timestamp: now,
        data: { jobId: job.id, attempt: job.attemptCount, nextRetryMs: backoffDelay },
        message: `Job "${job.name}" failed; retrying in ${(backoffDelay / 1000).toFixed(1)}s`
      });

      setTimeout(() => {
        if (job.state === 'RETRYING') {
          job.state = 'QUEUED';
          if (queue) queue.stats.queuedCount += 1;
        }
      }, backoffDelay);
    } else {
      // Max retries exceeded -> Dead Letter Queue
      job.state = 'DEAD_LETTERED';
      job.completedAt = now;

      if (queue) {
        queue.stats.failedCount += 1;
        queue.stats.dlqCount += 1;
      }

      const dlqId = `dlq-${Date.now()}-${job.id}`;
      db.dlq.set(dlqId, {
        id: dlqId,
        jobId: job.id,
        jobName: job.name,
        queueId: job.queueId,
        queueName: queue ? queue.name : 'Unknown Queue',
        projectId: job.projectId,
        failedAt: now,
        failedReason: errorMessage,
        errorStack: errorStack,
        attemptsCount: job.attemptCount,
        payload: job.payload,
        replayCount: 0
      });

      db.appendLog(job.id, 'error', `Maximum retries (${job.maxRetries}) exhausted. Job moved to Dead Letter Queue (DLQ ID: ${dlqId}).`);

      db.emitEvent({
        id: 'evt-' + Date.now(),
        type: 'job:dlq',
        timestamp: now,
        data: { jobId: job.id, dlqId },
        message: `Job "${job.name}" quarantined in DLQ after ${job.attemptCount} failed attempts`
      });

      // If in workflow, mark workflow step as failed
      if (job.workflowId && job.workflowStepId) {
        const wf = db.workflows.get(job.workflowId);
        if (wf) {
          const step = wf.nodes.find(n => n.id === job.workflowStepId);
          if (step) step.status = 'FAILED';
          wf.status = 'FAILED';
        }
      }
    }
  }

  private emitHeartbeats() {
    const now = new Date().toISOString();

    for (const worker of db.workers.values()) {
      if (worker.status === 'SHUTDOWN') continue;

      // Update CPU & Memory telemetry
      const cpuJitter = (Math.random() - 0.5) * 8;
      const baseCpu = 20 + (worker.activeJobsCount * 12);
      worker.cpuUsagePct = Math.max(5, Math.min(95, parseFloat((baseCpu + cpuJitter).toFixed(1))));

      const memJitter = Math.floor((Math.random() - 0.5) * 30);
      worker.memoryUsageMb = Math.max(180, 320 + (worker.activeJobsCount * 90) + memJitter);
      worker.lastHeartbeatAt = now;

      const heartbeat: WorkerHeartbeat = {
        id: 'hb-' + Date.now() + '-' + worker.id,
        workerId: worker.id,
        timestamp: now,
        status: worker.status,
        activeJobsCount: worker.activeJobsCount,
        cpuUsagePct: worker.cpuUsagePct,
        memoryUsageMb: worker.memoryUsageMb
      };

      db.workerHeartbeats.push(heartbeat);
      if (db.workerHeartbeats.length > 100) {
        db.workerHeartbeats.shift();
      }
    }
  }

  scaleWorkers(targetCount: number): Worker[] {
    const currentWorkers = Array.from(db.workers.values());
    
    if (targetCount > currentWorkers.length) {
      // Add worker nodes
      const toAdd = targetCount - currentWorkers.length;
      for (let i = 0; i < toAdd; i++) {
        const index = currentWorkers.length + i + 1;
        const newId = `w-dynamic-${index}`;
        const newWorker: Worker = {
          id: newId,
          name: `worker-node-auto-${index.toString().padStart(2, '0')}`,
          hostname: `sched-worker-auto-${index}.internal`,
          ipAddress: `10.0.50.${10 + index}`,
          concurrencyLimit: 6,
          activeJobsCount: 0,
          currentJobIds: [],
          status: 'HEALTHY',
          cpuUsagePct: 15.0,
          memoryUsageMb: 240,
          totalCompletedJobs: 0,
          totalFailedJobs: 0,
          registeredAt: new Date().toISOString(),
          lastHeartbeatAt: new Date().toISOString(),
          version: 'v2.4.1'
        };
        db.workers.set(newId, newWorker);
      }
    } else if (targetCount < currentWorkers.length) {
      // Gracefully shutdown extra workers
      const toRemove = currentWorkers.length - targetCount;
      const candidates = currentWorkers.filter(w => w.status !== 'SHUTDOWN').slice(-toRemove);
      for (const w of candidates) {
        w.status = 'SHUTDOWN';
      }
    }

    return Array.from(db.workers.values());
  }

  shutdownWorker(workerId: string): boolean {
    const worker = db.workers.get(workerId);
    if (!worker) return false;
    worker.status = 'SHUTDOWN';
    db.appendLog(`system`, 'info', `Worker ${worker.name} received graceful SHUTDOWN signal`);
    return true;
  }
}

export const workerPool = new WorkerPoolEngine();
