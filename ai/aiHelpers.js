import OpenAI from 'openai';
import dotenv from 'dotenv';
import { PROMPT_TEMPLATES } from './prompts/index.js';

dotenv.config();

export const PRIMARY_MODEL = 'openai/gpt-oss-120b';
export const FALLBACK_MODEL = 'qwen/qwen3.6-27b';

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[AI Helpers Warning] GROQ_API_KEY environment variable is missing.');
  }

  return new OpenAI({
    apiKey: apiKey || 'missing_key',
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 30000
  });
}

export { PROMPT_TEMPLATES };

export async function withRetry(fn, label = 'Operation', options = {}) {
  const maxRetries = options.maxRetries ?? 1;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const retryAfterMs = options.retryAfterMs ?? 0;
  
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('rate limit');
      const isRetryable = isRateLimit || err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT') || err.message?.includes('ECONNRESET');
      
      if (attempt < maxRetries && isRetryable) {
        const delay = isRateLimit 
          ? Math.min(retryAfterMs || baseDelayMs * Math.pow(2, attempt), 30000)
          : baseDelayMs * Math.pow(2, attempt);
        console.warn(`[AI Retry Warning] ${label} Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (attempt < maxRetries) {
        console.warn(`[AI Retry Warning] ${label} Attempt ${attempt + 1} failed: ${err.message}. Retrying once...`);
      } else {
        break;
      }
    }
  }
  throw lastError;
}

export async function withModelFallback(executeWithModel, primaryModel = PRIMARY_MODEL, fallbackModel = FALLBACK_MODEL) {
  try {
    return await withRetry(() => executeWithModel(primaryModel), `Primary (${primaryModel})`, { maxRetries: 1, baseDelayMs: 1000 });
  } catch (primaryErr) {
    console.warn(`[Model Fallback Warning] Primary model (${primaryModel}) failed completely: ${primaryErr.message}. Switching to fallback (${fallbackModel})...`);
    try {
      return await withRetry(() => executeWithModel(fallbackModel), `Fallback (${fallbackModel})`, { maxRetries: 1, baseDelayMs: 1000 });
    } catch (fallbackErr) {
      console.error(`[Model Fallback Error] Both models failed. Primary: ${primaryErr.message}, Fallback: ${fallbackErr.message}`);
      throw fallbackErr;
    }
  }
}

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
