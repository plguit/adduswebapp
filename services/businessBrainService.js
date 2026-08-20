import {
  getGroqClient,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  withModelFallback,
  cleanLLMOutput,
  handleAIError
} from './aiHelpers.js';
import { ADDIConversationManager } from './conversationManager.js';

/**
 * Business Brain Intelligence Layer
 * Unified AI service orchestrating Groq API execution, single-session cross-page conversation memory,
 * model fallback (Primary -> Retry -> Fallback -> Retry), and output cleaning.
 * 
 * @param {Array} messages - Direct messages array or historical messages
 * @param {Object} options - { userId, currentStep, stream, onChunk, modelOverride }
 * @returns {Promise<Object>} - { content, modelUsed, error }
 */
export async function generateAIResponse(messages = [], options = {}) {
  const {
    userId = 'default_user',
    currentStep = '',
    stream = false,
    onChunk = null,
    modelOverride = null
  } = options;

  const client = getGroqClient();

  // Build unified cross-page context using ADDI Conversation Manager
  const formattedMsgs = (messages && messages.length > 0 && messages[0].role === 'system')
    ? messages
    : ADDIConversationManager.buildUnifiedContext(userId, currentStep);

  const targetPrimary = modelOverride || PRIMARY_MODEL;
  const startTime = Date.now();

  console.log(`[BusinessBrainService Log] Processing AI request. Session User: "${userId}", Messages: ${formattedMsgs.length}, Step Stage: "${currentStep}"`);

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === '') {
    const errorMsg = 'GROQ_API_KEY is not configured on the server. Please set your GROQ_API_KEY in the backend environment.';
    console.error('[BusinessBrainService Error]', errorMsg);
    if (stream && typeof onChunk === 'function') onChunk(errorMsg);
    return { content: errorMsg, modelUsed: 'none', error: 'MISSING_API_KEY' };
  }

  // Define single completion runner per target model
  const runCompletion = async (model) => {
    console.log(`[BusinessBrainService Exec] Running completion with model: ${model}`);

    if (stream) {
      const responseStream = await client.chat.completions.create({
        model,
        messages: formattedMsgs,
        stream: true,
        temperature: 0.4,
        max_tokens: 4096
      });

      let rawContent = '';
      for await (const chunk of responseStream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          rawContent += token;
          if (!rawContent.includes('<think>') || rawContent.includes('</think>')) {
            const cleanToken = cleanLLMOutput(token);
            if (cleanToken && typeof onChunk === 'function') {
              onChunk(cleanToken);
            }
          }
        }
      }
      return { content: cleanLLMOutput(rawContent), modelUsed: model };
    } else {
      const response = await client.chat.completions.create({
        model,
        messages: formattedMsgs,
        stream: false,
        temperature: 0.4,
        max_tokens: 4096
      });

      const rawText = response.choices[0]?.message?.content || '';
      return { content: cleanLLMOutput(rawText), modelUsed: model };
    }
  };

  // Execute using model fallback strategy (Primary -> Retry -> Fallback -> Retry -> Error)
  try {
    const result = await withModelFallback(runCompletion, targetPrimary, FALLBACK_MODEL);
    console.log(`[BusinessBrainService Success] Completed in ${Date.now() - startTime}ms using model: ${result.modelUsed}`);
    return result;

  } catch (err) {
    console.error(`[BusinessBrainService Error] Execution failed completely across models: ${err.message}`);
    const userFriendlyError = handleAIError(err);

    if (stream && typeof onChunk === 'function') {
      onChunk(`\n[Notice: ${userFriendlyError}]`);
    }

    return {
      content: userFriendlyError,
      modelUsed: 'failed',
      error: err.status || err.name || 'EXECUTION_FAILED'
    };
  }
}
