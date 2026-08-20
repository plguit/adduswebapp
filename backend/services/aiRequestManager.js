/**
 * ADDUS Platform — AI Request Manager
 *
 * Centralized governance for all AI/LLM requests.
 * Enforces token budgets, caching, fingerprinting, context selection, and rate-limit protection.
 *
 * No component may call Groq/LLM directly.
 * All requests must route through this manager.
 */

import { getGroqClient, PRIMARY_MODEL, FALLBACK_MODEL, withModelFallback, cleanLLMOutput, handleAIError } from '../../ai/aiHelpers.js';
import { getBusinessVault } from '../../ai/business-brain/vaultService.js';
import { evidenceStore, getEvidenceSummary, EVIDENCE_TYPES } from './evidenceService.js';
import { classifyIntent, getContextSourcesForIntent, getRequiredFieldsForIntent, INTENT_CATEGORIES } from './intentClassifier.js';
import { recordObservation } from './observationStore.js';

// ─────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────

const MAX_INPUT_TOKENS = 4000;
const MAX_OUTPUT_TOKENS = 2048;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const FINGERPRINT_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────

export const REQUEST_TYPES = {
  BUSINESS_PROFILE: {
    name: 'BUSINESS_PROFILE',
    maxInputTokens: 2500,
    maxOutputTokens: 1000,
    allowedContextSources: ['website_evidence', 'vault_identity', 'vault_contact'],
    requiredContextFields: ['businessName', 'industry', 'services']
  },
  WEBSITE_SUMMARY: {
    name: 'WEBSITE_SUMMARY',
    maxInputTokens: 2000,
    maxOutputTokens: 512,
    allowedContextSources: ['website_evidence'],
    requiredContextFields: ['evidenceItems']
  },
  DELIVERABLE_ASSESSMENT: {
    name: 'DELIVERABLE_ASSESSMENT',
    maxInputTokens: 1800,
    maxOutputTokens: 700,
    allowedContextSources: ['website_evidence', 'vault_brand', 'vault_products'],
    requiredContextFields: ['existingAssets', 'evidenceItems']
  },
  RECOMMENDATIONS: {
    name: 'RECOMMENDATIONS',
    maxInputTokens: 2500,
    maxOutputTokens: 1000,
    allowedContextSources: ['website_evidence', 'vault_all', 'strategic_intelligence'],
    requiredContextFields: ['businessUnderstanding', 'evidenceSummary']
  },
  STRATEGIC_ANALYSIS: {
    name: 'STRATEGIC_ANALYSIS',
    maxInputTokens: 3000,
    maxOutputTokens: 1200,
    allowedContextSources: ['website_evidence', 'vault_all', 'strategic_intelligence', 'research'],
    requiredContextFields: ['businessUnderstanding', 'evidenceSummary', 'serviceAssessments']
  },
  CHAT_RESPONSE: {
    name: 'CHAT_RESPONSE',
    maxInputTokens: 1800,
    maxOutputTokens: 700,
    allowedContextSources: ['vault_all', 'strategic_intelligence', 'conversation_history'],
    requiredContextFields: ['businessName', 'strategicIntelligence']
  },
  COMPETITOR_ANALYSIS: {
    name: 'COMPETITOR_ANALYSIS',
    maxInputTokens: 2200,
    maxOutputTokens: 900,
    allowedContextSources: ['website_evidence', 'vault_all', 'external_research'],
    requiredContextFields: ['businessUnderstanding', 'evidenceSummary']
  },
  RESEARCH_SYNTHESIS: {
    name: 'RESEARCH_SYNTHESIS',
    maxInputTokens: 2500,
    maxOutputTokens: 1000,
    allowedContextSources: ['external_research', 'vault_all'],
    requiredContextFields: ['researchItems']
  }
};

// ─────────────────────────────────────────────────────────
// Cache / Memory
// ─────────────────────────────────────────────────────────

const requestCache = new Map();
const inFlightRequests = new Map();

function getCacheKey(fingerprint, requestType) {
  return `${requestType}:${fingerprint}`;
}

function getFromCache(cacheKey) {
  const entry = requestCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    requestCache.delete(cacheKey);
    return null;
  }
  entry.hits = (entry.hits || 0) + 1;
  return entry.result;
}

function setCache(cacheKey, result) {
  requestCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    hits: 0
  });
}

function getInFlight(fingerprint, requestType) {
  const key = `${requestType}:${fingerprint}`;
  return inFlightRequests.get(key) || null;
}

function setInFlight(fingerprint, requestType, promise) {
  const key = `${requestType}:${fingerprint}`;
  inFlightRequests.set(key, promise);
}

function clearInFlight(fingerprint, requestType) {
  const key = `${requestType}:${fingerprint}`;
  inFlightRequests.delete(key);
}

// ─────────────────────────────────────────────────────────
// Fingerprinting
// ─────────────────────────────────────────────────────────

export function computeFingerprint(inputs = {}) {
  const parts = [
    inputs.userId || '',
    inputs.businessId || '',
    inputs.productId || '',
    inputs.projectId || '',
    inputs.websiteUrl || '',
    inputs.evidenceVersion || '',
    inputs.analysisVersion || '1',
    inputs.requestType || '',
    JSON.stringify(inputs.context || {})
  ];
  const raw = parts.join('|');
  
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ─────────────────────────────────────────────────────────
// Token Estimation (rough: 1 token ≈ 4 chars)
// ─────────────────────────────────────────────────────────

function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
}

function estimateMessageTokens(messages) {
  if (!Array.isArray(messages)) return 0;
  return messages.reduce((total, msg) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '');
    return total + estimateTokens(content) + 4; // +4 for role/format overhead
  }, 0);
}

// ─────────────────────────────────────────────────────────
// Context Selector
// ─────────────────────────────────────────────────────────

function selectContext(requestType, userId, options = {}) {
  const vault = getBusinessVault(userId);
  const evidence = evidenceStore.getAllEvidence();
  const evidenceSummary = getEvidenceSummary(evidence);
  
  const context = {};
  const requestConfig = REQUEST_TYPES[requestType] || REQUEST_TYPES.CHAT_RESPONSE;
  
  // Detect intent from user message for smarter context selection
  let intent = INTENT_CATEGORIES.GENERAL_CHAT;
  let intentSources = requestConfig.allowedContextSources;
  let intentRequiredFields = [];
  
  if (requestType === 'CHAT_RESPONSE' && options.userMessage) {
    intent = classifyIntent(options.userMessage);
    intentSources = getContextSourcesForIntent(intent);
    intentRequiredFields = getRequiredFieldsForIntent(intent);
  }
  
  const effectiveSources = [...new Set([...requestConfig.allowedContextSources, ...intentSources])];
  
  // Always include basic identity if available
  if (vault.businessName) context.businessName = vault.businessName;
  if (vault.industry) context.industry = vault.industry;
  if (vault.websiteUrl) context.websiteUrl = vault.websiteUrl;
  context.intent = intent;
  
  // Select evidence based on effective context sources
  if (effectiveSources.includes('website_evidence')) {
    const relevantEvidence = evidence
      .filter(e => effectiveSources.includes(`evidence_${e.evidenceType}`) || 
                   effectiveSources.includes('website_evidence'))
      .slice(0, 12)
      .map(e => ({
        evidenceId: e.evidenceId,
        evidenceType: e.evidenceType,
        title: e.title,
        content: e.content.slice(0, 300),
        sourceUrl: e.sourceUrl,
        confidence: e.confidence,
        provenance: e.provenance
      }));
    context.evidenceItems = relevantEvidence;
    context.evidenceSummary = {
      totalItems: evidenceSummary.totalItems,
      highQualityItems: evidenceSummary.highQualityItems,
      typesCovered: evidenceSummary.typesCovered
    };
  }
  
  // Select vault fields based on effective context sources
  if (effectiveSources.includes('vault_identity')) {
    context.businessDescription = vault.businessDescription;
    context.contactInfo = vault.contactInfo;
    context.socialLinks = vault.socialLinks;
  }
  
  if (effectiveSources.includes('vault_brand')) {
    context.brandAssets = vault.brandAssets;
    context.discoveredAssets = vault.discoveredAssets || [];
  }
  
  if (effectiveSources.includes('vault_products')) {
    context.products = vault.products || [];
    context.services = vault.services;
  }
  
  if (effectiveSources.includes('vault_all') || 
      effectiveSources.includes('vault_identity')) {
    context.businessStage = vault.businessStage;
    context.targetAudience = vault.targetAudience;
    context.geographicMarket = vault.geographicMarket;
    context.idealCustomer = vault.idealCustomer;
    context.pricingPosition = vault.pricingPosition;
    context.businessGoal = vault.businessGoal;
    context.currentChallenge = vault.currentChallenge;
    context.competitiveAdvantage = vault.competitiveAdvantage;
  }
  
  if (effectiveSources.includes('strategic_intelligence')) {
    const recentIntelligence = (vault.strategicIntelligence || []).slice(-5);
    context.strategicIntelligence = recentIntelligence;
  }
  
  if (effectiveSources.includes('conversation_history')) {
    context.chatHistory = (vault.chatHistory || []).slice(-10);
  }
  
  // Include intent-required fields
  for (const field of intentRequiredFields) {
    if (context[field] === undefined && vault[field] !== undefined) {
      context[field] = vault[field];
    }
  }
  
  if (options.productId) {
    const product = (vault.products || []).find(p => p.productId === options.productId);
    if (product) context.selectedProduct = product;
  }
  
  if (options.projectId) {
    const project = (vault.projects || []).find(p => p.projectId === options.projectId || p.id === options.projectId);
    if (project) context.selectedProject = project;
  }
  
  return context;
}

// ─────────────────────────────────────────────────────────
// Token Budget Check
// ─────────────────────────────────────────────────────────

function checkTokenBudget(requestType, messages, context) {
  const requestConfig = REQUEST_TYPES[requestType] || REQUEST_TYPES.CHAT_RESPONSE;
  const messageTokens = estimateMessageTokens(messages);
  const contextTokens = estimateTokens(JSON.stringify(context));
  const totalEstimated = messageTokens + contextTokens;
  
  const violations = [];
  
  if (messageTokens > requestConfig.maxInputTokens * 0.7) {
    violations.push(`Message context exceeds 70% of budget: ${messageTokens} > ${Math.floor(requestConfig.maxInputTokens * 0.7)}`);
  }
  
  if (totalEstimated > requestConfig.maxInputTokens) {
    violations.push(`Total estimated tokens ${totalEstimated} exceeds budget ${requestConfig.maxInputTokens}`);
  }
  
  return {
    withinBudget: violations.length === 0,
    messageTokens,
    contextTokens,
    totalEstimated,
    maxBudget: requestConfig.maxInputTokens,
    violations
  };
}

// ─────────────────────────────────────────────────────────
// Compact Context
// ─────────────────────────────────────────────────────────

function compactContext(context, budgetCheck) {
  if (budgetCheck.withinBudget) return context;
  
  const compacted = { ...context };
  
  // Remove large arrays first
  if (compacted.evidenceItems && compacted.evidenceItems.length > 5) {
    compacted.evidenceItems = compacted.evidenceItems.slice(0, 5);
  }
  
  if (compacted.strategicIntelligence && compacted.strategicIntelligence.length > 3) {
    compacted.strategicIntelligence = compacted.strategicIntelligence.slice(-3);
  }
  
  if (compacted.chatHistory && compacted.chatHistory.length > 5) {
    compacted.chatHistory = compacted.chatHistory.slice(-5);
  }
  
  // Truncate evidence content
  if (Array.isArray(compacted.evidenceItems)) {
    compacted.evidenceItems = compacted.evidenceItems.map(e => ({
      ...e,
      content: e.content ? e.content.slice(0, 150) : ''
    }));
  }
  
  return compacted;
}

// ─────────────────────────────────────────────────────────
// Request Logging
// ─────────────────────────────────────────────────────────

function logRequest(requestType, userId, options, budgetCheck, cacheHit, model, status, duration, tokensUsed = null, retryCount = 0, error = null) {
  const logEntry = {
    requestId: options.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    requestType,
    userId,
    businessId: options.businessId || userId,
    productId: options.productId || null,
    projectId: options.projectId || null,
    provider: 'groq',
    model,
    status,
    cacheHit,
    retryCount,
    messageTokens: budgetCheck.messageTokens,
    contextTokens: budgetCheck.contextTokens,
    estimatedInputTokens: budgetCheck.totalEstimated,
    actualInputTokens: tokensUsed?.input || null,
    estimatedOutputTokens: REQUEST_TYPES[requestType]?.maxOutputTokens || 1024,
    actualOutputTokens: tokensUsed?.output || null,
    estimatedCost: estimateCost(budgetCheck.totalEstimated, REQUEST_TYPES[requestType]?.maxOutputTokens || 1024),
    duration,
    timestamp: new Date().toISOString(),
    error: error ? { status: error.status, name: error.name, message: error.message } : null
  };
  
  console.log('[AI Request Manager]', JSON.stringify(logEntry));
  
  try {
    recordObservation({
      category: 'AI_REQUESTS',
      ...logEntry
    });
  } catch (e) {
    console.warn('[Observation] Failed to record AI request:', e.message);
  }
  
  return logEntry;
}

function estimateCost(inputTokens, outputTokens) {
  const inputCostPer1K = 0.0001;
  const outputCostPer1K = 0.0002;
  return ((inputTokens / 1000) * inputCostPer1K) + ((outputTokens / 1000) * outputCostPer1K);
}

// ─────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────

export async function executeAIRequest(requestType, userId, messages, options = {}) {
  const startTime = Date.now();
  const requestConfig = REQUEST_TYPES[requestType] || REQUEST_TYPES.CHAT_RESPONSE;
  
  // 1. Compute fingerprint
  const fingerprintInputs = {
    userId,
    businessId: options.businessId || userId,
    productId: options.productId || null,
    projectId: options.projectId || null,
    websiteUrl: options.websiteUrl || '',
    evidenceVersion: options.evidenceVersion || '',
    analysisVersion: options.analysisVersion || '1',
    requestType,
    context: options.context || {}
  };
  const fingerprint = computeFingerprint(fingerprintInputs);
  
  // 2. Check cache
  const cacheKey = getCacheKey(fingerprint, requestType);
  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    logRequest(requestType, userId, options, { messageTokens: 0, contextTokens: 0, totalEstimated: 0, maxBudget: requestConfig.maxInputTokens, withinBudget: true, violations: [] }, true, 'CACHE', 'CACHE_HIT', Date.now() - startTime);
    return { ...cachedResult, cacheHit: true };
  }
  
   // 3. Check in-flight deduplication (skip for streaming — streams cannot be replayed)
   const isStreaming = options.stream === true;
   const inFlight = getInFlight(fingerprint, requestType);
   if (inFlight && !isStreaming) {
     try {
       const result = await inFlight;
       logRequest(requestType, userId, options, { messageTokens: 0, contextTokens: 0, totalEstimated: 0, maxBudget: requestConfig.maxInputTokens, withinBudget: true, violations: [] }, true, 'INFLIGHT', 'INFLIGHT_HIT', Date.now() - startTime);
       return { ...result, cacheHit: true, inFlight: true };
     } catch (err) {
       clearInFlight(fingerprint, requestType);
     }
   }
  
  // 4. Build context
  const userMessage = Array.isArray(messages) 
    ? messages.filter(m => m.role === 'user').pop()?.content 
    : (typeof messages === 'string' ? messages : '');
  const context = options.context || selectContext(requestType, userId, { ...options, userMessage });
  
  // 5. Merge user messages with context
  const systemPrompt = options.systemPrompt || buildSystemPrompt(requestType, context);
  const userPrompt = options.userPrompt || buildUserPrompt(requestType, context, messages);
  
  const mergedMessages = [
    { role: 'system', content: systemPrompt },
    ...(Array.isArray(messages) ? messages : [{ role: 'user', content: messages }]),
    { role: 'user', content: userPrompt }
  ];
  
  // 6. Token budget check
  const budgetCheck = checkTokenBudget(requestType, mergedMessages, context);
  
  if (!budgetCheck.withinBudget) {
    const compactedContext = compactContext(context, budgetCheck);
    const compactedPrompt = options.systemPrompt || buildSystemPrompt(requestType, compactedContext);
    const recheck = checkTokenBudget(requestType, mergedMessages, compactedContext);
    
    if (!recheck.withinBudget) {
      logRequest(requestType, userId, options, recheck, false, 'NONE', 'BUDGET_EXCEEDED', Date.now() - startTime);
      return {
        content: 'Request exceeds token budget. Please reduce context or contact support.',
        error: 'BUDGET_EXCEEDED',
        budgetCheck: recheck,
        cacheHit: false
      };
    }
    
    // Retry with compacted context
    const compactedUserPrompt = options.userPrompt || buildUserPrompt(requestType, compactedContext, messages);
    mergedMessages[0] = { role: 'system', content: compactedPrompt };
    mergedMessages[mergedMessages.length - 1] = { role: 'user', content: compactedUserPrompt };
  }
  
  // 7. Execute LLM request (with in-flight deduplication)
  const requestPromise = (async () => {
    try {
      const client = getGroqClient();
      
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === '') {
        return {
          content: 'GROQ_API_KEY is not configured.',
          error: 'MISSING_API_KEY',
          cacheHit: false
        };
      }
      
      const targetModel = options.modelOverride || PRIMARY_MODEL;
      const runCompletion = async (model) => {
        if (isStreaming) {
          const responseStream = await client.chat.completions.create({
            model,
            messages: mergedMessages,
            stream: true,
            temperature: options.temperature || 0.4,
            max_tokens: Math.min(requestConfig.maxOutputTokens, MAX_OUTPUT_TOKENS)
          });

          let rawContent = '';
          for await (const chunk of responseStream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
              rawContent += token;
              if (typeof options.onChunk === 'function') {
                options.onChunk(cleanLLMOutput(token));
              }
            }
          }
          return {
            content: cleanLLMOutput(rawContent),
            modelUsed: model,
            usage: null
          };
        } else {
          const response = await client.chat.completions.create({
            model,
            messages: mergedMessages,
            stream: false,
            temperature: options.temperature || 0.4,
            max_tokens: Math.min(requestConfig.maxOutputTokens, MAX_OUTPUT_TOKENS)
          });

          const rawText = response.choices[0]?.message?.content || '';
          return {
            content: cleanLLMOutput(rawText),
            modelUsed: model,
            usage: response.usage ? {
              input: response.usage.prompt_tokens,
              output: response.usage.completion_tokens,
              total: response.usage.total_tokens
            } : null
          };
        }
      };
      
      const result = await withModelFallback(runCompletion, targetModel, FALLBACK_MODEL);
      
      // 8. Cache result
      setCache(cacheKey, result);
      
      const duration = Date.now() - startTime;
      logRequest(requestType, userId, options, budgetCheck, false, result.modelUsed, 'SUCCESS', duration, result.usage);
      
      return { ...result, cacheHit: false, fingerprint, requestType };
      
    } catch (err) {
      const duration = Date.now() - startTime;
      logRequest(requestType, userId, options, budgetCheck, false, 'ERROR', 'ERROR', duration, null, 0, err);
      
      return {
        content: handleAIError(err),
        error: err.status || err.name || 'EXECUTION_FAILED',
        cacheHit: false
      };
    } finally {
      clearInFlight(fingerprint, requestType);
    }
  })();
  
  setInFlight(fingerprint, requestType, requestPromise);
  return requestPromise;
}

// ─────────────────────────────────────────────────────────
// Prompt Builders
// ─────────────────────────────────────────────────────────

function buildSystemPrompt(requestType, context) {
  const base = `You are ADDI, ADDUS's business intelligence AI. Use only provided evidence. Do not invent. Distinguish FACT, INFERENCE, and RECOMMENDATION.`;
  
  switch (requestType) {
    case 'BUSINESS_PROFILE':
      return `${base}\n\nExtract a structured business profile from the provided website evidence. If a field cannot be determined, set it to null.`;
    
    case 'WEBSITE_SUMMARY':
      return `${base}\n\nProvide a concise summary of the business based on website evidence.`;
    
    case 'DELIVERABLE_ASSESSMENT':
      return `${base}\n\nAssess which deliverables are relevant based on existing assets and gaps.`;
    
    case 'RECOMMENDATIONS':
      return `${base}\n\nGenerate evidence-driven service recommendations. Negative assessments are required when evidence shows sufficiency.`;
    
    case 'STRATEGIC_ANALYSIS':
      return `${base}\n\nPerform strategic analysis: business understanding, gaps, opportunities, recommendations, priority.`;
    
    case 'CHAT_RESPONSE':
      return `${base}\n\nRespond concisely to the user's question using available context.`;
    
    case 'COMPETITOR_ANALYSIS':
      return `${base}\n\nAnalyze competitors based on available research and evidence. Do not guess.`;
    
    case 'RESEARCH_SYNTHESIS':
      return `${base}\n\nSynthesize research findings into structured insights.`;
    
    default:
      return base;
  }
}

function buildUserPrompt(requestType, context, messages) {
  const contextStr = JSON.stringify(context, null, 2);
  
  switch (requestType) {
    case 'BUSINESS_PROFILE':
      return `Extract the business profile from this evidence:\n\n${contextStr}`;
    
    case 'WEBSITE_SUMMARY':
      return `Summarize this business based on website evidence:\n\n${contextStr}`;
    
    case 'DELIVERABLE_ASSESSMENT':
      return `Assess deliverables for this business:\n\n${contextStr}`;
    
    case 'RECOMMENDATIONS':
      return `Generate recommendations for this business:\n\n${contextStr}`;
    
    case 'STRATEGIC_ANALYSIS':
      return `Perform strategic analysis:\n\n${contextStr}`;
    
    case 'CHAT_RESPONSE':
      const lastUserMsg = Array.isArray(messages) 
        ? messages.filter(m => m.role === 'user').pop() 
        : null;
      const userText = lastUserMsg ? lastUserMsg.content : (typeof messages === 'string' ? messages : '');
      return `Context: ${contextStr.slice(0, 2000)}\n\nUser message: ${userText}`;
    
    case 'COMPETITOR_ANALYSIS':
      return `Analyze competitors:\n\n${contextStr}`;
    
    case 'RESEARCH_SYNTHESIS':
      return `Synthesize research:\n\n${contextStr}`;
    
    default:
      return contextStr;
  }
}

// ─────────────────────────────────────────────────────────
// Cache Management
// ─────────────────────────────────────────────────────────

export function clearCache(pattern = null) {
  if (pattern) {
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
}

export function getCacheStats() {
  let totalHits = 0;
  let totalEntries = 0;
  
  for (const entry of requestCache.values()) {
    totalEntries++;
    totalHits += entry.hits || 0;
  }
  
  return {
    totalEntries,
    totalHits,
    hitRate: totalEntries > 0 ? totalHits / totalEntries : 0
  };
}

export function getCacheStaleness() {
  const now = Date.now();
  const entries = [];
  
  for (const [key, entry] of requestCache.entries()) {
    entries.push({
      key,
      ageMs: now - entry.timestamp,
      stale: now - entry.timestamp > CACHE_TTL_MS,
      hits: entry.hits || 0
    });
  }
  
  return entries.sort((a, b) => b.ageMs - a.ageMs);
}

export function invalidateCacheForUser(userId) {
  clearCache(userId);
}

// ─────────────────────────────────────────────────────────
// Direct Provider Call (for infrastructure only)
// ─────────────────────────────────────────────────────────

export async function executeDirectAIRequest(messages, options = {}) {
  const client = getGroqClient();
  const model = options.model || PRIMARY_MODEL;
  
  const response = await client.chat.completions.create({
    model,
    messages,
    stream: options.stream || false,
    temperature: options.temperature || 0.4,
    max_tokens: Math.min(options.maxTokens || 2048, MAX_OUTPUT_TOKENS)
  });
  
  const rawText = response.choices[0]?.message?.content || '';
  return {
    content: cleanLLMOutput(rawText),
    modelUsed: model,
    usage: response.usage
  };
}
