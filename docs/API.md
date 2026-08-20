# REST API Documentation

The Distributed Job Scheduler provides a clean RESTful API for managing queues, jobs, and workers. 

Base URL: `http://localhost:3000/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header.
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Jobs

### Create a Job
`POST /jobs`
Enqueues a new background job. Supports idempotency keys to prevent duplicate execution.

**Headers:**
- `Idempotency-Key` (optional): Unique string to prevent duplicates.

**Body:**
```json
{
  "name": "send_welcome_email",
  "queueId": "q-critical",
  "type": "immediate",
  "priority": 10,
  "payload": { "userId": "123" }
}
```
**Response:** `201 Created` - Returns the created Job object.

### List Jobs
`GET /jobs`
Returns a paginated list of jobs.

**Query Parameters:**
- `queueId` (optional): Filter by queue.
- `state` (optional): Filter by state (QUEUED, RUNNING, COMPLETED, FAILED).
- `page` (default: 1): Page number.
- `limit` (default: 50): Items per page.

### Retry Job
`POST /jobs/:id/retry`
Manually moves a failed or dead-lettered job back into the `QUEUED` state for execution.

---

## 2. Queues

### List Queues
`GET /queues`
Returns all queues along with real-time health statistics (queued count, active count, failure rate).

### Update Queue Configuration
`PUT /queues/:id`
Modify runtime queue parameters.

**Body:**
```json
{
  "maxConcurrency": 20,
  "rateLimitPerMin": 1000
}
```

### Pause Queue
`PATCH /queues/:id/pause`
Temporarily halts worker execution for this queue. Existing running jobs will finish, but no new jobs will be claimed.

---

## 3. Worker Fleet

### Scale Workers
`POST /workers/scale`
Dynamically scales the worker fleet up or down.

**Body:**
```json
{
  "targetCount": 5
}
```

### Graceful Shutdown
`POST /workers/:id/shutdown`
Signals a worker to stop accepting new jobs and gracefully shut down once its active jobs are completed.

---

## 4. Telemetry Stream

### Subscribe to Server-Sent Events (SSE)
`GET /events`
Opens a persistent HTTP connection to stream live telemetry, job state transitions, and worker heartbeats to the client dashboard in real-time.
