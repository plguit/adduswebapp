import { executeAIRequest, REQUEST_TYPES } from '../../backend/services/aiRequestManager.js';
import { PROMPT_TEMPLATES } from '../prompts/index.js';
import { updateBusinessVault } from '../business-brain/vaultService.js';

export async function extractAndSyncBusinessProfile(userId, userMessageText) {
  if (!userMessageText || userMessageText.trim().length < 5) {
    return null;
  }

  try {
    const result = await executeAIRequest(
      REQUEST_TYPES.BUSINESS_PROFILE.name,
      userId,
      [
        { role: 'system', content: PROMPT_TEMPLATES.BUSINESS_EXTRACTION },
        { role: 'user', content: userMessageText }
      ],
      {
        userId,
        businessId: userId,
        context: { userMessageText }
      }
    );

    if (result.error || !result.content) {
      return null;
    }

    const cleaned = result.content.replace(/```json\n?|\n?```/g, '').trim();
    const extractedData = JSON.parse(cleaned);

    const partialVault = {};
    if (extractedData.businessName) partialVault.businessName = extractedData.businessName;
    if (extractedData.industry) partialVault.industry = extractedData.industry;
    if (extractedData.productsServices) partialVault.services = extractedData.productsServices;
    if (extractedData.targetAudience) partialVault.targetAudience = extractedData.targetAudience;
    if (extractedData.goals) partialVault.businessGoal = extractedData.goals;
    if (extractedData.challenges) partialVault.currentChallenge = extractedData.challenges;
    if (extractedData.brandPersonality) partialVault.competitiveAdvantage = extractedData.brandPersonality;
    if (extractedData.timeline) partialVault.timeline = extractedData.timeline;
    if (extractedData.budget) partialVault.budget = extractedData.budget;
    if (extractedData.businessStage) partialVault.businessStage = extractedData.businessStage;

    if (Object.keys(partialVault).length > 0) {
      return updateBusinessVault(userId, partialVault);
    }
  } catch (err) {
    console.warn('[ProfileExtractor Warning] Non-blocking JSON extraction failed:', err.message);
  }
  return null;
}
