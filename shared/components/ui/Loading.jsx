import React from 'react';

export function Loading({ text = 'Loading...', size = 18, inline = false }) {
  return (
    <div className={`loading-container ${inline ? 'loading-inline' : 'loading-full'}`}>
      <div className="spinner" style={{ width: size, height: size }} />
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
}
