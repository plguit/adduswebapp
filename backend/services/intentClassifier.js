/**
 * ADDUS Platform — Intent Classifier
 *
 * Lightweight intent detection for ADDI conversational context selection.
 * Controls which Business Brain fields and evidence are sent to the LLM.
 */

export const INTENT_CATEGORIES = {
  BUSINESS_QUESTION: 'BUSINESS_QUESTION',
  BRAND_QUESTION: 'BRAND_QUESTION',
  PRODUCT_QUESTION: 'PRODUCT_QUESTION',
  SERVICE_QUESTION: 'SERVICE_QUESTION',
  PROJECT_QUESTION: 'PROJECT_QUESTION',
  ASSET_QUESTION: 'ASSET_QUESTION',
  RECOMMENDATION_QUESTION: 'RECOMMENDATION_QUESTION',
  GENERAL_CHAT: 'GENERAL_CHAT',
  UPDATE_REQUEST: 'UPDATE_REQUEST',
  RESEARCH_QUESTION: 'RESEARCH_QUESTION'
};

const INTENT_PATTERNS = {
  [INTENT_CATEGORIES.BRAND_QUESTION]: [
    /logo/i, /brand/i, /color/i, /font/i, /visual/i, /identity/i, /guideline/i,
    /style/i, /design/i, /packaging/i, /name.*clar/i, /rebrand/i
  ],
  [INTENT_CATEGORIES.ASSET_QUESTION]: [
    /logo/i, /image/i, /photo/i, /video/i, /asset/i, /upload/i, /favicon/i,
    /graphic/i, /banner/i, /icon/i, /media/i
  ],
  [INTENT_CATEGORIES.PRODUCT_QUESTION]: [
    /product/i, /catalog/i, /item/i, /inventory/i, /offering/i, /sku/i,
    /collection/i, / merchandise/i
  ],
  [INTENT_CATEGORIES.SERVICE_QUESTION]: [
    /service/i, /deliverable/i, /offer/i, /solution/i, /capability/i,
    /package/i, /plan/i, /subscription/i
  ],
  [INTENT_CATEGORIES.PROJECT_QUESTION]: [
    /project/i, /job/i, /order/i, /delivery/i, /timeline/i, /schedule/i,
    /milestone/i, /status/i, /roadmap/i, /brief/i
  ],
  [INTENT_CATEGORIES.RECOMMENDATION_QUESTION]: [
    /recommend/i, /suggest/i, /should.*i/i, /what.*need/i, /next.*step/i,
    /improve/i, /optimize/i, /priority/i, /roadmap/i, /strategy/i
  ],
  [INTENT_CATEGORIES.RESEARCH_QUESTION]: [
    /competitor/i, /market/i, /trend/i, /research/i, /industry.*report/i,
    /benchmark/i, /analysis/i, /compare/i
  ],
  [INTENT_CATEGORIES.UPDATE_REQUEST]: [
    /update/i, /change/i, /correct/i, /fix/i, /wrong/i, /actually/i,
    /not.*right/i, /modify/i, /edit/i
  ]
};

export function classifyIntent(message) {
  if (!message || typeof message !== 'string') {
    return INTENT_CATEGORIES.GENERAL_CHAT;
  }

  const lower = message.toLowerCase();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        return intent;
      }
    }
  }

  if (/\?/.test(message) || /^(who|what|where|when|why|how|is|are|do|does|can|could|would|should)/i.test(lower)) {
    return INTENT_CATEGORIES.BUSINESS_QUESTION;
  }

  return INTENT_CATEGORIES.GENERAL_CHAT;
}

export function getContextSourcesForIntent(intent) {
  switch (intent) {
    case INTENT_CATEGORIES.BRAND_QUESTION:
      return ['vault_identity', 'vault_brand', 'website_evidence'];
    case INTENT_CATEGORIES.ASSET_QUESTION:
      return ['vault_brand', 'website_evidence', 'vault_products'];
    case INTENT_CATEGORIES.PRODUCT_QUESTION:
      return ['vault_products', 'website_evidence', 'vault_brand'];
    case INTENT_CATEGORIES.SERVICE_QUESTION:
      return ['vault_products', 'strategic_intelligence', 'website_evidence'];
    case INTENT_CATEGORIES.PROJECT_QUESTION:
      return ['vault_all', 'strategic_intelligence', 'conversation_history'];
    case INTENT_CATEGORIES.RECOMMENDATION_QUESTION:
      return ['vault_all', 'strategic_intelligence', 'website_evidence'];
    case INTENT_CATEGORIES.RESEARCH_QUESTION:
      return ['vault_all', 'strategic_intelligence', 'external_research'];
    case INTENT_CATEGORIES.UPDATE_REQUEST:
      return ['vault_all', 'conversation_history'];
    default:
      return ['vault_identity', 'vault_all', 'strategic_intelligence'];
  }
}

export function getRequiredFieldsForIntent(intent) {
  switch (intent) {
    case INTENT_CATEGORIES.BRAND_QUESTION:
      return ['businessName', 'brandAssets', 'discoveredAssets'];
    case INTENT_CATEGORIES.ASSET_QUESTION:
      return ['businessName', 'brandAssets', 'discoveredAssets', 'products'];
    case INTENT_CATEGORIES.PRODUCT_QUESTION:
      return ['businessName', 'products', 'services'];
    case INTENT_CATEGORIES.SERVICE_QUESTION:
      return ['businessName', 'services', 'strategicIntelligence'];
    case INTENT_CATEGORIES.PROJECT_QUESTION:
      return ['businessName', 'projects', 'strategicIntelligence'];
    case INTENT_CATEGORIES.RECOMMENDATION_QUESTION:
      return ['businessName', 'strategicIntelligence', 'targetAudience'];
    case INTENT_CATEGORIES.RESEARCH_QUESTION:
      return ['businessName', 'industry', 'strategicIntelligence'];
    default:
      return ['businessName', 'industry'];
  }
}