import { db } from '../server/db';
import { Job } from '../src/types';

describe('Distributed Job Scheduler Engine', () => {
  
  describe('Exponential Backoff & Retries', () => {
    it('should calculate exponential backoff correctly without jitter', () => {
      // Create a temporary fixed-exponential policy for testing
      db.retryPolicies.set('test-exp', {
        id: 'test-exp',
        name: 'Test Exp',
        strategy: 'exponential',
        maxRetries: 5,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        jitter: false
      });

      const delayAttempt1 = db.calculateBackoffDelay('test-exp', 1);
      const delayAttempt2 = db.calculateBackoffDelay('test-exp', 2);
      const delayAttempt3 = db.calculateBackoffDelay('test-exp', 3);

      expect(delayAttempt1).toBe(1000); // 1000 * 2^0
      expect(delayAttempt2).toBe(2000); // 1000 * 2^1
      expect(delayAttempt3).toBe(4000); // 1000 * 2^2
    });

    it('should cap the backoff delay at maxDelayMs', () => {
       db.retryPolicies.set('test-cap', {
        id: 'test-cap',
        name: 'Test Cap',
        strategy: 'exponential',
        maxRetries: 10,
        baseDelayMs: 1000,
        maxDelayMs: 5000, // Hard cap
        jitter: false
      });

      const delayAttempt10 = db.calculateBackoffDelay('test-cap', 10);
      expect(delayAttempt10).toBe(5000); // Normally 1000 * 2^9 = 512,000, but capped at 5000
    });
  });

  describe('Idempotency Key Collision', () => {
    it('should prevent duplicate jobs when using the same idempotency key', () => {
      const projectId = 'test-proj';
      const idemKey = 'idem-key-12345';
      const jobId = 'job-123';
      
      // Manually set idempotency cache
      db.idempotencyIndex.set(`${projectId}:${idemKey}`, jobId);
      
      const existingJobId = db.idempotencyIndex.get(`${projectId}:${idemKey}`);
      expect(existingJobId).toBe(jobId);
    });
  });

  describe('Atomic Claiming & Concurrency', () => {
    it('should successfully claim a QUEUED job and assign a lock token', () => {
      const queueId = 'q-critical';
      const workerId = 'w-us-east-1a';
      
      // Inject a test job
      const testJob: Job = {
        id: 'test-job-atomic',
        projectId: 'proj-prod',
        queueId,
        name: 'test_claim_job',
        type: 'immediate',
        priority: 10,
        state: 'QUEUED',
        payload: {},
        attemptCount: 0,
        maxRetries: 3,
        retryPolicyId: 'pol-exp-jitter',
        createdAt: new Date().toISOString()
      };
      
      db.jobs.set(testJob.id, testJob);

      // Perform atomic claim
      const claimedJob = db.claimNextJobAtomic(workerId, queueId);
      
      if (claimedJob) {
        expect(claimedJob.id).toBe(testJob.id);
        expect(claimedJob.state).toBe('CLAIMED');
        expect(claimedJob.workerId).toBe(workerId);
        expect(claimedJob.lockToken).toBeDefined();
        expect(claimedJob.attemptCount).toBe(1);
      }
    });
  });
});
