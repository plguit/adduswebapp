import React, { useState } from 'react';
import { Upload, CheckCircle2, XCircle, Clock, FileText, Download, MessageSquare, CornerDownRight, AlertCircle, RefreshCw } from 'lucide-react';
import { updateProjectInStore } from '../../store/projectStore.js';

export function DeliverablesManager({ project, role = 'Customer', onUpdate }) {
  const [uploadModalItem, setUploadModalItem] = useState(null);
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'versions'

  if (!project) return null;

  const deliverables = project.deliverables || [];
  const versionHistory = project.versionHistory || [];

  const handleUploadDeliverable = (e) => {
    e.preventDefault();
    if (!uploadModalItem || !fileUrlInput.trim()) return;

    const now = new Date().toISOString();
    const updatedDeliverables = deliverables.map(d => {
      if (d.id === uploadModalItem.id) {
        return {
          ...d,
          url: fileUrlInput.trim(),
          status: 'Uploaded',
          updatedAt: now
        };
      }
      return d;
    });

    const isAllUploaded = updatedDeliverables.every(d => d.status === 'Uploaded' || d.status === 'Approved');

    updateProjectInStore(project.id, {
      deliverables: updatedDeliverables,
      status: isAllUploaded ? (role === 'Creator' ? 'Internal Quality Review' : project.status) : project.status
    }, {
      actor: role === 'Creator' ? 'Assigned Creator' : 'Admin',
      role
    });

    setUploadModalItem(null);
    setFileUrlInput('');
    if (onUpdate) onUpdate();
  };

  const handleAdminApproveDeliverable = (delId) => {
    const now = new Date().toISOString();
    const updatedDeliverables = deliverables.map(d => {
      if (d.id === delId) {
        return { ...d, status: 'Approved', updatedAt: now };
      }
      return d;
    });

    const isAllApproved = updatedDeliverables.every(d => d.status === 'Approved');

    updateProjectInStore(project.id, {
      deliverables: updatedDeliverables,
      status: isAllApproved ? 'Customer Review' : 'Internal Quality Review'
    }, { actor: 'Admin QA', role: 'Admin' });

    if (onUpdate) onUpdate();
  };

  const handleCustomerAction = (action) => {
    const now = new Date().toISOString();
    const currentVersion = (project.versionHistory?.length || 1);

    if (action === 'approve') {
      const updatedDeliverables = deliverables.map(d => ({ ...d, status: 'Approved', updatedAt: now }));
      const newVersionEntry = {
        version: currentVersion,
        createdAt: now,
        status: 'Approved by Customer',
        notes: revisionNote || 'Customer approved final deliverables.',
        submittedBy: 'Customer'
      };

      updateProjectInStore(project.id, {
        deliverables: updatedDeliverables,
        status: 'Approved by Customer',
        versionHistory: [newVersionEntry, ...versionHistory]
      }, { actor: 'Customer', role: 'Customer' });

      setRevisionNote('');
      if (onUpdate) onUpdate();
    } else if (action === 'revision') {
      if (!revisionNote.trim()) {
        alert('Please enter a revision request note explaining what changes are needed.');
        return;
      }

      const nextVersion = currentVersion + 1;
      const newVersionEntry = {
        version: nextVersion,
        createdAt: now,
        status: 'Revision Requested',
        notes: revisionNote.trim(),
        submittedBy: 'Customer'
      };

      const updatedDeliverables = deliverables.map(d => ({ ...d, status: d.status === 'Approved' ? 'Approved' : 'Pending', version: nextVersion }));

      updateProjectInStore(project.id, {
        deliverables: updatedDeliverables,
        status: 'Revision Requested',
        versionHistory: [newVersionEntry, ...versionHistory]
      }, { actor: 'Customer', role: 'Customer' });

      setRevisionNote('');
      alert(`Revision requested! Version ${nextVersion} created for production team.`);
      if (onUpdate) onUpdate();
    }
  };

  return (
    <div className="deliverables-manager-card">
      <div className="deliverables-header flex-between">
        <div>
          <h3>📦 Project Deliverables &amp; Review System</h3>
          <p className="deliverables-sub">
            {role === 'Creator' && 'Upload completed video masters, raw footage, and source assets for QA.'}
            {role === 'Customer' && 'Review uploaded deliverables, download assets, approve work, or request revisions.'}
            {role === 'Admin' && 'Review creator uploads, verify asset quality, and manage customer review cycles.'}
          </p>
        </div>
        <div className="deliverables-tabs-pills">
          <button className={`tab-pill ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
            Deliverable Files ({deliverables.length})
          </button>
          <button className={`tab-pill ${activeTab === 'versions' ? 'active' : ''}`} onClick={() => setActiveTab('versions')}>
            Version History (v{versionHistory.length || 1})
          </button>
        </div>
      </div>

      {activeTab === 'items' && (
        <div className="deliverables-grid margin-top-16">
          {deliverables.map(item => {
            const isDone = item.status === 'Approved';
            const isUploaded = item.status === 'Uploaded';

            return (
              <div key={item.id} className={`deliverable-item-card status-${(item.status || 'pending').toLowerCase()}`}>
                <div className="deliv-card-top flex-between">
                  <span className="deliv-category">{item.category}</span>
                  <span className={`deliv-status-chip tag-${item.status?.toLowerCase()}`}>
                    {item.status === 'Approved' && <CheckCircle2 size={12} />}
                    {item.status === 'Uploaded' && <Clock size={12} />}
                    {item.status === 'Pending' && <RefreshCw size={12} />}
                    {item.status}
                  </span>
                </div>

                <h4 className="deliv-name">{item.name}</h4>
                <div className="deliv-meta">Version: <strong>v{item.version || 1}</strong> · Last updated: {new Date(item.updatedAt || Date.now()).toLocaleDateString()}</div>

                {item.url ? (
                  <div className="deliv-url-box margin-top-12">
                    <a href={item.url} target="_blank" rel="noreferrer" className="deliv-download-link">
                      <Download size={14} /> Download Asset
                    </a>
                  </div>
                ) : (
                  <div className="deliv-no-file margin-top-12">No file uploaded yet</div>
                )}

                <div className="deliv-actions margin-top-12">
                  {role === 'Creator' && item.status !== 'Approved' && (
                    <button className="admin-primary-btn micro-btn" onClick={() => setUploadModalItem(item)}>
                      <Upload size={14} /> Upload Deliverable
                    </button>
                  )}

                  {role === 'Admin' && isUploaded && (
                    <button className="admin-primary-btn micro-btn" onClick={() => handleAdminApproveDeliverable(item.id)}>
                      <CheckCircle2 size={14} /> Approve for Customer
                    </button>
                  )}

                  {role === 'Customer' && isUploaded && (
                    <a href={item.url} target="_blank" rel="noreferrer" className="duolingo-secondary-btn micro-btn">
                      <Download size={14} /> Review Asset
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="version-history-list margin-top-16">
          {versionHistory.map((v, i) => (
            <div key={i} className="version-card-row">
              <div className="version-badge">Version {v.version}</div>
              <div className="version-info">
                <div className="version-status flex-between">
                  <span className="font-semibold text-white">{v.status}</span>
                  <span className="version-time">{new Date(v.createdAt).toLocaleString()}</span>
                </div>
                <div className="version-notes">{v.notes}</div>
                <div className="version-actor">Submitted by: {v.submittedBy}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Action Bar */}
      {role === 'Customer' && (
        <div className="customer-review-action-box margin-top-24">
          <h4><MessageSquare size={16} /> Customer Deliverable Review &amp; Approval</h4>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 12px 0' }}>
            Review all uploaded deliverables above. You can approve the deliverables to mark the project complete, or request targeted revisions.
          </p>

          <div className="admin-field-group">
            <label className="admin-field-label">Revision Request / Approval Comments</label>
            <textarea
              className="admin-field-input"
              rows={3}
              placeholder="Describe any requested changes (e.g. adjust audio level at 0:15, swap logo graphic)..."
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
            />
          </div>

          <div className="flex-end-gap margin-top-12">
            <button className="duolingo-secondary-btn" onClick={() => handleCustomerAction('revision')}>
              <RefreshCw size={15} /> Request Changes (Create Version {(versionHistory.length || 1) + 1})
            </button>
            <button className="admin-primary-btn" onClick={() => handleCustomerAction('approve')}>
              <CheckCircle2 size={15} /> Approve All Deliverables &amp; Mark Complete
            </button>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {uploadModalItem && (
        <div className="admin-modal-overlay" onClick={() => setUploadModalItem(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">📤 Upload Asset: {uploadModalItem.name}</h3>

            <form onSubmit={handleUploadDeliverable} className="margin-top-16">
              <div className="admin-field-group">
                <label className="admin-field-label">Deliverable Asset URL / Cloud Link</label>
                <input
                  type="url"
                  className="admin-field-input"
                  placeholder="https://drive.google.com/file/... or Vimeo / Cloudinary URL"
                  value={fileUrlInput}
                  onChange={e => setFileUrlInput(e.target.value)}
                  required
                />
              </div>

              <div className="margin-top-20 flex-end-gap">
                <button type="button" className="duolingo-secondary-btn" onClick={() => setUploadModalItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  Submit Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliverablesManager;
