import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle, CheckCircle, HelpCircle, Lightbulb, FileText, Globe, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { apiService } from '../services/apiService.js';

const CLASSIFICATION_COLORS = {
  FACT: '#34d399',
  INFERENCE: '#fbbf24',
  RECOMMENDATION: '#7c5cff',
  QUESTION: '#60a5fa'
};

const STATUS_COLORS = {
  RECOMMENDED: '#34d399',
  POTENTIAL_OPPORTUNITY: '#fbbf24',
  NOT_CURRENTLY_SUGGESTED: '#94a3b8',
  ALREADY_SUFFICIENT: '#34d399',
  NEEDS_REVIEW: '#f87171'
};

export function BusinessIntelligence() {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadIntelligence = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.post('/intelligence', {});
      setIntelligence(result.result || null);
    } catch (err) {
      setError(err.message || 'Failed to load business intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntelligence();
  }, []);

  if (loading) {
    return (
      <div className="admin-card flex-center" style={{ padding: '40px', color: '#9CA3AF' }}>
        <Brain className="spin" size={24} style={{ marginRight: 12 }} />
        <span>ADDI is analyzing your business...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ padding: '24px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#F87171' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
        <button className="duolingo-secondary-btn micro-btn" style={{ marginTop: 12 }} onClick={loadIntelligence}>Retry</button>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className="admin-card" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
        <Brain size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
        <p>No business intelligence available yet.</p>
        <button className="duolingo-primary-btn micro-btn" style={{ marginTop: 16 }} onClick={loadIntelligence}>Run Analysis</button>
      </div>
    );
  }

  const eq = intelligence.evidenceQuality || {};
  const snapshot = intelligence.businessSnapshot || {};
  const serviceAssessments = Array.isArray(intelligence.serviceAssessments) ? intelligence.serviceAssessments : [];
  const existingAssets = Array.isArray(intelligence.existingAssets) ? intelligence.existingAssets : [];
  const websiteAssessment = intelligence.websiteAssessment || null;
  const roadmap = Array.isArray(intelligence.roadmap) ? intelligence.roadmap : [];

  return (
    <div className="business-intelligence">
      {/* Evidence Quality */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <ShieldCheck size={20} style={{ color: '#7c5cff' }} />
          <h3 style={{ margin: 0 }}>Evidence Quality</h3>
          <span className="admin-badge admin-badge-grey" style={{ marginLeft: 'auto' }}>
            {eq.score ?? 0}/100
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 8px 0' }}>{eq.assessment || 'No assessment available'}</p>
        {Array.isArray(eq.gaps) && eq.gaps.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '12px', color: '#FBBF24' }}>
            {eq.gaps.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        )}
      </div>

      {/* Business Snapshot */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Brain size={18} style={{ color: '#7c5cff' }} /> Business Snapshot
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Known', items: snapshot.known, color: '#34d399', icon: CheckCircle },
            { label: 'Inferred', items: snapshot.inferred, color: '#fbbf24', icon: Lightbulb },
            { label: 'Missing', items: snapshot.missing, color: '#F87171', icon: AlertCircle },
            { label: 'Questions', items: snapshot.questions, color: '#60a5fa', icon: HelpCircle }
          ].map(({ label, items, color, icon: Icon }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color }}>
                <Icon size={14} />
                <strong style={{ fontSize: '12px', textTransform: 'uppercase' }}>{label}</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '12px', color: '#E0E0E0' }}>
                {(items || []).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Website Assessment */}
      {websiteAssessment && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Globe size={18} style={{ color: '#7c5cff' }} /> Website Assessment
          </h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="admin-badge" style={{ background: `${STATUS_COLORS[websiteAssessment.status] || '#94a3b8'}20`, color: STATUS_COLORS[websiteAssessment.status] || '#94a3b8', border: `1px solid ${STATUS_COLORS[websiteAssessment.status] || '#94a3b8'}40` }}>
              {websiteAssessment.status || 'UNKNOWN'}
            </span>
            <span className="admin-badge admin-badge-grey">{websiteAssessment.confidence || 'UNKNOWN'} confidence</span>
            <span className="admin-badge admin-badge-grey" style={{ background: `${CLASSIFICATION_COLORS[websiteAssessment.classification] || '#94a3b8'}20`, color: CLASSIFICATION_COLORS[websiteAssessment.classification] || '#94a3b8', border: `1px solid ${CLASSIFICATION_COLORS[websiteAssessment.classification] || '#94a3b8'}40` }}>
              {websiteAssessment.classification || 'UNKNOWN'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#E0E0E0', margin: '0 0 12px 0' }}>{websiteAssessment.observation}</p>
          {Array.isArray(websiteAssessment.strengths) && websiteAssessment.strengths.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: '12px', color: '#34d399' }}>Strengths:</strong>
              <ul style={{ margin: 4, paddingLeft: 20, fontSize: '12px', color: '#E0E0E0' }}>
                {websiteAssessment.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {Array.isArray(websiteAssessment.weaknesses) && websiteAssessment.weaknesses.length > 0 && (
            <div>
              <strong style={{ fontSize: '12px', color: '#F87171' }}>Weaknesses:</strong>
              <ul style={{ margin: 4, paddingLeft: 20, fontSize: '12px', color: '#E0E0E0' }}>
                {websiteAssessment.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Service Assessments */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TrendingUp size={18} style={{ color: '#7c5cff' }} /> Service Assessments
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {serviceAssessments.map((assessment, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12, borderLeft: `3px solid ${STATUS_COLORS[assessment.status] || '#94a3b8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: '13px' }}>{assessment.serviceName || assessment.serviceId}</strong>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span className="admin-badge" style={{ background: `${STATUS_COLORS[assessment.status] || '#94a3b8'}20`, color: STATUS_COLORS[assessment.status] || '#94a3b8', border: `1px solid ${STATUS_COLORS[assessment.status] || '#94a3b8'}40`, fontSize: '10px' }}>
                    {assessment.status}
                  </span>
                  <span className="admin-badge admin-badge-grey" style={{ background: `${CLASSIFICATION_COLORS[assessment.classification] || '#94a3b8'}20`, color: CLASSIFICATION_COLORS[assessment.classification] || '#94a3b8', border: `1px solid ${CLASSIFICATION_COLORS[assessment.classification] || '#94a3b8'}40`, fontSize: '10px' }}>
                    {assessment.classification}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 6px 0' }}>{assessment.observation}</p>
              {assessment.reasoning && (
                <p style={{ fontSize: '11px', color: '#7c5cff', margin: '0 0 6px 0' }}>
                  <strong>Reasoning:</strong> {assessment.reasoning}
                </p>
              )}
              {assessment.gap && (
                <p style={{ fontSize: '11px', color: '#FBBF24', margin: 0 }}>
                  <strong>Gap:</strong> {assessment.gap}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      {roadmap.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={18} style={{ color: '#7c5cff' }} /> Recommended Roadmap
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roadmap.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 12 }}>
                <span className="admin-badge admin-badge-grey" style={{ minWidth: 24, textAlign: 'center' }}>{idx + 1}</span>
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <strong style={{ fontSize: '13px' }}>{step.title}</strong>
                    <span className="admin-badge" style={{ background: `${STATUS_COLORS[step.priority] || '#94a3b8'}20`, color: STATUS_COLORS[step.priority] || '#94a3b8', border: `1px solid ${STATUS_COLORS[step.priority] || '#94a3b8'}40`, fontSize: '10px' }}>
                      {step.priority}
                    </span>
                  </div>
                  {step.reasoning && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 4px 0' }}>{step.reasoning}</p>}
                  <p style={{ fontSize: '11px', color: '#7c5cff', margin: 0 }}>{step.estimatedTimeline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Questions */}
      {Array.isArray(intelligence.questions) && intelligence.questions.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <HelpCircle size={18} style={{ color: '#7c5cff' }} /> Next Questions
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '13px', color: '#E0E0E0' }}>
            {intelligence.questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </div>
      )}

      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <button className="duolingo-secondary-btn micro-btn" onClick={loadIntelligence}>
          Refresh Analysis
        </button>
      </div>
    </div>
  );
}
