import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Clock, Calendar, DollarSign, FileEdit } from 'lucide-react';
import { getAllProjectsAcrossUsers, updateProjectInStore } from '../../../../shared/hooks/useProjectStore.js';
import { profileService } from '../../../../shared/services/profileService.js';
import { NotificationEngine } from '../../../../src/services/brain/UniversalNotificationEngine.js';

/**
 * ApprovalsTab — Real Revision & Change Requests
 * Reads actual project-level revision requests and scope change requests.
 * No demo/hardcoded project names.
 */
export function ApprovalsTab({ dataSource = 'localStorage', adminReady = false }) {
  const [filter, setFilter] = useState('all');
  const [requests, setRequests] = useState([]);

  const loadRequests = () => {
    const allProjects = getAllProjectsAcrossUsers();
    const profiles = profileService.getAllProfiles();

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId] = p; });

    const built = [];
    allProjects.forEach(proj => {
      // Each revision or change request stored in project.revisionRequests[]
      const revisions = proj.revisionRequests || [];
      revisions.forEach(rev => {
        const profile = profileMap[proj.userId] || {};
        const brain = profile.businessBrain || {};
        built.push({
          id: rev.id,
          projectId: proj.id,
          projectName: proj.service || proj.title || proj.id,
          customerName: brain.businessName || profile.name || proj.userId,
          customerId: proj.userId,
          type: rev.type || 'Change Request',
          requestedBy: 'Client',
          date: rev.requestedAt ? new Date(rev.requestedAt).toLocaleDateString('en-IN') : '—',
          details: rev.details || rev.notes || '',
          impact: rev.impact || { timeline: 'TBD', budget: 'TBD' },
          status: rev.status || 'pending'
        });
      });
    });

    setRequests(built);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = (id, newStatus, projectId) => {
    const allProjects = getAllProjectsAcrossUsers();
    const proj = allProjects.find(p => p.id === projectId);
    if (proj) {
      const updatedRevisions = (proj.revisionRequests || []).map(r =>
        r.id === id ? { ...r, status: newStatus, resolvedAt: new Date().toISOString() } : r
      );
      updateProjectInStore(projectId, { revisionRequests: updatedRevisions });

      // Notify customer
      const profile = profileService.getProfileById(proj.userId);
      if (profile) {
        NotificationEngine.notify({
          userId: proj.userId,
          role: 'Customer',
          type: newStatus === 'approved' ? 'revision_approved' : 'revision_rejected',
          title: newStatus === 'approved' ? 'Change Request Approved' : 'Change Request Rejected',
          message: `Your change request for project "${proj.service || proj.id}" has been ${newStatus}.`,
          priority: 'high'
        });
      }
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const filteredRequests = requests.filter(r => filter === 'all' ? true : r.status === filter);

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">Approvals & Revision Requests Queue</h2>
          <p className="tab-pane-subtitle">Customer scope updates, timeline shifts, and deliverable changes from active projects.</p>
        </div>
        <div className="tab-filter-pills">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} className={`filter-pill ${filter === f ? 'pill-active' : ''}`} onClick={() => setFilter(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="approvals-grid margin-top-20">
        {filteredRequests.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', gridColumn: '1/-1' }}>
            {requests.length === 0
              ? 'No revision requests yet. Customer change requests will appear here when submitted from their project dashboard.'
              : 'No requests match the current filter.'}
          </div>
        ) : filteredRequests.map(req => (
          <div key={req.id} className={`approval-card approval-status-${req.status}`}>
            <div className="approval-card-header">
              <div className="approval-id-badge"><FileEdit size={14} /> {req.id}</div>
              <span className={`status-tag tag-${req.status}`}>
                {req.status === 'pending' && <Clock size={12} />}
                {req.status === 'approved' && <CheckCircle2 size={12} />}
                {req.status === 'rejected' && <XCircle size={12} />}
                {req.status.toUpperCase()}
              </span>
            </div>

            <h3 className="approval-proj-title">{req.projectName}</h3>
            <span className="approval-client-name">Client: {req.customerName}</span>

            <div className="approval-request-type margin-top-10">
              <span className="type-label">Request Type:</span>
              <span className="type-val">{req.type}</span>
            </div>

            <p className="approval-details-text">{req.details || 'No details provided.'}</p>

            <div className="approval-impact-box">
              <div className="impact-col">
                <span className="impact-label"><Calendar size={12} /> Timeline Impact</span>
                <span className="impact-val">{req.impact.timeline}</span>
              </div>
              <div className="impact-col">
                <span className="impact-label"><DollarSign size={12} /> Budget Impact</span>
                <span className="impact-val">{req.impact.budget}</span>
              </div>
            </div>

            {req.status === 'pending' && (
              <div className="approval-actions-row margin-top-16">
                <button className="btn-admin-action btn-approve" onClick={() => handleAction(req.id, 'approved', req.projectId)}>
                  <CheckCircle2 size={14} /> Accept Request
                </button>
                <button className="btn-admin-action btn-reject" onClick={() => handleAction(req.id, 'rejected', req.projectId)}>
                  <XCircle size={14} /> Reject Request
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
