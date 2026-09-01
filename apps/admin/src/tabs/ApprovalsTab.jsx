import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Clock, Calendar, 
  DollarSign, FileEdit, Search, Sparkles, Filter, RefreshCw, Check, X
} from 'lucide-react';
import { getAllProjectsAcrossUsers, updateProjectInStore } from '../../../../shared/hooks/useProjectStore.js';
import { profileService } from '../../../../shared/services/profileService.js';
import { syncService } from '../../../../src/services/syncService.js';
import { NotificationEngine } from '../../../../src/services/brain/UniversalNotificationEngine.js';

/**
 * ApprovalsTab — Enterprise Approvals & Revision Requests Queue
 * Reads actual customer revision requests, ADDI chat scope requests, and schedule changes.
 * Real-time action triggers update projects, customer chat histories, and notifications.
 */
export function ApprovalsTab({ dataSource = 'localStorage', adminReady = false }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState([]);

  const loadRequests = useCallback(() => {
    const allProjects = getAllProjectsAcrossUsers() || [];
    const profiles = profileService.getAllProfiles() || [];

    const profileMap = {};
    profiles.forEach(p => { 
      const key = p.userId || p.customerId || (p.phoneNumber ? p.phoneNumber.slice(-10) : null);
      if (key) profileMap[key] = p;
    });

    const built = [];
    const seenIds = new Set();

    const formatDateWithTime = (ts) => {
      if (!ts) return 'Recently';
      const d = new Date(ts);
      return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // 1. Ingest from all projects revisionRequests
    allProjects.forEach(proj => {
      const revisions = proj.revisionRequests || [];
      revisions.forEach(rev => {
        if (!rev || !rev.id || seenIds.has(rev.id)) return;
        seenIds.add(rev.id);

        const profile = profileMap[proj.userId] || profileMap[proj.customerId] || {};
        const brain = profile.businessBrain || {};
        built.push({
          id: rev.id,
          projectId: proj.id,
          projectName: proj.service || proj.title || proj.id,
          customerName: brain.businessName || profile.name || proj.userId || 'Customer',
          customerId: proj.userId || proj.customerId,
          type: rev.type || 'Scope Change Request',
          requestedBy: rev.requestedBy || 'Customer',
          date: formatDateWithTime(rev.requestedAt),
          rawDate: rev.requestedAt ? new Date(rev.requestedAt).getTime() : Date.now(),
          details: rev.details || rev.notes || rev.requestText || '',
          impact: rev.impact || { timeline: '+2-3 Days', budget: 'Standard' },
          status: rev.status || 'pending'
        });
      });
    });

    // 2. Ingest from profile revisionRequests
    profiles.forEach(prof => {
      const profRevs = prof.revisionRequests || [];
      profRevs.forEach(rev => {
        if (!rev || !rev.id || seenIds.has(rev.id)) return;
        seenIds.add(rev.id);

        const brain = prof.businessBrain || {};
        built.push({
          id: rev.id,
          projectId: rev.projectId || `proj_${prof.userId}`,
          projectName: rev.projectName || 'Creative Project',
          customerName: brain.businessName || prof.name || prof.userId || 'Customer',
          customerId: prof.userId || prof.customerId,
          type: rev.type || 'Scope Change Request',
          requestedBy: rev.requestedBy || 'Customer',
          date: formatDateWithTime(rev.requestedAt),
          rawDate: rev.requestedAt ? new Date(rev.requestedAt).getTime() : Date.now(),
          details: rev.details || rev.notes || rev.requestText || '',
          impact: rev.impact || { timeline: '+2-3 Days', budget: 'Standard' },
          status: rev.status || 'pending'
        });
      });
    });

    // 3. Ingest from ADDI Chat action popup queue
    try {
      const popupQueue = JSON.parse(localStorage.getItem('ADDUS_ADMIN_POPUP_QUEUE') || '[]');
      popupQueue.forEach(action => {
        if (!action || !action.id || seenIds.has(action.id)) return;
        seenIds.add(action.id);

        built.push({
          id: action.id,
          projectId: action.projectId || 'proj_active',
          projectName: action.businessName ? `${action.businessName} Campaign` : 'Active Project',
          customerName: action.businessName || action.customerName || 'Customer',
          customerId: action.customerId || 'customer_7907963442',
          type: action.intent || 'Change Request',
          requestedBy: action.customerName || 'Customer',
          date: formatDateWithTime(action.timestamp),
          rawDate: action.timestamp ? new Date(action.timestamp).getTime() : Date.now(),
          details: action.requestText || action.details || '',
          impact: {
            timeline: (action.intent || '').includes('Date') ? 'Date Reschedule' : '+2-3 Days',
            budget: (action.intent || '').includes('Budget') ? 'Price Adjustment' : ((action.intent || '').includes('Drone') ? 'Add-on Estimate' : 'Standard')
          },
          status: action.status || 'pending'
        });
      });
    } catch {}

    // 4. Default Interactive Seeding if empty
    if (built.length === 0) {
      const defaultRequests = [
        {
          id: 'rev_101',
          projectId: 'proj_la_estuaire_1',
          projectName: 'Commercial Video Production',
          customerName: 'La Estuaire Cherai',
          customerId: 'customer_7907963442',
          type: 'Change Shoot Date',
          requestedBy: 'Client',
          date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          details: 'Client requested to reschedule the resort aerial video shoot to next Saturday morning for optimal sunlight and golden hour footage.',
          impact: { timeline: 'Rescheduled +5 Days', budget: 'No Extra Cost' },
          status: 'pending'
        },
        {
          id: 'rev_102',
          projectId: 'proj_la_estuaire_1',
          projectName: 'Commercial Video Production',
          customerName: 'La Estuaire Cherai',
          customerId: 'customer_7907963442',
          type: 'Add Drone Footage',
          requestedBy: 'Client',
          date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          details: 'Add 4K FPV Drone visuals for waterfront and luxury villa coverage to include in social media teaser reels.',
          impact: { timeline: 'Included in shoot day', budget: '+₹8,500 (Equipment add-on)' },
          status: 'pending'
        },
        {
          id: 'rev_103',
          projectId: 'proj_103',
          projectName: 'Brand Identity & Packaging',
          customerName: 'Artisan Cafe & Bakery',
          customerId: 'customer_9876543210',
          type: 'Packaging Scope Update',
          requestedBy: 'Client',
          date: new Date(Date.now() - 86400000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          details: 'Client requested additional dieline export for bio-degradable coffee cups and branded takeaway pastry sleeves.',
          impact: { timeline: '+2 Days Proofing', budget: '+₹4,000' },
          status: 'approved'
        }
      ];
      setRequests(defaultRequests);
      return;
    }

    built.sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
    setRequests(built);
  }, []);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 3000);
    window.addEventListener('addus_approvals_updated', loadRequests);
    window.addEventListener('addus_chat_updated', loadRequests);
    window.addEventListener('addus_profile_updated', loadRequests);

    return () => {
      clearInterval(interval);
      window.removeEventListener('addus_approvals_updated', loadRequests);
      window.removeEventListener('addus_chat_updated', loadRequests);
      window.removeEventListener('addus_profile_updated', loadRequests);
    };
  }, [loadRequests]);

  const handleAction = (id, newStatus, projectId, customerId, typeName) => {
    // 1. Update Project Store
    const allProjects = getAllProjectsAcrossUsers();
    const proj = allProjects.find(p => p.id === projectId || p.userId === customerId);
    if (proj) {
      const updatedRevisions = (proj.revisionRequests || []).map(r =>
        r.id === id ? { ...r, status: newStatus, resolvedAt: new Date().toISOString() } : r
      );
      updateProjectInStore(proj.id, { revisionRequests: updatedRevisions });
    }

    // 2. Update Customer Profile and Chat History
    const targetUserId = customerId || proj?.userId;
    if (targetUserId) {
      const prof = profileService.getProfileById(targetUserId) ||
        (profileService.getAllProfiles() || []).find(p => p.userId === targetUserId || p.customerId === targetUserId || (p.phoneNumber && targetUserId.includes(p.phoneNumber.slice(-10))));

      if (prof) {
        const profRevs = (prof.revisionRequests || []).map(r =>
          r.id === id ? { ...r, status: newStatus, resolvedAt: new Date().toISOString() } : r
        );

        const chat = prof.chatHistory || [];
        const statusIcon = newStatus === 'approved' ? '✅' : '❌';
        const actionMsg = newStatus === 'approved' 
          ? `Great news! Your request regarding "${typeName || 'Change Request'}" has been approved by the ADDUS Operations Team. Our creative leads are applying the updates to your project roadmap now.`
          : `Your request regarding "${typeName || 'Change Request'}" was reviewed by our team. At this stage, it cannot be accommodated within the current production schedule without scope conflict. Please message us if you'd like to discuss alternative adjustments.`;

        const updatedChat = [...chat, {
          id: `msg_action_${Date.now()}`,
          sender: 'admin',
          role: 'admin',
          senderName: 'ADDUS Ops Team',
          text: `${statusIcon} ${actionMsg}`,
          timestamp: new Date().toISOString()
        }];

        const notifs = prof.notifications || [];
        notifs.unshift({
          id: `notif_${Date.now()}`,
          title: newStatus === 'approved' ? 'Request Approved' : 'Request Reviewed',
          message: actionMsg.slice(0, 90) + '...',
          read: false,
          createdAt: new Date().toISOString()
        });

        const updated = profileService.saveProfile({
          ...prof,
          revisionRequests: profRevs,
          chatHistory: updatedChat,
          notifications: notifs
        });
        syncService.syncProfile(prof.userId || targetUserId, updated);
      }
    }

    // 3. Update local popup queue
    try {
      const popupQueue = JSON.parse(localStorage.getItem('ADDUS_ADMIN_POPUP_QUEUE') || '[]');
      const updatedQueue = popupQueue.map(q => q.id === id ? { ...q, status: newStatus } : q);
      localStorage.setItem('ADDUS_ADMIN_POPUP_QUEUE', JSON.stringify(updatedQueue));
    } catch {}

    // 4. Notify Customer Engine
    if (targetUserId) {
      NotificationEngine.notify({
        userId: targetUserId,
        role: 'Customer',
        type: newStatus === 'approved' ? 'revision_approved' : 'revision_rejected',
        title: newStatus === 'approved' ? 'Change Request Approved' : 'Change Request Rejected',
        message: `Your request for "${typeName || 'Project'}" has been ${newStatus}.`,
        priority: 'high'
      });
    }

    // 5. Optimistic State Update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

    // 6. Broadcast Events
    window.dispatchEvent(new CustomEvent('addus_chat_updated'));
    window.dispatchEvent(new CustomEvent('addus_profile_updated'));
    window.dispatchEvent(new CustomEvent('addus_approvals_updated'));
  };

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' ? true : r.status === filter;
    const matchesSearch = !searchQuery.trim() || 
      (r.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.details || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="tab-pane-container fade-in" style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div className="tab-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="tab-pane-title" style={{ fontSize: '24px', fontWeight: '800', color: '#FFF', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Approvals &amp; Revision Requests Queue
          </h2>
          <p className="tab-pane-subtitle" style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
            Customer scope updates, timeline shifts, and deliverable changes from active projects.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="tab-filter-pills">
          {[
            { id: 'all', label: `ALL (${totalCount})` },
            { id: 'pending', label: `PENDING (${pendingCount})` },
            { id: 'approved', label: `APPROVED (${approvedCount})` },
            { id: 'rejected', label: `REJECTED (${rejectedCount})` }
          ].map(f => (
            <button 
              key={f.id} 
              className={`filter-pill ${filter === f.id ? 'pill-active' : ''}`} 
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
          <input
            type="text"
            placeholder="Search by client, project, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#151520',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '10px 14px 10px 38px',
              color: '#FFF',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <button 
          onClick={loadRequests}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {/* Approvals Cards Grid */}
      <div className="approvals-grid">
        {filteredRequests.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', gridColumn: '1/-1', background: '#151520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <FileEdit size={36} color="#6B7280" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ color: '#FFF', fontSize: '16px', margin: '0 0 6px 0' }}>No Requests Match Filter</h4>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              {requests.length === 0
                ? 'No revision requests yet. Customer change requests will appear here when submitted from their dashboard.'
                : 'Try adjusting your search or switching filter categories.'}
            </p>
          </div>
        ) : filteredRequests.map(req => (
          <div key={req.id} className={`approval-card approval-status-${req.status}`}>
            <div className="approval-card-header">
              <div className="approval-id-badge">
                <FileEdit size={12} /> {req.id}
              </div>
              <span className={`status-tag tag-${req.status}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', background: req.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : (req.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'), color: req.status === 'pending' ? '#F59E0B' : (req.status === 'approved' ? '#10B981' : '#EF4444') }}>
                {req.status === 'pending' && <Clock size={12} />}
                {req.status === 'approved' && <CheckCircle2 size={12} />}
                {req.status === 'rejected' && <XCircle size={12} />}
                {req.status}
              </span>
            </div>

            <h3 className="approval-proj-title">{req.projectName}</h3>
            <div className="approval-client-name" style={{ marginBottom: '8px' }}>
              Client: <strong style={{ color: '#FFF' }}>{req.customerName}</strong>
              <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '6px' }}>• {req.date}</span>
            </div>

            <div className="approval-request-type margin-top-10">
              <span className="type-label">Request Type:</span>
              <span className="type-val" style={{ color: '#A78BFA' }}>{req.type}</span>
            </div>

            <p className="approval-details-text">{req.details || 'No details provided.'}</p>

            <div className="approval-impact-box">
              <div className="impact-col">
                <span className="impact-label"><Calendar size={12} /> Timeline Impact</span>
                <span className="impact-val">{req.impact?.timeline || 'TBD'}</span>
              </div>
              <div className="impact-col">
                <span className="impact-label"><DollarSign size={12} /> Budget Impact</span>
                <span className="impact-val">{req.impact?.budget || 'Standard'}</span>
              </div>
            </div>

            {req.status === 'pending' ? (
              <div className="approval-actions-row margin-top-16">
                <button 
                  className="btn-admin-action btn-approve" 
                  onClick={() => handleAction(req.id, 'approved', req.projectId, req.customerId, req.type)}
                >
                  <Check size={14} /> Accept Request
                </button>
                <button 
                  className="btn-admin-action btn-reject" 
                  onClick={() => handleAction(req.id, 'rejected', req.projectId, req.customerId, req.type)}
                >
                  <X size={14} /> Reject Request
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Status:</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: req.status === 'approved' ? '#10B981' : '#EF4444' }}>
                  {req.status === 'approved' ? '✓ Approved by Admin' : '✕ Rejected'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ApprovalsTab;
