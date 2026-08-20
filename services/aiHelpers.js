import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Default Models
export const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
export const FALLBACK_MODEL = 'llama-3.1-8b-instant';

/**
 * Creates initialized OpenAI client configured for Groq API.
 */
export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  console.log("Groq API Key Loaded:", !!apiKey);
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[AI Helpers Warning] GROQ_API_KEY environment variable is missing.');
  }

  return new OpenAI({
    apiKey: apiKey || 'missing_key',
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 30000
  });
}

/**
 * Prompt Templates Collection for ADDI & Business Vault
 */
export const PROMPT_TEMPLATES = {
  ADDI_CONSULTANT: `You are ADDI, the AI Product Manager & Executive Business Consultant for ADDUS.

Role & Core Principles:
- You are NOT a generic chatbot. You behave like a world-class AI Product Manager.
- Understand quickly with minimal typing. Gather only necessary details and deliver high value immediately.
- Never interrogate or ask endless follow-up questions. Max 2-3 questions in total before recommendations.
- Infer as much as possible automatically from user input, website, or document details.
- Never ask generic chatbot questions like "What pain point do you solve?", "What makes you unique?", or "What challenges do you face?".
- If the user knows what they need, help them execute immediately without unnecessary strategy questions.
- If guidance is requested, guide them through max 3 quick strategic questions, then generate tailored recommendations with explicit REASONING explaining WHY each deliverable is selected.
- Keep tone confident, consultative, fast, and professional. Keep all text concise (1-2 short paragraphs). Do NOT use raw JSON syntax in normal speech.`,

  BUSINESS_EXTRACTION: `You are a high-accuracy Business Intelligence Extractor.
Extract structured business details from user messages.
Return ONLY a valid JSON object matching:
{
  "businessName": string or null,
  "industry": string or null,
  "productsServices": string or null,
  "targetAudience": string or null,
  "goals": string or null,
  "challenges": string or null,
  "brandPersonality": string or null,
  "location": string or null,
  "budget": string or null,
  "timeline": string or null,
  "businessStage": string or null,
  "website": string or null,
  "socialLinks": string or null
}`,

  DELIVERABLE_RECOMMENDATION: `Analyze the Business Vault and recommend 3 high-converting creative deliverable blueprints (e.g. Product Promo Video, Website UX Wireframe, Brand Identity System). Return concise plain text recommendations.`
};

/**
 * Executes function with single retry attempt.
 */
export async function withRetry(fn, label = 'Operation') {
  try {
    return await fn();
  } catch (err1) {
    console.warn(`[AI Retry Warning] ${label} Attempt 1 failed: ${err1.message}. Retrying once...`);
    return await fn();
  }
}

/**
 * Executes function trying primary model first (with retry), then falling back to fallback model (with retry).
 */
export async function withModelFallback(executeWithModel, primaryModel = PRIMARY_MODEL, fallbackModel = FALLBACK_MODEL) {
  try {
    return await withRetry(() => executeWithModel(primaryModel), `Primary (${primaryModel})`);
  } catch (primaryErr) {
    console.warn(`[Model Fallback Warning] Primary model (${primaryModel}) failed completely: ${primaryErr.message}. Switching to fallback (${fallbackModel})...`);
    return await withRetry(() => executeWithModel(fallbackModel), `Fallback (${fallbackModel})`);
  }
}

/**
 * Normalizes and strips reasoning blocks (<think>...</think>) and raw markdown symbols from model output.
 */
export function cleanLLMOutput(text) {
  if (!text) return '';
  let cleaned = text;

  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  if (cleaned.includes('<think>')) {
    const index = cleaned.lastIndexOf('</think>');
    if (index !== -1) {
      cleaned = cleaned.substring(index + 8);
    } else {
      const thinkStart = cleaned.indexOf('<think>');
      cleaned = cleaned.substring(0, thinkStart);
    }
  }

  return cleaned
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
}

/**
 * Maps raw errors to user-friendly messages.
 */
export function handleAIError(err) {
  const status = err.status || err.statusCode;
  const message = err.message || '';

  if (status === 401 || message.includes('401') || message.includes('API key')) {
    return 'Invalid or unauthorized API key. Please check your GROQ_API_KEY configuration.';
  }
  if (status === 429 || message.includes('429') || message.includes('rate limit')) {
    return 'ADDI is currently experiencing high demand. Please try again in a few moments.';
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) {
    return 'Connection timed out while contacting AI service. Please check your internet connection.';
  }
  return 'I encountered a temporary error processing your request. Please try again shortly.';
}
