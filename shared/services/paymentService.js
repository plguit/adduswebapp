import { storage } from '../../src/utils/storage.js';
import { idGeneratorService } from './idGeneratorService.js';

const PAYMENTS_STORAGE_KEY = 'ADDUS_GLOBAL_PAYMENTS_DB';
const INVOICES_STORAGE_KEY = 'ADDUS_GLOBAL_INVOICES_DB';
const PAYMENT_LOGS_KEY = 'ADDUS_PAYMENT_AUDIT_LOGS_DB';

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
    const paymentId = idGeneratorService.getNextId('AYA');
    const invoiceId = data.invoiceId || idGeneratorService.getNextId('AIA');
    const quoteId = data.quoteId || idGeneratorService.getNextId('AQA');

    const financial = this.calculateCommission(data.projectValue || 0);

    const record = {
      paymentId,
      invoiceId,
      quoteId,
      projectId: data.projectId || null,
      customerId: data.customerId || null,
      businessId: data.businessId || null,
      creatorId: data.creatorId || null,
      customerName: data.customerName || 'Client',
      businessName: data.businessName || 'Business',
      projectName: data.projectName || 'Project',
      creatorName: data.creatorName || 'Creator',
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
        return updatedRecord;
      }
      return p;
    });

    storage.set(PAYMENTS_STORAGE_KEY, updatedList);
    return updatedRecord;
  }
};
