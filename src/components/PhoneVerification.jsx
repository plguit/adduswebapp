import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { otpService } from '../services/otpService.js';
import { validation } from '../services/validation.js';

export function PhoneVerification({ phone, onSendOTP, onUpdatePhone }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyDown = (e) => {
    // Prevent non-numeric keys, spaces, copy/paste shortcuts (Ctrl+C, Ctrl+V, Cmd+C, Cmd+V)
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
    let val = e.target.value.replace(/\D/g, ''); // Strip any non-digit

    // First digit must be 6, 7, 8, or 9
    if (val.length > 0) {
      const firstDigit = val.charAt(0);
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        setError('Mobile number must start with 6, 7, 8, or 9');
        val = '';
      } else {
        setError('');
      }
    }

    // Limit to 10 digits maximum
    if (val.length > 10) {
      val = val.slice(0, 10);
    }

    onUpdatePhone(val);
  };

  const handlePaste = (e) => {
    // Disable paste per requirements
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
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          <ShieldCheck size={22} className="accent-icon" />
        </div>
        <h2 className="step-title">Enter your mobile number</h2>
        <p className="step-subtitle">We will send a 4-digit verification code to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="phone-form">
        <div className="input-group">
          <span className="country-code">+91</span>
          <input
            type="text"
            inputMode="numeric"
            className={`phone-input ${error ? 'input-error' : ''}`}
            placeholder="9876543210"
            value={phone}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onPaste={handlePaste}
            autoFocus
            maxLength={10}
          />
        </div>

        {error && (
          <div className="error-banner flex-center">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="estimate-bar flex-center">
          <Clock size={14} />
          <span>Estimated time: 30 seconds</span>
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className={`primary-btn ${isValid && !loading ? 'pulse-glow' : 'btn-disabled'}`}
        >
          <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
