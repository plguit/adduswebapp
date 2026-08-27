import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, Clock, AlertCircle, CheckCircle2, RotateCcw, Edit2 } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboardingStore.js';
import { useNavigation } from '../../hooks/useNavigation.js';
import { validation } from '../../utils/validation.js';
import { otpService } from '../../services/otpService.js';
import { Button } from '../common/Button.jsx';

/**
 * Step 3: Phone Verification & 4-Box OTP Verification Component
 */
export function PhoneVerificationStep() {
  const { state, updateState } = useOnboardingStore();
  const { navigateTo } = useNavigation();

  // Internal Phase: 'phone' | 'otp'
  const [phase, setPhase] = useState(state.verified ? 'otp' : 'phone');
  
  // Phone Input State
  const [phone, setPhone] = useState(state.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  // OTP 4-Box State
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const boxRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // 30-Second Countdown Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  // Real-time Phone Validation & Handlers
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);

    setPhone(val);

    if (val.length > 0) {
      const res = validation.validateIndianPhone(val);
      setPhoneError(res.error);
    } else {
      setPhoneError('');
    }
  };

  const handlePhoneKeyDown = (e) => {
    // Disable copy-paste shortcuts
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
      e.preventDefault();
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    setPhoneError('Pasting is disabled. Please type your 10-digit mobile number.');
  };

  // Submit Phone -> Send OTP
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    const valRes = validation.validateIndianPhone(phone);
    if (!valRes.isValid) {
      setPhoneError(valRes.error);
      return;
    }

    setPhoneError('');
    setIsSendingOTP(true);

    try {
      const res = await otpService.sendOTP(phone);
      setIsSendingOTP(false);
      
      updateState({ phone });
      setPhase('otp');
      setTimer(30);
      setIsTimerActive(true);
      setOtpSuccessMsg(res.message);
      setOtpError('');
      
      // Auto focus first OTP box
      setTimeout(() => boxRefs[0].current?.focus(), 100);
    } catch (err) {
      setIsSendingOTP(false);
      setPhoneError('Network Error: Unable to send OTP. Please check connection.');
    }
  };

  // 4-Box OTP Handlers
  const handleOtpBoxChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newBoxes = [...otpBoxes];
    newBoxes[index] = char;
    setOtpBoxes(newBoxes);
    setOtpError('');

    if (char && index < 3) {
      boxRefs[index + 1].current?.focus();
    }

    // Auto submit when 4th digit is entered
    if (char && index === 3 && newBoxes.every((b) => b !== '')) {
      verifyCode(newBoxes.join(''));
    }
  };

  const handleOtpBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpBoxes[index] && index > 0) {
        boxRefs[index - 1].current?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    setOtpError('Pasting is disabled. Please enter 4 individual digits.');
  };

  // Verify OTP Action
  const verifyCode = async (codeToVerify) => {
    const code = codeToVerify || otpBoxes.join('');
    if (code.length !== 4) {
      setOtpError('Invalid OTP: Please enter all 4 digits.');
      return;
    }

    if (timer === 0) {
      setOtpError('OTP Expired. Please click Resend OTP to receive a new code.');
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      const res = await otpService.verifyOTP(phone, code, failedAttempts);
      setIsVerifying(false);

      if (res.success) {
        setOtpSuccessMsg(res.message);
        updateState({ verified: true, phone, currentStep: 'name' });
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (res.status === 'MULTIPLE_FAILED_ATTEMPTS' || nextAttempts >= 3) {
          setOtpError('Multiple Failed Attempts. Please click Resend OTP or Edit Number.');
        } else {
          setOtpError(res.message || 'Invalid OTP code. Please try again.');
        }
      }
    } catch (err) {
      setIsVerifying(false);
      setOtpError('Network Error: Unable to verify OTP. Please try again.');
    }
  };

  // Resend OTP Handler
  const handleResendOTP = async () => {
    setOtpError('');
    setOtpBoxes(['', '', '', '']);
    setFailedAttempts(0);

    try {
      const res = await otpService.resendOTP(phone);
      setTimer(30);
      setIsTimerActive(true);
      setOtpSuccessMsg(res.message);
      boxRefs[0].current?.focus();
    } catch (err) {
      setOtpError('Network Error: Could not resend OTP.');
    }
  };

  const isPhoneValid = validation.validateIndianPhone(phone).isValid;

  return (
    <div className="arike-login-screen-wrapper">
      <div className="arike-login-card">
        <div className="arike-logo-row">
          <img src="/ADDUS.png" alt="ADDUS" className="arike-logo-img" onError={(e) => { e.target.onerror = null; e.target.src = "/ADDUS_opt.png"; }} />
        </div>
      <div className="step-header">
        <div className="icon-badge">
          <ShieldCheck size={24} className="accent-icon" />
        </div>
          <h2 className="step-title">
            {phase === 'phone' ? 'Enter your mobile number' : 'Enter 4-Digit OTP'}
          </h2>
          <p className="step-subtitle">
            {phase === 'phone'
              ? 'We will send a 4-digit verification code to get started.'
              : `Code sent to +91 ${phone}`}
          </p>
      </div>

      {phase === 'phone' ? (
        /* --- PHASE 1: PHONE NUMBER FIELD --- */
        <form onSubmit={handleSendOTP} className="phone-form">
          <div className="input-group">
            <span className="country-code">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`phone-input ${phoneError ? 'input-error' : ''}`}
              placeholder="9876543210"
              value={phone}
              onChange={handlePhoneChange}
              onKeyDown={handlePhoneKeyDown}
              onPaste={handlePhonePaste}
              maxLength={10}
              autoFocus
            />
          </div>

          {phoneError && (
            <div className="error-banner flex-center">
              <AlertCircle size={15} />
              <span>{phoneError}</span>
            </div>
          )}

          <div className="estimate-bar flex-center">
            <Clock size={14} />
            <span>Estimated delivery: 30 seconds</span>
          </div>

          <Button
            type="submit"
            disabled={!isPhoneValid || isSendingOTP}
            loading={isSendingOTP}
            icon={ArrowRight}
          >
            {isSendingOTP ? 'Generating OTP...' : 'Continue'}
          </Button>
        </form>
      ) : (
        /* --- PHASE 2: 4-BOX OTP VERIFICATION --- */
        <div className="otp-form fade-in">
          <div className="otp-boxes-wrap" onPaste={handleOtpPaste}>
            {otpBoxes.map((boxVal, idx) => (
              <input
                key={idx}
                ref={boxRefs[idx]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className={`otp-box ${boxVal ? 'box-filled' : ''} ${otpError ? 'box-error' : ''}`}
                value={boxVal}
                onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpBoxKeyDown(idx, e)}
              />
            ))}
          </div>

          {/* Validation & Error Messages */}
          {otpError && (
            <div className="error-banner flex-center fade-in">
              <AlertCircle size={15} />
              <span>{otpError}</span>
            </div>
          )}

          {otpSuccessMsg && !otpError && (
            <div className="success-banner flex-center fade-in">
              <CheckCircle2 size={16} className="success-icon" />
              <span>{otpSuccessMsg}</span>
            </div>
          )}

          {/* Timer & Controls Row */}
          <div className="flex-between margin-top-10">
            <div className="estimate-bar flex-center">
              <Clock size={14} />
              <span>
                {isTimerActive ? `Resend in 0:${timer < 10 ? `0${timer}` : timer}` : 'Timer expired'}
              </span>
            </div>

            <button
              type="button"
              className="edit-phone-btn"
              onClick={() => {
                setPhase('phone');
                setOtpError('');
              }}
            >
              <Edit2 size={12} /> Edit Number
            </button>
          </div>

          {/* Buttons: Verify, Resend, Retry */}
          <div className="action-buttons-row margin-top-20">
            <button
              type="button"
              className="secondary-btn"
              disabled={isTimerActive}
              onClick={handleResendOTP}
            >
              <RotateCcw size={14} />
              <span>Resend OTP</span>
            </button>

            <Button
              onClick={() => verifyCode()}
              disabled={otpBoxes.some((b) => !b) || isVerifying}
              loading={isVerifying}
              icon={ArrowRight}
            >
              Verify OTP
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
