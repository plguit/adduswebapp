import React, { useState, useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import { ArrowRight, AlertCircle, Edit2 } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore.js';
import { authService } from '../../services/authService.js';
import { otpService } from '../../services/otpService.js';
import { validation } from '../../utils/validation.js';

/* ─── Success Mascot: renders lottie directly at full size ─── */
function SuccessMascot() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/lottiefile/mascot_celebration.json',
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: false,
        progressiveLoad: false,
        hideOnTransparent: true
      }
    });
    return () => anim.destroy();
  }, []);
  return (
    <div
      ref={ref}
      style={{ width: '420px', height: '420px' }}
    />
  );
}

/* ─── Indian flag SVG (saffron/white/green + Ashoka Chakra) ─── */
function IndiaFlag({ size = 22 }) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    return { x2: 450 + 80 * Math.sin(angle), y2: 300 - 80 * Math.cos(angle) };
  });
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 600"
      aria-label="India flag"
      style={{ width: size * 1.5, height: size, borderRadius: '3px', display: 'block', flexShrink: 0 }}
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

export function AuthScreen({ onAuthSuccess }) {
  const { updateState } = useOnboardingStore();

  const [phase, setPhase] = useState('input');
  const [phone, setPhone] = useState('');
  const [inputError, setInputError] = useState('');
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMascotSuccess, setShowMascotSuccess] = useState(false);

  const boxRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const prefilledPhone = localStorage.getItem('addus_prefill_phone');
    if (prefilledPhone) {
      setPhone(prefilledPhone);
      localStorage.removeItem('addus_prefill_phone');
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    setInputError('');
    const valRes = validation.validateIndianPhone(phone);
    if (!valRes.isValid) return setInputError(valRes.error);
    setIsSubmitting(true);
    try {
      await otpService.sendOTP(phone);
      setIsSubmitting(false);
      setPhase('otp');
      setTimer(30);
      setIsTimerActive(true);
      setTimeout(() => boxRefs[0].current?.focus(), 150);
    } catch (err) {
      setIsSubmitting(false);
      setInputError(err.message || 'Unable to send verification code. Please try again.');
    }
  };

  const handleBoxChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newBoxes = [...otpBoxes];
    newBoxes[index] = char;
    setOtpBoxes(newBoxes);
    setOtpError('');
    if (char && index < 3) boxRefs[index + 1].current?.focus();
    if (char && index === 3 && newBoxes.every((b) => b !== '')) verifyCode(newBoxes.join(''));
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      boxRefs[index - 1].current?.focus();
    }
  };

  const verifyCode = async (codeToVerify) => {
    const code = codeToVerify || otpBoxes.join('');
    if (code.length !== 4) return setOtpError('Please enter all 4 digits.');
    setIsSubmitting(true);
    setOtpError('');
    try {
      const otpRes = await otpService.verifyOTP(phone, code);
      if (!otpRes.success) { 
        setIsSubmitting(false); 
        return setOtpError(otpRes.message || 'Invalid code'); 
      }

      // Construct verified profile immediately
      const defaultProfile = {
        phoneNumber: phone,
        phone: phone,
        phoneVerified: true,
        verified: true,
        authProvider: 'phone',
        userId: `customer_${phone}`,
        customerId: `customer_${phone}`,
        currentStep: 'business',
        onboardingStatus: 'in_progress'
      };

      // Fast non-blocking backend sync (max 300ms)
      let profile = defaultProfile;
      try {
        const loginPromise = authService.loginWithPhone(phone);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 300));
        const loginRes = await Promise.race([loginPromise, timeoutPromise]);
        if (loginRes?.profile) {
          profile = loginRes.profile;
        }
      } catch (authErr) {
        // Continue with local profile without blocking
      }

      setIsSubmitting(false);
      setShowMascotSuccess(true);

      setTimeout(() => {
        let targetScreen = 'business';
        if (profile.onboardingStatus === 'completed' || profile.lastVisitedScreen === 'dashboard') {
          targetScreen = 'dashboard';
        }
        updateState({ ...profile, phone, verified: true, currentStep: targetScreen });
        if (typeof onAuthSuccess === 'function') {
          onAuthSuccess(profile);
        }
      }, 2500);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setIsSubmitting(false);
      setOtpError('Verification failed. Please try again.');
    }
  };

  /* ──────────────────────────────────────────────────────────────
     SUCCESS SCREEN — dark background, large mascot, white text
  ────────────────────────────────────────────────────────────── */
  if (showMascotSuccess) {
    return (
      <div
        className="fade-in"
        style={{
          position: 'fixed',
          inset: 0,
          background: '#2C2D30',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Mascot — direct lottie, full 420px */}
        <SuccessMascot />

        <h2
          style={{
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: '800',
            color: '#FFFFFF',
            marginTop: '12px',
            marginBottom: 0,
            textAlign: 'center',
            letterSpacing: '-0.5px'
          }}
        >
          Successfully! 🎉
        </h2>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     MAIN WRAPPER — pure white, vertically + horizontally centred
  ────────────────────────────────────────────────────────────── */
  return (
    <div
      className="fade-in"
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Max-width container — matches production ratio */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── ADDUS Logo (actual logo PNG) ── */}
        <div style={{ marginBottom: '36px' }}>
          <img
            src="/addus_logo.png"
            alt="ADDUS"
            style={{ width: '56px', height: '56px', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {phase === 'input' ? (
          /* ══════════════════════════════════════════════════════
             SCREEN 1 — Enter your phone number
          ══════════════════════════════════════════════════════ */
          <div className="fade-in" style={{ width: '100%' }}>

            {/* Heading */}
            <h1
              style={{
                fontSize: 'clamp(28px, 5vw, 38px)',
                fontWeight: '800',
                color: '#0A0A0A',
                textAlign: 'center',
                lineHeight: '1.2',
                margin: '0 0 36px 0',
                letterSpacing: '-0.5px'
              }}
            >
              Enter your<br />phone number
            </h1>

            {/* Phone input pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FFFFFF',
                border: inputError ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                borderRadius: '50px',
                height: '60px',
                padding: '0 20px',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              {/* Flag + code */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <IndiaFlag size={22} />
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>+91</span>
              </div>

              {/* Vertical divider */}
              <div style={{ width: '1px', height: '24px', background: '#CBD5E1', margin: '0 14px', flexShrink: 0 }} />

              {/* Number input */}
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Enter your mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && phone.length === 10) handleSendCode(e); }}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '16px',
                  color: '#111827',
                  fontWeight: '400'
                }}
              />
            </div>

            {/* Error */}
            {inputError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '13px', marginTop: '12px', paddingLeft: '4px' }}>
                <AlertCircle size={14} />
                <span>{inputError}</span>
              </div>
            )}

            {/* Send OTP button — purple when ready, gray when not */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={phone.length < 10 || isSubmitting}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: phone.length === 10 ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : '#E5E7EB',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: phone.length === 10 ? 'pointer' : 'default',
                  boxShadow: phone.length === 10 ? '0 6px 20px rgba(124,58,237,0.35)' : 'none',
                  transition: 'all 0.25s ease',
                  flexShrink: 0
                }}
              >
                {isSubmitting
                  ? <div style={{ width: '20px', height: '20px', border: '2.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <ArrowRight size={22} color={phone.length === 10 ? '#fff' : '#9CA3AF'} strokeWidth={2.5} />
                }
              </button>
            </div>
          </div>

        ) : (
          /* ══════════════════════════════════════════════════════
             SCREEN 2 — Enter the OTP
          ══════════════════════════════════════════════════════ */
          <div className="fade-in" style={{ width: '100%' }}>

            {/* Heading */}
            <h1
              style={{
                fontSize: 'clamp(26px, 5vw, 36px)',
                fontWeight: '800',
                color: '#0A0A0A',
                textAlign: 'center',
                margin: '0 0 16px 0',
                letterSpacing: '-0.5px'
              }}
            >
              Enter the OTP
            </h1>

            {/* Phone + edit */}
            <button
              type="button"
              onClick={() => setPhase('input')}
              style={{
                background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                color: '#64748B', fontSize: '15px', fontWeight: '400',
                cursor: 'pointer', padding: 0, margin: '0 auto 32px auto'
              }}
            >
              <span>+91 {phone}</span>
              <Edit2 size={13} color="#94A3B8" />
            </button>

            {/* 4 OTP boxes */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '24px' }}>
              {otpBoxes.map((boxVal, idx) => (
                <input
                  key={idx}
                  ref={boxRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={boxVal}
                  onChange={(e) => handleBoxChange(idx, e.target.value)}
                  onKeyDown={(e) => handleBoxKeyDown(idx, e)}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '14px',
                    border: otpError ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '26px',
                    fontWeight: '700',
                    color: '#0A0A0A',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                />
              ))}
            </div>

            {/* OTP error */}
            {otpError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '13px', marginBottom: '16px', justifyContent: 'center' }}>
                <AlertCircle size={14} />
                <span>{otpError}</span>
              </div>
            )}

            {/* Timer row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', color: '#94A3B8', marginBottom: '32px' }}>
              <span style={{ fontWeight: '600', color: '#64748B' }}>
                {isTimerActive ? `00:${timer < 10 ? `0${timer}` : timer}` : '00:00'}
              </span>
              <span>•</span>
              {isTimerActive
                ? <span>Resend OTP</span>
                : <button type="button" onClick={handleSendCode} style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: '600', cursor: 'pointer', padding: 0, fontSize: '14px' }}>Resend OTP</button>
              }
            </div>

            {/* Verify button — purple when all OTP filled, gray when not */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: otpBoxes.every((b) => b) && !isSubmitting ? 'auto' : 'none' }}>
              <button
                type="button"
                onClick={() => verifyCode()}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: otpBoxes.every((b) => b) ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : '#E5E7EB',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: otpBoxes.every((b) => b) ? 'pointer' : 'default',
                  boxShadow: otpBoxes.every((b) => b) ? '0 6px 20px rgba(124,58,237,0.35)' : 'none',
                  transition: 'all 0.25s ease',
                  flexShrink: 0
                }}
              >
                {isSubmitting
                  ? <div style={{ width: '20px', height: '20px', border: '2.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <ArrowRight size={22} color={otpBoxes.every((b) => b) ? '#fff' : '#9CA3AF'} strokeWidth={2.5} />
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthScreen;
