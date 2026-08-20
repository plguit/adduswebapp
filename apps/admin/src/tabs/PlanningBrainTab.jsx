import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, Plus, Edit3, Trash2, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, Calendar, Users, Package, AlertTriangle,
  Eye, RefreshCw, LayoutGrid, List, Save, DollarSign, Flag, Layers,
  TrendingUp, Play, FileText
} from 'lucide-react';
import { planningBrainService } from '../../../../ai/planning-brain/planningBrainService.js';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';
import { adminApiService } from '../services/adminApiService.js';

const STATUS_COLOR = {
  draft: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  submitted: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  approved: { color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  rejected: { color: '#F87171', bg: 'rgba(248,113,113,0.15)' }
};

export function PlanningBrainTab({ dataSource = 'localStorage', adminReady = false }) {
  const [section, setSection] = useState('plans'); // plans | templates | generate
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generateProjectId, setGenerateProjectId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  const refresh = async () => {
    try {
      setPlans(planningBrainService.getAllPlans());
      setTemplates(planningBrainService.getTemplates());
      if (dataSource === 'backend' && adminReady) {
        const res = await adminApiService.getProjects();
        setProjects(res.projects || []);
      } else {
        setProjects(getAllProjectsAcrossUsers());
      }
    } catch (e) {
      console.warn('[PlanningBrainTab] backend load failed, falling back to localStorage:', e.message);
      setPlans(planningBrainService.getAllPlans());
      setTemplates(planningBrainService.getTemplates());
      setProjects(getAllProjectsAcrossUsers());
    }
  };

  useEffect(() => { refresh(); }, [dataSource, adminReady]);

  const handleGenerate = () => {
    if (!generateProjectId) return;
    const project = projects.find(p => p.id === generateProjectId);
    if (!project) return;
    setGenerating(true);
    setTimeout(() => {
      const plan = planningBrainService.generatePlan(project);
      setGenerating(false);
      setPlans(planningBrainService.getAllPlans());
      setSelectedPlan(plan);
      setSection('plans');
    }, 1500);
  };

  const handleApprovePlan = (plan) => {
    planningBrainService.approvePlan(plan.planId);
    refresh();
    setSelectedPlan(planningBrainService.getAllPlans().find(p => p.planId === plan.planId));
  };

  const handleRejectPlan = (plan) => {
    planningBrainService.rejectPlan(plan.planId, 'Rejected by admin for revision.');
    refresh();
    setSelectedPlan(planningBrainService.getAllPlans().find(p => p.planId === plan.planId));
  };

  const stats = {
    total: plans.length,
    draft: plans.filter(p => p.status === 'draft').length,
    approved: plans.filter(p => p.status === 'approved').length,
    pending: plans.filter(p => p.status === 'submitted').length
  };

  if (selectedPlan) {
    return <PlanDetailView plan={selectedPlan} onBack={() => setSelectedPlan(null)} onApprove={() => handleApprovePlan(selectedPlan)} onReject={() => handleRejectPlan(selectedPlan)} />;
  }

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Planning Brain</h2>
          <p className="admin-section-sub">AI-powered project planning engine. Generate, review, and approve execution plans.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['plans', 'templates', 'generate'].map(s => (
            <button key={s} className={`admin-primary-btn micro-btn ${section === s ? '' : 'duolingo-secondary-btn'}`} onClick={() => setSection(s)}>
              {s === 'plans' ? <><List size={14} /> Plans</> : s === 'templates' ? <><Layers size={14} /> Templates</> : <><Play size={14} /> Generate</>}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="admin-kpi-grid margin-top-16">
        {[
          { label: 'Total Plans', value: stats.total, color: '#818CF8', icon: BrainCircuit },
          { label: 'Draft', value: stats.draft, color: '#6B7280', icon: Clock },
          { label: 'Approved', value: stats.approved, color: '#34D399', icon: CheckCircle },
          { label: 'Templates', value: templates.length, color: '#60A5FA', icon: Layers }
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="admin-kpi-card">
            <div className="kpi-icon-wrap" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div className="kpi-body">
              <span className="kpi-label">{label}</span>
              <h3 className="kpi-value">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── Generate Section ── */}
      {section === 'generate' && (
        <div className="admin-card-box margin-top-20">
          <div className="card-box-header">
            <h3><Play size={18} className="inline-icon" /> Generate Project Plan</h3>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '8px' }}>
            Select a confirmed project and the Planning Brain will automatically generate a complete execution plan.
          </p>
          <div className="creator-form-field margin-top-16">
            <label>Select Project</label>
            <select className="creator-select" value={generateProjectId} onChange={e => setGenerateProjectId(e.target.value)}>
              <option value="">-- Select a project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} — {p.service || 'Unknown Service'} ({p.status})</option>
              ))}
            </select>
          </div>
          <button
            className="admin-primary-btn margin-top-12"
            onClick={handleGenerate}
            disabled={!generateProjectId || generating}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {generating ? (
              <><RefreshCw size={16} className="spin-icon" /> Planning Brain is thinking...</>
            ) : (
              <><BrainCircuit size={16} /> Generate Plan</>
            )}
          </button>
        </div>
      )}

      {/* ── Plans List ── */}
      {section === 'plans' && (
        <div className="margin-top-20">
          {plans.length === 0 ? (
            <div className="admin-empty-state">
              <BrainCircuit size={40} style={{ color: '#374151' }} />
              <p>No plans generated yet. Go to the "Generate" section to create your first plan.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {plans.map(plan => {
                const sc = STATUS_COLOR[plan.status] || STATUS_COLOR.draft;
                return (
                  <div key={plan.planId} className="admin-review-card">
                    <div className="arc-header">
                      <div>
                        <div className="arc-business-name">{plan.templateName || 'Project Plan'}</div>
                        <div className="arc-meta">
                          Plan: <strong style={{ color: '#818CF8' }}>{plan.planId}</strong> · Project: {plan.projectId} · v{plan.version}
                        </div>
                      </div>
                      <span className="admin-badge" style={{ color: sc.color, background: sc.bg }}>{plan.status}</span>
                    </div>

                    <div className="arc-brain-snapshot margin-top-12">
                      <div className="arc-brain-row"><span className="arc-brain-label">Start Date:</span><span>{plan.startDate}</span></div>
                      <div className="arc-brain-row"><span className="arc-brain-label">End Date:</span><span>{plan.endDate}</span></div>
                      <div className="arc-brain-row"><span className="arc-brain-label">Duration:</span><span>{plan.totalDays} days</span></div>
                      <div className="arc-brain-row"><span className="arc-brain-label">Milestones:</span><span>{plan.milestones?.length || 0}</span></div>
                      <div className="arc-brain-row"><span className="arc-brain-label">Est. Budget:</span><span style={{ color: '#34D399' }}>₹{(plan.costEstimate?.totalEstimate || 0).toLocaleString('en-IN')}</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                      <button className="admin-primary-btn micro-btn" onClick={() => setSelectedPlan(plan)}>
                        <Eye size={14} /> View Plan
                      </button>
                      {plan.status === 'draft' && (
                        <>
                          <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }} onClick={() => handleApprovePlan(plan)}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button className="admin-icon-btn text-danger" onClick={() => handleRejectPlan(plan)} title="Reject"><XCircle size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Templates ── */}
      {section === 'templates' && (
        <div className="margin-top-20">
          <div style={{ display: 'grid', gap: '14px' }}>
            {templates.map(tmpl => (
              <div key={tmpl.templateId} className="admin-review-card">
                <div className="arc-header">
                  <div>
                    <div className="arc-business-name">{tmpl.name}</div>
                    <div className="arc-meta">{tmpl.category} · {tmpl.estimatedDuration} days · {tmpl.estimatedComplexity} complexity</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="admin-badge" style={{ color: tmpl.isActive ? '#34D399' : '#6B7280', background: tmpl.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(107,114,128,0.1)' }}>
                      {tmpl.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="arc-brain-snapshot margin-top-8">
                  <div className="arc-brain-row"><span className="arc-brain-label">Budget Range:</span><span>₹{(tmpl.budgetRange?.min || 0).toLocaleString('en-IN')} – ₹{(tmpl.budgetRange?.max || 0).toLocaleString('en-IN')}</span></div>
                  <div className="arc-brain-row"><span className="arc-brain-label">Milestones:</span><span>{tmpl.defaultMilestones?.length || 0}</span></div>
                  <div className="arc-brain-row"><span className="arc-brain-label">Deliverables:</span><span>{tmpl.defaultDeliverables?.length || 0}</span></div>
                  <div className="arc-brain-row"><span className="arc-brain-label">Creator Roles:</span><span>{tmpl.requiredCreatorRoles?.join(', ') || '—'}</span></div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <h5 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '6px' }}>Risks:</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(tmpl.risks || []).map((r, i) => (
                      <span key={i} style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', borderRadius: '6px', padding: '3px 8px', fontSize: '11px' }}>⚠ {r}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Plan Detail View ──────────────────────────────────────────────────────

function PlanDetailView({ plan, onBack, onApprove, onReject }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const sc = STATUS_COLOR[plan.status] || STATUS_COLOR.draft;

  const toggleGroup = (groupId) => setExpandedGroups(p => ({ ...p, [groupId]: !p[groupId] }));

  return (
    <div className="admin-tab-content fade-in">
      <div className="flex-between margin-bottom-20">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="duolingo-secondary-btn micro-btn" onClick={onBack}>← Back to Plans</button>
          <div>
            <h2 style={{ margin: 0 }}>{plan.templateName}</h2>
            <span style={{ color: '#818CF8', fontSize: '12px' }}>{plan.planId} · Project: {plan.projectId} · v{plan.version}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {plan.status === 'draft' && (
            <>
              <button className="admin-primary-btn micro-btn" style={{ background: '#34D39920', color: '#34D399', border: '1px solid #34D39940' }} onClick={onApprove}>
                <CheckCircle size={14} /> Approve Plan
              </button>
              <button className="admin-primary-btn micro-btn" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)' }} onClick={onReject}>
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          <span className="admin-badge" style={{ color: sc.color, background: sc.bg, padding: '6px 12px' }}>{plan.status}</span>
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="admin-kpi-grid margin-bottom-20">
        {[
          { label: 'Start Date', value: plan.startDate, color: '#60A5FA' },
          { label: 'End Date', value: plan.endDate, color: '#818CF8' },
          { label: 'Total Duration', value: `${plan.totalDays} days`, color: '#FBBF24' },
          { label: 'Budget Estimate', value: `₹${(plan.costEstimate?.totalEstimate || 0).toLocaleString('en-IN')}`, color: '#34D399' }
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-kpi-card">
            <div className="kpi-body">
              <span className="kpi-label">{label}</span>
              <h3 className="kpi-value" style={{ color, fontSize: '14px' }}>{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Task Groups */}
      <div className="admin-card-box margin-bottom-20">
        <div className="card-box-header"><h3>Task Breakdown</h3></div>
        <div style={{ marginTop: '12px' }}>
          {(plan.taskGroups || []).map(group => (
            <div key={group.groupId} className="plan-task-group">
              <button
                className="plan-task-group-header"
                onClick={() => toggleGroup(group.groupId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {expandedGroups[group.groupId] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <strong>{group.group}</strong>
                  <span className="admin-count-chip">{group.tasks?.length || 0} tasks</span>
                </div>
              </button>
              {expandedGroups[group.groupId] && (
                <div className="plan-task-list">
                  {(group.tasks || []).map(task => (
                    <div key={task.taskId} className="plan-task-item">
                      <div className="plan-task-header">
                        <span className="plan-task-title">{task.title}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {task.assigneeRole && <span className="creator-role-tag">{task.assigneeRole}</span>}
                          <span className="text-muted text-xs">{task.durationDays}d</span>
                        </div>
                      </div>
                      {(task.subtasks || []).length > 0 && (
                        <div className="plan-subtask-list">
                          {task.subtasks.map(st => (
                            <div key={st.subtaskId} className="plan-subtask-item">
                              <div className="plan-subtask-dot" /> {st.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="admin-card-box margin-bottom-20">
        <div className="card-box-header"><h3>Milestones</h3></div>
        <div className="plan-milestones-list margin-top-12">
          {(plan.milestones || []).map((m, i) => (
            <div key={m.id || i} className="plan-milestone-item">
              <div className="plan-milestone-dot" />
              <div className="plan-milestone-info">
                <span className="plan-milestone-title">{m.title}</span>
                <span className="text-muted text-xs">Due: {m.dueDate} · Day {m.daysFromStart}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource & Equipment */}
      <div className="grid-2-col margin-bottom-20">
        <div className="admin-card-box">
          <div className="card-box-header"><h3><Users size={16} className="inline-icon" /> Resource Plan</h3></div>
          {(plan.resourcePlan || []).map((r, i) => (
            <div key={i} className="plan-resource-row">
              <span>{r.role}</span>
              <span className="admin-badge" style={{ color: r.assigned ? '#34D399' : '#FBBF24', background: r.assigned ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)' }}>
                {r.assigned ? 'Assigned' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
        <div className="admin-card-box">
          <div className="card-box-header"><h3><Package size={16} className="inline-icon" /> Equipment Plan</h3></div>
          {(plan.equipmentPlan || []).map((e, i) => (
            <div key={i} className="plan-resource-row">
              <span>{e.item}</span>
              <span className="admin-badge" style={{ color: e.sourced ? '#34D399' : '#FBBF24', background: e.sourced ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)' }}>
                {e.sourced ? 'Sourced' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      {(plan.risks || []).length > 0 && (
        <div className="admin-card-box margin-bottom-20">
          <div className="card-box-header"><h3><AlertTriangle size={16} className="inline-icon" /> Risk Assessment</h3></div>
          {plan.risks.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#FBBF24', fontSize: '13px' }}>
              <Flag size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> {r}
            </div>
          ))}
        </div>
      )}

      {/* Cost Estimate */}
      <div className="admin-card-box">
        <div className="card-box-header"><h3><DollarSign size={16} className="inline-icon" /> Cost Estimate</h3></div>
        <div className="margin-top-12">
          {Object.entries(plan.costEstimate || {}).filter(([k]) => k !== 'totalEstimate').map(([key, val]) => (
            <div key={key} className="creator-pricing-row">
              <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
              <span className="creator-pricing-val">₹{Number(val || 0).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="creator-pricing-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '8px' }}>
            <strong>Total Estimate</strong>
            <strong className="text-emerald">₹{Number(plan.costEstimate?.totalEstimate || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanningBrainTab;
