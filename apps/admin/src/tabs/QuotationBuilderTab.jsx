import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Send, Plus, Trash2, CheckCircle, DollarSign, Clock, FileText } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { getAllProjectsAcrossUsers, updateProjectInStore } from '../../../../shared/hooks/useProjectStore.js';

export function QuotationBuilderTab({ dataSource = 'localStorage', adminReady = false }) {
  const [profiles, setProfiles] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [proposalTitle, setProposalTitle] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [timelineDays, setTimelineDays] = useState('');
  
  const [deliverables, setDeliverables] = useState([]);
  
  const [newDeliverableInput, setNewDeliverableInput] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    setProfiles(profileService.getAllProfiles());
    setProjects(getAllProjectsAcrossUsers());
  }, []);

  const handleAddDeliverable = () => {
    if (!newDeliverableInput.trim()) return;
    setDeliverables([...deliverables, newDeliverableInput.trim()]);
    setNewDeliverableInput('');
  };

  const handleRemoveDeliverable = (idx) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  const handleSendQuotation = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const quotationPayload = {
      id: `quot_${Date.now()}`,
      title: proposalTitle,
      price: `₹${priceInput}`,
      timeline: `${timelineDays} Days`,
      deliverables,
      createdAt: new Date().toISOString()
    };

    // Send notification & proposal to user profile
    profileService.addNotification(selectedUserId, {
      type: 'quotation_received',
      message: `Official Proposal Generated: "${proposalTitle}" for ₹${priceInput}.`,
      quotation: quotationPayload
    });

    if (selectedProjectId) {
      updateProjectInStore(selectedProjectId, {
        budget: `₹${priceInput}`,
        status: 'Quotation',
        proposalTitle
      });
    }

    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Quotation &amp; Proposal Builder</h2>
          <p className="admin-section-sub">Generate customized commercial proposals, pricing, timelines, and deliverables for customers.</p>
        </div>
      </div>

      <div className="quotation-builder-layout margin-top-20">
        
        {/* Form Column */}
        <form onSubmit={handleSendQuotation} className="admin-card-box">
          <h3><FileSpreadsheet size={18} className="inline-icon" /> Quotation Generator</h3>

          {sentSuccess && (
            <div className="admin-success-banner margin-top-12">
              <CheckCircle size={18} /> Official Quotation Sent Directly to Customer Dashboard!
            </div>
          )}

          <div className="admin-field-group margin-top-16">
            <label className="admin-field-label">Select Customer / Business</label>
            <select
              className="admin-field-input"
              value={selectedUserId}
              onChange={e => {
                const uid = e.target.value;
                setSelectedUserId(uid);
                const userProjects = projects.filter(p => p.userId === uid || true);
                if (userProjects.length > 0) setSelectedProjectId(userProjects[0].id);
              }}
              required
            >
              <option value="">-- Choose Customer Account --</option>
              {profiles.map(p => {
                const brain = p.businessBrain || {};
                return (
                  <option key={p.userId} value={p.userId}>
                    {brain.businessName || p.name || 'User'} ({p.phoneNumber || p.email || p.userId})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="admin-field-group">
            <label className="admin-field-label">Link Project (Optional)</label>
            <select
              className="admin-field-input"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
            >
              <option value="">-- Select Project --</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>{proj.id} ({proj.service})</option>
              ))}
            </select>
          </div>

          <div className="admin-field-group">
            <label className="admin-field-label">Proposal Title</label>
            <input
              type="text"
              className="admin-field-input"
              value={proposalTitle}
              onChange={e => setProposalTitle(e.target.value)}
              required
            />
          </div>

          <div className="admin-grid-2col">
            <div className="admin-field-group">
              <label className="admin-field-label">Price (INR ₹)</label>
              <input
                type="text"
                className="admin-field-input"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                required
              />
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Timeline (Days)</label>
              <input
                type="number"
                className="admin-field-input"
                value={timelineDays}
                onChange={e => setTimelineDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-field-group">
            <label className="admin-field-label">Custom Deliverables Checklist</label>
            <div className="deliverable-input-row">
              <input
                type="text"
                className="admin-field-input"
                placeholder="Add deliverable (e.g. 1 Main 4K Film)..."
                value={newDeliverableInput}
                onChange={e => setNewDeliverableInput(e.target.value)}
              />
              <button type="button" className="admin-primary-btn" onClick={handleAddDeliverable}>
                <Plus size={16} /> Add
              </button>
            </div>

            <ul className="builder-deliverables-list margin-top-10">
              {deliverables.map((item, idx) => (
                <li key={idx} className="builder-deliv-item">
                  <span>✓ {item}</span>
                  <button type="button" className="btn-del-item" onClick={() => handleRemoveDeliverable(idx)}>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="margin-top-20">
            <button type="submit" className="admin-primary-btn full-width-btn" disabled={!selectedUserId}>
              <Send size={16} /> Generate &amp; Send Quotation to Customer
            </button>
          </div>
        </form>

        {/* Live Proposal Preview */}
        <div className="proposal-preview-card">
          <div className="preview-header">
            <span className="brand-tag">ADDUS OFFICIAL PROPOSAL</span>
            <h3>{proposalTitle}</h3>
          </div>

          <div className="preview-body margin-top-16">
            <div className="preview-price-box">
              <span className="price-label">Total Commercial Investment</span>
              <h2 className="price-val">₹{priceInput}</h2>
              <span className="timeline-sub"><Clock size={14} className="inline-icon" /> Delivery in {timelineDays} Days</span>
            </div>

            <div className="margin-top-16">
              <h4>Scope of Deliverables:</h4>
              <ul className="preview-deliverables-list">
                {deliverables.map((d, i) => (
                  <li key={i}><CheckCircle size={14} className="check-green" /> {d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Commercial Quotations Log Table */}
      <div className="margin-top-24">
        <h3>Generated Commercial Quotations Directory</h3>
        <div className="audit-table-wrap margin-top-12">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>Project ID</th>
                <th>Customer ID</th>
                <th>Proposal Title</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date Generated</th>
              </tr>
            </thead>
            <tbody>
              {projects
                .filter(p => p.quotation && p.quotation.total)
                .map(p => {
                  const q = p.quotation;
                  return (
                    <tr key={q.id || p.id}>
                      <td>
                        <div className="id-badge-pill-group">
                          <span className="id-badge-pill">{q.id || p.id}</span>
                          <button className="id-copy-btn" onClick={() => navigator.clipboard.writeText(q.id || p.id)}>📋</button>
                        </div>
                      </td>
                      <td><span className="component-tag">{p.projectId || p.id}</span></td>
                      <td>
                        <div className="id-badge-pill-group">
                          <span className="id-badge-pill cust-id-pill">{p.customerId || p.userId}</span>
                          <button className="id-copy-btn" onClick={() => navigator.clipboard.writeText(p.customerId || p.userId)}>📋</button>
                        </div>
                      </td>
                      <td className="font-semibold text-white">{q.title || (p.service || p.id)}</td>
                      <td className="font-bold text-emerald">₹{Number(q.total || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`status-tag tag-${q.status === 'Approved' ? 'approved' : 'pending'}`}>
                          {(q.status || 'Draft').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-muted text-xs">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default QuotationBuilderTab;
