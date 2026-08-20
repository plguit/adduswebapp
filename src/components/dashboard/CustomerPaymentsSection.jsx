import React, { useState } from 'react';
import { CreditCard, Download, CheckCircle2, Clock, FileText, ChevronRight } from 'lucide-react';
import { paymentService } from '../../services/paymentService.js';

export function CustomerPaymentsSection({ customerId = null }) {
  const [payments] = useState(() => {
    const all = paymentService.getAllPayments();
    return all.filter(p => !customerId || p.customerId === customerId);
  });

  return (
    <div className="customer-payments-container fade-in">
      <div className="payments-header-row">
        <div>
          <h3 className="section-title">Billing & Payments</h3>
          <p className="section-subtitle">Manage invoices, payments, and receipts</p>
        </div>
      </div>

      {/* Customer Payment Timeline */}
      <div className="payment-timeline-card margin-top-16">
        <h4 className="timeline-title">Standard Payment Timeline</h4>
        <div className="timeline-steps-flow margin-top-12">
          <div className="t-step step-done">
            <span className="t-badge">1</span>
            <span className="t-label">Quotation</span>
          </div>
          <ChevronRight size={16} className="t-arrow" />
          <div className="t-step step-done">
            <span className="t-badge">2</span>
            <span className="t-label">Invoice Generated</span>
          </div>
          <ChevronRight size={16} className="t-arrow" />
          <div className="t-step step-active">
            <span className="t-badge">3</span>
            <span className="t-label">Payment Pending</span>
          </div>
          <ChevronRight size={16} className="t-arrow" />
          <div className="t-step">
            <span className="t-badge">4</span>
            <span className="t-label">Paid</span>
          </div>
          <ChevronRight size={16} className="t-arrow" />
          <div className="t-step">
            <span className="t-badge">5</span>
            <span className="t-label">Receipt Generated</span>
          </div>
        </div>
      </div>

      {/* Payments & Invoices Table */}
      <div className="invoices-list-grid margin-top-20">
        {payments.map(p => (
          <div key={p.paymentId} className="customer-invoice-card">
            <div className="card-top-row">
              <div className="inv-id-group">
                <FileText size={16} className="text-highlight" />
                <span className="inv-number">{p.invoiceId}</span>
                 <span className="pay-id-tag">{p.paymentId}</span>
              </div>
              <span className={`status-tag tag-${p.paymentStatus}`}>
                {p.paymentStatus.toUpperCase()}
              </span>
            </div>

            <h4 className="card-proj-name">{p.projectName}</h4>
            <div className="card-amount-row margin-top-10">
              <span className="amount-label">Amount Payable:</span>
              <span className="amount-value">₹{p.totalPaidByCustomer.toLocaleString()}</span>
            </div>

            <div className="card-details-box margin-top-12">
              <div className="detail-row">
                <span>Payment Method:</span>
                <strong className="text-white">{p.paymentMethod}</strong>
              </div>
              <div className="detail-row">
                <span>Transaction ID:</span>
                <strong className="text-white">{p.transactionId}</strong>
              </div>
            </div>

            <div className="card-actions-row margin-top-16">
              <button className="btn-invoice-dl" onClick={() => alert(`Downloading invoice...`)}>
                <Download size={14} /> Download Invoice
              </button>
              {p.paymentStatus === 'paid' && (
                <button className="btn-receipt-dl" onClick={() => alert(`Downloading receipt...`)}>
                  <CheckCircle2 size={14} /> Receipt
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
