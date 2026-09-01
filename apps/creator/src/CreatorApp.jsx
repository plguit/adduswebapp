import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, User, MapPin, Briefcase, Package, DollarSign, Calendar,
  FileText, ChevronRight, ChevronLeft, CheckCircle, Clock, AlertTriangle,
  Eye, EyeOff, Upload, Plus, Trash2, LogOut, Menu, X, Award, Star,
  TrendingUp, Bell, Home, Shield, Edit3, Save, Phone, Mail, Image,
  FolderOpen, Loader, RefreshCw, Download, MessageSquare, AlertCircle
} from 'lucide-react';
import { creatorAuthService } from '../../../shared/services/creatorAuthService.js';
import { creatorApiService } from '../../../shared/services/creatorApiService.js';
import { professionsService } from '../../../shared/constants/creatorProfessions.js';
import { creatorScoreEngine } from '../../../ai/creator-score-engine/creatorScoreEngine.js';

// ── OTP Step ───────────────────────────────────────────────────────────────

function OTPLoginStep({ onVerified }) {
  const [authType, setAuthType] = useState('mobile'); // mobile | email
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [existingCreator, setExistingCreator] = useState(null);

  const handleSendOTP = () => {
    setError('');
    if (!identifier.trim()) return setError('Please enter your ' + (authType === 'mobile' ? 'mobile number' : 'email address'));
    if (authType === 'mobile' && !/^[6-9]\d{9}$/.test(identifier.trim())) return setError('Please enter a valid 10-digit Indian mobile number');
    if (authType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) return setError('Please enter a valid email address');

    setLoading(true);
    const check = creatorAuthService.checkExists(identifier.trim());
    setIsExisting(check.exists);
    if (check.exists) setExistingCreator(check.creator);

    const result = creatorAuthService.sendOTP(identifier.trim(), authType);
    setDevOtp(result.otp); // For dev mode
    setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOTP = () => {
    setError('');
    const result = creatorAuthService.verifyOTP(identifier.trim(), otp);
    if (!result.success) return setError(result.error);

    if (isExisting) {
      const login = creatorAuthService.loginCreator(identifier.trim());
      onVerified({ creator: login.creator, isExisting: true });
    } else {
      const reg = creatorAuthService.registerCreator({ [authType]: identifier.trim(), authType });
      if (!reg.success) return setError(reg.error);
      onVerified({ creator: reg.creator, isExisting: false });
    }
  };

  return (
    <div className="creator-auth-screen">
      <div className="creator-auth-card">
        <div className="creator-auth-logo">
          <div className="creator-auth-logo-icon">
            <img src="/addus_logo.png" alt="ADDUS Logo" style={{ width: '40px', height: 'auto', borderRadius: '8px' }} />
          </div>
          <h1>ADDUS Creator Portal</h1>
          <p>Register or sign in as a creator</p>
        </div>

        {!otpSent ? (
          <>
            <div className="creator-auth-toggle">
              <button
                className={`auth-toggle-btn ${authType === 'mobile' ? 'active' : ''}`}
                onClick={() => { setAuthType('mobile'); setIdentifier(''); setError(''); }}
              >
                <Phone size={16} /> Mobile OTP
              </button>
              <button
                className={`auth-toggle-btn ${authType === 'email' ? 'active' : ''}`}
                onClick={() => { setAuthType('email'); setIdentifier(''); setError(''); }}
              >
                <Mail size={16} /> Email OTP
              </button>
            </div>

            <div className="creator-form-field">
              <label>{authType === 'mobile' ? 'Mobile Number' : 'Email Address'}</label>
              <input
                type={authType === 'mobile' ? 'tel' : 'email'}
                className="creator-input"
                placeholder={authType === 'mobile' ? 'Enter 10-digit mobile number' : 'Enter your email address'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              />
            </div>

            {error && <div className="creator-error-msg">{error}</div>}

            <button className="creator-primary-btn" onClick={handleSendOTP} disabled={loading}>
              {loading ? <Loader size={16} className="spin-icon" /> : <ChevronRight size={16} />}
              Send OTP
            </button>
          </>
        ) : (
          <>
            {isExisting && (
              <div className="creator-welcome-back-banner">
                <CheckCircle size={18} />
                <span>Welcome back, <strong>{existingCreator?.name || 'Creator'}</strong>! Continue where you left off.</span>
              </div>
            )}

            <div className="creator-otp-banner">
              <span>OTP sent to <strong>{identifier}</strong></span>
              <button className="creator-link-btn" onClick={() => { setOtpSent(false); setOtp(''); setDevOtp(''); }}>Change</button>
            </div>

            {/* Dev Mode OTP Display */}
            <div className="creator-dev-otp-chip">
              <Shield size={14} /> Dev Mode — Your OTP: <strong>{devOtp}</strong>
            </div>

            <div className="creator-form-field">
              <label>Enter OTP</label>
              <input
                type="text"
                className="creator-input creator-otp-input"
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
              />
            </div>

            {error && <div className="creator-error-msg">{error}</div>}

            <button className="creator-primary-btn" onClick={handleVerifyOTP}>
              <CheckCircle size={16} /> Verify & Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Registration Steps ──────────────────────────────────────────────────────

const STEPS = ['Name', 'Photo', 'Location', 'Profession', 'Onboarding', 'Review'];

function RegistrationWizard({ creator, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: creator.name || '',
    profilePhoto: creator.profilePhoto || null,
    location: creator.location || { country: 'India', state: '', district: '', city: '', pincode: '' },
    primaryProfession: creator.primaryProfession || '',
    categories: creator.categories || [],
    onboardingData: {}
  });
  const [error, setError] = useState('');
  const professions = professionsService.getAll().filter(p => p.isActive);

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const next = () => {
    setError('');
    if (step === 0 && !data.name.trim()) return setError('Please enter your full name');
    if (step === 0 && !/^[a-zA-Z\s]{2,80}$/.test(data.name.trim())) return setError('Name must contain only letters and spaces (max 80 characters)');
    if (step === 3 && !data.primaryProfession) return setError('Please select your primary profession');
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = () => {
    const updates = {
      name: data.name.trim(),
      profilePhoto: data.profilePhoto,
      location: data.location,
      primaryProfession: data.primaryProfession,
      categories: data.categories.length > 0 ? data.categories : [{
        categoryId: `cat_${Date.now()}`,
        professionId: professions.find(p => p.name === data.primaryProfession)?.professionId,
        professionName: data.primaryProfession,
        onboardingData: data.onboardingData,
        pricing: null,
        portfolio: []
      }]
    };
    creatorAuthService.updateCreator(creator.creatorId, updates);
    onComplete(creatorAuthService.getCreatorById(creator.creatorId));
  };

  const primaryProfessionObj = professions.find(p => p.name === data.primaryProfession);

  return (
    <div className="creator-register-screen">
      <div className="creator-register-card">
        {/* Progress Bar */}
        <div className="creator-progress-bar">
          {STEPS.map((s, i) => (
            <div key={s} className={`creator-progress-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
              <div className="creator-progress-dot">
                {i < step ? <CheckCircle size={16} /> : <span>{i + 1}</span>}
              </div>
              <span className="creator-progress-label">{s}</span>
            </div>
          ))}
        </div>

        <div className="creator-register-body">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="creator-step fade-in">
              <h2>What's your full name?</h2>
              <p className="creator-step-sub">This will appear on your creator profile and project assignments.</p>
              <div className="creator-form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  className="creator-input"
                  placeholder="e.g. Rahul Sharma"
                  maxLength={80}
                  value={data.name}
                  onChange={e => update('name', e.target.value)}
                />
                <span className="creator-field-hint">Alphabets and spaces only · Max 80 characters</span>
              </div>
            </div>
          )}

          {/* Step 1: Photo */}
          {step === 1 && (
            <div className="creator-step fade-in">
              <h2>Add your profile photo</h2>
              <p className="creator-step-sub">JPEG or PNG · Maximum 2 MB</p>
              <div className="creator-photo-upload-area">
                {data.profilePhoto ? (
                  <div className="creator-photo-preview">
                    <img src={data.profilePhoto} alt="Profile" />
                    <button className="creator-photo-remove-btn" onClick={() => update('profilePhoto', null)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="creator-photo-upload-label">
                    <div className="creator-photo-upload-icon"><Image size={40} /></div>
                    <span>Click to upload photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) return setError('File must be under 2 MB');
                        const reader = new FileReader();
                        reader.onload = ev => update('profilePhoto', ev.target.result);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>
              <button className="creator-skip-btn" onClick={() => setStep(2)}>Skip for now</button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="creator-step fade-in">
              <h2>Where are you based?</h2>
              <p className="creator-step-sub">This helps us match you to nearby projects.</p>
              <div className="creator-location-grid">
                {[
                  { key: 'country', label: 'Country', placeholder: 'India', disabled: true },
                  { key: 'state', label: 'State', placeholder: 'e.g. Maharashtra' },
                  { key: 'district', label: 'District', placeholder: 'e.g. Pune' },
                  { key: 'city', label: 'City', placeholder: 'e.g. Pune City' },
                  { key: 'pincode', label: 'Pincode', placeholder: 'e.g. 411001' }
                ].map(f => (
                  <div key={f.key} className="creator-form-field">
                    <label>{f.label}</label>
                    <input
                      type="text"
                      className="creator-input"
                      placeholder={f.placeholder}
                      disabled={f.disabled}
                      value={data.location[f.key] || (f.disabled ? 'India' : '')}
                      onChange={e => update('location', { ...data.location, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Profession */}
          {step === 3 && (
            <div className="creator-step fade-in">
              <h2>What is your primary profession?</h2>
              <p className="creator-step-sub">You can add more specialisations later. Select your main skill first.</p>
              <div className="creator-profession-grid">
                {professions.map(prof => (
                  <button
                    key={prof.professionId}
                    className={`creator-profession-card ${data.primaryProfession === prof.name ? 'selected' : ''}`}
                    onClick={() => update('primaryProfession', prof.name)}
                  >
                    <span className="creator-profession-name">{prof.name}</span>
                    {data.primaryProfession === prof.name && <CheckCircle size={16} className="creator-profession-check" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Profession-Specific Onboarding */}
          {step === 4 && primaryProfessionObj && (
            <div className="creator-step fade-in">
              <h2>{primaryProfessionObj.name} Details</h2>
              <p className="creator-step-sub">Tell us more about your {primaryProfessionObj.name.toLowerCase()} experience and equipment.</p>
              <div className="creator-onboarding-fields">
                {primaryProfessionObj.fields?.map(field => (
                  <div key={field.fieldId} className="creator-form-field">
                    <label>
                      {field.label}
                      {field.required && <span className="creator-required-star">*</span>}
                    </label>
                    {field.type === 'text' || field.type === 'number' || field.type === 'url' ? (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        className="creator-input"
                        placeholder={field.placeholder || ''}
                        value={data.onboardingData[field.fieldId] || ''}
                        onChange={e => update('onboardingData', { ...data.onboardingData, [field.fieldId]: e.target.value })}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="creator-select"
                        value={data.onboardingData[field.fieldId] || ''}
                        onChange={e => update('onboardingData', { ...data.onboardingData, [field.fieldId]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'multiselect' ? (
                      <div className="creator-multiselect-chips">
                        {field.options?.map(opt => {
                          const selected = (data.onboardingData[field.fieldId] || []).includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              className={`creator-chip ${selected ? 'selected' : ''}`}
                              onClick={() => {
                                const current = data.onboardingData[field.fieldId] || [];
                                const newVal = selected ? current.filter(v => v !== opt) : [...current, opt];
                                update('onboardingData', { ...data.onboardingData, [field.fieldId]: newVal });
                              }}
                            >
                              {selected && <CheckCircle size={12} />} {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="creator-step fade-in">
              <h2>Review your profile</h2>
              <p className="creator-step-sub">Review your details before submitting for admin approval.</p>
              <div className="creator-review-card">
                <div className="creator-review-header">
                  {data.profilePhoto
                    ? <img src={data.profilePhoto} alt="Profile" className="creator-review-avatar" />
                    : <div className="creator-review-avatar-placeholder"><User size={32} /></div>
                  }
                  <div>
                    <h3>{data.name}</h3>
                    <span className="creator-review-id">{creator.creatorId}</span>
                  </div>
                </div>
                <div className="creator-review-details">
                  <div className="creator-review-row"><MapPin size={16} /><span>{data.location.city || '—'}, {data.location.state || '—'}</span></div>
                  <div className="creator-review-row"><Briefcase size={16} /><span>{data.primaryProfession || '—'}</span></div>
                  <div className="creator-review-row"><Phone size={16} /><span>{creator.phone || creator.email || '—'}</span></div>
                </div>
                <div className="creator-review-status-box">
                  <AlertTriangle size={16} style={{ color: '#FBBF24' }} />
                  <span>Your profile will be reviewed by the ADDUS admin team. You'll receive a notification once approved.</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="creator-error-msg">{error}</div>}
        </div>

        {/* Navigation */}
        <div className="creator-register-nav">
          {step > 0 && (
            <button className="creator-secondary-btn" onClick={prev}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button className="creator-primary-btn" onClick={next}>
              {step === 1 ? 'Skip' : 'Continue'} <ChevronRight size={16} />
            </button>
          ) : (
            <button className="creator-primary-btn creator-submit-btn" onClick={handleSubmit}>
              <CheckCircle size={16} /> Submit for Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Creator Dashboard ───────────────────────────────────────────────────────

function CreatorDashboard({ creator, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentCreator, setCurrentCreator] = useState(creator);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const refresh = () => {
      const updated = creatorAuthService.getCreatorById(creator.creatorId);
      if (updated) setCurrentCreator(updated);
    };
    window.addEventListener('addus_creator_store_updated', refresh);
    return () => window.removeEventListener('addus_creator_store_updated', refresh);
  }, [creator.creatorId]);

  const score = creatorScoreEngine.getScore(creator.creatorId);
  const scoreLabel = score ? creatorScoreEngine.getScoreLabel(score.overallScore) : null;
  const improvements = creatorScoreEngine.getImprovementSuggestions(creator.creatorId);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'projects', label: 'Work Allocation', icon: FolderOpen },
    { id: 'portfolio', label: 'Portfolio', icon: Award },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const statusConfig = {
    draft: { label: 'Draft', color: '#6B7280', icon: Edit3 },
    submitted: { label: 'Under Review', color: '#FBBF24', icon: Clock },
    under_review: { label: 'Under Review', color: '#FBBF24', icon: Clock },
    approved: { label: 'Verified', color: '#34D399', icon: CheckCircle },
    rejected: { label: 'Action Required', color: '#F87171', icon: AlertTriangle }
  };

  const statusInfo = statusConfig[currentCreator.verificationStatus] || statusConfig.draft;
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`admin-layout ${isMobile ? 'is-mobile-view' : ''}`} style={{ background: '#060813' }}>
      {isMobile && sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar creator-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="admin-sidebar-brand">
          <Camera size={18} style={{ color: '#818CF8' }} />
          <div>
            <div className="sidebar-brand-name">ADDUS</div>
            <div className="sidebar-brand-sub">Creator Portal</div>
          </div>
          {isMobile && sidebarOpen && (
            <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          )}
        </div>

        {/* Creator ID Badge */}
        <div className="creator-sidebar-id-badge">
          <div className="creator-sidebar-avatar">
            {currentCreator.profilePhoto ? <img src={currentCreator.profilePhoto} alt="" /> : <User size={20} />}
          </div>
          <div>
            <div className="creator-sidebar-name">{currentCreator.name || 'Creator'}</div>
            <div className="creator-sidebar-id-tag">{creator.creatorId}</div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="creator-sidebar-status" style={{ borderColor: `${statusInfo.color}40`, background: `${statusInfo.color}10` }}>
          <StatusIcon size={14} style={{ color: statusInfo.color }} />
          <span style={{ color: statusInfo.color }}>{statusInfo.label}</span>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
                onClick={() => { setActiveTab(item.id); if (isMobile) setSidebarOpen(false); }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="admin-nav-item admin-logout-btn" onClick={onLogout}>
          <LogOut size={18} /> <span>Logout</span>
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen && isMobile ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-topbar-title">
            <Camera size={18} style={{ color: '#818CF8' }} />
            <span>Creator Workspace</span>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-badge-live" style={{ color: '#818CF8' }}>● {creator.creatorId}</span>
          </div>
        </header>

        <main className="admin-content">
          {/* Rejection Banner */}
          {currentCreator.verificationStatus === 'rejected' && (
            <div className="creator-rejection-banner">
              <AlertTriangle size={18} />
              <div>
                <strong>Profile Rejected.</strong> {currentCreator.rejectionReason}
                <button className="creator-link-btn" onClick={() => setActiveTab('profile')}>Fix & Resubmit →</button>
              </div>
            </div>
          )}

          {/* Pending Banner */}
          {(currentCreator.verificationStatus === 'submitted' || currentCreator.verificationStatus === 'under_review') && (
            <div className="creator-pending-banner">
              <Clock size={18} />
              <span>Your profile is under review. We'll notify you once approved.</span>
            </div>
          )}

          {activeTab === 'home' && (
            <div className="admin-tab-content fade-in">
              <div className="admin-section-header">
                <div>
                  <h2>Welcome back, {currentCreator.name?.split(' ')[0] || 'Creator'} 👋</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                    Creator ID: <strong style={{ color: '#818CF8' }}>{creator.creatorId}</strong> · {currentCreator.primaryProfession || 'Profile Incomplete'}
                  </p>
                </div>
              </div>

              {/* Score Card */}
              <div className="creator-score-card margin-top-16">
                <div className="creator-score-header">
                  <div>
                    <h3>Creator Score</h3>
                    <p className="creator-score-sub">Your performance across 10 dimensions</p>
                  </div>
                  {score ? (
                    <div className="creator-score-badge" style={{ background: `${scoreLabel.color}20`, border: `1px solid ${scoreLabel.color}40` }}>
                      <span className="creator-score-number" style={{ color: scoreLabel.color }}>{score.overallScore}</span>
                      <span className="creator-score-label" style={{ color: scoreLabel.color }}>{scoreLabel.label}</span>
                    </div>
                  ) : (
                    <div className="creator-score-badge-empty">
                      <Star size={20} style={{ color: '#6B7280' }} />
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>No Score Yet</span>
                    </div>
                  )}
                </div>

                {score ? (
                  <div className="creator-score-dimensions">
                    {Object.entries(score.dimensions || {}).map(([key, val]) => (
                      <div key={key} className="creator-score-dim-row">
                        <span className="creator-score-dim-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                        <div className="creator-score-bar-wrap">
                          <div className="creator-score-bar-fill" style={{ width: `${val}%`, background: val >= 80 ? '#34D399' : val >= 60 ? '#FBBF24' : '#F87171' }} />
                        </div>
                        <span className="creator-score-dim-val">{val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="creator-score-placeholder-msg">Score will appear after your first completed project.</p>
                )}
              </div>

              {/* Improvement Suggestions */}
              {improvements.length > 0 && (
                <div className="creator-improvements-card margin-top-16">
                  <h4><TrendingUp size={16} /> Improve Your Score</h4>
                  <div className="creator-improvements-list">
                    {improvements.map((s, i) => (
                      <div key={i} className={`creator-improvement-item priority-${s.priority}`}>
                        <div className="creator-improvement-dot" />
                        <span>{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="admin-kpi-grid margin-top-16">
                <div className="admin-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(129,140,248,0.15)', color: '#818CF8' }}>
                    <Award size={20} />
                  </div>
                  <div className="kpi-body">
                    <span className="kpi-label">Portfolio Items</span>
                    <h3 className="kpi-value">{currentCreator.categories?.reduce((s, c) => s + (c.portfolio?.length || 0), 0) || 0}</h3>
                    <span className="kpi-sub">Across all categories</span>
                  </div>
                </div>
                <div className="admin-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div className="kpi-body">
                    <span className="kpi-label">Verification</span>
                    <h3 className="kpi-value">{statusInfo.label}</h3>
                    <span className="kpi-sub" style={{ color: statusInfo.color }}>Profile status</span>
                  </div>
                </div>
                <div className="admin-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}>
                    <Briefcase size={20} />
                  </div>
                  <div className="kpi-body">
                    <span className="kpi-label">Specialisations</span>
                    <h3 className="kpi-value">{currentCreator.categories?.length || 1}</h3>
                    <span className="kpi-sub">Active categories</span>
                  </div>
                </div>
                <div className="admin-kpi-card">
                  <div className="kpi-icon-wrap" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>
                    <FileText size={20} />
                  </div>
                  <div className="kpi-body">
                    <span className="kpi-label">Documents</span>
                    <h3 className="kpi-value">{currentCreator.documents?.filter(d => d.status === 'verified').length || 0} / {currentCreator.documents?.length || 0}</h3>
                    <span className="kpi-sub">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <ProjectsTab creator={currentCreator} />
          )}

          {activeTab === 'profile' && (
            <ProfileTab creator={currentCreator} onUpdate={() => {
              const updated = creatorAuthService.getCreatorById(creator.creatorId);
              if (updated) setCurrentCreator(updated);
            }} />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioTab creator={currentCreator} />
          )}

          {activeTab === 'pricing' && (
            <PricingTab creator={currentCreator} />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab creator={currentCreator} />
          )}

          {activeTab === 'availability' && (
            <AvailabilityTab creator={currentCreator} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab creator={currentCreator} />
          )}

          {activeTab === 'earnings' && (
            <EarningsTab creator={currentCreator} />
          )}

          {activeTab !== 'home' && activeTab !== 'profile' && activeTab !== 'portfolio' && activeTab !== 'pricing' && activeTab !== 'documents' && activeTab !== 'availability' && activeTab !== 'projects' && activeTab !== 'earnings' && (
            <div className="admin-tab-content fade-in">
              <div className="admin-section-header">
                <h2>{navItems.find(n => n.id === activeTab)?.label}</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>This section is coming soon.</p>
              </div>
              <div className="creator-coming-soon-box">
                <div className="creator-coming-soon-icon">🚀</div>
                <h3>Coming Soon</h3>
                <p>This workspace module is being built. Check back soon.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ creator, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(creator.name || '');
  const [availStatus, setAvailStatus] = useState(creator.availabilityStatus || 'available');

  const handleSave = () => {
    creatorAuthService.updateCreator(creator.creatorId, { name, availabilityStatus: availStatus });
    onUpdate();
    setEditing(false);
  };

  const handleResubmit = () => {
    creatorAuthService.submitForReview(creator.creatorId);
    onUpdate();
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <h2>My Profile</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!editing && <button className="admin-primary-btn micro-btn" onClick={() => setEditing(true)}><Edit3 size={14} /> Edit</button>}
          {(creator.verificationStatus === 'draft' || creator.verificationStatus === 'rejected') && (
            <button className="creator-submit-profile-btn" onClick={handleResubmit}><ChevronRight size={14} /> Submit for Review</button>
          )}
        </div>
      </div>

      <div className="creator-profile-card margin-top-16">
        <div className="creator-profile-header">
          <div className="creator-profile-avatar-wrap">
            {creator.profilePhoto ? <img src={creator.profilePhoto} alt="" className="creator-profile-avatar" /> : <div className="creator-profile-avatar-empty"><User size={40} /></div>}
          </div>
          <div className="creator-profile-info">
            {editing ? (
              <input className="creator-input" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
            ) : (
              <h2>{creator.name || '—'}</h2>
            )}
            <div className="creator-profile-id">{creator.creatorId}</div>
            <div className="creator-profile-profession">{creator.primaryProfession || 'Profession not set'}</div>
          </div>
        </div>

        <div className="creator-profile-grid">
          <div className="creator-profile-detail">
            <label>Location</label>
            <span>{[creator.location?.city, creator.location?.state].filter(Boolean).join(', ') || '—'}</span>
          </div>
          <div className="creator-profile-detail">
            <label>Mobile</label>
            <span>{creator.phone || '—'}</span>
          </div>
          <div className="creator-profile-detail">
            <label>Email</label>
            <span>{creator.email || '—'}</span>
          </div>
          <div className="creator-profile-detail">
            <label>Availability</label>
            {editing ? (
              <select className="creator-select" value={availStatus} onChange={e => setAvailStatus(e.target.value)}>
                {['available', 'busy', 'leave', 'holiday', 'travelling', 'unavailable'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            ) : (
              <span style={{ textTransform: 'capitalize' }}>{creator.availabilityStatus || '—'}</span>
            )}
          </div>
        </div>

        {editing && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="creator-primary-btn" onClick={handleSave}><Save size={16} /> Save Changes</button>
            <button className="creator-secondary-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Portfolio Tab ───────────────────────────────────────────────────────────

function PortfolioTab({ creator }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ projectName: '', clientName: '', year: '', description: '', location: '' });

  const allPortfolio = (creator.categories || []).flatMap(c => (c.portfolio || []).map(p => ({ ...p, categoryName: c.professionName })));

  const handleAdd = () => {
    const cats = creator.categories || [];
    if (cats.length === 0) return;
    const updatedCats = cats.map((c, i) => i === 0 ? {
      ...c,
      portfolio: [...(c.portfolio || []), { ...newItem, portfolioId: `pf_${Date.now()}`, mediaFiles: [], createdAt: new Date().toISOString() }]
    } : c);
    creatorAuthService.updateCreator(creator.creatorId, { categories: updatedCats });
    setNewItem({ projectName: '', clientName: '', year: '', description: '', location: '' });
    setShowAdd(false);
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Portfolio</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Showcase your best work across all categories.</p>
        </div>
        <button className="admin-primary-btn micro-btn" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Project</button>
      </div>

      {allPortfolio.length === 0 && !showAdd ? (
        <div className="creator-empty-state margin-top-24">
          <Award size={40} style={{ color: '#374151' }} />
          <p>No portfolio items yet. Add your best projects to boost your creator score.</p>
        </div>
      ) : (
        <div className="creator-portfolio-grid margin-top-16">
          {allPortfolio.map(item => (
            <div key={item.portfolioId} className="creator-portfolio-card">
              <div className="creator-portfolio-media-placeholder">
                {item.mediaFiles?.length > 0 ? <img src={item.mediaFiles[0]?.url} alt="" /> : <FolderOpen size={32} style={{ color: '#374151' }} />}
              </div>
              <div className="creator-portfolio-info">
                <h4>{item.projectName || 'Untitled Project'}</h4>
                <span className="creator-portfolio-category">{item.categoryName}</span>
                <div className="creator-portfolio-meta">
                  {item.clientName && <span>Client: {item.clientName}</span>}
                  {item.year && <span>{item.year}</span>}
                </div>
                {item.description && <p className="creator-portfolio-desc">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="creator-add-portfolio-form margin-top-20">
          <h4>Add Portfolio Project</h4>
          <div className="creator-location-grid">
            {[
              { key: 'projectName', label: 'Project Name', placeholder: 'e.g. Zomato Product Reel' },
              { key: 'clientName', label: 'Client Name', placeholder: 'e.g. Zomato India' },
              { key: 'year', label: 'Year', placeholder: 'e.g. 2025' },
              { key: 'location', label: 'Location', placeholder: 'e.g. Mumbai' }
            ].map(f => (
              <div key={f.key} className="creator-form-field">
                <label>{f.label}</label>
                <input className="creator-input" placeholder={f.placeholder} value={newItem[f.key]} onChange={e => setNewItem(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="creator-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea className="creator-textarea" placeholder="Brief description of the project..." value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button className="creator-primary-btn" onClick={handleAdd}><Save size={16} /> Save Project</button>
            <button className="creator-secondary-btn" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pricing Tab ─────────────────────────────────────────────────────────────

function PricingTab({ creator }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [tempPricing, setTempPricing] = useState({});

  const handleSave = (catIdx) => {
    const cats = [...(creator.categories || [])];
    cats[catIdx] = { ...cats[catIdx], pricing: tempPricing, pricingAdminApproved: false };
    creatorAuthService.updateCreator(creator.creatorId, { categories: cats });
    setEditingIdx(null);
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Pricing</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Set your rates per category. Admin approval required before going live.</p>
        </div>
      </div>

      {(creator.categories || []).map((cat, catIdx) => (
        <div key={cat.categoryId || catIdx} className="creator-pricing-category-card margin-top-16">
          <div className="creator-pricing-cat-header">
            <h4>{cat.professionName}</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {cat.pricingAdminApproved ? (
                <span className="admin-badge admin-badge-green">✓ Approved</span>
              ) : cat.pricing ? (
                <span className="admin-badge admin-badge-yellow">⏳ Pending Approval</span>
              ) : null}
              <button className="admin-primary-btn micro-btn" onClick={() => { setEditingIdx(catIdx); setTempPricing(cat.pricing || {}); }}>
                <Edit3 size={14} /> Edit Pricing
              </button>
            </div>
          </div>

          {editingIdx === catIdx ? (
            <div className="creator-pricing-form">
              {[
                { key: 'basePrice', label: 'Base Price (₹)', placeholder: 'e.g. 15000' },
                { key: 'travelCharge', label: 'Travel Charge (₹)', placeholder: 'e.g. 2000' },
                { key: 'additionalHourRate', label: 'Additional Hour Rate (₹)', placeholder: 'e.g. 3000' },
                { key: 'editingRate', label: 'Editing Rate (₹)', placeholder: 'e.g. 5000' },
                { key: 'urgentDeliveryRate', label: 'Urgent Delivery Rate (₹)', placeholder: 'e.g. 4000' }
              ].map(f => (
                <div key={f.key} className="creator-form-field">
                  <label>{f.label}</label>
                  <input type="number" className="creator-input" placeholder={f.placeholder}
                    value={tempPricing[f.key] || ''} onChange={e => setTempPricing(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="creator-form-field">
                <label>Custom Note</label>
                <textarea className="creator-textarea" rows={2} placeholder="Any specific pricing notes..."
                  value={tempPricing.customNote || ''} onChange={e => setTempPricing(p => ({ ...p, customNote: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="creator-primary-btn" onClick={() => handleSave(catIdx)}><Save size={16} /> Save Pricing</button>
                <button className="creator-secondary-btn" onClick={() => setEditingIdx(null)}>Cancel</button>
              </div>
              <p style={{ color: '#FBBF24', fontSize: '12px', marginTop: '8px' }}>⚠ Prices require admin approval before going live.</p>
            </div>
          ) : cat.pricing ? (
            <div className="creator-pricing-display">
              {Object.entries(cat.pricing).filter(([k]) => k !== 'customNote').map(([key, val]) => val && (
                <div key={key} className="creator-pricing-row">
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                  <span className="creator-pricing-val">₹{Number(val).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {cat.pricing.customNote && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px' }}>{cat.pricing.customNote}</p>}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '8px' }}>No pricing set yet.</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Documents Tab ───────────────────────────────────────────────────────────

function DocumentsTab({ creator }) {
  const DOC_TYPES = [
    { type: 'pan', label: 'PAN Card' },
    { type: 'aadhaar', label: 'Aadhaar Card' },
    { type: 'driving_licence', label: 'Driving Licence' },
    { type: 'passport', label: 'Passport' },
    { type: 'gst', label: 'GST Certificate' },
    { type: 'bank_details', label: 'Bank Details' },
    { type: 'cancelled_cheque', label: 'Cancelled Cheque' }
  ];

  const handleUpload = (docType, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const docs = creator.documents || [];
      const existing = docs.find(d => d.type === docType);
      const newDoc = { documentId: `doc_${Date.now()}`, type: docType, fileUrl: ev.target.result, fileName: file.name, status: 'pending', uploadedAt: new Date().toISOString() };
      const updatedDocs = existing ? docs.map(d => d.type === docType ? newDoc : d) : [...docs, newDoc];
      creatorAuthService.updateCreator(creator.creatorId, { documents: updatedDocs });
    };
    reader.readAsDataURL(file);
  };

  const docs = creator.documents || [];

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Verification Documents</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Upload identity and financial documents for verification.</p>
        </div>
      </div>

      <div className="creator-documents-grid margin-top-16">
        {DOC_TYPES.map(dt => {
          const doc = docs.find(d => d.type === dt.type);
          const statusColors = { pending: '#FBBF24', verified: '#34D399', rejected: '#F87171' };
          const color = doc ? statusColors[doc.status] || '#6B7280' : '#374151';

          return (
            <div key={dt.type} className="creator-doc-card">
              <div className="creator-doc-header">
                <div>
                  <h4>{dt.label}</h4>
                  {doc ? (
                    <span className="creator-doc-status" style={{ color }}>
                      {doc.status === 'pending' ? '⏳ Pending Verification' : doc.status === 'verified' ? '✓ Verified' : '✗ Rejected'}
                    </span>
                  ) : (
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>Not uploaded</span>
                  )}
                </div>
                {doc?.status !== 'verified' && (
                  <label className="creator-doc-upload-btn">
                    <Upload size={14} /> {doc ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                      onChange={e => handleUpload(dt.type, e.target.files[0])} />
                  </label>
                )}
              </div>
              {doc && <div className="creator-doc-filename">{doc.fileName}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Availability Tab ────────────────────────────────────────────────────────

function AvailabilityTab({ creator }) {
  const STATUS_OPTIONS = ['available', 'busy', 'leave', 'holiday', 'travelling', 'unavailable'];
  const STATUS_COLORS = { available: '#34D399', busy: '#F59E0B', leave: '#818CF8', holiday: '#38BDF8', travelling: '#A78BFA', unavailable: '#F87171' };
  const [currentStatus, setCurrentStatus] = useState(creator.availabilityStatus || 'available');

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
    creatorAuthService.updateCreator(creator.creatorId, { availabilityStatus: status });
  };

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <h2>Availability</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Keep your availability updated so projects match correctly.</p>
      </div>

      <div className="creator-availability-card margin-top-16">
        <h4>Current Status</h4>
        <div className="creator-availability-options">
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              className={`creator-avail-btn ${currentStatus === status ? 'selected' : ''}`}
              style={currentStatus === status ? { background: `${STATUS_COLORS[status]}20`, border: `1px solid ${STATUS_COLORS[status]}`, color: STATUS_COLORS[status] } : {}}
              onClick={() => handleStatusChange(status)}
            >
              <div className="creator-avail-dot" style={{ background: STATUS_COLORS[status] }} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '12px' }}>
          ✓ Status updated. Projects will match your current availability automatically.
        </p>
      </div>

      <div className="creator-availability-note margin-top-16">
        <h4>Calendar integration coming soon</h4>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Full date-by-date availability calendar will be available in the next update.</p>
      </div>
    </div>
  );
}

// ── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ creator }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await creatorApiService.getNotifications(creator.creatorId);
        setNotifications(res.notifications || []);
      } catch (e) {
        console.warn('Notifications load failed:', e);
        setNotifications([]);
      }
      setLoading(false);
    };
    load();
  }, [creator.creatorId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Notifications</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Stay updated on project invitations, messages, and approvals.</p>
        </div>
        {unreadCount > 0 && <span className="admin-count-chip" style={{ background: '#FBBF2420', color: '#FBBF24' }}>{unreadCount} unread</span>}
      </div>

      <div className="creator-notifications-list margin-top-16">
        {loading ? (
          <div className="creator-empty-state"><Loader size={24} style={{ color: '#6B7280' }} /> Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="creator-empty-state"><Bell size={32} style={{ color: '#374151' }} /> No notifications yet</div>
        ) : notifications.map((n, i) => (
          <div key={n.notificationId || i} className={`creator-notification-card ${n.read ? '' : 'unread'}`}>
            <div className="creator-notification-icon">
              {n.type === 'project_invite' ? <FolderOpen size={18} /> : n.type === 'message' ? <MessageSquare size={18} /> : n.type === 'approval' ? <CheckCircle size={18} /> : n.type === 'alert' ? <AlertTriangle size={18} /> : <Bell size={18} />}
            </div>
            <div className="creator-notification-body">
              <div className="creator-notification-title">{n.title || 'Notification'}</div>
              <div className="creator-notification-text">{n.message || n.text || ''}</div>
              <div className="creator-notification-time">{n.timestamp ? new Date(n.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</div>
            </div>
            {!n.read && <div className="creator-notification-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Earnings Tab ─────────────────────────────────────────────────────────────

function EarningsTab({ creator }) {
  const transactions = creator.earnings?.transactions || [];
  const totalEarned = creator.earnings?.totalEarned || 0;
  const pendingPayouts = creator.earnings?.pendingPayouts || 0;
  const availableBalance = totalEarned - pendingPayouts;

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Earnings</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Track your income, payouts, and transaction history.</p>
        </div>
      </div>

      <div className="admin-kpi-grid margin-top-16">
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
            <DollarSign size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Total Earned</span>
            <h3 className="kpi-value">₹{Number(totalEarned).toLocaleString('en-IN')}</h3>
            <span className="kpi-sub">Lifetime earnings</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}>
            <Clock size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Pending Payouts</span>
            <h3 className="kpi-value">₹{Number(pendingPayouts).toLocaleString('en-IN')}</h3>
            <span className="kpi-sub">Awaiting release</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(129,140,248,0.15)', color: '#818CF8' }}>
            <TrendingUp size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Available Balance</span>
            <h3 className="kpi-value">₹{Number(availableBalance).toLocaleString('en-IN')}</h3>
            <span className="kpi-sub">Ready for withdrawal</span>
          </div>
        </div>
      </div>

      <div className="admin-table-wrap margin-top-16">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={5} className="admin-empty-row">No transactions yet</td></tr>
            ) : transactions.map((tx, i) => (
              <tr key={i}>
                <td>{tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                <td>{tx.projectId || tx.projectName || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{tx.type || 'payment'}</td>
                <td style={{ color: '#34D399', fontWeight: 600 }}>₹{Number(tx.amount || 0).toLocaleString('en-IN')}</td>
                <td>
                  <span className="admin-status-chip" style={{
                    color: tx.status === 'paid' ? '#34D399' : tx.status === 'pending' ? '#FBBF24' : '#6B7280',
                    borderColor: tx.status === 'paid' ? '#34D399' : tx.status === 'pending' ? '#FBBF24' : '#6B7280'
                  }}>
                    ● {tx.status || 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { ProjectsTab } from './components/ProjectsTab.jsx';

export function CreatorApp() {
  const [session, setSession] = useState(() => creatorAuthService.getSession());
  const [creator, setCreator] = useState(() => {
    const s = creatorAuthService.getSession();
    return s ? creatorAuthService.getCreatorById(s.creatorId) : null;
  });
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const handleVerified = ({ creator: c, isExisting }) => {
    setCreator(c);
    const freshCreator = creatorAuthService.getCreatorById(c.creatorId);
    const isProfileComplete = freshCreator?.name && freshCreator?.primaryProfession;
    if (!isExisting || !isProfileComplete) {
      setNeedsRegistration(true);
    } else {
      setNeedsRegistration(false);
    }
    setSession(creatorAuthService.getSession());
  };

  const handleRegistrationComplete = (updatedCreator) => {
    creatorAuthService.submitForReview(updatedCreator.creatorId);
    setCreator(creatorAuthService.getCreatorById(updatedCreator.creatorId));
    setNeedsRegistration(false);
  };

  const handleLogout = () => {
    creatorAuthService.logout();
    setSession(null);
    setCreator(null);
    setNeedsRegistration(false);
  };

  useEffect(() => {
    const handler = () => {
      setSession(null);
      setCreator(null);
      setNeedsRegistration(false);
    };
    window.addEventListener('addus_creator_logout', handler);
    return () => window.removeEventListener('addus_creator_logout', handler);
  }, []);

  if (!session) {
    return <OTPLoginStep onVerified={handleVerified} />;
  }

  if (needsRegistration || (creator && !creator.name)) {
    return <RegistrationWizard creator={creator} onComplete={handleRegistrationComplete} />;
  }

  return <CreatorDashboard creator={creator} onLogout={handleLogout} />;
}

export default CreatorApp;
