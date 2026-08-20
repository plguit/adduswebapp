import { storage } from '../../utils/storage.js';

const TASKS_KEY_PREFIX = 'ADDUS_PROJECT_TASKS_DB_';

const WORKFLOW_TASK_TEMPLATES = {
  'Video Advertisement': [
    { title: 'Creative Brief', owner: 'Admin Ops', priority: 'high', daysFromStart: 1 },
    { title: 'Script Writing', owner: 'Strategist', priority: 'high', daysFromStart: 1 },
    { title: 'Storyboard', owner: 'Strategist', priority: 'medium', daysFromStart: 2 },
    { title: 'Shot List', owner: 'Creator', priority: 'medium', daysFromStart: 2 },
    { title: 'Location Confirmation', owner: 'Admin Ops', priority: 'medium', daysFromStart: 2 },
    { title: 'Talent Booking', owner: 'Admin Ops', priority: 'medium', daysFromStart: 2 },
    { title: 'Equipment Checklist', owner: 'Creator', priority: 'low', daysFromStart: 3 },
    { title: 'Shoot Schedule Confirmation', owner: 'Admin Ops', priority: 'high', daysFromStart: 3 },
    { title: 'Raw Footage Upload', owner: 'Creator', priority: 'high', daysFromStart: 4 },
    { title: 'Editing & Assembly Cut', owner: 'Creator', priority: 'high', daysFromStart: 5 },
    { title: 'Colour Grading', owner: 'Creator', priority: 'medium', daysFromStart: 5 },
    { title: 'Audio Mix & Sound Design', owner: 'Creator', priority: 'medium', daysFromStart: 6 },
    { title: 'Thumbnail & Social Cutdowns', owner: 'Creator', priority: 'medium', daysFromStart: 6 },
    { title: 'Internal Quality Review', owner: 'Quality Brain', priority: 'high', daysFromStart: 7 },
    { title: 'Customer Review & Delivery', owner: 'Admin Ops', priority: 'high', daysFromStart: 8 }
  ],
  'Photography': [
    { title: 'Creative Brief', owner: 'Admin Ops', priority: 'high', daysFromStart: 1 },
    { title: 'Shot List & Moodboard', owner: 'Strategist', priority: 'medium', daysFromStart: 1 },
    { title: 'Location & Studio Booking', owner: 'Admin Ops', priority: 'medium', daysFromStart: 2 },
    { title: 'Talent & Styling', owner: 'Admin Ops', priority: 'medium', daysFromStart: 2 },
    { title: 'Shoot Day Execution', owner: 'Creator', priority: 'high', daysFromStart: 3 },
    { title: 'Asset Upload & Cull', owner: 'Creator', priority: 'high', daysFromStart: 4 },
    { title: 'Retouching & Color Grading', owner: 'Creator', priority: 'medium', daysFromStart: 5 },
    { title: 'Internal Quality Review', owner: 'Quality Brain', priority: 'high', daysFromStart: 6 },
    { title: 'Customer Review & Delivery', owner: 'Admin Ops', priority: 'high', daysFromStart: 7 }
  ],
  'Branding': [
    { title: 'Brand Discovery Session', owner: 'Strategist', priority: 'high', daysFromStart: 1 },
    { title: 'Competitor Research', owner: 'Strategist', priority: 'medium', daysFromStart: 2 },
    { title: 'Logo Concept Generation', owner: 'Creator', priority: 'high', daysFromStart: 3 },
    { title: 'Brand Identity Presentation', owner: 'Creator', priority: 'high', daysFromStart: 5 },
    { title: 'Revision Cycle', owner: 'Creator', priority: 'medium', daysFromStart: 7 },
    { title: 'Brand Book Assembly', owner: 'Creator', priority: 'high', daysFromStart: 9 },
    { title: 'Vector Asset Delivery', owner: 'Creator', priority: 'high', daysFromStart: 10 }
  ],
  'Website': [
    { title: 'Discovery & Requirements', owner: 'Strategist', priority: 'high', daysFromStart: 1 },
    { title: 'Wireframe Design', owner: 'Creator', priority: 'high', daysFromStart: 2 },
    { title: 'UI/UX Design', owner: 'Creator', priority: 'high', daysFromStart: 4 },
    { title: 'Development Sprint', owner: 'Creator', priority: 'high', daysFromStart: 7 },
    { title: 'QA & Responsive Testing', owner: 'Quality Brain', priority: 'high', daysFromStart: 12 },
    { title: 'Customer Review & Revisions', owner: 'Admin Ops', priority: 'medium', daysFromStart: 14 },
    { title: 'Domain Setup & Launch', owner: 'Creator', priority: 'high', daysFromStart: 16 }
  ]
};

export const AutomatedTaskEngine = {
  generateTasksForProject(project = {}) {
    const service = project.service || 'Video Advertisement';
    const templates = WORKFLOW_TASK_TEMPLATES[service] || WORKFLOW_TASK_TEMPLATES['Video Advertisement'];

    const shootDate = project.shootDate ? new Date(project.shootDate) : new Date();

    return templates.map((tmpl, idx) => {
      const deadline = new Date(shootDate);
      deadline.setDate(shootDate.getDate() + (tmpl.daysFromStart || idx + 1));

      return {
        id: `TSK_${project.id || 'PROJ'}_${String(idx + 1).padStart(2, '0')}`,
        projectId: project.id,
        title: tmpl.title,
        owner: tmpl.owner,
        role: tmpl.owner,
        status: idx === 0 ? 'in_progress' : 'pending',
        priority: tmpl.priority,
        deadline: deadline.toISOString(),
        daysFromStart: tmpl.daysFromStart,
        dependencies: idx > 0 ? [`TSK_${project.id || 'PROJ'}_${String(idx).padStart(2, '0')}`] : [],
        comments: [],
        files: [],
        createdAt: new Date().toISOString()
      };
    });
  },

  saveTasksForProject(projectId, tasks) {
    storage.set(`${TASKS_KEY_PREFIX}${projectId}`, tasks);
    return tasks;
  },

  getTasksForProject(projectId) {
    return storage.get(`${TASKS_KEY_PREFIX}${projectId}`, []);
  },

  updateTask(projectId, taskId, patch) {
    const tasks = this.getTasksForProject(projectId);
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t);
    storage.set(`${TASKS_KEY_PREFIX}${projectId}`, updated);
    return updated;
  }
};

export default AutomatedTaskEngine;
