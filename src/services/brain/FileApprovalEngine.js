import { storage } from '../../utils/storage.js';
import { idGeneratorService } from '../idGeneratorService.js';

const FILES_KEY_PREFIX = 'ADDUS_FILE_VERSIONS_DB_';

/**
 * Module 4: Multi-Version File Approval System
 */
export const FileApprovalEngine = {
  getFilesForProject(projectId) {
    return storage.get(`${FILES_KEY_PREFIX}${projectId}`, []);
  },

  uploadFile({ projectId, fileName, fileType, fileUrl, uploadedBy, uploadedByRole }) {
    const assetId = idGeneratorService.getNextId('AAS');
    const files = this.getFilesForProject(projectId);

    const existingFile = files.find(f => f.fileName === fileName);
    const versionNum = existingFile ? (existingFile.versions.length + 1) : 1;

    const newVersion = {
      versionId: `${assetId}_V${versionNum}`,
      version: versionNum,
      fileUrl: fileUrl || `uploads/${fileName}`,
      uploadedBy,
      uploadedByRole,
      uploadedAt: new Date().toISOString(),
      status: 'pending_review',
      comments: [],
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      revisionNotes: null
    };

    if (existingFile) {
      const updated = files.map(f => {
        if (f.fileName === fileName) {
          return { ...f, currentVersion: versionNum, versions: [...f.versions, newVersion], status: 'pending_review' };
        }
        return f;
      });
      storage.set(`${FILES_KEY_PREFIX}${projectId}`, updated);
    } else {
      const newFileRecord = {
        assetId,
        projectId,
        fileName,
        fileType: fileType || 'video',
        currentVersion: 1,
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        versions: [newVersion]
      };
      files.unshift(newFileRecord);
      storage.set(`${FILES_KEY_PREFIX}${projectId}`, files);
    }

    return this.getFilesForProject(projectId).find(f => f.fileName === fileName);
  },

  approveFile(projectId, assetId, reviewerName) {
    const files = this.getFilesForProject(projectId);
    const updated = files.map(f => {
      if (f.assetId === assetId) {
        const newVersions = f.versions.map((v, idx) => {
          if (idx === f.versions.length - 1) {
            return { ...v, status: 'approved', approvedBy: reviewerName, approvedAt: new Date().toISOString() };
          }
          return v;
        });
        return { ...f, status: 'approved', versions: newVersions };
      }
      return f;
    });
    storage.set(`${FILES_KEY_PREFIX}${projectId}`, updated);
    return updated;
  },

  requestRevision(projectId, assetId, revisionNotes, reviewerName) {
    const files = this.getFilesForProject(projectId);
    const updated = files.map(f => {
      if (f.assetId === assetId) {
        const newVersions = f.versions.map((v, idx) => {
          if (idx === f.versions.length - 1) {
            return { ...v, status: 'revision_requested', rejectedBy: reviewerName, rejectedAt: new Date().toISOString(), revisionNotes };
          }
          return v;
        });
        return { ...f, status: 'revision_requested', versions: newVersions };
      }
      return f;
    });
    storage.set(`${FILES_KEY_PREFIX}${projectId}`, updated);
    return updated;
  }
};

export default FileApprovalEngine;
