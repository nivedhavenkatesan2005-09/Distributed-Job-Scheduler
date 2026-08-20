/**
 * Relational Database Schema definition, indexes, cascading rules,
 * normalization documentation, and PostgreSQL DDL.
 */

export interface ColumnDef {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
  foreignKey?: {
    table: string;
    column: string;
    onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate: 'CASCADE' | 'RESTRICT';
  };
  description: string;
}

export interface IndexDef {
  name: string;
  columns: string[];
  isUnique?: boolean;
  type: 'BTREE' | 'HASH' | 'GIN';
  purpose: string;
}

export interface TableDef {
  name: string;
  category: 'Auth & Multi-tenancy' | 'Queue Engine' | 'Job Lifecycle' | 'Worker Telemetry' | 'Reliability & DLQ' | 'Workflows';
  description: string;
  columns: ColumnDef[];
  indexes: IndexDef[];
  partitioning?: string;
  normalizationLevel: '3NF' | 'BCNF';
  performanceNotes: string;
}

export const RELATIONAL_TABLES: TableDef[] = [
  {
    name: 'organizations',
    category: 'Auth & Multi-tenancy',
    description: 'Top-level tenant boundary for billing, resource quotas, and tenant isolation.',
    normalizationLevel: 'BCNF',
    performanceNotes: 'Small table; heavily cached in application memory or Redis layer.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Unique organization UUID' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false, description: 'Organization legal/display name' },
      { name: 'slug', type: 'VARCHAR(64)', isNullable: false, description: 'URL-friendly unique identifier' },
      { name: 'max_concurrency_quota', type: 'INTEGER', defaultValue: '100', description: 'Global organization-wide concurrency ceiling' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Organization creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Last modification timestamp' }
    ],
    indexes: [
      { name: 'idx_organizations_slug', columns: ['slug'], isUnique: true, type: 'BTREE', purpose: 'Fast tenant routing by slug' }
    ]
  },
  {
    name: 'users',
    category: 'Auth & Multi-tenancy',
    description: 'User accounts with role-based access control (Admin, Developer, Viewer).',
    normalizationLevel: 'BCNF',
    performanceNotes: 'Indexed on organization_id and email for swift auth lookups.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'User identifier' },
      { name: 'organization_id', type: 'UUID', isNullable: false, foreignKey: { table: 'organizations', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Parent organization' },
      { name: 'email', type: 'VARCHAR(255)', isNullable: false, description: 'User email address' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false, description: 'Full name' },
      { name: 'role', type: 'VARCHAR(32)', defaultValue: "'developer'", description: "RBAC role: 'admin', 'developer', or 'viewer'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Account registration time' }
    ],
    indexes: [
      { name: 'idx_users_email_unique', columns: ['email'], isUnique: true, type: 'BTREE', purpose: 'Auth lookup' },
      { name: 'idx_users_org_role', columns: ['organization_id', 'role'], type: 'BTREE', purpose: 'Multi-tenant RBAC filtering' }
    ]
  },
  {
    name: 'projects',
    category: 'Auth & Multi-tenancy',
    description: 'Logical environment or application container holding queues and scheduled pipelines.',
    normalizationLevel: 'BCNF',
    performanceNotes: 'Cascades deletes to queues and jobs upon project deletion.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Project UUID' },
      { name: 'organization_id', type: 'UUID', isNullable: false, foreignKey: { table: 'organizations', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Parent organization' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false, description: 'Project name' },
      { name: 'slug', type: 'VARCHAR(64)', isNullable: false, description: 'Project slug within tenant' },
      { name: 'description', type: 'TEXT', isNullable: true, description: 'Project notes and documentation' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Creation timestamp' }
    ],
    indexes: [
      { name: 'idx_projects_org_slug', columns: ['organization_id', 'slug'], isUnique: true, type: 'BTREE', purpose: 'Unique project slug per organization' }
    ]
  },
  {
    name: 'retry_policies',
    category: 'Queue Engine',
    description: 'Configurable backoff algorithms: fixed, linear, and exponential with full jitter.',
    normalizationLevel: '3NF',
    performanceNotes: 'Immutable policy definitions reusable across multiple queues and jobs.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Retry policy ID' },
      { name: 'name', type: 'VARCHAR(128)', isNullable: false, description: 'Descriptive policy name' },
      { name: 'strategy', type: 'VARCHAR(32)', isNullable: false, description: "'fixed', 'linear', or 'exponential'" },
      { name: 'max_retries', type: 'INTEGER', defaultValue: '3', description: 'Maximum retry attempts before DLQ' },
      { name: 'base_delay_ms', type: 'INTEGER', defaultValue: '1000', description: 'Initial backoff delay in ms' },
      { name: 'max_delay_ms', type: 'INTEGER', defaultValue: '60000', description: 'Maximum backoff cap in ms' },
      { name: 'jitter', type: 'BOOLEAN', defaultValue: 'true', description: 'Enable randomized full jitter to prevent thundering herd' }
    ],
    indexes: [
      { name: 'idx_retry_policies_name', columns: ['name'], type: 'BTREE', purpose: 'Policy configuration lookups' }
    ]
  },
  {
    name: 'queues',
    category: 'Queue Engine',
    description: 'Configured job queues managing priority weights, concurrency limits, rate-limits, and pause states.',
    normalizationLevel: '3NF',
    performanceNotes: 'Queried by workers during atomic claim polling with row-level locks (SKIP LOCKED).',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Queue ID' },
      { name: 'project_id', type: 'UUID', isNullable: false, foreignKey: { table: 'projects', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Parent project' },
      { name: 'name', type: 'VARCHAR(128)', isNullable: false, description: 'Queue display name' },
      { name: 'slug', type: 'VARCHAR(64)', isNullable: false, description: 'Queue slug (e.g., email-queue, video-transcode)' },
      { name: 'priority', type: 'INTEGER', defaultValue: '5', description: 'Priority weight 1-10 (higher prioritized first)' },
      { name: 'max_concurrency', type: 'INTEGER', defaultValue: '10', description: 'Max simultaneous active jobs in this queue' },
      { name: 'rate_limit_per_min', type: 'INTEGER', defaultValue: '300', description: 'Token-bucket rate limit per minute' },
      { name: 'retry_policy_id', type: 'UUID', isNullable: false, foreignKey: { table: 'retry_policies', column: 'id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' }, description: 'Default queue retry policy' },
      { name: 'is_paused', type: 'BOOLEAN', defaultValue: 'false', description: 'Whether queue is paused by operator' },
      { name: 'dlq_enabled', type: 'BOOLEAN', defaultValue: 'true', description: 'Route failed jobs to Dead Letter Queue' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Creation timestamp' }
    ],
    indexes: [
      { name: 'idx_queues_project_slug', columns: ['project_id', 'slug'], isUnique: true, type: 'BTREE', purpose: 'Unique queue per project' },
      { name: 'idx_queues_priority_active', columns: ['is_paused', 'priority'], type: 'BTREE', purpose: 'Prioritized queue polling' }
    ]
  },
  {
    name: 'jobs',
    category: 'Job Lifecycle',
    description: 'Central jobs table with complete state machine, idempotency control, payloads, and worker claim leases.',
    normalizationLevel: '3NF',
    performanceNotes: 'High write throughput. Composite index on (state, scheduled_at, priority DESC) enables O(log N) atomic claims with SKIP LOCKED.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Unique job identifier' },
      { name: 'project_id', type: 'UUID', isNullable: false, foreignKey: { table: 'projects', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Project ID' },
      { name: 'queue_id', type: 'UUID', isNullable: false, foreignKey: { table: 'queues', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Queue ID' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false, description: 'Job task name (e.g. process_invoice)' },
      { name: 'type', type: 'VARCHAR(32)', defaultValue: "'immediate'", description: "'immediate', 'delayed', 'scheduled', 'cron', 'batch', 'dag_step'" },
      { name: 'priority', type: 'INTEGER', defaultValue: '5', description: 'Job priority 1-10' },
      { name: 'state', type: 'VARCHAR(32)', defaultValue: "'QUEUED'", description: 'QUEUED, SCHEDULED, CLAIMED, RUNNING, COMPLETED, FAILED, RETRYING, DEAD_LETTERED, CANCELLED' },
      { name: 'payload', type: 'JSONB', defaultValue: "'{}'", description: 'JSON job input parameters' },
      { name: 'result', type: 'JSONB', isNullable: true, description: 'JSON job output return value' },
      { name: 'idempotency_key', type: 'VARCHAR(128)', isNullable: true, description: 'Unique client token preventing duplicate job submission' },
      { name: 'attempt_count', type: 'INTEGER', defaultValue: '0', description: 'Number of execution attempts executed' },
      { name: 'max_retries', type: 'INTEGER', defaultValue: '3', description: 'Max retry attempts' },
      { name: 'retry_policy_id', type: 'UUID', isNullable: false, foreignKey: { table: 'retry_policies', column: 'id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' }, description: 'Retry policy ID' },
      { name: 'scheduled_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Eligible execution time' },
      { name: 'claimed_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Timestamp when worker claimed lock' },
      { name: 'worker_id', type: 'UUID', isNullable: true, foreignKey: { table: 'workers', column: 'id', onDelete: 'SET NULL', onUpdate: 'CASCADE' }, description: 'Worker currently executing the job' },
      { name: 'lock_token', type: 'UUID', isNullable: true, description: 'Optimistic lock lease token' },
      { name: 'lock_expires_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Heartbeat lease expiration timestamp' },
      { name: 'workflow_id', type: 'UUID', isNullable: true, foreignKey: { table: 'workflows', column: 'id', onDelete: 'SET NULL', onUpdate: 'CASCADE' }, description: 'Optional parent DAG workflow' },
      { name: 'error_message', type: 'TEXT', isNullable: true, description: 'Latest error message' },
      { name: 'error_stack', type: 'TEXT', isNullable: true, description: 'Error stack trace for debugging' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Created timestamp' },
      { name: 'completed_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Finished timestamp' }
    ],
    indexes: [
      { name: 'idx_jobs_atomic_claim', columns: ['queue_id', 'state', 'priority', 'scheduled_at'], type: 'BTREE', purpose: 'High-speed atomic SELECT FOR UPDATE SKIP LOCKED poller' },
      { name: 'idx_jobs_idempotency', columns: ['project_id', 'idempotency_key'], isUnique: true, type: 'BTREE', purpose: 'Enforces exactly-once job ingestion' },
      { name: 'idx_jobs_stalled_reaper', columns: ['state', 'lock_expires_at'], type: 'BTREE', purpose: 'Fast query to recover abandoned/stalled jobs' },
      { name: 'idx_jobs_project_state', columns: ['project_id', 'state', 'created_at'], type: 'BTREE', purpose: 'Dashboard job filtering and pagination' }
    ]
  },
  {
    name: 'job_executions',
    category: 'Job Lifecycle',
    description: 'Immutable ledger of every single job attempt with worker assignment, latency, status, and outputs.',
    normalizationLevel: '3NF',
    performanceNotes: 'Append-only audit table; partitionable by month in high-scale setups.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Execution attempt ID' },
      { name: 'job_id', type: 'UUID', isNullable: false, foreignKey: { table: 'jobs', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Target job' },
      { name: 'attempt_number', type: 'INTEGER', isNullable: false, description: 'Attempt sequence index (1, 2, 3...)' },
      { name: 'worker_id', type: 'UUID', isNullable: false, foreignKey: { table: 'workers', column: 'id', onDelete: 'RESTRICT', onUpdate: 'CASCADE' }, description: 'Executing worker node' },
      { name: 'status', type: 'VARCHAR(32)', isNullable: false, description: 'RUNNING, COMPLETED, FAILED, STALLED' },
      { name: 'started_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Attempt start time' },
      { name: 'ended_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Attempt completion time' },
      { name: 'duration_ms', type: 'INTEGER', isNullable: true, description: 'Execution time in milliseconds' },
      { name: 'error_message', type: 'TEXT', isNullable: true, description: 'Error message if failed' },
      { name: 'output', type: 'JSONB', isNullable: true, description: 'Execution output payload' }
    ],
    indexes: [
      { name: 'idx_job_executions_job_attempt', columns: ['job_id', 'attempt_number'], isUnique: true, type: 'BTREE', purpose: 'Execution history lookup' },
      { name: 'idx_job_executions_worker_duration', columns: ['worker_id', 'status', 'duration_ms'], type: 'BTREE', purpose: 'Worker performance and SLA metrics' }
    ]
  },
  {
    name: 'job_logs',
    category: 'Job Lifecycle',
    description: 'Streaming structured execution logs emitted by worker tasks during execution.',
    normalizationLevel: '3NF',
    performanceNotes: 'Can be partitioned or stored with TTL index; high write throughput.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Log line UUID' },
      { name: 'job_id', type: 'UUID', isNullable: false, foreignKey: { table: 'jobs', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Associated job' },
      { name: 'execution_id', type: 'UUID', isNullable: true, foreignKey: { table: 'job_executions', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Specific attempt' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Log emitted time' },
      { name: 'level', type: 'VARCHAR(16)', defaultValue: "'info'", description: "'debug', 'info', 'warn', 'error'" },
      { name: 'message', type: 'TEXT', isNullable: false, description: 'Log line text content' },
      { name: 'metadata', type: 'JSONB', isNullable: true, description: 'Contextual JSON metadata' }
    ],
    indexes: [
      { name: 'idx_job_logs_job_timestamp', columns: ['job_id', 'timestamp'], type: 'BTREE', purpose: 'Fast chronological log playback' }
    ]
  },
  {
    name: 'workers',
    category: 'Worker Telemetry',
    description: 'Active, idle, and gracefully shutting down worker nodes in the distributed compute cluster.',
    normalizationLevel: '3NF',
    performanceNotes: 'Frequently updated by worker heartbeat loops (~3-5 seconds).',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Worker instance UUID' },
      { name: 'name', type: 'VARCHAR(128)', isNullable: false, description: 'Worker display tag (e.g. worker-node-us-east-1a)' },
      { name: 'hostname', type: 'VARCHAR(255)', isNullable: false, description: 'Machine hostname' },
      { name: 'ip_address', type: 'VARCHAR(45)', isNullable: false, description: 'Internal IP address' },
      { name: 'concurrency_limit', type: 'INTEGER', defaultValue: '5', description: 'Max parallel jobs this worker can pull' },
      { name: 'active_jobs_count', type: 'INTEGER', defaultValue: '0', description: 'Currently running jobs on this node' },
      { name: 'status', type: 'VARCHAR(32)', defaultValue: "'HEALTHY'", description: 'HEALTHY, BUSY, IDLE, STALLED, SHUTDOWN, PAUSED' },
      { name: 'cpu_usage_pct', type: 'FLOAT', defaultValue: '0.0', description: 'Current CPU utilization percentage' },
      { name: 'memory_usage_mb', type: 'INTEGER', defaultValue: '0', description: 'Memory consumption in MB' },
      { name: 'total_completed_jobs', type: 'INTEGER', defaultValue: '0', description: 'Cumulative completed job counter' },
      { name: 'total_failed_jobs', type: 'INTEGER', defaultValue: '0', description: 'Cumulative failed job counter' },
      { name: 'registered_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Initial registration time' },
      { name: 'last_heartbeat_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Latest heartbeat timestamp' },
      { name: 'version', type: 'VARCHAR(32)', defaultValue: "'1.0.0'", description: 'Worker software build version' }
    ],
    indexes: [
      { name: 'idx_workers_heartbeat_status', columns: ['status', 'last_heartbeat_at'], type: 'BTREE', purpose: 'Stalled node health checks' }
    ]
  },
  {
    name: 'worker_heartbeats',
    category: 'Worker Telemetry',
    description: 'Time-series audit trail of worker heartbeats for cluster health graphs and utilization telemetry.',
    normalizationLevel: '3NF',
    performanceNotes: 'Append-only time-series data; aggregated or pruned after 7 days.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Heartbeat entry ID' },
      { name: 'worker_id', type: 'UUID', isNullable: false, foreignKey: { table: 'workers', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Target worker' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Heartbeat ping timestamp' },
      { name: 'status', type: 'VARCHAR(32)', isNullable: false, description: 'Worker reported status' },
      { name: 'active_jobs_count', type: 'INTEGER', isNullable: false, description: 'Active concurrent jobs during ping' },
      { name: 'cpu_usage_pct', type: 'FLOAT', isNullable: false, description: 'CPU utilization %' },
      { name: 'memory_usage_mb', type: 'INTEGER', isNullable: false, description: 'RAM usage in MB' }
    ],
    indexes: [
      { name: 'idx_heartbeats_worker_time', columns: ['worker_id', 'timestamp DESC'], type: 'BTREE', purpose: 'Time-series telemetry querying' }
    ]
  },
  {
    name: 'scheduled_jobs',
    category: 'Queue Engine',
    description: 'Cron and recurring scheduling triggers evaluated continuously by the scheduler ticker.',
    normalizationLevel: '3NF',
    performanceNotes: 'Queried by scheduler loop every 1 second: SELECT * WHERE enabled = true AND next_run_at <= NOW().',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Scheduled recurring job config ID' },
      { name: 'project_id', type: 'UUID', isNullable: false, foreignKey: { table: 'projects', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Parent project' },
      { name: 'queue_id', type: 'UUID', isNullable: false, foreignKey: { table: 'queues', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Target queue' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false, description: 'Recurring job name' },
      { name: 'cron_expression', type: 'VARCHAR(64)', isNullable: false, description: 'Standard 5-part cron syntax (e.g., */5 * * * *)' },
      { name: 'timezone', type: 'VARCHAR(64)', defaultValue: "'UTC'", description: 'Evaluation timezone' },
      { name: 'payload_template', type: 'JSONB', defaultValue: "'{}'", description: 'Payload injected into spawned jobs' },
      { name: 'last_run_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Previous spawn timestamp' },
      { name: 'next_run_at', type: 'TIMESTAMPTZ', isNullable: false, description: 'Calculated next spawn timestamp' },
      { name: 'is_enabled', type: 'BOOLEAN', defaultValue: 'true', description: 'Active toggle' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Creation timestamp' }
    ],
    indexes: [
      { name: 'idx_scheduled_next_run', columns: ['is_enabled', 'next_run_at'], type: 'BTREE', purpose: 'High-efficiency cron ticker scan' }
    ]
  },
  {
    name: 'dead_letter_queue',
    category: 'Reliability & DLQ',
    description: 'Dead letter quarantine for permanently failed jobs with full stack traces, replay tracking, and AI triage.',
    normalizationLevel: '3NF',
    performanceNotes: 'Retains permanent failures for forensic debugging and 1-click replaying.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'DLQ record identifier' },
      { name: 'original_job_id', type: 'UUID', isNullable: false, foreignKey: { table: 'jobs', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Original failed job' },
      { name: 'queue_id', type: 'UUID', isNullable: false, foreignKey: { table: 'queues', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Queue ID' },
      { name: 'project_id', type: 'UUID', isNullable: false, foreignKey: { table: 'projects', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Project ID' },
      { name: 'failed_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Quarantine timestamp' },
      { name: 'failed_reason', type: 'TEXT', isNullable: false, description: 'Final failure exception message' },
      { name: 'error_stack', type: 'TEXT', isNullable: true, description: 'Complete failure stack trace' },
      { name: 'attempts_count', type: 'INTEGER', isNullable: false, description: 'Total attempts made before exhaustion' },
      { name: 'payload', type: 'JSONB', isNullable: false, description: 'Frozen snapshot of input payload' },
      { name: 'replay_count', type: 'INTEGER', defaultValue: '0', description: 'Times replayed by operator' },
      { name: 'resolved_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Resolution or manual replay time' },
      { name: 'ai_diagnosis', type: 'JSONB', isNullable: true, description: 'Gemini AI automated failure diagnostic & remediation advice' }
    ],
    indexes: [
      { name: 'idx_dlq_queue_failed_at', columns: ['queue_id', 'failed_at DESC'], type: 'BTREE', purpose: 'DLQ inspection and bulk replay' }
    ]
  },
  {
    name: 'workflows',
    category: 'Workflows',
    description: 'Directed Acyclic Graph (DAG) workflow pipelines orchestrating multi-step job dependencies.',
    normalizationLevel: '3NF',
    performanceNotes: 'Enables complex parent-child job sequencing with parallel branch resolution.',
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true, defaultValue: 'gen_random_uuid()', description: 'Workflow DAG identifier' },
      { name: 'project_id', type: 'UUID', isNullable: false, foreignKey: { table: 'projects', column: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }, description: 'Project ID' },
      { name: 'name', type: 'VARCHAR(255)', isNullable: false, description: 'Workflow name' },
      { name: 'description', type: 'TEXT', isNullable: true, description: 'Workflow pipeline documentation' },
      { name: 'status', type: 'VARCHAR(32)', defaultValue: "'PENDING'", description: 'PENDING, RUNNING, COMPLETED, FAILED, CANCELLED' },
      { name: 'dag_definition', type: 'JSONB', isNullable: false, description: 'Graph nodes, edges, and queue routing specs' },
      { name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()', description: 'Submission timestamp' },
      { name: 'completed_at', type: 'TIMESTAMPTZ', isNullable: true, description: 'Completion timestamp' }
    ],
    indexes: [
      { name: 'idx_workflows_project_status', columns: ['project_id', 'status'], type: 'BTREE', purpose: 'Workflow pipeline management' }
    ]
  }
];

export const POSTGRESQL_DDL = `-- ============================================================================
-- Production-Grade Distributed Job Scheduler Relational Schema (PostgreSQL)
-- Supports Multi-tenancy, Atomic Claiming, Backoff Retries, DLQ, and DAGs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations & Tenants
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(64) NOT NULL UNIQUE,
    max_concurrency_quota INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users & RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'developer', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_org_role ON users(organization_id, role);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, slug)
);

-- Retry Policies
CREATE TABLE retry_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    strategy VARCHAR(32) NOT NULL CHECK (strategy IN ('fixed', 'linear', 'exponential')),
    max_retries INTEGER NOT NULL DEFAULT 3,
    base_delay_ms INTEGER NOT NULL DEFAULT 1000,
    max_delay_ms INTEGER NOT NULL DEFAULT 60000,
    jitter BOOLEAN NOT NULL DEFAULT true
);

-- Queues
CREATE TABLE queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    max_concurrency INTEGER NOT NULL DEFAULT 10,
    rate_limit_per_min INTEGER NOT NULL DEFAULT 300,
    retry_policy_id UUID NOT NULL REFERENCES retry_policies(id) ON DELETE RESTRICT,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    dlq_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, slug)
);
CREATE INDEX idx_queues_priority_active ON queues(is_paused, priority DESC);

-- Workers Cluster
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(128) NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    concurrency_limit INTEGER NOT NULL DEFAULT 5,
    active_jobs_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY', 'BUSY', 'IDLE', 'STALLED', 'SHUTDOWN', 'PAUSED')),
    cpu_usage_pct FLOAT NOT NULL DEFAULT 0.0,
    memory_usage_mb INTEGER NOT NULL DEFAULT 0,
    total_completed_jobs INTEGER NOT NULL DEFAULT 0,
    total_failed_jobs INTEGER NOT NULL DEFAULT 0,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version VARCHAR(32) NOT NULL DEFAULT '1.0.0'
);
CREATE INDEX idx_workers_heartbeat_status ON workers(status, last_heartbeat_at);

-- Workflows (DAGs)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    dag_definition JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Jobs (Core State Machine)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'immediate' CHECK (type IN ('immediate', 'delayed', 'scheduled', 'cron', 'batch', 'dag_step')),
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    state VARCHAR(32) NOT NULL DEFAULT 'QUEUED' CHECK (state IN ('QUEUED', 'SCHEDULED', 'CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD_LETTERED', 'CANCELLED')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    idempotency_key VARCHAR(128),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_policy_id UUID NOT NULL REFERENCES retry_policies(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    lock_token UUID,
    lock_expires_at TIMESTAMPTZ,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    error_message TEXT,
    error_stack TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High Performance Indexes for Atomic Polling & Idempotency
CREATE UNIQUE INDEX idx_jobs_idempotency ON jobs(project_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_jobs_atomic_claim ON jobs(queue_id, state, priority DESC, scheduled_at ASC);
CREATE INDEX idx_jobs_stalled_reaper ON jobs(state, lock_expires_at) WHERE state IN ('CLAIMED', 'RUNNING');
CREATE INDEX idx_jobs_project_state_created ON jobs(project_id, state, created_at DESC);

-- Job Executions (Immutable Attempt Ledger)
CREATE TABLE job_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
    status VARCHAR(32) NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'STALLED')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    output JSONB,
    UNIQUE (job_id, attempt_number)
);

-- Job Logs
CREATE TABLE job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES job_executions(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(16) NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB
);
CREATE INDEX idx_job_logs_job_timestamp ON job_logs(job_id, timestamp ASC);

-- Worker Heartbeats (Telemetry Timeseries)
CREATE TABLE worker_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL,
    active_jobs_count INTEGER NOT NULL,
    cpu_usage_pct FLOAT NOT NULL,
    memory_usage_mb INTEGER NOT NULL
);
CREATE INDEX idx_heartbeats_worker_time ON worker_heartbeats(worker_id, timestamp DESC);

-- Scheduled Recurring Jobs (Cron Engine)
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(64) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    payload_template JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_scheduled_next_run ON scheduled_jobs(is_enabled, next_run_at ASC);

-- Dead Letter Queue (DLQ)
CREATE TABLE dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    failed_reason TEXT NOT NULL,
    error_stack TEXT,
    attempts_count INTEGER NOT NULL,
    payload JSONB NOT NULL,
    replay_count INTEGER NOT NULL DEFAULT 0,
    resolved_at TIMESTAMPTZ,
    ai_diagnosis JSONB
);
CREATE INDEX idx_dlq_queue_failed_at ON dead_letter_queue(queue_id, failed_at DESC);

-- ============================================================================
-- Atomic Job Claiming Stored Procedure (Prevents race conditions under load)
-- ============================================================================
CREATE OR REPLACE FUNCTION claim_next_job(
    p_worker_id UUID,
    p_queue_id UUID,
    p_lease_seconds INTEGER DEFAULT 30
)
RETURNS TABLE (
    claimed_job_id UUID,
    claimed_name VARCHAR,
    claimed_payload JSONB,
    claimed_attempt INTEGER
) AS $$
DECLARE
    v_job_id UUID;
    v_token UUID := gen_random_uuid();
BEGIN
    -- Atomic row lock with SKIP LOCKED ensures no two workers claim the same job
    SELECT id INTO v_job_id
    FROM jobs
    WHERE queue_id = p_queue_id
      AND state = 'QUEUED'
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_job_id IS NOT NULL THEN
        UPDATE jobs
        SET state = 'CLAIMED',
            worker_id = p_worker_id,
            lock_token = v_token,
            claimed_at = NOW(),
            lock_expires_at = NOW() + (p_lease_seconds || ' seconds')::INTERVAL,
            attempt_count = attempt_count + 1
        WHERE id = v_job_id;

        RETURN QUERY
        SELECT id, name, payload, attempt_count
        FROM jobs
        WHERE id = v_job_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
`;

export const relationalSchema = RELATIONAL_TABLES;
export const postgresDdl = POSTGRESQL_DDL;

