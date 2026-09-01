import React, { useState, useRef } from 'react';
import { FileText, Globe, ArrowRight, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { businessAnalysisService } from '../../services/businessAnalysisService';
import { useOnboardingStore } from '../../store/onboardingStore';
import { validateURL, validateBusinessName, validateName, validateBusinessDescription } from '../../utils/validators';

const ANALYSIS_STEPS = [
  { label: 'Connecting to business sources...', duration: 600 },
  { label: 'Reading business offering & segment...', duration: 800 },
  { label: 'Evaluating brand identity & deliverables...', duration: 700 },
  { label: 'Formulating strategic recommendation...', duration: 500 },
];

export function BusinessUploadWidget({ onAnalysisComplete, activeTab: externalTab, onTabChange, disabled = false }) {
  const [activeTab, setActiveTabInternal] = useState(externalTab || 'text');
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState('');
  const [analysisMethodUsed, setAnalysisMethodUsed] = useState(null);

  const { state, updateState } = useOnboardingStore();

  const [manualForm, setManualForm] = useState({
    name: state.name || '',
    businessName: state.businessProfile?.businessName || '',
    industry: state.businessProfile?.industry || '',
    segment: state.businessProfile?.segment || '',
    description: state.businessProfile?.summary || state.businessProfile?.description || ''
  });

  const setActiveTab = (tabId) => {
    setActiveTabInternal(tabId);
    if (typeof onTabChange === 'function') {
      onTabChange(tabId);
    }
    setError('');
  };

  const handleTextChange = (field, val) => {
    setManualForm(prev => ({ ...prev, [field]: val }));
    if (field === 'name' && val.trim()) {
      updateState({ name: val.trim() });
    }
  };

  const runStepAnimation = () => {
    let step = 0;
    setCurrentStepIndex(0);
    const interval = setInterval(() => {
      step += 1;
      if (step < ANALYSIS_STEPS.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
      }
    }, 700);
    return () => clearInterval(interval);
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      setError('Please enter a valid website URL.');
      return;
    }
    const valResult = validateURL(url);
    if (!valResult.isValid) {
      setError(valResult.message || 'Please enter a valid URL.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setAnalysisMethodUsed('url');
    const stopAnim = runStepAnimation();

    try {
      const profile = await businessAnalysisService.analyzeUrlOrText(url.trim());
      
      if (profile?.requiresManualInput || profile?.failureReason) {
        throw new Error(profile.userMessage || 'Unable to complete automated analysis. You can enter details manually.');
      }
      
      stopAnim();
      setIsAnalyzing(false);
      if (typeof onAnalysisComplete === 'function') {
        onAnalysisComplete(profile);
      }
    } catch (err) {
      stopAnim();
      setIsAnalyzing(false);
      setError(err.message || 'Unable to complete automated analysis. You can enter details manually.');
    }
  };

  const handleTextSubmit = async () => {
    const valName = validateName(manualForm.name);
    if (!valName.isValid) {
      setError(valName.message);
      return;
    }
    const valBiz = validateBusinessName(manualForm.businessName);
    if (!valBiz.isValid) {
      setError(valBiz.message);
      return;
    }
    const valDesc = validateBusinessDescription(manualForm.description);
    if (!valDesc.isValid) {
      setError(valDesc.message);
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setAnalysisMethodUsed('text');
    const stopAnim = runStepAnimation();

    try {
      const summaryText = `${manualForm.businessName}. ${manualForm.industry ? 'Industry: ' + manualForm.industry + '. ' : ''}${manualForm.segment ? 'Segment: ' + manualForm.segment + '. ' : ''}${manualForm.description}`;
      const profile = await businessAnalysisService.analyzeUrlOrText(summaryText);
      stopAnim();
      setIsAnalyzing(false);
      if (typeof onAnalysisComplete === 'function') {
        onAnalysisComplete({
          ...profile,
          customerName: manualForm.name.trim(),
          businessName: manualForm.businessName.trim(),
          industry: manualForm.industry.trim(),
          segment: manualForm.segment.trim(),
          summary: manualForm.description.trim()
        });
      }
    } catch (err) {
      stopAnim();
      setIsAnalyzing(false);
      // Fallback
      if (typeof onAnalysisComplete === 'function') {
        onAnalysisComplete({
          customerName: manualForm.name.trim(),
          businessName: manualForm.businessName.trim(),
          industry: manualForm.industry.trim(),
          segment: manualForm.segment.trim(),
          summary: manualForm.description.trim(),
          sourceStatus: 'LIKELY_BUSINESS_WEBSITE'
        });
      }
    }
  };

  const handleAnalysisTrigger = () => {
    if (activeTab === 'url') {
      handleUrlSubmit();
    } else {
      handleTextSubmit();
    }
  };

  const isTextReady = manualForm.name.trim() && manualForm.businessName.trim() && manualForm.description.trim().length >= 10;
  const isUrlReady = url.trim().length > 3;
  const canAnalyze = activeTab === 'url' ? isUrlReady : isTextReady;

  if (isAnalyzing) {
    return (
      <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <Loader2 size={32} color="#8B5CF6" className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#000000', margin: '0 0 16px 0' }}>
          Analyzing your business...
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
          {ANALYSIS_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: isCurrent ? '#7C5CFF' : isDone ? '#10B981' : '#9CA3AF', fontWeight: isCurrent ? 700 : 500 }}>
                {isDone ? <CheckCircle2 size={16} color="#10B981" /> : isCurrent ? <Loader2 size={16} color="#7C5CFF" className="spin" /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #E5E7EB' }} />}
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ── TWO ACCORDION CARDS ONLY (Upload File Removed) ── */}
      <div className="accordion-cards-group">
        {/* Card 1: Enter Business Info */}
        <div className={`accordion-card ${activeTab === 'text' ? 'is-active' : ''}`}>
          <button
            type="button"
            className="accordion-header-btn"
            onClick={() => setActiveTab(activeTab === 'text' ? '' : 'text')}
          >
            <div className="accordion-header-left">
              <div className="accordion-header-icon">
                <FileText size={20} strokeWidth={1.75} color="#000000" />
              </div>
              <span className="accordion-header-title">Enter Business Info</span>
            </div>
            <div className="accordion-header-chevron">
              {activeTab === 'text' ? <ChevronDown size={18} color="#000000" /> : <ChevronRight size={18} color="#6B7280" />}
            </div>
          </button>

          {activeTab === 'text' && (
            <div className="accordion-body">
              <input
                type="text"
                className="clean-white-input"
                placeholder="Your Name *"
                value={manualForm.name}
                onChange={e => handleTextChange('name', e.target.value)}
                disabled={disabled}
              />
              <input
                type="text"
                className="clean-white-input"
                placeholder="Business / Company Name *"
                value={manualForm.businessName}
                onChange={e => handleTextChange('businessName', e.target.value)}
                disabled={disabled}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="clean-white-input"
                  placeholder="Industry (e.g. Fintech)"
                  value={manualForm.industry}
                  onChange={e => handleTextChange('industry', e.target.value)}
                  disabled={disabled}
                />
                <input
                  type="text"
                  className="clean-white-input"
                  placeholder="Segment (e.g. B2B)"
                  value={manualForm.segment}
                  onChange={e => handleTextChange('segment', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <textarea
                className="clean-white-textarea"
                placeholder="Tell us briefly what your business does, what you offer, and who you serve. *"
                value={manualForm.description}
                onChange={e => handleTextChange('description', e.target.value)}
                rows={4}
                disabled={disabled}
              />
            </div>
          )}
        </div>

        {/* Card 2: Add Website URL */}
        <div className={`accordion-card ${activeTab === 'url' ? 'is-active' : ''}`}>
          <button
            type="button"
            className="accordion-header-btn"
            onClick={() => setActiveTab(activeTab === 'url' ? '' : 'url')}
          >
            <div className="accordion-header-left">
              <div className="accordion-header-icon">
                <Globe size={20} strokeWidth={1.75} color="#000000" />
              </div>
              <span className="accordion-header-title">Add Website URL</span>
            </div>
            <div className="accordion-header-chevron">
              {activeTab === 'url' ? <ChevronDown size={18} color="#000000" /> : <ChevronRight size={18} color="#6B7280" />}
            </div>
          </button>

          {activeTab === 'url' && (
            <div className="accordion-body">
              <input
                type="text"
                className="clean-white-input"
                placeholder="Your Name *"
                value={manualForm.name}
                onChange={e => handleTextChange('name', e.target.value)}
                disabled={disabled}
              />
              <input
                type="url"
                className="clean-white-input"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleUrlSubmit(); }}
                disabled={disabled}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', color: '#EF4444', fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} /> <span>{error}</span>
          </div>
          {activeTab === 'url' && (
            <button 
              type="button" 
              onClick={() => setActiveTab('text')}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#EF4444', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: 700 }}
            >
              Enter details manually instead
            </button>
          )}
        </div>
      )}

      {/* ── ANALYSIS CONTROL (Left text: Analysis, Right button: Round Arrow) ── */}
      <div className="analysis-action-bar">
        <span className="analysis-action-text">Analysis</span>
        <button
          type="button"
          className="analysis-go-circle-btn"
          disabled={!canAnalyze || disabled}
          onClick={handleAnalysisTrigger}
          title="Start Analysis"
        >
          Go
        </button>
      </div>
    </div>
  );
}

export default BusinessUploadWidget;
