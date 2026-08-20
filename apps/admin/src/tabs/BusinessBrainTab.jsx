import React, { useState, useEffect } from 'react';
import { BrainCircuit, Search, Zap, CheckCircle2, Clock, XCircle, AlertTriangle, Globe, Shield } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { BusinessBrainService } from '../../../../src/services/brain/BusinessBrainService.js';
import { adminApiService } from '../services/adminApiService.js';

/**
 * BusinessBrainTab — Admin view of ADDI's persisted recommendation results.
 *
 * DATA FLOW (Single Source of Truth):
 *   Customer completes ADDI → /recommend called → result persisted to:
 *     profile.businessBrain.addiRecommendations (localStorage USER_ACCOUNTS_DB)
 *   Admin reads from the SAME persisted record → same evidence, same reasoning.
 *   Admin does NOT regenerate a new recommendation independently.
 */

const STATUS_CONFIG = {
  RECOMMENDED:             { color: '#34D399', bg: 'rgba(52,211,153,0.1)',  icon: CheckCircle2, label: 'RECOMMENDED' },
  POTENTIAL_OPPORTUNITY:   { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  icon: Zap,          label: 'OPPORTUNITY' },
  NOT_CURRENTLY_SUGGESTED: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: Shield,        label: 'NOT SUGGESTED' },
  ALREADY_SUFFICIENT:      { color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  icon: CheckCircle2, label: 'ALREADY SUFFICIENT' },
  NEEDS_REVIEW:            { color: '#F87171', bg: 'rgba(248,113,113,0.1)', icon: AlertTriangle, label: 'NEEDS REVIEW' }
};

function ServiceAssessmentCard({ assessment }) {
  const config = STATUS_CONFIG[assessment.status] || STATUS_CONFIG.NEEDS_REVIEW;
  const Icon = config.icon;

  return (
    <div style={{
      padding: '14px 16px',
      background: config.bg,
      border: `1px solid ${config.color}33`,
      borderRadius: '10px',
      marginBottom: '10px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{assessment.serviceName}</span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 8px', borderRadius: '20px',
          background: config.bg, border: `1px solid ${config.color}`,
          color: config.color, fontSize: '11px', fontWeight: 700
        }}>
          <Icon size={11} /> {config.label}
        </span>
      </div>

      {assessment.observation && (
        <p style={{ fontSize: '12px', color: '#D1D5DB', marginBottom: '6px', lineHeight: 1.5 }}>
          {assessment.observation}
        </p>
      )}

      {assessment.evidence && assessment.evidence !== 'No direct evidence found' && (
        <div style={{ fontSize: '11px', color: '#9CA3AF', background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '6px', marginBottom: '6px', fontStyle: 'italic' }}>
          Evidence: "{assessment.evidence}"
        </div>
      )}

      {assessment.gap && (
        <div style={{ fontSize: '11px', color: '#FBBF24', marginBottom: '4px' }}>
          Gap: {assessment.gap}
        </div>
      )}

      {assessment.reasoning && (
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
          Reasoning: {assessment.reasoning}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '10px', color: '#6B7280' }}>
        <span>Confidence: <strong style={{ color: config.color }}>{(assessment.confidence || 'low').toUpperCase()}</strong></span>
        {assessment.source && <span>Source: {assessment.source}</span>}
        {assessment.requiresExpertReview && (
          <span style={{ color: '#F87171' }}>⚠ Expert Review Required</span>
        )}
      </div>
    </div>
  );
}

export function BusinessBrainTab({ dataSource = 'localStorage', adminReady = false }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        let all = [];
        if (dataSource === 'backend' && adminReady) {
          const res = await adminApiService.getUsers();
          all = res.users || [];
        } else {
          all = profileService.getAllProfiles();
        }
        setProfiles(all);
        if (all.length > 0) setSelectedUserId(all[0].userId);
      } catch (e) {
        console.warn('[BusinessBrainTab] backend load failed, falling back to localStorage:', e.message);
        const all = profileService.getAllProfiles();
        setProfiles(all);
        if (all.length > 0) setSelectedUserId(all[0].userId);
      }
    };
    load();
  }, [dataSource, adminReady]);

  const currentProfile = profiles.find(p => p.userId === selectedUserId) || profiles[0] || {};
  const uid = currentProfile.userId || null;

  // 20+ Dimension Business Profile from Business Understanding Engine
  const bpepProfile = BusinessBrainService.understanding.getBusinessProfile(uid);
  // Business Vault Memory Layer
  const vault = BusinessBrainService.vault.getVault(uid);

  // ── SINGLE SOURCE OF TRUTH ─────────────────────────────────────────────
  // Read the SAME persisted addiRecommendations that the customer saw.
  // Do NOT call RecommendationEngine.generateRecommendations() here —
  // that would produce a different (locally-generated) result.
  const brain = currentProfile.businessBrain || {};
  const addiResult = brain.addiRecommendations || null;
  const serviceAssessments = addiResult?.serviceAssessments || [];
  const websiteAssessment = addiResult?.websiteAssessment || null;
  const generatedAt = addiResult?.generatedAt || brain.addiRecommendationsGeneratedAt || null;

  const filteredProfiles = profiles.filter(p => {
    const q = search.toLowerCase();
    const bName = (p.businessBrain?.businessName || p.name || '').toLowerCase();
    const ind = (p.businessBrain?.industry || '').toLowerCase();
    return !q || bName.includes(q) || ind.includes(q);
  });

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Business Brain & ADDI Recommendation Intelligence</h2>
          <p className="admin-section-sub">
            Persisted ADDI analysis — the same evidence, reasoning, and decisions the customer saw.
            No independent re-generation.
          </p>
        </div>
      </div>

      <div className="business-brain-layout margin-top-20">

        {/* Left Side: Business Selector */}
        <div className="admin-card-box brain-sidebar-box">
          <div className="admin-search-wrap">
            <Search size={15} />
            <input
              className="admin-search-input"
              placeholder="Search Business Profiles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="brain-selector-list margin-top-12">
            {filteredProfiles.length === 0 ? (
              <div style={{ padding: '16px', color: '#6b7280', fontSize: '13px' }}>
                No customer profiles yet.
              </div>
            ) : filteredProfiles.map(p => {
              const isSelected = p.userId === currentProfile.userId;
              const name = p.businessBrain?.businessName || p.name || 'Business';
              const hasRecs = !!(p.businessBrain?.addiRecommendations);
              return (
                <div
                  key={p.userId}
                  className={`brain-selector-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedUserId(p.userId)}
                >
                  <div className="brain-item-avatar">{name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h4>{name}</h4>
                    <p style={{ color: hasRecs ? '#34D399' : '#9CA3AF', fontSize: '11px' }}>
                      {hasRecs ? '✓ ADDI Analysis Available' : '○ Awaiting ADDI Analysis'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Brain Inspector */}
        <div className="brain-main-inspector">

          {/* Header Card */}
          <div className="admin-card-box">
            <div className="flex-between">
              <div>
                <h2>{bpepProfile.businessName || brain.businessName || 'Business Profile'}</h2>
                <p className="admin-section-sub">
                  Industry: <strong>{bpepProfile.industry || brain.industry || '—'}</strong>
                  {' '} | Stage: <strong>{bpepProfile.businessStage || brain.businessStage || '—'}</strong>
                </p>
                {brain.website && (
                  <p style={{ fontSize: '12px', color: '#7c5cff', marginTop: 4 }}>
                    <Globe size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {brain.website}
                    {brain.addiWebEvidence && (
                      <span style={{ marginLeft: 8, color: '#34D399', fontSize: '11px' }}>
                        ✓ Website Inspected
                      </span>
                    )}
                  </p>
                )}
              </div>
              {addiResult && (
                <div style={{ textAlign: 'right' }}>
                  <span className="ai-confidence-tag large-tag" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399', border: '1px solid #34D399' }}>
                    🧠 ADDI Analysis Complete
                  </span>
                  {generatedAt && (
                    <div style={{ fontSize: '10px', color: '#6B7280', marginTop: 4 }}>
                      Generated: {new Date(generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 20+ Dimension Business Profile */}
          <div className="admin-card-box margin-top-16">
            <h3>🧠 20+ Dimension Business Profile</h3>
            <div className="admin-brain-grid margin-top-12">
              <div className="admin-brain-field"><span className="admin-brain-label">Brand Personality</span><span className="admin-brain-value">{bpepProfile.brandPersonality || brain.brandPersonality || '—'}</span></div>
              <div className="admin-brain-field"><span className="admin-brain-label">Business Goals</span><span className="admin-brain-value">{bpepProfile.businessGoals || brain.businessGoal || '—'}</span></div>
              <div className="admin-brain-field"><span className="admin-brain-label">Target Audience</span><span className="admin-brain-value">{bpepProfile.targetAudience || brain.targetAudience || '—'}</span></div>
              <div className="admin-brain-field"><span className="admin-brain-label">Unique Selling Proposition</span><span className="admin-brain-value">{bpepProfile.usp || '—'}</span></div>
              <div className="admin-brain-field"><span className="admin-brain-label">Vision</span><span className="admin-brain-value">{bpepProfile.vision || '—'}</span></div>
              <div className="admin-brain-field"><span className="admin-brain-label">Mission</span><span className="admin-brain-value">{bpepProfile.mission || '—'}</span></div>
              <div className="admin-brain-field"><span className="admin-brain-label">Products</span><span className="admin-brain-value">{(brain.products || bpepProfile.products || []).join(', ') || '—'}</span></div>
              <div className="admin-brain-field"><span className="admin-brain-label">Business Description</span><span className="admin-brain-value">{brain.businessDescription || bpepProfile.businessDescription || '—'}</span></div>
            </div>
          </div>

          {/* Business Vault */}
          <div className="admin-card-box margin-top-16">
            <h3>📁 Business Vault Memory Layer</h3>
            <div className="strategy-grid margin-top-12">
              <div className="strat-field-box"><label className="strat-label">Logos & Brand</label><div className="text-xs text-white">{(vault.logos || []).join(', ') || '—'}</div></div>
              <div className="strat-field-box"><label className="strat-label">Brand Guidelines</label><div className="text-xs text-white">{(vault.brandGuidelines || []).join(', ') || '—'}</div></div>
              <div className="strat-field-box"><label className="strat-label">Videos</label><div className="text-xs text-white">{(vault.videos || []).join(', ') || '—'}</div></div>
              <div className="strat-field-box"><label className="strat-label">Photography</label><div className="text-xs text-white">{(vault.photography || []).join(', ') || '—'}</div></div>
            </div>
          </div>

          {/* Website Assessment (from real inspection) */}
          {websiteAssessment && (
            <div className="admin-card-box margin-top-16" style={{ border: '1px solid rgba(124,92,255,0.3)' }}>
              <h3>🌐 Website Inspection Result</h3>
              <div className="margin-top-12">
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>
                  {websiteAssessment.inspected
                    ? `✓ ${websiteAssessment.pagesChecked || 0} pages inspected from ${websiteAssessment.url || 'website'}`
                    : 'Website inspection was not performed.'}
                </div>
                {websiteAssessment.observation && (
                  <p style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: 1.5, marginBottom: '8px' }}>
                    {websiteAssessment.observation}
                  </p>
                )}
                {websiteAssessment.strengths?.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Strengths:</span>
                    <ul style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#D1D5DB' }}>
                      {websiteAssessment.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {websiteAssessment.weaknesses?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 600 }}>Weaknesses:</span>
                    <ul style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#D1D5DB' }}>
                      {websiteAssessment.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Service Assessments — All 9 services */}
          <div className="admin-card-box margin-top-16">
            <h3>
              <Zap size={18} className="inline-icon text-highlight" /> ADDI Service Assessments
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
              {addiResult
                ? `Evidence-driven assessment of all service areas. ${addiResult.websiteInspectionPerformed ? 'Website evidence was used.' : 'No website inspection performed.'}`
                : 'No ADDI analysis yet. Customer must complete onboarding first.'}
            </p>

            <div className="margin-top-12">
              {serviceAssessments.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                  No ADDI service assessments available for this customer yet.
                  <br />
                  <span style={{ fontSize: '11px' }}>Assessments appear here after the customer completes the ADDI onboarding conversation.</span>
                </div>
              ) : (
                serviceAssessments.map(a => (
                  <ServiceAssessmentCard key={a.serviceId || a.serviceName} assessment={a} />
                ))
              )}
            </div>
          </div>

          {/* Roadmap (from persisted result) */}
          {addiResult?.roadmap?.length > 0 && (
            <div className="admin-card-box margin-top-16">
              <h3>🗺️ ADDI Strategic Roadmap</h3>
              <div className="margin-top-12">
                {addiResult.roadmap.map((step, i) => (
                  <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #7c5cff' }}>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#fff' }}>{step.title}</strong>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{step.estimatedTimeline}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#D1D5DB', margin: 0 }}>{step.objective}</p>
                    {step.services?.length > 0 && (
                      <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {step.services.map(s => (
                          <span key={s} style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(124,92,255,0.15)', borderRadius: '4px', color: '#A78BFA' }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default BusinessBrainTab;
