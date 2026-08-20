/**
 * ADDUS Platform — External Research Provider Abstraction
 *
 * Phase 3 implementation:
 *  - Provider-agnostic research interface
 *  - Serper, Tavily, Brave support
 *  - Graceful degradation when no provider configured
 *  - Source validation and deduplication
 *  - Research memory integration
 */

import { RESEARCH_DECISIONS } from './researchDecisionEngine.js';
import { validateSource, deduplicateSources } from './sourceValidator.js';

const PROVIDER_CONFIG = {
  serper: {
    envKey: 'SERPER_API_KEY',
    baseUrl: 'https://google.serper.dev/search',
    headers: { 'Content-Type': 'application/json' }
  },
  tavily: {
    envKey: 'TAVILY_API_KEY',
    baseUrl: 'https://api.tavily.com/search',
    headers: { 'Content-Type': 'application/json' }
  },
  brave: {
    envKey: 'BRAVE_API_KEY',
    baseUrl: 'https://api.search.brave.com/res/v1/web/search',
    headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip' }
  }
};

let activeProvider = null;

export function getActiveResearchProvider() {
  if (activeProvider) return activeProvider;

  for (const [name, config] of Object.entries(PROVIDER_CONFIG)) {
    if (process.env[config.envKey]) {
      activeProvider = name;
      return name;
    }
  }

  return null;
}

export function isResearchAvailable() {
  return !!getActiveResearchProvider();
}

export async function searchExternalResearch(query, options = {}) {
  const provider = getActiveResearchProvider();
  
  if (!provider) {
    return {
      success: false,
      status: 'FAILED',
      reason: 'RESEARCH_UNAVAILABLE',
      message: 'No external research provider configured'
    };
  }

  try {
    const config = PROVIDER_CONFIG[provider];
    const results = await executeProviderSearch(provider, query, options);
    
    const validatedResults = deduplicateSources(
      results
        .map(result => validateSource(result.url, 'EXTERNAL_RESEARCH'))
        .filter(v => v.valid)
    );

    return {
      success: true,
      status: 'COMPLETED',
      provider,
      query,
      results: validatedResults,
      resultCount: validatedResults.length
    };
  } catch (error) {
    return {
      success: false,
      status: 'FAILED',
      provider,
      query,
      error: error.message
    };
  }
}

async function executeProviderSearch(provider, query, options) {
  const config = PROVIDER_CONFIG[provider];
  const maxResults = options.maxResults || 5;

  switch (provider) {
    case 'serper':
      return searchSerper(query, maxResults, config);
    case 'tavily':
      return searchTavily(query, maxResults, config);
    case 'brave':
      return searchBrave(query, maxResults, config);
    default:
      throw new Error(`Unknown research provider: ${provider}`);
  }
}

async function searchSerper(query, maxResults, config) {
  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify({
      q: query,
      num: maxResults,
      tbs: 'qdr:y'
    })
  });

  if (!response.ok) {
    throw new Error(`Serper search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const results = [];

  if (data.organic && Array.isArray(data.organic)) {
    for (const item of data.organic.slice(0, maxResults)) {
      results.push({
        url: item.link,
        title: item.title,
        snippet: item.snippet,
        source: 'serper',
        domain: new URL(item.link).hostname
      });
    }
  }

  return results;
}

async function searchTavily(query, maxResults, config) {
  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: 'advanced',
      days: 30
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const results = [];

  if (data.results && Array.isArray(data.results)) {
    for (const item of data.results.slice(0, maxResults)) {
      results.push({
        url: item.url,
        title: item.title,
        snippet: item.content,
        source: 'tavily',
        domain: new URL(item.url).hostname
      });
    }
  }

  return results;
}

async function searchBrave(query, maxResults, config) {
  const url = new URL(config.baseUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('count', maxResults.toString());
  url.searchParams.set('freshness', 'pd');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: config.headers
  });

  if (!response.ok) {
    throw new Error(`Brave search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const results = [];

  if (data.web && data.web.results && Array.isArray(data.web.results)) {
    for (const item of data.web.results.slice(0, maxResults)) {
      results.push({
        url: item.url,
        title: item.title,
        snippet: item.description,
        source: 'brave',
        domain: new URL(item.url).hostname
      });
    }
  }

  return results;
}

export function resetResearchProvider() {
  activeProvider = null;
}