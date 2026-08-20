import {
  getGroqClient,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  withModelFallback,
  cleanLLMOutput,
  handleAIError
} from '../aiHelpers.js';
import { executeAIRequest, REQUEST_TYPES } from '../../backend/services/aiRequestManager.js';
import { ADDIConversationManager } from '../conversation-engine/conversationManager.js';

export async function generateAIResponse(messages = [], options = {}) {
  const {
    userId = 'default_user',
    currentStep = '',
    stream = false,
    onChunk = null,
    modelOverride = null
  } = options;

  const userMessage = Array.isArray(messages) ? messages[0]?.content : (typeof messages === 'string' ? messages : '');

  // Determine the appropriate request type based on context
  let requestType = REQUEST_TYPES.CHAT_RESPONSE.name;
  if (currentStep === 'strategic_analysis') {
    requestType = REQUEST_TYPES.STRATEGIC_ANALYSIS.name;
  } else if (currentStep === 'research_synthesis') {
    requestType = REQUEST_TYPES.RESEARCH_SYNTHESIS.name;
  } else if (currentStep === 'competitor_analysis' ||
             (userMessage && (userMessage.toLowerCase().includes('competitor') || userMessage.toLowerCase().includes('benchmark')))) {
    requestType = REQUEST_TYPES.COMPETITOR_ANALYSIS.name;
  } else if (currentStep === 'opportunity_generation' ||
             (userMessage && (userMessage.toLowerCase().includes('gap') || userMessage.toLowerCase().includes('opportunity')))) {
    requestType = REQUEST_TYPES.RECOMMENDATIONS.name;
  }

  // Prepare context for budget enforcement
  const context = options.context || {};
  const messagesForGateway = Array.isArray(messages) && messages.length > 0 && messages[0].role === 'system'
    ? messages
    : (Array.isArray(messages) && messages.length > 0 ? messages : [{ role: 'user', content: userMessage }]);

  try {
    const result = await executeAIRequest(requestType, userId, messagesForGateway, {
      businessId: options.businessId || userId,
      productId: options.productId || null,
      projectId: options.projectId || null,
      websiteUrl: options.websiteUrl || null,
      evidenceVersion: options.evidenceVersion || '1',
      context,
      analysisVersion: options.analysisVersion || '1',
      systemPrompt: options.systemPrompt || null,
      temperature: options.temperature || 0.4,
      max_tokens: options.max_tokens || null,
      stream: false,
    });

    // Return with streaming-compatible shape if requested
    if (stream && result && !result.error && typeof onChunk === 'function') {
      const content = result.content || '';
      for (const chunk of content.match(/.{1,50}/g) || []) {
        onChunk(chunk);
      }
    }

    return result;
  } catch (err) {
    console.error('[BusinessBrainService Error] Gateway call failed:', err?.message || err);
    return {
      content: handleAIError(err),
      modelUsed: 'failed',
      error: err?.status || err?.name || 'EXECUTION_FAILED'
    };
  }
}