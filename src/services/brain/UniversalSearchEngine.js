import { profileService } from '../profileService.js';
import { AnalyticsEngine } from './AnalyticsEngine.js';

/**
 * Module 14: Universal Global Search Engine
 */
export const UniversalSearchEngine = {
  search(query = '', { profiles = [], projects = [], payments = [], creators = [] } = {}) {
    if (!query.trim()) return { businesses: [], projects: [], creators: [], payments: [], assets: [] };

    const q = query.toLowerCase();

    const businesses = profiles.filter(p => {
      const brain = p.businessBrain || {};
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (brain.businessName || '').toLowerCase().includes(q) ||
        (brain.industry || '').toLowerCase().includes(q) ||
        (p.userId || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      );
    }).map(p => ({ type: 'Business', id: p.userId, label: p.businessBrain?.businessName || p.name, sub: p.businessBrain?.industry }));

    const projectResults = projects.filter(p => (
      (p.title || '').toLowerCase().includes(q) ||
      (p.service || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q)
    )).map(p => ({ type: 'Project', id: p.id, label: p.title || p.service, sub: p.status }));

    const paymentResults = payments.filter(p => (
      (p.paymentId || '').toLowerCase().includes(q) ||
      (p.invoiceId || '').toLowerCase().includes(q) ||
      (p.customerName || '').toLowerCase().includes(q) ||
      (p.projectName || '').toLowerCase().includes(q)
    )).map(p => ({ type: 'Payment', id: p.paymentId, label: p.projectName, sub: `${p.paymentId} · ${p.paymentStatus}` }));

    const creatorResults = creators.filter(c => (
      (c.name || '').toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q) ||
      (c.creatorId || '').toLowerCase().includes(q)
    )).map(c => ({ type: 'Creator', id: c.creatorId, label: c.name, sub: c.role }));

    return {
      businesses,
      projects: projectResults,
      creators: creatorResults,
      payments: paymentResults,
      total: businesses.length + projectResults.length + creatorResults.length + paymentResults.length
    };
  }
};

export default UniversalSearchEngine;
