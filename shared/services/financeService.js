/**
 * Finance Service — ADDUS Phase 5
 * Quotation, Invoice, Payment, Payout, Expense, and Profitability management.
 * All IDs in the correct format: QT000001, INV000001, PAY000001, POT000001, EXP000001, VND000001
 */

const KEYS = {
  quotations: 'addus_finance_quotations',
  invoices: 'addus_finance_invoices',
  payments: 'addus_finance_payments',
  payouts: 'addus_finance_payouts',
  expenses: 'addus_finance_expenses',
  vendors: 'addus_finance_vendors',
  refunds: 'addus_finance_refunds',
  counters: 'addus_finance_counters'
};

// ── ID Generator ──────────────────────────────────────────────────────────

function nextId(prefix, key) {
  const counters = JSON.parse(localStorage.getItem(KEYS.counters) || '{}');
  const next = (counters[key] || 0) + 1;
  counters[key] = next;
  localStorage.setItem(KEYS.counters, JSON.stringify(counters));
  return `${prefix}${String(next).padStart(6, '0')}`;
}

// ── Store Helpers ─────────────────────────────────────────────────────────

function getStore(key) {
  try { return JSON.parse(localStorage.getItem(KEYS[key]) || '[]'); }
  catch { return []; }
}

function saveStore(key, data) {
  localStorage.setItem(KEYS[key], JSON.stringify(data));
}

// ── GST Config (India default) ─────────────────────────────────────────────

const DEFAULT_GST = 18;

export const financeService = {

  // ── Quotations ─────────────────────────────────────────────────────────

  createQuotation({ projectId, customerId, businessId, lineItems = [], discount = 0, validDays = 7, terms = '', notes = '', paymentSchedule = [], createdBy = 'admin' }) {
    const quotationId = nextId('QT', 'quotations');
    const subtotal = lineItems.reduce((s, item) => s + (item.quantity || 1) * (item.rate || 0), 0);
    const gstAmount = Math.round((subtotal - discount) * DEFAULT_GST / 100);
    const totalAmount = subtotal - discount + gstAmount;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const quotation = {
      quotationId,
      projectId,
      customerId,
      businessId,
      lineItems,
      subtotal,
      gstRate: DEFAULT_GST,
      gstAmount,
      discount,
      totalAmount,
      currency: 'INR',
      validUntil: validUntil.toISOString().split('T')[0],
      paymentSchedule: paymentSchedule.length > 0 ? paymentSchedule : [
        { milestone: 'Advance', percent: 50, amount: Math.round(totalAmount * 0.5), dueDate: new Date().toISOString().split('T')[0] },
        { milestone: 'Final Delivery', percent: 50, amount: Math.round(totalAmount * 0.5), dueDate: validUntil.toISOString().split('T')[0] }
      ],
      terms: terms || 'Payment due within 7 days of invoice issuance. All deliverables remain property of ADDUS until full payment received.',
      notes,
      status: 'draft',
      sentAt: null,
      approvedAt: null,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const all = getStore('quotations');
    all.push(quotation);
    saveStore('quotations', all);
    return quotation;
  },

  updateQuotationStatus(quotationId, status) {
    const all = getStore('quotations');
    const idx = all.findIndex(q => q.quotationId === quotationId);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString(), ...(status === 'approved' ? { approvedAt: new Date().toISOString() } : {}), ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}) };
    saveStore('quotations', all);
    return all[idx];
  },

  getQuotationsForProject(projectId) {
    return getStore('quotations').filter(q => q.projectId === projectId);
  },

  getAllQuotations() {
    return getStore('quotations').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ── Invoices ───────────────────────────────────────────────────────────

  createInvoice(quotation, { dueDate, paymentTerms = 'Net 7', createdBy = 'admin' }) {
    const invoiceId = nextId('INV', 'invoices');
    const invoice = {
      invoiceId,
      quotationId: quotation.quotationId,
      projectId: quotation.projectId,
      customerId: quotation.customerId,
      businessId: quotation.businessId,
      lineItems: quotation.lineItems,
      subtotal: quotation.subtotal,
      gstRate: quotation.gstRate,
      gstAmount: quotation.gstAmount,
      discount: quotation.discount,
      totalAmount: quotation.totalAmount,
      paidAmount: 0,
      balanceAmount: quotation.totalAmount,
      currency: 'INR',
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      paymentTerms,
      notes: quotation.notes,
      pdfUrl: null,
      issuedAt: null,
      paidAt: null,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const all = getStore('invoices');
    all.push(invoice);
    saveStore('invoices', all);
    return invoice;
  },

  updateInvoiceStatus(invoiceId, status, paidAmount = null) {
    const all = getStore('invoices');
    const idx = all.findIndex(i => i.invoiceId === invoiceId);
    if (idx === -1) return null;
    const updates = { status, updatedAt: new Date().toISOString() };
    if (paidAmount !== null) {
      updates.paidAmount = paidAmount;
      updates.balanceAmount = all[idx].totalAmount - paidAmount;
    }
    if (status === 'issued') updates.issuedAt = new Date().toISOString();
    if (status === 'paid') updates.paidAt = new Date().toISOString();
    all[idx] = { ...all[idx], ...updates };
    saveStore('invoices', all);
    return all[idx];
  },

  getInvoicesForProject(projectId) {
    return getStore('invoices').filter(i => i.projectId === projectId);
  },

  getAllInvoices() {
    return getStore('invoices').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ── Payments ──────────────────────────────────────────────────────────

  recordPayment({ invoiceId, projectId, customerId, amount, method = 'other', transactionId = '', type = 'advance', recordedBy = 'admin' }) {
    const paymentId = nextId('PAY', 'payments');
    const payment = {
      paymentId,
      invoiceId,
      projectId,
      customerId,
      amount,
      currency: 'INR',
      method,
      transactionId,
      gatewayRef: '',
      status: 'completed',
      type,
      receiptUrl: null,
      recordedAt: new Date().toISOString(),
      recordedBy,
      createdAt: new Date().toISOString()
    };
    const all = getStore('payments');
    all.push(payment);
    saveStore('payments', all);

    // Auto-update invoice
    if (invoiceId) {
      const invoice = getStore('invoices').find(i => i.invoiceId === invoiceId);
      if (invoice) {
        const newPaid = invoice.paidAmount + amount;
        const newStatus = newPaid >= invoice.totalAmount ? 'paid' : newPaid > 0 ? 'partially_paid' : invoice.status;
        this.updateInvoiceStatus(invoiceId, newStatus, newPaid);
      }
    }

    return payment;
  },

  getAllPayments() {
    return getStore('payments').sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  },

  // ── Creator Payouts ───────────────────────────────────────────────────

  createPayout({ creatorId, projectId, invoiceId = null, grossAmount, platformCommissionRate = 15, travelReimbursement = 0, equipmentReimbursement = 0, bonus = 0, penalty = 0, notes = '' }) {
    const payoutId = nextId('POT', 'payouts');
    const platformCommission = Math.round(grossAmount * platformCommissionRate / 100);
    const tds = 0; // TDS: future implementation
    const netAmount = grossAmount - platformCommission - tds + travelReimbursement + equipmentReimbursement + bonus - penalty;

    const payout = {
      payoutId,
      creatorId,
      projectId,
      invoiceId,
      grossAmount,
      platformCommission,
      platformCommissionRate,
      tds,
      equipmentReimbursement,
      travelReimbursement,
      bonus,
      penalty,
      netAmount,
      status: 'pending',
      bankAccountRef: null,
      paymentDate: null,
      approvedBy: null,
      approvedAt: null,
      paidAt: null,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const all = getStore('payouts');
    all.push(payout);
    saveStore('payouts', all);
    return payout;
  },

  updatePayoutStatus(payoutId, status, adminId = 'admin') {
    const all = getStore('payouts');
    const idx = all.findIndex(p => p.payoutId === payoutId);
    if (idx === -1) return null;
    const updates = { status, updatedAt: new Date().toISOString() };
    if (status === 'approved') { updates.approvedBy = adminId; updates.approvedAt = new Date().toISOString(); }
    if (status === 'paid') updates.paidAt = new Date().toISOString();
    all[idx] = { ...all[idx], ...updates };
    saveStore('payouts', all);
    return all[idx];
  },

  getPayoutsForCreator(creatorId) {
    return getStore('payouts').filter(p => p.creatorId === creatorId);
  },

  getAllPayouts() {
    return getStore('payouts').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ── Expenses ──────────────────────────────────────────────────────────

  recordExpense({ projectId, category, description, amount, vendorId = null, receiptUrl = null, recordedBy = 'admin' }) {
    const expenseId = nextId('EXP', 'expenses');
    const expense = {
      expenseId,
      projectId,
      category,
      description,
      amount,
      currency: 'INR',
      vendorId,
      receiptUrl,
      status: 'pending',
      approvedBy: null,
      approvedAt: null,
      recordedAt: new Date().toISOString(),
      recordedBy,
      createdAt: new Date().toISOString()
    };
    const all = getStore('expenses');
    all.push(expense);
    saveStore('expenses', all);
    return expense;
  },

  getAllExpenses() {
    return getStore('expenses').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ── Profitability ─────────────────────────────────────────────────────

  calculateProfitability(projectId) {
    const invoices = this.getInvoicesForProject(projectId);
    const expenses = getStore('expenses').filter(e => e.projectId === projectId);
    const payouts = getStore('payouts').filter(p => p.projectId === projectId);

    const revenue = invoices.filter(i => i.status === 'paid' || i.status === 'partially_paid')
      .reduce((s, i) => s + i.paidAmount, 0);
    const creatorCost = payouts.reduce((s, p) => s + p.netAmount, 0);
    const equipmentCost = expenses.filter(e => e.category === 'rental' || e.category === 'purchase').reduce((s, e) => s + e.amount, 0);
    const travelCost = expenses.filter(e => e.category === 'transport').reduce((s, e) => s + e.amount, 0);
    const operationsCost = expenses.filter(e => !['rental', 'purchase', 'transport'].includes(e.category)).reduce((s, e) => s + e.amount, 0);
    const totalCost = creatorCost + equipmentCost + travelCost + operationsCost;
    const grossProfit = revenue - totalCost;
    const marginPercent = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

    return {
      projectId,
      revenue,
      creatorCost,
      equipmentCost,
      travelCost,
      operationsCost,
      totalCost,
      grossProfit,
      netProfit: grossProfit, // net = gross for MVP (no platform overhead calc)
      marginPercent,
      calculatedAt: new Date().toISOString()
    };
  },

  // ── Revenue Dashboard ─────────────────────────────────────────────────

  getRevenueDashboard() {
    const payments = this.getAllPayments();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    const todayRevenue = payments.filter(p => p.recordedAt.startsWith(today) && p.status === 'completed')
      .reduce((s, p) => s + p.amount, 0);
    const monthRevenue = payments.filter(p => p.recordedAt.startsWith(thisMonth) && p.status === 'completed')
      .reduce((s, p) => s + p.amount, 0);

    const invoices = this.getAllInvoices();
    const outstanding = invoices.filter(i => i.status === 'issued' || i.status === 'partially_paid')
      .reduce((s, i) => s + i.balanceAmount, 0);

    const payouts = this.getAllPayouts();
    const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'approved')
      .reduce((s, p) => s + p.netAmount, 0);

    return {
      todayRevenue,
      monthRevenue,
      outstanding,
      pendingPayouts,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      overdueInvoices: invoices.filter(i => i.status === 'overdue').length
    };
  }
};

export default financeService;
