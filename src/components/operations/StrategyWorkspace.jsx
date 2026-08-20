import React, { useState } from 'react';
import { Brain, Save, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { updateProjectInStore } from '../../store/projectStore.js';

export function StrategyWorkspace({ project, onUpdate, isReadOnly = false }) {
  const initialStrat = project?.strategyWorkspace || {
    businessSummary: '',
    businessGoals: '',
    targetAudience: '',
    objectives: '',
    deliverables: '',
    competitorNotes: '',
    creativeDirection: '',
    references: '',
    risks: '',
    recommendations: '',
    isApproved: false
  };

  const [form, setForm] = useState(initialStrat);
  const [savedMsg, setSavedMsg] = useState('');

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (approve = false) => {
    const updatedStrategy = {
      ...form,
      isApproved: approve ? true : form.isApproved,
      updatedAt: new Date().toISOString()
    };

    const patch = {
      strategyWorkspace: updatedStrategy,
      ...(approve ? { status: 'Waiting for Customer Approval' } : {})
    };

    updateProjectInStore(project.id, patch, { actor: 'Admin Strategist', role: 'Admin' });
    setSavedMsg(approve ? 'Strategy Approved & Sent for Customer Review!' : 'Strategy Workspace Saved Successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
    if (onUpdate) onUpdate();
  };

  return (
    <div className="strategy-workspace-card">
      <div className="strategy-ws-header">
        <div>
          <h3><Brain size={18} className="inline-icon text-indigo" /> Business Strategy Workspace</h3>
          <p className="strategy-ws-sub">Formulate creative direction, audience targeting, deliverables, and risk analysis.</p>
        </div>
        <div className="flex-center-gap">
          {form.isApproved ? (
            <span className="badge-approved-green"><CheckCircle size={14} /> Strategy Approved</span>
          ) : (
            <span className="badge-draft-yellow"><Sparkles size={14} /> Draft Strategy</span>
          )}
        </div>
      </div>

      {savedMsg && <div className="strategy-alert-success">{savedMsg}</div>}

      <div className="strategy-grid margin-top-16">
        <div className="strat-field-box">
          <label className="strat-label">1. Business Summary</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.businessSummary}
            disabled={isReadOnly}
            onChange={e => handleChange('businessSummary', e.target.value)}
            placeholder="Core business offering, value proposition, and key background..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">2. Business Goals &amp; KPIs</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.businessGoals}
            disabled={isReadOnly}
            onChange={e => handleChange('businessGoals', e.target.value)}
            placeholder="Target conversion lift, brand positioning, engagement metrics..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">3. Target Audience Profile</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.targetAudience}
            disabled={isReadOnly}
            onChange={e => handleChange('targetAudience', e.target.value)}
            placeholder="Demographics, psychographics, consumer pain points..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">4. Strategic Objectives</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.objectives}
            disabled={isReadOnly}
            onChange={e => handleChange('objectives', e.target.value)}
            placeholder="Primary campaign goals (e.g. 4K Brand Film + social cutdowns)..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">5. Deliverables Scope</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.deliverables}
            disabled={isReadOnly}
            onChange={e => handleChange('deliverables', e.target.value)}
            placeholder="Exact format specifications, aspect ratios, sound requirements..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">6. Competitor Analysis &amp; Benchmarks</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.competitorNotes}
            disabled={isReadOnly}
            onChange={e => handleChange('competitorNotes', e.target.value)}
            placeholder="Competitor creative tactics, market differentiation..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">7. Creative Direction &amp; Aesthetics</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.creativeDirection}
            disabled={isReadOnly}
            onChange={e => handleChange('creativeDirection', e.target.value)}
            placeholder="Lighting, pacing, color palette, mood board guidance..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">8. Creative References &amp; Links</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.references}
            disabled={isReadOnly}
            onChange={e => handleChange('references', e.target.value)}
            placeholder="Reference URLs, moodboard links, inspiration videos..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">9. Production Risks &amp; Mitigation</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.risks}
            disabled={isReadOnly}
            onChange={e => handleChange('risks', e.target.value)}
            placeholder="Weather, venue constraints, cast availability, backup plans..."
          />
        </div>

        <div className="strat-field-box">
          <label className="strat-label">10. Strategic Recommendations</label>
          <textarea
            className="strat-textarea"
            rows={3}
            value={form.recommendations}
            disabled={isReadOnly}
            onChange={e => handleChange('recommendations', e.target.value)}
            placeholder="Recommended distribution channels, ad variation testing..."
          />
        </div>
      </div>

      {!isReadOnly && (
        <div className="strategy-ws-actions margin-top-20">
          <button type="button" className="duolingo-secondary-btn" onClick={() => handleSave(false)}>
            <Save size={16} /> Save Strategy Draft
          </button>
          <button type="button" className="admin-primary-btn" onClick={() => handleSave(true)}>
            <CheckCircle size={16} /> Approve Strategy &amp; Send to Customer
          </button>
        </div>
      )}
    </div>
  );
}

export default StrategyWorkspace;
