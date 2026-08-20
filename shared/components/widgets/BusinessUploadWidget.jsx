import React, { useState, useRef, useCallback } from 'react';
import {
  Globe, Upload, FileText, X, ArrowRight, Loader, CheckCircle, AlertCircle
} from 'lucide-react';
import { businessAnalysisService } from '../../services/businessAnalysisService.js';
import { validators } from '../../validators/index.js';

const ANALYSIS_STEPS = [
  { id: 'reviewing', label: 'Reviewing your document...' },
  { id: 'extracting', label: 'Extracting business information...' },
  { id: 'services', label: 'Understanding services...' },
  { id: 'audience', label: 'Understanding audience...' },
  { id: 'brand', label: 'Understanding brand...' },
  { id: 'done', label: 'Business profile ready!' },
];

function detectUrlType(url) {
  if (!url) return 'website';
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('facebook.com') || lower.includes('twitter.com') || lower.includes('linkedin.com')) return 'social';
  if (lower.includes('maps.google') || lower.includes('g.page') || lower.includes('goo.gl/maps')) return 'google';
  return 'website';
}

export function BusinessUploadWidget({ onAnalysisComplete, disabled = false }) {
  const [activeTab, setActiveTab] = useState('text');
  const [url, setUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const runAnalysisAnimation = useCallback(async (analyseFn) => {
    setError('');
    setAnalysisStep(0);
    try {
      for (let i = 0; i < ANALYSIS_STEPS.length - 1; i++) {
        setAnalysisStep(i);
        await new Promise(r => setTimeout(r, 700));
      }
      const result = await analyseFn();
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 600));
      setAnalysisStep(null);
      if (onAnalysisComplete) onAnalysisComplete(result);
    } catch {
      setAnalysisStep(null);
      setError('Analysis failed. Please try again or type your business description.');
    }
  }, [onAnalysisComplete]);

  const handleUrlSubmit = async () => {
    const valRes = validators.validateUrl(url);
    if (!valRes.isValid) return setError(valRes.message);
    const urlType = detectUrlType(url.trim());
    await runAnalysisAnimation(async () => {
      if (urlType === 'social') return businessAnalysisService.analyzeSocial(url.trim());
      if (urlType === 'google') return businessAnalysisService.analyzeGoogleBusiness(url.trim());
      return businessAnalysisService.analyzeWebsite(url.trim());
    });
  };

  const handleFileSubmit = async () => {
    if (!files.length) return;
    const f = files[0];
    await runAnalysisAnimation(async () => {
      return businessAnalysisService.analyzeDocument(f.file, 'company_profile');
    });
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await runAnalysisAnimation(async () => {
      return businessAnalysisService.analyzeBusinessDescription(textInput.trim());
    });
  };

  const handleFileSelect = (selectedFiles) => {
    const accepted = Array.from(selectedFiles).filter(f => validators.validateFile(f).isValid);
    setFiles(accepted.map(f => ({ file: f, name: f.name, size: f.size })));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
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
      <div className="buw-tabs">
        {[
          { id: 'text', label: '✏️ Type It', icon: FileText },
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

      {activeTab === 'url' && (
        <div className="buw-tab-content">
          <div className="buw-url-hint">Paste your website, Instagram, Facebook, or Google Maps link</div>
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
            {url && <span className="buw-url-type-chip">{urlTypeLabel}</span>}
          </div>
          {url.trim() && (
            <button className="primary-btn btn-compact w-full buw-submit-btn" onClick={handleUrlSubmit} disabled={disabled}>
              <span>Analyze {urlTypeLabel}</span><ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {activeTab === 'file' && (
        <div className="buw-tab-content">
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
            <button className="primary-btn btn-compact w-full buw-submit-btn" onClick={handleFileSubmit} disabled={disabled}>
              <span>Analyze Document</span><ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {activeTab === 'text' && (
        <div className="buw-tab-content">
          <textarea
            className="buw-textarea"
            placeholder="e.g. We are Dundu, a fintech company providing UPI and POS solutions for retail stores..."
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            rows={5}
            disabled={disabled}
            autoFocus
          />
          <button
            className="primary-btn btn-compact w-full buw-submit-btn"
            disabled={!textInput.trim() || disabled}
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
