import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage.js';
import { profileService } from '../services/profileService.js';
import { idGeneratorService } from '../services/idGeneratorService.js';
import { NotificationEngine } from '../services/brain/UniversalNotificationEngine.js';

const BASE_KEY = 'PROJECTS_STORE';

export const PROJECT_LIFECYCLE_STAGES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Strategy Preparation',
  'Waiting for Customer Approval',
  'Approved',
  'Creator Assignment',
  'In Production',
  'Internal Quality Review',
  'Customer Review',
  'Revision Requested',
  'Revision in Progress',
  'Approved by Customer',
  'Delivered',
  'Archived'
];

export const PROJECT_TIMELINE_PHASES = [
  { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
  { key: 'strategy', label: 'Strategy Assigned', triggerStage: 'Strategy Preparation' },
  { key: 'brief', label: 'Creative Brief Ready', triggerStage: 'Waiting for Customer Approval' },
  { key: 'shoot_scheduled', label: 'Shoot Scheduled', triggerStage: 'Approved' },
  { key: 'shoot_done', label: 'Shoot Completed', triggerStage: 'In Production' },
  { key: 'editing', label: 'Editing', triggerStage: 'Internal Quality Review' },
  { key: 'qa', label: 'Quality Check', triggerStage: 'Customer Review' },
  { key: 'client_review', label: 'Your Review', triggerStage: 'Approved by Customer' },
  { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
];

export function getServiceScheduleType(service = 'Video Ad') {
  const serviceName = typeof service === 'string'
    ? service
    : (service?.name || service?.title || service?.serviceName || service?.service || service?.id || 'Video Ad');
  const lower = serviceName.toLowerCase();
  if (
    lower.includes('photo') ||
    lower.includes('video') ||
    lower.includes('shoot') ||
    lower.includes('film') ||
    lower.includes('videography') ||
    lower.includes('photography')
  ) {
    return 'SHOOT_DATE_REQUEST';
  }
  return 'DELIVERY_DATE_REQUEST';
}

export function getTimelinePhasesForServices(services = []) {
  const serviceList = (services && services.length > 0) ? services : ['video'];
  return serviceList.map(rawService => {
    const serviceName = typeof rawService === 'string'
      ? rawService
      : (rawService?.name || rawService?.title || rawService?.serviceName || rawService?.service || rawService?.id || 'Creative Service');
    const lower = serviceName.toLowerCase();
    let label = serviceName;
    let phases = [];

    if (lower.includes('video') || lower.includes('film') || lower.includes('explainer') || lower.includes('cinema')) {
      label = 'Video Production';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'brief', label: 'Creative Brief Ready', triggerStage: 'Waiting for Customer Approval' },
        { key: 'planning', label: 'Production Planning', triggerStage: 'Strategy Preparation' },
        { key: 'shoot', label: 'Shoot Scheduled', triggerStage: 'Approved' },
        { key: 'shoot_done', label: 'Shoot Completed', triggerStage: 'In Production' },
        { key: 'editing', label: 'Editing', triggerStage: 'Internal Quality Review' },
        { key: 'qa', label: 'Quality Check', triggerStage: 'Customer Review' },
        { key: 'client_review', label: 'Your Review', triggerStage: 'Approved by Customer' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else if (lower.includes('photo') || lower.includes('camera') || lower.includes('shoot')) {
      label = 'Photography';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'brief', label: 'Photography Brief', triggerStage: 'Strategy Preparation' },
        { key: 'planning', label: 'Shoot Planning', triggerStage: 'Waiting for Customer Approval' },
        { key: 'shoot', label: 'Shoot Scheduled', triggerStage: 'Approved' },
        { key: 'shoot_done', label: 'Shoot Completed', triggerStage: 'In Production' },
        { key: 'editing', label: 'Editing / Retouching', triggerStage: 'Internal Quality Review' },
        { key: 'qa', label: 'Quality Check', triggerStage: 'Customer Review' },
        { key: 'review', label: 'Your Review', triggerStage: 'Approved by Customer' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else if (lower.includes('logo')) {
      label = 'Logo Design';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'brief', label: 'Understanding Your Brand', triggerStage: 'Strategy Preparation' },
        { key: 'direction', label: 'Creative Direction', triggerStage: 'Waiting for Customer Approval' },
        { key: 'concept', label: 'Concept Development', triggerStage: 'Approved' },
        { key: 'review', label: 'Your Review', triggerStage: 'Customer Review' },
        { key: 'revision', label: 'Revision', triggerStage: 'Revision Requested' },
        { key: 'final', label: 'Final Files', triggerStage: 'Approved by Customer' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else if (lower.includes('branding') || lower.includes('identity')) {
      label = 'Branding';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'brief', label: 'Understanding Your Brand', triggerStage: 'Strategy Preparation' },
        { key: 'strategy', label: 'Building the Strategy', triggerStage: 'Waiting for Customer Approval' },
        { key: 'identity', label: 'Designing Your Brand', triggerStage: 'Approved' },
        { key: 'guidelines', label: 'Preparing Your Brand Guide', triggerStage: 'In Production' },
        { key: 'qa', label: 'Quality Check', triggerStage: 'Internal Quality Review' },
        { key: 'review', label: 'Your Review', triggerStage: 'Customer Review' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else if (lower.includes('packaging')) {
      label = 'Packaging Design';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'brief', label: 'Product Understanding', triggerStage: 'Strategy Preparation' },
        { key: 'direction', label: 'Packaging Direction', triggerStage: 'Waiting for Customer Approval' },
        { key: 'concept', label: 'Concept Design', triggerStage: 'Approved' },
        { key: 'revision', label: 'Revision Cycle', triggerStage: 'Revision Requested' },
        { key: 'mockup', label: 'Mockup / Final Artwork', triggerStage: 'Internal Quality Review' },
        { key: 'review', label: 'Your Review', triggerStage: 'Customer Review' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else if (lower.includes('website') || lower.includes('web')) {
      label = 'Website';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'audit', label: 'Website Audit / Requirements', triggerStage: 'Strategy Preparation' },
        { key: 'structure', label: 'Sitemap / Structure', triggerStage: 'Waiting for Customer Approval' },
        { key: 'ui', label: 'UI Design', triggerStage: 'Approved' },
        { key: 'dev', label: 'Development Sprint', triggerStage: 'In Production' },
        { key: 'qa', label: 'Responsive Testing / QA', triggerStage: 'Internal Quality Review' },
        { key: 'review', label: 'Your Review', triggerStage: 'Customer Review' },
        { key: 'launch', label: 'Launch Preparation', triggerStage: 'Approved by Customer' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else if (lower.includes('ui') || lower.includes('ux') || lower.includes('experience')) {
      label = 'UI/UX';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'understanding', label: 'Product Understanding', triggerStage: 'Strategy Preparation' },
        { key: 'flows', label: 'User Flows / Wireframes', triggerStage: 'Waiting for Customer Approval' },
        { key: 'ui', label: 'UI Design', triggerStage: 'Approved' },
        { key: 'prototype', label: 'Interactive Prototype', triggerStage: 'In Production' },
        { key: 'qa', label: 'Quality Check', triggerStage: 'Internal Quality Review' },
        { key: 'review', label: 'Your Review', triggerStage: 'Customer Review' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else if (lower.includes('content') || lower.includes('marketing') || lower.includes('social') || lower.includes('graphic')) {
      label = 'Content & Marketing';
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'strategy', label: 'Content Strategy', triggerStage: 'Strategy Preparation' },
        { key: 'plan', label: 'Content Plan / Script', triggerStage: 'Waiting for Customer Approval' },
        { key: 'production', label: 'Content Production', triggerStage: 'Approved' },
        { key: 'qa', label: 'Quality Check', triggerStage: 'Internal Quality Review' },
        { key: 'review', label: 'Your Review', triggerStage: 'Customer Review' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    } else {
      label = serviceName;
      phases = [
        { key: 'created', label: 'Project Started', triggerStage: 'Submitted' },
        { key: 'brief', label: 'Brief Preparation', triggerStage: 'Strategy Preparation' },
        { key: 'concept', label: 'Concept Development', triggerStage: 'Approved' },
        { key: 'production', label: 'Production', triggerStage: 'In Production' },
        { key: 'review', label: 'Your Review', triggerStage: 'Customer Review' },
        { key: 'delivered', label: 'Delivered', triggerStage: 'Delivered' }
      ];
    }
    return { label, phases };
  });
}

export function calculateTimelineProgressForWorkstreams(currentStatus, services = []) {
  const workstreams = getTimelinePhasesForServices(services);
  const currentIdx = PROJECT_LIFECYCLE_STAGES.indexOf(currentStatus || 'Submitted');
  return workstreams.map(ws => {
    const phases = ws.phases.map(phase => {
      const triggerIdx = PROJECT_LIFECYCLE_STAGES.indexOf(phase.triggerStage);
      const isCompleted = currentIdx >= triggerIdx;
      const isActive = currentIdx === triggerIdx - 1 || (currentIdx === triggerIdx);
      return {
        ...phase,
        status: isCompleted ? 'completed' : isActive ? 'active' : 'pending'
      };
    });
    return {
      ...ws,
      phases
    };
  });
}

export function calculateTimelineProgress(currentStatus) {
  const currentIdx = PROJECT_LIFECYCLE_STAGES.indexOf(currentStatus);
  const workstreams = getTimelinePhasesForServices(['video']);
  return workstreams[0].phases.map((phase) => {
    const triggerIdx = PROJECT_LIFECYCLE_STAGES.indexOf(phase.triggerStage);
    const isCompleted = currentIdx >= triggerIdx;
    const isActive = currentIdx === triggerIdx - 1 || (currentIdx === triggerIdx);
    return {
      ...phase,
      status: isCompleted ? 'completed' : isActive ? 'active' : 'pending'
    };
  });
}

export function getProjectBudgetDisplay(project) {
  if (!project) return '';
  if (project.quotation && project.quotation.total > 0 && (project.quotation.status === 'Approved' || project.quotation.status === 'Sent')) {
    return `₹${project.quotation.total.toLocaleString()}`;
  }
  const status = project.status || 'Submitted';
  if (['Draft', 'Submitted', 'Under Review'].includes(status)) {
    return 'Final quote after expert review';
  }
  return 'Pricing under review';
}

export function getDefaultDeliverablesForServices(services = []) {
  const serviceList = (services && services.length > 0) ? services : ['video'];
  const allDels = [];
  let index = 1;

  serviceList.forEach(serviceName => {
    const lower = serviceName.toLowerCase();
    let dels = [];
    if (lower.includes('video') || lower.includes('film') || lower.includes('explainer') || lower.includes('cinema')) {
      dels = [
        { name: 'Brand Film Master 4K', category: 'Brand Film' },
        { name: 'Raw Footage Archive', category: 'Raw Footage' },
        { name: 'Edited Social Cutdown (9:16)', category: 'Edited Video' },
        { name: 'High-Res Cover Thumbnail', category: 'Thumbnail' },
        { name: 'Key Visual Poster', category: 'Poster' },
        { name: 'Project Project File & Assets', category: 'Source Files' }
      ];
    } else if (lower.includes('photo') || lower.includes('camera') || lower.includes('shoot')) {
      dels = [
        { name: 'Contact sheets & selects', category: 'Photography' },
        { name: 'Selected images raw archive', category: 'Photography' },
        { name: 'Retouched images deliverables', category: 'Photography' },
        { name: 'Final high-res image deliverables', category: 'Photography' }
      ];
    } else if (lower.includes('logo')) {
      dels = [
        { name: 'Logo design visual concepts', category: 'Logo Design' },
        { name: 'Revision notes feedback', category: 'Logo Design' },
        { name: 'Final logo exports bundle (PNG/SVG)', category: 'Logo Design' },
        { name: 'Logo source files package', category: 'Source Files' }
      ];
    } else if (lower.includes('branding') || lower.includes('identity')) {
      dels = [
        { name: 'Brand Understanding Strategy', category: 'Branding' },
        { name: 'Concept Direction Boards', category: 'Branding' },
        { name: 'Final Brand Identity Book PDF', category: 'Branding' },
        { name: 'Vector Brand Identity Assets', category: 'Source Files' }
      ];
    } else if (lower.includes('packaging')) {
      dels = [
        { name: 'Dieline specs template', category: 'Packaging Design' },
        { name: 'Packaging Concept Renderings', category: 'Packaging Design' },
        { name: 'Print-ready artwork proofs PDF', category: 'Packaging Design' },
        { name: 'Packaging Source Files package', category: 'Source Files' }
      ];
    } else if (lower.includes('website') || lower.includes('web')) {
      dels = [
        { name: 'Sitemap sitemap index', category: 'Website' },
        { name: 'UI design wireframe boards', category: 'Website' },
        { name: 'Development staging preview URL', category: 'Website' },
        { name: 'QA checklist responsive check', category: 'Website' },
        { name: 'Final website launched files', category: 'Website' }
      ];
    } else if (lower.includes('ui') || lower.includes('ux') || lower.includes('experience')) {
      dels = [
        { name: 'User journeys wireframes suite', category: 'UI/UX' },
        { name: 'High fidelity UI layout designs', category: 'UI/UX' },
        { name: 'Interactive prototype package', category: 'UI/UX' },
        { name: 'Developer handoff design assets', category: 'UI/UX' }
      ];
    } else if (lower.includes('content') || lower.includes('marketing') || lower.includes('social') || lower.includes('graphic')) {
      dels = [
        { name: 'Content campaign planning strategy', category: 'Content/Marketing' },
        { name: 'Social creative deliverables bundle', category: 'Content/Marketing' },
        { name: 'Completed copy scripts files', category: 'Content/Marketing' }
      ];
    }

    dels.forEach(d => {
      allDels.push({
        id: `del_${index++}`,
        name: d.name,
        category: d.category,
        status: 'Pending',
        version: 1,
        url: '',
        updatedAt: new Date().toISOString()
      });
    });
  });

  return allDels;
}

function getProjectsKey(userId) {
  return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

/**
 * Global Project Store Hook — Sprint 4 Operations Engine
 */
export function useProjectStore(userId = null) {
  const session = storage.get('ACTIVE_AUTH_SESSION', null);
  const activeUserId = userId || session?.userId || null;
  const storeKey = getProjectsKey(activeUserId);

  const migrateProjectIds = (projects, key) => {
    if (!Array.isArray(projects) || projects.length === 0) return projects;
    const flagKey = `ADDUS_ID_MIGRATION_RAN_${key}`;
    if (storage.get(flagKey, false)) return projects;

    let changed = false;
    const idMap = {};
    const migrated = projects.map(p => {
      const oldId = p.id || p.projectId;
      if (!oldId || !String(oldId).startsWith('proj_')) return p;
      const newId = idGeneratorService.getNextId('APA');
      idMap[oldId] = newId;
      changed = true;
      const updated = { ...p, id: newId, projectId: newId };
      if (updated.chat) {
        updated.chat = updated.chat.map(m => ({
          ...m,
          senderId: m.senderId === oldId ? newId : m.senderId,
          projectId: m.projectId === oldId ? newId : m.projectId
        }));
      }
      if (updated.tasks) {
        updated.tasks = updated.tasks.map(t => ({
          ...t,
          projectId: t.projectId === oldId ? newId : t.projectId
        }));
      }
      if (updated.uploadedFiles) {
        updated.uploadedFiles = updated.uploadedFiles.map(f => ({
          ...f,
          projectId: f.projectId === oldId ? newId : f.projectId
        }));
      }
      return updated;
    });

    if (!changed) return projects;

    storage.set(key, migrated);
    Object.entries(idMap).forEach(([oldId, newId]) => {
      const taskSrc = `ADDUS_PROJECT_TASKS_DB_${oldId}`;
      const taskDst = `ADDUS_PROJECT_TASKS_DB_${newId}`;
      const chatSrc = `ADDUS_PROJECT_CHAT_DB_${oldId}`;
      const chatDst = `ADDUS_PROJECT_CHAT_DB_${newId}`;
      const fileSrc = `ADDUS_FILE_VERSIONS_DB_${oldId}`;
      const fileDst = `ADDUS_FILE_VERSIONS_DB_${newId}`;
      const vaultSrc = `ADDUS_BUSINESS_VAULT_DB_${oldId}`;
      const vaultDst = `ADDUS_BUSINESS_VAULT_DB_${newId}`;
      if (storage.get(taskSrc, null) !== null) storage.set(taskDst, storage.get(taskSrc, []));
      if (storage.get(chatSrc, null) !== null) storage.set(chatDst, storage.get(chatSrc, []));
      if (storage.get(fileSrc, null) !== null) storage.set(fileDst, storage.get(fileSrc, []));
      if (storage.get(vaultSrc, null) !== null) storage.set(vaultDst, storage.get(vaultSrc, []));
    });
    storage.set(flagKey, true);
    return migrated;
  };

  const [projects, setProjects] = useState(() => {
    try {
      const data = storage.get(storeKey, []);
      return migrateProjectIds(data, storeKey);
    } catch {
      const data = storage.get(BASE_KEY, []);
      return migrateProjectIds(data, BASE_KEY);
    }
  });

  const reloadProjects = useCallback(() => {
    try {
      const data = storage.get(storeKey, []);
      setProjects(prev => migrateProjectIds(data, storeKey));
    } catch (e) {
      console.warn('reloadProjects error', e);
    }
  }, [storeKey]);

  useEffect(() => {
    storage.set(storeKey, projects);
  }, [projects, storeKey]);

  // Real-time synchronization across tabs and custom store updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key || e.key.startsWith(BASE_KEY)) {
        reloadProjects();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('addus_project_store_updated', reloadProjects);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('addus_project_store_updated', reloadProjects);
    };
  }, [reloadProjects]);

  const createDraftProject = useCallback((projectData) => {
    const services = projectData.selectedServices && projectData.selectedServices.length > 0
      ? projectData.selectedServices
      : [projectData.service || 'Video Production'];
    const projectId = (projectData.id && !String(projectData.id).startsWith('proj_'))
      ? projectData.id
      : idGeneratorService.getNextId('APA');
    const uid = activeUserId || storage.get('ACTIVE_AUTH_SESSION', {})?.userId || null;

    const now = new Date().toISOString();
    const shootObj = projectData.shootDate ? new Date(projectData.shootDate) : new Date();
    const delivObj = new Date(shootObj);
    delivObj.setDate(shootObj.getDate() + (projectData.proposal?.timelineDays || 7));
    const estDelivStr = projectData.estimatedDelivery ||
      delivObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const initialStatus = projectData.status || 'Submitted';

    // Generate service-specific deliverables
    const defaultDeliverables = getDefaultDeliverablesForServices(services);
    const primaryService = services[0] || 'Brand Project';

    // Dynamic budget initialization: do not fabricate video range for unrelated services
    let initialBudget = projectData.budget;
    if (!initialBudget) {
      const lowerS = primaryService.toLowerCase();
      if (lowerS.includes('video') || lowerS.includes('film')) {
        initialBudget = '₹20,000 – ₹40,000';
      } else {
        initialBudget = 'Pricing under review';
      }
    }

    const resolvedScheduleRequests = projectData.scheduleRequests || {};
    // Ensure all selected services have a schedule request initialized
    services.forEach(sName => {
      if (!resolvedScheduleRequests[sName]) {
        const type = getServiceScheduleType(sName);
        resolvedScheduleRequests[sName] = {
          serviceName: sName,
          scheduleType: type,
          preferredDate: type === 'SHOOT_DATE_REQUEST' ? (projectData.shootDate || shootObj.toISOString().split('T')[0]) : (projectData.deliveryDate || estDelivStr)
        };
      }
    });

    const newProject = {
      id: projectId,
      projectId,
      userId: uid,
      customerId: uid,
      businessId: projectData.businessId || null,
      productId: projectData.productId || null,
      productName: projectData.productName || null,
      customerName: projectData.customerName || '',
      service: primaryService,
      selectedServices: services,
      type: projectData.type || `${primaryService} Project`,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
      shootDate: projectData.shootDate || shootObj.toISOString().split('T')[0],
      deliveryDate: projectData.deliveryDate || estDelivStr,
      scheduleRequests: resolvedScheduleRequests,
      timeSlot: projectData.timeSlot || '11 AM – 1 PM',
      estimatedDelivery: estDelivStr,
      budget: initialBudget,
      location: projectData.location || 'Studio Hangar A',
      
      // Sprint 4 Operations Engine Extensions
      activityLog: [
        {
          timestamp: now,
          actor: 'Customer',
          role: 'Customer',
          action: 'Project Submitted',
          previousValue: '',
          newValue: initialStatus,
          notes: 'Project created and entered initial review queue.'
        }
      ],
      internalNotes: [],
      customerNotes: [],
      strategyWorkspace: projectData.strategyWorkspace || {
        businessSummary: projectData.notes || '',
        businessGoals: '',
        targetAudience: '',
        objectives: '',
        deliverables: services.join(', '),
        competitorNotes: '',
        creativeDirection: '',
        references: projectData.referenceStyle || '',
        risks: '',
        recommendations: '',
        isApproved: false,
        updatedAt: now
      },
      creativeBrief: projectData.creativeBrief || {
        title: `${primaryService} Creative Brief`,
        objective: 'Position brand as a market leader with high production value.',
        keyMessage: 'Premium quality meets effortless elegance.',
        targetPlatform: 'Instagram, YouTube Shorts, Meta Ads',
        visualStyle: projectData.selectedStyle || 'Modern Cinematic',
        aspectRatio: projectData.aspectRatio || 'Instagram Reel (9:16)',
        requirements: 'Cohesive branding, high-resolution delivery, color graded.',
        isApproved: false
      },
      approvedCreativeBrief: null,
      assignedCreator: null,
      deliverables: projectData.deliverables || defaultDeliverables,
      versionHistory: [
        {
          version: 1,
          createdAt: now,
          status: 'Initial Draft',
          notes: 'Initial production build package initialized.',
          submittedBy: 'System'
        }
      ],
      folders: {
        Brief: [`${projectId}_Creative_Brief_v1.pdf`],
        References: projectData.referenceStyle ? [projectData.referenceStyle] : ['Brand_Guidelines.pdf'],
        Uploads: [],
        Deliverables: [],
        Invoices: [`INV-${projectId}-001.pdf`],
        Approvals: [],
        Assets: ['Logo_Master_Vector.svg', 'Brand_Color_Palette.json']
      },
      proposal: projectData.proposal || {
        packageTitle: `Enterprise ${primaryService} Package`,
        shootDays: 1,
        crew: ['Creative Strategist', 'Director', 'Videographer', 'Editor'],
        deliverables: defaultDeliverables.map(d => d.name),
        budgetMin: 20000,
        budgetMax: 40000,
        budgetDisplay: initialBudget,
        timelineDays: 7
      },
      nextSteps: [
        'Creative Strategist Assigned',
        'Creative Brief Preparation',
        'Project Plan & Execution Kickoff'
      ],

      // Sprint 4B: Collaboration & Execution Engine Extensions
      members: {
        customer: uid,
        projectManager: 'ADM001',
        creators: [],
        admin: 'ADM001'
      },
      chat: [], // Array of { id, senderId, senderRole, text, attachments, timestamp, isInternal }
      tasks: (() => {
        const lower = primaryService.toLowerCase();
        if (lower.includes('video') || lower.includes('film') || lower.includes('explainer') || lower.includes('cinema')) {
          return [
            { id: 'task_1', title: 'Confirm Shoot Location & Setup', status: 'pending', assignedTo: 'customer', deadline: estDelivStr },
            { id: 'task_2', title: 'Prepare Video Equipment List', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_3', title: 'Film Production & Shoot Completion', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_4', title: 'Upload Raw Video Footage', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_5', title: 'Deliver Final Video Edit', status: 'pending', assignedTo: 'creator', deadline: estDelivStr }
          ];
        } else if (lower.includes('photo') || lower.includes('camera') || lower.includes('shoot')) {
          return [
            { id: 'task_1', title: 'Approve Photography Shot List', status: 'pending', assignedTo: 'customer', deadline: estDelivStr },
            { id: 'task_2', title: 'Set Up Lighting & Studio Space', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_3', title: 'Execute Product/Lifestyle Shoot', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_4', title: 'Upload Raw Selected Images', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_5', title: 'Deliver Final Edited Photos', status: 'pending', assignedTo: 'creator', deadline: estDelivStr }
          ];
        } else if (lower.includes('logo') || lower.includes('branding')) {
          return [
            { id: 'task_1', title: 'Provide Brand Guidelines & Logo References', status: 'pending', assignedTo: 'customer', deadline: estDelivStr },
            { id: 'task_2', title: 'Develop Initial Concept Directions', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_3', title: 'Submit Concepts for Customer Review', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_4', title: 'Refine Concepts based on Feedback', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_5', title: 'Deliver Final High-Res Vector Logo Pack', status: 'pending', assignedTo: 'creator', deadline: estDelivStr }
          ];
        } else if (lower.includes('packaging')) {
          return [
            { id: 'task_1', title: 'Provide Package Dimensions & Specifications', status: 'pending', assignedTo: 'customer', deadline: estDelivStr },
            { id: 'task_2', title: 'Draft Packaging Layout Mockup', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_3', title: 'Submit 3D Renderings for Approval', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_4', title: 'Prepare Print-Ready Die-line Artworks', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_5', title: 'Deliver Final Print Production Files', status: 'pending', assignedTo: 'creator', deadline: estDelivStr }
          ];
        } else if (lower.includes('website') || lower.includes('web') || lower.includes('ui') || lower.includes('ux')) {
          return [
            { id: 'task_1', title: 'Submit Website Sitemap & Functional Requirements', status: 'pending', assignedTo: 'customer', deadline: estDelivStr },
            { id: 'task_2', title: 'Design High-Fidelity UI Layouts', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_3', title: 'Review & Approve Prototype Designs', status: 'pending', assignedTo: 'customer', deadline: estDelivStr },
            { id: 'task_4', title: 'Develop Frontend Code & Build', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
            { id: 'task_5', title: 'Perform Responsive Testing & Launch Site', status: 'pending', assignedTo: 'creator', deadline: estDelivStr }
          ];
        }
        return [
          { id: 'task_1', title: 'Approve Design Brief', status: 'pending', assignedTo: 'customer', deadline: estDelivStr },
          { id: 'task_2', title: 'Prepare Initial Drafts', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
          { id: 'task_3', title: 'Submit for Customer Feedback', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
          { id: 'task_4', title: 'Refine Deliverables', status: 'pending', assignedTo: 'creator', deadline: estDelivStr },
          { id: 'task_5', title: 'Final Delivery & Handoff', status: 'pending', assignedTo: 'creator', deadline: estDelivStr }
        ];
      })(),
      equipmentRequests: [],
      clarificationRequests: [],
      invitations: [], // Track creator invitations and status
      quotation: {
        status: 'Draft',
        version: 1,
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        revisionHistory: []
      }
    };

    setProjects((prev) => {
      const updated = [newProject, ...prev];
      const sKey = storeKey || getProjectsKey(uid);
      try {
        storage.set(sKey, updated);
      } catch (e) {}
      return updated;
    });

    // Also persist into user profile projects array & central store
    try {
      const globalKey = 'PROJECTS_STORE_GLOBAL';
      const existingGlobal = storage.get(globalKey, []);
      const updatedGlobal = [newProject, ...existingGlobal.filter(p => p.id !== newProject.id)];
      storage.set(globalKey, updatedGlobal);

      if (uid) {
        const prof = profileService.getProfileById(uid) || {};
        const existingProjs = prof.projects || [];
        const updatedProf = profileService.saveProfile({
          ...prof,
          userId: uid,
          projects: [newProject, ...existingProjs.filter(p => p.id !== newProject.id)]
        });
        window.dispatchEvent(new CustomEvent('addus_profile_updated', { detail: updatedProf }));
      }
    } catch (e) {
      console.warn('[projectStore] Profile/Global storage sync error:', e);
    }

    window.dispatchEvent(new CustomEvent('addus_project_store_updated'));
    window.dispatchEvent(new CustomEvent('addus_projects_updated'));

    NotificationEngine.notify({
      userId: uid || 'global',
      role: 'Customer',
      title: 'Project Submitted',
      message: `Project ${projectId} (${newProject.service}) submitted successfully!`,
      type: 'project_submitted',
      priority: 'medium'
    });

    return newProject;
  }, [activeUserId, storeKey]);

  const updateProject = useCallback((id, patch) => {
    setProjects((prev) => {
      const updated = prev.map((p) => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p);
      return updated;
    });
  }, [storeKey]);

  const deleteProject = useCallback((id) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      return updated;
    });
  }, [storeKey]);

  const advanceProjectStage = useCallback((id) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== id) return p;

        const currentIdx = PROJECT_LIFECYCLE_STAGES.indexOf(p.status || 'Submitted');
        const nextIdx = Math.min(currentIdx + 1, PROJECT_LIFECYCLE_STAGES.length - 1);
        const nextStatus = PROJECT_LIFECYCLE_STAGES[nextIdx];
        
        // Sprint 5B: Quotation Workflow Lock
        const restrictedStages = ['Creator Assignment', 'In Production', 'Internal Quality Review', 'Customer Review'];
        if (restrictedStages.includes(nextStatus)) {
          if (!p.quotation || p.quotation.status !== 'Approved') {
            console.error('Workflow Locked: Quotation approval required before project execution.');
            alert('Workflow Locked: Quotation approval required before project execution.');
            return p; // Block progression
          }
        }
        
        const now = new Date().toISOString();
        const activityEntry = {
          timestamp: now,
          actor: 'Admin',
          role: 'Admin',
          action: `Advanced status to ${nextStatus}`,
          previousValue: p.status,
          newValue: nextStatus,
          notes: `Project moved to stage ${nextIdx + 1} of 15.`
        };

        return {
          ...p,
          status: nextStatus,
          updatedAt: now,
          activityLog: [activityEntry, ...(p.activityLog || [])]
        };
      });
      return updated;
    });
  }, [storeKey]);

  return {
    projects,
    createDraftProject,
    updateProject,
    deleteProject,
    advanceProjectStage,
    reloadProjects
  };
}

/**
 * Returns projects filtered by businessId and optional productId.
 * productId = null returns business-level projects only.
 */
export function getProjectsByContext(userId, productId = null) {
  const storeKey = getProjectsKey(userId);
  try {
    const items = storage.get(storeKey, []);
    if (!productId) return items.filter(p => !p.productId);
    return items.filter(p => p.productId === productId);
  } catch {
    return [];
  }
}

/**
 * Returns all distinct productIds referenced by a user's projects.
 */
export function getActiveProductIds(userId) {
  const storeKey = getProjectsKey(userId);
  try {
    const items = storage.get(storeKey, []);
    const ids = [...new Set(items.map(p => p.productId).filter(Boolean))];
    return ids;
  } catch {
    return [];
  }
}

/**
 * Reads all projects across all users — used by Admin console.
 */
export function getAllProjectsAcrossUsers() {
  const allProjects = [];
  const seenIds = new Set();

  // 1. Scan localStorage PROJECTS_STORE keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('PROJECTS_STORE')) {
        try {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) {
            items.forEach(p => {
              if (p && (p.id || p.projectId) && !seenIds.has(p.id || p.projectId)) {
                seenIds.add(p.id || p.projectId);
                allProjects.push(p);
              }
            });
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }

  // 2. Scan all user profiles in profileService
  try {
    const profiles = profileService.getAllProfiles();
    profiles.forEach(prof => {
      const userProjects = prof.projects || [];
      userProjects.forEach(p => {
        if (p && (p.id || p.projectId) && !seenIds.has(p.id || p.projectId)) {
          seenIds.add(p.id || p.projectId);
          allProjects.push({
            ...p,
            customerName: p.customerName || prof.name || prof.businessBrain?.customerName || prof.businessBrain?.businessName || 'Valued Client'
          });
        }
      });
    });
  } catch { /* skip */ }

  allProjects.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
  return allProjects;
}

/**
 * Update project across storage keys and dispatch sync notification
 */
export function updateProjectInStore(projectId, patch, actorInfo = { actor: 'System', role: 'System' }) {
  try {
    const now = new Date().toISOString();
    let updatedProjectRecord = null;

    // 1. Scan and update localStorage PROJECTS_STORE keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('PROJECTS_STORE')) {
        try {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) {
            let found = false;
            const updated = items.map(p => {
              if (p.id === projectId || p.projectId === projectId) {
                found = true;
                const prevStatus = p.status;
                const newStatus = patch.status || prevStatus;
                
                // Build Activity Entry if status or major property changed
                let newActivityLog = p.activityLog || [];
                if (patch.status && patch.status !== prevStatus) {
                  newActivityLog = [
                    {
                      timestamp: now,
                      actor: actorInfo.actor || 'Admin',
                      role: actorInfo.role || 'Admin',
                      action: `Status changed to ${newStatus}`,
                      previousValue: prevStatus,
                      newValue: newStatus,
                      notes: patch.activityNote || `Status updated by ${actorInfo.actor || 'System'}`
                    },
                    ...newActivityLog
                  ];
                } else if (patch.assignedCreator && !p.assignedCreator) {
                  newActivityLog = [
                    {
                      timestamp: now,
                      actor: actorInfo.actor || 'Admin',
                      role: actorInfo.role || 'Admin',
                      action: `Assigned Creator: ${patch.assignedCreator.name}`,
                      previousValue: 'Unassigned',
                      newValue: patch.assignedCreator.name,
                      notes: `Creator assigned with payout ${patch.assignedCreator.payout || 'standard'}`
                    },
                    ...newActivityLog
                  ];
                }

                updatedProjectRecord = {
                  ...p,
                  ...patch,
                  activityLog: newActivityLog,
                  updatedAt: now
                };
                return updatedProjectRecord;
              }
              return p;
            });

            if (found) {
              localStorage.setItem(key, JSON.stringify(updated));
            }
          }
        } catch {}
      }
    }

    // 2. Scan and update user profiles in profileService
    try {
      const profiles = profileService.getAllProfiles();
      profiles.forEach(prof => {
        const userProjects = prof.projects || [];
        const foundProj = userProjects.find(p => p.id === projectId || p.projectId === projectId);
        if (foundProj) {
          const prevStatus = foundProj.status;
          const newStatus = patch.status || prevStatus;
          let newActivityLog = foundProj.activityLog || [];
          if (patch.status && patch.status !== prevStatus) {
            newActivityLog = [
              {
                timestamp: now,
                actor: actorInfo.actor || 'Admin',
                role: actorInfo.role || 'Admin',
                action: `Status changed to ${newStatus}`,
                previousValue: prevStatus,
                newValue: newStatus,
                notes: patch.activityNote || `Status updated by ${actorInfo.actor || 'System'}`
              },
              ...newActivityLog
            ];
          }

          const updatedProj = {
            ...foundProj,
            ...patch,
            activityLog: newActivityLog,
            updatedAt: now
          };
          if (!updatedProjectRecord) updatedProjectRecord = updatedProj;

          const updatedUserProjects = userProjects.map(p => (p.id === projectId || p.projectId === projectId) ? updatedProj : p);
          profileService.saveProfile({
            ...prof,
            projects: updatedUserProjects
          });
        }
      });
    } catch (e) {
      console.warn('[projectStore] Profile sync in updateProjectInStore error:', e);
    }

    // Broadcast update event across window tabs
    window.dispatchEvent(new CustomEvent('addus_project_store_updated', { detail: { projectId, patch } }));
    window.dispatchEvent(new CustomEvent('addus_projects_updated', { detail: { projectId, patch } }));

    // Trigger Business Vault enrichment if project is Archived or Delivered
    if (updatedProjectRecord && (updatedProjectRecord.status === 'Archived' || updatedProjectRecord.status === 'Delivered')) {
      archiveProjectToBusinessVault(updatedProjectRecord);
    }

    return updatedProjectRecord;
  } catch (e) {
    console.warn('updateProjectInStore error:', e);
    return null;
  }
}

/**
 * Automatically enriches Business Vault when a project completes
 */
export function archiveProjectToBusinessVault(project) {
  try {
    if (!project || !project.userId) return;
    const profile = profileService.getProfileById(project.userId);
    if (!profile) return;

    const vaultEntry = {
      vaultId: `BVA_${project.id}`,
      projectId: project.id,
      archivedAt: new Date().toISOString(),
      service: project.service,
      creativeBrief: project.approvedCreativeBrief || project.creativeBrief,
      strategyWorkspace: project.strategyWorkspace,
      finalDeliverables: (project.deliverables || []).filter(d => d.status === 'Approved' || d.status === 'Uploaded'),
      brandAssets: project.folders?.Assets || [],
      
      // Sprint 5B: Commercial Archive
      quotation: project.quotation?.status === 'Approved' ? {
        finalApprovedAmount: project.quotation.total,
        approvedAt: project.quotation.approvedAt,
        revisionCount: project.quotation.revisionHistory?.length || 0,
        version: project.quotation.version
      } : null,
      
      creatorUsed: project.assignedCreator ? {
        creatorId: project.assignedCreator.creatorId,
        name: project.assignedCreator.name,
        role: project.assignedCreator.role,
        rating: project.assignedCreator.rating
      } : null,
      learnings: `Successfully completed ${project.service} deliverable within ${project.budget} budget. High retention and client satisfaction.`,
      customerPreferences: {
        preferredStyle: project.selectedStyle || 'Cinematic Modern',
        aspectRatio: project.aspectRatio || '9:16',
        communicationStyle: 'Direct & Visual'
      },
      futureRecommendations: `Recommend follow-up seasonal campaign or social reel package in 45 days.`
    };

    const existingBrain = profile.businessBrain || {};
    const existingVault = existingBrain.businessVault || [];

    // Avoid duplicate archive entries
    const updatedVault = [vaultEntry, ...existingVault.filter(v => v.projectId !== project.id)];

    profileService.updateBusinessBrain(project.userId, {
      businessVault: updatedVault,
      lastProjectCompleted: project.service,
      totalCompletedProjects: (existingBrain.totalCompletedProjects || 0) + 1
    });

  } catch (err) {
    console.warn('archiveProjectToBusinessVault error:', err);
  }
}
