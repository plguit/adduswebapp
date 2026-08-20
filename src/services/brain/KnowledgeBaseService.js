import { storage } from '../../utils/storage.js';

const KB_KEY = 'ADDUS_KNOWLEDGE_BASE_DB';

/**
 * Module 9: Internal Reusable Knowledge Base
 */
export const KnowledgeBaseService = {
  getLibrary() {
    return storage.get(KB_KEY, {
      proposalTemplates: [
        { id: 'KBP001', title: 'Cinematic Brand Film Proposal Template', category: 'Video Advertisement', tags: ['video', 'brand', 'premium'], body: 'We propose a 90-second cinematic brand film aligned to your brand identity and campaign goals...' },
        { id: 'KBP002', title: 'Commercial Photography Proposal Template', category: 'Photography', tags: ['photography', 'product', 'lifestyle'], body: 'We propose a full-day commercial photography shoot covering product, lifestyle, and editorial photography...' },
        { id: 'KBP003', title: 'Brand Identity & Strategy Proposal Template', category: 'Branding', tags: ['branding', 'identity', 'strategy'], body: 'We propose a complete brand identity refresh covering logo system, typography, color palette, and brand guidelines...' }
      ],
      creativeBriefTemplates: [
        { id: 'KBC001', title: 'Video Creative Brief', category: 'Video Advertisement', fields: ['Business Overview', 'Campaign Goal', 'Target Audience', 'Key Message', 'Tone & Mood', 'Shot Style', 'References', 'Deliverables', 'Budget', 'Timeline'] },
        { id: 'KBC002', title: 'Photography Creative Brief', category: 'Photography', fields: ['Business Overview', 'Shoot Goal', 'Products/Subjects', 'Lighting Style', 'Background Preference', 'Color References', 'Deliverables', 'Usage Rights'] },
        { id: 'KBC003', title: 'Brand Identity Creative Brief', category: 'Branding', fields: ['Brand Name', 'Industry', 'Brand Personality', 'Mission & Vision', 'Competitors', 'Target Audience', 'Preferred Styles', 'Colour Direction', 'Deliverables'] }
      ],
      contractTemplates: [
        { id: 'KBX001', title: 'Standard Creative Services Contract', category: 'All', fields: ['Party Names', 'Scope of Work', 'Deliverables', 'Timeline', 'Payment Terms', 'Revision Policy', 'Intellectual Property', 'Termination Clause', 'Governing Law'] }
      ],
      moodboards: [
        { id: 'KBM001', title: 'Luxury Minimal Moodboard', style: 'Premium', tags: ['minimal', 'dark', 'cinematic'], colors: ['#0F172A', '#7C5CFF', '#FFFFFF'] },
        { id: 'KBM002', title: 'Vibrant D2C Brand Moodboard', style: 'Playful', tags: ['vibrant', 'lifestyle', 'energy'], colors: ['#F97316', '#06B6D4', '#FDE68A'] },
        { id: 'KBM003', title: 'Clinical & Trust Moodboard', style: 'Healthcare', tags: ['clean', 'medical', 'trust'], colors: ['#DBEAFE', '#1E40AF', '#FFFFFF'] }
      ]
    });
  },

  getTemplatesByCategory(category = '') {
    const lib = this.getLibrary();
    return {
      proposalTemplates: lib.proposalTemplates.filter(t => !category || t.category === category),
      creativeBriefTemplates: lib.creativeBriefTemplates.filter(t => !category || t.category === category),
      contractTemplates: lib.contractTemplates,
      moodboards: lib.moodboards
    };
  }
};

export default KnowledgeBaseService;
