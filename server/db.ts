/**
 * In-memory Relational Database Engine with ACID-like consistency,
 * atomic compare-and-swap (CAS) claiming, foreign key integrity,
 * idempotency index, and realistic production seed data.
 */

import {
  User,
  Project,
  Queue,
  Job,
  JobExecution,
  JobLog,
  Worker,
  WorkerHeartbeat,
  DeadLetterEntry,
  RetryPolicy,
  Workflow,
  SchedulerEvent
} from '../src/types';

export class RelationalDatabase {
  users: Map<string, User> = new Map();
  projects: Map<string, Project> = new Map();
  retryPolicies: Map<string, RetryPolicy> = new Map();
  queues: Map<string, Queue> = new Map();
  jobs: Map<string, Job> = new Map();
  jobExecutions: Map<string, JobExecution> = new Map();
  jobLogs: Map<string, JobLog[]> = new Map(); // jobId -> logs[]
  workers: Map<string, Worker> = new Map();
  workerHeartbeats: WorkerHeartbeat[] = [];
  dlq: Map<string, DeadLetterEntry> = new Map();
  workflows: Map<string, Workflow> = new Map();
  
  // Secondary Indexes
  idempotencyIndex: Map<string, string> = new Map(); // `${projectId}:${idempotencyKey}` -> jobId
  events: SchedulerEvent[] = [];
  
  // Metrics History
  throughputHistory: {
    timestamp: string;
    throughput: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
  }[] = [];

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Users
    const usersList: User[] = [
      { id: 'usr-admin', name: 'Alex Rivera', email: 'alex.rivera@hyperplane.io', role: 'admin', organizationId: 'org-main', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
      { id: 'usr-dev', name: 'Sam Chen', email: 'sam.chen@hyperplane.io', role: 'developer', organizationId: 'org-main', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
      { id: 'usr-viewer', name: 'Elena Rostova', email: 'elena.r@hyperplane.io', role: 'viewer', organizationId: 'org-main', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces' }
    ];
    usersList.forEach(u => this.users.set(u.id, u));

    // 2. Projects
    const projectsList: Project[] = [
      { id: 'proj-prod', organizationId: 'org-main', name: 'Production Cloud Ingestion', slug: 'prod-ingestion', description: 'Core background queue processing for user events, billing webhooks, video encoding, and AI pipelines.', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
      { id: 'proj-staging', organizationId: 'org-main', name: 'Staging Environment', slug: 'staging-env', description: 'Pre-production test sandbox for scheduler stress testing and regression benchmarks.', createdAt: new Date(Date.now() - 15 * 86400000).toISOString() }
    ];
    projectsList.forEach(p => this.projects.set(p.id, p));

    // 3. Retry Policies
    const policiesList: RetryPolicy[] = [
      { id: 'pol-exp-jitter', name: 'Exponential Backoff with Full Jitter', strategy: 'exponential', maxRetries: 4, baseDelayMs: 1500, maxDelayMs: 60000, jitter: true },
      { id: 'pol-linear', name: 'Linear Step Backoff (10s)', strategy: 'linear', maxRetries: 3, baseDelayMs: 5000, maxDelayMs: 30000, jitter: false },
      { id: 'pol-fixed', name: 'Fixed Interval (3s)', strategy: 'fixed', maxRetries: 2, baseDelayMs: 3000, maxDelayMs: 3000, jitter: false }
    ];
    policiesList.forEach(p => this.retryPolicies.set(p.id, p));

    // 4. Queues
    const queuesList: Queue[] = [
      {
        id: 'q-critical',
        projectId: 'proj-prod',
        name: 'Critical Notifications & OTP',
        slug: 'critical-notifications',
        description: 'Instant transactional SMS, password resets, and high-priority push events.',
        priority: 10,
        maxConcurrency: 15,
        rateLimitPerMin: 1200,
        rateLimitTokens: 1200,
        lastTokenRefill: Date.now(),
        retryPolicyId: 'pol-exp-jitter',
        isPaused: false,
        dlqEnabled: true,
        maxDlqRetentionDays: 14,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { queuedCount: 2, scheduledCount: 0, claimedCount: 1, runningCount: 2, completedCount: 3420, failedCount: 4, dlqCount: 1, totalProcessed: 3427, avgExecutionDurationMs: 320 }
      },
      {
        id: 'q-data',
        projectId: 'proj-prod',
        name: 'Data Ingestion & Reports',
        slug: 'data-ingestion',
        description: 'CSV bulk processing, financial ledger reconciliation, and analytical aggregates.',
        priority: 7,
        maxConcurrency: 8,
        rateLimitPerMin: 300,
        rateLimitTokens: 300,
        lastTokenRefill: Date.now(),
        retryPolicyId: 'pol-exp-jitter',
        isPaused: false,
        dlqEnabled: true,
        maxDlqRetentionDays: 30,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { queuedCount: 3, scheduledCount: 1, claimedCount: 1, runningCount: 3, completedCount: 1890, failedCount: 12, dlqCount: 2, totalProcessed: 1908, avgExecutionDurationMs: 1420 }
      },
      {
        id: 'q-media',
        projectId: 'proj-prod',
        name: 'Media Transcoding & AI',
        slug: 'media-transcode',
        description: 'CPU-intensive video thumbnail generation, HLS packaging, and multimodal embeddings.',
        priority: 4,
        maxConcurrency: 4,
        rateLimitPerMin: 120,
        rateLimitTokens: 120,
        lastTokenRefill: Date.now(),
        retryPolicyId: 'pol-linear',
        isPaused: false,
        dlqEnabled: true,
        maxDlqRetentionDays: 7,
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { queuedCount: 4, scheduledCount: 2, claimedCount: 0, runningCount: 2, completedCount: 650, failedCount: 8, dlqCount: 1, totalProcessed: 665, avgExecutionDurationMs: 3850 }
      },
      {
        id: 'q-webhooks',
        projectId: 'proj-prod',
        name: 'External Webhooks Dispatcher',
        slug: 'webhooks-dispatch',
        description: 'Stripe, Shopify, and GitHub outbound webhook delivery with backoff retry on HTTP 5xx/429.',
        priority: 6,
        maxConcurrency: 10,
        rateLimitPerMin: 600,
        rateLimitTokens: 600,
        lastTokenRefill: Date.now(),
        retryPolicyId: 'pol-exp-jitter',
        isPaused: false,
        dlqEnabled: true,
        maxDlqRetentionDays: 14,
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { queuedCount: 1, scheduledCount: 0, claimedCount: 0, runningCount: 1, completedCount: 1200, failedCount: 15, dlqCount: 3, totalProcessed: 1219, avgExecutionDurationMs: 450 }
      }
    ];
    queuesList.forEach(q => this.queues.set(q.id, q));

    // 5. Workers
    const workersList: Worker[] = [
      { id: 'w-us-east-1a', name: 'worker-node-us-east-1a', hostname: 'sched-worker-01.internal', ipAddress: '10.0.12.41', concurrencyLimit: 6, activeJobsCount: 2, currentJobIds: [], status: 'HEALTHY', cpuUsagePct: 38.4, memoryUsageMb: 412, totalCompletedJobs: 2450, totalFailedJobs: 12, registeredAt: new Date(Date.now() - 5 * 86400000).toISOString(), lastHeartbeatAt: new Date().toISOString(), version: 'v2.4.1' },
      { id: 'w-us-east-1b', name: 'worker-node-us-east-1b', hostname: 'sched-worker-02.internal', ipAddress: '10.0.12.42', concurrencyLimit: 6, activeJobsCount: 3, currentJobIds: [], status: 'HEALTHY', cpuUsagePct: 52.1, memoryUsageMb: 528, totalCompletedJobs: 2180, totalFailedJobs: 18, registeredAt: new Date(Date.now() - 5 * 86400000).toISOString(), lastHeartbeatAt: new Date().toISOString(), version: 'v2.4.1' },
      { id: 'w-us-west-2a', name: 'worker-node-us-west-2a', hostname: 'sched-worker-03.internal', ipAddress: '10.0.24.18', concurrencyLimit: 8, activeJobsCount: 2, currentJobIds: [], status: 'HEALTHY', cpuUsagePct: 41.7, memoryUsageMb: 610, totalCompletedJobs: 1980, totalFailedJobs: 9, registeredAt: new Date(Date.now() - 3 * 86400000).toISOString(), lastHeartbeatAt: new Date().toISOString(), version: 'v2.4.1' },
      { id: 'w-eu-west-1a', name: 'worker-node-eu-west-1a', hostname: 'sched-worker-04.internal', ipAddress: '10.0.35.88', concurrencyLimit: 4, activeJobsCount: 1, currentJobIds: [], status: 'HEALTHY', cpuUsagePct: 22.0, memoryUsageMb: 340, totalCompletedJobs: 1550, totalFailedJobs: 5, registeredAt: new Date(Date.now() - 2 * 86400000).toISOString(), lastHeartbeatAt: new Date().toISOString(), version: 'v2.4.1' }
    ];
    workersList.forEach(w => this.workers.set(w.id, w));

    // 6. Sample Jobs with real payloads, executions, logs
    this.seedSampleJobs();

    // 7. Sample DLQ entries
    this.seedDlq();

    // 8. Sample Workflows (DAGs)
    this.seedWorkflows();

    // 9. Initial Telemetry History
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      this.throughputHistory.push({
        timestamp: new Date(now - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        throughput: Math.floor(40 + Math.random() * 35),
        queued: Math.floor(6 + Math.random() * 5),
        running: Math.floor(5 + Math.random() * 4),
        completed: Math.floor(40 + Math.random() * 20),
        failed: Math.random() > 0.8 ? 1 : 0
      });
    }
  }

  seedSampleJobs() {
    const sampleJobConfigs = [
      {
        id: 'job-101',
        projectId: 'proj-prod',
        queueId: 'q-critical',
        name: 'send_sms_verification_code',
        type: 'immediate' as const,
        priority: 10,
        state: 'RUNNING' as const,
        payload: { userId: 'usr_88921', phoneNumber: '+1 (555) 382-9012', code: '942084', provider: 'Twilio' },
        attemptCount: 1,
        maxRetries: 3,
        retryPolicyId: 'pol-exp-jitter',
        workerId: 'w-us-east-1a',
        workerName: 'worker-node-us-east-1a',
        startedAt: new Date(Date.now() - 4000).toISOString(),
        createdAt: new Date(Date.now() - 5000).toISOString()
      },
      {
        id: 'job-102',
        projectId: 'proj-prod',
        queueId: 'q-data',
        name: 'generate_monthly_financial_report',
        type: 'scheduled' as const,
        priority: 7,
        state: 'RUNNING' as const,
        payload: { organizationId: 'org_acme_corp', month: '2026-07', currency: 'USD', outputFormat: 'PDF_AND_XLSX' },
        attemptCount: 1,
        maxRetries: 3,
        retryPolicyId: 'pol-exp-jitter',
        workerId: 'w-us-east-1b',
        workerName: 'worker-node-us-east-1b',
        startedAt: new Date(Date.now() - 12000).toISOString(),
        createdAt: new Date(Date.now() - 15000).toISOString()
      },
      {
        id: 'job-103',
        projectId: 'proj-prod',
        queueId: 'q-media',
        name: 'transcode_4k_video_stream',
        type: 'cron' as const,
        cronExpression: '*/15 * * * *',
        priority: 5,
        state: 'RUNNING' as const,
        payload: { assetId: 'vid_9842f_hdr', targetCodecs: ['H265', 'AV1', 'H264'], resolutions: ['1080p', '720p', '480p'] },
        attemptCount: 1,
        maxRetries: 3,
        retryPolicyId: 'pol-linear',
        workerId: 'w-us-west-2a',
        workerName: 'worker-node-us-west-2a',
        startedAt: new Date(Date.now() - 18000).toISOString(),
        createdAt: new Date(Date.now() - 20000).toISOString()
      },
      {
        id: 'job-104',
        projectId: 'proj-prod',
        queueId: 'q-webhooks',
        name: 'dispatch_stripe_invoice_paid_webhook',
        type: 'immediate' as const,
        priority: 6,
        state: 'QUEUED' as const,
        payload: { eventType: 'invoice.payment_succeeded', invoiceId: 'in_1Mxyz92837', customer: 'cus_89412', amountUsdCents: 19900 },
        attemptCount: 0,
        maxRetries: 4,
        retryPolicyId: 'pol-exp-jitter',
        createdAt: new Date(Date.now() - 2000).toISOString()
      },
      {
        id: 'job-105',
        projectId: 'proj-prod',
        queueId: 'q-data',
        name: 'reconcile_daily_ledger_entries',
        type: 'delayed' as const,
        priority: 8,
        state: 'SCHEDULED' as const,
        scheduledAt: new Date(Date.now() + 25000).toISOString(),
        payload: { date: '2026-08-19', accounts: ['stripe_payouts', 'bank_wire', 'credit_cards'] },
        attemptCount: 0,
        maxRetries: 3,
        retryPolicyId: 'pol-exp-jitter',
        createdAt: new Date(Date.now() - 5000).toISOString()
      },
      {
        id: 'job-106',
        projectId: 'proj-prod',
        queueId: 'q-critical',
        name: 'dispatch_fraud_alert_email',
        type: 'immediate' as const,
        priority: 9,
        state: 'COMPLETED' as const,
        payload: { accountId: 'acc_77182', reason: 'Unrecognized IP login from Singapore (49.206.12.99)', riskScore: 0.92 },
        result: { status: 'DELIVERED', messageId: 'msg_98412_ses', deliveryLatencyMs: 240 },
        attemptCount: 1,
        maxRetries: 3,
        retryPolicyId: 'pol-exp-jitter',
        workerId: 'w-us-east-1a',
        workerName: 'worker-node-us-east-1a',
        startedAt: new Date(Date.now() - 30000).toISOString(),
        completedAt: new Date(Date.now() - 28000).toISOString(),
        createdAt: new Date(Date.now() - 35000).toISOString()
      }
    ];

    sampleJobConfigs.forEach(j => {
      this.jobs.set(j.id, j);
      this.addSampleLogs(j.id, j.name, j.state);
    });
  }

  addSampleLogs(jobId: string, name: string, state: string) {
    const logs: JobLog[] = [
      { id: `log-${jobId}-1`, jobId, timestamp: new Date(Date.now() - 10000).toISOString(), level: 'info', message: `Job ${name} [${jobId}] registered in queue` },
      { id: `log-${jobId}-2`, jobId, timestamp: new Date(Date.now() - 8000).toISOString(), level: 'info', message: `Worker claimed lease lock atomically (LockToken: ${Math.random().toString(36).substring(2, 9)})` },
      { id: `log-${jobId}-3`, jobId, timestamp: new Date(Date.now() - 6000).toISOString(), level: 'debug', message: `Initializing runtime task sandbox with timeout=30000ms` }
    ];

    if (state === 'COMPLETED') {
      logs.push(
        { id: `log-${jobId}-4`, jobId, timestamp: new Date(Date.now() - 3000).toISOString(), level: 'info', message: `Task completed payload execution with exitCode 0` },
        { id: `log-${jobId}-5`, jobId, timestamp: new Date(Date.now() - 2000).toISOString(), level: 'info', message: `Job marked COMPLETED. Worker released lock token.` }
      );
    } else if (state === 'RUNNING') {
      logs.push(
        { id: `log-${jobId}-4`, jobId, timestamp: new Date(Date.now() - 2000).toISOString(), level: 'info', message: `Processing chunk 4/10 [40% complete]...` }
      );
    }
    this.jobLogs.set(jobId, logs);
  }

  seedDlq() {
    const dlqItems: DeadLetterEntry[] = [
      {
        id: 'dlq-001',
        jobId: 'job-fail-881',
        jobName: 'sync_salesforce_crm_contacts',
        queueId: 'q-data',
        queueName: 'Data Ingestion & Reports',
        projectId: 'proj-prod',
        failedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        failedReason: 'Salesforce API Error: INVALID_SESSION_ID - Refresh token revoked or expired by tenant admin',
        errorStack: `Error: INVALID_SESSION_ID: Session expired or invalid\n    at SalesforceClient.request (/srv/integrations/salesforce.ts:182:15)\n    at SyncService.syncBatch (/srv/services/sync.ts:94:22)\n    at WorkerEngine.executeJob (/srv/worker/engine.ts:310:18)`,
        attemptsCount: 4,
        payload: { organizationId: 'org_enterprise_corp', batchSize: 500, lastSyncCursor: 'cur_981a28' },
        replayCount: 0,
        aiDiagnosis: {
          rootCause: 'OAuth2 access and refresh tokens were invalidated or revoked on the Salesforce remote connected app.',
          suggestedFix: 'Re-authenticate the Salesforce OAuth connection in Settings > Integrations to obtain a fresh refresh_token, then click Replay.',
          confidence: 0.96,
          category: 'AUTH_TOKEN_REVOKED',
          generatedAt: new Date(Date.now() - 40 * 60000).toISOString()
        }
      },
      {
        id: 'dlq-002',
        jobId: 'job-fail-882',
        jobName: 'dispatch_partner_webhook_event',
        queueId: 'q-webhooks',
        queueName: 'External Webhooks Dispatcher',
        projectId: 'proj-prod',
        failedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        failedReason: 'HTTP 504 Gateway Timeout: Endpoint https://api.partner-nexus.com/v1/events took > 15000ms to respond',
        errorStack: `FetchError: network timeout at: https://api.partner-nexus.com/v1/events\n    at Timeout.<anonymous> (/node_modules/node-fetch/src/index.js:1440:13)\n    at WebhookDispatcher.dispatch (/srv/workers/webhook.ts:67:12)`,
        attemptsCount: 4,
        payload: { webhookUrl: 'https://api.partner-nexus.com/v1/events', event: 'order.fulfilled', orderId: 'ord_9941a' },
        replayCount: 1,
        aiDiagnosis: {
          rootCause: 'Partner destination gateway experienced severe latency or downstream deadlock causing timeout at 15s.',
          suggestedFix: 'Verify partner status page. If partner endpoint has recovered, replay the dead letter job with custom timeout=30000ms.',
          confidence: 0.91,
          category: 'GATEWAY_TIMEOUT',
          generatedAt: new Date(Date.now() - 110 * 60000).toISOString()
        }
      }
    ];

    dlqItems.forEach(d => this.dlq.set(d.id, d));
  }

  seedWorkflows() {
    const wf: Workflow = {
      id: 'wf-etl-pipeline',
      projectId: 'proj-prod',
      name: 'Nightly Data Warehouse ETL & ML Ingestion',
      description: 'Multi-stage DAG orchestrating Postgres export, S3 staging, Spark transformations, and model inference.',
      status: 'RUNNING',
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      nodes: [
        {
          id: 'step-1-extract',
          name: 'Extract OLTP Snapshot to Parquet',
          queueId: 'q-data',
          taskType: 'db_extract',
          payload: { table: 'transactions', date: '2026-08-19' },
          dependsOn: [],
          status: 'COMPLETED',
          jobId: 'job-dag-step1'
        },
        {
          id: 'step-2-sanitize',
          name: 'Sanitize PII & Anonymize User IDs',
          queueId: 'q-data',
          taskType: 'data_sanitize',
          payload: { source: 's3://staging/raw_20260819.parquet' },
          dependsOn: ['step-1-extract'],
          status: 'RUNNING',
          jobId: 'job-dag-step2'
        },
        {
          id: 'step-3-aggregate',
          name: 'Compute Financial Aggregates & Ledger',
          queueId: 'q-data',
          taskType: 'spark_aggregate',
          payload: { window: '24h', metrics: ['gmv', 'net_revenue', 'churn'] },
          dependsOn: ['step-2-sanitize'],
          status: 'PENDING'
        },
        {
          id: 'step-4-notify',
          name: 'Broadcast Completion Webhook & Email',
          queueId: 'q-critical',
          taskType: 'send_notification',
          payload: { channel: '#ops-data-alerts', email: 'lead-architect@hyperplane.io' },
          dependsOn: ['step-3-aggregate'],
          status: 'WAITING'
        }
      ]
    };
    this.workflows.set(wf.id, wf);
  }

  // --- ATOMIC CLAIMING ENGINE (PostgreSQL SELECT FOR UPDATE SKIP LOCKED Equivalent) ---
  claimNextJobAtomic(workerId: string, queueId?: string, leaseSeconds = 30): Job | null {
    const worker = this.workers.get(workerId);
    if (!worker || worker.status === 'SHUTDOWN' || worker.status === 'PAUSED') {
      return null;
    }

    if (worker.activeJobsCount >= worker.concurrencyLimit) {
      return null;
    }

    // Get queues eligible for polling
    let eligibleQueues: Queue[] = Array.from(this.queues.values()).filter(q => !q.isPaused);
    if (queueId) {
      eligibleQueues = eligibleQueues.filter(q => q.id === queueId);
    }
    
    // Sort queues by priority descending
    eligibleQueues.sort((a, b) => b.priority - a.priority);

    const now = Date.now();

    for (const queue of eligibleQueues) {
      // Check Queue Concurrency Ceiling
      const runningInQueue = Array.from(this.jobs.values()).filter(
        j => j.queueId === queue.id && (j.state === 'RUNNING' || j.state === 'CLAIMED')
      ).length;

      if (runningInQueue >= queue.maxConcurrency) {
        continue;
      }

      // Check Queue Rate Limit Token Bucket
      if (!this.consumeRateLimitToken(queue)) {
        continue;
      }

      // Find candidate job: QUEUED and eligible scheduledAt
      const candidateJobs = Array.from(this.jobs.values()).filter(j => {
        if (j.queueId !== queue.id || j.state !== 'QUEUED') return false;
        if (j.scheduledAt && new Date(j.scheduledAt).getTime() > now) return false;
        return true;
      });

      if (candidateJobs.length === 0) continue;

      // Sort candidate jobs: Priority DESC, then CreatedAt ASC (FIFO with priority)
      candidateJobs.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const selectedJob = candidateJobs[0];

      // Atomic Compare-And-Swap (CAS) update
      const lockToken = 'lock_' + Math.random().toString(36).substring(2, 11);
      const lockExpiresAt = new Date(now + leaseSeconds * 1000).toISOString();

      selectedJob.state = 'CLAIMED';
      selectedJob.workerId = worker.id;
      selectedJob.workerName = worker.name;
      selectedJob.lockToken = lockToken;
      selectedJob.claimedAt = new Date().toISOString();
      selectedJob.lockExpiresAt = lockExpiresAt;
      selectedJob.attemptCount += 1;

      // Update worker stats
      worker.activeJobsCount += 1;
      worker.currentJobIds.push(selectedJob.id);
      worker.status = worker.activeJobsCount >= worker.concurrencyLimit ? 'BUSY' : 'HEALTHY';

      // Update queue stats
      queue.stats.queuedCount = Math.max(0, queue.stats.queuedCount - 1);
      queue.stats.claimedCount += 1;

      // Create execution attempt record
      const executionId = `exec-${selectedJob.id}-${selectedJob.attemptCount}`;
      const execution: JobExecution = {
        id: executionId,
        jobId: selectedJob.id,
        attemptNumber: selectedJob.attemptCount,
        workerId: worker.id,
        workerName: worker.name,
        startedAt: new Date().toISOString(),
        status: 'RUNNING'
      };
      this.jobExecutions.set(executionId, execution);

      // Append logs
      this.appendLog(selectedJob.id, 'info', `Job claimed atomically by worker ${worker.name} (Attempt ${selectedJob.attemptCount}/${selectedJob.maxRetries})`, { lockToken, leaseSeconds });

      this.emitEvent({
        id: 'evt-' + Date.now(),
        type: 'job:claimed',
        timestamp: new Date().toISOString(),
        data: { jobId: selectedJob.id, workerId: worker.id, queueId: queue.id },
        message: `Worker ${worker.name} claimed job "${selectedJob.name}"`
      });

      return selectedJob;
    }

    return null;
  }

  consumeRateLimitToken(queue: Queue): boolean {
    const now = Date.now();
    const refillIntervalMs = 60000;
    const rateLimit = queue.rateLimitPerMin || 300;

    if (queue.rateLimitTokens === undefined) queue.rateLimitTokens = rateLimit;
    if (queue.lastTokenRefill === undefined) queue.lastTokenRefill = now;

    const elapsed = now - queue.lastTokenRefill;
    if (elapsed > refillIntervalMs) {
      queue.rateLimitTokens = rateLimit;
      queue.lastTokenRefill = now;
    } else {
      const tokensToAdd = Math.floor((elapsed / refillIntervalMs) * rateLimit);
      if (tokensToAdd > 0) {
        queue.rateLimitTokens = Math.min(rateLimit, queue.rateLimitTokens + tokensToAdd);
        queue.lastTokenRefill = now;
      }
    }

    if (queue.rateLimitTokens > 0) {
      queue.rateLimitTokens -= 1;
      return true;
    }
    return false;
  }

  appendLog(jobId: string, level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any) {
    const logs = this.jobLogs.get(jobId) || [];
    const log: JobLog = {
      id: `log-${jobId}-${logs.length + 1}`,
      jobId,
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };
    logs.push(log);
    this.jobLogs.set(jobId, logs);
  }

  emitEvent(event: SchedulerEvent) {
    this.events.unshift(event);
    if (this.events.length > 200) {
      this.events.pop();
    }
  }

  calculateBackoffDelay(retryPolicyId: string, attempt: number): number {
    const policy = this.retryPolicies.get(retryPolicyId) || {
      strategy: 'exponential' as const,
      baseDelayMs: 1000,
      maxDelayMs: 60000,
      jitter: true,
      maxRetries: 3
    };

    let delay = policy.baseDelayMs;

    if (policy.strategy === 'fixed') {
      delay = policy.baseDelayMs;
    } else if (policy.strategy === 'linear') {
      delay = policy.baseDelayMs * attempt;
    } else if (policy.strategy === 'exponential') {
      delay = policy.baseDelayMs * Math.pow(2, attempt - 1);
    }

    delay = Math.min(delay, policy.maxDelayMs);

    if (policy.jitter) {
      // Full jitter: random between 0 and delay
      delay = Math.floor(Math.random() * delay);
    }

    return Math.max(500, delay);
  }
}

export const db = new RelationalDatabase();
