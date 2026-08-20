import React, { useState, useEffect } from 'react';
import {
  Layers, CheckCircle, Clock, AlertTriangle, DollarSign, TrendingUp,
  FileText, RefreshCw, Download, Plus, Eye, Search, Filter, XCircle,
  ThumbsUp, ThumbsDown, CreditCard, ArrowUpRight, BarChart3, Receipt,
  Percent, Users
} from 'lucide-react';
import { financeService } from '../../../../shared/services/financeService.js';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';
import { adminApiService } from '../services/adminApiService.js';

const STATUS_CONFIG = {
  draft: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  sent: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  issued: { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  approved: { color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  paid: { color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  partially_paid: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  pending: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  overdue: { color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  cancelled: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  expired: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' }
};

export function FinanceTab({ dataSource = 'localStorage', adminReady = false }) {
  const [section, setSection] = useState('dashboard'); // dashboard | quotations | invoices | payments | payouts | expenses
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [revenueDash, setRevenueDash] = useState({});
  const [projects, setProjects] = useState([]);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showCreatePayout, setShowCreatePayout] = useState(false);
  const [newQuote, setNewQuote] = useState({ projectId: '', lineItems: [{ description: '', quantity: 1, rate: 0, amount: 0 }] });
  const [newPayout, setNewPayout] = useState({ creatorId: '', projectId: '', grossAmount: '', platformCommissionRate: 15 });

  const refresh = async () => {
    try {
      setQuotations(financeService.getAllQuotations());
      setInvoices(financeService.getAllInvoices());
      setPayments(financeService.getAllPayments());
      setPayouts(financeService.getAllPayouts());
      setExpenses(financeService.getAllExpenses());
      setRevenueDash(financeService.getRevenueDashboard());
      if (dataSource === 'backend' && adminReady) {
        const res = await adminApiService.getProjects();
        setProjects(res.projects || []);
      } else {
        setProjects(getAllProjectsAcrossUsers());
      }
    } catch (e) {
      console.warn('[FinanceTab] backend load failed, falling back to localStorage:', e.message);
      setQuotations(financeService.getAllQuotations());
      setInvoices(financeService.getAllInvoices());
      setPayments(financeService.getAllPayments());
      setPayouts(financeService.getAllPayouts());
      setExpenses(financeService.getAllExpenses());
      setRevenueDash(financeService.getRevenueDashboard());
      setProjects(getAllProjectsAcrossUsers());
    }
  };

  useEffect(() => { refresh(); }, [dataSource, adminReady]);

  const handleCreateQuotation = () => {
    const items = newQuote.lineItems.map(li => ({ ...li, amount: li.quantity * li.rate }));
    financeService.createQuotation({ ...newQuote, lineItems: items });
    refresh();
    setShowCreateQuote(false);
    setNewQuote({ projectId: '', lineItems: [{ description: '', quantity: 1, rate: 0 }] });
  };

  const handleCreatePayout = () => {
    financeService.createPayout({ ...newPayout, grossAmount: parseFloat(newPayout.grossAmount) || 0 });
    refresh();
    setShowCreatePayout(false);
  };

  const NAV = [
    { id: 'dashboard', label: 'Revenue Dashboard', icon: BarChart3 },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'payouts', label: 'Creator Payouts', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: DollarSign }
  ];

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Finance & Revenue Engine</h2>
          <p className="admin-section-sub">Manage quotations, invoices, payments, creator payouts and project profitability.</p>
        </div>
        <button className="admin-icon-btn" onClick={refresh} title="Refresh"><RefreshCw size={16} /></button>
      </div>

      {/* Sub-nav */}
      <div className="admin-tab-nav margin-top-16 margin-bottom-20" style={{ flexWrap: 'wrap' }}>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`admin-tab-btn ${section === id ? 'active' : ''}`} onClick={() => setSection(id)}>
            <Icon size={14} className="inline-icon" /> {label}
          </button>
        ))}
      </div>

      {/* ── Revenue Dashboard ── */}
      {section === 'dashboard' && (
        <div>
          <div className="admin-kpi-grid">
            {[
              { label: "Today's Revenue", value: `₹${(revenueDash.todayRevenue || 0).toLocaleString('en-IN')}`, color: '#34D399', icon: TrendingUp },
              { label: 'This Month', value: `₹${(revenueDash.monthRevenue || 0).toLocaleString('en-IN')}`, color: '#818CF8', icon: BarChart3 },
              { label: 'Outstanding', value: `₹${(revenueDash.outstanding || 0).toLocaleString('en-IN')}`, color: '#FBBF24', icon: Clock },
              { label: 'Pending Payouts', value: `₹${(revenueDash.pendingPayouts || 0).toLocaleString('en-IN')}`, color: '#F87171', icon: Users },
              { label: 'Total Invoices', value: revenueDash.totalInvoices || 0, color: '#60A5FA', icon: FileText },
              { label: 'Paid Invoices', value: revenueDash.paidInvoices || 0, color: '#34D399', icon: CheckCircle },
              { label: 'Overdue', value: revenueDash.overdueInvoices || 0, color: '#F87171', icon: AlertTriangle }
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="admin-kpi-card">
                <div className="kpi-icon-wrap" style={{ background: `${color}18`, color }}><Icon size={20} /></div>
                <div className="kpi-body">
                  <span className="kpi-label">{label}</span>
                  <h3 className="kpi-value" style={{ fontSize: typeof value === 'string' && value.length > 8 ? '14px' : undefined }}>{value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="admin-card-box margin-top-24">
            <div className="card-box-header"><h3>Recent Payments</h3></div>
            {payments.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: '13px', padding: '16px 0' }}>No payments recorded yet.</p>
            ) : (
              <div className="admin-table-wrap margin-top-12">
                <table className="admin-table">
                  <thead><tr><th>Payment ID</th><th>Project</th><th>Amount</th><th>Type</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {payments.slice(0, 10).map(p => {
                      const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                      return (
                        <tr key={p.paymentId}>
                          <td><span className="log-id-text">{p.paymentId}</span></td>
                          <td>{p.projectId || '—'}</td>
                          <td className="font-semibold text-emerald">₹{p.amount.toLocaleString('en-IN')}</td>
                          <td style={{ textTransform: 'capitalize' }}>{p.type}</td>
                          <td style={{ textTransform: 'capitalize' }}>{p.method}</td>
                          <td><span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>{p.status}</span></td>
                          <td className="text-muted text-xs">{new Date(p.recordedAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quotations ── */}
      {section === 'quotations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="admin-primary-btn" onClick={() => setShowCreateQuote(true)}><Plus size={16} /> Create Quotation</button>
          </div>

          {showCreateQuote && (
            <div className="admin-card-box margin-bottom-20">
              <div className="card-box-header"><h4>New Quotation</h4></div>
              <div className="creator-form-field margin-top-12">
                <label>Project</label>
                <select className="creator-select" value={newQuote.projectId} onChange={e => setNewQuote(p => ({ ...p, projectId: e.target.value }))}>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.id} — {p.service}</option>)}
                </select>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Line Items</label>
                {newQuote.lineItems.map((li, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginTop: '8px' }}>
                    <input className="creator-input" placeholder="Description" value={li.description} onChange={e => {
                      const items = [...newQuote.lineItems]; items[i].description = e.target.value;
                      setNewQuote(p => ({ ...p, lineItems: items }));
                    }} />
                    <input className="creator-input" placeholder="Rate ₹" type="number" style={{ width: '100px' }} value={li.rate} onChange={e => {
                      const items = [...newQuote.lineItems]; items[i].rate = parseFloat(e.target.value) || 0;
                      setNewQuote(p => ({ ...p, lineItems: items }));
                    }} />
                    <button className="admin-icon-btn text-danger" onClick={() => setNewQuote(p => ({ ...p, lineItems: p.lineItems.filter((_, j) => j !== i) }))}>
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
                <button className="creator-secondary-btn micro-btn margin-top-8" onClick={() => setNewQuote(p => ({ ...p, lineItems: [...p.lineItems, { description: '', quantity: 1, rate: 0 }] }))}>
                  <Plus size={14} /> Add Line
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button className="admin-primary-btn" onClick={handleCreateQuotation}><FileText size={16} /> Create</button>
                <button className="duolingo-secondary-btn micro-btn" onClick={() => setShowCreateQuote(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="audit-table-wrap">
            <table className="admin-data-table">
              <thead><tr><th>Quotation ID</th><th>Project</th><th>Total</th><th>GST</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {quotations.length === 0
                  ? <tr><td colSpan={7} className="admin-empty-row">No quotations yet.</td></tr>
                  : quotations.map(q => {
                    const sc = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
                    return (
                      <tr key={q.quotationId}>
                        <td><span className="log-id-text">{q.quotationId}</span></td>
                        <td>{q.projectId || '—'}</td>
                        <td className="font-semibold text-white">₹{q.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="text-muted">₹{q.gstAmount.toLocaleString('en-IN')} ({q.gstRate}%)</td>
                        <td className="text-muted text-xs">{q.validUntil}</td>
                        <td><span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>{q.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {q.status === 'draft' && (
                              <>
                                <button className="admin-primary-btn micro-btn" onClick={() => { financeService.updateQuotationStatus(q.quotationId, 'sent'); refresh(); }}>Send</button>
                                <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                                  onClick={() => {
                                    financeService.updateQuotationStatus(q.quotationId, 'approved');
                                    financeService.createInvoice(q, {});
                                    refresh();
                                  }}>→ Invoice</button>
                              </>
                            )}
                            {q.status === 'sent' && (
                              <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                                onClick={() => { financeService.updateQuotationStatus(q.quotationId, 'approved'); financeService.createInvoice(q, {}); refresh(); }}>
                                Approve → Invoice
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Invoices ── */}
      {section === 'invoices' && (
        <div>
          <div className="audit-table-wrap">
            <table className="admin-data-table">
              <thead><tr><th>Invoice ID</th><th>Project</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {invoices.length === 0
                  ? <tr><td colSpan={8} className="admin-empty-row">No invoices yet. Create a quotation and approve it to generate an invoice.</td></tr>
                  : invoices.map(inv => {
                    const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                    return (
                      <tr key={inv.invoiceId}>
                        <td><span className="log-id-text">{inv.invoiceId}</span></td>
                        <td>{inv.projectId}</td>
                        <td className="font-semibold text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="text-emerald">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                        <td className="text-muted">₹{inv.balanceAmount.toLocaleString('en-IN')}</td>
                        <td className="text-xs text-muted">{inv.dueDate}</td>
                        <td><span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>{inv.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {inv.status === 'draft' && (
                              <button className="admin-primary-btn micro-btn" onClick={() => { financeService.updateInvoiceStatus(inv.invoiceId, 'issued'); refresh(); }}>Issue</button>
                            )}
                            {(inv.status === 'issued' || inv.status === 'partially_paid') && (
                              <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                                onClick={() => {
                                  financeService.recordPayment({ invoiceId: inv.invoiceId, projectId: inv.projectId, amount: inv.balanceAmount, type: 'final' });
                                  refresh();
                                }}>
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payments ── */}
      {section === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button className="admin-primary-btn" onClick={() => {
              const projectId = prompt('Project ID (e.g. PRJ-001):');
              if (!projectId) return;
              const amount = parseFloat(prompt('Amount (₹):') || '0');
              if (!amount) return;
              financeService.recordPayment({ projectId, amount, method: 'cash', type: 'advance' });
              refresh();
            }}><Plus size={16} /> Record Payment</button>
          </div>
          <div className="audit-table-wrap">
            <table className="admin-data-table">
              <thead><tr><th>Payment ID</th><th>Project</th><th>Amount</th><th>Type</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {payments.length === 0
                  ? <tr><td colSpan={7} className="admin-empty-row">No payments recorded.</td></tr>
                  : payments.map(p => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                    return (
                      <tr key={p.paymentId}>
                        <td><span className="log-id-text">{p.paymentId}</span></td>
                        <td>{p.projectId}</td>
                        <td className="font-semibold text-emerald">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.type}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.method}</td>
                        <td><span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>{p.status}</span></td>
                        <td className="text-muted text-xs">{new Date(p.recordedAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payouts ── */}
      {section === 'payouts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button className="admin-primary-btn" onClick={() => setShowCreatePayout(true)}><Plus size={16} /> Create Payout</button>
          </div>

          {showCreatePayout && (
            <div className="admin-card-box margin-bottom-16">
              <div className="card-box-header"><h4>New Creator Payout</h4></div>
              <div className="creator-location-grid margin-top-12">
                {[
                  { key: 'creatorId', label: 'Creator ID', placeholder: 'e.g. ACRA000201' },
                  { key: 'projectId', label: 'Project ID', placeholder: 'e.g. PRJ-001' },
                  { key: 'grossAmount', label: 'Gross Amount (₹)', placeholder: 'e.g. 50000', type: 'number' },
                  { key: 'platformCommissionRate', label: 'Platform Commission %', placeholder: '15', type: 'number' }
                ].map(f => (
                  <div key={f.key} className="creator-form-field">
                    <label>{f.label}</label>
                    <input type={f.type || 'text'} className="creator-input" placeholder={f.placeholder}
                      value={newPayout[f.key]} onChange={e => setNewPayout(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              {newPayout.grossAmount && (
                <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '12px', marginTop: '12px', fontSize: '13px' }}>
                  <div>Gross: ₹{parseFloat(newPayout.grossAmount || 0).toLocaleString('en-IN')}</div>
                  <div>Commission ({newPayout.platformCommissionRate}%): −₹{Math.round(parseFloat(newPayout.grossAmount || 0) * parseFloat(newPayout.platformCommissionRate || 15) / 100).toLocaleString('en-IN')}</div>
                  <div className="text-emerald font-bold">Net Payout: ₹{Math.round(parseFloat(newPayout.grossAmount || 0) * (1 - parseFloat(newPayout.platformCommissionRate || 15) / 100)).toLocaleString('en-IN')}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="admin-primary-btn" onClick={handleCreatePayout}>Create Payout</button>
                <button className="duolingo-secondary-btn micro-btn" onClick={() => setShowCreatePayout(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="audit-table-wrap">
            <table className="admin-data-table">
              <thead><tr><th>Payout ID</th><th>Creator</th><th>Project</th><th>Gross</th><th>Commission</th><th>Net</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {payouts.length === 0
                  ? <tr><td colSpan={8} className="admin-empty-row">No payouts created yet.</td></tr>
                  : payouts.map(p => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={p.payoutId}>
                        <td><span className="log-id-text">{p.payoutId}</span></td>
                        <td style={{ color: '#818CF8' }}>{p.creatorId}</td>
                        <td>{p.projectId}</td>
                        <td>₹{p.grossAmount.toLocaleString('en-IN')}</td>
                        <td className="text-muted">₹{p.platformCommission.toLocaleString('en-IN')}</td>
                        <td className="font-semibold text-emerald">₹{p.netAmount.toLocaleString('en-IN')}</td>
                        <td><span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>{p.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {p.status === 'pending' && (
                              <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                                onClick={() => { financeService.updatePayoutStatus(p.payoutId, 'approved'); refresh(); }}>Approve</button>
                            )}
                            {p.status === 'approved' && (
                              <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }}
                                onClick={() => { financeService.updatePayoutStatus(p.payoutId, 'paid'); refresh(); }}>Mark Paid</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Expenses ── */}
      {section === 'expenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button className="admin-primary-btn" onClick={() => {
              const projectId = prompt('Project ID:');
              const description = prompt('Description:');
              const amount = parseFloat(prompt('Amount (₹):') || '0');
              const category = prompt('Category (rental/transport/misc):') || 'misc';
              if (projectId && amount) { financeService.recordExpense({ projectId, category, description, amount }); refresh(); }
            }}><Plus size={16} /> Record Expense</button>
          </div>
          <div className="audit-table-wrap">
            <table className="admin-data-table">
              <thead><tr><th>Expense ID</th><th>Project</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {expenses.length === 0
                  ? <tr><td colSpan={7} className="admin-empty-row">No expenses recorded yet.</td></tr>
                  : expenses.map(e => {
                    const sc = STATUS_CONFIG[e.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={e.expenseId}>
                        <td><span className="log-id-text">{e.expenseId}</span></td>
                        <td>{e.projectId}</td>
                        <td style={{ textTransform: 'capitalize' }}>{e.category}</td>
                        <td>{e.description}</td>
                        <td className="font-semibold text-white">₹{e.amount.toLocaleString('en-IN')}</td>
                        <td><span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>{e.status}</span></td>
                        <td className="text-muted text-xs">{new Date(e.recordedAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceTab;
