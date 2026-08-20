/**
 * ADDUS Platform — Shared Data Interfaces & Documentation Schemas
 * 
 * @typedef {Object} BusinessBrain
 * @property {string} businessName
 * @property {string} industry
 * @property {string} businessStage
 * @property {string} businessDescription
 * @property {Array<string>} products
 * @property {Array<string>} services
 * @property {string} targetAudience
 * @property {string} brandPersonality
 * @property {number} aiConfidenceScore
 * 
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} userId
 * @property {string} service
 * @property {string} status
 * @property {string} currentStage
 * @property {string} shootDate
 * @property {string} estimatedDelivery
 * @property {Object} proposal
 * 
 * @typedef {Object} UserProfile
 * @property {string} userId
 * @property {string} phoneNumber
 * @property {string} email
 * @property {string} name
 * @property {BusinessBrain} businessBrain
 * @property {string} expertReviewStatus
 * @property {Array<Project>} projects
 */

export const SCHEMAS = {
  version: '1.0.0'
};
