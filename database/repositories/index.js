/**
 * Database Repositories Interface Layer — Enterprise Data Access Layer
 */

import { storage } from '../../shared/utils/storage.js';

const USERS_DB_KEY = 'USER_ACCOUNTS_DB';
const PROJECTS_KEY_PREFIX = 'PROJECTS_STORE_';
const WORKFLOWS_KEY = 'ADDUS_WORKFLOW_TEMPLATES_DB';

export const UserRepository = {
  findAll() {
    return storage.get(USERS_DB_KEY, []);
  },
  findById(userId) {
    return this.findAll().find(u => u.userId === userId || u.customerId === userId) || null;
  },
  save(userProfile) {
    const all = this.findAll();
    const idx = all.findIndex(u => u.userId === userProfile.userId || u.customerId === userProfile.customerId);
    if (idx >= 0) all[idx] = userProfile;
    else all.push(userProfile);
    storage.set(USERS_DB_KEY, all);
    return userProfile;
  }
};

export const ProjectRepository = {
  findByUser(userId) {
    const key = `${PROJECTS_KEY_PREFIX}${userId}`;
    return storage.get(key, []);
  },
  findAllAcrossUsers() {
    const all = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('PROJECTS_STORE')) {
          try {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(items)) all.push(...items);
          } catch {}
        }
      }
    } catch {}
    return all;
  },
  saveForUser(userId, project) {
    const key = `${PROJECTS_KEY_PREFIX}${userId}`;
    const existing = storage.get(key, []);
    const updated = [project, ...existing.filter(p => p.id !== project.id)];
    storage.set(key, updated);
    return updated;
  }
};

export const WorkflowRepository = {
  findAll() {
    return storage.get(WORKFLOWS_KEY, {});
  },
  save(templateId, templateData) {
    const current = this.findAll();
    current[templateId] = templateData;
    storage.set(WORKFLOWS_KEY, current);
    return templateData;
  }
};

export const CreatorScoreRepository = {
  getScoresForCreator(creatorId) {
    return storage.get(`CREATOR_SCORE_${creatorId}`, {
      cisScore: 94,
      cpsScore: 96,
      ccsScore: 90,
      overallMatchScore: 94
    });
  },
  saveScores(creatorId, scoreData) {
    storage.set(`CREATOR_SCORE_${creatorId}`, scoreData);
    return scoreData;
  }
};

export const QualityRepository = {
  getReviewsForProject(projectId) {
    return storage.get(`QUALITY_REVIEW_${projectId}`, null);
  },
  saveReview(projectId, reviewData) {
    storage.set(`QUALITY_REVIEW_${projectId}`, reviewData);
    return reviewData;
  }
};
