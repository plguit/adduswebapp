import React, { useState } from 'react';
import { Folder, FileText, Upload, Plus, Download, ShieldCheck } from 'lucide-react';
import { updateProjectInStore } from '../../store/projectStore.js';

export function ProjectFolders({ project, role = 'Admin', onUpdate }) {
  const folders = project?.folders || {
    Brief: [`${project?.id || 'PRJ'}_Creative_Brief.pdf`],
    References: ['Brand_Style_Guide.pdf'],
    Uploads: [],
    Deliverables: [],
    Invoices: [`INV-${project?.id || '001'}.pdf`],
    Approvals: [],
    Assets: ['Master_Logo_Vector.svg']
  };

  const [activeFolder, setActiveFolder] = useState('Brief');
  const [newFileName, setNewFileName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const folderKeys = ['Brief', 'References', 'Uploads', 'Deliverables', 'Invoices', 'Approvals', 'Assets'];

  const handleAddFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const currentFiles = folders[activeFolder] || [];
    const updatedFolders = {
      ...folders,
      [activeFolder]: [...currentFiles, newFileName.trim()]
    };

    updateProjectInStore(project.id, { folders: updatedFolders }, { actor: role, role });
    setNewFileName('');
    setShowAddModal(false);
    if (onUpdate) onUpdate();
  };

  const activeFiles = folders[activeFolder] || [];

  return (
    <div className="project-folders-card">
      <div className="folders-header flex-between">
        <div>
          <h3>📁 Structured Project File Vault</h3>
          <p className="folders-sub">Organized asset directory linked directly to Business Vault upon archiving.</p>
        </div>
        <button className="admin-primary-btn micro-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> Add File to {activeFolder}
        </button>
      </div>

      <div className="folder-pills-row margin-top-16">
        {folderKeys.map(key => {
          const count = (folders[key] || []).length;
          return (
            <button
              key={key}
              className={`folder-pill ${activeFolder === key ? 'folder-active' : ''}`}
              onClick={() => setActiveFolder(key)}
            >
              <Folder size={14} />
              <span>{key}</span>
              <span className="folder-count-chip">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="folder-files-box margin-top-16">
        <div className="files-header">
          <span>Folder: <strong>📁 /{activeFolder}</strong></span>
          <span className="text-muted text-xs"><ShieldCheck size={12} className="inline-icon text-indigo" /> Business Vault Linked</span>
        </div>

        {activeFiles.length === 0 ? (
          <div className="files-empty-state">No files uploaded in /{activeFolder} folder yet.</div>
        ) : (
          <div className="files-grid margin-top-12">
            {activeFiles.map((file, i) => (
              <div key={i} className="file-item-card flex-between">
                <div className="file-info flex-center-gap">
                  <FileText size={16} className="text-indigo" />
                  <span className="file-title">{file}</span>
                </div>
                <button
                  className="btn-invoice-dl micro-btn"
                  onClick={() => alert(`Downloading ${file} from Business Vault storage...`)}
                >
                  <Download size={12} /> Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">📎 Add File to /{activeFolder}</h3>

            <form onSubmit={handleAddFile} className="margin-top-16">
              <div className="admin-field-group">
                <label className="admin-field-label">File Name / Asset Document</label>
                <input
                  type="text"
                  className="admin-field-input"
                  placeholder="e.g. Reference_Video_Cut.mp4 or Brand_Asset.png"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  required
                />
              </div>

              <div className="margin-top-20 flex-end-gap">
                <button type="button" className="duolingo-secondary-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  Save File Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectFolders;
