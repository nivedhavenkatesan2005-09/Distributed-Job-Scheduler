/**
 * Architecture documentation, Design Decisions whitepaper,
 * API documentation definitions, and Automated Test definitions.
 */

import { TestSuiteResult } from '../types';

export interface ArchitectureNode {
  id: string;
  name: string;
  category: 'Ingress' | 'Coordination' | 'Execution' | 'Persistence' | 'Observability';
  description: string;
  tech: string;
  responsibilities: string[];
  inboundFrom: string[];
  outboundTo: string[];
}

export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: 'rest-api',
    name: 'REST API & Ingress Gateway',
    category: 'Ingress',
    description: 'Validates job creation payloads, verifies idempotency keys, manages RBAC authentication, and accepts batch & scheduled submissions.',
    tech: 'Node.js Express / OpenAPI 3.0 / JWT Auth',
    responsibilities: [
      'Payload validation and JSON schema checks',
      'Idempotency key lookup (ensures exactly-once submission)',
      'Tenant isolation & RBAC authorization',
      'Rate-limiting and concurrency pre-checks'
    ],
    inboundFrom: ['client-apps', 'cron-triggers', 'webhooks'],
    outboundTo: ['db-jobs-table', 'event-bus']
  },
  {
    id: 'db-engine',
    name: 'Relational Database & Atomic Lock Engine',
    category: 'Persistence',
    description: 'ACID-compliant storage storing Jobs, Queues, Workers, Executions, and DLQ. Coordinates atomic job claims via SELECT FOR UPDATE SKIP LOCKED and CAS optimistic locking.',
    tech: 'PostgreSQL 16 / Row-Level Locks / Composite B-Tree Indexes',
    responsibilities: [
      'Atomic job claiming without distributed race conditions',
      'State machine persistence (QUEUED -> RUNNING -> COMPLETED)',
      'Immutable execution history ledger and audit logs',
      'Cascading foreign-key integrity across Tenants and Queues'
    ],
    inboundFrom: ['rest-api', 'scheduler-ticker', 'worker-pool', 'dlq-manager'],
    outboundTo: ['worker-pool', 'analytics-engine']
  },
  {
    id: 'scheduler-ticker',
    name: 'Distributed Scheduler & Cron Evaluator',
    category: 'Coordination',
    description: 'High-frequency background ticker evaluating delayed jobs, cron expressions, DAG dependency trees, and rate limit token buckets.',
    tech: 'Distributed Ticker / Cron Parser / DAG Resolver',
    responsibilities: [
      'Promotes delayed/scheduled jobs to QUEUED when target timestamp arrives',
      'Evaluates standard 5-part cron syntax and schedules next run',
      'Resolves Workflow DAG dependencies and triggers downstream nodes',
      'Refills queue rate-limit token buckets per minute'
    ],
    inboundFrom: ['db-engine'],
    outboundTo: ['db-engine', 'event-bus']
  },
  {
    id: 'worker-pool',
    name: 'Worker Fleet & Execution Engine',
    category: 'Execution',
    description: 'Autonomous worker nodes pulling prioritized queues up to local concurrency limits, executing tasks, streaming real-time logs, and emitting heartbeats.',
    tech: 'Async Task Workers / Dynamic Concurrency / Sandbox',
    responsibilities: [
      'Polls prioritized queues and claims jobs atomically',
      'Executes background jobs asynchronously (emails, transcoding, webhooks)',
      'Maintains lease renewals and sends periodic heartbeats (3-5s)',
      'Graceful shutdown on SIGTERM (finishes active in-flight jobs)'
    ],
    inboundFrom: ['db-engine', 'scheduler-ticker'],
    outboundTo: ['db-engine', 'event-bus', 'gemini-ai']
  },
  {
    id: 'heartbeat-reaper',
    name: 'Heartbeat Monitor & Stalled Job Reaper',
    category: 'Coordination',
    description: 'Detects dead or frozen worker instances whose heartbeats expired and recovers abandoned in-flight jobs for safe retry or DLQ routing.',
    tech: 'Lease Expiration Watcher / Distributed Mutex',
    responsibilities: [
      'Scans for workers with last_heartbeat_at > 10 seconds ago',
      'Reclaims orphaned RUNNING jobs with expired lock leases',
      'Calculates exponential backoff delay before requeuing',
      'Marks dead workers as STALLED/SHUTDOWN'
    ],
    inboundFrom: ['worker-pool'],
    outboundTo: ['db-engine', 'event-bus']
  },
  {
    id: 'dlq-manager',
    name: 'Dead Letter Queue (DLQ) & Quarantine',
    category: 'Persistence',
    description: 'Isolates permanently failing jobs after exhausting configured retry attempts, preserving full stack traces and enabling AI root-cause analysis & 1-click replaying.',
    tech: 'Quarantine Store / AI Diagnostics / Replay Dispatcher',
    responsibilities: [
      'Quarantines jobs exceeding max_retries',
      'Preserves original payloads, error traces, and attempt audit logs',
      'Triggers Gemini AI automated failure diagnosis and suggested fixes',
      'Allows safe manual or batch replaying back to queue'
    ],
    inboundFrom: ['worker-pool', 'heartbeat-reaper'],
    outboundTo: ['db-engine', 'gemini-ai', 'event-bus']
  },
  {
    id: 'gemini-ai',
    name: 'Gemini AI Diagnostic Agent',
    category: 'Observability',
    description: 'Server-side LLM agent analyzing stack traces, exception messages, and payload schemas to diagnose root causes and recommend actionable remediation.',
    tech: '@google/genai SDK / gemini-3.7-flash',
    responsibilities: [
      'Automated stack trace analysis and anomaly categorization',
      'Recommends code patches or input payload fixes',
      'Calculates diagnostic confidence score and failure classification'
    ],
    inboundFrom: ['dlq-manager', 'worker-pool'],
    outboundTo: ['dlq-manager', 'event-bus']
  },
  {
    id: 'event-bus',
    name: 'Real-Time SSE Event Bus & Live Telemetry',
    category: 'Observability',
    description: 'Broadcasts live scheduler events, worker heartbeats, state transitions, and metrics directly to connected web dashboard clients via Server-Sent Events.',
    tech: 'Server-Sent Events (SSE) / PubSub Dispatcher',
    responsibilities: [
      'Streams sub-second status changes to UI without heavy polling',
      'Emits worker CPU/memory telemetry timeseries',
      'Streams live execution logs from worker tasks'
    ],
    inboundFrom: ['rest-api', 'db-engine', 'worker-pool', 'heartbeat-reaper'],
    outboundTo: ['client-apps']
  }
];

export interface DesignDecision {
  title: string;
  category: string;
  problem: string;
  options: {
    name: string;
    pros: string[];
    cons: string[];
    isChosen: boolean;
  }[];
  decision: string;
  rationale: string;
  failureModeHandling: string;
}

export const DESIGN_DECISIONS: DesignDecision[] = [
  {
    title: 'Atomic Job Claiming: Relational Locking vs Redis / Message Queues',
    category: 'Concurrency & Claiming',
    problem: 'Multiple distributed workers polling the same queue concurrently must never claim or execute the same job twice (prevent duplicate execution and race conditions).',
    options: [
      {
        name: 'PostgreSQL SKIP LOCKED with CAS Lease Token',
        pros: [
          'Guarantees strict ACID transactional consistency',
          'Zero data loss on crashes with write-ahead logging (WAL)',
          'Rich querying, sorting by composite (priority, scheduled_at), and foreign key integrity',
          'Zero extra infrastructure dependencies (no separate Redis/Kafka broker required)'
        ],
        cons: [
          'Slightly higher DB CPU on millions of claims/sec compared to raw RAM-based Redis'
        ],
        isChosen: true
      },
      {
        name: 'Redis LIST / ZSET (e.g. BullMQ / Sidekiq)',
        pros: ['Extremely high in-memory throughput for simple FIFO queues'],
        cons: [
          'Complex multi-tenant filtering and complex queries (e.g. search, execution logs)',
          'Requires separate relational database for long-term audit trail and analytics',
          'Risk of data loss on Redis node restart without strict AOF fsync'
        ],
        isChosen: false
      }
    ],
    decision: 'PostgreSQL SELECT ... FOR UPDATE SKIP LOCKED with optimistic lock tokens (lock_token UUID) and lease expiry (lock_expires_at).',
    rationale: 'PostgreSQL SKIP LOCKED eliminates lock contention by allowing workers to immediately skip rows currently locked by other transactions without waiting, achieving sub-millisecond atomic claims with full relational integrity.',
    failureModeHandling: 'If a worker crashes while holding a lock, the lock_expires_at lease timestamp expires. The Heartbeat Reaper automatically reclaims the job and requeues it with an incremented attempt count.'
  },
  {
    title: 'Execution Semantics: At-Least-Once Delivery with Idempotency Keys',
    category: 'Reliability',
    problem: 'Network partitions and worker crashes mean true physical "exactly-once" delivery is impossible in distributed computing without end-to-end idempotency.',
    options: [
      {
        name: 'At-Least-Once Execution + Idempotency Keys',
        pros: [
          'Guarantees no job is ever dropped or lost',
          'Idempotency key prevents duplicate submission at ingress',
          'Workers use idempotency tokens to make external side-effects safe'
        ],
        cons: [
          'Requires workers/handlers to support idempotency or safe replay'
        ],
        isChosen: true
      },
      {
        name: 'At-Most-Once Execution (Fire and Forget)',
        pros: ['Guarantees a job will never run more than once'],
        cons: ['Jobs are lost permanently if worker crashes mid-execution; unacceptable for payments, emails, and data pipelines'],
        isChosen: false
      }
    ],
    decision: 'Enforce At-Least-Once delivery with strict Idempotency Key deduplication at API ingress and unique database index (project_id, idempotency_key).',
    rationale: 'In background processing, losing jobs (at-most-once) is catastrophic. By combining at-least-once delivery with idempotency keys and stateful attempt ledgers, we achieve effective exactly-once semantics.',
    failureModeHandling: 'Duplicate POST /api/jobs requests with the same idempotency key return the original job entity with HTTP 200 rather than creating duplicate execution.'
  },
  {
    title: 'Worker Liveness: Heartbeat Pings vs Stalled Job Recovery',
    category: 'Worker Orchestration',
    problem: 'How to detect worker hardware failure, network disconnection, or process SIGKILL without waiting for arbitrary long timeouts.',
    options: [
      {
        name: 'Active Heartbeats + Dynamic Lease Renewals',
        pros: [
          'Sub-10-second failure detection',
          'Workers actively refresh lock_expires_at for long-running jobs',
          'Telemetry metrics (CPU, RAM) collected during heartbeats'
        ],
        cons: ['Requires lightweight background timer on each worker node'],
        isChosen: true
      },
      {
        name: 'Static Maximum Job Timeout Only',
        pros: ['Simple to implement'],
        cons: [
          'Dead workers leave jobs hanging for entire maximum timeout (e.g. 30 minutes)',
          'Cannot distinguish between a slow healthy worker and a crashed worker'
        ],
        isChosen: false
      }
    ],
    decision: 'Workers emit heartbeat pings every 3-5 seconds updating their last_heartbeat_at and extending the lock lease on active jobs. The Heartbeat Reaper runs every 2 seconds to recover jobs whose lease has expired (>10s).',
    rationale: 'Provides instant observability into cluster health while ensuring failed workers are cleaned up in seconds rather than hours.',
    failureModeHandling: 'When a worker is declared STALLED, all its claimed jobs are safely transitioned back to QUEUED/RETRYING with backoff delay applied, or moved to DLQ if max retries exceeded.'
  },
  {
    title: 'Retry Backoff Strategy: Exponential Backoff with Full Jitter',
    category: 'Resilience',
    problem: 'Fixed retry delays cause "Thundering Herd" problems where hundreds of retrying jobs hammer an already degraded external service at exact same interval.',
    options: [
      {
        name: 'Exponential Backoff with Full Jitter (Decorrelated)',
        pros: [
          'Spreads retry attempts uniformly across time window',
          'Prevents synchronized burst load on downstream databases/APIs',
          'Formula: delay = random_between(0, min(max_delay, base_delay * 2^attempt))'
        ],
        cons: ['Slightly less predictable exact retry seconds'],
        isChosen: true
      },
      {
        name: 'Fixed Delay (e.g. always wait 5 seconds)',
        pros: ['Predictable schedule'],
        cons: ['Causes massive spike synchronizations causing downstream collapse'],
        isChosen: false
      }
    ],
    decision: 'Provide configurable Retry Policies supporting Fixed Delay, Linear Backoff, and Exponential Backoff with Full Jitter as the production default.',
    rationale: 'Mathematical simulation proves exponential backoff with full jitter optimizes recovery time while reducing external service contention by >80%.',
    failureModeHandling: 'If an error persists through all max retry attempts, the job is cleanly isolated into the Dead Letter Queue (DLQ) for operator triage.'
  },
  {
    title: 'Rate Limiting: Token Bucket Algorithm per Queue',
    category: 'Traffic Shaping',
    problem: 'Downstream third-party APIs (e.g., Stripe, OpenAI, SendGrid) enforce strict rate limits (e.g. 100 req/min). Background queues must never exceed target capacity.',
    options: [
      {
        name: 'Distributed Token Bucket per Queue',
        pros: [
          'Smooths bursty traffic while allowing controlled bursts up to bucket capacity',
          'Tokens refill continuously based on elapsed time',
          'Low computational overhead'
        ],
        cons: ['Requires atomic token decrement per claim'],
        isChosen: true
      },
      {
        name: 'Fixed Window Counter',
        pros: ['Very simple'],
        cons: ['Vulnerable to double-burst rate limit violation at window boundaries'],
        isChosen: false
      }
    ],
    decision: 'Implement Token Bucket algorithm on each Queue with configurable rate_limit_per_min. The worker claim poller checks and consumes tokens atomically prior to job dispatch.',
    rationale: 'Token bucket provides optimal balance of burst tolerance and steady-state rate compliance.',
    failureModeHandling: 'When a queue bucket is exhausted, workers temporarily skip the queue until tokens refill, allowing higher-priority or uncapped queues to process.'
  }
];

export const INITIAL_TEST_SUITES: TestSuiteResult[] = [
  {
    id: 'test-atomic-claiming',
    name: 'Atomic Job Claiming Under Race Conditions',
    description: 'Simulates 10 concurrent workers simultaneously attempting to claim 5 queued jobs. Asserts exactly 5 claims succeed, zero duplicate claims occur, and each job gets a unique lock token.',
    category: 'concurrency',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 4,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  },
  {
    id: 'test-exponential-backoff',
    name: 'Exponential Backoff Calculation & Jitter',
    description: 'Verifies backoff delays for attempts 1 through 5 under Fixed, Linear, and Exponential strategies with Full Jitter. Asserts delay increases exponentially and adheres to max_delay_ms cap.',
    category: 'retries',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 5,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  },
  {
    id: 'test-dlq-routing',
    name: 'Dead Letter Queue (DLQ) Exhaustion Routing',
    description: 'Triggers a deliberately failing job with max_retries = 3. Asserts that upon 3rd failure, state transitions to DEAD_LETTERED, a DLQ entry is recorded with full stack trace, and queue DLQ counter increments.',
    category: 'dlq',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 4,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  },
  {
    id: 'test-idempotency',
    name: 'Idempotency Key Ingestion Deduplication',
    description: 'Submits 5 identical job payloads with matching Idempotency-Key header. Asserts only 1 job is created in database and subsequent requests return HTTP 200 with existing job ID.',
    category: 'idempotency',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 3,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  },
  {
    id: 'test-concurrency-limits',
    name: 'Queue & Worker Concurrency Limit Enforcement',
    description: 'Submits 20 jobs to a queue configured with maxConcurrency = 3. Asserts at no point in time does active running count on that queue exceed 3.',
    category: 'concurrency',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 3,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  },
  {
    id: 'test-stalled-worker-reclaim',
    name: 'Stalled Worker Heartbeat Expiry & Job Reclamation',
    description: 'Simulates worker sudden crash mid-execution. Heartbeat monitor detects expired lease (>10s), marks worker STALLED, and reclaims orphan job for retry.',
    category: 'reliability',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 4,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  },
  {
    id: 'test-cron-evaluation',
    name: 'Cron Next-Run Calculation & Recurring Dispatch',
    description: 'Tests standard 5-part cron expressions (e.g. */5 * * * *, 0 0 * * *). Verifies next_run_at calculation matches expected UTC timestamp and ticker spawns discrete child jobs.',
    category: 'scheduling',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 4,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  },
  {
    id: 'test-workflow-dag',
    name: 'Workflow DAG Dependency Sequential Execution',
    description: 'Defines a 3-step DAG pipeline (Extract -> Transform -> Load). Asserts Transform job starts only after Extract completes, and Load starts only after Transform completes.',
    category: 'workflows',
    status: 'IDLE',
    durationMs: 0,
    assertionsCount: 4,
    passedAssertions: 0,
    failedAssertions: 0,
    logs: []
  }
];

export interface ApiEndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  category: string;
  summary: string;
  description: string;
  requiresAuth: boolean;
  requiredRole?: 'admin' | 'developer' | 'viewer';
  headers?: { name: string; required: boolean; description: string; example: string }[];
  queryParams?: { name: string; required: boolean; description: string; example: string }[];
  requestBody?: any;
  responseBody: any;
}

export const API_ENDPOINTS_DOCS: ApiEndpointDoc[] = [
  {
    method: 'GET',
    path: '/api/queues',
    category: 'Queues',
    summary: 'List all job queues with live statistics',
    description: 'Retrieves all queues for the active project including priority weights, concurrency ceilings, token bucket status, and active job metrics.',
    requiresAuth: true,
    responseBody: [
      {
        id: 'q-default',
        name: 'Default Queue',
        slug: 'default',
        priority: 5,
        maxConcurrency: 10,
        rateLimitPerMin: 300,
        isPaused: false,
        stats: { queuedCount: 4, runningCount: 2, completedCount: 145, failedCount: 2, dlqCount: 1 }
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/queues',
    category: 'Queues',
    summary: 'Create a new job queue',
    description: 'Provisions a new job queue with custom priority, concurrency limit, rate limit, and retry policy assignment.',
    requiresAuth: true,
    requiredRole: 'developer',
    requestBody: {
      name: 'High Priority Webhooks',
      slug: 'webhooks-high',
      priority: 9,
      maxConcurrency: 20,
      rateLimitPerMin: 600,
      retryPolicyId: 'pol-exp-jitter',
      dlqEnabled: true
    },
    responseBody: {
      id: 'q-webhooks-high',
      name: 'High Priority Webhooks',
      slug: 'webhooks-high',
      priority: 9,
      maxConcurrency: 20,
      isPaused: false
    }
  },
  {
    method: 'PATCH',
    path: '/api/queues/:id/pause',
    category: 'Queues',
    summary: 'Pause or resume queue execution',
    description: 'Toggles paused state on a queue. When paused, workers skip claiming new jobs from this queue while running jobs finish.',
    requiresAuth: true,
    requiredRole: 'developer',
    requestBody: { isPaused: true },
    responseBody: { id: 'q-default', isPaused: true }
  },
  {
    method: 'GET',
    path: '/api/jobs',
    category: 'Jobs',
    summary: 'Search & filter jobs with pagination',
    description: 'Query jobs by status (QUEUED, RUNNING, COMPLETED, etc.), queue, search text, or type with cursor pagination.',
    requiresAuth: true,
    queryParams: [
      { name: 'queueId', required: false, description: 'Filter by queue ID', example: 'q-default' },
      { name: 'state', required: false, description: 'Filter by job state', example: 'QUEUED' },
      { name: 'search', required: false, description: 'Search job name or payload', example: 'invoice' },
      { name: 'limit', required: false, description: 'Results limit (1-100)', example: '20' }
    ],
    responseBody: {
      jobs: [
        {
          id: 'job-8942a',
          name: 'send_welcome_email',
          type: 'immediate',
          state: 'RUNNING',
          priority: 7,
          attemptCount: 1,
          workerName: 'worker-us-east-1a'
        }
      ],
      total: 84,
      page: 1
    }
  },
  {
    method: 'POST',
    path: '/api/jobs',
    category: 'Jobs',
    summary: 'Create an immediate, delayed, scheduled, or batch job',
    description: 'Enqueues one or more background jobs with optional delay, schedule time, cron syntax, or idempotency key.',
    requiresAuth: true,
    requiredRole: 'developer',
    headers: [
      { name: 'Idempotency-Key', required: false, description: 'Unique UUID to prevent duplicate execution', example: 'req_8f1b2c4d' }
    ],
    requestBody: {
      name: 'generate_monthly_report',
      queueId: 'q-default',
      type: 'immediate',
      priority: 8,
      payload: { customerId: 'cust_9921', month: '2026-08', format: 'pdf' },
      delaySeconds: 0,
      maxRetries: 3
    },
    responseBody: {
      id: 'job-9821f',
      name: 'generate_monthly_report',
      state: 'QUEUED',
      priority: 8,
      scheduledAt: '2026-08-19T21:30:00.000Z'
    }
  },
  {
    method: 'POST',
    path: '/api/jobs/:id/retry',
    category: 'Jobs',
    summary: 'Manually retry a failed or DLQ job',
    description: 'Resets attempt count and moves a failed or dead-lettered job back into QUEUED state with immediate eligibility.',
    requiresAuth: true,
    requiredRole: 'developer',
    responseBody: { id: 'job-9821f', state: 'QUEUED', attemptCount: 0 }
  },
  {
    method: 'GET',
    path: '/api/workers',
    category: 'Workers',
    summary: 'List worker fleet and health telemetry',
    description: 'Retrieves all worker instances with CPU/memory load, active concurrency, and heartbeat freshness.',
    requiresAuth: true,
    responseBody: [
      {
        id: 'w-alpha',
        name: 'worker-node-01',
        status: 'HEALTHY',
        activeJobsCount: 2,
        concurrencyLimit: 5,
        cpuUsagePct: 24.5,
        memoryUsageMb: 312,
        lastHeartbeatAt: '2026-08-19T21:35:12.000Z'
      }
    ]
  },
  {
    method: 'POST',
    path: '/api/ai/diagnose-failure',
    category: 'AI Diagnostics',
    summary: 'Analyze job failure using Gemini AI',
    description: 'Invokes server-side Gemini 3.7 Flash to analyze stack traces, input payload, and error logs to determine root cause and suggest code/data remedies.',
    requiresAuth: true,
    requestBody: {
      jobId: 'job-failed-441',
      errorMessage: 'ECONNREFUSED 10.0.4.12:5432 - Connection pool exhausted',
      errorStack: 'Error: Connection timeout\n  at pg_pool.acquire (/srv/db.js:84)\n  at processBatch (/srv/worker.js:142)',
      payload: { batchSize: 5000, timeoutMs: 1000 }
    },
    responseBody: {
      rootCause: 'PostgreSQL connection pool exhaustion caused by high batch size (5000) overwhelming available database connections.',
      suggestedFix: 'Implement connection pooling throttling with max 20 active connections per worker and reduce payload batchSize to 500.',
      confidence: 0.94,
      category: 'DATABASE_TIMEOUT'
    }
  }
];

export const architectureNodes = ARCHITECTURE_NODES;
export const designDecisions = DESIGN_DECISIONS;
export const testSuitesList = INITIAL_TEST_SUITES;
export const apiDocumentation = API_ENDPOINTS_DOCS;

