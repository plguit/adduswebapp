/**
 * ADDUS Platform — Creator Payout Service
 *
 * Handles creator payout calculations and tracking.
 */

import { getCreatorVault, updateCreatorVault } from './creatorVaultService.js';

export function calculateCreatorPayout({ creatorId, projectId, grossAmount, platformCommissionRate = 0.15, tdsRate = 0.10 }) {
  const platformCommission = Math.round(grossAmount * platformCommissionRate);
  const tds = Math.round((grossAmount - platformCommission) * tdsRate);
  const netAmount = grossAmount - platformCommission - tds;

  return {
    creatorId,
    projectId,
    grossAmount,
    platformCommission,
    tds,
    netAmount,
    currency: 'INR',
    status: 'pending',
    calculatedAt: new Date().toISOString()
  };
}

export function recordCreatorPayout(creatorId, payout) {
  const vault = getCreatorVault(creatorId);
  const payouts = vault.payouts || [];
  const newPayout = {
    payoutId: `POT${String(payouts.length + 1).padStart(6, '0')}`,
    ...payout,
    createdAt: new Date().toISOString()
  };
  payouts.push(newPayout);
  return updateCreatorVault(creatorId, { payouts });
}

export function getCreatorPayouts(creatorId) {
  const vault = getCreatorVault(creatorId);
  return vault.payouts || [];
}

export function getCreatorEarningsSummary(creatorId) {
  const payouts = getCreatorPayouts(creatorId);
  const totalGross = payouts.reduce((sum, p) => sum + (p.grossAmount || 0), 0);
  const totalNet = payouts.reduce((sum, p) => sum + (p.netAmount || 0), 0);
  const totalPlatformCommission = payouts.reduce((sum, p) => sum + (p.platformCommission || 0), 0);
  const totalTds = payouts.reduce((sum, p) => sum + (p.tds || 0), 0);

  return {
    totalGross,
    totalNet,
    totalPlatformCommission,
    totalTds,
    currency: 'INR',
    payoutCount: payouts.length,
    pendingPayouts: payouts.filter(p => p.status === 'pending').length,
    paidPayouts: payouts.filter(p => p.status === 'paid').length
  };
}
