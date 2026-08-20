import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Loading Component
 */
export function Loading({ text = 'Loading...', size = 20, inline = false }) {
  if (inline) {
    return (
      <span className="inline-loader flex-center">
        <Loader2 className="spin" size={size} />
        <span>{text}</span>
      </span>
    );
  }

  return (
    <div className="analysis-loading-banner flex-center fade-in">
      <Loader2 className="spin" size={size} />
      <span>{text}</span>
    </div>
  );
}
