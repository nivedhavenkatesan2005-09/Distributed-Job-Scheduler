# Distributed Job Scheduler

A production-inspired distributed job scheduling platform capable of reliably executing asynchronous background jobs across multiple workers. Built with a decoupled architecture to evaluate backend engineering, concurrency, and full-stack implementation.

🌐 **Live Demo:** [View Dashboard](https://job-scheduler-demo.onrender.com) *(Replace with your actual Render URL!)*

## 📚 Project Deliverables (Documentation)
All requested documentation and diagrams can be found in the `docs/` directory:
- [System Architecture Diagram](docs/ARCHITECTURE.md)
- [Database ER Diagram & Schema Details](docs/DATABASE_SCHEMA.md)
- [Design Decisions & Trade-offs](docs/DESIGN_DECISIONS.md)
- [REST API Documentation](docs/API.md)
- [Testing Strategy & Automated Tests](docs/TESTING.md)

## 🚀 Core Features
- **Job Lifecycle Management:** Full state machine (Queued → Scheduled → Claimed → Running → Completed/Failed).
- **Atomic Claiming:** Compare-and-swap (CAS) database locking prevents duplicate execution across distributed workers.
- **Idempotency:** Request deduplication using API `Idempotency-Key` headers.
- **Retry Engine:** Configurable retry policies including Exponential Backoff and Fixed Delay.
- **Dead Letter Queue (DLQ):** Permanent failure routing for manual triage.
- **Real-Time Telemetry:** Dashboard powered by Server-Sent Events (SSE).

## 💻 Local Setup Instructions

**Prerequisites:** 
- Node.js (v18+)

**1. Install Dependencies**
```bash
npm install
```

**2. Initialize the Database**
Generate the Prisma client and push the schema to the local SQLite file:
```bash
npx prisma generate
npx prisma db push
```

**3. Run the Development Server**
```bash
npm run dev
```
The dashboard will be available at `http://localhost:5173` and the API server at `http://localhost:3000`.

**4. Run Automated Tests**
```bash
npm run test
```

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js, TypeScript
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons
- **Database:** SQLite (via Prisma ORM)
- **Testing:** Jest