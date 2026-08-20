/**
 * ADDUS Platform — Professional Presence Blueprint Engine
 *
 * Phase 10 implementation:
 *  - Converts diagnosis + evaluation + recommendations into execution plan
 *  - Identifies dependencies and sequencing
 *  - Not a project management task list — an intelligent business execution plan
 */

import { buildDiagnosis } from './diagnosisEngine.js';
import { buildPresenceEvaluation } from './presenceEvaluationEngine.js';
import { RECOMMENDATION_STATUS } from './recommendationEngine.js';

export function buildBlueprint(vault, evidenceItems = [], recommendations = []) {
  const diagnosis = buildDiagnosis(vault, evidenceItems);
  const evaluation = buildPresenceEvaluation(vault, evidenceItems);
  
  const gaps = diagnosis.diagnosis.gaps || [];
  const opportunities = diagnosis.diagnosis.opportunities || [];
  const recs = recommendations || [];
  
  const phases = [];
  const dependencies = [];
  const requiredWork = [];
  const suggestedSequence = [];

  // ─────────────────────────────────────────────────────────
  // Phase 1: Foundation
  // ─────────────────────────────────────────────────────────
  const foundationGaps = gaps.filter(g => 
    ['Business Identity', 'Industry Classification', 'Business Positioning', 'Strategic Clarity'].includes(g.dimension)
  );
  
  if (foundationGaps.length > 0) {
    phases.push({
      phase: 'FOUNDATION',
      title: 'Business Foundation',
      objective: 'Establish clear business identity, positioning, and strategic direction.',
      items: foundationGaps.map(g => ({
        workId: `WORK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'FOUNDATION',
        description: g.observation,
        dimension: g.dimension,
        impact: g.impact || 'Blocks all downstream creative work',
        status: 'PENDING'
      })),
      estimatedEffort: '1-2 weeks'
    });
    suggestedSequence.push('FOUNDATION');
  }

  // ─────────────────────────────────────────────────────────
  // Phase 2: Digital Presence
  // ─────────────────────────────────────────────────────────
  const digitalGaps = gaps.filter(g => 
    ['Website', 'Discoverability', 'Customer-Facing Experience'].includes(g.dimension)
  );
  
  if (digitalGaps.length > 0 || opportunities.some(o => o.dimension === 'Digital Presence')) {
    phases.push({
      phase: 'DIGITAL_PRESENCE',
      title: 'Digital Presence',
      objective: 'Build or repair the primary digital touchpoint.',
      items: digitalGaps.length > 0 ? digitalGaps.map(g => ({
        workId: `WORK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'DIGITAL',
        description: g.observation,
        dimension: g.dimension,
        impact: g.impact || 'Affects customer acquisition',
        status: 'PENDING'
      })) : [{
        workId: `WORK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'DIGITAL',
        description: 'Enhance digital presence',
        dimension: 'Digital Presence',
        impact: 'Improves online discoverability',
        status: 'PENDING'
      }],
      estimatedEffort: '2-6 weeks',
      dependencies: foundationGaps.length > 0 ? ['FOUNDATION'] : []
    });
    if (!suggestedSequence.includes('DIGITAL_PRESENCE')) {
      suggestedSequence.push('DIGITAL_PRESENCE');
    }
  }

  // ─────────────────────────────────────────────────────────
  // Phase 3: Brand Identity
  // ─────────────────────────────────────────────────────────
  const brandGaps = gaps.filter(g => 
    ['Brand Identity', 'Brand Assets'].includes(g.dimension)
  );
  
  if (brandGaps.length > 0 || opportunities.some(o => ['Brand Identity', 'Visual Content', 'Video Content'].includes(o.dimension))) {
    phases.push({
      phase: 'BRAND_IDENTITY',
      title: 'Brand Identity',
      objective: 'Create or refine visual brand identity and assets.',
      items: brandGaps.length > 0 ? brandGaps.map(g => ({
        workId: `WORK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'BRAND',
        description: g.observation,
        dimension: g.dimension,
        impact: g.impact || 'Affects brand recognition',
        status: 'PENDING'
      })) : [{
        workId: `WORK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'BRAND',
        description: 'Strengthen brand identity',
        dimension: 'Brand Identity',
        impact: 'Improves brand consistency',
        status: 'PENDING'
      }],
      estimatedEffort: '2-4 weeks',
      dependencies: foundationGaps.length > 0 ? ['FOUNDATION'] : []
    });
    if (!suggestedSequence.includes('BRAND_IDENTITY')) {
      suggestedSequence.push('BRAND_IDENTITY');
    }
  }

  // ─────────────────────────────────────────────────────────
  // Phase 4: Content & Communication
  // ─────────────────────────────────────────────────────────
  const contentGaps = gaps.filter(g => 
    ['Content', 'Communication', 'Consistency', 'Social Presence'].includes(g.dimension)
  );
  
  if (contentGaps.length > 0) {
    phases.push({
      phase: 'CONTENT_COMMUNICATION',
      title: 'Content & Communication',
      objective: 'Develop content strategy and communication channels.',
      items: contentGaps.map(g => ({
        workId: `WORK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'CONTENT',
        description: g.observation,
        dimension: g.dimension,
        impact: g.impact || 'Affects audience engagement',
        status: 'PENDING'
      })),
      estimatedEffort: '2-8 weeks',
      dependencies: [...(foundationGaps.length > 0 ? ['FOUNDATION'] : []), 'DIGITAL_PRESENCE', 'BRAND_IDENTITY'].filter((v, i, a) => a.indexOf(v) === i)
    });
    suggestedSequence.push('CONTENT_COMMUNICATION');
  }

  // ─────────────────────────────────────────────────────────
  // Phase 5: Trust & Conversion Optimization
  // ─────────────────────────────────────────────────────────
  const trustGaps = gaps.filter(g => 
    ['Trust Signals', 'Customer-Facing Experience'].includes(g.dimension)
  );
  
  if (trustGaps.length > 0) {
    phases.push({
      phase: 'TRUST_CONVERSION',
      title: 'Trust & Conversion Optimization',
      objective: 'Strengthen trust signals and conversion pathways.',
      items: trustGaps.map(g => ({
        workId: `WORK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'TRUST',
        description: g.observation,
        dimension: g.dimension,
        impact: g.impact || 'Affects conversion rates',
        status: 'PENDING'
      })),
      estimatedEffort: '1-4 weeks',
      dependencies: ['DIGITAL_PRESENCE', 'BRAND_IDENTITY']
    });
    suggestedSequence.push('TRUST_CONVERSION');
  }

  // ─────────────────────────────────────────────────────────
  // Build required work list
  // ─────────────────────────────────────────────────────────
  for (const phase of phases) {
    for (const item of phase.items) {
      requiredWork.push({
        ...item,
        phase: phase.phase,
        phaseTitle: phase.title
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // Build dependencies
  // ─────────────────────────────────────────────────────────
  for (const phase of phases) {
    if (phase.dependencies && phase.dependencies.length > 0) {
      dependencies.push({
        phase: phase.phase,
        dependsOn: phase.dependencies
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // Expected outcome
  // ─────────────────────────────────────────────────────────
  const evaluatedDimensions = Object.values(evaluation.evaluation.dimensions).filter(d => d.score !== null);
  const avgScore = evaluatedDimensions.length > 0
    ? Math.round(evaluatedDimensions.reduce((sum, d) => sum + d.score, 0) / evaluatedDimensions.length)
    : 0;

  return {
    blueprint: {
      business: vault.businessName || 'Business',
      currentState: {
        overallScore: avgScore,
        evaluatedDimensions: evaluatedDimensions.length,
        totalDimensions: evaluation.evaluation.totalDimensions,
        strengths: diagnosis.diagnosis.strengths.map(s => s.observation),
        criticalGaps: gaps.filter(g => g.impact?.includes('Blocks') || g.impact?.includes('critical')).map(g => g.observation)
      },
      diagnosis: diagnosis.diagnosis,
      priorities: requiredWork.sort((a, b) => {
        const order = { FOUNDATION: 0, DIGITAL: 1, BRAND: 2, CONTENT: 3, TRUST: 4 };
        return (order[a.type] || 9) - (order[b.type] || 9);
      }),
      requiredWork,
      dependencies,
      specialists: [], // Populated by specialist matching
      execution: {
        phases: phases.map(p => ({
          name: p.phase,
          title: p.title,
          objective: p.objective,
          estimatedEffort: p.estimatedEffort,
          workItems: p.items.length
        })),
        suggestedSequence,
        totalEstimatedWeeks: phases.reduce((sum, p) => {
          const weeks = parseInt(p.estimatedEffort) || 2;
          return sum + weeks;
        }, 0)
      },
      expectedOutcome: {
        description: `Improve professional presence from ${avgScore}/100 to a competitive baseline through structured execution.`,
        successMetrics: [
          'Complete all foundation items',
          'Launch or repair digital presence',
          'Establish brand identity',
          'Publish consistent content',
          'Implement trust signals'
        ]
      }
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'deterministic',
      phaseCount: phases.length,
      workItemCount: requiredWork.length
    }
  };
}
