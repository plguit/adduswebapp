import React from 'react';

/**
 * Reusable ADDI Typing Indicator Component
 */
export function TypingIndicator({ label = 'ADDI is thinking...' }) {
  return (
    <div className="typing-indicator-container flex-center">
      <div className="avatar-gradient-small">✦</div>
      <div className="typing-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="typing-label">{label}</span>
    </div>
  );
}
