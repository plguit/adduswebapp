/**
 * Planning Brain Service — ADDUS Phase 3C
 * Converts confirmed projects into complete execution plans.
 * Uses admin-configurable templates + AI customisation logic.
 */

const TEMPLATES_KEY = 'addus_project_templates';
const PLANS_KEY = 'addus_project_plans';

// ── Default Templates ─────────────────────────────────────────────────────

const DEFAULT_TEMPLATES = [
  {
    templateId: 'tmpl_brand_film',
    name: 'Brand Film',
    category: 'video',
    description: 'Premium cinematic brand story for large-scale campaigns.',
    estimatedDuration: 18,
    estimatedComplexity: 'high',
    budgetRange: { min: 80000, max: 300000, currency: 'INR' },
    requiredCreatorRoles: ['Videographer', 'Video Editor', 'Motion Designer', 'Voice Artist', 'Brand Strategist'],
    requiredEquipment: ['Cinema Camera', 'Lens Kit', 'Gimbal', 'Drone', 'Studio Lighting', 'Wireless Mic'],
    risks: ['Weather risk if outdoor shoot', 'Permit required for drone', 'Extended post-production timeline'],
    defaultMilestones: [
      'Planning Complete',
      'Creative Brief Approved',
      'Script & Storyboard Approved',
      'Location Survey Done',
      'Shoot Complete',
      'Rough Cut Approved',
      'Final Delivery'
    ],
    defaultDeliverables: ['Master Video (4K)', 'Social Cut (60s)', 'Reel Cut (30s)', 'Thumbnail', 'Captions File', 'Source Files'],
    defaultTasks: [
      {
        group: 'Pre-Production',
        tasks: [
          { title: 'Creative Brief Preparation', subtasks: ['Review Business Brain', 'Define Objectives', 'Audience Research', 'Style Reference Board'], durationDays: 2 },
          { title: 'Script Writing', subtasks: ['Draft Script', 'Client Review', 'Script Approval'], durationDays: 3 },
          { title: 'Storyboard & Shot List', subtasks: ['Visual Storyboard', 'Shot List Draft', 'Director Review'], durationDays: 2 },
          { title: 'Location Scouting', subtasks: ['Scout Locations', 'Permits & Permissions', 'Final Location Lock'], durationDays: 2 },
          { title: 'Crew & Equipment Booking', subtasks: ['Confirm Creator Assignments', 'Book Equipment', 'Logistics Plan'], durationDays: 1 }
        ]
      },
      {
        group: 'Production',
        tasks: [
          { title: 'On-Location Shoot', subtasks: ['Setup & Rigging', 'Principal Photography', 'B-Roll Capture', 'Drone Coverage', 'Backup Capture', 'Raw Footage Review'], durationDays: 2 },
          { title: 'Post-Shoot Wrap', subtasks: ['Equipment Return', 'Footage Backup & Ingest', 'Shot Log'], durationDays: 1 }
        ]
      },
      {
        group: 'Post-Production',
        tasks: [
          { title: 'Rough Cut Edit', subtasks: ['Assemble Cut', 'Pacing Review', 'Music Selection'], durationDays: 4 },
          { title: 'Client Review Round 1', subtasks: ['Share Rough Cut', 'Collect Feedback', 'Revision Notes'], durationDays: 2 },
          { title: 'Colour Grading', subtasks: ['Primary Grade', 'Secondary Grade', 'LUT Application', 'Brand Colour Match'], durationDays: 2 },
          { title: 'Sound Design & Mix', subtasks: ['Voice Over Recording', 'Sound FX', 'Music Mix', 'Audio Master'], durationDays: 2 },
          { title: 'Motion Graphics & Titles', subtasks: ['Logo Animation', 'Text Overlays', 'Lower Thirds', 'End Card'], durationDays: 2 },
          { title: 'Final Export & QA', subtasks: ['Export All Versions', 'Quality Check', 'File Naming & Organisation'], durationDays: 1 }
        ]
      },
      {
        group: 'Delivery',
        tasks: [
          { title: 'Quality Brain Review', subtasks: ['AI Quality Score', 'Brand Consistency Check', 'Strategy Alignment Check'], durationDays: 1 },
          { title: 'Client Final Approval', subtasks: ['Share Final Cuts', 'Approval Sign-off'], durationDays: 2 },
          { title: 'Asset Delivery', subtasks: ['Organise Cloud Folder', 'Upload to Business Vault', 'Handover Documentation'], durationDays: 1 }
        ]
      }
    ],
    isActive: true
  },
  {
    templateId: 'tmpl_product_video',
    name: 'Product Video',
    category: 'video',
    description: 'High-converting product showcase video for e-commerce and social media.',
    estimatedDuration: 10,
    estimatedComplexity: 'medium',
    budgetRange: { min: 20000, max: 80000, currency: 'INR' },
    requiredCreatorRoles: ['Videographer', 'Video Editor'],
    requiredEquipment: ['Cinema Camera', 'Lens Kit', 'Studio Lighting', 'Turntable', 'Wireless Mic'],
    risks: ['Product availability', 'Studio booking conflict'],
    defaultMilestones: ['Brief Approved', 'Shoot Complete', 'Editing Complete', 'Quality Review', 'Final Delivery'],
    defaultDeliverables: ['Master Video', 'Portrait Reel (9:16)', 'Square Cut (1:1)', 'Thumbnail', 'Source Files'],
    defaultTasks: [
      {
        group: 'Pre-Production',
        tasks: [
          { title: 'Product Brief & Reference', subtasks: ['Product Receive & Review', 'Style Moodboard', 'Shot List'], durationDays: 1 },
          { title: 'Studio Setup', subtasks: ['Book Studio', 'Equipment Prep', 'Lighting Design'], durationDays: 1 }
        ]
      },
      {
        group: 'Production',
        tasks: [
          { title: 'Product Shoot', subtasks: ['Hero Shots', 'Detail Shots', 'Lifestyle Context', 'Turntable', 'Backup'], durationDays: 1 }
        ]
      },
      {
        group: 'Post-Production',
        tasks: [
          { title: 'Edit & Colour', subtasks: ['Assemble Cut', 'Colour Grade', 'Music', 'Text & CTA'], durationDays: 3 },
          { title: 'Revision', subtasks: ['Client Feedback', 'Apply Revisions'], durationDays: 2 },
          { title: 'Final Export', subtasks: ['All Format Exports', 'QA Check'], durationDays: 1 }
        ]
      },
      {
        group: 'Delivery',
        tasks: [
          { title: 'Quality Brain Review', subtasks: ['Score Check', 'Brand Review'], durationDays: 1 },
          { title: 'Client Delivery', subtasks: ['Upload & Share', 'Business Vault Update'], durationDays: 1 }
        ]
      }
    ],
    isActive: true
  },
  {
    templateId: 'tmpl_photography',
    name: 'Photography',
    category: 'photography',
    description: 'Professional photography for products, brands, and events.',
    estimatedDuration: 6,
    estimatedComplexity: 'low',
    budgetRange: { min: 10000, max: 60000, currency: 'INR' },
    requiredCreatorRoles: ['Photographer'],
    requiredEquipment: ['Professional Camera', 'Lens Kit', 'Studio Lighting', 'Reflectors'],
    risks: ['Weather risk for outdoor shoots'],
    defaultMilestones: ['Brief Approved', 'Shoot Complete', 'Editing Complete', 'Final Delivery'],
    defaultDeliverables: ['Full Edited Gallery', 'Hero Shots (10)', 'Social Media Set', 'Print-Ready Files'],
    defaultTasks: [
      {
        group: 'Pre-Production',
        tasks: [
          { title: 'Shot List & Moodboard', subtasks: ['Client Brief Review', 'Style Reference', 'Shot List'], durationDays: 1 },
          { title: 'Logistics', subtasks: ['Location / Studio Booking', 'Model / Prop Arrangement'], durationDays: 1 }
        ]
      },
      {
        group: 'Production',
        tasks: [
          { title: 'Photography Session', subtasks: ['Setup', 'Hero Shots', 'Lifestyle Shots', 'Detail Shots', 'Backup'], durationDays: 1 }
        ]
      },
      {
        group: 'Post-Production',
        tasks: [
          { title: 'Culling & Selection', subtasks: ['Image Cull', 'Best Shot Selection', 'Client Pick'], durationDays: 1 },
          { title: 'Retouching & Export', subtasks: ['Colour Correction', 'Retouching', 'Export All Formats'], durationDays: 2 }
        ]
      },
      {
        group: 'Delivery',
        tasks: [
          { title: 'Quality Review & Delivery', subtasks: ['QA', 'Cloud Upload', 'Business Vault Update'], durationDays: 1 }
        ]
      }
    ],
    isActive: true
  },
  {
    templateId: 'tmpl_brand_identity',
    name: 'Brand Identity',
    category: 'design',
    description: 'Complete brand identity system: logo, colours, typography, guidelines.',
    estimatedDuration: 21,
    estimatedComplexity: 'high',
    budgetRange: { min: 30000, max: 150000, currency: 'INR' },
    requiredCreatorRoles: ['Graphic Designer', 'Brand Strategist'],
    requiredEquipment: [],
    risks: ['Extended revision cycles', 'Client stakeholder alignment delays'],
    defaultMilestones: ['Discovery Complete', 'Concepts Presented', 'Logo Approved', 'Guidelines Complete', 'Final Delivery'],
    defaultDeliverables: ['Logo (all variants)', 'Colour Palette', 'Typography System', 'Brand Guidelines PDF', 'Asset Kit (AI, SVG, PNG, PDF)'],
    defaultTasks: [
      {
        group: 'Discovery',
        tasks: [
          { title: 'Brand Discovery Session', subtasks: ['Client Questionnaire', 'Competitor Analysis', 'Audience Research', 'Brand Personality Definition'], durationDays: 3 }
        ]
      },
      {
        group: 'Concept Development',
        tasks: [
          { title: 'Logo Concepts', subtasks: ['3 Concept Directions', 'Typeface Exploration', 'Symbol Development'], durationDays: 5 },
          { title: 'Client Presentation', subtasks: ['Present Concepts', 'Feedback Round', 'Direction Selection'], durationDays: 2 }
        ]
      },
      {
        group: 'Refinement',
        tasks: [
          { title: 'Logo Refinement', subtasks: ['Refine Selected Direction', 'Variants (Horizontal, Stacked, Icon)', 'Colour Versions'], durationDays: 4 },
          { title: 'Brand System', subtasks: ['Colour Palette', 'Typography', 'Brand Patterns & Textures', 'Photography Style Guide'], durationDays: 3 }
        ]
      },
      {
        group: 'Delivery',
        tasks: [
          { title: 'Brand Guidelines', subtasks: ['Compile PDF Guidelines', 'Usage Rules', 'Do & Don\'t Examples'], durationDays: 2 },
          { title: 'Asset Export', subtasks: ['All File Formats', 'Organised Folder', 'Business Vault Upload'], durationDays: 2 }
        ]
      }
    ],
    isActive: true
  },
  {
    templateId: 'tmpl_social_media',
    name: 'Social Media Monthly',
    category: 'marketing',
    description: 'Monthly social media content creation and management.',
    estimatedDuration: 30,
    estimatedComplexity: 'medium',
    budgetRange: { min: 15000, max: 60000, currency: 'INR' },
    requiredCreatorRoles: ['Graphic Designer', 'Content Writer', 'Digital Marketer'],
    requiredEquipment: [],
    risks: ['Content calendar delays', 'Platform algorithm changes'],
    defaultMilestones: ['Strategy Approved', 'Content Calendar Approved', 'Week 1 Published', 'Week 2 Published', 'Week 3 Published', 'Week 4 Published', 'Monthly Report Delivered'],
    defaultDeliverables: ['Content Calendar', '16+ Posts', '8+ Stories', '4+ Reels', 'Monthly Analytics Report'],
    defaultTasks: [
      {
        group: 'Strategy',
        tasks: [
          { title: 'Content Strategy', subtasks: ['Brand Voice Review', 'Competitor Analysis', 'Content Pillars', 'Posting Schedule'], durationDays: 3 }
        ]
      },
      {
        group: 'Content Creation',
        tasks: [
          { title: 'Week 1 Content', subtasks: ['Design Posts', 'Write Captions', 'Prepare Stories', 'Reel Content'], durationDays: 5 },
          { title: 'Week 2 Content', subtasks: ['Design Posts', 'Write Captions', 'Prepare Stories', 'Reel Content'], durationDays: 5 },
          { title: 'Week 3 Content', subtasks: ['Design Posts', 'Write Captions', 'Prepare Stories', 'Reel Content'], durationDays: 5 },
          { title: 'Week 4 Content', subtasks: ['Design Posts', 'Write Captions', 'Prepare Stories', 'Reel Content'], durationDays: 5 }
        ]
      },
      {
        group: 'Reporting',
        tasks: [
          { title: 'Monthly Analytics Report', subtasks: ['Data Collection', 'Performance Analysis', 'Report Compilation', 'Recommendations'], durationDays: 2 }
        ]
      }
    ],
    isActive: true
  },
  {
    templateId: 'tmpl_website',
    name: 'Website Design & Development',
    category: 'design',
    description: 'Custom website design and development for businesses.',
    estimatedDuration: 30,
    estimatedComplexity: 'high',
    budgetRange: { min: 50000, max: 250000, currency: 'INR' },
    requiredCreatorRoles: ['Web Designer', 'UI Designer'],
    requiredEquipment: [],
    risks: ['Content collection delays', 'Domain/hosting setup time', 'Third-party integration complexity'],
    defaultMilestones: ['Discovery Complete', 'Wireframes Approved', 'Design Approved', 'Development Complete', 'Testing Done', 'Live Launch'],
    defaultDeliverables: ['Full Website', 'Mobile Responsive Version', 'CMS Training', 'Source Code', 'Analytics Setup'],
    defaultTasks: [
      {
        group: 'Discovery & Planning',
        tasks: [
          { title: 'Discovery Workshop', subtasks: ['Goals & Requirements', 'Sitemap Planning', 'Competitor Review', 'Tech Stack Decision'], durationDays: 2 },
          { title: 'Content Planning', subtasks: ['Content Inventory', 'Copywriting Brief', 'Image Requirements'], durationDays: 3 }
        ]
      },
      {
        group: 'Design',
        tasks: [
          { title: 'Wireframing', subtasks: ['Low-Fi Wireframes', 'User Flow Review', 'Client Approval'], durationDays: 4 },
          { title: 'UI Design', subtasks: ['High-Fi Designs', 'Component Library', 'Responsive Design', 'Client Review'], durationDays: 7 }
        ]
      },
      {
        group: 'Development',
        tasks: [
          { title: 'Frontend Development', subtasks: ['Page Development', 'Responsive Breakpoints', 'Animations', 'CMS Integration'], durationDays: 8 },
          { title: 'QA & Testing', subtasks: ['Cross-Browser Testing', 'Mobile Testing', 'Performance Testing', 'SEO Audit', 'Accessibility Check'], durationDays: 3 }
        ]
      },
      {
        group: 'Launch',
        tasks: [
          { title: 'Launch Preparation', subtasks: ['Domain & Hosting Setup', 'SSL Certificate', 'Analytics Setup', 'Final Content Upload'], durationDays: 2 },
          { title: 'Go Live', subtasks: ['Deployment', 'Post-Launch Testing', 'Training Session'], durationDays: 1 }
        ]
      }
    ],
    isActive: true
  }
];

// ── Template Store ────────────────────────────────────────────────────────

function getTemplates() {
  try {
    const stored = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || 'null');
    if (stored && stored.length > 0) return stored;
  } catch { /* use defaults */ }
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(DEFAULT_TEMPLATES));
  return DEFAULT_TEMPLATES;
}

function getPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY) || '[]'); }
  catch { return []; }
}

function savePlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

// ── Planning Brain Engine ─────────────────────────────────────────────────

export const planningBrainService = {
  // ── Templates ───────────────────────────────────────────────────────────

  getTemplates() {
    return getTemplates();
  },

  getTemplate(templateId) {
    return getTemplates().find(t => t.templateId === templateId) || null;
  },

  getTemplateByService(service) {
    const s = (service || '').toLowerCase();
    return getTemplates().find(t =>
      t.name.toLowerCase().includes(s) ||
      s.includes(t.category)
    ) || getTemplates()[0];
  },

  saveTemplate(template) {
    const templates = getTemplates();
    const idx = templates.findIndex(t => t.templateId === template.templateId);
    if (idx >= 0) {
      templates[idx] = { ...templates[idx], ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.push({ ...template, templateId: `tmpl_${Date.now()}`, isActive: true, createdAt: new Date().toISOString() });
    }
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return template;
  },

  // ── Plan Generation ──────────────────────────────────────────────────────

  /**
   * Generate a plan for a project using Planning Brain
   * Customises based on project's business type, budget, and timeline
   */
  generatePlan(project) {
    const template = this.getTemplateByService(project.service);
    const startDate = new Date(project.shootDate || Date.now());
    const now = new Date();

    // Dynamic customisation based on budget
    const budgetNums = (project.budget || '').match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ''), 10)) || [];
    const budgetMid = budgetNums.length > 0 ? (budgetNums[0] + (budgetNums[1] || budgetNums[0])) / 2 : 50000;
    const isHighBudget = budgetMid > 100000;
    const isLowBudget = budgetMid < 30000;

    // Adjust duration based on complexity
    let duration = template.estimatedDuration;
    if (isHighBudget) duration = Math.round(duration * 1.3);
    if (isLowBudget) duration = Math.round(duration * 0.8);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    // Build timeline with risks
    const risks = [...(template.risks || [])];
    if (project.location?.toLowerCase().includes('outdoor') || !project.location) {
      risks.push('Weather risk — buffer day included for outdoor shooting');
    }

    // Build milestones with dates
    let dayOffset = 0;
    const taskGroupDays = template.defaultTasks?.reduce((acc, g) => {
      const groupDays = g.tasks?.reduce((s, t) => s + (t.durationDays || 2), 0) || 0;
      return acc + groupDays;
    }, 0) || duration;

    const milestones = template.defaultMilestones?.map((title, idx) => {
      const milestoneDays = Math.round((idx + 1) * (duration / (template.defaultMilestones.length)));
      const milestoneDate = new Date(startDate);
      milestoneDate.setDate(milestoneDate.getDate() + milestoneDays);
      return {
        id: `ml_${Date.now()}_${idx}`,
        title,
        dueDate: milestoneDate.toISOString().split('T')[0],
        daysFromStart: milestoneDays,
        status: 'pending',
        dependencies: idx > 0 ? [template.defaultMilestones[idx - 1]] : []
      };
    }) || [];

    // Build tasks with sequential dependency logic
    const taskGroups = template.defaultTasks?.map((group, gIdx) => ({
      groupId: `tg_${Date.now()}_${gIdx}`,
      group: group.group,
      tasks: group.tasks?.map((task, tIdx) => ({
        taskId: `tsk_${Date.now()}_${gIdx}_${tIdx}`,
        title: task.title,
        status: 'todo',
        priority: gIdx === 0 ? 'high' : 'medium',
        durationDays: task.durationDays || 2,
        dependencies: tIdx > 0 ? [`tsk_${Date.now()}_${gIdx}_${tIdx - 1}`] : (gIdx > 0 ? ['previous_group'] : []),
        subtasks: task.subtasks?.map((st, sIdx) => ({
          subtaskId: `st_${Date.now()}_${gIdx}_${tIdx}_${sIdx}`,
          title: st,
          status: 'todo'
        })) || [],
        assigneeRole: this._inferRole(task.title, template.requiredCreatorRoles)
      })) || []
    })) || [];

    // Cost estimation
    const costEstimate = {
      creatorCost: Math.round(budgetMid * 0.55),
      equipmentCost: Math.round(budgetMid * 0.10),
      travelCost: Math.round(budgetMid * 0.05),
      accommodationCost: 0,
      postProductionCost: Math.round(budgetMid * 0.15),
      miscCost: Math.round(budgetMid * 0.05),
      platformMargin: Math.round(budgetMid * 0.10),
      totalEstimate: budgetMid
    };

    const planId = `plan_${Date.now()}`;
    const plan = {
      planId,
      projectId: project.id,
      templateId: template.templateId,
      templateName: template.name,
      version: 1,
      status: 'draft',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalDays: duration,
      taskGroups,
      milestones,
      resourcePlan: template.requiredCreatorRoles?.map(role => ({
        role,
        count: 1,
        assigned: false
      })) || [],
      equipmentPlan: template.requiredEquipment?.map(item => ({
        item,
        required: true,
        sourced: false
      })) || [],
      costEstimate,
      risks,
      buffers: {
        planningBuffer: 1,
        weatherBuffer: isHighBudget ? 2 : 1,
        revisionBuffer: 2,
        deliveryBuffer: 1
      },
      deliverables: template.defaultDeliverables || [],
      generatedBy: 'planning_brain',
      generatedAt: now.toISOString(),
      adminNotes: null,
      approvedBy: null,
      approvedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Save plan
    const plans = getPlans();
    plans.push(plan);
    savePlans(plans);

    return plan;
  },

  _inferRole(taskTitle, roles = []) {
    const t = taskTitle.toLowerCase();
    if (t.includes('script') || t.includes('write') || t.includes('copy')) return 'Content Writer';
    if (t.includes('shoot') || t.includes('film') || t.includes('camera')) return roles.find(r => r.includes('Videographer')) || roles[0];
    if (t.includes('edit') || t.includes('colour') || t.includes('color') || t.includes('grade')) return roles.find(r => r.includes('Editor')) || roles[0];
    if (t.includes('motion') || t.includes('graphic') || t.includes('animation')) return roles.find(r => r.includes('Motion')) || roles[0];
    if (t.includes('design') || t.includes('brand')) return roles.find(r => r.includes('Designer')) || roles[0];
    return roles[0] || 'Project Manager';
  },

  // ── Plan Management ──────────────────────────────────────────────────────

  getPlansForProject(projectId) {
    return getPlans().filter(p => p.projectId === projectId).sort((a, b) => b.version - a.version);
  },

  getLatestPlan(projectId) {
    const plans = this.getPlansForProject(projectId);
    return plans[0] || null;
  },

  updatePlan(planId, updates) {
    const plans = getPlans();
    const idx = plans.findIndex(p => p.planId === planId);
    if (idx === -1) return null;
    plans[idx] = { ...plans[idx], ...updates, updatedAt: new Date().toISOString() };
    savePlans(plans);
    return plans[idx];
  },

  approvePlan(planId, adminId = 'admin') {
    return this.updatePlan(planId, {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date().toISOString()
    });
  },

  rejectPlan(planId, notes) {
    return this.updatePlan(planId, { status: 'rejected', adminNotes: notes });
  },

  /**
   * Create a new version of an existing plan
   */
  createRevision(planId, changes) {
    const existing = getPlans().find(p => p.planId === planId);
    if (!existing) return null;
    const newPlan = {
      ...existing,
      ...changes,
      planId: `plan_${Date.now()}`,
      version: existing.version + 1,
      status: 'draft',
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const plans = getPlans();
    plans.push(newPlan);
    savePlans(plans);
    return newPlan;
  },

  /**
   * Get all plans (admin view)
   */
  getAllPlans() {
    return getPlans().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

export default planningBrainService;
