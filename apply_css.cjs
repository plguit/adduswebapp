const fs = require('fs');

const cssRules = `

/* ==========================================================================
   ADDI REFINED ONBOARDING LAYOUT (ACTIVE MASCOT & COMPLETED CHAT STYLING)
   ========================================================================== */

/* Main Onboarding Container */
.white-onboarding-container {
  width: 100% !important;
  max-width: 600px !important;
  margin: 0 auto !important;
  padding: 24px 20px 60px 20px !important;
  box-sizing: border-box !important;
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  color: #111111 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
}

/* --- ACTIVE ADDI MESSAGE (WITH LARGE MASCOT) --- */
.active-addi-section {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 20px !important;
  margin-bottom: 32px !important;
  width: 100% !important;
  position: relative !important;
}

/* 140px - 180px Desktop Mascot */
.active-mascot-wrapper,
.addi-mascot-large {
  width: 160px !important;
  height: 160px !important;
  min-width: 160px !important;
  min-height: 160px !important;
  max-width: 160px !important;
  max-height: 160px !important;
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: visible !important;
}

.active-mascot-wrapper .mascot-lottie-wrapper,
.active-mascot-wrapper svg,
.addi-mascot-large svg {
  width: 160px !important;
  height: 160px !important;
  max-width: 160px !important;
  max-height: 160px !important;
  object-fit: contain !important;
}

/* Active ADDI WhatsApp-Style Bubble */
.active-addi-bubble {
  position: relative !important;
  flex: 1 !important;
  border-radius: 16px !important;
  border-top-left-radius: 4px !important;
  padding: 16px 20px !important;
  background: #FFFFFF !important;
  background-color: #FFFFFF !important;
  border: 1.5px solid transparent !important;
  background-image: linear-gradient(#FFFFFF, #FFFFFF), linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%) !important;
  background-origin: border-box !important;
  background-clip: padding-box, border-box !important;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08) !important;
  color: #111111 !important;
  text-align: left !important;
  overflow: visible !important;
}

.active-addi-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 24px !important;
  left: -8px !important;
  width: 0 !important;
  height: 0 !important;
  border-top: 7px solid transparent !important;
  border-bottom: 7px solid transparent !important;
  border-right: 8px solid #6366F1 !important;
}

.active-addi-bubble::after {
  content: '' !important;
  position: absolute !important;
  top: 25px !important;
  left: -6px !important;
  width: 0 !important;
  height: 0 !important;
  border-top: 6px solid transparent !important;
  border-bottom: 6px solid transparent !important;
  border-right: 7px solid #FFFFFF !important;
}

.addi-title-text {
  font-family: 'Manrope', sans-serif !important;
  font-size: 15px !important;
  font-weight: 800 !important;
  color: #111111 !important;
  line-height: 1.4 !important;
  margin-bottom: 4px !important;
}

.addi-desc-text {
  font-family: 'Manrope', sans-serif !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  color: #4B5563 !important;
  line-height: 1.45 !important;
  margin: 0 !important;
}

/* --- COMPLETED ADDI MESSAGES (NO MASCOT) --- */
.completed-addi-row {
  display: flex !important;
  justify-content: flex-start !important;
  width: 100% !important;
  margin-bottom: 14px !important;
}

.whatsapp-addi-bubble,
.duolingo-speech-bubble,
.past-speech-bubble,
.chat-message-bubble,
.addi-gradient-border-bubble {
  position: relative !important;
  max-width: 460px !important;
  border-radius: 16px !important;
  border-top-left-radius: 4px !important;
  padding: 14px 18px !important;
  background: #FFFFFF !important;
  background-color: #FFFFFF !important;
  border: 1.5px solid transparent !important;
  background-image: linear-gradient(#FFFFFF, #FFFFFF), linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%) !important;
  background-origin: border-box !important;
  background-clip: padding-box, border-box !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04) !important;
  color: #111111 !important;
  text-align: left !important;
  overflow: visible !important;
}

.whatsapp-addi-bubble::before,
.duolingo-speech-bubble::before,
.past-speech-bubble::before,
.addi-gradient-border-bubble::before {
  content: '' !important;
  position: absolute !important;
  top: 14px !important;
  left: -8px !important;
  width: 0 !important;
  height: 0 !important;
  border-top: 7px solid transparent !important;
  border-bottom: 7px solid transparent !important;
  border-right: 8px solid #6366F1 !important;
}

.whatsapp-addi-bubble::after,
.duolingo-speech-bubble::after,
.past-speech-bubble::after,
.addi-gradient-border-bubble::after {
  content: '' !important;
  position: absolute !important;
  top: 15px !important;
  left: -6px !important;
  width: 0 !important;
  height: 0 !important;
  border-top: 6px solid transparent !important;
  border-bottom: 6px solid transparent !important;
  border-right: 7px solid #FFFFFF !important;
}

.addi-badge-name,
.conversational-sender-tag {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.06em !important;
  text-transform: uppercase !important;
  color: #6366F1 !important;
  margin-bottom: 4px !important;
}

.online-dot {
  width: 7px !important;
  height: 7px !important;
  border-radius: 50% !important;
  background-color: #10B981 !important;
  display: inline-block !important;
}

/* User Right-Aligned WhatsApp Bubble */
.whatsapp-user-bubble,
.duolingo-user-bubble {
  align-self: flex-end !important;
  margin-left: auto !important;
  max-width: 380px !important;
  background: #FFFFFF !important;
  background-color: #FFFFFF !important;
  color: #111111 !important;
  font-family: 'Manrope', sans-serif !important;
  font-size: 13.5px !important;
  font-weight: 600 !important;
  padding: 10px 16px !important;
  border-radius: 14px !important;
  border-bottom-right-radius: 4px !important;
  border: 1.5px solid transparent !important;
  background-image: linear-gradient(#FFFFFF, #FFFFFF), linear-gradient(135deg, #6366F1 0%, #EC4899 100%) !important;
  background-origin: border-box !important;
  background-clip: padding-box, border-box !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin-top: 4px !important;
  margin-bottom: 16px !important;
}

.whatsapp-user-bubble svg,
.duolingo-user-bubble svg {
  color: #6366F1 !important;
  stroke: #6366F1 !important;
}

/* Heading: "What would you like to share?" */
.onboarding-subheading {
  font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-size: 20px !important;
  font-weight: 800 !important;
  color: #000000 !important;
  margin: 0 0 16px 0 !important;
  letter-spacing: -0.02em !important;
  text-align: left !important;
  line-height: 1.3 !important;
}

/* Accordion Cards */
.accordion-cards-group {
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  width: 100% !important;
  margin-bottom: 18px !important;
}

.accordion-card {
  border: 1.5px solid #E5E7EB !important;
  border-radius: 14px !important;
  background: #FFFFFF !important;
  transition: all 0.2s ease !important;
  overflow: hidden !important;
  text-align: left !important;
}

.accordion-card.is-active {
  border-color: #8B5CF6 !important;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.08) !important;
}

.accordion-header-btn {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 14px 18px !important;
  background: #FFFFFF !important;
  border: none !important;
  cursor: pointer !important;
  box-sizing: border-box !important;
  text-align: left !important;
}

.accordion-header-left {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}

.accordion-header-icon {
  color: #000000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

.accordion-header-icon svg {
  stroke: #000000 !important;
}

.accordion-header-title {
  font-family: 'Manrope', sans-serif !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #000000 !important;
  margin: 0 !important;
}

.accordion-header-chevron {
  color: #000000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.accordion-header-chevron svg {
  stroke: #000000 !important;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .white-onboarding-container {
    padding: 16px 12px 40px 12px !important;
  }
  .active-mascot-wrapper,
  .addi-mascot-large {
    width: 100px !important;
    height: 100px !important;
    min-width: 100px !important;
    min-height: 100px !important;
    max-width: 100px !important;
    max-height: 100px !important;
  }
  .active-mascot-wrapper .mascot-lottie-wrapper,
  .active-mascot-wrapper svg {
    width: 100px !important;
    height: 100px !important;
  }
  .active-addi-section {
    gap: 12px !important;
    margin-bottom: 20px !important;
  }
  .active-addi-bubble {
    padding: 12px 14px !important;
  }
  .onboarding-subheading {
    font-size: 18px !important;
  }
}
`;

['src/index.css', 'style.css'].forEach(f => {
  if (fs.existsSync(f)) {
    fs.appendFileSync(f, cssRules, 'utf8');
    console.log('Appended CSS to ' + f);
  }
});
