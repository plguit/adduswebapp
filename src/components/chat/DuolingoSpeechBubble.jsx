import React from 'react';

/**
 * DuolingoSpeechBubble — Single AI Speech Bubble Container.
 * Styled directly with 24px border radius, 2px #3A3558 border, #1D1A34 dark fill,
 * and a small 12x14px rounded left-centered tail notch.
 */
export function DuolingoSpeechBubble({ children, className = '', style = {} }) {
  return (
    <div className={`duolingo-speech-bubble ${className}`} style={style}>
      {/* Duolingo Left Speech Tail SVG (Top 28px, 30% larger) */}
      <svg
        className="duolingo-tail-notch"
        width="16"
        height="18"
        viewBox="0 0 16 18"
        fill="none"
        style={{
          position: 'absolute',
          left: '-14px',
          top: '28px',
          width: '16px',
          height: '18px',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      >
        <path
          d="M 16 0 C 10 3, 0 5, 0 9 C 0 13, 10 15, 16 18 Z"
          fill="#1D1A34"
          stroke="#3A3558"
          strokeWidth="2"
        />
        {/* Seam eraser line — erases card border line where tail connects */}
        <line
          x1="15.5"
          y1="1"
          x2="15.5"
          y2="17"
          stroke="#1D1A34"
          strokeWidth="3.5"
        />
      </svg>

      {children}
    </div>
  );
}

export default DuolingoSpeechBubble;
