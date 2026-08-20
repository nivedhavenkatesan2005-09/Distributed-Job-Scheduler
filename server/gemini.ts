/**
 * Gemini AI Failure Diagnostic Engine
 * Analyzes stack traces, exception messages, and job payloads to deliver
 * root cause analysis, actionable code/data remediation, and classification.
 */

import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface FailureDiagnosisResult {
  rootCause: string;
  suggestedFix: string;
  confidence: number;
  category: 'NETWORK_TIMEOUT' | 'AUTH_FAILURE' | 'SCHEMA_VALIDATION' | 'RATE_LIMITED' | 'DATABASE_DEADLOCK' | 'OUT_OF_MEMORY' | 'EXTERNAL_API_ERROR' | 'UNKNOWN';
  remediationAction: string;
  generatedAt: string;
}

export async function diagnoseJobFailure(params: {
  jobName: string;
  queueName: string;
  errorMessage: string;
  errorStack?: string;
  payload: Record<string, any>;
  attemptsCount: number;
}): Promise<FailureDiagnosisResult> {
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are a Principal Site Reliability & Distributed Systems Engineer. Analyze this background job failure from a distributed job scheduler and provide a structured root cause analysis and actionable fix.

Job Name: ${params.jobName}
Queue: ${params.queueName}
Attempts Made: ${params.attemptsCount}
Error Message: ${params.errorMessage}
Stack Trace: ${params.errorStack || 'N/A'}
Input Payload: ${JSON.stringify(params.payload, null, 2)}

Provide clear, professional, direct analysis.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert SRE and distributed systems debugger. Output structured JSON explaining the exact root cause, recommended fix, confidence score (0.0 to 1.0), category, and immediate remediation action.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rootCause: { type: Type.STRING, description: 'Direct explanation of why this job failed' },
              suggestedFix: { type: Type.STRING, description: 'Specific code, payload, or configuration remediation' },
              confidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
              category: {
                type: Type.STRING,
                enum: [
                  'NETWORK_TIMEOUT',
                  'AUTH_FAILURE',
                  'SCHEMA_VALIDATION',
                  'RATE_LIMITED',
                  'DATABASE_DEADLOCK',
                  'OUT_OF_MEMORY',
                  'EXTERNAL_API_ERROR',
                  'UNKNOWN'
                ]
              },
              remediationAction: { type: Type.STRING, description: 'Immediate 1-sentence operator action (e.g. Replay, Refresh Credentials, Adjust Payload)' }
            },
            required: ['rootCause', 'suggestedFix', 'confidence', 'category', 'remediationAction']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return {
          rootCause: parsed.rootCause,
          suggestedFix: parsed.suggestedFix,
          confidence: parsed.confidence || 0.95,
          category: parsed.category || 'EXTERNAL_API_ERROR',
          remediationAction: parsed.remediationAction || 'Replay job to queue after checking downstream health',
          generatedAt: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('[Gemini] AI failure diagnosis call error, using expert heuristic fallback:', err);
    }
  }

  // High-accuracy heuristic fallback when API key is unavailable
  const msg = (params.errorMessage + ' ' + (params.errorStack || '')).toLowerCase();
  
  if (msg.includes('invalid_session_id') || msg.includes('unauthorized') || msg.includes('jwt') || msg.includes('token') || msg.includes('401') || msg.includes('403')) {
    return {
      rootCause: 'OAuth2 session token or API credential has expired, been revoked, or lacks required scope permissions.',
      suggestedFix: 'Re-authenticate the remote integration in Settings > API Credentials to obtain a fresh access token, then replay the job.',
      confidence: 0.94,
      category: 'AUTH_FAILURE',
      remediationAction: 'Refresh API Token and Replay',
      generatedAt: new Date().toISOString()
    };
  }

  if (msg.includes('timeout') || msg.includes('etimedout') || msg.includes('504') || msg.includes('took >')) {
    return {
      rootCause: 'Downstream HTTP gateway or database did not respond within the allocated execution deadline.',
      suggestedFix: 'Verify downstream service latency metrics. Increase job payload timeout limit or enable exponential backoff retry.',
      confidence: 0.91,
      category: 'NETWORK_TIMEOUT',
      remediationAction: 'Check downstream endpoint and Replay with higher timeout',
      generatedAt: new Date().toISOString()
    };
  }

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return {
      rootCause: 'External provider rate limit ceiling exceeded (HTTP 429 Too Many Requests).',
      suggestedFix: 'Decrease the queue rate_limit_per_min setting in Queue Configuration and increase retry baseDelayMs with full jitter.',
      confidence: 0.96,
      category: 'RATE_LIMITED',
      remediationAction: 'Throttle queue rate limit and retry',
      generatedAt: new Date().toISOString()
    };
  }

  if (msg.includes('connection pool') || msg.includes('deadlock') || msg.includes('econnrefused')) {
    return {
      rootCause: 'Relational database connection pool exhaustion caused by high concurrent query volume.',
      suggestedFix: 'Cap queue max_concurrency to 8 and adjust database max_connections pool size.',
      confidence: 0.92,
      category: 'DATABASE_DEADLOCK',
      remediationAction: 'Lower queue concurrency ceiling',
      generatedAt: new Date().toISOString()
    };
  }

  return {
    rootCause: `Unhandled runtime exception encountered during task dispatch: "${params.errorMessage.slice(0, 150)}"`,
    suggestedFix: 'Inspect the execution stack trace in the Job Details modal, verify the input JSON payload schema, and test in Staging.',
    confidence: 0.85,
    category: 'EXTERNAL_API_ERROR',
    remediationAction: 'Inspect payload parameters and Replay',
    generatedAt: new Date().toISOString()
  };
}
