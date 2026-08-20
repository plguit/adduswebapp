import React, { useState, useEffect } from 'react';
import {
  UserCheck, Video, Camera, Palette, Code, PenTool, Megaphone,
  Plus, CheckCircle, Search, Star, Award, MapPin, DollarSign, XCircle
} from 'lucide-react';
import { getAllProjectsAcrossUsers, updateProjectInStore, PROJECT_LIFECYCLE_STAGES } from '../../../../shared/hooks/useProjectStore.js';
import { adminApiService } from '../services/adminApiService.js';

const CREATOR_ROLES = [
  { id: 'videographer', label: 'Videographer', icon: Video, color: '#818CF8' },
  { id: 'photographer', label: 'Photographer', icon: Camera, color: '#F59E0B' },
  { id: 'designer', label: 'Designer', icon: Palette, color: '#EC4899' },
  { id: 'developer', label: 'Developer', icon: Code, color: '#10B981' },
  { id: 'writer', label: 'Writer', icon: PenTool, color: '#A855F7' },
  { id: 'marketing', label: 'Marketing Partner', icon: Megaphone, color: '#3B82F6' }
];

export function CreatorAssignmentTab({ dataSource = 'localStorage', adminReady = false }) {
  const [projects, setProjects] = useState([]);
  const [creators] = useState([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [assignModalProject, setAssignModalProject] = useState(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState('');

  const refresh = async () => {
    try {
      if (dataSource === 'backend' && adminReady) {
        const res = await adminApiService.getProjects();
        setProjects(res.projects || []);
      } else {
        setProjects(getAllProjectsAcrossUsers());
      }
    } catch (e) {
      console.warn('[CreatorAssignmentTab] backend load failed, falling back to localStorage:', e.message);
      setProjects(getAllProjectsAcrossUsers());
    }
  };

  useEffect(() => {
    refresh();
  }, [dataSource, adminReady]);

  const handleAssignCreator = (proj, creator) => {
    const creatorObj = {
      creatorId: creator.creatorId,
      name: creator.name,
      role: creator.role,
      skills: creator.skills,
      rating: creator.rating,
      payout: creator.payout || 'Pending',
      assignedAt: new Date().toISOString()
    };

    updateProjectInStore(proj.id, {
      assignedCreator: creatorObj,
      creatorId: creator.creatorId,
      status: 'In Production'
    }, { actor: 'Admin Lead', role: 'Admin' });

    setAssignModalProject(null);
    setSelectedCreatorId('');
    refresh();
  };

  const handleRemoveCreator = (proj) => {
    updateProjectInStore(proj.id, {
      assignedCreator: null,
      creatorId: null,
      status: 'Creator Assignment'
    }, { actor: 'Admin Lead', role: 'Admin' });
    refresh();
  };

  const filteredCreators = creators.filter(c => selectedRoleFilter === 'All' || c.role === selectedRoleFilter);

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Smart Creator Matching &amp; Work Allocation Engine</h2>
          <p className="admin-section-sub">Match verified creators to active client projects based on Industry, Availability, Location, Budget, Skills, Rating, and Completed Projects.</p>
        </div>
        <span className="admin-count-chip">{creators.length} Verified Creators</span>
      </div>

      {/* Creator Roles Grid */}
      <div className="admin-roles-grid margin-top-16">
        {CREATOR_ROLES.map(role => {
          const IconComp = role.icon;
          const roleCreators = creators.filter(c => c.role === role.label);
          return (
            <div
              key={role.id}
              className={`role-stat-card ${selectedRoleFilter === role.label ? 'role-selected' : ''}`}
              onClick={() => setSelectedRoleFilter(selectedRoleFilter === role.label ? 'All' : role.label)}
            >
              <div className="role-icon-wrap" style={{ color: role.color, background: `${role.color}18` }}>
                <IconComp size={20} />
              </div>
              <div className="role-info">
                <h4>{role.label}</h4>
                <p>{roleCreators.length} Available</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Projects & Assigned Creators List */}
      <div className="admin-card-box margin-top-24">
        <div className="card-box-header">
          <h3><UserCheck size={18} className="inline-icon" /> Active Projects Work Allocation</h3>
        </div>

        <div className="admin-table-wrap margin-top-12">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project ID</th>
                <th>Service &amp; Budget</th>
                <th>Assigned Creator</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={5} className="admin-empty-row">No active projects found.</td></tr>
              ) : projects.map(p => {
                const assigned = p.assignedCreator;

                return (
                  <tr key={p.id}>
                    <td><strong className="td-primary-text">{p.id}</strong></td>
                    <td>
                      <div className="font-semibold text-white">{p.service || 'Video Deliverable'}</div>
                      <div className="td-sub-text">{p.budget}</div>
                    </td>
                    <td>
                      {assigned ? (
                        <div className="flex-center-gap">
                          <span className="id-badge-pill creator-id-pill">★ {assigned.rating} {assigned.name}</span>
                          <span className="text-muted text-xs">({assigned.role})</span>
                        </div>
                      ) : (
                        <span className="text-muted italic">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-indigo">{p.status || 'Submitted'}</span>
                    </td>
                    <td>
                      {assigned ? (
                        <div className="flex-center-gap">
                          <button
                            type="button"
                            className="duolingo-secondary-btn micro-btn"
                            onClick={() => setAssignModalProject(p)}
                          >
                            Change Creator
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn text-danger"
                            onClick={() => handleRemoveCreator(p)}
                            title="Remove Assigned Creator"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="admin-primary-btn micro-btn"
                          onClick={() => setAssignModalProject(p)}
                        >
                          <Plus size={14} /> Assign Creator
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Suggested Creator Matching Modal */}
      {assignModalProject && (
        <div className="admin-modal-overlay" onClick={() => setAssignModalProject(null)}>
          <div className="admin-modal-content large-ops-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top-header flex-between">
              <div>
                <h3 className="modal-title">🎯 Smart Creator Recommendation for {assignModalProject.id}</h3>
                <span className="text-muted text-xs">Service: {assignModalProject.service} · Budget: {assignModalProject.budget}</span>
              </div>
              <button className="duolingo-secondary-btn micro-btn" onClick={() => setAssignModalProject(null)}>Close</button>
            </div>

            <div className="suggested-creators-banner margin-top-12">
              <Star size={16} className="text-highlight" />
              <span><strong>Suggested Creators (Ranked ★★★★★):</strong> Ranked automatically based on Industry, Availability, Location, Budget tier, Skills match, and Past Completed Projects score.</span>
            </div>

            <div className="creator-recommendation-list margin-top-16">
              {filteredCreators.map((c, idx) => (
                <div key={c.id} className="creator-matching-card flex-between margin-bottom-12">
                  <div className="cm-left flex-center-gap">
                    <div className="cm-rank-badge">#{idx + 1}</div>
                    <div>
                      <div className="cm-name flex-center-gap">
                        <strong className="text-white">{c.name}</strong>
                        <span className="creator-role-tag">{c.role}</span>
                        <span className="rating-tag">★ {c.rating}</span>
                      </div>
                      <div className="cm-details text-muted text-xs margin-top-4 flex-center-gap">
                        <span><Award size={12} /> {c.completedProjects} Projects Completed</span>
                        <span><MapPin size={12} /> {c.location}</span>
                        <span><DollarSign size={12} /> {c.budgetTier}</span>
                      </div>
                      <div className="cm-skills margin-top-4 text-xs text-indigo">Skills: {c.skills}</div>
                    </div>
                  </div>

                  <div className="cm-right">
                    <button
                      className="admin-primary-btn micro-btn"
                      onClick={() => handleAssignCreator(assignModalProject, c)}
                    >
                      Assign {c.name.split(' ')[0]} to Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorAssignmentTab;
