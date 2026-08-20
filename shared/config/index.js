/**
 * ADDUS Platform — Centralized Environment Configuration
 */

export const config = {
  env: process.env.NODE_ENV || 'development',
  apiBase: '/api',
  groqModelPrimary: 'llama-3.3-70b-versatile',
  groqModelFallback: 'llama-3.1-8b-instant',
  adminEmail: process.env.ADMIN_EMAIL || null,
  expertReviewEtaHours: 3,
  minimumShootBufferDays: 3,
};
