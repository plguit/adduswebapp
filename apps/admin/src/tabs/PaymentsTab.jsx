import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, Search, Download, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';
import { paymentService } from '../../../../src/services/paymentService.js';

export function PaymentsTab({ dataSource = 'localStorage', adminReady = false }) {
  const [payments, setPayments] = useState(() => paymentService.getAllPayments());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (dataSource !== 'backend' || !adminReady) {
      setPayments(paymentService.getAllPayments());
    }
  }, [dataSource, adminReady]);

  const handleMarkPaid = (paymentId) => {
    const updated = paymentService.updatePaymentStatus(paymentId, 'paid', 'Marked paid by Admin');
    if (updated) {
      setPayments(paymentService.getAllPayments());
    }
  };

  const handleIssueRefund = (paymentId) => {
    const updated = paymentService.updatePaymentStatus(paymentId, 'refunded', 'Refunded by Admin');
    if (updated) {
      setPayments(paymentService.getAllPayments());
    }
  };

  const q = query.toLowerCase().trim();
  const filtered = payments.filter(p => {
    const matchesQuery = !q || (
      p.paymentId.toLowerCase().includes(q) ||
      p.invoiceId.toLowerCase().includes(q) ||
      p.projectId.toLowerCase().includes(q) ||
      p.customerId.toLowerCase().includes(q) ||
      p.creatorId.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.businessName.toLowerCase().includes(q)
    );

    const matchesStatus = statusFilter === 'all' ? true : p.paymentStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalCollections = payments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.totalPaidByCustomer, 0);
  const totalPending = payments.filter(p => p.paymentStatus === 'pending').reduce((sum, p) => sum + p.totalPaidByCustomer, 0);
  const platformRevenue = payments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.platformFee, 0);
  const creatorPayouts = payments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.creatorPayout, 0);

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">Admin Financial & Payment Center</h2>
          <p className="tab-pane-subtitle">Manage customer invoices (AIA), creator payouts (ACRA), platform commissions, and payment settlements (AYA).</p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="admin-metrics-grid margin-top-20">
        <div className="admin-metric-card">
          <div className="metric-icon-wrap bg-emerald">
            <DollarSign size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Collections</span>
            <span className="metric-value">₹{totalCollections.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-wrap bg-indigo">
            <CreditCard size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Platform Revenue (Commission)</span>
            <span className="metric-value">₹{platformRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-wrap bg-amber">
            <Clock size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending Collections</span>
            <span className="metric-value">₹{totalPending.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon-wrap bg-blue">
            <ArrowUpRight size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Creator Payouts</span>
            <span className="metric-value">₹{creatorPayouts.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="search-filter-wrap margin-top-24">
        <div className="search-box-wrap">
          <Search size={16} />
          <input
            type="text"
            className="table-search-input"
            placeholder="Search by Payment ID (AYA), Customer (ACA), Project (APA), Creator (ACRA), Invoice (AIA)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="tab-filter-pills">
          {['all', 'paid', 'pending', 'refunded'].map(st => (
            <button
              key={st}
              className={`filter-pill ${statusFilter === st ? 'pill-active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Relational Table */}
      <div className="audit-table-wrap margin-top-16">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Payment ID & Invoice</th>
              <th>Customer ID & Name</th>
              <th>Project ID</th>
              <th>Creator ID & Name</th>
              <th>Project Value</th>
              <th>Platform Fee (5%)</th>
              <th>Creator Payout</th>
              <th>Total (Inc. Tax)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.paymentId}>
                <td>
                  <div className="log-id-col">
                    <span className="log-id-text">{p.paymentId}</span>
                    <span className="log-time-text">{p.invoiceId}</span>
                  </div>
                </td>
                <td>
                  <div className="log-id-col">
                    <span className="font-semibold text-white">{p.customerName}</span>
                    <span className="log-time-text">{p.customerId}</span>
                  </div>
                </td>
                <td><span className="component-tag">{p.projectId}</span></td>
                <td>
                  <div className="log-id-col">
                    <span className="font-semibold text-white">{p.creatorName}</span>
                    <span className="log-time-text">{p.creatorId}</span>
                  </div>
                </td>
                <td className="font-semibold">₹{p.projectValue.toLocaleString()}</td>
                <td className="text-highlight font-semibold">₹{p.platformFee.toLocaleString()}</td>
                <td className="text-emerald font-semibold">₹{p.creatorPayout.toLocaleString()}</td>
                <td className="font-bold text-white">₹{p.totalPaidByCustomer.toLocaleString()}</td>
                <td>
                  <span className={`status-tag tag-${p.paymentStatus}`}>
                    {p.paymentStatus.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="actions-flex-row">
                    {p.paymentStatus === 'pending' && (
                      <button
                        className="btn-admin-action btn-approve"
                        onClick={() => handleMarkPaid(p.paymentId)}
                        title="Mark Paid"
                      >
                        <CheckCircle2 size={12} /> Mark Paid
                      </button>
                    )}
                    {p.paymentStatus === 'paid' && (
                      <button
                        className="btn-admin-action btn-reject"
                        onClick={() => handleIssueRefund(p.paymentId)}
                        title="Refund"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
