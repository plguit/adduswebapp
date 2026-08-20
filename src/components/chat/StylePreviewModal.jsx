import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Check, Clock, DollarSign, Zap } from 'lucide-react';

const CATEGORY_COLORS = {
  Luxury: '#f59e0b',
  Corporate: '#60a5fa',
  Minimal: '#34d399',
  'Tech Startup': '#a78bfa',
  'Modern SaaS': '#38bdf8',
  Documentary: '#fb923c',
  Lifestyle: '#f472b6',
  Animated: '#c084fc',
};

import { referenceLibraryService } from '../../../shared/services/referenceLibraryService.js';

export function StylePreviewModal({ card, onSelect, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    return () => setVisible(false);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSelect = () => {
    setVisible(false);
    setTimeout(() => onSelect(card), 200);
  };

  const activeRefs = referenceLibraryService.getActiveReferences(card.type || card.style || card.title);
  const matchedRef = activeRefs.find(r => r.title === card.title || r.category === card.type) || activeRefs[0];
  const indicativePrice = matchedRef?.indicativePrice || card.indicativePrice || 'Price available after expert review';

  const accentColor = CATEGORY_COLORS[card.style] || '#00D1FF';
  const serviceType = (card.type || card.style || '').toLowerCase();
  
  const isVideo = serviceType.includes('video') || serviceType.includes('film') || serviceType.includes('videography');
  const isPhoto = serviceType.includes('photo') || serviceType.includes('shoot');
  const isWeb = serviceType.includes('web') || serviceType.includes('ui/ux');
  const isBrand = serviceType.includes('brand') || serviceType.includes('logo');
  const isPackaging = serviceType.includes('packag');
  
  const isSupported = isVideo || isPhoto || isWeb || isBrand || isPackaging || Boolean(matchedRef);

  return (
    <div className={`spm-overlay ${visible ? 'spm-visible' : ''}`} onClick={handleClose}>
      <div className="spm-modal" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button className="spm-close" onClick={handleClose}><X size={18} /></button>

        {/* Dynamic Preview Area */}
        <div className="spm-preview-area" style={{ background: isSupported ? '#1A1A24' : '#2B2B36', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          
          {isVideo && (
            <>
              <div className="spm-scanlines" />
              <div className={`spm-video-frame ${isPlaying ? 'spm-playing' : ''}`}>
                {isPlaying && (
                  <div className="spm-video-animation">
                    <div className="spm-pulse-ring" style={{ borderColor: accentColor }} />
                    <div className="spm-pulse-ring spm-pulse-ring-2" style={{ borderColor: accentColor }} />
                    <div className="spm-center-dot" style={{ background: accentColor }} />
                  </div>
                )}
                <button
                  className="spm-play-btn"
                  style={{ borderColor: accentColor, color: accentColor }}
                  onClick={() => setIsPlaying(p => !p)}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
              </div>
            </>
          )}

          {isPhoto && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '16px', width: '100%', height: '100%' }}>
              <div style={{ background: '#2B2B36', borderRadius: '8px', opacity: 0.8 }}></div>
              <div style={{ background: '#3A3A46', borderRadius: '8px', opacity: 0.5 }}></div>
              <div style={{ background: '#3A3A46', borderRadius: '8px', opacity: 0.5 }}></div>
              <div style={{ background: '#2B2B36', borderRadius: '8px', opacity: 0.8 }}></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', color: '#FFF', fontSize: '13px' }}>Photography Portfolio</div>
            </div>
          )}

          {isWeb && (
            <div style={{ width: '80%', height: '70%', background: '#2B2B36', borderRadius: '8px 8px 0 0', border: '1px solid #3A3A46', borderBottom: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ height: '24px', background: '#1A1A24', display: 'flex', alignItems: 'center', padding: '0 8px', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF4B4B' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFC800' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#58CC02' }}></div>
              </div>
              <div style={{ padding: '12px', flex: 1 }}>
                <div style={{ width: '60%', height: '12px', background: '#3A3A46', borderRadius: '4px', marginBottom: '12px' }}></div>
                <div style={{ width: '100%', height: '40px', background: '#1A1A24', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ width: '80%', height: '40px', background: '#1A1A24', borderRadius: '4px' }}></div>
              </div>
            </div>
          )}

          {isBrand && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #00D1FF, #7c5cff)' }}></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#00D1FF' }}></div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#7c5cff' }}></div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#2B2B36' }}></div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>BRAND IDENTITY</div>
            </div>
          )}

          {isPackaging && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100px', height: '140px', background: 'linear-gradient(to bottom right, #3A3A46, #1A1A24)', borderRadius: '12px', border: '2px solid #2B2B36', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', height: '30px', background: '#2B2B36', borderRadius: '4px' }}></div>
              </div>
            </div>
          )}

          {!isSupported && (
            <div style={{ color: '#B3B3B3', textAlign: 'center' }}>
              <Clock size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Reference examples coming soon</p>
            </div>
          )}

          {/* Style label overlay */}
          <div className="spm-style-overlay-label">
            <span className="spm-style-badge" style={{ background: accentColor }}>{card.type || card.style || 'Portfolio'}</span>
          </div>
        </div>

        {/* Info */}
        <div className="spm-info">
          <h3 className="spm-title">{card.title}</h3>
          
          <div className="spm-description">
            {matchedRef?.subtitle || (isSupported 
              ? `Review these examples to see our premium approach to ${card.type || 'this service'}.` 
              : `We are currently curating the best examples for ${card.type || 'this service'}. Our experts will share a custom moodboard with your quotation.`)}
          </div>

          <div style={{ padding: '8px 12px', background: 'rgba(124,92,255,0.1)', borderRadius: '8px', fontSize: '13px', color: '#A78BFA', margin: '12px 0' }}>
            💰 <strong>Indicative Budget:</strong> {indicativePrice}
          </div>

          <button className="primary-btn pulse-glow w-full spm-select-btn" onClick={handleSelect}>
            <Check size={16} /><span>Select this Style</span>
          </button>
        </div>
      </div>
    </div>
  );
}
