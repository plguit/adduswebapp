import { storage } from '../../utils/storage.js';

const WORKFLOW_TEMPLATES_KEY = 'ADDUS_WORKFLOW_TEMPLATES_DB';

export const DEFAULT_WORKFLOW_TEMPLATES = {
  video: {
    id: 'wf_video',
    name: 'Video Advertisement & Brand Film Workflow',
    category: 'Video Advertisement',
    stages: [
      'Draft', 'Submitted', 'Under Review', 'Strategy Preparation',
      'Waiting for Customer Approval', 'Approved', 'Creator Assignment',
      'In Production', 'Internal Quality Review', 'Customer Review',
      'Revision Requested', 'Revision in Progress', 'Approved by Customer',
      'Delivered', 'Archived'
    ]
  },
  photography: {
    id: 'wf_photo',
    name: 'Commercial Photography Shoot Workflow',
    category: 'Photography',
    stages: [
      'Planning', 'Booking', 'Shoot Scheduled', 'Shoot Completed',
      'Asset Upload', 'Editing & Color Grading', 'Internal QA',
      'Customer Review', 'Revision', 'Final Delivery', 'Completed'
    ]
  },
  website: {
    id: 'wf_website',
    name: 'Website & Digital Experience Workflow',
    category: 'Website',
    stages: [
      'Discovery', 'Wireframing', 'UI/UX Design', 'Development Sprint',
      'QA & Responsive Testing', 'Customer Review', 'Revision',
      'Domain & Launch', 'Completed'
    ]
  },
  branding: {
    id: 'wf_branding',
    name: 'Brand Identity & Strategy Workflow',
    category: 'Branding',
    stages: [
      'Discovery', 'Research & Competitor Audit', 'Concept Generation',
      'Presentation', 'Revision Cycle', 'Brand Book Approval',
      'Vector Asset Delivery', 'Completed'
    ]
  },
  packaging: {
    id: 'wf_packaging',
    name: 'Custom Packaging Design Workflow',
    category: 'Packaging',
    stages: [
      'Die-line Specifications', '3D Mockup Design', 'Print Proof Review',
      'Internal QA', 'Customer Review', 'Revision', 'Pre-press Delivery',
      'Completed'
    ]
  }
};

export const WorkflowEngine = {
  getWorkflowTemplates() {
    return storage.get(WORKFLOW_TEMPLATES_KEY, DEFAULT_WORKFLOW_TEMPLATES);
  },

  getWorkflowForCategory(category = '') {
    const templates = this.getWorkflowTemplates();
    const catLower = (category || '').toLowerCase();

    for (const [, tmpl] of Object.entries(templates)) {
      if (tmpl.category && tmpl.category.toLowerCase().includes(catLower)) {
        return tmpl;
      }
    }
    return templates.video || DEFAULT_WORKFLOW_TEMPLATES.video;
  },

  saveWorkflowTemplate(templateId, templateData) {
    const templates = this.getWorkflowTemplates();
    templates[templateId] = {
      ...templates[templateId],
      ...templateData,
      updatedAt: new Date().toISOString()
    };
    storage.set(WORKFLOW_TEMPLATES_KEY, templates);
    return templates[templateId];
  },

  handleTaskCompletion(project, taskId, currentActor) {
    // Advanced Workflow Engine Logic for Phase 4B
    if (!project || !project.tasks) return null;
    
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    );
    
    // Auto-advance stage if all creator tasks are complete
    const creatorTasks = updatedTasks.filter(t => t.assignedTo === 'creator');
    const allDone = creatorTasks.length > 0 && creatorTasks.every(t => t.status === 'completed');
    
    const nextStatus = allDone ? 'Internal Quality Review' : project.status;

    return {
      tasks: updatedTasks,
      status: nextStatus
    };
  },

  validateQuotationApproval(project) {
    if (!project || !project.quotation) return false;
    return project.quotation.status === 'Approved';
  }
};

export default WorkflowEngine;
