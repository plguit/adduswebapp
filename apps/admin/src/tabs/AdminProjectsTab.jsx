import React, { useState, useEffect } from 'react';
import { Search, FolderKanban, Filter, ChevronRight, Edit3, UserCheck, Play, CheckCircle, Brain, FileText, Package, History, Shield, Folder, Archive, Plus, DollarSign, MessageSquare } from 'lucide-react';
import { getAllProjectsAcrossUsers, updateProjectInStore, PROJECT_LIFECYCLE_STAGES } from '../../../../shared/hooks/useProjectStore.js';
import { adminApiService } from '../services/adminApiService.js';
import { NotificationEngine } from '../../../../src/services/brain/UniversalNotificationEngine.js';
import { ProjectTimeline } from '../../../../src/components/operations/ProjectTimeline.jsx';
import { ActivityFeed } from '../../../../src/components/operations/ActivityFeed.jsx';
import { StrategyWorkspace } from '../../../../src/components/operations/StrategyWorkspace.jsx';
import { DeliverablesManager } from '../../../../src/components/operations/DeliverablesManager.jsx';
import { ProjectFolders } from '../../../../src/components/operations/ProjectFolders.jsx';
import { profileService } from '../../../../shared/services/profileService.js';

export { PROJECT_LIFECYCLE_STAGES as PROJECT_STATUS_STEPS };

const STATUS_COLORS = {
  Draft: '#94A3B8',
  Submitted: '#818CF8',
  'Under Review': '#6366F1',
  'Strategy Preparation': '#A78BFA',
  'Waiting for Customer Approval': '#FBBF24',
  Approved: '#34D399',
  'Creator Assignment': '#38BDF8',
  'In Production': '#F59E0B',
  'Internal Quality Review': '#FB923C',
  'Customer Review': '#E879F9',
  'Revision Requested': '#EF4444',
  'Revision in Progress': '#F97316',
  'Approved by Customer': '#10B981',
  Delivered: '#059669',
  Archived: '#64748B'
};

export function AdminProjectsTab({ dataSource = 'localStorage', adminReady = false }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('overview'); // overview, strategy, brief, creator, deliverables, notes, activity, folders
  const [newInternalNote, setNewInternalNote] = useState('');
  const [newCustomerNote, setNewCustomerNote] = useState('');

  const refresh = async () => {
    try {
      let list = [];
      if (dataSource === 'backend' && adminReady) {
        const res = await adminApiService.getProjects();
        list = res.projects || [];
      } else {
        list = getAllProjectsAcrossUsers();
      }
      setProjects(list);
      if (selectedProject) {
        const updated = list.find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (e) {
      console.warn('[AdminProjectsTab] backend load failed, falling back to localStorage:', e.message);
      const list = getAllProjectsAcrossUsers();
      setProjects(list);
    }
  };

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener('addus_project_store_updated', handleUpdate);
    return () => window.removeEventListener('addus_project_store_updated', handleUpdate);
  }, [selectedProject?.id, dataSource, adminReady]);

  const handleUpdateStatus = (projectId, newStatus) => {
    updateProjectInStore(projectId, { status: newStatus }, { actor: 'Admin Lead', role: 'Admin' });
    refresh();
  };

  const handleAdvanceStatus = (proj) => {
    const currentIndex = PROJECT_LIFECYCLE_STAGES.indexOf(proj.status || 'Submitted');
    if (currentIndex >= 0 && currentIndex < PROJECT_LIFECYCLE_STAGES.length - 1) {
      const nextStatus = PROJECT_LIFECYCLE_STAGES[currentIndex + 1];
      updateProjectInStore(proj.id, { status: nextStatus }, { actor: 'Admin Lead', role: 'Admin' });
      refresh();
    }
  };

  const handleAddInternalNote = (e) => {
    e.preventDefault();
    if (!newInternalNote.trim() || !selectedProject) return;

    const currentNotes = selectedProject.internalNotes || [];
    const newEntry = {
      id: `in_${Date.now()}`,
      text: newInternalNote.trim(),
      author: 'Admin Strategist',
      createdAt: new Date().toISOString()
    };

    updateProjectInStore(selectedProject.id, { internalNotes: [newEntry, ...currentNotes] }, { actor: 'Admin', role: 'Admin' });
    setNewInternalNote('');
    refresh();
  };

  const handleAddCustomerNote = (e) => {
    e.preventDefault();
    if (!newCustomerNote.trim() || !selectedProject) return;

    const currentNotes = selectedProject.customerNotes || [];
    const newEntry = {
      id: `cn_${Date.now()}`,
      text: newCustomerNote.trim(),
      author: 'ADDUS Operations Team',
      createdAt: new Date().toISOString()
    };

    updateProjectInStore(selectedProject.id, { customerNotes: [newEntry, ...currentNotes] }, { actor: 'Admin', role: 'Admin' });
    setNewCustomerNote('');
    refresh();
  };

  const handleApproveBrief = () => {
    if (!selectedProject) return;
    const brief = selectedProject.creativeBrief || {};
    const approvedBrief = { ...brief, isApproved: true, approvedAt: new Date().toISOString() };

    updateProjectInStore(selectedProject.id, {
      creativeBrief: approvedBrief,
      approvedCreativeBrief: approvedBrief,
      status: 'Creator Assignment'
    }, { actor: 'Admin Creative Director', role: 'Admin' });

    alert('Creative Brief approved! Brief sent to Creator Assignment queue.');
    refresh();
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.id?.toLowerCase().includes(q) || p.service?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Project Operations Engine (Sprint 4 Pipeline)</h2>
          <p className="admin-section-sub">Full 15-stage operational pipeline from Customer submission to Admin strategy, Creator execution, Customer review, and Business Vault archiving.</p>
        </div>
        <span className="admin-count-chip">{filtered.length} Active Operations</span>
      </div>

      {/* 15-Step Pipeline Tracker */}
      <div className="admin-pipeline-scroll-wrap margin-top-16">
        <div className="admin-pipeline-tracker" style={{ gridTemplateColumns: `repeat(${PROJECT_LIFECYCLE_STAGES.length}, minmax(130px, 1fr))` }}>
          {PROJECT_LIFECYCLE_STAGES.map((step, idx) => {
            const count = projects.filter(p => p.status === step).length;
            return (
              <div key={step} className={`pipeline-step-item ${filterStatus === step ? 'step-selected' : ''}`} onClick={() => setFilterStatus(filterStatus === step ? 'All' : step)}>
                <span className="step-num">{idx + 1}</span>
                <span className="step-label">{step}</span>
                <span className="step-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filter-bar margin-top-16">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            className="admin-search-input"
            placeholder="Search by project ID, service type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <Filter size={15} />
          <select className="admin-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All 15 Lifecycle Stages</option>
            {PROJECT_LIFECYCLE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Projects Operations Table */}
      <div className="admin-table-wrap margin-top-16">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Service &amp; Title</th>
              <th>Customer ID</th>
              <th>Assigned Creator</th>
              <th>Lifecycle Stage (15 Steps)</th>
              <th>Timeline</th>
              <th>Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-empty-row">
                  <FolderKanban size={24} />
                  <p>No projects currently matching criteria.</p>
                </td>
              </tr>
            ) : filtered.map(p => {
              const currentStepIdx = PROJECT_LIFECYCLE_STAGES.indexOf(p.status || 'Submitted');
              const color = STATUS_COLORS[p.status] || '#94A3B8';
              const projId = p.projectId || p.id;
              const custId = p.customerId || p.userId || '—';
              const creatorName = p.assignedCreator ? p.assignedCreator.name : (p.creatorId || 'Unassigned');

              return (
                <tr key={p.id}>
                  <td>
                    <div className="id-badge-pill-group">
                      <span className="id-badge-pill" title="Click to view Project Operations Inspector" onClick={() => { setSelectedProject(p); setInspectorTab('overview'); }}>
                        {projId}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="td-primary-text">{p.service || p.type || ''}</div>
                    <div className="td-sub-text">{p.selectedStyle || ''}</div>
                  </td>
                  <td>
                    <div className="id-badge-pill-group">
                      <span className="id-badge-pill cust-id-pill">{custId}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`id-badge-pill ${p.assignedCreator ? 'creator-id-pill' : 'text-muted'}`}>
                      {creatorName}
                    </span>
                  </td>
                  <td>
                    <div className="status-select-wrap">
                      <select
                        className="admin-status-dropdown"
                        value={p.status || 'Submitted'}
                        style={{ color, borderColor: color }}
                        onChange={e => handleUpdateStatus(p.id, e.target.value)}
                      >
                        {PROJECT_LIFECYCLE_STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div>{p.shootDate ? new Date(p.shootDate).toLocaleDateString() : 'TBC'}</div>
                    <div className="td-sub-text">Delivery: {p.estimatedDelivery}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-white">
                      {p.quotation?.total ? `₹${Number(p.quotation.total).toLocaleString('en-IN')}` : (p.budget || 'Pending quote')}
                    </div>
                  </td>
                  <td>
                    <div className="admin-action-btn-group">
                      <button
                        type="button"
                        className="admin-primary-btn micro-btn"
                        onClick={() => handleAdvanceStatus(p)}
                        disabled={currentStepIdx >= PROJECT_LIFECYCLE_STAGES.length - 1}
                        title="Advance stage"
                      >
                        <span>Advance →</span>
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => { setSelectedProject(p); setInspectorTab('overview'); }}
                        title="Open Full Operational Inspector"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Operational Inspector Modal */}
      {selectedProject && (
        <div className="admin-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="admin-modal-content large-ops-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top-header flex-between">
              <div>
                <h3 className="modal-title">⚙️ Operational Inspector: {selectedProject.id}</h3>
                <span className="text-muted text-xs">Customer: {selectedProject.customerId || selectedProject.userId} · Created: {new Date(selectedProject.createdAt).toLocaleString()}</span>
              </div>
              <button className="admin-primary-btn micro-btn" onClick={() => handleUpdateStatus(selectedProject.id, 'Archived')}>
                <Archive size={14} /> Archive to Business Vault
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="inspector-nav-tabs margin-top-12">
              {[
                { id: 'overview', label: 'Overview', icon: FolderKanban },
                { id: 'strategy', label: 'Strategy Workspace', icon: Brain },
                { id: 'brief', label: 'Creative Brief', icon: FileText },
                { id: 'deliverables', label: 'Deliverables & QA', icon: Package },
                { id: 'chat', label: 'Chat Room', icon: MessageSquare },
                { id: 'notes', label: 'Dual Notes', icon: Shield },
                { id: 'quotation', label: 'Quotation Control', icon: DollarSign },
                { id: 'activity', label: 'Activity Feed', icon: History },
                { id: 'folders', label: 'File Folders', icon: Folder },
              ].map(tab => {
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`inspector-tab-btn ${inspectorTab === tab.id ? 'active' : ''}`}
                    onClick={() => setInspectorTab(tab.id)}
                  >
                    <IconComp size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="inspector-body-content margin-top-16">
              {inspectorTab === 'overview' && (
                <AdminProjectOverview project={selectedProject} onUpdate={refresh} />
              )}

              {inspectorTab === 'chat' && (
                <AdminProjectChat project={selectedProject} onUpdate={refresh} />
              )}

              {inspectorTab === 'strategy' && (
                <StrategyWorkspace project={selectedProject} onUpdate={refresh} />
              )}

              {inspectorTab === 'brief' && (
                <div className="creative-brief-inspector-box">
                  <div className="flex-between">
                    <h4>📝 Creative Brief Control</h4>
                    {selectedProject.creativeBrief?.isApproved ? (
                      <span className="badge-approved-green"><CheckCircle size={14} /> Approved for Creator</span>
                    ) : (
                      <button className="admin-primary-btn micro-btn" onClick={handleApproveBrief}>
                        <CheckCircle size={14} /> Approve Brief for Creator
                      </button>
                    )}
                  </div>

                  <div className="strategy-grid margin-top-16">
                    <div className="strat-field-box">
                      <label className="strat-label">Brief Title</label>
                      <input className="admin-field-input" value={selectedProject.creativeBrief?.title || ''} readOnly />
                    </div>
                    <div className="strat-field-box">
                      <label className="strat-label">Campaign Objective</label>
                      <input className="admin-field-input" value={selectedProject.creativeBrief?.objective || ''} readOnly />
                    </div>
                    <div className="strat-field-box">
                      <label className="strat-label">Key Message</label>
                      <input className="admin-field-input" value={selectedProject.creativeBrief?.keyMessage || ''} readOnly />
                    </div>
                     <div className="strat-field-box">
                       <label className="strat-label">Target Aspect Ratio</label>
                       <input className="admin-field-input" value={selectedProject.aspectRatio || ''} readOnly />
                     </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'deliverables' && (
                <DeliverablesManager project={selectedProject} role="Admin" onUpdate={refresh} />
              )}

              {inspectorTab === 'notes' && (
                <div className="dual-notes-container grid-2-col">
                  {/* Internal Notes */}
                  <div className="notes-box internal-notes-box">
                    <h4 className="notes-title text-indigo"><Shield size={16} /> Internal Admin Notes (Hidden from Customer &amp; Creator)</h4>
                    
                    <form onSubmit={handleAddInternalNote} className="margin-top-12">
                      <input
                        className="admin-field-input"
                        placeholder="Add private note (e.g. Budget flexible, client wants extra photography)..."
                        value={newInternalNote}
                        onChange={e => setNewInternalNote(e.target.value)}
                      />
                      <button type="submit" className="admin-primary-btn micro-btn margin-top-8 flex-center-gap">
                        <Plus size={14} /> Add Internal Note
                      </button>
                    </form>

                    <div className="notes-feed-list margin-top-12">
                      {(selectedProject.internalNotes || []).map((n, i) => (
                        <div key={i} className="note-card-item internal-note-card">
                          <div className="note-meta">{n.author} · {new Date(n.createdAt).toLocaleString()}</div>
                          <div className="note-text">{n.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Visible Notes */}
                  <div className="notes-box customer-notes-box">
                    <h4 className="notes-title text-emerald"><UserCheck size={16} /> Customer Visible Notes</h4>

                    <form onSubmit={handleAddCustomerNote} className="margin-top-12">
                      <input
                        className="admin-field-input"
                        placeholder="Add customer visible progress update..."
                        value={newCustomerNote}
                        onChange={e => setNewCustomerNote(e.target.value)}
                      />
                      <button type="submit" className="duolingo-secondary-btn micro-btn margin-top-8 flex-center-gap">
                        <Plus size={14} /> Post Customer Update
                      </button>
                    </form>

                    <div className="notes-feed-list margin-top-12">
                      {(selectedProject.customerNotes || []).map((n, i) => (
                        <div key={i} className="note-card-item customer-note-card">
                          <div className="note-meta">{n.author} · {new Date(n.createdAt).toLocaleString()}</div>
                          <div className="note-text">{n.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {inspectorTab === 'activity' && (
                <ActivityFeed activityLog={selectedProject.activityLog || []} />
              )}

              {inspectorTab === 'folders' && (
                <ProjectFolders project={selectedProject} role="Admin" onUpdate={refresh} />
              )}

              {inspectorTab === 'quotation' && (
                <AdminQuotationInspector project={selectedProject} onUpdate={refresh} />
              )}
            </div>

            <div className="margin-top-20 align-right">
              <button type="button" className="admin-primary-btn" onClick={() => setSelectedProject(null)}>
                Close Operational Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProjectsTab;

function AdminQuotationInspector({ project, onUpdate }) {
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
    
    updateProjectInStore(project.id, { quotation: updatedQuotation });
    onUpdate?.();
    
    if (statusUpdate === 'Sent') {
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
      revisionHistory: [...(quotation.revisionHistory || []), { version: quotation.version, date: new Date().toISOString(), items: [...quotation.items], total: quotation.total }]
    });
  };

  return (
    <div className="admin-quotation-inspector-tab">
      <div className="flex-between">
        <h4>Quotation Version: {quotation.version}</h4>
        <span className="admin-status-chip">● {quotation.status}</span>
      </div>

      <div className="admin-card margin-top-16" style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 2 }}>
          <h4 style={{ marginBottom: '12px' }}>Quotation Items</h4>
          {(quotation.status === 'Draft' || quotation.status === 'Revision Requested' || quotation.status === 'No Quotation') ? (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: '8px', marginBottom: '16px' }}>
              <input className="duolingo-input" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} />
              <input className="duolingo-input" placeholder="Description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} />
              <input className="duolingo-input" type="number" placeholder="Qty" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} />
              <input className="duolingo-input" type="number" placeholder="Price" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }} />
              <button className="duolingo-primary-btn" onClick={handleAddItem} style={{ padding: '8px 16px', background: '#7c5cff', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
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
              {quotation.items.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6B7280', padding: '16px' }}>No items added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ marginBottom: '12px' }}>Summary</h4>
          <div className="flex-between margin-bottom-8"><span>Subtotal:</span> <span>₹{quotation.subtotal.toLocaleString()}</span></div>
          <div className="flex-between margin-bottom-8"><span>Discount:</span> <span>₹{quotation.discount.toLocaleString()}</span></div>
          <div className="flex-between margin-bottom-8"><span>Tax:</span> <span>₹{quotation.tax.toLocaleString()}</span></div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }}/>
          <div className="flex-between" style={{ fontSize: '16px', fontWeight: 'bold' }}><span>Grand Total:</span> <span style={{ color: '#34D399' }}>₹{quotation.total.toLocaleString()}</span></div>
          
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(quotation.status === 'Draft' || quotation.status === 'Revision Requested' || quotation.status === 'No Quotation') && (
              <>
                <button className="duolingo-secondary-btn" onClick={() => saveToStore()} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Save Draft</button>
                <button className="duolingo-primary-btn" onClick={() => saveToStore('Sent')} style={{ width: '100%', padding: '10px', background: '#7c5cff', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Send to Customer</button>
              </>
            )}
            {(quotation.status === 'Sent' || quotation.status === 'Approved' || quotation.status === 'Rejected') && (
              <button className="duolingo-secondary-btn" onClick={handleRevise} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Create New Revision</button>
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
  );
}

function AdminProjectOverview({ project, onUpdate }) {
  const customerProfile = profileService.getProfileById(project.userId || project.customerId) || {};
  const businessBrain = customerProfile.businessBrain || project.businessProfile || {};
  const uploadedFiles = customerProfile.uploadedFiles || project.uploadedFiles || [];
  const selectedRefs = project.selectedGalleryReferences || [];

  const [sugService, setSugService] = useState('Website');
  const [sugPrice, setSugPrice] = useState(15000);
  const [sugDesc, setSugDesc] = useState('');
  const [sugReason, setSugReason] = useState('');
  const [sugNote, setSugNote] = useState('');

  const handleSuggestService = (e) => {
    if (e) e.preventDefault();
    if (!sugService || sugPrice <= 0) return;

    const newSug = {
      id: `sug_${Date.now()}`,
      serviceName: sugService,
      description: sugDesc || `Custom creative deliverables for ${sugService}`,
      price: Number(sugPrice),
      reason: sugReason || 'Based on your business profile targets.',
      note: sugNote,
      status: 'suggested',
      createdAt: new Date().toISOString()
    };

    const updatedSugs = [...(project.suggestedServices || []), newSug];
    updateProjectInStore(project.id, { suggestedServices: updatedSugs });

    NotificationEngine.notify({
      userId: project.userId || project.customerId,
      role: 'Customer',
      type: 'service_suggested',
      title: 'New Service Suggested',
      message: `Operations suggested: ${sugService} for ₹${Number(sugPrice).toLocaleString()}`
    });

    const systemMsg = {
      id: `msg_${Date.now()}`,
      senderId: 'admin_ops',
      senderName: 'ADDUS Team',
      senderRole: 'Admin',
      text: `[Suggested Service] ${sugService} for ₹${Number(sugPrice).toLocaleString()}. Reason: ${sugReason}`,
      timestamp: new Date().toISOString(),
      isInternal: false
    };
    updateProjectInStore(project.id, { chat: [...(project.chat || []), systemMsg] });

    setSugDesc('');
    setSugReason('');
    setSugNote('');
    alert(`Service "${sugService}" successfully suggested to customer.`);
    onUpdate?.();
  };

  return (
    <div className="admin-project-overview-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '75vh', paddingRight: '6px' }}>
      <ProjectTimeline project={project} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="admin-card">
          <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>📋 Core Project Details</h4>
          <div className="admin-profile-card">
            <div className="profile-row"><span className="profile-label">Service:</span><span className="profile-val">{project.service}</span></div>
            <div className="profile-row"><span className="profile-label">Current Stage:</span><span className="profile-val">{project.status}</span></div>
            <div className="profile-row"><span className="profile-label">Assigned Creator:</span><span className="profile-val">{project.assignedCreator?.name || 'Unassigned'}</span></div>
            <div className="profile-row"><span className="profile-label">Estimated Budget:</span><span className="profile-val">{project.budget}</span></div>
          </div>
        </div>

        <div className="admin-card">
          <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>👤 Customer Info</h4>
          <div className="admin-profile-card">
            <div className="profile-row"><span className="profile-label">Name:</span><span className="profile-val">{customerProfile.name || 'Anonymous'}</span></div>
            <div className="profile-row"><span className="profile-label">Email:</span><span className="profile-val">{customerProfile.email || 'N/A'}</span></div>
            <div className="profile-row"><span className="profile-label">Phone:</span><span className="profile-val">{customerProfile.phoneNumber || 'N/A'}</span></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="admin-card">
          <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>🏢 Business Profile Details</h4>
          <div className="admin-profile-card">
            <div className="profile-row"><span className="profile-label">Business Name:</span><span className="profile-val">{businessBrain.businessName || 'N/A'}</span></div>
            <div className="profile-row"><span className="profile-label">Website:</span><span className="profile-val">{businessBrain.website ? <a href={businessBrain.website} target="_blank" rel="noreferrer" style={{ color: '#a78bfa' }}>{businessBrain.website}</a> : 'N/A'}</span></div>
            <div className="profile-row"><span className="profile-label">Industry:</span><span className="profile-val">{businessBrain.industry || 'N/A'}</span></div>
            <div className="profile-row"><span className="profile-label">Segment:</span><span className="profile-val">{businessBrain.segment || 'N/A'}</span></div>
            <div className="profile-row"><span className="profile-label">Stage:</span><span className="profile-val">{businessBrain.businessStage || 'N/A'}</span></div>
            <div className="profile-row"><span className="profile-label">Goals:</span><span className="profile-val">{businessBrain.businessGoal || 'N/A'}</span></div>
          </div>
          {businessBrain.businessDescription && (
            <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
              <strong>Description:</strong> {businessBrain.businessDescription}
            </div>
          )}
        </div>

        <div className="admin-card">
          <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>🎯 Strategic Insights</h4>
          <div className="admin-profile-card">
            <div className="profile-row">
              <span className="profile-label">Selected Services:</span>
              <span className="profile-val">{(project.selectedServices || [project.service] || []).join(', ')}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Final Scope:</span>
              <span className="profile-val">{(project.finalScope || []).join(', ') || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Target Audience:</span>
              <span className="profile-val">{businessBrain.targetAudience || 'N/A'}</span>
            </div>
            {project.schedulingRequest && (
              <div className="profile-row">
                <span className="profile-label">Schedule Requests:</span>
                <span className="profile-val">Date: {project.schedulingRequest.date || 'N/A'} / Time: {project.schedulingRequest.time || 'N/A'}</span>
              </div>
            )}
            {project.customScopeRequest && (
              <div className="profile-row">
                <span className="profile-label">Custom Requests:</span>
                <span className="profile-val">{project.customScopeRequest}</span>
              </div>
            )}
          </div>
          {businessBrain.recommendations && businessBrain.recommendations.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <strong>AI Recommendations:</strong>
              <ul style={{ paddingLeft: '16px', margin: '4px 0', fontSize: '12px', color: '#B3B3B3' }}>
                {businessBrain.recommendations.map((r, i) => (
                  <li key={i}>{r.service} ({r.evidence || 'Strong opportunity'})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="admin-card">
          <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>📎 Business Vault Reference Files</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#6B7280' }}>No reference files uploaded in vault yet.</div>
            ) : (
              uploadedFiles.map(file => (
                <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Category: {file.category || 'General'}</div>
                  </div>
                  {file.url && (
                    <a href={file.url} target="_blank" rel="noreferrer" className="admin-primary-btn micro-btn" style={{ textDecoration: 'none' }}>
                      Open Link
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card">
          <h4 style={{ marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>🎨 Selected Gallery Styles</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {selectedRefs.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#6B7280' }}>No gallery reference styles selected yet.</div>
            ) : (
              selectedRefs.map((ref, i) => (
                <span key={i} style={{ background: '#7c5cff', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  {ref}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ border: '1px solid rgba(124,92,255,0.2)', background: 'rgba(124,92,255,0.03)', padding: '16px' }}>
        <h4 style={{ color: '#A78BFA', marginBottom: '12px' }}>💡 Suggest Service Expansion</h4>
        <form onSubmit={handleSuggestService} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="admin-field-label">Service Name *</label>
              <select className="admin-field-input" value={sugService} onChange={e => setSugService(e.target.value)}>
                <option value="Website">Website</option>
                <option value="Logo Design">Logo Design</option>
                <option value="Packaging Design">Packaging Design</option>
                <option value="Product Photography">Product Photography</option>
                <option value="Brand Guidelines">Brand Guidelines</option>
                <option value="SEO &amp; Marketing">SEO &amp; Marketing</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Explainer Video">Explainer Video</option>
              </select>
            </div>
            <div>
              <label className="admin-field-label">Price / Budget (₹) *</label>
              <input type="number" className="admin-field-input" value={sugPrice} onChange={e => setSugPrice(Number(e.target.value))} required />
            </div>
          </div>
          <div>
            <label className="admin-field-label">Service Description</label>
            <input type="text" className="admin-field-input" placeholder="e.g. Modern responsive next.js website" value={sugDesc} onChange={e => setSugDesc(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="admin-field-label">Reason / Strategy Evidence</label>
              <input type="text" className="admin-field-input" placeholder="e.g. Expand reach to digital search users" value={sugReason} onChange={e => setSugReason(e.target.value)} />
            </div>
            <div>
              <label className="admin-field-label">Admin Private Note (Optional)</label>
              <input type="text" className="admin-field-input" placeholder="e.g. Quote valid for 15 days" value={sugNote} onChange={e => setSugNote(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="admin-primary-btn" style={{ alignSelf: 'flex-start' }}>Suggest service to customer</button>
        </form>
      </div>
    </div>
  );
}

function AdminProjectChat({ project, onUpdate }) {
  const [replyText, setReplyText] = useState('');
  const chatMessages = project.chat || [];

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    const adminMsg = {
      id: `msg_${Date.now()}`,
      senderId: 'admin_ops',
      senderName: 'ADDUS Admin',
      senderRole: 'Admin',
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
      isInternal: false
    };

    updateProjectInStore(project.id, { chat: [...chatMessages, adminMsg] });

    const custProfile = profileService.getProfileById(project.userId || project.customerId);
    if (custProfile) {
      const chatHist = custProfile.chatHistory || [];
      const newGlobalMsg = {
        id: adminMsg.id,
        sender: 'ai',
        text: `[Admin] ${replyText.trim()}`,
        timestamp: adminMsg.timestamp
      };
      profileService.saveProfile({ ...custProfile, chatHistory: [...chatHist, newGlobalMsg] });
      window.dispatchEvent(new CustomEvent('addus_profile_updated'));
    }

    NotificationEngine.notify({
      userId: project.userId || project.customerId,
      role: 'Customer',
      type: 'chat_message',
      title: 'New Message from Operations',
      message: replyText.trim()
    });

    setReplyText('');
    onUpdate?.();
  };

  return (
    <div className="admin-chat-inspector-tab" style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
      <h4 style={{ marginBottom: '12px' }}>💬 Project Chat Room (Two-Way Customer &amp; ADDI Stream)</h4>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
        {chatMessages.length === 0 && (
          <div style={{ color: '#6B7280', textAlign: 'center', marginTop: '20px' }}>No messages in this chat yet.</div>
        )}
        {chatMessages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.senderRole === 'Admin' ? 'flex-end' : 'flex-start', background: m.senderRole === 'Admin' ? '#7c5cff' : '#374151', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>{m.senderName} ({m.senderRole})</div>
            <div style={{ fontSize: '13px', color: '#fff' }}>{m.text}</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: '4px' }}>{new Date(m.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          className="admin-field-input"
          style={{ flex: 1 }}
          placeholder="Reply to the customer..."
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
        />
        <button type="submit" className="admin-primary-btn" disabled={!replyText.trim()}>Send Reply</button>
      </form>
    </div>
  );
}
