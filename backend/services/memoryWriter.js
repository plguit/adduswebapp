/**
 * ADDUS Platform — Memory Writer
 *
 * Extracts durable facts from conversations and persists them to the Business Brain.
 * Ensures ADDI never asks for information already known.
 */

import { getBusinessVault, updateBusinessVault, addDurableFact, hasDurableFact, addCustomerPreference, getCustomerPreference, getFieldProvenance } from '../../ai/business-brain/vaultService.js';
import { executeAIRequest, REQUEST_TYPES } from './aiRequestManager.js';
import { PROMPT_TEMPLATES } from '../../ai/prompts/index.js';

const BUSINESS_FACT_PROMPT = `You are a fact extraction engine. Extract durable business facts from the following conversation turn.
Return ONLY a valid JSON object with this structure:
{
  "facts": [
    { "field": "fieldName", "value": "extracted value", "confidence": 0.9, "source": "customer" }
  ],
  "preferences": [
    { "category": "visualPreference", "value": "minimal" }
  ]
}

Field mapping rules:
- business name → "businessName"
- industry/sector → "industry"
- target customer/audience → "targetAudience"
- goal/objective → "businessGoal"
- challenge/problem → "currentChallenge"
- timeline/deadline → "timeline"
- budget → "budget"
- stage (startup/growing/etc) → "businessStage"
- unique advantage → "competitiveAdvantage"
- location/market → "geographicMarket"
- product info → store in "products" array as text
- service info → store in "services" as text
- communication preference → "communicationStyle" preference
- design preference → "visualPreference" preference

Only extract facts that are explicitly stated or clearly implied. Do not extract vague references.
If no facts are found, return {"facts": [], "preferences": []}.`;

export async function writeMemoryFromTurn(userId, userMessage, assistantResponse) {
  if (!userId || (!userMessage && !assistantResponse)) return null;

  const vault = getBusinessVault(userId);
  const combinedText = `${userMessage || ''}\n${assistantResponse || ''}`;
  
  if (combinedText.trim().length < 10) return null;

  try {
    const result = await executeAIRequest(
      REQUEST_TYPES.BUSINESS_PROFILE.name,
      userId,
      [
        { role: 'system', content: BUSINESS_FACT_PROMPT },
        { role: 'user', content: combinedText.slice(0, 2000) }
      ],
      {
        userId,
        businessId: userId,
        context: { userMessage, assistantResponse }
      }
    );

    if (result.error || !result.content) return null;

    const cleaned = result.content.replace(/```json\n?|\n?```/g, '').trim();
    const extracted = JSON.parse(cleaned);

    const updates = {};
    for (const fact of (extracted.facts || [])) {
      if (fact.field && fact.value) {
        if (fact.field === 'products') {
          if (!updates.products) updates.products = [...(vault.products || [])];
          if (!updates.products.includes(fact.value)) updates.products.push(fact.value);
        } else if (fact.field === 'services') {
          updates.services = fact.value;
        } else {
          updates[fact.field] = fact.value;
        }
        addDurableFact(vault, fact.value, 'conversation', fact.confidence || 0.7);
      }
    }

    for (const pref of (extracted.preferences || [])) {
      if (pref.category && pref.value) {
        addCustomerPreference(vault, pref.category, pref.value);
      }
    }

    if (Object.keys(updates).length > 0) {
      return updateBusinessVault(userId, updates, 'CUSTOMER_PROVIDED');
    }
  } catch (err) {
    console.warn('[MemoryWriter Warning] Fact extraction failed:', err.message);
  }

  return null;
}

export function isInformationKnown(vault, field, keyword) {
  if (!vault || !field) return false;

  const value = vault[field];
  if (typeof value === 'string' && value.toLowerCase().includes(keyword.toLowerCase())) {
    return true;
  }
  if (Array.isArray(value) && value.some(item => String(item).toLowerCase().includes(keyword.toLowerCase()))) {
    return true;
  }
  return false;
}

export function getKnownInformationSummary(vault) {
  if (!vault) return { known: [], unknown: [] };

  const known = [];
  const unknown = [];

  const fields = [
    'businessName', 'industry', 'businessStage', 'businessDescription',
    'targetAudience', 'geographicMarket', 'idealCustomer', 'pricingPosition',
    'businessGoal', 'currentChallenge', 'competitiveAdvantage'
  ];

  for (const field of fields) {
    const provenance = getFieldProvenance(vault, field);
    if (vault[field] && String(vault[field]).trim().length > 0) {
      known.push({
        field,
        value: vault[field],
        provenance: provenance?.provenance || 'UNKNOWN',
        confidence: provenance?.confidence || 'UNKNOWN'
      });
    } else {
      unknown.push(field);
    }
  }

  return { known, unknown };
}

export function shouldAskQuestion(vault, questionTopic) {
  if (!vault) return true;
  
  const topicLower = questionTopic.toLowerCase().replace(/\s+/g, '');

  const knownFacts = vault.memory?.durableFacts || [];
  if (knownFacts.some(f => f.fact.toLowerCase().includes(topicLower))) {
    return false;
  }

  const vaultFields = Object.entries(vault);
  for (const [key, value] of vaultFields) {
    const keyLower = key.toLowerCase().replace(/\s+/g, '');
    if (keyLower.includes(topicLower)) {
      if (typeof value === 'string' && value.trim().length > 0) return false;
      if (Array.isArray(value) && value.length > 0) return false;
      if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) return false;
    }
    if (typeof value === 'string' && value.toLowerCase().includes(topicLower)) {
      return false;
    }
    if (Array.isArray(value) && value.some(v => String(v).toLowerCase().includes(topicLower))) {
      return false;
    }
  }

  return true;
}

export function buildKnownInformationPrompt(vault) {
  const summary = getKnownInformationSummary(vault);
  const knownFields = summary.known.map(k => `${k.field}: ${k.value} (${k.provenance})`).join('\n');
  const unknownFields = summary.unknown.join(', ');

  return `KNOWN INFORMATION (do NOT ask about these):
${knownFields || 'None yet'}

UNKNOWN INFORMATION (you may ask about these if relevant):
${unknownFields}

RULES:
- NEVER ask about information listed under KNOWN INFORMATION.
- ONLY ask about information listed under UNKNOWN INFORMATION if it is necessary to answer the user's question.
- If the user's question can be answered without asking, do not ask anything.
- If you need to ask, ask ONLY ONE question.`;
}