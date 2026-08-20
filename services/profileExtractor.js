import OpenAI from 'openai';
import dotenv from 'dotenv';
import { updateBusinessVault } from './vaultService.js';

dotenv.config();

function getExtractorClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: 10000
  });
}

/**
 * System prompt specifically tuned for Business Vault extraction.
 */
const EXTRACTOR_SYSTEM_PROMPT = `You are a high-accuracy Business Intelligence Extractor.
Your task is to analyze user messages and extract structured business information into the internal Business Profile.

Extract only information that is explicitly stated or clearly implied in the conversation.
Return a valid JSON object containing ONLY fields with NEW or UPDATED values:

{
  "businessName": string or null,
  "industry": string or null,
  "businessStage": string or null,
  "businessDescription": string or null,
  "products": string or null,
  "services": string or null,
  "targetAudience": string or null,
  "geographicMarket": string or null,
  "idealCustomer": string or null,
  "customerAge": string or null,
  "customerType": string or null,
  "pricingPosition": string or null,
  "businessGoal": string or null,
  "currentChallenge": string or null,
  "competitiveAdvantage": string or null,
  "timeline": string or null,
  "budget": string or null,
  "website": string or null,
  "socialLinks": string or null
}

If no new business information is found, return {}.
Respond ONLY with valid JSON. Do not include markdown code block syntax or extra text.`;

/**
 * Extracts business profile fields from the user message and updates the user's Business Vault.
 * @param {string} userId
 * @param {string} userMessage
 * @param {Array} history
 * @returns {Promise<Object>} Updated Business Vault
 */
export async function extractAndUpdateVault(userId, userMessage, history = []) {
  if (!userId || !userMessage) return {};

  // Rule-based quick pattern matching for instantaneous extraction
  const quickExtracted = performQuickExtraction(userMessage);
  if (Object.keys(quickExtracted).length > 0) {
    updateBusinessVault(userId, quickExtracted);
  }

  // LLM-based structured extraction
  const client = getExtractorClient();
  if (!client) return quickExtracted;

  try {
    const recentMessages = history.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const promptText = `Recent Conversation:\n${recentMessages}\n\nLatest User Message: "${userMessage}"`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast & reliable for JSON extraction
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        { role: 'user', content: promptText }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const rawContent = response.choices[0]?.message?.content || '{}';
    const cleanJsonStr = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

    const extractedData = JSON.parse(cleanJsonStr);
    
    // Clean out null or empty values
    const validUpdates = {};
    for (const [key, val] of Object.entries(extractedData)) {
      if (val && typeof val === 'string' && val.trim() !== '' && val.toLowerCase() !== 'null') {
        validUpdates[key] = val.trim();
      }
    }

    if (Object.keys(validUpdates).length > 0) {
      return updateBusinessVault(userId, validUpdates);
    }

  } catch (err) {
    console.warn('[Profile Extractor Log] LLM extraction skipped/failed:', err.message);
  }

  return quickExtracted;
}

/**
 * Rule-based fallback extraction for common phrases.
 */
function performQuickExtraction(text) {
  const updates = {};
  const lower = text.toLowerCase();

  if (lower.includes('resort') || lower.includes('hotel') || lower.includes('hospitality')) {
    updates.industry = 'Hospitality & Tourism';
  } else if (lower.includes('saas') || lower.includes('software') || lower.includes('tech')) {
    updates.industry = 'Software & Technology';
  } else if (lower.includes('e-commerce') || lower.includes('store') || lower.includes('apparel')) {
    updates.industry = 'E-Commerce & Retail';
  }

  if (lower.includes('boutique resort')) {
    updates.businessStage = 'Boutique Resort';
  } else if (lower.includes('opening next month') || lower.includes('launching soon')) {
    updates.businessStage = 'Pre-Launch (Opening Next Month)';
  } else if (lower.includes('established') || lower.includes('scaling')) {
    updates.businessStage = 'Growth & Scaling';
  }

  if (lower.includes('luxury') || lower.includes('high net worth') || lower.includes('vip')) {
    updates.targetAudience = 'Luxury & High-End Travelers';
  }

  return updates;
}
