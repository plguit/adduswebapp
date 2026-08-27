import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Edit2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { otpService } from '../services/otpService.js';

export function OTPVerification({ phone, onEditPhone, onVerifiedSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    const fullCode = newOtp.join('');
    if (fullCode.length === 4) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setError('Pasting is disabled. Please type the 4-digit OTP.');
  };

  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 4) {
      setError('Please enter all 4 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await otpService.verifyOTP(phone, code);
      setLoading(false);

      if (res.success) {
        setIsVerified(true);
        setStatusMessage('Verified successfully.');
        setTimeout(() => {
          if (typeof onVerifiedSuccess === 'function') {
            onVerifiedSuccess();
          }
        }, 800);
      } else {
        if (res.status === 'TOO_MANY_ATTEMPTS') {
          setError('Too many failed attempts. Please click Resend OTP.');
        } else if (res.status === 'OTP_EXPIRED') {
          setError('OTP has expired. Please click Resend OTP.');
        } else {
          setError(res.message || 'Invalid OTP code. Please try again.');
        }
      }
    } catch (err) {
      setLoading(false);
      setError('Network error: Unable to verify OTP.');
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    setOtp(['', '', '', '']);

    try {
      await otpService.sendOTP(phone);
      setLoading(false);
      setResendTimer(30);
      inputRefs[0].current?.focus();
    } catch (err) {
      setLoading(false);
      setError('Network error: Could not resend OTP.');
    }
  };

  return (
    <div className="manrope-auth-viewport">
      <div className="manrope-auth-container">
        <div className="manrope-icon-header">
          <Smartphone size={34} strokeWidth={1.5} color="#000000" />
        </div>

        <h1 className="manrope-auth-heading-otp">Enter the OTP</h1>
        <button
          type="button"
          className="manrope-phone-edit-row"
          onClick={onEditPhone}
        >
          <span>+91 {phone}</span>
          <Edit2 size={14} />
        </button>

        {!isVerified ? (
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} style={{ width: '100%' }}>
            <div className="manrope-otp-boxes">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`manrope-otp-box ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {error && (
              <div className="manrope-error-msg">
                <AlertCircle size={14} /> <span>{error}</span>
              </div>
            )}

            <div className="manrope-timer-text">
              {resendTimer > 0 ? (
                <span>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
              ) : (
                <button
                  type="button"
                  className="manrope-resend-btn"
                  onClick={handleResend}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <div className="manrope-cta-right-row">
              <button
                type="submit"
                disabled={otp.join('').length !== 4 || loading}
                className="manrope-circle-cta"
                title="Continue"
              >
                <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        ) : (
          <div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
