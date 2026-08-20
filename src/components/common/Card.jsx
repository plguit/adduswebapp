import React from 'react';

/**
 * Reusable Glassmorphic Card Container Component
 */
export function Card({ children, className = '', style = {} }) {
  return (
    <div className={`onboarding-card-wrapper fade-in ${className}`} style={style}>
      {children}
    </div>
  );
}
