const fs = require('fs');

// 1. UPDATE ConversationalOnboarding.jsx
const file = 'src/components/chat/ConversationalOnboarding.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace history turns past mascot row
content = content.replace(
  /<div className="duolingo-mascot-row past-mascot-row">[\s\S]*?<div className="whatsapp-addi-bubble">/g,
  '<div className="completed-addi-row" style={{ display: "flex", justifyContent: "flex-start", width: "100%", marginBottom: "12px" }}>\n              <div className="whatsapp-addi-bubble">'
);

// Replace Step 3
const step3Target = `{/* STEP 3: BUSINESS UPLOAD / INFORMATION (MINIMAL WHITE THEME) */}
        {stepIndex === 3 && (
          <div className="white-onboarding-container">
            {/* ADDI Intro Section */}
            <div className="addi-intro-section active-addi-section">
              <div className="active-mascot-wrapper">
                <MascotLottiePlayer stepKey={currentStepKey} />
              </div>
              
              {/* WHATSAPP-STYLE ADDI SPEECH BOX WITH THIN PURPLE-PINK GRADIENT BORDER */}
              <div className="whatsapp-addi-bubble active-addi-bubble">
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <div className="addi-title-text">
                  Hi, I'm ADDI.
                </div>
                <p className="addi-desc-text">
                  Tell me about your business and I'll help build your profile.
                </p>
              </div>
            </div>

            {/* Section Heading */}
            <h2 className="onboarding-subheading">
              What would you like to share?
            </h2>

            {/* 2-Option Accordion Cards & Analysis Control */}
            <BusinessUploadWidget 
              onAnalysisComplete={handleBusinessAnalysisDone} 
              activeTab={businessUploadTab}
              onTabChange={setBusinessUploadTab}
            />
          </div>
        )}`;

// Replace Step 4
const step4Target = `{/* STEP 4: COMPLETED ADDI CONVERSATION & ANALYSIS (EXACT REFERENCE WHATSAPP STYLE) */}
        {stepIndex === 4 && (
          <div className="white-onboarding-container">
            {/* 1. FIRST ADDI MESSAGE (NO MASCOT) */}
            <div className="completed-addi-row" style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '14px' }}>
              <div className="whatsapp-addi-bubble" style={{ maxWidth: '440px' }}>
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 800, color: '#111111', lineHeight: '1.4', marginBottom: '4px' }}>
                  Hi, I'm ADDI.
                </div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 500, color: '#4B5563', lineHeight: '1.45', margin: 0 }}>
                  Tell me about your business and I'll help build your profile.
                </p>
              </div>
            </div>

            {/* 2. USER RESPONSE MESSAGE (ON THE RIGHT - NO MASCOT) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '14px' }}>
              <div 
                className="whatsapp-user-bubble"
                onClick={() => setStepIndex(3)}
                style={{ cursor: 'pointer', margin: 0 }}
                title="Click to edit"
              >
                <User size={14} className="user-bubble-icon" />
                <span>Business details uploaded</span>
                <Edit2 size={12} className="user-check-icon" style={{ opacity: 0.7 }} />
              </div>
            </div>

            {/* 3. SECOND ADDI MESSAGE / RESULT (NO MASCOT) */}
            <div className="completed-addi-row" style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '16px' }}>
              <div className="whatsapp-addi-bubble" style={{ maxWidth: '460px', width: '100%' }}>
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 800, color: '#111111', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                  Here's what I understood about your business:
                </div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12.5px', color: '#6B7280', margin: '0 0 12px 0', fontWeight: 500 }}>
                  Review your business brain profile below.
                </p>

                {/* Business Details (Clean Key-Value Rows) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', marginBottom: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6B7280', fontWeight: 600 }}>Business Name</span>
                    <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.businessName || state.businessName || 'Business'}</strong>
                  </div>
                  {(prof.website || prof.url || state.website) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6B7280', fontWeight: 600 }}>Website</span>
                      <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.website || prof.url || state.website}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6B7280', fontWeight: 600 }}>Industry</span>
                    <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.industry || 'Technology'}</strong>
                  </div>
                  {prof.segment && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6B7280', fontWeight: 600 }}>Segment</span>
                      <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.segment}</strong>
                    </div>
                  )}
                  {(prof.businessDescription || prof.summary) && (
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '8px', marginTop: '2px' }}>
                      <span style={{ color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '2px', fontSize: '11px' }}>Summary</span>
                      <p style={{ color: '#111111', margin: 0, lineHeight: 1.45, fontSize: '12.5px', fontWeight: 500 }}>
                        {prof.businessDescription || prof.summary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Small subtle Edit link */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 0',
                      textDecoration: 'underline'
                    }}
                    onClick={() => setStepIndex(3)}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>
            </div>

            {/* 4. BOTTOM ANALYSIS ACTION (Left text: Analysis, Right button: Round Go button) */}
            <div className="analysis-action-bar" style={{ marginTop: '16px' }}>
              <span className="analysis-action-text">Analysis</span>
              <button
                type="button"
                className="analysis-go-circle-btn"
                onClick={() => {
                  if (!prof.businessName) {
                    updateState({
                      businessProfile: {
                        ...prof,
                        businessName: prof.businessName || state.businessName || 'My Business',
                        industry: prof.industry || 'Commercial & Creative Services'
                      }
                    });
                  }
                  handleSelectOption('confirm_profile', 'Profile Confirmed', handleConfirmProfile);
                }}
                title="Continue"
              >
                Go
              </button>
            </div>
          </div>
        )}`;

content = content.replace(
  /\{\/\* STEP 3: BUSINESS UPLOAD \/ INFORMATION[\s\S]*?(?=\{\/\* STEP 4: COMPLETED ADDI)/,
  step3Target + '\n\n        '
);

content = content.replace(
  /\{\/\* STEP 4: COMPLETED ADDI CONVERSATION[\s\S]*?(?=\{\/\* STEP 5: BRANCHING CHOICE)/,
  step4Target + '\n\n        '
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated ConversationalOnboarding.jsx');
