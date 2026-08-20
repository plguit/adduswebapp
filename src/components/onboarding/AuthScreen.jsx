import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Mail, ArrowRight, ShieldCheck, Clock, AlertCircle, CheckCircle2, RotateCcw, Edit2, Sparkles } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { authService } from '../../services/authService.js';
import { emailAuthService } from '../../services/emailAuthService.js';
import { otpService } from '../../services/otpService.js';
import { validation } from '../../utils/validation.js';
import { Button } from '../common/Button.jsx';

/**
 * Dual-Method Authentication Screen
 * Offers 'Continue with Mobile Number' & 'Continue with Email'.
 * Handles OTP verification, returning user detection ("Welcome Back"), and automatic step resumption.
 */
export function AuthScreen() {
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

    if (char && index === 3 && newBoxes.every((b) => b !== '')) {
      verifyCode(newBoxes.join(''));
    }
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      boxRefs[index - 1].current?.focus();
    }
  };

  // Verify OTP Action (Phone or Email)
  const verifyCode = async (codeToVerify) => {
    const code = codeToVerify || otpBoxes.join('');
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

      let targetScreen = 'name';
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

    } catch (err) {
      setIsSubmitting(false);
      setOtpError('Verification failed. Please try again.');
    }
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          <ShieldCheck size={24} className="accent-icon" />
        </div>
        <h2 className="step-title">
           {phase === 'input' ? 'Sign In or Create Account' : 'Enter 4-Digit Verification Code'}
        </h2>
        <p className="step-subtitle">
          {phase === 'input'
            ? 'Access your ADDUS workspace.'
            : `Verification code sent to ${authMethod === 'phone' ? `+91 ${phone}` : email}`}
        </p>
      </div>

      {/* --- PHASE 1: DUAL AUTH METHOD SELECTOR --- */}
      {phase === 'input' ? (
        <div>
          <div className="auth-method-tabs flex-center margin-bottom-20">
            <button
              className={`auth-tab-btn flex-center ${authMethod === 'phone' ? 'auth-tab-active' : ''}`}
              onClick={() => handleSwitchMethod('phone')}
            >
              <Smartphone size={16} />
              <span>Mobile Number</span>
            </button>

            <button
              className={`auth-tab-btn flex-center ${authMethod === 'email' ? 'auth-tab-active' : ''}`}
              onClick={() => handleSwitchMethod('email')}
            >
              <Mail size={16} />
              <span>Email Address</span>
            </button>
          </div>

          <form onSubmit={handleSendCode} className="phone-form">
            {authMethod === 'phone' ? (
              <div className="input-group">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  className={`phone-input ${inputError ? 'input-error' : ''}`}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  autoFocus
                />
              </div>
            ) : (
              <div className="input-group">
                <input
                  type="email"
                  className={`phone-input ${inputError ? 'input-error' : ''}`}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {inputError && (
              <div className="error-banner flex-center">
                <AlertCircle size={15} />
                <span>{inputError}</span>
              </div>
            )}

            <div className="estimate-bar flex-center">
              <Clock size={14} />
              <span>Instant OTP delivery</span>
            </div>

            <Button type="submit" disabled={isSubmitting} loading={isSubmitting} icon={ArrowRight}>
              {isSubmitting ? 'Sending Code...' : 'Continue'}
            </Button>
          </form>
        </div>
      ) : (
        /* --- PHASE 2: 4-BOX OTP VERIFICATION --- */
        <div className="otp-form fade-in">
          <div className="otp-boxes-wrap">
            {otpBoxes.map((boxVal, idx) => (
              <input
                key={idx}
                ref={boxRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-box ${boxVal ? 'box-filled' : ''} ${otpError ? 'box-error' : ''}`}
                value={boxVal}
                onChange={(e) => handleBoxChange(idx, e.target.value)}
                onKeyDown={(e) => handleBoxKeyDown(idx, e)}
              />
            ))}
          </div>

          {otpError && (
            <div className="error-banner flex-center fade-in">
              <AlertCircle size={15} />
              <span>{otpError}</span>
            </div>
          )}

          {successMsg && !otpError && (
            <div className="success-banner flex-center fade-in">
              <CheckCircle2 size={16} className="success-icon" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex-between margin-top-10">
            <div className="estimate-bar flex-center">
              <Clock size={14} />
              <span>{isTimerActive ? `Resend in 0:${timer < 10 ? `0${timer}` : timer}` : 'Timer expired'}</span>
            </div>

            <button type="button" className="edit-phone-btn" onClick={() => setPhase('input')}>
              <Edit2 size={12} /> Edit {authMethod === 'phone' ? 'Number' : 'Email'}
            </button>
          </div>

          <div className="action-buttons-row margin-top-20">
            <button
              type="button"
              className="secondary-btn"
              disabled={isTimerActive}
              onClick={handleSendCode}
            >
              <RotateCcw size={14} />
              <span>Resend Code</span>
            </button>

            <Button onClick={() => verifyCode()} disabled={otpBoxes.some((b) => !b) || isSubmitting} loading={isSubmitting} icon={ArrowRight}>
              Verify & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
