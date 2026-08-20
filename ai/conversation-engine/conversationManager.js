import { PROMPT_TEMPLATES } from '../prompts/index.js';
import { getUserHistory, addMessageToHistory, clearUserHistory } from './historyService.js';
import { getBusinessVault } from '../business-brain/vaultService.js';

class ConversationManager {
  buildUnifiedContext(userId, currentStepContext = '') {
    const history = getUserHistory(userId);
    const vault = getBusinessVault(userId);

    let vaultSummaryText = '';
    if (vault && typeof vault === 'object') {
      const knownFields = Object.entries(vault)
        .filter(([k, v]) => v && k !== 'lastUpdated' && k !== 'brandAssets' && k !== 'missingAssets' && k !== 'aiConfidenceScore' && k !== 'auditLog' && k !== 'chatHistory' && k !== 'conversations' && k !== 'uploadedFiles' && k !== 'notifications' && k !== 'fieldProvenance' && k !== 'memory' && k !== 'customerPreferences')
        .map(([k, v]) => `• ${this.formatKey(k)}: ${Array.isArray(v) ? v.join(', ') : v}`);

      const confidence = vault.aiConfidenceScore || 10;
      if (knownFields.length > 0) {
        vaultSummaryText = `\n\nCURRENT INTERNAL BUSINESS MEMORY (AI Confidence Score: ${confidence}%):\n` +
          knownFields.join('\n') +
          `\n\nDYNAMIC QUESTIONING INSTRUCTION: Do NOT ask the user for any of the above information as it is already stored in their Business Profile. Determine what key context is still missing and ask ONLY ONE curious, warm follow-up question.`;
      }

      if (confidence >= 85 && vault.conversationStatus !== 'roadmap_generated') {
        vaultSummaryText += `\n\nSTRATEGIC THRESHOLD REACHED (Confidence ${confidence}% >= 85%):\nSummarize the business insights clearly and present a Personalized Roadmap explaining WHY each recommendation is made.`;
      }

      if (vault.memory?.durableFacts && vault.memory.durableFacts.length > 0) {
        const durableFacts = vault.memory.durableFacts
          .slice(-10)
          .map(f => `• ${f.fact} (source: ${f.source}, confidence: ${f.confidence})`)
          .join('\n');
        vaultSummaryText += `\n\nDURABLE FACTS FROM PREVIOUS CONVERSATIONS:\n${durableFacts}\n`;
      }

      if (vault.customerPreferences && Object.values(vault.customerPreferences).some(v => v !== null && v !== undefined)) {
        const prefs = Object.entries(vault.customerPreferences)
          .filter(([k, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `• ${this.formatKey(k)}: ${v}`)
          .join('\n');
        vaultSummaryText += `\n\nCUSTOMER PREFERENCES:\n${prefs}\n`;
      }
    }

    let stepContextText = '';
    if (currentStepContext) {
      stepContextText = `\n\nACTIVE CONVERSATION CONTEXT: "${currentStepContext}". Maintain continuous, natural business consulting context.`;
    }

    const systemPromptContent = PROMPT_TEMPLATES.ADDI_CONSULTANT + vaultSummaryText + stepContextText;
    const cleanHistory = history.filter(msg => msg.role !== 'system');
    return [{ role: 'system', content: systemPromptContent }, ...cleanHistory];
  }

  recordInteraction(userId, userMessage, assistantResponse) {
    if (userMessage) {
      addMessageToHistory(userId, 'user', userMessage.trim());
    }
    if (assistantResponse) {
      addMessageToHistory(userId, 'assistant', assistantResponse.trim());
    }
  }

  resetSession(userId) {
    clearUserHistory(userId);
  }

  formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
}

export const ADDIConversationManager = new ConversationManager();
