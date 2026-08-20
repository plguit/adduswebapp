import React, { useState, useEffect } from 'react';
import { Search, FolderKanban, ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';
import { apiService } from '../../../services/api.js';

const STATUS_COLORS = {
  Planning: '#a78bfa',
  Booked: '#60a5fa',
  'In Progress': '#f59e0b',
  Production: '#f59e0b',
  Editing: '#fb923c',
  Review: '#34d399',
  Completed: '#10b981',
  Delivered: '#10b981',
  Cancelled: '#94a3b8',
};

const ALL_STATUSES = ['All', 'Planning', 'Booked', 'In Progress', 'Editing', 'Review', 'Completed', 'Cancelled'];
const ITEMS_PER_PAGE = 10;

export function AdminProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    apiService.fetchAdminProjects().then(setProjects);
  }, []);

  const refresh = async () => {
    const data = await apiService.fetchAdminProjects();
    setProjects(data);
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const match = !q || p.id?.toLowerCase().includes(q) || p.service?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q);
    const statusMatch = filterStatus === 'All' || p.status === filterStatus;
    
    let matchDate = true;
    if (dateFrom) {
      const from = new Date(dateFrom);
      const created = p.createdAt ? new Date(p.createdAt) : null;
      matchDate = created ? created >= from : false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      const created = p.createdAt ? new Date(p.createdAt) : null;
      matchDate = matchDate && (created ? created <= to : false);
    }
    
    return match && statusMatch && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, dateFrom, dateTo]);

  const downloadCSV = () => {
    const headers = ['Project ID', 'Service', 'Customer ID', 'Creator', 'Status', 'Budget', 'Timeline'];
    const rows = filtered.map(p => [p.id, p.type || p.service, p.userId || p.customerId, p.assignedCreator || 'Unassigned', p.status, p.budget, p.shootDate || p.deliveryDate || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-filter-bar" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="admin-search-wrap">
          <Search size={16} />
          <input className="admin-search-input" placeholder="Search project ID, service type..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="admin-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} style={{ color: '#9CA3AF' }} />
          <input type="date" className="admin-select" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" style={{ padding: '6px 10px', fontSize: '13px' }} />
          <span style={{ color: '#6B7280', fontSize: '12px' }}>to</span>
          <input type="date" className="admin-select" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" style={{ padding: '6px 10px', fontSize: '13px' }} />
          {(dateFrom || dateTo) && <button className="admin-clear-filter" onClick={() => { setDateFrom(''); setDateTo(''); }}><span style={{ fontSize: '16px', lineHeight: 1 }}>×</span></button>}
        </div>
        <button className="admin-action-btn" onClick={downloadCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} /> Download CSV
        </button>
        <span className="admin-count-chip">{filtered.length} projects</span>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Service & Title</th>
              <th>Customer ID</th>
              <th>Assigned Creator</th>
              <th>Lifecycle Stage</th>
              <th>Timeline</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={8} className="admin-empty-row"><FolderKanban size={20} /> No projects currently matching criteria.</td></tr>
            ) : paginated.map(p => (
              <tr key={p.id}>
                <td className="admin-td-bold">{p.id || '—'}</td>
                <td>{p.type || p.service || '—'}</td>
                <td>{p.userId || p.customerId || '—'}</td>
                <td>{p.assignedCreator || p.creatorId || 'Unassigned'}</td>
                <td>
                  <select
                    className="admin-select"
                    style={{ padding: '4px 8px', fontSize: '12px', background: '#1A1A24', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px' }}
                    value={p.status || 'Submitted'}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      const { updateProjectInStore } = require('../../../store/projectStore.js');
                      const { NotificationEngine } = require('../../../services/brain/UniversalNotificationEngine.js');
                      updateProjectInStore(p.id, { status: newStatus });
                      NotificationEngine.notify({
                        userId: p.userId || p.customerId,
                        role: 'Customer',
                        type: 'project_status_updated',
                        title: 'Project Status Updated',
                        message: `Your project ${p.id} status is now: ${newStatus}`
                      });
                      refresh();
                    }}
                  >
                    {['Submitted', 'Under Review', 'Strategy Preparation', 'Approved', 'Creator Assignment', 'In Production', 'Internal Quality Review', 'Customer Review', 'Revision Requested', 'Delivered', 'Completed'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>{p.shootDate || p.deliveryDate || '—'}</td>
                <td>{p.budget || '—'}</td>
                <td>
                  <button className="admin-view-btn" onClick={() => setSelectedProject(p)}>
                    <Search size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="admin-page-info">Page {currentPage} of {totalPages} ({filtered.length} total)</span>
          <button className="admin-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {selectedProject && (
        <AdminQuotationModal project={selectedProject} onClose={() => { setSelectedProject(null); refresh(); }} />
      )}
    </div>
  );
}

function AdminQuotationModal({ project, onClose }) {
  const [quotation, setQuotation] = useState(project.quotation || { status: 'Draft', version: 1, items: [], subtotal: 0, discount: 0, tax: 0, total: 0, revisionHistory: [] });
  const [newItem, setNewItem] = useState({ name: '', description: '', quantity: 1, unitPrice: 0 });

  const calculateTotals = (items, discount = quotation.discount, tax = quotation.tax) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal - discount + tax;
    return { subtotal, total };
  };

  const handleAddItem = () => {
    if (!newItem.name || newItem.unitPrice <= 0) return;
    const updatedItems = [...quotation.items, { ...newItem, id: Date.now().toString() }];
    const totals = calculateTotals(updatedItems);
    setQuotation({ ...quotation, items: updatedItems, ...totals });
    setNewItem({ name: '', description: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveItem = (id) => {
    const updatedItems = quotation.items.filter(i => i.id !== id);
    const totals = calculateTotals(updatedItems);
    setQuotation({ ...quotation, items: updatedItems, ...totals });
  };

  const saveToStore = (statusUpdate = null) => {
    const updatedQuotation = { ...quotation };
    if (statusUpdate) updatedQuotation.status = statusUpdate;
    
    // Import updateProjectInStore dynamically to avoid circular dependencies if any
    const { updateProjectInStore } = require('../../../store/projectStore.js');
    updateProjectInStore(project.id, { quotation: updatedQuotation });
    
    if (statusUpdate === 'Sent') {
      const { NotificationEngine } = require('../../../services/brain/UniversalNotificationEngine.js');
      NotificationEngine.notify({
        userId: project.userId,
        role: 'Customer',
        type: 'quotation_received',
        title: 'New Quotation Received',
        message: `Quotation Version ${updatedQuotation.version} for project ${project.id} is ready for your review.`
      });
    }
  };

  const handleRevise = () => {
    setQuotation({
      ...quotation,
      version: quotation.version + 1,
      status: 'Draft',
      revisionHistory: [...quotation.revisionHistory, { version: quotation.version, date: new Date().toISOString(), items: [...quotation.items], total: quotation.total }]
    });
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content large-ops-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-top-header flex-between">
          <div>
            <h3 className="modal-title">Quotation Builder: {project.id}</h3>
            <span className="text-muted text-xs">Version: {quotation.version} · Status: <strong>{quotation.status}</strong></span>
          </div>
          <button className="duolingo-secondary-btn micro-btn" onClick={onClose}>Close</button>
        </div>

        <div className="admin-card margin-top-16" style={{ display: 'flex', gap: '16px' }}>
          
          <div style={{ flex: 2 }}>
            <h4 style={{ marginBottom: '12px' }}>Quotation Items</h4>
            {quotation.status === 'Draft' || quotation.status === 'Revision Requested' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: '8px', marginBottom: '16px' }}>
                <input className="duolingo-input" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                <input className="duolingo-input" placeholder="Description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                <input className="duolingo-input" type="number" placeholder="Qty" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                <input className="duolingo-input" type="number" placeholder="Price" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})} />
                <button className="duolingo-primary-btn" onClick={handleAddItem}>Add</button>
              </div>
            ) : null}

            <table className="admin-table" style={{ width: '100%', marginBottom: '16px' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{ fontSize: '11px', color: '#9CA3AF' }}>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unitPrice.toLocaleString()}</td>
                    <td>₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    <td>
                      {(quotation.status === 'Draft' || quotation.status === 'Revision Requested') && (
                        <button style={{ color: '#F87171', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleRemoveItem(item.id)}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '12px' }}>Summary</h4>
            <div className="flex-between margin-bottom-8"><span>Subtotal:</span> <span>₹{quotation.subtotal.toLocaleString()}</span></div>
            <div className="flex-between margin-bottom-8"><span>Discount:</span> <span>₹{quotation.discount.toLocaleString()}</span></div>
            <div className="flex-between margin-bottom-8"><span>Tax:</span> <span>₹{quotation.tax.toLocaleString()}</span></div>
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }}/>
            <div className="flex-between" style={{ fontSize: '16px', fontWeight: 'bold' }}><span>Grand Total:</span> <span style={{ color: '#34D399' }}>₹{quotation.total.toLocaleString()}</span></div>
            
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(quotation.status === 'Draft' || quotation.status === 'Revision Requested') && (
                <>
                  <button className="duolingo-secondary-btn" onClick={() => saveToStore()}>Save Draft</button>
                  <button className="duolingo-primary-btn" onClick={() => saveToStore('Sent')}>Send to Customer</button>
                </>
              )}
              {(quotation.status === 'Sent' || quotation.status === 'Approved' || quotation.status === 'Rejected') && (
                <button className="duolingo-secondary-btn" onClick={handleRevise}>Create New Revision</button>
              )}
            </div>
          </div>
        </div>

        {quotation.revisionHistory && quotation.revisionHistory.length > 0 && (
          <div className="admin-card margin-top-16">
            <h4 style={{ marginBottom: '12px' }}>Revision History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quotation.revisionHistory.map((rev, idx) => (
                <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Version {rev.version}</strong> — {new Date(rev.date).toLocaleDateString()}</span>
                  <span>Total: ₹{rev.total.toLocaleString()}</span>
                  {rev.reason && <span style={{ color: '#FCA5A5' }}>Reason: {rev.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
