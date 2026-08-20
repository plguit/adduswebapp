import { storage } from '../utils/storage.js';
import { idGeneratorService } from './idGeneratorService.js';

const PAYMENTS_STORAGE_KEY = 'ADDUS_GLOBAL_PAYMENTS_DB';
const INVOICES_STORAGE_KEY = 'ADDUS_GLOBAL_INVOICES_DB';
const PAYMENT_LOGS_KEY = 'ADDUS_PAYMENT_AUDIT_LOGS_DB';

/**
 * Enterprise Relational Payment & Financial Infrastructure Service — BPEP Edition
 * Manages Customer Payments, Invoices (AIN / AIA), Creator Payouts (APT / AYA),
 * Escrow Settlements, Refunds, and Platform Commission calculations.
 */
export const paymentService = {
  getAllPayments() {
    return storage.get(PAYMENTS_STORAGE_KEY, []);
  },


  calculateCommission(projectValue = 0, platformFeePercent = 5, taxPercent = 18) {
    const pValue = Number(projectValue) || 0;
    const fee = (pValue * platformFeePercent) / 100;
    const creatorAmount = pValue - fee;
    const taxes = (pValue * taxPercent) / 100;
    const totalCustomerPaid = pValue + taxes;

    return {
      projectValue: pValue,
      platformFee: fee,
      creatorPayout: creatorAmount,
      tax: taxes,
      totalPaidByCustomer: totalCustomerPaid
    };
  },

  createPaymentRecord(data) {
    const payments = this.getAllPayments();
    const paymentId = data.paymentId || idGeneratorService.getNextId('AYA');
    const invoiceId = data.invoiceId || idGeneratorService.getNextId('AIA');

    const financial = this.calculateCommission(data.projectValue || 0);

    const record = {
      paymentId,
      invoiceId,
      projectId: data.projectId || null,
      customerId: data.customerId || null,
      businessId: data.businessId || null,
      creatorId: data.creatorId || null,
      customerName: data.customerName || 'Client',
      businessName: data.businessName || 'Business',
      projectName: data.projectName || 'Video Shoot Project',
      creatorName: data.creatorName || 'Lead Creator',
      ...financial,
      paymentStatus: data.paymentStatus || 'pending',
      settlementStatus: data.settlementStatus || 'pending',
      paymentMethod: data.paymentMethod || 'Online Gateway',
      transactionId: data.transactionId || `TXN_${Date.now()}`,
      createdAt: new Date().toISOString(),
      paidAt: data.paymentStatus === 'paid' ? new Date().toISOString() : null
    };

    payments.unshift(record);
    storage.set(PAYMENTS_STORAGE_KEY, payments);
    this.logAction('CREATE_PAYMENT', record.paymentId, 'System', null, record.paymentStatus, 'Created payment invoice record');
    return record;
  },

  updatePaymentStatus(paymentId, newStatus, reason = '') {
    const payments = this.getAllPayments();
    let updatedRecord = null;

    const updatedList = payments.map(p => {
      if (p.paymentId === paymentId) {
        const oldStatus = p.paymentStatus;
        updatedRecord = {
          ...p,
          paymentStatus: newStatus,
          paidAt: newStatus === 'paid' ? new Date().toISOString() : p.paidAt
        };
        this.logAction('UPDATE_STATUS', paymentId, 'Admin Operative', oldStatus, newStatus, reason || 'Status updated by Admin');
        return updatedRecord;
      }
      return p;
    });

    storage.set(PAYMENTS_STORAGE_KEY, updatedList);
    return updatedRecord;
  },

  logAction(action, paymentId, user, oldVal, newVal, reason) {
    const logs = storage.get(PAYMENT_LOGS_KEY, []);
    logs.unshift({
      id: `PLOG_${Date.now()}`,
      paymentId,
      action,
      user,
      oldVal,
      newVal,
      reason,
      timestamp: new Date().toISOString()
    });
    storage.set(PAYMENT_LOGS_KEY, logs);
  },

  getAuditLogs() {
    return storage.get(PAYMENT_LOGS_KEY, []);
  }
};

export default paymentService;
