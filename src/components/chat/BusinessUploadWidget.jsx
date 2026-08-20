import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Globe, Instagram, Upload, FileText, Image as ImageIcon, X,
  Link, ArrowRight, Loader, CheckCircle, AlertCircle
} from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore.js';

import { 
  validateName, 
  validateBusinessName, 
  validateIndustryOrSegment, 
  validateBusinessDescription, 
  validateURL 
} from '../../utils/validators.js';

const ANALYSIS_STEPS = [
  { id: 'reviewing', label: 'Reviewing your document...' },
  { id: 'extracting', label: 'Extracting business information...' },
  { id: 'understanding-business', label: 'Understanding your business...' },
  { id: 'understanding-services', label: 'Understanding your services...' },
  { id: 'understanding-audience', label: 'Understanding your audience...' },
  { id: 'understanding-brand', label: 'Understanding your brand...' },
  { id: 'building', label: 'Building your business profile...' },
  { id: 'done', label: 'Business profile ready!' },
];

function detectUrlType(url) {
  if (!url) return 'website';
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('facebook.com') || lower.includes('twitter.com') || lower.includes('linkedin.com')) return 'social';
  if (lower.includes('maps.google') || lower.includes('g.page') || lower.includes('goo.gl/maps')) return 'google';
  return 'website';
}

export function BusinessUploadWidget({ onAnalysisComplete, disabled = false, activeTab: controlledTab, onTabChange }) {
  const { state, updateState } = useOnboardingStore();
  const [internalTab, setInternalTab] = useState('text');
  const activeTab = controlledTab || internalTab;
  const setActiveTab = (tab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };
  const [url, setUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [files, setFiles] = useState([]); // [{ file, name, type }]
  const [isDragging, setIsDragging] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(null); // null | index number
  const [manualForm, setManualForm] = useState({ name: state?.name || '', businessName: '', industry: '', segment: '', description: '' });

  useEffect(() => {
    if (state?.name && !manualForm.name) {
      setManualForm(prev => ({ ...prev, name: state.name }));
    }
  }, [state?.name]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const textSaveTimer = useRef(null);

  const runAnalysisAnimation = useCallback(async (analyseFn) => {
    setError('');
    setAnalysisStep(0);
    try {
      // Show each step with delay
      for (let i = 0; i < ANALYSIS_STEPS.length - 1; i++) {
        setAnalysisStep(i);
        await new Promise(r => setTimeout(r, 700));
      }
      const result = await analyseFn();
      setAnalysisStep(ANALYSIS_STEPS.length - 1); // "done"
      await new Promise(r => setTimeout(r, 600));
      setAnalysisStep(null);
      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch (err) {
      setAnalysisStep(null);
      setError("We couldn't understand enough from this information. Please try again or enter your business details manually.");
    }
  }, [onAnalysisComplete]);

  const handleUrlSubmit = async () => {
    setError('');
    const nameVal = validateName(manualForm.name);
    if (!nameVal.isValid) {
      setError(nameVal.message);
      return;
    }

    const urlVal = validateURL(url);
    if (!urlVal.isValid) {
      setError(urlVal.message);
      return;
    }

    const targetUrl = urlVal.normalizedUrl;
    const urlType = detectUrlType(targetUrl);
    await runAnalysisAnimation(async () => {
      const { businessAnalysisService } = await import('../../services/businessAnalysisService');
      let profile;
      if (urlType === 'social') {
        profile = await businessAnalysisService.analyzeSocial(targetUrl);
      } else if (urlType === 'google') {
        profile = await businessAnalysisService.analyzeGoogleBusiness(targetUrl);
      } else {
        profile = await businessAnalysisService.analyzeWebsite(targetUrl);
      }
      profile = profile || {};
      profile.customerName = nameVal.name;
      return profile;
    });
  };

  const handleFileSubmit = async () => {
    setError('');
    const nameVal = validateName(manualForm.name);
    if (!nameVal.isValid) {
      setError(nameVal.message);
      return;
    }

    if (!files.length) {
      setError('Please select or drop a valid file.');
      return;
    }
    const f = files[0];
    await runAnalysisAnimation(async () => {
      const { businessAnalysisService } = await import('../../services/businessAnalysisService');
      let profile = await businessAnalysisService.analyzeDocument(f.file, 'company_profile');
      profile = profile || {};
      profile.customerName = nameVal.name;
      return profile;
    });
  };

  const handleTextSubmit = async () => {
    setError('');
    const nameVal = validateName(manualForm.name);
    if (!nameVal.isValid) {
      setError(nameVal.message);
      return;
    }

    const bizVal = validateBusinessName(manualForm.businessName);
    if (!bizVal.isValid) {
      setError(bizVal.message);
      return;
    }

    if (manualForm.industry.trim()) {
      const indVal = validateIndustryOrSegment(manualForm.industry, 'Industry');
      if (!indVal.isValid) {
        setError(indVal.message);
        return;
      }
    }

    if (manualForm.segment.trim()) {
      const segVal = validateIndustryOrSegment(manualForm.segment, 'Segment');
      if (!segVal.isValid) {
        setError(segVal.message);
        return;
      }
    }

    const descVal = validateBusinessDescription(manualForm.description);
    if (!descVal.isValid) {
      setError(descVal.message);
      return;
    }

    await runAnalysisAnimation(async () => {
      const { businessAnalysisService } = await import('../../services/businessAnalysisService');
      const combinedText = `Business Name: ${bizVal.name}\nIndustry: ${manualForm.industry}\nSegment: ${manualForm.segment}\nDescription: ${descVal.description}`;
      const profile = await businessAnalysisService.analyzeBusinessDescription(combinedText);
      profile.businessName = bizVal.name;
      profile.industry = manualForm.industry.trim() || profile.industry || 'Professional Services';
      profile.segment = manualForm.segment.trim() || profile.segment || 'Commercial';
      profile.businessDescription = descVal.description;
      profile.customerName = nameVal.name;
      return profile;
    });
  };

  const handleFileSelect = (selectedFiles) => {
    setError('');
    const rawArr = Array.from(selectedFiles);
    if (!rawArr.length) return;

    const validFiles = [];
    for (const f of rawArr) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg', 'ppt', 'pptx'].includes(ext)) {
        setError(`File "${f.name}" has an unsupported format.`);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds the maximum 25MB file size limit.`);
        return;
      }
      validFiles.push({ file: f, name: f.name, size: f.size });
    }
    setFiles(validFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleTextChange = (field, val) => {
    setManualForm(prev => ({ ...prev, [field]: val }));
    if (field === 'name' && val.trim()) {
      updateState({ name: val.trim() });
    }
    clearTimeout(textSaveTimer.current);
    textSaveTimer.current = setTimeout(() => {}, 500);
  };

  const urlType = detectUrlType(url);
  const urlTypeLabel = { website: '🌐 Website', social: '📱 Social Profile', google: '📍 Google Business' }[urlType];

  if (analysisStep !== null) {
    return (
      <div className="buw-analysis-overlay">
        {ANALYSIS_STEPS.map((step, idx) => (
          <div key={step.id} className={`buw-analysis-step ${idx < analysisStep ? 'step-done' : idx === analysisStep ? 'step-active' : 'step-pending'}`}>
            <div className="buw-step-icon">
              {idx < analysisStep ? <CheckCircle size={14} /> : idx === analysisStep ? <Loader size={14} className="buw-spin" /> : <div className="buw-step-dot" />}
            </div>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="buw-container">
      {/* Tab selector: 1. Text Section, 2. Upload File, 3. URL */}
      <div className="buw-tabs">
        {[
          { id: 'text', label: '✍️ Enter Business Info', icon: FileText },
          { id: 'file', label: '📄 Upload File', icon: Upload },
          { id: 'url', label: '🔗 URL', icon: Globe },
        ].map(tab => (
          <button
            key={tab.id}
            className={`buw-tab ${activeTab === tab.id ? 'buw-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div className="buw-tab-content">
          <div className="buw-url-hint">
            Enter your website URL and ADDI will analyze it automatically.
          </div>
          <div style={{ margin: '8px 0' }}>
            <input
              type="text"
              className="buw-text-input"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '13px' }}
              placeholder="Your Name *"
              value={manualForm.name}
              onChange={e => handleTextChange('name', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="buw-url-row">
            <Globe size={16} className="buw-url-icon" />
            <input
              type="url"
              className="buw-url-input"
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleUrlSubmit(); }}
              disabled={disabled}
            />
            {url && (
              <span className="buw-url-type-chip">{urlTypeLabel}</span>
            )}
          </div>
          {url.trim() && (
            <button className="primary-btn btn-compact w-full buw-submit-btn" onClick={handleUrlSubmit} disabled={disabled || !manualForm.name.trim()}>
              <span>Analyze {urlTypeLabel}</span><ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div className="buw-tab-content">
          <div style={{ margin: '0 0 10px 0' }}>
            <input
              type="text"
              className="buw-text-input"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '13px' }}
              placeholder="Your Name *"
              value={manualForm.name}
              onChange={e => handleTextChange('name', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div
            className={`buw-drop-zone ${isDragging ? 'buw-drop-zone-active' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.ppt,.pptx"
              multiple={false}
              style={{ display: 'none' }}
              onChange={e => handleFileSelect(e.target.files)}
            />
            {files.length === 0 ? (
              <>
                <Upload size={28} className="buw-drop-icon" />
                <div className="buw-drop-label">Drop your file here or click to browse</div>
                <div className="buw-drop-types">PDF · DOCX · PPT · PNG · JPG</div>
              </>
            ) : (
              <div className="buw-file-chips">
                {files.map((f, i) => (
                  <div key={i} className="buw-file-chip">
                    <FileText size={14} />
                    <span>{f.name}</span>
                    <button onClick={e => { e.stopPropagation(); setFiles([]); }} className="buw-file-remove">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {files.length > 0 && (
            <button className="primary-btn btn-compact w-full buw-submit-btn" onClick={handleFileSubmit} disabled={disabled || !manualForm.name.trim()}>
              <span>Analyze Document</span><ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Free Text Tab */}
      {activeTab === 'text' && (
        <div className="buw-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            className="buw-text-input"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px' }}
            placeholder="Your Name *"
            value={manualForm.name}
            onChange={e => handleTextChange('name', e.target.value)}
            disabled={disabled}
          />
          <input
            type="text"
            className="buw-text-input"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px' }}
            placeholder="Business / Company Name *"
            value={manualForm.businessName}
            onChange={e => handleTextChange('businessName', e.target.value)}
            disabled={disabled}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="buw-text-input"
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px' }}
              placeholder="Industry (e.g. Fintech)"
              value={manualForm.industry}
              onChange={e => handleTextChange('industry', e.target.value)}
              disabled={disabled}
            />
            <input
              type="text"
              className="buw-text-input"
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px' }}
              placeholder="Segment (e.g. B2B)"
              value={manualForm.segment}
              onChange={e => handleTextChange('segment', e.target.value)}
              disabled={disabled}
            />
          </div>
          <textarea
            className="buw-textarea"
            style={{ minHeight: '120px' }}
            placeholder="Tell us briefly what your business does, what you offer, and who you serve. *"
            value={manualForm.description}
            onChange={e => {
               const val = e.target.value;
               // Simple validation for no bizarre special chars (allowing normal punctuation)
               if (/^[\w\s.,!?'"-]*$/.test(val)) {
                 handleTextChange('description', val);
                 setError('');
               }
            }}
            rows={5}
            disabled={disabled}
          />
          <button
            className="primary-btn btn-compact w-full buw-submit-btn"
            disabled={!manualForm.name.trim() || !manualForm.businessName.trim() || manualForm.description.trim().length < 10 || disabled}
            onClick={handleTextSubmit}
          >
            <span>Analyze Business</span><ArrowRight size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="error-banner flex-center" style={{ marginTop: '10px' }}>
          <AlertCircle size={14} /><span>{error}</span>
        </div>
      )}
    </div>
  );
}
