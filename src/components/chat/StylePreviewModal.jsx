import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Check, Clock, DollarSign, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { referenceLibraryService } from '../../../shared/services/referenceLibraryService.js';
import { getEmbeddableVideoUrl, detectVideoAspectRatio } from '../../../shared/utils/mediaUtils.js';

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

export function StylePreviewModal({ card, onSelect, onClose }) {
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
  const indicativePrice = card.indicativePrice || matchedRef?.indicativePrice || 'Price available after expert review';

  const accentColor = CATEGORY_COLORS[card.style] || '#7C5CFF';
  const serviceType = (card.type || card.style || card.category || '').toLowerCase();
  
  const isVideo = serviceType.includes('video') || serviceType.includes('film') || serviceType.includes('videography') || card.isVideo || matchedRef?.isVideo;
  const isPhoto = serviceType.includes('photo') || serviceType.includes('shoot');
  const isWeb = serviceType.includes('web') || serviceType.includes('ui/ux');
  const isBrand = serviceType.includes('brand') || serviceType.includes('logo');
  const isPackaging = serviceType.includes('packag');
  
  const mediaUrl = card.mediaUrl || matchedRef?.mediaUrl || card.thumbnail || matchedRef?.thumbnail;
  const videoEmbed = isVideo ? getEmbeddableVideoUrl(mediaUrl) : null;

  const defaultRatio = card.aspectRatio || matchedRef?.aspectRatio || detectVideoAspectRatio(card.title, card.subtitle, card.category);
  const [aspectRatioMode, setAspectRatioMode] = useState(defaultRatio || 'portrait');

  return (
    <div className={`spm-overlay ${visible ? 'spm-visible' : ''}`} onClick={handleClose}>
      <div className="spm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Close Button */}
        <button className="spm-close" onClick={handleClose}><X size={18} /></button>

        {/* Video Model/Orientation Switcher Tabs (Simple Tab) */}
        {isVideo && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 0 20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preview Format Model:
            </span>
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '3px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setAspectRatioMode('portrait')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: aspectRatioMode === 'portrait' ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'transparent',
                  color: aspectRatioMode === 'portrait' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.2s ease'
                }}
              >
                <Smartphone size={13} /> Portrait (9:16)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatioMode('landscape')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: aspectRatioMode === 'landscape' ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'transparent',
                  color: aspectRatioMode === 'landscape' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.2s ease'
                }}
              >
                <Monitor size={13} /> Landscape (16:9)
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Media Preview Area */}
        <div 
          className="spm-preview-area" 
          style={{ 
            background: '#0B0F17', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative', 
            overflow: 'hidden',
            minHeight: isVideo ? (aspectRatioMode === 'portrait' ? '580px' : '360px') : '260px',
            padding: '20px',
            transition: 'min-height 0.3s ease'
          }}
        >
          {isVideo && videoEmbed ? (
            aspectRatioMode === 'portrait' ? (
              /* ── 📱 YOUTUBE SHORTS 9:16 THEATER CONTAINER (320px x 568px) ── */
              <div 
                style={{
                  width: '320px',
                  height: '568px',
                  borderRadius: '28px',
                  border: '4px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(124,58,237,0.2)',
                  overflow: 'hidden',
                  background: '#000000',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {videoEmbed.type === 'iframe' ? (
                  <iframe
                    src={videoEmbed.url}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title={card.title}
                  />
                ) : (
                  <video
                    src={videoEmbed.url}
                    controls
                    autoPlay
                    playsInline
                    loop
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', pointerEvents: 'none', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={13} color="#A78BFA" /> 📱 YouTube Shorts / 9:16 Reel View
                </div>
              </div>
            ) : (
              /* ── 🖥️ YOUTUBE CINEMA 16:9 THEATER CONTAINER ── */
              <div 
                style={{
                  width: '100%',
                  maxWidth: '720px',
                  aspectRatio: '16/9',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 0 30px rgba(99,102,241,0.15)',
                  overflow: 'hidden',
                  background: '#000000',
                  position: 'relative'
                }}
              >
                {videoEmbed.type === 'iframe' ? (
                  <iframe
                    src={videoEmbed.url}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    title={card.title}
                  />
                ) : (
                  <video
                    src={videoEmbed.url}
                    controls
                    autoPlay
                    playsInline
                    loop
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', pointerEvents: 'none', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Monitor size={13} color="#38BDF8" /> 🖥️ 16:9 YouTube Cinema View
                </div>
              </div>
            )
          ) : isPhoto && mediaUrl ? (
            <img src={mediaUrl} alt={card.title} style={{ width: '100%', height: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
          ) : (
            <div style={{ color: '#B3B3B3', textAlign: 'center' }}>
              <Clock size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Curated reference preview</p>
            </div>
          )}

          {/* Style label overlay */}
          <div className="spm-style-overlay-label" style={{ top: '10px', right: '10px' }}>
            <span className="spm-style-badge" style={{ background: accentColor }}>
              {card.category || card.type || card.style || 'Portfolio'}
            </span>
          </div>
        </div>

        {/* Info Area */}
        <div className="spm-info" style={{ padding: '20px' }}>
          <h3 className="spm-title" style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
            {card.title}
          </h3>
          
          <div className="spm-description" style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '14px', lineHeight: '1.5' }}>
            {card.subtitle || matchedRef?.subtitle || `High-fidelity 4K video shoot & post-production with professional model curation.`}
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)', borderRadius: '10px', fontSize: '14px', color: '#C4B5FD', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>💰 <strong>Admin Approved Price:</strong></span>
            <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>₹{indicativePrice.replace('₹', '')}</strong>
          </div>

          <button 
            type="button"
            className="duolingo-primary-btn w-full spm-select-btn" 
            onClick={handleSelect}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)'
            }}
          >
            <Check size={18} /> Book This Service Package
          </button>
        </div>
      </div>
    </div>
  );
}

export default StylePreviewModal;
