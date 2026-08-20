import { storage } from '../../utils/storage.js';
import { profileService } from '../profileService.js';
import { CustomerHealthScoreEngine } from './CustomerHealthScoreEngine.js';

const CRM_NOTES_KEY_PREFIX = 'ADDUS_CRM_NOTES_DB_';

/**
 * Module 7: Internal Admin CRM Service
 */
export const InternalCRMService = {
  /**
   * Builds a complete CRM record for a customer/business
   */
  buildCRMProfile(userId, projectList = [], paymentList = []) {
    const profile = profileService.getProfileById(userId) || {};
    const brain = profile.businessBrain || {};

    const totalRevenue = paymentList
      .filter(p => p.customerId === userId && p.paymentStatus === 'paid')
      .reduce((sum, p) => sum + (p.projectValue || 0), 0);

    const pendingInvoices = paymentList
      .filter(p => p.customerId === userId && p.paymentStatus === 'pending')
      .length;

    const healthScore = CustomerHealthScoreEngine.calculateHealthScore(userId, projectList);

    const crmNotes = storage.get(`${CRM_NOTES_KEY_PREFIX}${userId}`, []);

    return {
      customerId: profile.customerId || profile.userId || userId,
      businessId: brain.businessId || `ABA${userId?.replace(/\D/g, '').slice(0, 6)}`,
      businessName: brain.businessName || profile.name || 'Business Account',
      industry: brain.industry || 'General',
      businessStage: brain.businessStage || 'Growth Stage',
      assignedStrategist: profile.assignedStrategist || 'Ops Team',
      currentProjects: projectList.filter(p =>
        !['Delivered', 'Archived'].includes(p.status)
      ).length,
      totalProjects: projectList.length,
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      pendingInvoices,
      healthScore: healthScore.score,
      healthTier: healthScore.tier,
      healthColor: healthScore.color,
      aiConfidenceScore: brain.aiConfidenceScore ?? null,
      lastContact: profile.lastActiveAt || profile.createdAt || new Date().toISOString(),
      nextFollowUp: brain.nextFollowUp || null,
      priority: healthScore.score >= 85 ? 'Low' : healthScore.score >= 65 ? 'Medium' : 'High',
      status: profile.accountStatus || 'Active',
      notes: crmNotes,
      createdAt: profile.createdAt || new Date().toISOString()
    };
  },

  addCRMNote(userId, { note, author = 'Admin Ops' }) {
    const notes = storage.get(`${CRM_NOTES_KEY_PREFIX}${userId}`, []);
    const newNote = {
      id: `NOTE_${Date.now()}`,
      note,
      author,
      createdAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    storage.set(`${CRM_NOTES_KEY_PREFIX}${userId}`, notes);
    return newNote;
  }
};

export default InternalCRMService;
