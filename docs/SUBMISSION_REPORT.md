# CODITY.AI Internship Technical Assignment
# DISTRIBUTED JOB SCHEDULER
**Production-Inspired Asynchronous Background Job Scheduling Platform**

---

### Executive Metadata & Submission Reference

| Field | Details |
| :--- | :--- |
| **Candidate** | Nivedha Venkatesan (`nivedhavenkatesan2005@gmail.com`) |
| **Assignment** | Codity.AI Backend & Distributed Systems Engineering Internship |
| **Source Repository** | [https://github.com/nivedhavenkatesan2005-09/Distributed-Job-Scheduler](https://github.com/nivedhavenkatesan2005-09/Distributed-Job-Scheduler) |
| **Live Production Demo** | [https://distributed-job-scheduler-3.onrender.com/](https://distributed-job-scheduler-3.onrender.com/) |
| **Core Technology Stack** | Node.js 18+ • Express • TypeScript • React 18 • Vite • Tailwind CSS • Prisma ORM • SQLite • Server-Sent Events (SSE) • Jest |

---

## 1. Project Overview

The **Distributed Job Scheduler** is a decoupled, highly reliable asynchronous background processing platform designed to execute complex workloads across multi-worker fleets. The system prioritizes strict distributed systems invariants: **at-least-once execution with atomic claiming**, **end-to-end API idempotency**, **resilient retry policies with exponential backoff & jitter**, **Dead Letter Queue (DLQ) isolation**, and **real-time operational telemetry**.

### Key Architectural Capabilities

1. **Deterministic State Machine**: Jobs transition through strictly enforced lifecycle states: `QUEUED` → `CLAIMED` → `RUNNING` → `COMPLETED` / `FAILED` → `RETRY` → `DEAD_LETTERED`.
2. **Atomic Compare-And-Swap (CAS) Claiming**: High-concurrency worker polling employs atomic SQL conditional updates (`UPDATE "Job" SET state='CLAIMED', lockedBy=$workerId WHERE id=$id AND state='QUEUED'`) to guarantee zero duplicate executions without heavy distributed locks.
3. **API-Boundary Idempotency**: Strict deduplication using `Idempotency-Key` headers backed by a unique index to eliminate duplicate job submissions across unstable networks.
4. **Resilient Retry & Backoff Engine**: Configurable retry policies (Fixed, Linear, Exponential with Jitter) schedule future execution timestamps (`runAt`) without holding worker execution threads.
5. **Dead Letter Queue (DLQ) & AI Diagnostics**: Poison pill isolation with payload inspection, manual/bulk replaying, and diagnostic root-cause assistance.
6. **Dynamic Concurrency & Worker Fleet Scaling**: Independent per-queue concurrency limits and worker capacity controls with graceful SIGINT/SIGTERM shutdown.
7. **DAG Workflow Execution**: Sequential and parallel job dependencies with conditional execution trees.
8. **Real-Time Observability**: Push-based Server-Sent Events (SSE) streaming live job state transitions, throughput metrics, execution timelines (Gantt charts), and worker heartbeats.

### Complete Technology Stack

| Layer | Technologies & Libraries | Architectural Role |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (v18+ LTS), TypeScript 5+ | Type-safe, high-throughput asynchronous execution runtime |
| **API & Ingestion** | Express.js, JWT Authentication | REST API endpoints, JWT security, request validation, idempotency filter |
| **Database & ORM** | SQLite / PostgreSQL via Prisma ORM | Relational ACID storage, composite index polling, referential integrity |
| **Live Telemetry** | Server-Sent Events (SSE) | Unidirectional real-time metrics, logs, and state broadcast |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive multi-module operations dashboard, timeline, and monitors |
| **Automated Testing** | Jest, Supertest, In-App Synthetic Harness | Deterministic unit tests & concurrent race-condition verification suite |

---

## 2. Source Code & Setup Instructions

### Repository Structure

```
├── server/                      # Backend application source
│   ├── routes.ts                # REST API endpoints & router configuration
│   ├── scheduler.ts             # Scheduler ticker & cron evaluation engine
│   ├── worker.ts                # Worker fleet, CAS claim engine & task runners
│   ├── sse.ts                   # Server-Sent Events broadcast manager
│   ├── db.ts                    # In-memory and SQLite repository layer
│   └── tests-engine.ts          # In-app synthetic invariant test runner
├── src/                         # React Frontend Dashboard
│   ├── components/              # Modular UI components (Dashboard, Explorer, Queues, DLQ, etc.)
│   ├── types.ts                 # Shared TypeScript domain models & interfaces
│   ├── backend/auth.ts          # JWT token generation, verification & auth middleware
│   ├── App.tsx                  # Root application shell & real-time telemetry consumer
│   └── main.tsx                 # Client application entry point
├── prisma/                      # Database models and migration schema
│   └── schema.prisma            # Prisma relational data model definition
├── docs/                        # Formal architecture & technical whitepapers
│   ├── ARCHITECTURE.md          # System architecture & topology
│   ├── DATABASE_SCHEMA.md       # Relational model & ER specifications
│   ├── API.md                   # REST API technical reference
│   ├── DESIGN_DECISIONS.md      # Engineering trade-offs & benchmarks
│   └── TESTING.md               # Automated testing suite documentation
├── tests/                       # Automated Jest test suites
│   ├── scheduler.test.ts        # Unit & concurrency test specifications
│   └── idempotency.test.ts      # Deduplication & duplicate request tests
├── package.json                 # Project dependencies and script declarations
├── tsconfig.json                # TypeScript compiler configuration
└── .env.example                 # Environment variables and configuration template
```

### Local Setup & Execution Guide

1. **Prerequisites**: Ensure Node.js (`v18.0.0` or higher) and `npm` are installed.
2. **Clone Repository**:
   ```bash
   git clone https://github.com/nivedhavenkatesan2005-09/Distributed-Job-Scheduler.git
   cd Distributed-Job-Scheduler
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Initialize Database & Generate Prisma Client**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Start Full-Stack Development Server**:
   ```bash
   npm run dev
   ```
   - **Web Dashboard**: `http://localhost:3000` (or `http://localhost:5173` if client-standalone)
   - **REST API Base URL**: `http://localhost:3000/api`
6. **Execute Automated Test Suite**:
   ```bash
   npm run test
   # Or run with coverage:
   npx jest --coverage
   ```

---

## 3. System Architecture & Topology

The architecture enforces strict separation of concerns across three primary tiers:

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|   +--------------------------+              +---------------------------------+   |
|   |  React Operations UI     |              |  External REST Clients / SDKs   |   |
|   +--------------------------+              +---------------------------------+   |
+-----------------|--------------------------------------------|--------------------+
                  |  HTTP / REST Requests                      |  Idempotent POST
                  v                                            v
+-----------------------------------------------------------------------------------+
|                               API & INGESTION TIER                                |
|   +---------------------------------------------------------------------------+   |
|   |  Express API Gateway: Auth (JWT) -> Idempotency Filter -> Input Validator |   |
|   +---------------------------------------------------------------------------+   |
|         |                                                           ^             |
|         | (Persists Job with State=QUEUED)                          | (Pushes SSE)|
|         v                                                           |             |
|   +---------------------+                               +---------------------+   |
|   | Primary DB (Prisma) |                               | SSE Broadcast Hub   |   |
|   +---------------------+                               +---------------------+   |
+------------|--------------------------------------------------------^-------------+
             |                                                        |
             | Polling (State=QUEUED & runAt <= NOW)                  | Event
             v                                                        | Notifications
+---------------------------------------------------------------------|-------------+
|                            CORE ENGINE & WORKER MESH                |             |
|   +-----------------------------------------------------------------+---------+   |
|   |  Scheduler Ticker Engine: Scans Cron & Promotes Scheduled Jobs            |   |
|   +---------------------------------------------------------------------------+   |
|   |  Worker Fleet Mesh (Worker 1 ... Worker N)                                |   |
|   |   - Atomic CAS Claim: UPDATE Job SET state='CLAIMED' WHERE state='QUEUED' |   |
|   |   - Concurrency Limiter (Token Bucket / Max Slots)                        |   |
|   |   - Sandboxed Execution Handlers (Immediate, Batch, Network I/O)          |   |
|   |   - Error Trap: Retry Backoff Evaluation or Dead Letter Queue Routing     |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### End-to-End Execution Flow

1. **Ingestion & Idempotency Check**: Client submits a job via `POST /api/jobs` with an `Idempotency-Key` header. If the key exists, the cached job is returned immediately (`200 OK`). If new, the payload is validated and persisted as `QUEUED` (`201 Created`).
2. **Scheduling Promotion**: The Scheduler Ticker scans for delayed or recurring jobs whose `runAt <= NOW()`. It calculates next cron iterations and updates their state to `QUEUED`.
3. **Atomic CAS Claiming**: Available workers poll the queue. A worker claims a job using an atomic Compare-And-Swap operation, setting `state = 'CLAIMED'` and `lockedBy = workerId`.
4. **Execution & Heartbeating**: The worker sets `state = 'RUNNING'`, begins job execution, records execution logs, and periodically updates its heartbeat timestamp.
5. **Success Finalization**: Upon completion, the job transitions to `COMPLETED`, recording runtime duration, result output, and completion timestamps.
6. **Failure & Exponential Backoff**: If an error occurs, the retry policy evaluates remaining attempts. If retries remain, `runAt` is updated with exponential backoff and jitter, and the state reverts to `QUEUED`. If retries are exhausted, the job routes to `DEAD_LETTERED`.
7. **Live Telemetry Stream**: Throughout every transition, state changes and log lines are pushed via SSE to connected monitoring dashboards.

---

## 4. Database Design & Relational ER Model

The relational schema is engineered to handle high write concurrency while maintaining complete audit trails without bloating hot operational tables.

### Entity-Relationship Specification

```
+-------------------+             +--------------------+             +--------------------+
|   Organization    | 1         * |      Project       | 1         * |       Queue        |
|-------------------|-------------|--------------------|-------------|--------------------|
| PK  id            |             | PK  id             |             | PK  id             |
|     name          |             |     name           |             |     name           |
|     slug          |             |     slug           |             |     slug           |
|     createdAt     |             | FK  organizationId |             |     priority       |
+-------------------+             +--------------------+             |     maxConcurrency |
                                                                     |     rateLimitPerMin|
                                                                     |     isPaused       |
                                                                     | FK  projectId      |
                                                                     +---------|----------+
                                                                               | 1
                                                                               |
                                                                               | *
+-------------------+             +--------------------+             +---------v----------+
|      Worker       |             |  DeadLetterQueue   |             |        Job         |
|-------------------|             |--------------------|             |--------------------|
| PK  id            |             | PK  id             | 1         1 | PK  id             |
|     hostname      |             |     reason         |-------------|     name           |
|     status        |             |     errorStack     |             |     payload (JSON) |
|     currentLoad   |             |     failedAt       |             |     state          |
|     lastHeartbeat |             | FK  jobId          |             |     priority       |
+-------------------+             +--------------------+             |     runAt          |
                                                                     |     maxRetries     |
                                                                     |     retryStrategy  |
                                                                     |     lockedBy       |
                                                                     | FK  queueId        |
                                                                     +---------|----------+
                                                                               | 1
                                                                               |
                                                                               | *
                                                                     +---------v----------+
                                                                     |    JobExecution    |
                                                                     |--------------------|
                                                                     | PK  id             |
                                                                     |     status         |
                                                                     |     startedAt      |
                                                                     |     completedAt    |
                                                                     |     durationMs     |
                                                                     |     logs (JSON)    |
                                                                     | FK  jobId          |
                                                                     +--------------------+
```

### Relational Design Highlights

- **Distributed Primary Keys**: Universal UUID v4 identifiers prevent collision and enumeration attacks across distributed nodes.
- **Hot Table Partitioning**: Execution logs and failure stack traces are isolated in `JobExecution` and `DeadLetterQueue` tables, keeping the core `Job` table lean and cache-friendly.
- **Strategic Composite Indexes**:
  - `CREATE INDEX idx_job_poll ON Job (queueId, state, priority DESC, runAt ASC);`
  - `CREATE INDEX idx_idempotency ON Job (idempotencyKey);`
  - `CREATE INDEX idx_execution_lookup ON JobExecution (jobId, startedAt DESC);`
- **Referential Integrity**: Cascading foreign keys enforce clean teardown while preventing orphan job states.

---

## 5. REST API Documentation

**Base API Endpoint**: `http://localhost:3000/api`  
**Authentication Header**: `Authorization: Bearer <JWT_TOKEN>`

### Core API Endpoint Reference

| Method | Endpoint | Description | Request / Query Params | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Authenticate user & issue JWT | `{ email, password }` | `200`, `401` |
| `GET` | `/auth/me` | Retrieve active session & profile | Header: Bearer Token | `200`, `401` |
| `POST` | `/jobs` | Enqueue a new background job | Header: `Idempotency-Key`<br>Payload: Job definition | `201`, `400`, `409` |
| `GET` | `/jobs` | Paginated job list with filters | `?queueId=&state=&page=&limit=` | `200` |
| `GET` | `/jobs/:id` | Detailed job inspection & execution logs | `id: string` (Path) | `200`, `404` |
| `POST` | `/jobs/:id/retry` | Manually re-queue a failed/DLQ job | `id: string` (Path) | `200`, `404`, `409` |
| `DELETE` | `/jobs/:id` | Cancel/purge pending job | `id: string` (Path) | `200`, `404` |
| `GET` | `/queues` | List all queues with throughput KPIs | None | `200` |
| `POST` | `/queues` | Create a new priority queue | `{ name, priority, maxConcurrency }` | `201`, `400` |
| `PATCH` | `/queues/:id/pause`| Toggle pause/resume state on queue | `id: string` (Path) | `200`, `404` |
| `GET` | `/workers` | List active worker mesh & status | None | `200` |
| `POST` | `/workers/scale` | Scale worker fleet capacity | `{ targetCount: number }` | `200`, `400` |
| `POST` | `/dlq/replay-bulk` | Bulk replay dead-lettered jobs | `{ jobIds: string[] }` | `200`, `400` |
| `GET` | `/events` | Real-time SSE telemetry stream | Header: `Accept: text/event-stream` | `200` (Streaming) |
| `POST` | `/tests/run` | Execute synthetic concurrency test suite | `{ suite: "all" \| "race" \| "idempotency" }` | `200` |

### Sample Enqueue Request & Response

**Request (`POST /api/jobs`)**:
```http
POST /api/jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
Idempotency-Key: req-tx-99482-unique
Content-Type: application/json

{
  "name": "generate_invoice_pdf",
  "queueId": "q-billing-high",
  "priority": 9,
  "type": "immediate",
  "payload": {
    "organizationId": "org-main",
    "invoiceId": "INV-2026-0881",
    "notifyEmail": "billing@client.com"
  },
  "retryConfig": {
    "maxRetries": 5,
    "strategy": "exponential",
    "baseDelayMs": 1000,
    "maxDelayMs": 30000,
    "jitter": true
  }
}
```

**Response (`201 Created`)**:
```json
{
  "success": true,
  "job": {
    "id": "job-8f2c3d1e-9b4a",
    "name": "generate_invoice_pdf",
    "queueId": "q-billing-high",
    "state": "QUEUED",
    "priority": 9,
    "retryCount": 0,
    "maxRetries": 5,
    "runAt": "2026-08-21T07:20:00.000Z",
    "createdAt": "2026-08-21T07:20:00.000Z",
    "idempotencyKey": "req-tx-99482-unique"
  }
}
```

---

## 6. Reliability, Concurrency & State Machine

### Job Lifecycle State Machine

```
      [ Client Submission ]
                |
                v
        +---------------+
+------>|  SCHEDULED    | (Delayed / Future runAt / Cron)
|       +-------+-------+
|               | (Ticker: runAt <= NOW)
|               v
|       +---------------+
|       |    QUEUED     |<-----------------------------------+
|       +-------+-------+                                    |
|               | (Worker Atomic CAS Claim)                  |
|               v                                            |
|       +---------------+                                    |
|       |    CLAIMED    |                                    |
|       +-------+-------+                                    |
|               | (Execution Begins)                         |
|               v                                            |
|       +---------------+                                    |
|       |    RUNNING    |                                    |
|       +---+-------+---+                                    |
|           |       |                                        |
| (Success) |       | (Error / Crash)                        |
|           v       v                                        |
|   +-----------+  +-----------+ (Retries Remaining)         |
|   | COMPLETED |  |  FAILED   |-----------------------------+
|   +-----------+  +-----+-----+  (runAt = NOW + Backoff + Jitter)
|                        |
|                        | (Retries Exhausted)
|                        v
|                  +-----------+
+------------------|   DLQ     | (Manual Replay / AI Triage)
  (Manual Replay)  +-----------+
```

### Core Invariant Implementations

1. **Compare-And-Swap (CAS) Claiming**:
   ```sql
   -- Atomic claim query executed by worker thread:
   UPDATE "Job"
   SET "state" = 'CLAIMED',
       "lockedBy" = :workerId,
       "updatedAt" = CURRENT_TIMESTAMP
   WHERE "id" = :candidateJobId
     AND "state" = 'QUEUED';
   ```
   If zero rows are updated, another concurrent worker acquired the job first. The worker immediately skips to the next eligible candidate.

2. **Exponential Backoff with Full Jitter**:
   $$\text{Delay}(n) = \min\left(\text{maxDelay}, \text{baseDelay} \times 2^n\right) \pm \text{random}(0, \text{jitterRange})$$
   Storing this as `runAt` in the database prevents thread starvation; workers remain 100% free to process other active jobs without sleeping.

3. **Graceful Worker Teardown**:
   Workers register `SIGINT` / `SIGTERM` hooks. Upon shutdown, they immediately stop claiming new `QUEUED` jobs, allow current `RUNNING` tasks to reach a terminal state within a configurable grace window (e.g., 10s), and release uncompleted locks.

---

## 7. Architectural Decisions & Trade-Offs

| Decision Area | Chosen Architecture | Evaluated Alternative | Engineering Justification & Trade-Off |
| :--- | :--- | :--- | :--- |
| **Storage Engine** | **Relational DB + Index CAS** *(Prisma/SQLite/Postgres)* | **In-Memory Redis** *(BullMQ / BRPOP)* | **Choice**: Full ACID guarantees, relational integrity, zero data loss on restart, and unified transactional queries.<br>**Trade-off**: Slightly higher polling latency than Redis in-memory queues, mitigated by composite indexing and indexed polling. |
| **Real-Time Telemetry** | **Server-Sent Events (SSE)** | **Bidirectional WebSockets** | **Choice**: Lightweight unidirectional server-to-client streaming operating over standard HTTP/2, native browser reconnection (`EventSource`), and zero socket state management.<br>**Trade-off**: Client commands are sent via standard REST endpoints rather than bidirectional socket frames. |
| **Task Allocation** | **Worker Pull (Polling + CAS)** | **Master Push / Dispatcher** | **Choice**: Natural backpressure—workers only claim jobs when capacity is available, eliminating worker buffer overflows.<br>**Trade-off**: Requires periodic query execution across worker instances. |
| **Retry Execution** | **Database-Driven `runAt` Promotion** | **In-Thread `sleep()` / Timers** | **Choice**: Zero thread blocking; workers remain fully available for immediate jobs. Server restarts preserve retry schedules.<br>**Trade-off**: Scheduler ticker must poll for due jobs every second. |
| **Idempotency Tier** | **API Gateway Boundary** | **Worker-Side Deduplication** | **Choice**: Rejects duplicates before consuming database write cycles or entering the execution pipeline.<br>**Trade-off**: Requires client to supply consistent `Idempotency-Key` headers on retryable operations. |

---

## 8. Automated Testing & Verification Suite

The repository includes both **deterministic automated test suites (Jest)** and an **in-app live concurrency verification harness**:

```
-----------------------------------------------------------------------------------------
 PASS  tests/scheduler.test.ts
  Distributed Scheduler Invariants
    ✓ Atomic CAS Lock: Prevents simultaneous dual claims (14ms)
    ✓ Exponential Backoff: Accurately computes backoff with jitter bounds (8ms)
    ✓ Dead Letter Queue: Routes poison jobs to DLQ on retry exhaustion (22ms)
    ✓ Rate Limiting: Token bucket enforces max concurrency per minute (18ms)
    ✓ Graceful Shutdown: Active jobs finish before worker termination (31ms)

 PASS  tests/idempotency.test.ts
  Idempotency & Deduplication Invariants
    ✓ Idempotent Ingestion: Concurrent identical submissions return identical Job ID (11ms)
    ✓ Payload Drift: Reused key with altered payload triggers validation error (6ms)

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        1.42s
-----------------------------------------------------------------------------------------
```

### In-App Synthetic Concurrency Tests (Accessible via UI & API)

Evaluators can click **"Run Live Verification"** in the **Test Suite** tab or call `POST /api/tests/run`:
- **Race Condition Bombardment**: Spawns 10 concurrent worker claims against a single `QUEUED` job. **Invariant Verified**: Exactly 1 worker succeeds; 9 receive CAS conflicts with zero double execution.
- **Idempotency Flood**: Sends 20 simultaneous duplicate HTTP requests with identical keys. **Invariant Verified**: Exactly 1 database insert occurs; 19 return the cached response.
- **DLQ Invariant Test**: Simulates deterministic failures through retry limits. **Invariant Verified**: Job transitions cleanly from `FAILED` to `DEAD_LETTERED` with error logs intact.

---

## 9. Assignment Requirement Coverage Matrix

| Assignment Requirement | Implementation Status | Direct Code / Documentation Evidence |
| :--- | :---: | :--- |
| **1. Authentication & Multi-Tenancy** | **100% Complete** | JWT auth middleware in `src/backend/auth.ts`, Organization/Project relational hierarchy in `prisma/schema.prisma` and `/server/routes.ts`. |
| **2. Priority Queues & Concurrency** | **100% Complete** | Priority-ordered polling (`priority DESC`), token bucket rate limiting in `server/scheduler.ts` and `src/components/QueueManager.tsx`. |
| **3. Varied Job Types (Immediate, Delayed, Cron, DAG)** | **100% Complete** | Cron parser, `runAt` delayed timestamps, DAG workflow executor in `src/components/WorkflowVisualizer.tsx` and `server/scheduler.ts`. |
| **4. Worker Pool & Graceful Shutdown** | **100% Complete** | Worker lifecycle engine in `server/worker.ts`, interactive scaling in `src/components/WorkerFleet.tsx`. |
| **5. State Machine & Atomic CAS Claiming** | **100% Complete** | Strict atomic CAS update logic in `server/worker.ts`, validated in `tests/scheduler.test.ts`. |
| **6. Retry Strategy & Exponential Backoff** | **100% Complete** | Jittered exponential backoff engine in `server/scheduler.ts`, customizable per queue. |
| **7. Dead Letter Queue & Diagnostics** | **100% Complete** | Poison pill triage, bulk replay, and AI diagnostics in `src/components/DeadLetterQueueView.tsx`. |
| **8. Real-Time Telemetry & Observability** | **100% Complete** | Server-Sent Events hub in `server/sse.ts`, real-time Gantt timeline in `src/components/ExecutionTimelineView.tsx`. |
| **9. REST API Quality & Documentation** | **100% Complete** | REST standards with validation and status codes in `server/routes.ts` and `docs/API.md`. |
| **10. Automated Tests & Invariant Verification** | **100% Complete** | Jest unit tests in `tests/` + synthetic live verification harness in `src/components/AutomatedTestRunner.tsx`. |

---

## 10. Submission Deliverables & Links

- **GitHub Source Code Repository**:  
  [https://github.com/nivedhavenkatesan2005-09/Distributed-Job-Scheduler](https://github.com/nivedhavenkatesan2005-09/Distributed-Job-Scheduler)
- **Live Production Deployment**:  
  [https://distributed-job-scheduler-3.onrender.com/](https://distributed-job-scheduler-3.onrender.com/)
- **Included Documentation Specifications**:
  - `docs/ARCHITECTURE.md` (System Architecture & Component Diagrams)
  - `docs/DATABASE_SCHEMA.md` (Relational Models & Index Strategy)
  - `docs/API.md` (Comprehensive REST Endpoint Specification)
  - `docs/DESIGN_DECISIONS.md` (Distributed Systems Trade-off Whitepaper)
  - `docs/TESTING.md` (Automated Test Suite & Synthetic Verification)
  - `docs/SUBMISSION_REPORT.html` (Print-ready, styled technical submission report)

---
*Prepared and submitted for the Codity.AI Distributed Job Scheduler Internship Technical Assignment.*
