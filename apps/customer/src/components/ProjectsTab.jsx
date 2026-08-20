import React, { useState } from 'react';
import { Plus, FolderKanban, Clock, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { useProjectStore, getServiceScheduleType } from '../../../../shared/hooks/useProjectStore.js';
import { ProjectTimeline } from '../../../../src/components/operations/ProjectTimeline.jsx';
import { DeliverablesManager } from '../../../../src/components/operations/DeliverablesManager.jsx';
import { ProjectFolders } from '../../../../src/components/operations/ProjectFolders.jsx';

export function ProjectsTab({ onCreateNew, defaultFilter = 'All' }) {
  const { projects, reloadProjects } = useProjectStore();
  const [filter, setFilter] = useState(defaultFilter);
  const [selectedProject, setSelectedProject] = useState(null);

  const filtered = projects.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Planning') return ['Draft', 'Submitted', 'Under Review', 'Strategy Preparation', 'Waiting for Customer Approval'].includes(p.status);
    if (filter === 'In Progress') return ['Approved', 'Creator Assignment', 'In Production', 'Internal Quality Review', 'Customer Review', 'Revision Requested', 'Revision in Progress'].includes(p.status);
    if (filter === 'Completed') return ['Approved by Customer', 'Delivered', 'Archived'].includes(p.status);
    if (filter === 'Reviews') return ['Customer Review', 'Waiting for Customer Approval'].includes(p.status);
    return p.status === filter;
  });

  const renderSchedule = (p) => {
    const services = p.selectedServices && p.selectedServices.length > 0 
      ? p.selectedServices 
      : [p.service || 'Video Production'];

    return services.map(sName => {
      const type = getServiceScheduleType(sName);
      const isShoot = type === 'SHOOT_DATE_REQUEST';
      const req = p.scheduleRequests?.[sName] || {};
      const preferred = req.preferredDate || (isShoot ? p.shootDate : p.deliveryDate);
      if (!preferred) return null;
      
      let formatted = preferred;
      try {
        formatted = new Date(preferred).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } catch (err) {
        // fallback
      }

      return (
        <span className="ws-meta-chip" key={sName}>
          <Calendar size={12} /> {sName} ({isShoot ? 'Shoot' : 'Delivery'}): {formatted}
        </span>
      );
    });
  };

  return (
    <div className="dashboard-content-container" style={{ paddingTop: '20px' }}>
      <div className="flex-between margin-bottom-16">
        <h2 className="section-title" style={{ fontSize: '20px', margin: 0 }}>My Projects (Operations Engine)</h2>
        <button className="primary-btn btn-compact" onClick={onCreateNew}>
          <Plus size={14} /> New Project
        </button>
      </div>

      <div className="auth-tabs margin-bottom-16" style={{ width: 'fit-content' }}>
        {['All', 'Planning', 'In Progress', 'Completed', 'Reviews'].map(f => (
          <button key={f} className={`auth-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-card flex-center" style={{ padding: '40px 20px' }}>
          <FolderKanban size={32} className="empty-icon" />
          <p className="empty-state-text">No projects in "{filter}".</p>
        </div>
      ) : (
        <div className="projects-list-grid flex-col gap-12">
          {filtered.map(p => (
            <div key={p.id} className="project-status-workspace-card" onClick={() => setSelectedProject(p)} style={{ cursor: 'pointer' }}>
              <div className="ws-project-id flex-between">
                <span>{p.id}</span>
                <span className="create-new-link micro-btn flex-center">
                  Open Project <ChevronRight size={14} />
                </span>
              </div>
              <h3 className="ws-project-title">{p.service}</h3>
              <div className="ws-meta-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
                <span className="ws-meta-chip"><span style={{ color: '#34d399', fontWeight: 700 }}>●</span> {p.status || 'Submitted'}</span>
                {renderSchedule(p)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Project Details Workspace Modal */}
      {selectedProject && (
        <div className="admin-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="admin-modal-content large-ops-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top-header flex-between">
              <div>
                <h3 className="modal-title">🎬 Project Details: {selectedProject.id}</h3>
                <span className="text-muted text-xs">Service: {selectedProject.service} · Status: <strong>{selectedProject.status}</strong></span>
              </div>
              <button className="duolingo-secondary-btn micro-btn" onClick={() => setSelectedProject(null)}>Close Workspace</button>
            </div>

            <div className="margin-top-16">
              <ProjectTimeline project={selectedProject} />
            </div>

            <div className="margin-top-16">
              <DeliverablesManager project={selectedProject} role="Customer" onUpdate={reloadProjects} />
            </div>

            <div className="margin-top-16">
              <ProjectFolders project={selectedProject} role="Customer" onUpdate={reloadProjects} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsTab;
