/**
 * Website Analysis Job Queue
 * 
 * Manages asynchronous deep-analysis jobs with controlled concurrency.
 * Ensures one failed/slow website cannot affect other users.
 * 
 * Architecture:
 * - In-memory priority queue
 * - Configurable worker pool
 * - Job lifecycle: PENDING → RUNNING → COMPLETED | FAILED | TIMEOUT
 * - Resource limits per job
 * - Observability hooks
 */

import { getBusinessVault, updateBusinessVault } from '../../ai/business-brain/vaultService.js';

// ─────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────

const CONFIG = {
  MAX_WORKERS: 4,
  MAX_QUEUE_SIZE: 200,
  JOB_TIMEOUT_MS: 60000,
  WORKER_POLL_INTERVAL_MS: 500,
  MAX_PAGES_PER_JOB: 8,
  MAX_HTML_SIZE_BYTES: 1 * 1024 * 1024,
};

// ─────────────────────────────────────────────────────────
// Job States
// ─────────────────────────────────────────────────────────

export const JOB_STATES = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
  CANCELLED: 'CANCELLED',
};

// ─────────────────────────────────────────────────────────
// In-Memory Queue Store
// ─────────────────────────────────────────────────────────

const jobQueue = [];
const activeJobs = new Map();
const jobHistory = new Map();
let workerInterval = null;
let isProcessing = false;
let jobIdCounter = 0;

// ─────────────────────────────────────────────────────────
// Job Creation
// ─────────────────────────────────────────────────────────

export function createAnalysisJob(options = {}) {
  const {
    userId,
    url,
    normalizedUrl,
    priority = 'NORMAL',
    existingEvidence = null,
    classification = null,
    requestedAt = new Date().toISOString(),
  } = options;

  const jobId = `job_${Date.now()}_${++jobIdCounter}`;

  const job = {
    jobId,
    userId,
    url,
    normalizedUrl,
    priority,
    existingEvidence,
    classification,
    state: JOB_STATES.PENDING,
    createdAt: requestedAt,
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    retryCount: 0,
    maxRetries: 2,
    pagesAnalyzed: 0,
    timeoutMs: CONFIG.JOB_TIMEOUT_MS,
  };

  // Insert by priority
  const priorityOrder = { HIGH: 0, NORMAL: 1, LOW: 2 };
  const insertIndex = jobQueue.findIndex(j => priorityOrder[j.priority] > priorityOrder[priority]);
  
  if (insertIndex === -1) {
    jobQueue.push(job);
  } else {
    jobQueue.splice(insertIndex, 0, job);
  }

  return job;
}

// ─────────────────────────────────────────────────────────
// Job Processing
// ─────────────────────────────────────────────────────────

async function processJob(job) {
  job.state = JOB_STATES.RUNNING;
  job.startedAt = new Date().toISOString();
  activeJobs.set(job.jobId, job);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`JOB_TIMEOUT: ${job.timeoutMs}ms`));
    }, job.timeoutMs);
  });

  try {
    const resultPromise = executeDeepAnalysis(job);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    job.state = JOB_STATES.COMPLETED;
    job.completedAt = new Date().toISOString();
    job.result = result;
    jobHistory.set(job.jobId, job);
    activeJobs.delete(job.jobId);

    // Persist result to business vault
    if (result && job.userId) {
      try {
        const vaultUpdate = {
          ...result,
          deepAnalysisCompletedAt: new Date().toISOString(),
          deepAnalysisJobId: job.jobId,
        };
        updateBusinessVault(job.userId, vaultUpdate);
      } catch (e) {
        console.warn(`[AnalysisQueue] Failed to persist result for job ${job.jobId}:`, e.message);
      }
    }

    return result;
  } catch (error) {
    job.state = error.message.includes('TIMEOUT') ? JOB_STATES.TIMEOUT : JOB_STATES.FAILED;
    job.completedAt = new Date().toISOString();
    job.error = error.message;
    jobHistory.set(job.jobId, job);
    activeJobs.delete(job.jobId);

    console.warn(`[AnalysisQueue] Job ${job.jobId} ${job.state}:`, error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// Deep Analysis Execution
// ─────────────────────────────────────────────────────────

async function executeDeepAnalysis(job) {
  const { url, normalizedUrl, userId, existingEvidence } = job;
  
  // Dynamic import to avoid circular dependencies
  const { retrieveWebsiteEvidence } = await import('../routes/websiteRetrievalService.js');
  const { extractAndSyncBusinessProfile } = await import('../../ai/summary-engine/profileExtractor.js');
  const { runAIIntelligencePipeline } = await import('../services/aiIntelligenceService.js');

  // Get user vault
  const vault = getBusinessVault(userId);

  // Step 1: Re-run retrieval with deep sub-page analysis
  const websiteResult = await retrieveWebsiteEvidence(normalizedUrl || url);
  
  if (!websiteResult.success) {
    throw new Error(`Deep analysis retrieval failed: ${websiteResult.failureReason || websiteResult.userMessage}`);
  }

  const evidenceItems = websiteResult.evidenceItems || [];
  const primaryPage = websiteResult.primaryPage || {};

  // Step 2: Run AI intelligence pipeline with full evidence
  let aiResult = null;
  try {
    aiResult = await runAIIntelligencePipeline({
      userId,
      vault,
      evidenceItems,
      analysisId: `deep_${Date.now()}`,
      promptType: 'ADDI_RECOMMENDATION_ENGINE'
    });
  } catch (e) {
    console.warn(`[AnalysisQueue] AI pipeline failed for job ${job.jobId}:`, e.message);
  }

  // Step 3: Extract and sync business profile (convert evidence to text summary)
  let profileUpdate = {};
  try {
    if (evidenceItems.length > 0) {
      const evidenceSummary = evidenceItems
        .map(e => `[${e.evidenceType || e.field || 'evidence'}] ${e.observation}: ${e.evidence || e.content || ''}`)
        .join('\n');
      const userMessageText = `Website analysis evidence for ${normalizedUrl || url}:\n\n${evidenceSummary}`;
      profileUpdate = await extractAndSyncBusinessProfile(userId, userMessageText);
    }
  } catch (e) {
    console.warn(`[AnalysisQueue] Profile extraction failed for job ${job.jobId}:`, e.message);
  }

  return {
    websiteResult,
    evidenceItems,
    primaryPage,
    aiResult,
    profileUpdate,
    pagesAnalyzed: websiteResult.retrievalMeta?.pagesInspected?.length || 1,
  };
}

// ─────────────────────────────────────────────────────────
// Queue Management
// ─────────────────────────────────────────────────────────

function startWorkers() {
  if (workerInterval) return;

  workerInterval = setInterval(async () => {
    if (isProcessing) return;
    if (jobQueue.length === 0) return;
    if (activeJobs.size >= CONFIG.MAX_WORKERS) return;

    isProcessing = true;

    try {
      const job = jobQueue.shift();
      if (!job) {
        isProcessing = false;
        return;
      }

      // Check if job was cancelled
      if (job.state === JOB_STATES.CANCELLED) {
        isProcessing = false;
        return;
      }

      await processJob(job);
    } catch (error) {
      console.warn('[AnalysisQueue] Worker error:', error.message);
    } finally {
      isProcessing = false;
    }
  }, CONFIG.WORKER_POLL_INTERVAL_MS);
}

function stopWorkers() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

export const analysisQueue = {
  start() {
    startWorkers();
  },

  stop() {
    stopWorkers();
  },

  enqueue(options) {
    if (jobQueue.length >= CONFIG.MAX_QUEUE_SIZE) {
      throw new Error(`Queue full: ${CONFIG.MAX_QUEUE_SIZE} jobs maximum`);
    }

    const job = createAnalysisJob(options);
    console.log(`[AnalysisQueue] Enqueued job ${job.jobId} for ${options.url} (priority: ${options.priority || 'NORMAL'})`);
    return job;
  },

  getJob(jobId) {
    return activeJobs.get(jobId) || jobHistory.get(jobId) || null;
  },

  getActiveJobs() {
    return Array.from(activeJobs.values());
  },

  getQueueLength() {
    return jobQueue.length;
  },

  getActiveCount() {
    return activeJobs.size;
  },

  cancelJob(jobId) {
    const job = activeJobs.get(jobId) || jobQueue.find(j => j.jobId === jobId);
    if (job) {
      job.state = JOB_STATES.CANCELLED;
      const index = jobQueue.indexOf(job);
      if (index > -1) jobQueue.splice(index, 1);
      activeJobs.delete(jobId);
      console.log(`[AnalysisQueue] Cancelled job ${jobId}`);
      return true;
    }
    return false;
  },

  getStats() {
    return {
      queueLength: jobQueue.length,
      activeJobs: activeJobs.size,
      totalProcessed: jobHistory.size,
      completed: Array.from(jobHistory.values()).filter(j => j.state === JOB_STATES.COMPLETED).length,
      failed: Array.from(jobHistory.values()).filter(j => j.state === JOB_STATES.FAILED).length,
      timeout: Array.from(jobHistory.values()).filter(j => j.state === JOB_STATES.TIMEOUT).length,
    };
  },

  updateConfig(newConfig) {
    Object.assign(CONFIG, newConfig);
  },
};

// Auto-start workers
analysisQueue.start();
