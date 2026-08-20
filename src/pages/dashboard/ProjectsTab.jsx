import React, { useState } from 'react';
import { FolderKanban, Plus, Edit3, Trash2, Calendar, MapPin, DollarSign, Clock, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore.js';
import { Button } from '../../components/common/Button.jsx';

/**
 * Projects Tab & Project Editor Component
 * Displays created project drafts and allows continuing editing or submitting.
 */
export function ProjectsTab({ onCreateNew = null }) {
  const { projects, updateProject, deleteProject } = useProjectStore();
  const [editingProject, setEditingProject] = useState(null);

  // Form State for Editing Project
  const [editForm, setEditForm] = useState({
    location: '',
    budget: '',
    notes: '',
    status: 'Draft'
  });

  const handleOpenEdit = (proj) => {
    setEditingProject(proj);
    setEditForm({
      location: proj.location || '',
      budget: proj.budget || '$2,500 - $5,000',
      notes: proj.notes || '',
      status: proj.status || 'Draft'
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingProject) return;

    updateProject(editingProject.id, {
      ...editForm,
      status: editForm.status
    });

    setEditingProject(null);
  };

  const handleSubmitProject = (projId) => {
    updateProject(projId, { status: 'Submitted' });
  };

  return (
    <div className="projects-tab-viewport fade-in">
      <div className="tab-header-row flex-between">
        <div>
          <h2 className="tab-main-title">Projects</h2>
          <p className="tab-sub-title">Manage and continue editing your active project drafts.</p>
        </div>

        {onCreateNew && (
          <button className="primary-btn btn-compact" onClick={onCreateNew}>
            <Plus size={16} />
            <span>New Draft</span>
          </button>
        )}
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="empty-state-card flex-center margin-top-20">
          <FolderKanban size={40} className="empty-icon" />
          <h3 className="empty-title">You don't have any projects yet.</h3>
          <p className="empty-state-text">Ask ADDI or select a Quick Action to create a new project draft.</p>
        </div>
      ) : (
        <div className="projects-grid margin-top-20">
          {projects.map((proj) => (
            <div key={proj.id} className="project-card-item fade-in">
              <div className="proj-card-top flex-between">
                <span className={`status-badge ${proj.status === 'Submitted' ? 'badge-submitted' : 'badge-draft'}`}>
                  {proj.status}
                </span>
                <span className="proj-date">{proj.createdAt}</span>
              </div>

              <h3 className="proj-service-title">{proj.service}</h3>
              <p className="proj-type-subtitle">{proj.type}</p>

              <div className="proj-details-meta">
                <div className="meta-item">
                  <MapPin size={13} /> <span>{proj.location || 'Location Pending'}</span>
                </div>
                <div className="meta-item">
                  <DollarSign size={13} /> <span>{proj.budget || 'Budget Pending'}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={13} /> <span>{proj.shootDate || 'Shoot Date Pending'}</span>
                </div>
              </div>

              <div className="proj-card-actions flex-between margin-top-16">
                <button
                  type="button"
                  className="secondary-btn btn-compact"
                  onClick={() => handleOpenEdit(proj)}
                >
                  <Edit3 size={14} />
                  <span>Continue Editing</span>
                </button>

                {proj.status === 'Draft' ? (
                  <button
                    type="button"
                    className="submit-draft-btn flex-center"
                    onClick={() => handleSubmitProject(proj.id)}
                  >
                    <span>Submit</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <span className="submitted-check flex-center">
                    <CheckCircle2 size={14} /> Submitted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- EDIT PROJECT MODAL --- */}
      {editingProject && (
        <div className="modal-backdrop flex-center fade-in">
          <div className="modal-card-box fade-in">
            <div className="modal-header flex-between">
              <div>
                <h3 className="modal-title">Edit Project Draft</h3>
                <p className="modal-sub">{editingProject.service} ({editingProject.type})</p>
              </div>
              <button className="icon-btn-ghost" onClick={() => setEditingProject(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-field">
                <label className="field-label">Location / Setting:</label>
                <input
                  type="text"
                  className="phone-input field-input"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g. Resort Studio, On-site..."
                />
              </div>

              <div className="form-field">
                <label className="field-label">Estimated Budget:</label>
                <select
                  className="phone-input field-input"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                >
                  <option value="< $2,500">&lt; $2,500</option>
                  <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                  <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                  <option value="$10,000+">$10,000+</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Project Notes:</label>
                <textarea
                  className="explain-textarea"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Additional style requirements or guidelines..."
                  rows={3}
                />
              </div>

              <div className="modal-actions flex-between margin-top-20">
                <button
                  type="button"
                  className="danger-btn flex-center"
                  onClick={() => {
                    deleteProject(editingProject.id);
                    setEditingProject(null);
                  }}
                >
                  <Trash2 size={14} /> Delete Draft
                </button>

                <Button type="submit" fullWidth={false}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
