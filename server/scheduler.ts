/**
 * Distributed Scheduler Ticker, Cron Calculator, DAG Orchestrator,
 * and Stalled Worker Heartbeat Reaper.
 */

import { db } from './db';
import { Job, Queue, Workflow } from '../src/types';

class SchedulerEngine {
  private tickerInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Scheduler] Distributed Scheduler ticker initialized.');

    this.tickerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  stop() {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
    this.isRunning = false;
  }

  private tick() {
    const now = Date.now();

    // 1. Promote Scheduled & Delayed Jobs
    this.promoteScheduledJobs(now);

    // 2. Evaluate Cron Triggers
    this.evaluateCronJobs(now);

    // 3. Resolve Workflow DAG Steps
    this.resolveWorkflowPipelines(now);

    // 4. Stalled Worker & Expired Lock Lease Reaper
    this.reapStalledWorkersAndLocks(now);

    // 5. Update Real-Time Telemetry Snapshot
    this.updateMetricsSnapshot(now);
  }

  private promoteScheduledJobs(now: number) {
    for (const job of db.jobs.values()) {
      if (job.state === 'SCHEDULED' && job.scheduledAt) {
        const scheduledTime = new Date(job.scheduledAt).getTime();
        if (scheduledTime <= now) {
          job.state = 'QUEUED';
          const queue = db.queues.get(job.queueId);
          if (queue) {
            queue.stats.scheduledCount = Math.max(0, queue.stats.scheduledCount - 1);
            queue.stats.queuedCount += 1;
          }
          db.appendLog(job.id, 'info', `Job scheduled delay elapsed. Transitioned to QUEUED for worker claim.`);
          db.emitEvent({
            id: 'evt-' + Date.now(),
            type: 'job:created',
            timestamp: new Date().toISOString(),
            data: { jobId: job.id, queueId: job.queueId },
            message: `Delayed job "${job.name}" is now eligible and queued`
          });
        }
      }
    }
  }

  private evaluateCronJobs(now: number) {
    // Check recurring jobs (type === 'cron')
    for (const job of db.jobs.values()) {
      if (job.type === 'cron' && (job.state === 'COMPLETED' || job.state === 'FAILED')) {
        // Compute next run interval (simulate standard cron every 1-5 minutes)
        if (!job.nextRetryAt || new Date(job.nextRetryAt).getTime() <= now) {
          const nextRun = new Date(now + 60000).toISOString();
          job.nextRetryAt = nextRun;
          
          // Spawn new discrete job instance for this recurring tick
          const newJobId = `job-cron-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const recurringInstance: Job = {
            ...job,
            id: newJobId,
            cronJobId: job.id,
            state: 'QUEUED',
            attemptCount: 0,
            workerId: undefined,
            workerName: undefined,
            lockToken: undefined,
            lockExpiresAt: undefined,
            startedAt: undefined,
            completedAt: undefined,
            result: undefined,
            errorMessage: undefined,
            errorStack: undefined,
            createdAt: new Date().toISOString()
          };

          db.jobs.set(newJobId, recurringInstance);
          db.appendLog(newJobId, 'info', `Recurring cron execution tick spawned from parent template ${job.id}`);
          
          const queue = db.queues.get(job.queueId);
          if (queue) queue.stats.queuedCount += 1;
        }
      }
    }
  }

  private resolveWorkflowPipelines(now: number) {
    for (const wf of db.workflows.values()) {
      if (wf.status !== 'RUNNING') continue;

      let allCompleted = true;
      let hasFailures = false;

      for (const node of wf.nodes) {
        if (node.status === 'COMPLETED') continue;

        if (node.status === 'FAILED') {
          hasFailures = true;
          allCompleted = false;
          continue;
        }

        allCompleted = false;

        // Check if all parent dependencies are completed
        const parentsCompleted = node.dependsOn.every(parentId => {
          const parentNode = wf.nodes.find(n => n.id === parentId);
          return parentNode && parentNode.status === 'COMPLETED';
        });

        if (parentsCompleted && (node.status === 'PENDING' || node.status === 'WAITING')) {
          // Promote node to RUNNING and spawn background job in queue!
          node.status = 'RUNNING';
          const jobId = `job-wf-${wf.id}-${node.id}`;
          node.jobId = jobId;

          const wfJob: Job = {
            id: jobId,
            projectId: wf.projectId,
            queueId: node.queueId,
            name: `${wf.name} > ${node.name}`,
            type: 'dag_step',
            priority: 8,
            payload: node.payload,
            state: 'QUEUED',
            attemptCount: 0,
            maxRetries: 3,
            retryPolicyId: 'pol-exp-jitter',
            workflowId: wf.id,
            workflowStepId: node.id,
            createdAt: new Date().toISOString()
          };

          db.jobs.set(jobId, wfJob);
          const queue = db.queues.get(node.queueId);
          if (queue) queue.stats.queuedCount += 1;

          db.appendLog(jobId, 'info', `Workflow DAG stage "${node.name}" triggered as parent dependencies completed.`);
          db.emitEvent({
            id: 'evt-' + Date.now(),
            type: 'job:created',
            timestamp: new Date().toISOString(),
            data: { workflowId: wf.id, stepId: node.id, jobId },
            message: `Workflow step "${node.name}" dispatched to queue`
          });
        }
      }

      if (hasFailures) {
        wf.status = 'FAILED';
      } else if (allCompleted) {
        wf.status = 'COMPLETED';
        wf.completedAt = new Date().toISOString();
      }
    }
  }

  private reapStalledWorkersAndLocks(now: number) {
    const STALLED_THRESHOLD_MS = 15000; // 15 seconds without heartbeat = STALLED

    for (const worker of db.workers.values()) {
      if (worker.status === 'SHUTDOWN') continue;

      const lastHeartbeat = new Date(worker.lastHeartbeatAt).getTime();
      if (now - lastHeartbeat > STALLED_THRESHOLD_MS && worker.status !== 'STALLED') {
        worker.status = 'STALLED';
        console.warn(`[Scheduler] Worker ${worker.name} declared STALLED (No heartbeat for ${Math.round((now - lastHeartbeat)/1000)}s)`);

        db.emitEvent({
          id: 'evt-' + Date.now(),
          type: 'worker:stalled',
          timestamp: new Date().toISOString(),
          data: { workerId: worker.id },
          message: `Worker node ${worker.name} failed heartbeat check. Initiating orphan job recovery.`
        });

        // Reclaim all jobs held by this stalled worker
        for (const job of db.jobs.values()) {
          if (job.workerId === worker.id && (job.state === 'CLAIMED' || job.state === 'RUNNING')) {
            this.reclaimOrphanJob(job, worker.name, 'Worker heartbeat timeout');
          }
        }
      }
    }

    // Check for jobs with expired lock tokens regardless of worker reported status
    for (const job of db.jobs.values()) {
      if ((job.state === 'CLAIMED' || job.state === 'RUNNING') && job.lockExpiresAt) {
        const lockExpiry = new Date(job.lockExpiresAt).getTime();
        if (lockExpiry < now) {
          this.reclaimOrphanJob(job, job.workerName || 'unknown-worker', 'Lock lease expired');
        }
      }
    }
  }

  private reclaimOrphanJob(job: Job, workerName: string, reason: string) {
    db.appendLog(job.id, 'warn', `Job lease reclaimed from ${workerName}. Reason: ${reason}`);

    if (job.attemptCount >= job.maxRetries) {
      // Exceeded max retries -> Move to Dead Letter Queue
      job.state = 'DEAD_LETTERED';
      job.errorMessage = `Job abandoned by ${workerName} (${reason}). Maximum retries (${job.maxRetries}) exhausted.`;
      
      const dlqEntryId = `dlq-${Date.now()}-${job.id}`;
      const queue = db.queues.get(job.queueId);
      
      db.dlq.set(dlqEntryId, {
        id: dlqEntryId,
        jobId: job.id,
        jobName: job.name,
        queueId: job.queueId,
        queueName: queue ? queue.name : 'Unknown Queue',
        projectId: job.projectId,
        failedAt: new Date().toISOString(),
        failedReason: job.errorMessage,
        errorStack: `Error: ${reason}\n    at HeartbeatReaper.reapStalledWorkersAndLocks (/srv/scheduler.ts)\n    at WorkerLease.expired (${workerName})`,
        attemptsCount: job.attemptCount,
        payload: job.payload,
        replayCount: 0
      });

      if (queue) queue.stats.dlqCount += 1;

      db.emitEvent({
        id: 'evt-' + Date.now(),
        type: 'job:dlq',
        timestamp: new Date().toISOString(),
        data: { jobId: job.id, dlqId: dlqEntryId },
        message: `Job "${job.name}" quarantined in DLQ after worker abandonment`
      });
    } else {
      // Apply exponential backoff delay before requeue
      const backoffMs = db.calculateBackoffDelay(job.retryPolicyId, job.attemptCount);
      job.state = 'RETRYING';
      job.scheduledAt = new Date(Date.now() + backoffMs).toISOString();
      job.workerId = undefined;
      job.workerName = undefined;
      job.lockToken = undefined;
      job.lockExpiresAt = undefined;

      db.appendLog(job.id, 'info', `Requeuing job with backoff delay of ${Math.round(backoffMs / 1000)}s (Attempt ${job.attemptCount}/${job.maxRetries})`);
      
      setTimeout(() => {
        if (job.state === 'RETRYING') {
          job.state = 'QUEUED';
          const queue = db.queues.get(job.queueId);
          if (queue) queue.stats.queuedCount += 1;
        }
      }, backoffMs);
    }
  }

  private updateMetricsSnapshot(now: number) {
    const jobs = Array.from(db.jobs.values());
    const queued = jobs.filter(j => j.state === 'QUEUED' || j.state === 'SCHEDULED' || j.state === 'RETRYING').length;
    const running = jobs.filter(j => j.state === 'RUNNING' || j.state === 'CLAIMED').length;
    const completed = jobs.filter(j => j.state === 'COMPLETED').length;
    const failed = jobs.filter(j => j.state === 'FAILED' || j.state === 'DEAD_LETTERED').length;

    const recentCompleted = jobs.filter(j => j.completedAt && (now - new Date(j.completedAt).getTime()) < 60000).length;
    const throughput = recentCompleted * 12; // annualized per minute rate

    db.throughputHistory.push({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      throughput: Math.max(10, throughput + Math.floor(Math.random() * 8)),
      queued,
      running,
      completed,
      failed
    });

    if (db.throughputHistory.length > 30) {
      db.throughputHistory.shift();
    }
  }
}

export const scheduler = new SchedulerEngine();
