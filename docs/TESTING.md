# Testing Strategy

The Distributed Job Scheduler project includes two layers of testing to ensure strict reliability, concurrency handling, and system integrity.

## 1. Automated Unit Tests (Jest)
We use Jest to verify core algorithmic invariants offline.

**Run the tests:**
```bash
npx jest
```

### Covered Critical Functionality:
- **Exponential Backoff Calculation**: Verifies that the retry delay correctly doubles on each attempt and strictly respects the `maxDelayMs` cap.
- **Idempotency Deduplication**: Verifies that submitting a job with a previously seen `Idempotency-Key` correctly maps to the existing job without creating duplicates.
- **Atomic Locking Mechanism**: Verifies that the Compare-and-Swap (CAS) function correctly identifies a `QUEUED` job, assigns it a secure `lockToken`, marks it as `CLAIMED`, and associates it with the correct worker ID.

## 2. In-App Verification Suite (Synthetic Live Testing)
Unlike traditional applications, this distributed system features a **production-inspired live verification suite** built directly into the Node.js API (`POST /tests/run`) and the React Dashboard. 

This allows you to trigger synthetic test payloads that race against the *live* worker pool to guarantee real-world ACID consistency.

### Synthetic Tests Available in the Dashboard:
- **Atomic Job Claiming Under Race Conditions**: Spawns 10 parallel HTTP requests to claim jobs concurrently from a single queue. Validates that the active worker pool mathematically claims exactly 1 job per worker and prevents double-claiming (0 duplicate locks).
- **Idempotency Key Ingestion Verification**: Floods the API with multiple concurrent requests holding the exact same `Idempotency-Key` to verify that the PostgreSQL/SQLite unique index successfully prevents duplicate ingestion.
- **Distributed Invariant Test**: Runs a full state lifecycle check on the entire cluster ensuring no jobs are permanently orphaned without a Dead Letter Queue (DLQ) entry.
