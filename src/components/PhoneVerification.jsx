import React, { useState } from 'react';
import { Smartphone, ArrowRight, AlertCircle, X } from 'lucide-react';
import { otpService } from '../services/otpService.js';

// Inline SVG India Flag — proper tricolor with Ashoka Chakra
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

export function PhoneVerification({ phone, onSendOTP, onUpdatePhone }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'x')) {
      e.preventDefault();
      return;
    }
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleInput = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 0) {
      const firstDigit = val.charAt(0);
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        setError('Mobile number must start with 6, 7, 8, or 9');
        val = '';
      } else {
        setError('');
      }
    }
    if (val.length > 10) {
      val = val.slice(0, 10);
    }
    onUpdatePhone(val);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setError('Pasting is disabled. Please type your 10-digit mobile number.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await otpService.sendOTP(phone);
      setLoading(false);
      onSendOTP(phone);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const isValid = phone && phone.length === 10 && ['6', '7', '8', '9'].includes(phone.charAt(0));

  return (
    <div className="manrope-auth-viewport">
      <div className="manrope-auth-container">
        <div className="manrope-icon-header">
          <Smartphone size={34} strokeWidth={1.5} color="#000000" />
        </div>

        <h1 className="manrope-auth-heading-twolines">
          Enter your{`\n`}phone number
        </h1>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="manrope-input-wrapper">
            <div className={`manrope-input-group ${error ? 'has-error' : ''}`}>
              {/* Flag + country code prefix */}
              <span className="manrope-flag-country">
                <IndiaFlag />
                <span className="india-code-text">+91</span>
              </span>
              <input
                type="text"
                inputMode="numeric"
                className="manrope-phone-input"
                placeholder="Enter your mobile number"
                value={phone}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onPaste={handlePaste}
                autoFocus
                maxLength={10}
              />
              {phone && (
                <button type="button" className="manrope-clear-btn" onClick={() => onUpdatePhone('')}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="manrope-error-msg">
              <AlertCircle size={14} /> <span>{error}</span>
            </div>
          )}

          <div className="manrope-cta-right-row">
            <button
              type="submit"
              disabled={!isValid || loading}
              className="manrope-circle-cta"
              title="Get OTP"
            >
              <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
