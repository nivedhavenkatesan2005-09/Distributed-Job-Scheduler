/**
 * Core type definitions for the Distributed Job Scheduler
 */

export type Role = 'admin' | 'developer' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  queueCount?: number;
  activeJobCount?: number;
}

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential';

export interface RetryPolicy {
  id: string;
  name: string;
  strategy: BackoffStrategy;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
}

export interface Queue {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  description?: string;
  priority: number; // 1 (lowest) - 10 (highest)
  maxConcurrency: number;
  rateLimitPerMin: number; // Token bucket rate limit
  rateLimitTokens?: number; // current available tokens
  lastTokenRefill?: number;
  retryPolicyId: string;
  retryPolicy?: RetryPolicy;
  isPaused: boolean;
  dlqEnabled: boolean;
  maxDlqRetentionDays: number;
  createdAt: string;
  updatedAt: string;
  stats: {
    queuedCount: number;
    scheduledCount: number;
    claimedCount: number;
    runningCount: number;
    completedCount: number;
    failedCount: number;
    dlqCount: number;
    totalProcessed: number;
    avgExecutionDurationMs: number;
  };
}

export type JobType = 'immediate' | 'delayed' | 'scheduled' | 'cron' | 'batch' | 'dag_step';

export type JobState =
  | 'QUEUED'
  | 'SCHEDULED'
  | 'CLAIMED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'DEAD_LETTERED'
  | 'CANCELLED';

export interface JobLog {
  id: string;
  jobId: string;
  executionId?: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
}

export interface JobExecution {
  id: string;
  jobId: string;
  attemptNumber: number;
  workerId: string;
  workerName: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STALLED';
  errorMessage?: string;
  errorStack?: string;
  output?: any;
}

export interface Job {
  id: string;
  projectId: string;
  queueId: string;
  queueName?: string;
  name: string;
  type: JobType;
  priority: number; // 1-10
  payload: Record<string, any>;
  state: JobState;
  idempotencyKey?: string;
  attemptCount: number;
  maxRetries: number;
  retryPolicyId: string;
  retryPolicy?: RetryPolicy;
  
  // Timing
  createdAt: string;
  scheduledAt?: string; // when it becomes eligible to run
  claimedAt?: string;
  startedAt?: string;
  completedAt?: string;
  nextRetryAt?: string;
  
  // Concurrency & Worker Lease
  workerId?: string;
  workerName?: string;
  lockToken?: string;
  lockExpiresAt?: string;
  
  // Cron / Recurring metadata
  cronExpression?: string;
  timezone?: string;
  cronJobId?: string;
  
  // DAG / Workflow metadata
  workflowId?: string;
  workflowStepId?: string;
  dependsOnJobIds?: string[];
  
  // Results / Errors
  result?: any;
  errorMessage?: string;
  errorStack?: string;
  aiDiagnosis?: {
    rootCause: string;
    suggestedFix: string;
    confidence: number;
    category: string;
    generatedAt: string;
  };
  
  // Sub-entities
  executions?: JobExecution[];
  logs?: JobLog[];
}

export interface Worker {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  concurrencyLimit: number;
  activeJobsCount: number;
  currentJobIds: string[];
  status: 'HEALTHY' | 'BUSY' | 'IDLE' | 'STALLED' | 'SHUTDOWN' | 'PAUSED';
  cpuUsagePct: number;
  memoryUsageMb: number;
  totalCompletedJobs: number;
  totalFailedJobs: number;
  registeredAt: string;
  lastHeartbeatAt: string;
  version: string;
}

export interface WorkerHeartbeat {
  id: string;
  workerId: string;
  timestamp: string;
  status: string;
  activeJobsCount: number;
  cpuUsagePct: number;
  memoryUsageMb: number;
}

export interface DeadLetterEntry {
  id: string;
  jobId: string;
  jobName: string;
  queueId: string;
  queueName: string;
  projectId: string;
  failedAt: string;
  failedReason: string;
  errorStack?: string;
  attemptsCount: number;
  payload: Record<string, any>;
  replayCount: number;
  resolvedAt?: string;
  aiDiagnosis?: {
    rootCause: string;
    suggestedFix: string;
    confidence: number;
    category: string;
    generatedAt: string;
  };
}

export type DeadLetterJob = DeadLetterEntry;

export interface WorkflowNode {
  id: string;
  name: string;
  queueId: string;
  taskType: string;
  payload: Record<string, any>;
  dependsOn: string[]; // parent node IDs
  status: 'PENDING' | 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  jobId?: string;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  nodes: WorkflowNode[];
  createdAt: string;
  completedAt?: string;
}

export interface SystemMetrics {
  totalJobs: number;
  queuedJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  dlqJobs: number;
  activeWorkers: number;
  totalWorkers: number;
  clusterUtilizationPct: number;
  systemThroughputPerMin: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePct: number;
  history: {
    timestamp: string;
    throughput: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
  }[];
}

export interface SchedulerEvent {
  id: string;
  type: 'job:created' | 'job:claimed' | 'job:started' | 'job:progress' | 'job:completed' | 'job:failed' | 'job:retrying' | 'job:dlq' | 'worker:heartbeat' | 'worker:stalled' | 'worker:shutdown' | 'queue:updated';
  timestamp: string;
  data: any;
  message: string;
}

export type SystemEvent = SchedulerEvent;

export interface TestSuiteResult {
  id: string;
  name: string;
  description: string;
  category: 'concurrency' | 'reliability' | 'retries' | 'dlq' | 'scheduling' | 'idempotency' | 'workflows' | 'rate_limiting';
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs: number;
  assertionsCount: number;
  passedAssertions: number;
  failedAssertions: number;
  logs: string[];
  error?: string;
}

export interface AlertThresholdConfig {
  enabled: boolean;
  cpuLimitPct: number; // e.g. 75%
  memoryLimitMb: number; // e.g. 400MB
  queueDepthLimit: number; // e.g. 15 queued tasks
  errorRateLimitPct: number; // e.g. 10%
  clusterUtilizationLimitPct: number; // e.g. 85%
  soundEnabled: boolean;
}

export interface ActiveAlertNotification {
  id: string;
  metricType: 'cpu' | 'memory' | 'queue_depth' | 'error_rate' | 'cluster_utilization';
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  severity: 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

export type MisfirePolicy = 'SKIP_MISSED' | 'FIRE_ONE_IMMEDIATELY' | 'CATCH_UP_ALL';
export type ConcurrencyPolicy = 'ALLOW_CONCURRENT' | 'FORBID_OVERLAPPING' | 'REPLACE_RUNNING';

export interface CronSchedule {
  id: string;
  projectId: string;
  name: string;
  description: string;
  cronExpression: string;
  humanSchedule: string;
  timezone: string;
  queueId: string;
  queueName: string;
  priority: number;
  taskType: string;
  payload: Record<string, any>;
  status: 'ACTIVE' | 'PAUSED';
  misfirePolicy: MisfirePolicy;
  concurrencyPolicy: ConcurrencyPolicy;
  jitterSeconds: number;
  timeoutSeconds: number;
  maxRetries: number;
  lastRunAt?: string;
  lastRunStatus?: 'COMPLETED' | 'FAILED' | 'RUNNING';
  lastRunJobId?: string;
  nextRunAt: string;
  totalRunsCount: number;
  successfulRunsCount: number;
  failedRunsCount: number;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string;
  projectId: string;
  name: string;
  targetUrl: string;
  description?: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILING';
  events: ('job:queued' | 'job:started' | 'job:completed' | 'job:failed' | 'job:dlq' | 'worker:stalled')[];
  secretToken: string;
  authHeaderName?: string;
  authHeaderValue?: string;
  maxRetries: number;
  timeoutSeconds: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: number;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  targetUrl: string;
  payload: Record<string, any>;
  statusCode?: number;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  attemptCount: number;
  error?: string;
  signature: string;
  timestamp: string;
}

export interface ExecutionTimelineSpan {
  id: string;
  jobId: string;
  jobName: string;
  queueId: string;
  queueName: string;
  workerId: string;
  workerName: string;
  startTime: number; // timestamp in ms
  endTime: number; // timestamp in ms
  durationMs: number;
  state: 'COMPLETED' | 'FAILED' | 'RUNNING';
  priority: number;
  attempt: number;
  cpuPeakPct: number;
  memoryPeakMb: number;
}

export type ThemeMode = 'cyber' | 'violet' | 'crimson' | 'emerald' | 'warm' | 'light';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  description: string;
  accent: string;
  bgPreview: string;
  borderPreview: string;
  isDark: boolean;
}

