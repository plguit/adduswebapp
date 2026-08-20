/**
 * ADDUS Platform — Shared Constants
 */

export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  CREATOR: 'creator',
};

export const PROJECT_STATUSES = {
  PLANNING: 'Planning',
  BOOKED: 'Booked',
  IN_PROGRESS: 'In Progress',
  PRODUCTION: 'Production',
  EDITING: 'Editing',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const STAGES = {
  PLANNING: 'planning',
  PRE_PRODUCTION: 'pre_production',
  SHOOT: 'shoot',
  EDITING: 'editing',
  REVIEW: 'review',
  DELIVERED: 'delivered',
};

export const EXPERT_REVIEW_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};

export const DELIVERABLE_TYPES = [
  'Product Video',
  'Brand Film',
  'Photography',
  'Website',
  'Brand Identity',
  'Packaging Design',
  'Social Media Content',
];

export const INDUSTRIES = [
  'Fintech',
  'E-Commerce & Retail',
  'Hospitality & Tourism',
  'Technology & SaaS',
  'Fashion & Apparel',
  'Healthcare & Wellness',
  'Real Estate & Construction',
  'Education & EdTech',
  'Food & Beverage',
  'Professional Services',
];

export const STYLE_CATEGORIES = [
  { id: 'minimal', title: 'Minimal & Clean', style: 'Minimal', duration: '30s', budget: 'Below ₹20k', popularity: '★ 4.9', gradient: 'linear-gradient(135deg,#1e1b4b,#0f172a)' },
  { id: 'corporate', title: 'Corporate Authority', style: 'Corporate', duration: '45s', budget: '₹20k–40k', popularity: '★ 4.7', gradient: 'linear-gradient(135deg,#1e3a5f,#0f172a)' },
  { id: 'luxury', title: 'Luxury Cinematic', style: 'Luxury', duration: '60s', budget: '₹40k–75k', popularity: '★ 4.8', gradient: 'linear-gradient(135deg,#44301a,#0f172a)' },
  { id: 'startup', title: 'Tech Startup Energy', style: 'Tech Startup', duration: '30s', budget: '₹20k–40k', popularity: '★ 4.6', gradient: 'linear-gradient(135deg,#1a2044,#0f172a)' },
  { id: 'saas', title: 'Modern SaaS UI Promo', style: 'Modern SaaS', duration: '30s', budget: '₹20k–40k', popularity: '★ 4.8', gradient: 'linear-gradient(135deg,#1a3040,#0f172a)' },
  { id: 'documentary', title: 'Documentary Storytelling', style: 'Documentary', duration: '90s', budget: '₹40k–75k', popularity: '★ 4.5', gradient: 'linear-gradient(135deg,#2a1a1a,#0f172a)' },
  { id: 'lifestyle', title: 'Lifestyle & Aspirational', style: 'Lifestyle', duration: '20s', budget: 'Below ₹20k', popularity: '★ 4.7', gradient: 'linear-gradient(135deg,#1a3020,#0f172a)' },
  { id: 'animated', title: 'Motion Graphics & 2D', style: 'Animated', duration: '60s', budget: '₹20k–40k', popularity: '★ 4.6', gradient: 'linear-gradient(135deg,#2a1a40,#0f172a)' }
];

export const NOTIFICATION_TYPES = {
  REQUEST_DETAILS: 'request_details',
  SEND_QUOTATION: 'send_quotation',
  EXPERT_REVIEW_COMPLETE: 'expert_review_complete',
  CUSTOM: 'custom',
};
