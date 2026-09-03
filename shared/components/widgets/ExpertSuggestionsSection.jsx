import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, Zap, Shield, AlertTriangle } from 'lucide-react';

const STATUS_STYLE = {
  RECOMMENDED:             { color: '#34D399', label: 'RECOMMENDED', emoji: '✅' },
  POTENTIAL_OPPORTUNITY:   { color: '#FBBF24', label: 'OPPORTUNITY', emoji: '💡' },
  NOT_CURRENTLY_SUGGESTED: { color: '#6B7280', label: 'NOT NEEDED NOW', emoji: '⏸' },
  ALREADY_SUFFICIENT:      { color: '#60A5FA', label: 'ALREADY COVERED', emoji: '✓' },
  NEEDS_REVIEW:            { color: '#F87171', label: 'EXPERT REVIEW', emoji: '⚠' }
};

/**
 * ExpertSuggestionsSection — Evidence-driven ADDI service assessments.
 *
 * DATA FLOW (Single Source of Truth):
 *   Reads from brain.addiRecommendations.serviceAssessments — the persisted ADDI result.
 *   Does NOT generate new recommendations or use hardcoded default suggestions.
 *
 * Shows:
 *  - RECOMMENDED / POTENTIAL_OPPORTUNITY → bookable cards
 *  - NOT_CURRENTLY_SUGGESTED / ALREADY_SUFFICIENT → transparent "not needed" cards
 *  - NEEDS_REVIEW → expert escalation cards
 */
export function ExpertSuggestionsSection({ userProfile, brain = {}, onBookSuggestion }) {
  // ── PRIMARY: Use persisted ADDI result ─────────────────────────────────────
  const addiResult = brain.addiRecommendations || null;
  const serviceAssessments = addiResult?.serviceAssessments || [];

  // ── SECONDARY: Admin-curated expert suggestions (manual override) ──────────
  const expertSuggestions = userProfile?.expertSuggestions || [];

  // If no ADDI analysis yet, show admin suggestions or empty state
  if (serviceAssessments.length === 0) {
    if (expertSuggestions.length > 0) {
      return (
        <section className="expert-suggestions-section margin-bottom-24">
          <div className="flex-between margin-bottom-12">
            <h3 className="section-title" style={{ marginBottom: 0, fontSize: '16px', fontWeight: '700', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#00D1FF' }} /> Expert Recommendations
            </h3>
            <span style={{ fontSize: '11px', color: '#A78BFA', background: 'rgba(167,139,250,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
              Strategist Curated
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {expertSuggestions.map((sug, idx) => (
              <SuggestionCard key={sug.id || idx} sug={sug} onBook={onBookSuggestion} />
            ))}
          </div>
        </section>
      );
    }

    // No ADDI analysis and no admin suggestions yet
    return (
      <section className="expert-suggestions-section margin-bottom-24">
        <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Sparkles size={24} style={{ color: '#6B7280', marginBottom: '8px' }} />
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#9CA3AF' }}>ADDI Analysis Pending</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#6B7280' }}>
            Complete your ADDI conversation to receive evidence-driven service recommendations.
          </div>
        </div>
      </section>
    );
  }

  // ── ADDI analysis present: separate into positive and negative assessments ──
  const positiveAssessments = serviceAssessments.filter(a =>
    a.status === 'RECOMMENDED' || a.status === 'POTENTIAL_OPPORTUNITY'
  );
  const negativeAssessments = serviceAssessments.filter(a =>
    a.status === 'NOT_CURRENTLY_SUGGESTED' ||
    a.status === 'ALREADY_SUFFICIENT' ||
    a.status === 'NEEDS_REVIEW'
  );

  return (
    <section className="expert-suggestions-section margin-bottom-24">
      <div className="flex-between margin-bottom-12">
        <h3 className="section-title" style={{ marginBottom: 0, fontSize: '16px', fontWeight: '700', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#00D1FF' }} /> ADDI Service Analysis
        </h3>
        <span style={{ fontSize: '11px', color: '#34D399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', border: '1px solid rgba(52,211,153,0.3)' }}>
          Evidence-Driven
        </span>
      </div>

      {/* Recommended / Opportunity Services */}
      {positiveAssessments.length > 0 && (
        <>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Suggested Services
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {positiveAssessments.map((a, idx) => {
              const style = STATUS_STYLE[a.status] || STATUS_STYLE.NEEDS_REVIEW;
              return (
                <div key={a.serviceId || idx} style={{
                  background: '#1A1A24',
                  borderRadius: '10px',
                  border: `1px solid ${a.status === 'RECOMMENDED' ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.25)'}`,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div className="flex-between">
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D1FF', textTransform: 'uppercase' }}>
                      {a.serviceName}
                    </span>
                    <span style={{ fontSize: '10px', background: `${style.color}22`, color: style.color, padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                      {style.emoji} {style.label}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#D1D5DB', lineHeight: '1.4', margin: 0 }}>
                    {a.observation || a.reason || 'Based on ADDI analysis.'}
                  </p>

                  {a.gap && (
                    <div style={{ fontSize: '11px', color: '#FBBF24', fontStyle: 'italic' }}>
                      Gap: {a.gap}
                    </div>
                  )}

                  {a.evidence && a.evidence !== 'No direct evidence found' && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF', background: 'rgba(255,255,255,0.03)', padding: '5px 8px', borderRadius: '5px', fontStyle: 'italic' }}>
                      "{a.evidence}"
                    </div>
                  )}

                  <div style={{ fontSize: '10px', color: '#6B7280' }}>
                    Confidence: <strong style={{ color: style.color }}>{(a.confidence || 'medium').toUpperCase()}</strong>
                    {a.requiresExpertReview && <span style={{ marginLeft: 8, color: '#F87171' }}> · Expert Review Required</span>}
                  </div>

                  <button
                    type="button"
                    onClick={() => onBookSuggestion?.({ service: a.serviceName, id: a.serviceId, observation: a.observation })}
                    style={{
                      background: 'linear-gradient(135deg, #00D1FF, #7c5cff)',
                      border: 'none', borderRadius: '6px', color: '#fff',
                      fontSize: '12px', fontWeight: 600, padding: '8px 12px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}
                  >
                    Get Expert Quote <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Negative Assessments — transparent to customer */}
      {negativeAssessments.length > 0 && (
        <>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            ADDI Assessment — Not Currently Suggested
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {negativeAssessments.map((a, idx) => {
              const style = STATUS_STYLE[a.status] || STATUS_STYLE.NOT_CURRENTLY_SUGGESTED;
              return (
                <div key={a.serviceId || idx} style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(107,114,128,0.2)`,
                  borderRadius: '8px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#E5E7EB' }}>{a.serviceName}</span>
                    {a.observation && (
                      <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '3px 0 0 0', lineHeight: 1.4 }}>
                        {a.observation}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                    background: `${style.color}15`, color: style.color,
                    border: `1px solid ${style.color}40`, fontWeight: 600, whiteSpace: 'nowrap'
                  }}>
                    {style.emoji} {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function SuggestionCard({ sug, onBook }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
      <div className="flex-between">
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#7C5CFF', textTransform: 'uppercase' }}>{sug.service || 'Strategic Package'}</span>
        <span style={{ fontSize: '10px', background: '#D1FAE5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{sug.priority || 'Recommended'}</span>
      </div>
      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111111', margin: 0 }}>{sug.title || sug.service}</h4>
      <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: '1.4' }}>{sug.reason || sug.description || 'Recommended based on your business analysis.'}</p>
      <button type="button" onClick={() => onBook?.(sug)} style={{ background: 'linear-gradient(135deg, #7C5CFF, #6366F1)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, padding: '8px 12px', cursor: 'pointer' }}>
        Book Service <ChevronRight size={14} style={{ display: 'inline' }} />
      </button>
    </div>
  );
}
