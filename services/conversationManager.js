import { PROMPT_TEMPLATES } from './aiHelpers.js';
import { getUserHistory, addMessageToHistory, clearUserHistory } from './historyService.js';
import { getBusinessVault } from './vaultService.js';

/**
 * ADDI Conversation Manager
 * Single unified AI Session Manager maintaining persistent conversation history and
 * cross-page context across the entire onboarding lifecycle.
 */
class ConversationManager {
  /**
   * Builds the formatted messages array for an AI session, incorporating:
   * 1. ADDI Consultant System Prompt
   * 2. Live Business Vault Profile
   * 3. Current Onboarding Step & Page Context
   * 4. Full Persistent History
   * 
   * @param {string} userId - Unified User Session ID
   * @param {string} currentStepContext - Active onboarding step/page identifier
   * @returns {Array} Formatted OpenAI-compatible messages array
   */
  buildUnifiedContext(userId, currentStepContext = '') {
    const history = getUserHistory(userId);
    const vault = getBusinessVault(userId);

    // 1. Format Business Vault Summary
    let vaultSummaryText = '';
    if (vault && typeof vault === 'object') {
      const knownFields = Object.entries(vault)
        .filter(([k, v]) => v && k !== 'lastUpdated' && k !== 'brandAssets' && k !== 'missingAssets' && k !== 'aiConfidenceScore')
        .map(([k, v]) => `• ${this.formatKey(k)}: ${Array.isArray(v) ? v.join(', ') : v}`);

      const confidence = vault.aiConfidenceScore || 10;

      if (knownFields.length > 0) {
        vaultSummaryText = `\n\nCURRENT INTERNAL BUSINESS MEMORY (AI Confidence Score: ${confidence}%):\n` +
          knownFields.join('\n') +
          `\n\nDYNAMIC QUESTIONING INSTRUCTION: Do NOT ask the user for any of the above information as it is already stored in their Business Profile. Determine what key context is still missing and ask ONLY ONE curious, warm follow-up question.`;
      }

      if (confidence >= 85 && vault.conversationStatus !== 'roadmap_generated') {
        vaultSummaryText += `\n\nSTRATEGIC THRESHOLD REACHED (Confidence ${confidence}% >= 85%):\nSummarize the business insights clearly and present a Personalized Roadmap (High Priority, Medium Priority, Future Opportunities) explaining WHY each recommendation is made.`;
      }
    }

    // 2. Format Current Context
    let stepContextText = '';
    if (currentStepContext) {
      stepContextText = `\n\nACTIVE CONVERSATION CONTEXT: "${currentStepContext}". Maintain continuous, natural business consulting context.`;
    }

    const systemPromptContent = PROMPT_TEMPLATES.ADDI_CONSULTANT + vaultSummaryText + stepContextText;

    // 3. Assemble System Prompt + Filtered Conversation History
    const cleanHistory = history.filter(msg => msg.role !== 'system');
    return [{ role: 'system', content: systemPromptContent }, ...cleanHistory];
  }

  /**
   * Appends user & assistant messages to persistent session history.
   */
  recordInteraction(userId, userMessage, assistantResponse) {
    if (userMessage) {
      addMessageToHistory(userId, 'user', userMessage.trim());
    }
    if (assistantResponse) {
      addMessageToHistory(userId, 'assistant', assistantResponse.trim());
    }
  }

  /**
   * Clears session history & context for user.
   */
  resetSession(userId) {
    clearUserHistory(userId);
  }

  formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
}

export const ADDIConversationManager = new ConversationManager();
