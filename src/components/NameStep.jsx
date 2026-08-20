import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';

export function NameStep({ name, onSaveName }) {
  const [inputName, setInputName] = useState(name || '');
  const [greeting, setGreeting] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    setGreeting(`Nice to meet you, ${inputName.trim()} 😊`);
    setTimeout(() => {
      onSaveName(inputName.trim());
    }, 1200);
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <div className="icon-badge">
          <User size={22} className="accent-icon" />
        </div>
        <h2 className="step-title">What should I call you?</h2>
         <p className="step-subtitle">ADDI will use your name to personalize your experience.</p>
      </div>

      <form onSubmit={handleSubmit} className="phone-form">
        <div className="input-group">
          <input
            type="text"
            className="phone-input"
            placeholder="Enter your name (e.g. Alex, Sarah...)"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            autoFocus
          />
        </div>

        {greeting && (
          <div className="success-banner flex-center fade-in">
            <span>{greeting}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!inputName.trim() || !!greeting}
          className={`primary-btn ${inputName.trim() && !greeting ? 'pulse-glow' : 'btn-disabled'}`}
        >
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
