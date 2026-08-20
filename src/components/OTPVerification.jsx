import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { otpService } from '../services/otpService.js';

export function OTPVerification({ phone, onEditPhone, onVerifiedSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('OTP sent to +91 ' + phone);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Countdown timer for Resend OTP
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
    const digit = value.replace(/\D/g, '').slice(-1); // Only allow numeric single digit
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input if digit entered
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-verify if all 4 digits entered
    const fullCode = newOtp.join('');
    if (fullCode.length === 4) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace handling
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Clear previous input and move focus back
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    // Disable paste per requirements
    e.preventDefault();
    setError('Pasting is disabled for security. Please type the 4-digit OTP code.');
  };

  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 4) {
      setError('Please enter all 4 digits of your OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await otpService.verifyOTP(phone, code);
      setLoading(false);

      if (res.success) {
        setIsVerified(true);
        setStatusMessage('Perfect! Your account is ready.');
        setTimeout(() => {
          if (typeof onVerifiedSuccess === 'function') {
            onVerifiedSuccess();
          }
        }, 1500);
      } else {
        if (res.status === 'TOO_MANY_ATTEMPTS') {
          setError('Too many failed attempts. Please click Resend OTP.');
        } else if (res.status === 'OTP_EXPIRED') {
          setError('OTP has expired. Please click Resend OTP.');
        } else {
          setError(res.message || 'Invalid OTP. (Hint: Use mock code 123456)');
        }
      }
    } catch (err) {
      setLoading(false);
      setError('Network error: Unable to verify OTP. Please try again.');
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
      setStatusMessage('A new OTP has been sent to +91 ' + phone);
      inputRefs[0].current?.focus();
    } catch (err) {
      setLoading(false);
      setError('Network error: Could not resend OTP.');
    }
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          {isVerified ? (
            <CheckCircle2 size={24} className="success-icon" />
          ) : (
            <Lock size={22} className="accent-icon" />
          )}
        </div>
        <h2 className="step-title">
          {isVerified ? 'Perfect!' : 'Verification Code'}
        </h2>
        <p className="step-subtitle">
          {isVerified ? (
            <span className="success-subtitle">
              Your account is ready.<br />Now let's understand your business.
            </span>
          ) : (
            <>
              Enter the 4-digit code sent to <strong>+91 {phone}</strong>
              <button type="button" className="edit-phone-btn" onClick={onEditPhone}>
                Edit
              </button>
            </>
          )}
        </p>
      </div>

      {!isVerified && (
        <div className="otp-form">
          <div className="otp-boxes-wrap">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-box ${digit ? 'box-filled' : ''} ${error ? 'box-error' : ''}`}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && (
            <div className="error-banner flex-center">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="hint-pill">
            <span>💡 Mock OTP Code: <strong>1234</strong></span>
          </div>

          <div className="otp-actions flex-between">
            <button
              type="button"
              className="resend-btn"
              disabled={resendTimer > 0 || loading}
              onClick={handleResend}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </span>
            </button>

            <button
              type="button"
              className="primary-btn btn-compact"
              disabled={otp.join('').length !== 4 || loading}
              onClick={() => handleVerify()}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
