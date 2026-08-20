import { BusinessUnderstandingEngine } from './BusinessUnderstandingEngine.js';

/**
 * Planning Brain Service — AI Project Manager & Scoping Engine
 */
export const PlanningBrainService = {
  /**
   * Generates a complete AI project plan before execution begins
   */
  generateProjectPlan(userId, projectData = {}) {
    const businessProfile = BusinessUnderstandingEngine.getBusinessProfile(userId);
    const serviceType = projectData.service || 'Video Advertisement';

    const baseBudgetNum = parseInt((projectData.budget || '35000').replace(/\D/g, ''), 10) || 35000;
    const internalCostNum = Math.round(baseBudgetNum * 0.65);

    const shootDateObj = projectData.shootDate ? new Date(projectData.shootDate) : new Date();
    const delivDateObj = new Date(shootDateObj);
    delivDateObj.setDate(shootDateObj.getDate() + 7);

    return {
      projectId: projectData.id || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      service: serviceType,
      projectScope: `High-production value ${serviceType} tailored for ${businessProfile.businessName} targeting ${businessProfile.targetAudience}.`,
      deliverables: [
        '1 Main Cinematic Master (16:9 4K)',
        '3 Vertical Social Cutdowns (9:16)',
        'Color Graded High-Res Stills',
        'Raw Footage Archive'
      ],
      timeline: {
        planningDays: 2,
        shootDays: 1,
        editingDays: 3,
        reviewDays: 2,
        expectedCompletionDate: delivDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      dependencies: [
        'Brand Vector Logo & Color Guidelines',
        'Customer Brief Confirmation',
        'Studio Hangar Venue Confirmation'
      ],
      milestones: [
        { title: 'Project Scope & Brief Approved', daysFromStart: 1 },
        { title: 'Creator Assigned & Production Confirmed', daysFromStart: 2 },
        { title: 'Shoot Execution Completed', daysFromStart: 3 },
        { title: 'First Cut Edit Uploaded for Quality QA', daysFromStart: 5 },
        { title: 'Client Review & Deliverable Approval', daysFromStart: 7 }
      ],
      requiredSpecialists: [
        { role: 'Creative Strategist', count: 1 },
        { role: 'Senior Videographer', count: 1 },
        { role: 'Motion Editor', count: 1 }
      ],
      estimatedBudget: projectData.budget || `₹${baseBudgetNum.toLocaleString()}`,
      estimatedInternalCost: `₹${internalCostNum.toLocaleString()}`,
      estimatedCustomerPrice: `₹${baseBudgetNum.toLocaleString()}`,
      reviewStages: [
        'Strategy & Creative Direction Approval',
        'Internal Quality Review (Quality Brain)',
        'Customer Final Review & Approval'
      ],
      approvalPoints: [
        'Customer Strategy Sign-off',
        'Admin Quality Sign-off',
        'Customer Final Deliverable Sign-off'
      ],
      riskIndicators: [
        { risk: 'Studio lighting gear delay', severity: 'Low', mitigation: 'Backup lighting rig available' },
        { risk: 'Customer revision turnaround time', severity: 'Medium', mitigation: '24-hour review SLA notification' }
      ],
      qualityChecklist: [
        '4K UHD Resolution (3840x2160)',
        'Color Spectrum matched to Brand Palette',
        'Royalty-free commercial audio license included',
        'Subtitles & Captions burned into vertical reels'
      ],
      createdAt: new Date().toISOString()
    };
  }
};

export default PlanningBrainService;
