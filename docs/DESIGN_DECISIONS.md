# Design Decisions & Trade-offs

This document outlines the major architectural decisions and trade-offs made while building the Distributed Job Scheduler.

## 1. Relational Database vs Redis for Queueing
**Decision:** Used a relational database (PostgreSQL/SQLite via Prisma) for the primary queuing engine instead of an in-memory datastore like Redis.
**Trade-offs:**
- *Pros:* Simpler operational architecture (only one datastore required), strong ACID guarantees, prevents orphaned jobs, easy complex querying (e.g., "Find all failed jobs for User X between Monday and Tuesday").
- *Cons:* Polling a relational DB is slower than a Redis `BRPOP`.
- *Mitigation:* We heavily indexed the `[state, runAt]` and `[queueId, state]` columns to ensure polling queries use index-only scans. We also implemented an atomic Compare-And-Swap (CAS) locking mechanism to prevent race conditions without needing table-level locks.

## 2. Server-Sent Events (SSE) vs WebSockets for Live Updates
**Decision:** The dashboard uses Server-Sent Events (SSE) for live telemetry instead of WebSockets.
**Trade-offs:**
- *Pros:* SSE runs over standard HTTP, making it trivial to load balance and proxy through firewalls compared to stateful WebSocket upgrades. It natively handles automatic reconnections and fits perfectly for a unidirectional stream (Server -> Dashboard).
- *Cons:* SSE is unidirectional. The client cannot push data back over the same socket.
- *Mitigation:* The dashboard uses standard REST API `POST/PATCH` calls to send commands (e.g., pausing a queue, retrying a job), which works flawlessly alongside the SSE downstream.

## 3. Worker Polling vs Event-Driven Push
**Decision:** Workers actively poll the database for new jobs rather than having the server push jobs to them.
**Trade-offs:**
- *Pros:* Natural backpressure. A worker will only poll when it has available concurrency slots. If all workers are busy, jobs simply wait in the database. This prevents workers from being overwhelmed by a central dispatcher pushing too many tasks.
- *Cons:* Polling introduces slight latency (the polling interval) and uses idle database CPU cycles.

## 4. Retries & Exponential Backoff Design
**Decision:** Retry calculation is evaluated at the *time of failure*, and the job is scheduled in the future using a `runAt` timestamp.
**Trade-offs:**
- *Pros:* Keeps the core worker execution loop simple. The worker doesn't need to block or sleep (which would waste a concurrency slot).
- *Cons:* The scheduler ticker must continuously scan for jobs where `runAt <= NOW()`.

## 5. Idempotency Key Handling
**Decision:** Handled at the API boundary before jobs hit the queue.
- If a client submits a job with an `Idempotency-Key` that already exists in the cache/index, the API immediately returns the existing Job ID and ignores the new payload. This prevents double-charging customers or sending duplicate emails during network hiccups.
