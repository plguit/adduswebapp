import React from 'react';

/**
 * DuolingoSpeechBubble — Premium Duolingo-style Chat Speech Bubble.
 * Features a seamless vector SVG speech tail pointing left toward the mascot's face.
 */
export function DuolingoSpeechBubble({ children, className = '', style = {}, showTail = true }) {
  return (
    <div className={`duolingo-speech-bubble ${className}`} style={style}>
      {showTail && (
        <svg
          className="duolingo-svg-speech-tail"
          width="16"
          height="24"
          viewBox="0 0 16 24"
          fill="none"
          style={{
            position: 'absolute',
            left: '-14px',
            top: '28px',
            width: '16px',
            height: '24px',
            zIndex: 3,
            overflow: 'visible',
            pointerEvents: 'none'
          }}
        >
          {/* Tail vector shape with background fill and matching border stroke */}
          <path
            d="M 16 0 C 10 4, 1 7, 1 12 C 1 17, 10 20, 16 24 Z"
            fill="rgba(26, 26, 38, 0.95)"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="1.5"
          />
          {/* Seam eraser line — erases card border where tail connects for a 100% continuous shape */}
          <line
            x1="15.5"
            y1="1.5"
            x2="15.5"
            y2="22.5"
            stroke="rgba(26, 26, 38, 0.95)"
            strokeWidth="3.5"
          />
        </svg>
      )}
      {children}
    </div>
  );
}
