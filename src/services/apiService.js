/**
 * API Service
 * Centralized HTTP client wrapper routing all requests through Express backend.
 * Never connects directly to Groq from the browser.
 * 
 * Error Handling:
 * - Normalizes all errors into application-level error types
 * - Provides retry logic for transient failures
 * - Never exposes raw backend errors to the UI
 */

import { sessionManager } from './sessionManager.js';

const API_BASE = typeof window !== 'undefined' ? '/api' : (process.env.API_BASE_URL || 'http://localhost:3000/api');
const RETRYABLE_METHODS = ['POST', 'PUT', 'PATCH'];
const MAX_RETRIES = 2;
const RETRY_DELAY = 800;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getAuthHeaders() {
  const session = sessionManager.getSession();
  const headers = { 'Content-Type': 'application/json' };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

function normalizeError(error) {
  if (!error) {
    return { type: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' };
  }

  const message = error.message || String(error);

  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('Network request failed')) {
    return { type: 'NETWORK_ERROR', message: 'Cannot connect to server. Please check your internet connection and try again.' };
  }

  if (message.includes('401') || message.includes('Unauthorized') || message.includes('Invalid token') || message.includes('Token expired')) {
    return { type: 'AUTH_REQUIRED', message: 'Your session has expired. Please log in again.', logout: true };
  }

  if (message.includes('429') || message.includes('Too Many Requests') || message.includes('Rate limit')) {
    return { type: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment and try again.', retryable: true };
  }

  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504') || message.includes('Internal Server Error')) {
    return { type: 'SERVER_ERROR', message: 'Server is temporarily unavailable. Please try again in a moment.', retryable: true };
  }

  if (message.includes('timeout') || message.includes('deadline exceeded') || message.includes('ETIMEDOUT')) {
    return { type: 'REQUEST_TIMEOUT', message: 'The request took too long. Please try again.', retryable: true };
  }

  if (message.includes('Cannot connect to server')) {
    return { type: 'NETWORK_ERROR', message: 'Cannot connect to server. Please check your internet connection and try again.' };
  }

  return { type: 'API_ERROR', message: message || 'Something went wrong. Please try again.' };
}

export const apiService = {
  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${API_BASE}${endpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {})
        }
      });

      if (!res.ok) {
        let err = {};
        try {
          err = await res.json();
        } catch {
          err = { error: res.statusText };
        }

        if (res.status === 401) {
          throw new Error('AUTH_REQUIRED');
        }

        const message = err.content || err.error || err.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      return await res.json();
    } catch (error) {
      const normalized = normalizeError(error);
      const isRetryable = normalized.retryable && RETRYABLE_METHODS.includes(options.method || 'POST') && retryCount < MAX_RETRIES;

      if (isRetryable) {
        await sleep(RETRY_DELAY * (retryCount + 1));
        return this.request(endpoint, options, retryCount + 1);
      }

      const err = new Error(normalized.message);
      err.type = normalized.type;
      err.retryable = normalized.retryable || false;
      throw err;
    }
  },

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET'
    });
  }
};
