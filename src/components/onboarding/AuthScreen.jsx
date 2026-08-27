import React, { useState, useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import { Smartphone, ArrowRight, AlertCircle, CheckCircle2, Edit2, X } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { authService } from '../../services/authService.js';
import { emailAuthService } from '../../services/emailAuthService.js';
import { otpService } from '../../services/otpService.js';
import { validation } from '../../utils/validation.js';
import celebrationLottieData from '../../../lottiefile/mascot_celebration.json';

function CelebrationLottiePlayer({ width = 240, height = 240 }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (animRef.current) {
        animRef.current.destroy();
      }
      const animData = JSON.parse(JSON.stringify(celebrationLottieData?.default || celebrationLottieData));
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animData
      });
    } catch (e) {
      console.warn('Celebration Lottie animationData error, trying URL path:', e);
      try {
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/lottiefile/mascot_celebration.json'
        });
      } catch (err) {
        console.error('All Lottie loaders failed:', err);
      }
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: `${width}px`, height: `${height}px`, margin: '0 auto' }} />;
}

/**
 * Dual-Method Authentication Screen
 * Offers 'Continue with Mobile Number' & 'Continue with Email'.
 * Handles OTP verification, returning user detection ("Welcome Back"), and automatic step resumption.
 */
export function AuthScreen({ onAuthSuccess }) {
  const { updateState } = useOnboardingStore();
  const { navigateTo } = useNavigation();

  // Active Method: 'phone' | 'email'
  const [authMethod, setAuthMethod] = useState('phone');

  // Internal Phase: 'input' | 'otp'
  const [phase, setPhase] = useState('input');

  // Input Fields State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [inputError, setInputError] = useState('');

  // OTP 4-Box State
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  const boxRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Countdown Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  // Method Tab Change Handler
  const handleSwitchMethod = (method) => {
    setAuthMethod(method);
    setPhase('input');
    setInputError('');
    setOtpError('');
    setSuccessMsg('');
    setOtpBoxes(['', '', '', '']);
  };

  // Submit Phone/Email -> Send Code
  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setInputError('');

    if (authMethod === 'phone') {
      const valRes = validation.validateIndianPhone(phone);
      if (!valRes.isValid) return setInputError(valRes.error);

      setIsSubmitting(true);
      try {
        const res = await otpService.sendOTP(phone);
        setIsSubmitting(false);
        setPhase('otp');
        setTimer(30);
        setIsTimerActive(true);
        setSuccessMsg(res.message);
        setTimeout(() => boxRefs[0].current?.focus(), 100);
      } catch (err) {
        setIsSubmitting(false);
        setInputError(err.message || 'Unable to send verification code. Please try again.');
      }

    } else {
      const valRes = emailAuthService.validateEmail(email);
      if (!valRes.isValid) return setInputError(valRes.error);

      setIsSubmitting(true);
      try {
        const res = await emailAuthService.sendEmailOTP(email);
        setIsSubmitting(false);
        setPhase('otp');
        setTimer(30);
        setIsTimerActive(true);
        setSuccessMsg(res.message);
        setTimeout(() => boxRefs[0].current?.focus(), 100);
      } catch (err) {
        setIsSubmitting(false);
        setInputError(err.message || 'Unable to send verification email. Please try again.');
      }
    }
  };

  // 4-Box OTP Handlers
  const handleBoxChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newBoxes = [...otpBoxes];
    newBoxes[index] = char;
    setOtpBoxes(newBoxes);
    setOtpError('');

    if (char && index < 3) {
      boxRefs[index + 1].current?.focus();
    }

    // Removed auto-submit so the user can manually click Verify
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      boxRefs[index - 1].current?.focus();
    }
  };

  // Verify OTP Action (Phone or Email)
  const verifyCode = async () => {
    const code = otpBoxes.join('');
    if (code.length !== 4) {
      return setOtpError('Please enter all 4 digits of the verification code.');
    }

    setIsSubmitting(true);
    setOtpError('');

    try {
      let loginRes = null;

      if (authMethod === 'phone') {
        const otpRes = await otpService.verifyOTP(phone, code);
        if (!otpRes.success) {
          setIsSubmitting(false);
          return setOtpError(otpRes.message);
        }
        loginRes = await authService.loginWithPhone(phone);

      } else {
        const otpRes = await emailAuthService.verifyEmailOTP(email, code);
        if (!otpRes.success) {
          setIsSubmitting(false);
          return setOtpError(otpRes.message);
        }
        loginRes = await authService.loginWithEmail(email);
      }

      setIsSubmitting(false);

      if (loginRes?.error) {
        return setOtpError(loginRes.error);
      }

      const profile = loginRes?.profile;
      if (!profile) {
        return setOtpError('Verification failed. Please try again.');
      }

      setSuccessMsg(loginRes.message);
      setShowCelebrationModal(true);

      setTimeout(() => {
        let targetScreen = 'business_input';
        if (profile.onboardingStatus === 'completed' || profile.lastVisitedScreen === 'dashboard') {
          targetScreen = 'dashboard';
        } else if (profile.lastVisitedScreen && !['splash', 'welcome', 'phone', 'otp', 'auth'].includes(profile.lastVisitedScreen)) {
          targetScreen = profile.lastVisitedScreen;
        }

        updateState({
          ...profile,
          verified: true,
          currentStep: targetScreen
        });

        if (typeof onAuthSuccess === 'function') {
          onAuthSuccess(profile);
        }
      }, 1600);

    } catch (err) {
      setIsSubmitting(false);
      setOtpError('Verification failed. Please try again.');
    }
  };

// Inline SVG India Flag
function IndiaFlag() {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    const x2 = 450 + 80 * Math.sin(angle);
    const y2 = 300 - 80 * Math.cos(angle);
    return { x2, y2 };
  });
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 600"
      className="india-flag-svg"
      aria-label="India flag"
    >
      <rect width="900" height="600" fill="#138808" />
      <rect width="900" height="400" fill="#FFFFFF" />
      <rect width="900" height="200" fill="#FF9933" />
      <circle cx="450" cy="300" r="90" fill="none" stroke="#000088" strokeWidth="8" />
      <circle cx="450" cy="300" r="10" fill="#000088" />
      {spokes.map((s, i) => (
        <line key={i} x1="450" y1="300" x2={s.x2} y2={s.y2} stroke="#000088" strokeWidth="4" />
      ))}
    </svg>
  );
}

  return (
    <>
      <div className="manrope-auth-viewport">
        <div className="manrope-auth-container">

          {/* Phone icon header */}
          <div className="manrope-icon-header">
            <Smartphone size={34} strokeWidth={1.5} color="#000000" />
          </div>

          {phase === 'otp' ? (
            /* ── OTP PHASE ─────────────────────────────────────── */
            <>
              <h1 className="manrope-auth-heading-otp">Enter the OTP</h1>

              <button
                type="button"
                className="manrope-phone-edit-row"
                onClick={() => { setPhase('input'); setOtpBoxes(['','','','']); setOtpError(''); }}
                title="Change phone number"
              >
                <span>+91 {phone}</span>
                <Edit2 size={14} />
              </button>

              <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }} style={{ width: '100%' }}>
                <div className="manrope-otp-boxes">
                  {otpBoxes.map((boxVal, idx) => (
                    <input
                      key={idx}
                      ref={boxRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`manrope-otp-box ${boxVal ? 'filled' : ''} ${otpError ? 'error' : ''}`}
                      value={boxVal}
                      onChange={(e) => handleBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => handleBoxKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="manrope-error-msg">
                    <AlertCircle size={14} />
                    <span>{otpError}</span>
                  </div>
                )}


                <div className="manrope-timer-text">
                  <span>{isTimerActive ? `00:${timer < 10 ? `0${timer}` : timer}` : '00:00'}</span>
                  <span style={{ margin: '0 4px', color: '#D1D5DB' }}>•</span>
                  <button
                    type="button"
                    className="manrope-resend-btn"
                    disabled={isTimerActive}
                    onClick={handleSendCode}
                  >
                    Resend OTP
                  </button>
                </div>

                <div className="manrope-cta-right-row">
                  <button
                    type="submit"
                    className="manrope-circle-cta"
                    disabled={otpBoxes.some((b) => !b) || isSubmitting}
                    title="Verify"
                  >
                    <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* ── PHONE INPUT PHASE ──────────────────────────────── */
            <>
              <h1 className="manrope-auth-heading-twolines">{'Enter your\nphone number'}</h1>

              <form onSubmit={handleSendCode} style={{ width: '100%' }}>
                <div className="manrope-input-wrapper">
                  <div className={`manrope-input-group ${inputError ? 'has-error' : ''}`}>
                    <span className="manrope-flag-country">
                      <IndiaFlag />
                      <span className="india-code-text">+91</span>
                    </span>
                    <input
                      type="tel"
                      className="manrope-phone-input"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setInputError(''); }}
                      maxLength={10}
                      placeholder="Enter your mobile number"
                      autoFocus
                    />
                    {phone && (
                      <button type="button" className="manrope-clear-btn" onClick={() => setPhone('')} tabIndex={-1}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {inputError && (
                  <div className="manrope-error-msg">
                    <AlertCircle size={14} />
                    <span>{inputError}</span>
                  </div>
                )}

                <div className="manrope-cta-right-row">
                  <button
                    type="submit"
                    className="manrope-circle-cta"
                    disabled={phone.length !== 10}
                    title="Get OTP"
                  >
                    <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
                  </button>
                </div>
              </form>
            </>
          )}

        {showCelebrationModal && (
          <div 
            className="celebration-modal-backdrop fade-in" 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100vw', 
              height: '100vh', 
              background: 'rgba(10, 10, 15, 0.88)', 
              backdropFilter: 'blur(12px)', 
              WebkitBackdropFilter: 'blur(12px)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 2147483647,
              padding: '24px'
            }}
          >
            <div 
              className="celebration-modal-card scale-in"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '24px',
                maxWidth: '440px',
                width: '100%',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <CelebrationLottiePlayer width={240} height={240} />
              <h2 
                className="celebration-heading"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#FFFFFF',
                  marginTop: '16px',
                  textShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
                }}
              >
                Successfully! 🎉
              </h2>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export default AuthScreen;

