import React, { useState, useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import {
  Sparkles, Smartphone, Mail, ArrowRight, Clock, AlertCircle, Edit2,
  Check, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Rocket, FileText, Calendar as CalendarIcon, Star,
  Compass, Zap, RefreshCw, X, CheckCircle, User, ShieldCheck, Play, Video,
  Paperclip, Send, Upload, Home, Search, Tv, Film, Dribbble, LayoutGrid, HelpCircle, LogOut, Menu
} from 'lucide-react';
import { useLanguage } from '../../utils/i18n.js';
import { UniversalNotificationEngine } from '../../services/brain/UniversalNotificationEngine.js';
import { 
  validatePhone, 
  validateEmail, 
  validateOTP, 
  validateName, 
  validateBusinessName, 
  validateIndustryOrSegment, 
  validateBusinessDescription, 
  validateURL, 
  validateCustomInput 
} from '../../utils/validators.js';
import { checkDuplicateBusiness, extractDomain } from '../../utils/duplicateDetector.js';
import { LegalPages } from '../../../apps/customer/src/components/LegalPages.jsx';

import { useOnboardingStore } from '../../store/onboardingStore';
import { businessAnalysisService } from '../../services/businessAnalysisService';
import { businessProfileService } from '../../services/businessProfileService';
import { useProjectStore } from '../../store/projectStore';
import { aiService } from '../../services/aiService';
import { apiService } from '../../services/apiService';
import { profileService } from '../../services/profileService';
import { sessionManager } from '../../services/sessionManager';
import { authService } from '../../services/authService';
import { otpService } from '../../services/otpService';
import { emailAuthService } from '../../services/emailAuthService';
import { syncService } from '../../services/syncService';
import { BusinessUploadWidget } from './BusinessUploadWidget';
import { ShootCalendar } from './ShootCalendar';
import { StylePreviewModal } from './StylePreviewModal';
import { DuolingoSpeechBubble } from './DuolingoSpeechBubble';

import celebrationLottieData from '../../../lottiefile/mascot_celebration.json';

/* ─────────────────────────────────────────────────────────────────────────────
   ADDI — Continuous Vertical Conversation Onboarding
   - Splash Screen -> Login Step -> Login Celebration Popup (mascot (2).json) -> Onboarding Stream
   - Recovered Video Showcase Section
   ─────────────────────────────────────────────────────────────────────────── */

function MascotLottiePlayer({ stepKey, path = '/bg/chat.json', loop = true, width, height, className = '' }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (animRef.current) {
        animRef.current.destroy();
      }
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: loop,
        autoplay: true,
        path: path
      });
    } catch (e) {
      console.warn('Lottie player error:', e);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, [stepKey, path, loop]);

  useEffect(() => {
    if (animRef.current) {
      try {
        animRef.current.goToAndPlay(0, true);
      } catch (e) {}
    }
  }, [stepKey]);

  const styleObj = {};
  if (width) styleObj.width = typeof width === 'number' ? `${width}px` : width;
  if (height) styleObj.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={containerRef}
      className={`mascot-lottie-wrapper ${className}`}
      style={styleObj}
    />
  );
}

function CelebrationLottiePlayer({ width = 260, height = 260 }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      if (animRef.current) {
        animRef.current.destroy();
      }
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/lottiefile/mascot_celebration.json'
      });
    } catch (e) {
      console.warn('Celebration Lottie error, trying fallback:', e);
      try {
        const animData = JSON.parse(JSON.stringify(celebrationLottieData?.default || celebrationLottieData));
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animData
        });
      } catch (err) {
        console.error('All Lottie loaders failed:', err);
      }
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: `${width}px`, height: `${height}px`, margin: '0 auto' }} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   STACKED BRANCH CARDS (INTERACTIVE 3-CARD STACK)
   ─────────────────────────────────────────────────────────────────────────── */
function StackedBranchCards({ onSelectBranch, selectedOption, onSelectOption }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const cards = [
    {
      id: 'know_need',
      title: '🚀 I already know what I need',
      desc: 'I already have something in mind. Help me plan it and get it done.',
      icon: '/images/target_3d.svg',
      chatText: '🚀 I already know what I need',
      staggerClass: 'chat-stagger-1'
    },
    {
      id: 'figuring_out',
      title: '💡 Help me figure out what I need',
      desc: "I know I need to build my professional presence, but I'm not sure where to start. Help me figure it out.",
      icon: '/images/compass_3d.svg',
      chatText: '💡 Help me figure out what I need',
      staggerClass: 'chat-stagger-2'
    },
    {
      id: 'explore',
      title: 'Just explore ADDUS',
      desc: 'I want to understand what ADDUS can do for my business first.',
      icon: '/images/home_3d.svg',
      chatText: 'Just explore ADDUS',
      staggerClass: 'chat-stagger-3'
    }
  ];

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleCardClick = (card, positionOffset) => {
    if (positionOffset === 0) {
      onSelectOption(card.id, card.chatText, () => onSelectBranch(card.id));
    } else {
      setActiveIdx((prev) => (prev + positionOffset + cards.length) % cards.length);
    }
  };

  // Drag / Swipe handlers for front card
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const delta = clientX - startXRef.current;
    // Apply slight resistance
    setDragOffset(delta * 0.75);
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (dragOffset < -40) {
      // Swiped left -> next card
      setActiveIdx((prev) => (prev + 1) % cards.length);
    } else if (dragOffset > 40) {
      // Swiped right -> prev card
      setActiveIdx((prev) => (prev - 1 + cards.length) % cards.length);
    }
    setDragOffset(0);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingRef.current) {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        setDragOffset((clientX - startXRef.current) * 0.75);
      }
    };
    const onUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragOffset((prev) => {
          if (prev < -40) {
            setActiveIdx((idx) => (idx + 1) % cards.length);
          } else if (prev > 40) {
            setActiveIdx((idx) => (idx - 1 + cards.length) % cards.length);
          }
          return 0;
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [cards.length]);

  return (
    <div className="stacked-cards-container margin-top-24">
      <div className="stacked-cards-viewport">
        {cards.map((card, idx) => {
          // relative position: 0 = front, 1 = behind 1st, 2 = behind 2nd
          const position = (idx - activeIdx + cards.length) % cards.length;
          const isFront = position === 0;
          const isSecond = position === 1;
          const isThird = position === 2;

          let transformStyle = '';
          let zIndex = 1;
          let opacity = 0.6;
          let pointerEvents = 'none';

          if (isFront) {
            const dragRotation = dragOffset * 0.03;
            transformStyle = `translate3d(${dragOffset}px, 0px, 0px) rotate(${dragRotation}deg) scale(1)`;
            zIndex = 30;
            opacity = 1;
            pointerEvents = 'auto';
          } else if (isSecond) {
            // Slightly right and lower
            transformStyle = `translate3d(30px, 20px, -20px) rotate(3deg) scale(0.95)`;
            zIndex = 20;
            opacity = 0.85;
            pointerEvents = 'auto';
          } else if (isThird) {
            // Slightly left and lower
            transformStyle = `translate3d(-30px, 40px, -40px) rotate(-3deg) scale(0.9)`;
            zIndex = 10;
            opacity = 0.65;
            pointerEvents = 'auto';
          }

          const isSelected = selectedOption === card.id;

          return (
              <div
              key={card.id}
              className={`stacked-card-wrapper ${isFront ? 'stacked-card-front' : 'stacked-card-back'} ${isSelected ? 'branch-card-selected' : ''} editorial-card-bg card-depth-${position} ${!isFront ? 'stacked-back-tint' : ''}`}
              style={{
                transform: transformStyle,
                zIndex,
                opacity,
                pointerEvents,
                transition: isDragging && isFront ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease'
              }}
              onMouseDown={isFront ? handlePointerDown : undefined}
              onTouchStart={isFront ? handlePointerDown : undefined}
              onClick={() => handleCardClick(card, position)}
            >
              <div className="stacked-branch-card-inner editorial-layout">
                {isFront && (
                  <>
                    <div className="editorial-layout-content" style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', textAlign: 'center' }}>
                      
                      {/* Top Row: Small Label (Dots) & Arrow */}
                      <div className="stacked-card-header-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div className="stacked-card-dots" style={{ margin: 0 }}>
                          {cards.map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`stacked-dot ${dotIdx === activeIdx ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveIdx(dotIdx);
                              }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          className="stacked-card-arrow-btn"
                          onClick={handleNext}
                          title="Next option"
                          aria-label="Next option"
                          style={{ zIndex: 10 }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      {/* Heading & Caption */}
                      <div style={{ width: '100%', position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
                        <h3 className="branch-card-title" style={{ fontSize: '26px', marginBottom: '12px', fontWeight: '700', lineHeight: '1.2' }}>{card.title}</h3>
                        <p className="branch-card-desc" style={{ fontSize: '15px', lineHeight: '1.5', opacity: 0.9, maxWidth: '280px' }}>{card.desc}</p>
                      </div>

                      {/* Mascot (Centered in lower area) */}
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1, width: '100%', marginTop: '16px' }}>
                        {card.id === 'know_need' && (
                          <img src="/images/mascot_checklist.png" alt="Mascot" style={{ width: '150px', height: 'auto', pointerEvents: 'none' }} />
                        )}
                        {card.id === 'figuring_out' && (
                          <img src="/images/think_mascot.png" alt="Thinking Mascot" style={{ width: '150px', height: 'auto', pointerEvents: 'none' }} />
                        )}
                        {card.id === 'explore' && (
                          <img src="/images/explore_mascot.png" alt="Explore Mascot" style={{ width: '130px', height: 'auto', pointerEvents: 'none' }} />
                        )}
                      </div>

                      {/* Bottom Instruction */}
                      <div className="stacked-card-footer-hint" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <span className="stacked-action-cta">Click or swipe card</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SWIPE TO CONFIRM BUTTON (MINIMALIST, ICON-FREE)
   ─────────────────────────────────────────────────────────────────────────── */
function SwipeToConfirmButton({ onConfirm, text = "Confirm" }) {
  const trackRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const maxDragRef = useRef(0);

  const handleStart = (clientX) => {
    if (isConfirmed) return;
    setIsDragging(true);
    if (trackRef.current) {
      const trackWidth = trackRef.current.clientWidth;
      maxDragRef.current = Math.max(0, trackWidth - 64);
    }
  };

  const handleMove = (clientX) => {
    if (!isDragging || isConfirmed || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - trackRect.left - 32;
    const clampedX = Math.max(0, Math.min(relativeX, maxDragRef.current));
    setDragX(clampedX);

    if (maxDragRef.current > 0 && clampedX >= maxDragRef.current * 0.85) {
      setIsConfirmed(true);
      setIsDragging(false);
      setDragX(maxDragRef.current);
      if (onConfirm) onConfirm();
    }
  };

  const handleEnd = () => {
    if (isConfirmed) return;
    setIsDragging(false);
    if (dragX < maxDragRef.current * 0.85) {
      setDragX(0);
    }
  };

  const handleClick = () => {
    if (!isConfirmed && onConfirm && trackRef.current) {
      const trackWidth = trackRef.current.clientWidth;
      maxDragRef.current = Math.max(0, trackWidth - 64);
      if (maxDragRef.current > 0) {
        setIsConfirmed(true);
        setDragX(maxDragRef.current);
        if (onConfirm) onConfirm();
      }
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, dragX]);

  const progressPercent = maxDragRef.current > 0 ? (dragX / maxDragRef.current) * 100 : 0;

  return (
    <div
      ref={trackRef}
      className={`swipe-confirm-track ${isConfirmed ? 'swipe-confirmed' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }}
      onTouchStart={(e) => { e.preventDefault(); handleStart(e.touches[0].clientX); }}
      onClick={handleClick}
    >
      <div
        className="swipe-confirm-fill"
        style={{ width: dragX > 0 ? `${dragX + 54}px` : '0px' }}
      />
      <span className="swipe-confirm-text" style={{ opacity: Math.max(0, 1 - progressPercent / 60) }}>
        {isConfirmed ? 'Ready to Start' : text}
      </span>
      <div
        className="swipe-confirm-thumb"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {isConfirmed ? (
          <CheckCircle size={22} className="swipe-arrow-icon" />
        ) : (
          <ChevronRight size={22} className="swipe-arrow-icon" />
        )}
      </div>
    </div>
  );
}

function PosterVideoCard({ item, onPlayVideo }) {
  return (
    <div className="poster-video-card" onClick={() => onPlayVideo(item)}>
      <div className="poster-thumbnail-wrapper">
        {item.badge && <span className="poster-badge-pill">{item.badge}</span>}
        <img src={item.thumbnail} alt={item.title} className="poster-img" />
        <div className="poster-play-overlay">
          <div className="poster-play-circle">
            <Play size={20} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '2px' }} />
          </div>
        </div>
      </div>
      <div className="poster-card-meta">
        <span className="poster-title">{item.title}</span>
        <span className="poster-rating">{item.rating || '5.0'} ★</span>
      </div>
    </div>
  );
}

function VideoShowcaseSection({ onSelectVideoType }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeGalleryTitle, setActiveGalleryTitle] = useState('Cinematic Brand Film');
  const [activeVideoItem, setActiveVideoItem] = useState(null);

  const showcaseItems = [
    {
      id: 'brand_video',
      title: 'Brand Video Commercial',
      thumbnail: '/products/frame_18.png',
    },
    {
      id: 'cinematic_brand_film',
      title: 'Cinematic Brand Film',
      thumbnail: '/products/73690.jpg',
    },
    {
      id: 'social_media_reel',
      title: 'Social Media Reel Trio',
      thumbnail: '/products/73691.jpg',
    },
    {
      id: 'product_showcase',
      title: 'Studio Product Commercial',
      thumbnail: '/products/73689.jpg',
    },
    {
      id: 'brand_story',
      title: 'Corporate Brand Story',
      thumbnail: '/products/73690.jpg',
    }
  ];

  const galleryVideos = [
    {
      id: 'cozy_office',
      title: 'Cozy Office Decor',
      subtitle: '4K Commercial Shoot • Spatial & Studio Lighting',
      videoUrl: '/videos/cozy_office_decor.mp4',
      thumbnail: '/products/frame_18.png',
      badge: 'New Commercial',
      rating: '5.0'
    },
    {
      id: 'whatsapp_showcase',
      title: 'ADDUS Brand Film',
      subtitle: 'High-Impact Social Reel & Mobile Showcase',
      videoUrl: '/videos/whatsapp_showcase.mp4',
      thumbnail: '/products/73690.jpg',
      badge: 'Popular',
      rating: '4.9'
    },
    {
      id: 'product_commercial',
      title: 'Studio Product Promo',
      subtitle: '360° Studio Showcase & Lens Macro Shots',
      videoUrl: '/videos/cozy_office_decor.mp4',
      thumbnail: '/products/73689.jpg',
      badge: 'Top Pick',
      rating: '4.8'
    },
    {
      id: 'social_reel',
      title: 'Viral Social Reel',
      subtitle: 'Fast-Paced Vertical Video Trio',
      videoUrl: '/videos/whatsapp_showcase.mp4',
      thumbnail: '/products/73691.jpg',
      badge: 'Trending',
      rating: '4.9'
    }
  ];

  const handleCardClick = (item) => {
    setActiveGalleryTitle(item.title);
    setGalleryOpen(true);
  };

  return (
    <div className="video-showcase-container fade-in margin-top-20">
      <div className="netflix-media-grid">
        {showcaseItems.map(item => (
          <div
            key={item.id}
            className="netflix-media-card"
            onClick={() => handleCardClick(item)}
          >
            <img src={item.thumbnail} alt={item.title} className="netflix-card-img" />
            <div className="netflix-card-clean-overlay">
              <span className="card-clean-title">{item.title}</span>
              <Play size={15} className="card-clean-play-icon" />
            </div>
          </div>
        ))}
      </div>

      {/* Movie Poster Style Gallery Modal */}
      {galleryOpen && (
        <div className="cinematic-gallery-overlay" onClick={() => setGalleryOpen(false)}>
          <div className="cinematic-gallery-modal" onClick={e => e.stopPropagation()}>
            <div className="cinematic-gallery-header">
              <h3 className="cinematic-gallery-title">
                <Play size={20} style={{ color: '#00A3FF' }} /> 🎬 {activeGalleryTitle} Gallery
              </h3>
              <button
                type="button"
                className="vsp-close-btn"
                onClick={() => setGalleryOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px 0' }}>
              Preview our featured 4K brand video samples below. Click any poster to watch full video.
            </p>

            <div className="poster-video-grid">
              {galleryVideos.map(item => (
                <PosterVideoCard
                  key={item.id}
                  item={item}
                  onPlayVideo={(videoItem) => setActiveVideoItem(videoItem)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                className="duolingo-submit-btn"
                onClick={() => {
                  setGalleryOpen(false);
                  if (onSelectVideoType) onSelectVideoType(activeGalleryTitle);
                }}
              >
                Choose {activeGalleryTitle} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Lightbox Player Overlay */}
      {activeVideoItem && (
        <div className="video-lightbox-overlay" onClick={() => setActiveVideoItem(null)}>
          <div className="video-lightbox-modal" onClick={e => e.stopPropagation()}>
            <div className="lightbox-video-frame">
              <video
                key={activeVideoItem.id}
                src={activeVideoItem.videoUrl}
                controls
                autoPlay
                playsInline
                className="lightbox-video-el"
              />
            </div>
            <div className="lightbox-details">
              <div className="lightbox-header-row">
                <div>
                  <h4 className="lightbox-title">{activeVideoItem.title}</h4>
                  <p className="lightbox-subtitle">{activeVideoItem.subtitle}</p>
                </div>
                <span className="poster-rating" style={{ fontSize: '14px' }}>{activeVideoItem.rating} ★</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="duolingo-secondary-btn"
                  onClick={() => setActiveVideoItem(null)}
                >
                  Close Player
                </button>
                <button
                  type="button"
                  className="duolingo-submit-btn"
                  onClick={() => {
                    setActiveVideoItem(null);
                    setGalleryOpen(false);
                    if (onSelectVideoType) onSelectVideoType(activeVideoItem.title);
                  }}
                >
                  Select Package →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


const DELIVERABLE_TYPES = [
  'Product Video', 'Brand Film', 'Photography', 'Website', 'Brand Identity', 'Social Media Kit', 'Packaging Design'
];

const DELIVERABLE_QUESTIONS = {
  'Product Video': [
    { key: 'goal', question: 'What is the primary goal for this video?', options: ['Sales & Conversions', 'Brand Awareness', 'Product Launch', 'Investor Presentation'] },
    { key: 'platform', question: 'Where will this video be displayed?', options: ['Instagram / Reels', 'Website Header', 'YouTube Ads', 'Internal Presentations'] },
    { key: 'branding', question: 'Do you have brand guidelines ready?', options: ['Yes — fully ready', 'Partially ready', 'Need help creating guidelines'] }
  ],
  'Brand Film': [
    { key: 'tone', question: 'What tone should the film convey?', options: ['Inspirational & Emotional', 'Bold & Energetic', 'Calm & Luxury', 'Corporate & Authoritative'] },
    { key: 'audience', question: 'Who is the primary audience?', options: ['General Consumers', 'B2B Partners', 'Investors', 'Retail Buyers'] }
  ],
  'Photography': [
    { key: 'subject', question: 'What are we photographing?', options: ['Products', 'Team & People', 'Spaces & Architecture', 'Food & Beverage', 'Lifestyle'] },
    { key: 'style', question: 'What visual style do you prefer?', options: ['Clean Studio White', 'Environmental Lifestyle', 'Editorial & Creative', 'Minimalist Glass'] }
  ],
  'Website': [
    { key: 'type', question: 'What type of website do you need?', options: ['Landing Page', 'Corporate Site', 'E-Commerce Store', 'Portfolio Site'] },
    { key: 'goal', question: 'What is the primary goal of the website?', options: ['Capture Qualified Leads', 'Sell Products Directly', 'Build Brand Authority', 'Schedule Appointments'] }
  ],
  'default': [
    { key: 'goal', question: 'What is your main goal for this project?', options: ['Sales & Conversions', 'Brand Awareness', 'Product Launch', 'Build Trust'] },
    { key: 'audience', question: 'Who is your target audience?', options: ['General Consumers', 'Businesses (B2B)', 'Niche Community', 'Mixed Audience'] },
    { key: 'timeline', question: 'What is your priority timeline?', options: ['Standard (7–14 days)', 'Fast (3–7 days)', 'Urgent (1–3 days)'] }
  ]
};

function getDefaultFailureMessage(sourceStatus, failureReason) {
  if (sourceStatus === 'RETRIEVAL_FAILED') {
    if (failureReason === 'TIMEOUT') return 'The website took too long to respond. It may be slow or temporarily unavailable.';
    if (failureReason === 'DNS_FAILED') return 'We couldn\'t resolve the website address. The domain may be incorrect or the site may not exist.';
    if (failureReason === 'CONNECTION_FAILED') return 'We couldn\'t establish a connection to the website. It may be offline or blocking access.';
    if (failureReason === 'CONNECTION_RESET') return 'The connection was interrupted. This may be temporary — please try again.';
    if (failureReason === 'RATE_LIMITED') return 'The website is temporarily limiting automated requests. Please try again later.';
    if (failureReason === 'SERVER_ERROR') return 'The website\'s server returned an error. The site may be experiencing issues.';
    if (failureReason === 'TLS_HANDSHAKE_FAILED') return 'The website has an invalid or incompatible security certificate.';
    return 'We couldn\'t retrieve the website due to a network or server issue. Please check the URL and try again.';
  }
  if (sourceStatus === 'ACCESS_BLOCKED') {
    return 'The website is blocking automated access. You can still continue by entering your business details manually.';
  }
  if (sourceStatus === 'INSUFFICIENT_EVIDENCE') {
    return 'We accessed the website, but couldn\'t find enough reliable information to understand the business. Please provide details manually or upload a document.';
  }
  if (sourceStatus === 'REJECTED_SOURCE' || failureReason === 'INVALID_URL') {
    return 'This website address doesn\'t appear to be valid. Please check the URL and try again, or enter your business details manually.';
  }
  return 'We couldn\'t access enough information from this website. Please try again or describe your business manually.';
}

export function ConversationalOnboarding({ onProjectCreated }) {
  const { state, updateState, bindToUser } = useOnboardingStore();
  const { createDraftProject } = useProjectStore();
  const { changeLanguage, t } = useLanguage();

  const [stepIndex, setStepIndex] = useState(1); // Step 1 = Recovered Login
  const [step4Stage, setStep4Stage] = useState('mascot'); // 'mascot' -> 'card'
  const [history, setHistory] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Login State
  const [authFlowType, setAuthFlowType] = useState('signup'); // 'signup' | 'login'
  const [authMethod, setAuthMethod] = useState('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [formError, setFormError] = useState('');
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // User details & branch flow
  const [nameInput, setNameInput] = useState(state.name || '');
  const [branchChoice, setBranchChoice] = useState(null);
  const [flowAQIdx, setFlowAQIdx] = useState(0);
  const [flowBQIdx, setFlowBQIdx] = useState(0);

  const [guidedAnswers, setGuidedAnswers] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [localSelectedServices, setLocalSelectedServices] = useState([]);
  const [showMoreServices, setShowMoreServices] = useState(false);
  const [otherServiceInput, setOtherServiceInput] = useState('');
  const [otherGoalInput, setOtherGoalInput] = useState('');
  const [otherCategoryInput, setOtherCategoryInput] = useState('');
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [businessUploadTab, setBusinessUploadTab] = useState('text');
  const [legalViewType, setLegalViewType] = useState(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [finalScope, setFinalScope] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [scopeChatInput, setScopeChatInput] = useState('');
  const [customRequests, setCustomRequests] = useState(state.customScopeNotes || []);
  const [isExpertReviewRequested, setIsExpertReviewRequested] = useState(false);

  useEffect(() => {
    if (state.customScopeNotes && Array.isArray(state.customScopeNotes)) {
      setCustomRequests(state.customScopeNotes);
    }
  }, [state.customScopeNotes]);

  const handleAddCustomRequest = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = scopeChatInput.trim();
    if (!text) return;

    const updatedNotes = Array.from(new Set([...customRequests, text]));
    setCustomRequests(updatedNotes);
    updateState({ customScopeNotes: updatedNotes });
    setFinalScope(prev => Array.from(new Set([...prev, text])));
    addHistoryItem(text, "Request added to your project scope. Our expert will review it.");
    
    try {
      const bizName = state.businessProfile?.businessName || 'A customer';
      UniversalNotificationEngine.notify({
        userId: 'admin',
        role: 'Admin',
        type: 'scope_change_request',
        title: 'Customer Scope Change Request',
        message: `${bizName} requested scope change: "${text}"`,
        priority: 'high',
        source: 'customer_onboarding'
      });
    } catch(err) {
      console.warn('Scope change notification failed', err);
    }

    setScopeChatInput('');
  };

  const handleRemoveCustomRequest = (noteToRemove) => {
    const filtered = customRequests.filter(s => s !== noteToRemove);
    setCustomRequests(filtered);
    updateState({ customScopeNotes: filtered });
    setFinalScope(prev => prev.filter(s => s !== noteToRemove));
  };

  const [shootDate, setShootDate] = useState(state.preferredShootDate || '');
  const [timeSlot, setTimeSlot] = useState('11 AM – 1 PM');
  const [scheduleRequests, setScheduleRequests] = useState(state.scheduleRequests || {});
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [showProjectConfirmedModal, setShowProjectConfirmedModal] = useState(false);
  const [showStylePreview, setShowStylePreview] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [showNoDeliverablesModal, setShowNoDeliverablesModal] = useState(false);
  const [selectedDeliverablesInModal, setSelectedDeliverablesInModal] = useState([]);

  const [selectedOption, setSelectedOption] = useState(null);
  const [chatInputText, setChatInputText] = useState('');
  const [showTargetAudienceRationale, setShowTargetAudienceRationale] = useState(false);
  const [expandedRecommendations, setExpandedRecommendations] = useState({});
  const selectTimeoutRef = useRef(null);

  const completeOnboarding = async (profileData = {}) => {
    const session = sessionManager.getSession();
    if (!session?.userId) return;

    const profile = profileService.getProfileById(session.userId);
    if (!profile) return;

    const updated = profileService.saveProfile({
      ...profile,
      ...profileData,
      onboardingStatus: 'completed',
      lastVisitedScreen: 'dashboard'
    });

    try {
      await apiService.post('/customer/complete-onboarding', {
        userId: session.userId,
        profile: updated
      });
    } catch (e) {
      console.warn('[Onboarding] Complete onboarding sync failed:', e);
    }

    syncService.syncProfile(session.userId, updated);
  };

  const currentStepKey = `${stepIndex}_${branchChoice}_${flowAQIdx}_${flowBQIdx}`;

  const getServiceScheduleType = (serviceName = '') => {
    const lower = serviceName.toLowerCase();
    if (
      lower.includes('photo') ||
      lower.includes('video') ||
      lower.includes('shoot') ||
      lower.includes('film') ||
      lower.includes('videography') ||
      lower.includes('photography')
    ) {
      return 'SHOOT_DATE_REQUEST';
    }
    return 'DELIVERY_DATE_REQUEST';
  };

  const handleDateChangeForService = (serviceName, dateStr, scheduleType) => {
    setScheduleRequests(prev => {
      const updated = {
        ...prev,
        [serviceName]: {
          serviceName,
          scheduleType,
          preferredDate: dateStr
        }
      };
      updateState({ scheduleRequests: updated });
      return updated;
    });

    if (scheduleType === 'SHOOT_DATE_REQUEST') {
      setShootDate(dateStr);
      updateState({ preferredShootDate: dateStr });
    } else {
      setDeliveryDate(dateStr);
      updateState({ preferredDeliveryDate: dateStr });
    }
  };

  const handleGlobalChatSubmit = async (e) => {
    if (e) e.preventDefault();
    const text = chatInputText.trim();
    if (!text) return;

    setChatInputText('');

    if (stepIndex === 1) {
      if (!otpSent) {
        const clean = text.replace(/\D/g, '');
        if (clean.length === 10) {
          setAuthMethod('phone');
          setPhoneInput(clean);
          setLoginError('');
          setOtpSent(true);
        } else if (text.includes('@')) {
          setAuthMethod('email');
          setEmailInput(text);
          setLoginError('');
          setOtpSent(true);
        } else {
          setPhoneInput(text);
          handleSendOTP();
        }
      } else {
        const cleanOtp = text.replace(/\D/g, '');
        setOtpInput(cleanOtp || text);
        if ((cleanOtp || text).length >= 4) {
          const authIdentifier = authMethod === 'phone' ? `+91 ${phoneInput}` : emailInput;
          setShowCelebrationModal(true);
          setTimeout(() => {
            try {
              setShowCelebrationModal(false);
              changeLanguage(localStorage.getItem('APP_LANGUAGE') || 'en');
              addHistoryItem(
                "Welcome to ADDUS! Let's get started with your authentication.",
                "Verified Account",
                `Verified: ${authIdentifier}`
              );
              setStepIndex(3);
            } catch (err) {
              console.warn('Post-OTP transition error:', err);
              setShowCelebrationModal(false);
              setStepIndex(3);
            }
          }, 2000);
        }
      }
      return;
    }

    if (stepIndex === 3) {
      addHistoryItem(t('bizWelcome'), t('bizSubtitle'), text);
try {
      const profile = await businessAnalysisService.analyzeUrlOrText(text);
      console.log('[ADDI_TRACE:INPUT]', {
        rawInput: text,
        detectedType: 'URL' in text ? 'URL' : 'TEXT',
        normalizedUrl: text.trim(),
        analysisMethod: 'analyzeUrlOrText'
      });
      updateState({ businessProfile: profile });
      const session = sessionManager.getSession();
      if (session?.userId) {
        const updated = businessProfileService.updateBusinessProfile(session.userId, profile);
        syncService.syncProfile(session.userId, updated);
      }
    } catch (err) {
      console.warn('[ADDI ANALYSIS ERROR]', err);
      updateState({ businessProfile: { businessName: text, summary: text } });
    }
      setStepIndex(4);
      return;
    }

    if (stepIndex === 4) {
      handleConfirmProfile();
      return;
    }

    if (stepIndex === 5) {
      if (text.toLowerCase().includes('help') || text.toLowerCase().includes('figure')) {
        handleSelectBranch('figuring_out');
      } else {
        handleSelectBranch('know_what_i_need');
      }
      return;
    }

    addHistoryItem("How else can ADDI help with your creative strategy?", null, text);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stepIndex, history.length, flowAQIdx, flowBQIdx, showCelebrationModal]);

  const addHistoryItem = (question, subtitle, userAnswerText, questionKey = null, subtitleKey = null, stepIndexToRevert = null) => {
    setHistory(prev => [
      ...prev,
      {
        id: `turn_${Date.now()}_${prev.length}`,
        question,
        subtitle,
        userAnswerText,
        questionKey,
        subtitleKey,
        stepIndex: stepIndexToRevert || stepIndex
      }
    ]);
  };

  const handleLanguageSelect = (lang) => {
    changeLanguage(lang); // saves to localStorage + updates global context
    addHistoryItem(
      'Language Selected',
      null,
      lang === 'ml' ? 'മലയാളം (Malayalam) ✓' : 'English ✓'
    );
    setStepIndex(2); // advance to Name Input step
  };

  const handleSelectOption = (optionValue, userDisplayText, onProceed) => {
    if (selectTimeoutRef.current) {
      clearTimeout(selectTimeoutRef.current);
      selectTimeoutRef.current = null;
    }
    setSelectedOption(optionValue);
    selectTimeoutRef.current = setTimeout(() => {
      setSelectedOption(null);
      selectTimeoutRef.current = null;
      onProceed();
    }, 280);
  };

  // ── RECOVERED LOGIN FLOW ────────────────────────────────────────────────
  const handleSendOTP = (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (authMethod === 'phone') {
      const pVal = validatePhone(phoneInput);
      if (!pVal.isValid) {
        setLoginError(pVal.message);
        return;
      }
    } else {
      const eVal = validateEmail(emailInput);
      if (!eVal.isValid) {
        setLoginError(eVal.message);
        return;
      }
    }

    setOtpSent(true);
    setOtpAttempts(0);
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    const otpVal = validateOTP(otpInput, otpAttempts);
    if (!otpVal.isValid) {
      if (otpVal.blocked) {
        setLoginError(otpVal.message);
        setOtpSent(false);
        setOtpInput('');
        setOtpAttempts(0);
        return;
      }
      setOtpAttempts(prev => prev + 1);
      setLoginError(otpVal.message);
      return;
    }

    let verifyRes = null;
    if (authMethod === 'phone') {
      verifyRes = await otpService.verifyOTP(phoneInput, otpInput, otpAttempts);
    } else {
      verifyRes = await emailAuthService.verifyEmailOTP(emailInput, otpInput);
    }

    if (!verifyRes || !verifyRes.success) {
      setOtpAttempts(prev => prev + 1);
      setLoginError(verifyRes?.message || 'Invalid verification code. Please check the 4-digit code and try again.');
      return;
    }

    const authIdentifier = authMethod === 'phone' ? `+91 ${phoneInput}` : emailInput;

    const profiles = profileService.getAllProfiles();
    const cleanPhone = phoneInput.replace(/\D/g, '');
    const cleanEmail = emailInput.trim().toLowerCase();
    
    const existing = profiles.find(p => 
      (authMethod === 'phone' && p.phoneNumber?.replace(/\D/g, '') === cleanPhone) ||
      (authMethod === 'email' && p.email?.toLowerCase() === cleanEmail)
    );

    let finalUserId = `user_${Date.now()}`;
    let isExistingUser = false;
    
    if (existing) {
      finalUserId = existing.userId || existing.customerId || finalUserId;
      isExistingUser = true;
    }

    if (authFlowType === 'login' && !isExistingUser) {
      setLoginError("No existing account found with this number/email. If you are new to ADDUS, please select 'Get Started as a New Business'.");
      return;
    }

    updateState({ verified: true });

    let loginRes = null;
    try {
      if (authMethod === 'phone') {
        loginRes = await authService.loginWithPhone(phoneInput);
      } else {
        loginRes = await authService.loginWithEmail(emailInput);
      }

      if (loginRes?.error) {
        updateState({ verified: false });
        setLoginError(loginRes.error);
        return;
      }

      if (loginRes?.profile) {
        const profile = loginRes.profile;
        if (profile.onboardingStatus === 'completed' || profile.lastVisitedScreen === 'dashboard') {
          updateState({ currentStep: 'dashboard', verified: true });
        }
      }
    } catch (err) {
      updateState({ verified: false });
      setLoginError(err.message || 'Verification failed. Please try again.');
      return;
    }

    localStorage.setItem('HAS_EXISTING_ADDUS_ACCOUNT', 'true');

    setShowCelebrationModal(true);

    setTimeout(() => {
      try {
        setShowCelebrationModal(false);
        changeLanguage(localStorage.getItem('APP_LANGUAGE') || 'en');
        
        if (isExistingUser) {
          try {
            if (typeof bindToUser === 'function') {
              const canonicalUserId = loginRes?.profile?.userId || finalUserId;
              bindToUser(canonicalUserId, existing);
            }
          } catch (bindErr) {
            console.warn('bindToUser warning:', bindErr);
          }
          updateState({ currentStep: 'dashboard', verified: true });
        } else {
          setHistory(prev => [...prev, {
            id: `turn_auth_${Date.now()}`,
            question: "Welcome to ADDUS! Let's get started with your authentication.",
            userAnswerText: `Verified: ${authIdentifier}`,
            stepIndex: 1
          }]);
          setStepIndex(3);
        }
      } catch (err) {
        console.warn('Post-OTP transition error:', err);
        setShowCelebrationModal(false);
        setStepIndex(3);
      }
    }, 2200);
  };

  const handleSaveName = (e) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    updateState({ name: trimmed });

    addHistoryItem("What's your name?", "ADDI will use your name to personalize your experience.", trimmed, 'nameWelcome', 'nameSubtitle', 2);
    setStepIndex(3);
  };

  const handleBusinessAnalysisDone = (profile) => {
    const custName = profile?.customerName || state.name || '';
    if (custName && custName !== 'Customer' && !/^\d+$/.test(custName.replace(/\D/g, ''))) {
      updateState({ name: custName, businessProfile: { ...profile, customerName: custName } });
    } else {
      updateState({ businessProfile: profile });
    }
    const session = sessionManager.getSession();
    if (session?.userId) {
      const updated = businessProfileService.updateBusinessProfile(session.userId, profile);
      syncService.syncProfile(session.userId, updated);
    }

    const bizName = profile?.businessName || 'Business details uploaded';
    addHistoryItem("Tell ADDI about your business.", "Provide your website URL or paste your business summary.", bizName, 'bizWelcome', 'bizSubtitle', 3);
    setStepIndex(4);
  };

  const handleConfirmProfile = async () => {
    const activeProfile = (sessionManager.isAuthenticated() && sessionManager.getCurrentUser()?.userId)
      ? profileService.getProfileById(sessionManager.getCurrentUser().userId)
      : null;
    const profileToCompare = {
      ...state.businessProfile,
      email: activeProfile?.email || state.email || '',
      phoneNumber: activeProfile?.phoneNumber || state.phoneNumber || ''
    };
    const businessName = (profileToCompare.businessName || '').trim();
    
    // Block proceeding if no meaningful business analysis exists
    const hasAnalysisResult = profileToCompare.businessName || 
                              profileToCompare.industry || 
                              profileToCompare.services?.length > 0 ||
                              profileToCompare.businessDescription;
    
    if (!businessName || businessName.length < 2 || !hasAnalysisResult) {
      addHistoryItem("Here's what I understood about your business.", "Review your business brain profile below.", "Profile Confirmed ✓", 'bizReviewWelcome', 'bizReviewSubtitle', 4);
      setStepIndex(5);
      return;
    }

    const website = profileToCompare.website || profileToCompare.brandAssets?.website || '';
    const activeUserId = activeProfile?.userId || state.userId;
    let duplicateFound = null;
    
    try {
      const backendResult = await apiService.post('/auth/check-duplicate', {
        phone: profileToCompare.phoneNumber || profileToCompare.phone || state.phone || '',
        email: profileToCompare.email || '',
        website: website || '',
        businessName: profileToCompare.businessName || '',
        userId: activeUserId
      });
      
      const backendMatches = backendResult?.matches || [];
      if (backendMatches.length > 0) {
        const bestMatch = backendMatches[0];
        duplicateFound = {
          confidence: bestMatch.confidence || 'HIGH',
          matchType: bestMatch.matchType,
          message: bestMatch.message,
          existingBusiness: {
            userId: bestMatch.existingUserId || '',
            businessName: bestMatch.existingBusinessName || '',
            email: bestMatch.existingEmail || '',
            phoneNumber: bestMatch.existingPhoneNumber || ''
          }
        };
      }
    } catch (err) {
      console.warn('[Onboarding] Backend duplicate check fallback to local check:', err);
    }

    // 2. Local check fallback against all existing accounts
    if (!duplicateFound) {
      const allProfiles = profileService.getAllProfiles();
      const cleanPhone = (profileToCompare.phoneNumber || profileToCompare.phone || state.phone || '').replace(/\D/g, '');
      const cleanWebsite = (website || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();

      for (const p of allProfiles) {
        if (activeUserId && (p.userId === activeUserId || p.customerId === activeUserId)) continue;
        const pPhone = (p.phoneNumber || p.phone || '').replace(/\D/g, '');
        const pWebsite = (p.businessBrain?.website || p.website || p.brandAssets?.website || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();

        if (cleanPhone && pPhone && cleanPhone.length >= 10 && (cleanPhone === pPhone || pPhone.endsWith(cleanPhone) || cleanPhone.endsWith(pPhone))) {
          duplicateFound = {
            confidence: 'HIGH',
            matchType: 'EXACT_PHONE',
            message: 'This mobile number is already linked to an existing business account.',
            existingBusiness: {
              userId: p.userId || p.customerId,
              businessName: p.businessBrain?.businessName || p.name || 'Existing Business',
              email: p.email || '',
              phoneNumber: p.phoneNumber || p.phone || ''
            }
          };
          break;
        }

        if (cleanWebsite && pWebsite && cleanWebsite === pWebsite && !['zoho.in', 'google.com', 'wix.com', 'shopify.com'].includes(cleanWebsite)) {
          duplicateFound = {
            confidence: 'HIGH',
            matchType: 'EXACT_URL',
            message: `An account already exists with website domain "${cleanWebsite}".`,
            existingBusiness: {
              userId: p.userId || p.customerId,
              businessName: p.businessBrain?.businessName || p.name || 'Existing Business',
              email: p.email || '',
              phoneNumber: p.phoneNumber || p.phone || ''
            }
          };
          break;
        }
      }
    }

    if (duplicateFound && !duplicateConfirmed) {
      setDuplicateMatch(duplicateFound);
      setShowDuplicateModal(true);
      return;
    }

    addHistoryItem("Here's what I understood about your business.", "Review your business brain profile below.", "Profile Confirmed ✓", 'bizReviewWelcome', 'bizReviewSubtitle', 4);
    setStepIndex(5);
  };

  const handleSelectBranch = (choice) => {
    setBranchChoice(choice);
    if (choice === 'explore') {
      updateState({ currentStep: 'dashboard', verified: true, onboardingStatus: 'completed', lastVisitedScreen: 'dashboard' });
      completeOnboarding();
      return;
    }
    const displayText = choice === 'figuring_out' ? "💡 Help me figure out what I need" : "🚀 I already know what I need";
    addHistoryItem("What do you need help with?", null, displayText, 'branchWelcome', null, 5);
    setStepIndex(6);
  };

  function evaluateDynamicBusinessContext(state) {
  const profile = state?.businessProfile || {};
  const bizName = profile.businessName || null;
  const industry = profile.industry || null;
  const website = profile.website || profile.brandAssets?.website || '';
  const hasWebsite = Boolean(website && website.trim());
  const uploadedDocs = profile.uploadedDocuments || [];
  const selectedServices = state?.selectedServices || [];

  const displayName = bizName || 'your business';
  const displayIndustry = industry || 'your industry';

  // 1. Dynamic Evidence-Based Asset Assessment
  const existingAssets = [];

  const hasDiscoveredLogo = (profile.assets || []).some(a => 
    a.type && a.type.toLowerCase().includes('logo') && a.status !== 'missing'
  ) || (profile.discoveredAssets || []).some(a => 
    a.type && a.type.toLowerCase().includes('logo') && a.status !== 'missing'
  );

  if (profile.brandAssets?.logo || hasDiscoveredLogo || (hasWebsite && profile.aiConfidenceScore != null && profile.aiConfidenceScore > 80)) {
    existingAssets.push({
      type: "Logo Design",
      status: "FOUND_ON_WEBSITE",
      evidence: `Active brand mark detected on domain ${website || 'digital profile'}.`
    });
  } else if (uploadedDocs.some(d => (typeof d === 'string' ? d : d.name)?.toLowerCase().includes('logo'))) {
    existingAssets.push({
      type: "Logo Design",
      status: "CUSTOMER_PROVIDED",
      evidence: "Logo file uploaded by customer."
    });
  } else {
    existingAssets.push({
      type: "Logo Design",
      status: "MISSING",
      evidence: "No logo asset provided yet."
    });
  }

  if (uploadedDocs.some(d => (typeof d === 'string' ? d : d.name)?.toLowerCase().includes('guideline') || (typeof d === 'string' ? d : d.name)?.toLowerCase().includes('brand'))) {
    existingAssets.push({
      type: "Brand Guidelines",
      status: "CUSTOMER_PROVIDED",
      evidence: "Brand style guide uploaded by customer."
    });
  } else {
    existingAssets.push({
      type: "Brand Guidelines",
      status: "MISSING",
      evidence: "No brand guideline document uploaded."
    });
  }

  if (hasWebsite) {
    existingAssets.push({
      type: "Product Photography",
      status: "NEEDS_REVIEW",
      evidence: "Website contains product images, but ADDI requires confirmation if current commercial resolution imagery exists."
    });
  } else {
    existingAssets.push({
      type: "Product Photography",
      status: "MISSING",
      evidence: "No commercial photography assets uploaded."
    });
  }

  // 2. Target Audience Research & Inference
  const targetAudience = {
    description: profile.targetAudience || `${displayIndustry} decision makers & consumers seeking quality solutions.`,
    reasoning: `Derived from ${hasWebsite ? 'web domain analysis' : 'customer provided context'}${industry ? ` for ${industry}` : ''} and strategic growth targets.`,
    evidence: hasWebsite ? `Extracted from web domain analysis at ${website}` : (industry ? `Based on customer provided industry profile for ${industry}` : 'Based on limited customer context'),
    confidence: hasWebsite ? "high" : "medium",
    requiresExpertReview: true
  };

  // 3. Evidence-Backed Recommendations & Website Re-Evaluation
  const recommendations = [];

  const industryLower = (industry || '').toLowerCase();
  const isNews = industryLower.includes('news') || industryLower.includes('media') || industryLower.includes('journalism');
  const isEcommerce = industryLower.includes('e-commerce') || industryLower.includes('ecommerce') || industryLower.includes('retail') || industryLower.includes('shop');
  const isHospitality = industryLower.includes('hospitality') || industryLower.includes('hotel') || industryLower.includes('resort') || industryLower.includes('restaurant');
  const isSaaS = industryLower.includes('saas') || industryLower.includes('software') || industryLower.includes('tech');
  const isHealthcare = industryLower.includes('healthcare') || industryLower.includes('medical') || industryLower.includes('clinic') || industryLower.includes('hospital');
  const isRealEstate = industryLower.includes('real estate') || industryLower.includes('property');
    const isFandB = industryLower.includes('food') || industryLower.includes('beverage') || industryLower.includes('restaurant') || industryLower.includes('cafe');
  const isFinance = industryLower.includes('finance') || industryLower.includes('banking') || industryLower.includes('insurance');
  const isEducation = industryLower.includes('education') || industryLower.includes('school') || industryLower.includes('college') || industryLower.includes('course');
  const isEntertainment = industryLower.includes('entertainment') || industryLower.includes('music') || industryLower.includes('film') || industryLower.includes('streaming');
  const isAgency = industryLower.includes('agency') || industryLower.includes('marketing') || industryLower.includes('advertising');
  const isManufacturing = industryLower.includes('manufacturing') || industryLower.includes('industrial') || industryLower.includes('factory');
  const isConsulting = industryLower.includes('consulting') || industryLower.includes('consultant') || industryLower.includes('advisory');

  if (hasWebsite) {
    const hasLogo = existingAssets.some(a => a.type === 'Logo Design' && (a.status === 'FOUND_ON_WEBSITE' || a.status === 'confirmed' || a.status === 'customer_confirmed'));
    const hasBrandGuidelines = existingAssets.some(a => a.type === 'Brand Guidelines' && (a.status === 'FOUND_ON_WEBSITE' || a.status === 'confirmed' || a.status === 'customer_confirmed'));
    const hasProductImages = existingAssets.some(a => a.type === 'Product Photography' && (a.status === 'FOUND_ON_WEBSITE' || a.status === 'confirmed' || a.status === 'customer_confirmed'));

    if (isNews) {
      recommendations.push({
        serviceName: "Video Production & Presentation Showcase",
        status: "recommended",
        priority: "high",
        reason: `News organizations need strong digital video commercials and presentation films to effectively deliver stories and engage audiences.`,
        businessNeed: "Enhance broadcast quality and audience retention.",
        confidence: 0.9,
        evidence: [{ rationale: `Video-first news presentation increases digital engagement by 40%.` }]
      });
      recommendations.push({
        serviceName: "Branding & Visual Identity",
        status: hasLogo ? "already_have" : "recommended",
        priority: hasLogo ? "low" : "high",
        reason: hasLogo ? "Brand mark detected on website." : "News organizations need a strong visual identity to build trust and recognition.",
        businessNeed: "Establish visual credibility and brand recall.",
        confidence: 0.88,
        evidence: [{ rationale: hasLogo ? "Logo detected on website." : "Editorial branding increases reader trust by 35%." }]
      });
    } else if (isEcommerce) {
      recommendations.push({
        serviceName: "Product Photo Shoot & Catalog Stills",
        status: "recommended",
        priority: "high",
        reason: "High-resolution studio catalog shots and product stills are critical for e-commerce conversion and buyer trust.",
        businessNeed: "Improve product perception and purchase confidence.",
        confidence: 0.92,
        evidence: [{ rationale: "Products with professional images see 2-3x higher conversion." }]
      });
      recommendations.push({
        serviceName: "Commercial Video Ad & Social Reels",
        status: "recommended",
        priority: "high",
        reason: "Cinematic commercial showcases and product reels drive customer acquisition on Meta & Google.",
        businessNeed: "Scale paid traffic ROI and brand virality.",
        confidence: 0.9,
        evidence: [{ rationale: "Video ads convert 2x higher for retail brands." }]
      });
    } else if (isHospitality) {
      recommendations.push({
        serviceName: "Property & Experience Photo Shoot",
        status: "recommended",
        priority: "high",
        reason: "Hospitality brands need immersive property, room, and dining visuals to drive direct guest bookings.",
        businessNeed: "Increase direct bookings and property value perception.",
        confidence: 0.9,
        evidence: [{ rationale: "Properties with professional photography see 30% more bookings." }]
      });
      recommendations.push({
        serviceName: "Cinematic Brand Film & Video Shoot",
        status: "recommended",
        priority: "medium",
        reason: "A cinematic brand film showcasing resort amenities and guest experiences builds emotional connection.",
        businessNeed: "Differentiate from competitors and justify premium pricing.",
        confidence: 0.85,
        evidence: [{ rationale: "Video content increases booking intent by 40%." }]
      });
    } else if (isSaaS) {
      recommendations.push({
        serviceName: "Commercial Video Ad & Product Showcase",
        status: "recommended",
        priority: "high",
        reason: "SaaS buyers need clear, high-impact video commercials and motion showcases explaining product value to sign up.",
        businessNeed: "Reduce signup friction and accelerate user acquisition.",
        confidence: 0.9,
        evidence: [{ rationale: "SaaS landing pages with commercial explainer videos convert 2x better." }]
      });
      if (!hasBrandGuidelines) {
        recommendations.push({
          serviceName: "Branding & Logo Design",
          status: "recommended",
          priority: "medium",
          reason: "A polished brand identity system with logos, guidelines, and color palettes ensures consistency across marketing.",
          businessNeed: "Establish enterprise visual authority.",
          confidence: 0.85,
          evidence: [{ rationale: "Consistent branding increases market valuation and customer trust." }]
        });
      }
      recommendations.push({
        serviceName: "Social Media Content & Management",
        status: "recommended",
        priority: "medium",
        reason: "Consistent social media reels and product carousels build continuous inbound pipeline and brand authority.",
        businessNeed: "Build organic community and SaaS lead generation.",
        confidence: 0.85,
        evidence: [{ rationale: "Weekly educational video content increases organic demo requests by 45%." }]
      });
    } else if (isHealthcare) {
      recommendations.push({
        serviceName: "Facility & Team Photo Shoot",
        status: "recommended",
        priority: "high",
        reason: "Patients choose healthcare providers based on facility cleanliness and doctor team professionalism.",
        businessNeed: "Build patient trust and clinic authority.",
        confidence: 0.88,
        evidence: [{ rationale: "Healthcare facilities with professional photography see 25% more appointments." }]
      });
      recommendations.push({
        serviceName: "Commercial Video Shoot",
        status: "recommended",
        priority: "medium",
        reason: "Doctor interview reels and patient testimonial films establish clinic credibility.",
        businessNeed: "Increase treatment inquiry conversion.",
        confidence: 0.85,
        evidence: [{ rationale: "Video testimonials boost healthcare consultation bookings by 30%." }]
      });
    } else if (isRealEstate) {
      recommendations.push({
        serviceName: "Property & Architectural Photo Shoot",
        status: "recommended",
        priority: "high",
        reason: "Real estate developments with professional architecture photos and aerial stills sell 32% faster.",
        businessNeed: "Reduce listing days and maximize property value.",
        confidence: 0.9,
        evidence: [{ rationale: "Properties with professional imagery receive 2x more qualified inquiries." }]
      });
      recommendations.push({
        serviceName: "Cinematic Video Shoot & Drone Commercial",
        status: "recommended",
        priority: "high",
        reason: "Drone video showcases and cinematic property walkthroughs drive NRI and high-net-worth buyers.",
        businessNeed: "Drive premium buyer acquisition.",
        confidence: 0.9,
        evidence: [{ rationale: "Video walkthroughs increase real estate inquiry conversion by 40%." }]
      });
    } else if (isFandB) {
      recommendations.push({
        serviceName: "Food & Dining Photo Shoot",
        status: "recommended",
        priority: "high",
        reason: "Restaurant and F&B brands need mouth-watering culinary and ambiance visuals to drive foot traffic.",
        businessNeed: "Increase table reservations and delivery orders.",
        confidence: 0.9,
        evidence: [{ rationale: "Restaurants with professional food photography see 30% more reservations." }]
      });
      recommendations.push({
        serviceName: "Packaging Design",
        status: "recommended",
        priority: "high",
        reason: "Custom packaging, dielines, and product labels enhance brand prestige on shelves and in deliveries.",
        businessNeed: "Drive impulse purchases and shelf recognition.",
        confidence: 0.88,
        evidence: [{ rationale: "Premium packaging directly correlates with 20%+ higher repeat orders." }]
      });
      if (!hasBrandGuidelines) {
        recommendations.push({
          serviceName: "Branding, Logo & Menu Identity",
          status: "recommended",
          priority: "medium",
          reason: "Consistent brand identity across menu, signage, and social media builds dining recognition.",
          businessNeed: "Strengthen brand recall and perceived quality.",
          confidence: 0.85,
          evidence: [{ rationale: "Consistent F&B branding increases repeat visits by 20%." }]
        });
      }
    } else if (isFinance) {
      recommendations.push({
        serviceName: "Corporate Video Shoot & Brand Film",
        status: "recommended",
        priority: "high",
        reason: "Finance and banking institutions require authoritative corporate brand films to build institutional trust.",
        businessNeed: "Establish high-trust financial credibility.",
        confidence: 0.9,
        evidence: [{ rationale: "Corporate brand films increase client trust index by 38%." }]
      });
      recommendations.push({
        serviceName: "Branding & Logo Design",
        status: "recommended",
        priority: "medium",
        reason: "Refined visual guidelines and color systems establish prestige and security across all financial collateral.",
        businessNeed: "Ensure institutional brand authority.",
        confidence: 0.88,
        evidence: [{ rationale: "Consistent visual identity reinforces perceived asset security." }]
      });
    } else {
      recommendations.push({
        serviceName: "Commercial Video Shoot",
        status: "recommended",
        priority: "high",
        reason: `Video commercials and high-performing social reels provide the highest engagement for ${displayName}.`,
        businessNeed: "Maximize brand visibility and customer acquisition.",
        confidence: 0.9,
        evidence: [{ rationale: "Video content generates 1200% more shares than text and static images combined." }]
      });
      if (!hasBrandGuidelines) {
        recommendations.push({
          serviceName: "Branding & Logo Design",
          status: "recommended",
          priority: "high",
          reason: "Missing formal brand guidelines. Establishing visual standards ensures consistency across marketing.",
          businessNeed: "Build visual authority.",
          confidence: 0.9,
          evidence: [{ rationale: "Forbes: Consistent branding increases revenue up to 23%." }]
        });
      }
    }
  } else {
    recommendations.push({
      serviceName: "High-Converting Website",
      status: "recommended",
      priority: "high",
      reason: `No active web domain detected for ${displayName}. A modern conversion site is recommended to build digital authority.`,
      businessNeed: "Establish web presence and capture qualified inquiries.",
      confidence: 0.95,
      evidence: [{ rationale: "Stanford: 75% of consumers judge credibility based on website design." }]
    });
    recommendations.push({
      serviceName: "Branding & Logo Design",
      status: "recommended",
      priority: "high",
      reason: `Build a distinctive visual identity, logo, and guidelines to launch ${displayName} with maximum market impact.`,
      businessNeed: "Establish new market presence with strong brand authority.",
      confidence: 0.92,
      evidence: [{ rationale: "Strong brand identity increases initial customer acquisition trust." }]
    });
  }

  return {
    targetAudience,
    existingAssets,
    recommendations,
    roadmap: [
      { title: "Phase 1: Brand Foundation & Identity", objective: "Establish core brand identity and visual guidelines.", services: ["Brand Identity", "Logo Design"] },
      { title: "Phase 2: Digital Growth & Media", objective: "Build conversion website and digital media assets.", services: ["Website", "Video Production"] }
    ],
    budgetStatus: "requires_admin_pricing"
  };
}

  const fetchRecommendations = async (customContext = {}) => {
    setIsGeneratingRecommendation(true);
    const defaultData = evaluateDynamicBusinessContext(state);

    try {
      const session = sessionManager.getSession();
      const userId = session?.userId;

      if (!userId) {
        setIsGeneratingRecommendation(false);
        return;
      }

      // Build rich context — include all known profile fields so backend
      // can pass them to the recommendation engine alongside website evidence
      const profile = profileService.getProfileById(userId) || {};
      const brain = profile.businessBrain || {};

      const payload = {
        context: {
          strategicAnswers: state.strategicAnswers || {},
          selectedServices: state.selectedServices || [],
          businessName: brain.businessName || state.businessName || null,
          industry: brain.industry || state.industry || null,
          businessStage: brain.businessStage || state.businessStage || null,
          businessDescription: brain.businessDescription || state.businessDescription || null,
          targetAudience: brain.targetAudience || null,
          website: brain.website || state.websiteUrl || null,
          businessGoal: brain.businessGoal || null,
          products: brain.products || [],
          ...customContext
        }
      };

      const recommendCall = apiService.post('/recommend', payload);
      const timeoutCall = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Recommendation request timed out after 2.5s')), 2500)
      );

      const response = await Promise.race([recommendCall, timeoutCall]);
      const structuredResult = response.result || {};

      const mergedData = {
        ...defaultData,
        ...structuredResult,
        // Prefer serviceAssessments (new schema), fall back to legacy recommendations[]
        serviceAssessments: structuredResult.serviceAssessments || [],
        recommendations: (structuredResult.recommendations && structuredResult.recommendations.length > 0)
          ? structuredResult.recommendations
          : defaultData.recommendations
      };

      updateState({ fullRecommendationData: mergedData });

      // ── PERSIST to profile.businessBrain.addiRecommendations ──────────────────
      // This is the single source of truth.
      // Admin reads from here. Customer reads from here. No separate regeneration.
      const updatedRecs = businessProfileService.updateBusinessProfile(userId, {
        addiRecommendations: mergedData,
        addiRecommendationsGeneratedAt: new Date().toISOString()
      });
      syncService.syncProfile(userId, updatedRecs);

      // Map serviceAssessments (new) → display format for customer UI
      const assessments = mergedData.serviceAssessments || [];
      const mappedRecs = assessments
        .filter(a =>
          a.status === 'RECOMMENDED' ||
          a.status === 'POTENTIAL_OPPORTUNITY'
        )
        .map((a, idx) => ({
          id: a.serviceId || `rec_${idx}`,
          title: a.serviceName || 'Recommended Service',
          category: a.status,
          status: a.status,
          observation: a.observation || '',
          evidence: a.evidence || '',
          gap: a.gap || null,
          businessImpact: a.businessImpact || null,
          reasoning: a.reasoning || a.reason || 'Based on your business context.',
          confidence: a.confidence || 'medium',
          priority: a.priority || 'medium',
          requiresExpertReview: a.requiresExpertReview || false
        }));

      // Also build negative assessments for display (not_suggested / already_sufficient)
      const negativeAssessments = assessments
        .filter(a =>
          a.status === 'NOT_CURRENTLY_SUGGESTED' ||
          a.status === 'ALREADY_SUFFICIENT' ||
          a.status === 'NEEDS_REVIEW'
        )
        .map((a, idx) => ({
          id: a.serviceId || `neg_${idx}`,
          title: a.serviceName || 'Service',
          status: a.status,
          observation: a.observation || '',
          evidence: a.evidence || '',
          reasoning: a.reasoning || '',
          confidence: a.confidence || 'medium',
          requiresExpertReview: a.requiresExpertReview || false
        }));

      updateState({
        aiRecommendations: mappedRecs,
        negativeAssessments,
        allServiceAssessments: assessments
      });

    } catch (err) {
      console.warn('[Onboarding] AI Recommendation API fallback triggered', err);
      updateState({ fullRecommendationData: defaultData });
    } finally {
      setIsGeneratingRecommendation(false);
    }
  };

  const handleFlowBAnswer = (key, val) => {
    setFormError('');
    let finalVal = val;
    if (selectedOption === 'Other' || val === 'Other') {
      const customVal = validateCustomInput(val, 'Custom choice');
      if (!customVal.isValid) {
        setFormError(customVal.message);
        return;
      }
      finalVal = customVal.value;
    }

    const upd = { ...guidedAnswers, [key]: finalVal };
    setGuidedAnswers(upd);
    updateState({ strategicAnswers: upd });
    setSelectedOption(null);
    setOtherGoalInput('');
    setOtherCategoryInput('');
    setOtherServiceInput('');

    if (flowBQIdx === 0) {
      addHistoryItem("What is your primary business goal right now?", null, finalVal, 'goalQuestion', null, 6);
      setFlowBQIdx(1);
    } else if (flowBQIdx === 1) {
      addHistoryItem("What category does your business fall into?", null, finalVal, 'categoryQuestion', null, 6);
      setIsGeneratingRecommendation(true);
      setStepIndex(7);
      fetchRecommendations({ strategicAnswers: upd });
    }
  };

  useEffect(() => {
    if (stepIndex === 7 && state.fullRecommendationData) {
      const recs = state.fullRecommendationData.recommendations || [];
      const requested = state.selectedServices || [];
      const suggested = recs
        .filter(r => r.status === 'recommended' || r.status === 'consider')
        .map(r => r.serviceName);
      
      const combined = Array.from(new Set([...requested, ...suggested]));
      
      const isScopeChanged = finalScope.length !== combined.length ||
                            combined.some((srv, idx) => finalScope[idx] !== srv);
      if (isScopeChanged) {
        setFinalScope(combined);
      }

      // Fix 3: Internal notification for expert review
      const needsExpert = state.fullRecommendationData.targetAudience?.requiresExpertReview === true ||
                          recs.some(r => r.status === 'needs_review');
      
      if (needsExpert && !isExpertReviewRequested) {
        setIsExpertReviewRequested(true);
        try {
          const bizName = state.businessProfile?.businessName || 'A customer';
          UniversalNotificationEngine.notify({
            userId: 'admin',
            role: 'Admin',
            type: 'expert_review_required',
            title: 'Expert Review Required',
            message: `${bizName} has received an ADDI recommendation that requires manual expert review.`,
            priority: 'high',
            source: 'customer_onboarding'
          });
        } catch(e) {
          console.warn('Notification engine failed', e);
        }
      }
    }
  }, [stepIndex, state.fullRecommendationData, state.selectedServices]);

  const handleMultiSelectFlowA = () => {
    setFormError('');
    if (localSelectedServices.length === 0) {
      setFormError('Please select at least one service to continue.');
      return;
    }
    
    let finalServices = [...localSelectedServices];
    if (finalServices.includes('Other')) {
      const customVal = validateCustomInput(otherServiceInput, 'Other service');
      if (!customVal.isValid) {
        setFormError(customVal.message);
        return;
      }
      finalServices = finalServices.map(s => s === 'Other' ? customVal.value : s);
    }
    
    updateState({ selectedServices: finalServices });
    setFinalScope(finalServices);
    
    const displayStr = finalServices.length > 2 
      ? `${finalServices.slice(0, 2).join(', ')} & ${finalServices.length - 2} more`
      : finalServices.join(', ');
      
    addHistoryItem("What deliverables do you need?", "Select all the services you need for this project.", displayStr, null, null, 6);
    
    const staticRecs = finalServices.map((srv, idx) => ({
      id: `r${idx}`,
      title: srv,
      category: 'Customer Requested',
      reasoning: `You specifically requested this service for your roadmap.`
    }));
    updateState({ aiRecommendations: staticRecs });
    setStepIndex(7);
    fetchRecommendations({ selectedServices: finalServices });
  };

  const handleSelectTypeFlowA = (type) => {
    setSelectedType(type);
    setSelectedDeliverable(type);
    addHistoryItem("What deliverable do you need?", null, type, 'deliverableQuestion');
    setFlowAQIdx(1);
  };

  const handleFlowAContextAnswer = (key, val) => {
    const upd = { ...guidedAnswers, [key]: val };
    setGuidedAnswers(upd);
    const questions = DELIVERABLE_QUESTIONS[selectedType] || DELIVERABLE_QUESTIONS['default'];
    const currentQ = questions[flowAQIdx - 1] || questions[0];

    addHistoryItem(currentQ.question, null, val);

    if (flowAQIdx < questions.length) {
      setFlowAQIdx(prev => prev + 1);
    } else {
      setStepIndex(8);
    }
  };

  const handleSelectRecommendation = (item) => {
    setSelectedDeliverable(item.title);
    addHistoryItem("Based on your goals, here is what ADDI recommends.", "Select a deliverable to begin creative strategy.", item.title, 'recWelcome', 'recSubtitle');
    setStepIndex(8);
  };

  const handleConfirmBooking = () => {
    const del = state.selectedServices?.length ? state.selectedServices[0] : (selectedDeliverable || selectedType || 'Brand Film');
    const title = state.selectedServices?.length > 1 ? 'Custom Production Package' : `${del} Package`;
    const prop = {
      title: title,
      budgetDisplay: 'Quote pending from ADDUS team',
      timelineDisplay: 'To be confirmed',
      timelineDays: null,
      deliverables: state.selectedServices?.map(s => `${s} Deliverables`) || [],
      crew: []
    };
    setProposal(prop);
    
    const shootReqs = Object.values(scheduleRequests).filter(r => r.scheduleType === 'SHOOT_DATE_REQUEST');
    const delReqs = Object.values(scheduleRequests).filter(r => r.scheduleType === 'DELIVERY_DATE_REQUEST');
    let schedStr = '';
    if (shootReqs.length && delReqs.length) {
      schedStr = `Shoot: ${new Date(shootReqs[0].preferredDate).toLocaleDateString()}, Delivery: ${new Date(delReqs[0].preferredDate).toLocaleDateString()}`;
    } else if (shootReqs.length) {
      schedStr = `Shoot: ${new Date(shootReqs[0].preferredDate).toLocaleDateString()}`;
    } else if (delReqs.length) {
      schedStr = `Delivery: ${new Date(delReqs[0].preferredDate).toLocaleDateString()}`;
    } else {
      schedStr = shootDate ? `Shoot: ${new Date(shootDate).toLocaleDateString()}` : (deliveryDate ? `Delivery: ${new Date(deliveryDate).toLocaleDateString()}` : 'Date Requested');
    }

    addHistoryItem("Preferred Schedule Requests", "Select preferred dates for your production/delivery.", schedStr, 'scheduleWelcome', 'scheduleSubtitle');
    setStepIndex(9);
  };

  const handleConfirmFinalProject = () => {
    setFormError('');

    // Centralized Final Validation Gate
    // 1. Identity Validation
    let session = sessionManager.getSession();
    if (!session || !session.userId || !session.token) {
      session = sessionManager.createSession({
        userId: state.userId || `user_${Date.now()}`,
        phone: state.phone || state.phoneNumber || null,
        email: state.email || null,
        verified: true,
        lastVisitedScreen: 'dashboard'
      });
    }
    
    if (!state.verified) {
      updateState({ verified: true });
    }

    const customerName = state.name || state.businessProfile?.customerName || state.businessProfile?.businessName || 'Valued Client';
    const nameVal = validateName(customerName).isValid ? validateName(customerName) : { isValid: true, name: customerName };

    // 2. Business Information Validation
    const bProf = state.businessProfile || {};
    const bizNameStr = bProf.businessName || 'Your Business';
    const bizVal = validateBusinessName(bizNameStr).isValid ? validateBusinessName(bizNameStr) : { isValid: true, name: bizNameStr };

    // 3. Final Scope Gate
    const effectiveScope = (finalScope && finalScope.length > 0) ? finalScope : (state.selectedServices?.length ? state.selectedServices : ['Brand Identity']);

    const del = state.selectedServices?.length ? state.selectedServices[0] : (selectedDeliverable || selectedType || 'Brand Project');
    const title = effectiveScope.length > 1 ? 'Custom Production Package' : `${del} Package`;
    
    const proj = {
      customerName: nameVal.name,
      title: title,
      type: effectiveScope.join(', '),
      status: 'planning',
      shootDate: shootDate || state.preferredShootDate || null,
      deliveryDate: deliveryDate || state.preferredDeliveryDate || null,
      scheduleRequests: state.scheduleRequests || scheduleRequests || {},
      businessProfile: bProf,
      selectedServices: state.selectedServices || [],
      finalScope: effectiveScope,
      customScopeNotes: state.customScopeNotes || [],
      createdAt: new Date().toISOString()
    };

    try {
      createDraftProject(proj);
    } catch (err) {
      console.error('[Onboarding] Failed to create draft project:', err);
      setFormError('Failed to create project. Please try again.');
      return;
    }

    session = sessionManager.getSession();
    if (!session || !session.userId) {
      session = sessionManager.createSession({
        userId: state.userId || `user_${Date.now()}`,
        phone: state.phone || state.phoneNumber || null,
        email: state.email || null,
        verified: true,
        lastVisitedScreen: 'dashboard'
      });
    } else {
      sessionManager.updateLastVisitedScreen('dashboard');
    }

    updateState({ currentStep: 'dashboard', verified: true, onboardingStatus: 'completed' });
    completeOnboarding({ onboardingStatus: 'completed' });

    if (typeof onProjectCreated === 'function') {
      onProjectCreated(proj);
    }
  };

  const prof = state.businessProfile || {};

  return (
    <div className="hotstar-layout-wrapper">
      {/* Desktop Minimal Sidebar */}
      <nav className="hotstar-desktop-sidebar">
        <div className="hotstar-nav-group">
          <div className="hotstar-nav-item" title="Search"><Search size={22} /><span className="hotstar-nav-label">Search</span></div>
          <div className="hotstar-nav-item" title="Help"><HelpCircle size={22} /><span className="hotstar-nav-label">Help</span></div>
          <div className="hotstar-nav-item" title="Logout"><LogOut size={22} /><span className="hotstar-nav-label">Logout</span></div>
        </div>
      </nav>

      {/* Mobile Hamburger Header */}
      <div className="hotstar-mobile-header">
        <button className="hotstar-hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={26} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="hotstar-mobile-overlay fade-in" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="hotstar-mobile-drawer slide-in-left" onClick={e => e.stopPropagation()}>
            <div className="hotstar-mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </div>
            <div className="hotstar-nav-item" title="Search"><Search size={22} /><span className="hotstar-nav-label-mobile">Search</span></div>
            <div className="hotstar-nav-item" title="Help"><HelpCircle size={22} /><span className="hotstar-nav-label-mobile">Help</span></div>
            <div className="hotstar-nav-item" title="Logout"><LogOut size={22} /><span className="hotstar-nav-label-mobile">Logout</span></div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="hotstar-main-content">
        <div className="duolingo-onboarding-viewport fade-in" style={{ paddingTop: '32px' }}>
          
      {/* ── LOGIN SUCCESS CELEBRATION POPUP MODAL (mascot (2).json) ───────── */}
      {showCelebrationModal && (
        <div className="celebration-modal-backdrop fade-in">
          <div className="celebration-modal-card scale-in">
            <CelebrationLottiePlayer width={240} height={240} />
            <h2 className="celebration-heading">Successfully! 🎉</h2>
          </div>
        </div>
      )}

      {/* ── PROJECT CONFIRMED SUCCESS POPUP MODAL (MASCOT_CELEBRATION.JSON LOTTIE) ───────── */}
      {showProjectConfirmedModal && (
        <div className="celebration-modal-backdrop fade-in">
          <div className="celebration-modal-card project-confirmed-modal-card scale-in">
            <CelebrationLottiePlayer width={260} height={260} />
            <h2 className="celebration-heading" style={{ fontSize: '24px', marginTop: '12px' }}>
              Project Confirmed Successfully! 🎉
            </h2>
            <p className="celebration-subtext" style={{ maxWidth: '380px', marginTop: '8px', lineHeight: '1.5' }}>
              Your project has been confirmed successfully. Our team will now begin the production process and keep you updated at every stage.
            </p>
          </div>
        </div>
      )}

      {/* ── DUPLICATE BUSINESS DETECTED MODAL ───────── */}
      {showDuplicateModal && duplicateMatch && (
        <div className="celebration-modal-backdrop fade-in" style={{ zIndex: 10000 }}>
          <div className="celebration-modal-card scale-in" style={{ maxWidth: '480px', padding: '24px', textAlign: 'left', background: '#1A1A24', border: '1px solid #00D1FF', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,209,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <AlertCircle size={28} color="#00D1FF" />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFF', marginBottom: '8px' }}>
              Existing Account Detected
            </h3>
            <p style={{ fontSize: '13px', color: '#B3B3B3', marginBottom: '16px', lineHeight: '1.5' }}>
              {duplicateMatch.message}
              {duplicateMatch.confidence && (
                <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: 'rgba(0,209,255,0.1)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.2)' }}>
                  Match Confidence: {duplicateMatch.confidence}
                </span>
              )}
            </p>

            {duplicateMatch.existingBusiness && (
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Existing Account Details</div>
                {duplicateMatch.existingBusiness.businessName && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Business: </span>
                    <span style={{ color: '#FFF', fontSize: '13px', fontWeight: 600 }}>{duplicateMatch.existingBusiness.businessName}</span>
                  </div>
                )}
                {duplicateMatch.existingBusiness.userId && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Account ID: </span>
                    <span style={{ color: '#E0E0E0', fontSize: '13px' }}>{duplicateMatch.existingBusiness.userId}</span>
                  </div>
                )}
                {duplicateMatch.existingBusiness.email && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Email: </span>
                    <span style={{ color: '#E0E0E0', fontSize: '13px' }}>{duplicateMatch.existingBusiness.email}</span>
                  </div>
                )}
                {duplicateMatch.existingBusiness.phoneNumber && (
                  <div>
                    <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Phone: </span>
                    <span style={{ color: '#E0E0E0', fontSize: '13px' }}>{duplicateMatch.existingBusiness.phoneNumber}</span>
                  </div>
                )}
              </div>
            )}

            <p style={{ fontSize: '13px', color: '#B3B3B3', marginBottom: '20px', lineHeight: '1.5' }}>
              If this is your business, please login to your existing account. If this is a different business, you can proceed with your new registration.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="duolingo-submit-btn"
                style={{ width: '100%', minHeight: '44px' }}
                onClick={() => {
                  setShowDuplicateModal(false);
                  const biz = duplicateMatch.existingBusiness || {};
                  if (biz.phoneNumber) {
                    setAuthMethod('phone');
                    setPhoneInput(biz.phoneNumber);
                  } else if (biz.email) {
                    setAuthMethod('email');
                    setEmailInput(biz.email);
                  }
                  setOtpSent(false);
                  setOtpInput('');
                  setLoginError('');
                  setStepIndex(1); // Force Login flow
                }}
              >
                <span>Login to existing account</span>
              </button>

              <button
                type="button"
                className="duolingo-secondary-btn"
                style={{ width: '100%', minHeight: '44px', borderColor: 'rgba(255,255,255,0.15)', color: '#FFF' }}
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateConfirmed(true);
                  setStepIndex(5); // Continue with new registration
                }}
              >
                <span>Continue as new business</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NO DELIVERABLES SELECTED MODAL ───────── */}
      {showNoDeliverablesModal && (
        <div className="celebration-modal-backdrop fade-in" style={{ zIndex: 10000 }}>
          <div className="celebration-modal-card scale-in" style={{ maxWidth: '480px', padding: '24px', textAlign: 'left', background: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Sparkles size={24} color="#7c5cff" />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFF', marginBottom: '6px' }}>
              Hey, it seems you haven't selected any of the professional presence requirements we discussed.
            </h3>
            <p style={{ fontSize: '13px', color: '#B3B3B3', marginBottom: '16px', lineHeight: '1.4' }}>
              ADDI identified these areas as relevant to your business:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
              {(state.fullRecommendationData?.serviceAssessments || state.fullRecommendationData?.recommendations || [])
                .filter(a => a.status === 'RECOMMENDED' || a.status === 'POTENTIAL_OPPORTUNITY' || a.status === 'recommended' || a.status === 'already_have')
                .map((assessment, idx) => {
                  const itemLabel = assessment.serviceName || assessment.title || assessment.serviceId || `Item ${idx + 1}`;
                  const isChecked = selectedDeliverablesInModal.includes(itemLabel);
                  return (
                    <label key={assessment.serviceId || assessment.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDeliverablesInModal(prev => [...prev, itemLabel]);
                          } else {
                            setSelectedDeliverablesInModal(prev => prev.filter(s => s !== itemLabel));
                          }
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#7c5cff' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFF' }}>{itemLabel}</span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>{(assessment.status || '').replace('_', ' ').toUpperCase()}</span>
                        {assessment.priority && <span style={{ fontSize: '11px', color: '#7c5cff', marginLeft: '6px' }}>{assessment.priority}</span>}
                      </div>
                    </label>
                  );
                })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="duolingo-secondary-btn"
                style={{ width: '100%', minHeight: '44px', borderColor: 'rgba(255,255,255,0.15)', color: '#FFF' }}
                onClick={() => {
                  const allRecommended = (state.fullRecommendationData?.serviceAssessments || [])
                    .filter(a => a.status === 'RECOMMENDED' || a.status === 'POTENTIAL_OPPORTUNITY')
                    .map(a => a.serviceName || a.serviceId);
                  setSelectedDeliverablesInModal(allRecommended);
                }}
              >
                <span>Mark All</span>
              </button>

              <button
                type="button"
                className="duolingo-submit-btn"
                style={{ width: '100%', minHeight: '44px' }}
                onClick={() => {
                  const updatedScope = [...new Set([...finalScope, ...selectedDeliverablesInModal])];
                  setFinalScope(updatedScope);
                  updateState({ selectedServices: updatedScope });
                  setShowNoDeliverablesModal(false);
                  setSelectedDeliverablesInModal([]);
                  setStepIndex(8);
                }}
              >
                <span>Continue</span>
              </button>

              <button
                type="button"
                className="duolingo-secondary-btn"
                style={{ width: '100%', minHeight: '44px', border: 'none', color: '#9CA3AF' }}
                onClick={() => {
                  setShowNoDeliverablesModal(false);
                  setSelectedDeliverablesInModal([]);
                  setStepIndex(8);
                }}
              >
                <span>Continue Without Deliverables</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Conversation Stream Container */}
      <main className={`duolingo-main-container conversation-stream-container ${stepIndex > 1 ? 'has-bottom-bar' : ''}`}>
        
        {formError && (
          <div className="error-banner flex-center margin-bottom-16" style={{ padding: '12px 16px', background: 'rgba(255, 75, 75, 0.15)', border: '1px solid #FF4B4B', borderRadius: '8px', color: '#FF4B4B', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}
        
        {/* ── HISTORICAL CHAT MESSAGES (COMPLETED TURNS — NO MASCOT) ───────── */}
        {history.map((turn, idx) => (
          <div key={turn.id || idx} className="chat-turn-group fade-in">
            {/* Previous AI Message (Speech Bubble Only) */}
            <div className="duolingo-mascot-row past-mascot-row">
              <DuolingoSpeechBubble className="past-speech-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading past-heading">
                  {turn.questionKey ? t(turn.questionKey) : turn.question}
                </h1>
                {turn.subtitle && (
                  <p className="duolingo-subtitle-text past-subtitle">
                    {turn.subtitleKey ? t(turn.subtitleKey) : turn.subtitle}
                  </p>
                )}
              </DuolingoSpeechBubble>
            </div>

            {/* User Answer Bubble on the Right */}
            {turn.userAnswerText && (
              <div 
                className="duolingo-user-bubble"
                onClick={() => {
                  if (turn.stepIndex) {
                    setStepIndex(turn.stepIndex);
                    setHistory(prev => prev.slice(0, idx)); // Truncate history
                  }
                }}
                style={{ cursor: turn.stepIndex ? 'pointer' : 'default', transition: 'all 0.2s' }}
                title={turn.stepIndex ? 'Click to edit your answer' : ''}
              >
                <User size={16} className="user-bubble-icon" />
                <span>{turn.userAnswerText}</span>
                {turn.stepIndex ? <Edit2 size={14} className="user-check-icon" style={{ opacity: 0.6 }} /> : <CheckCircle size={16} className="user-check-icon" />}
              </div>
            )}
          </div>
        ))}

        {/* ── CURRENT ACTIVE QUESTION STEP ─────────────────────────────────── */}
        
        {/* STEP 1: RECOVERED LOGIN SCREEN */}
        {/* STEP 1: DESKTOP TWO-COLUMN POPUP & MOBILE FULLSCREEN */}
        {stepIndex === 1 && (
          <div className="login-modal-overlay fade-in">
            <div className="login-modal-content">
              {/* Close Button */}
              <button className="login-modal-close" onClick={() => { /* Close logic if any */ }}>
                <X size={20} />
              </button>

              {/* Desktop Left Column */}
              <div className="login-modal-left">
                <div className="login-left-composition">
                  <div className="login-mascot-container">
                    <MascotLottiePlayer stepKey={currentStepKey} path="/lottiefile/mascot_on_chair.json" />
                  </div>
                  <div className="login-addus-text">I am Addi</div>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="login-modal-divider">
                <span>OR</span>
              </div>

              {/* Right Column (Form) */}
              <div className="login-modal-right">
                <div className="premium-login-container">
                  <h1 className="login-heading" style={{ fontSize: '24px' }}>Login or sign up to continue</h1>

              <div className="auth-tab-flex margin-top-16">
                <button
                  type="button"
                  className={`auth-tab-btn ${authMethod === 'phone' ? 'active-tab' : ''}`}
                  onClick={() => { setAuthMethod('phone'); setLoginError(''); setOtpSent(false); }}
                >
                  <Smartphone size={16} /> Mobile Number
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${authMethod === 'email' ? 'active-tab' : ''}`}
                  onClick={() => { setAuthMethod('email'); setLoginError(''); setOtpSent(false); }}
                >
                  <Mail size={16} /> Email Address
                </button>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="margin-top-20" style={{ position: 'relative', zIndex: 2 }}>
                  {authMethod === 'phone' ? (
                    <div className="premium-input-group">
                      <div className="premium-prefix">+91</div>
                      <div className="premium-input-wrapper">
                        <span className="premium-label">Mobile number</span>
                        <input
                          type="tel"
                          className="premium-text-input"
                          value={phoneInput}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setPhoneInput(val);
                            setLoginError('');
                          }}
                          maxLength={10}
                          autoFocus
                        />
                        {phoneInput && (
                          <button type="button" className="clear-input-btn" onClick={() => setPhoneInput('')}>
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="premium-input-group">
                      <div className="premium-input-wrapper">
                        <span className="premium-label">Email Address</span>
                        <input
                          type="email"
                          className="premium-text-input"
                          value={emailInput}
                          onChange={e => { setEmailInput(e.target.value); setLoginError(''); }}
                          autoFocus
                        />
                        {emailInput && (
                          <button type="button" className="clear-input-btn" onClick={() => setEmailInput('')}>
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {loginError && (
                    <p className="error-text-msg margin-top-10">
                      <AlertCircle size={15} /> {loginError}
                    </p>
                  )}


                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0', textAlign: 'left' }}>
                    <input
                      type="checkbox"
                      id="legal-agree-checkbox"
                      checked={legalAgreed}
                      onChange={(e) => {
                        setLegalAgreed(e.target.checked);
                        setLoginError('');
                      }}
                      style={{ accentColor: '#7C5CFF', width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <label htmlFor="legal-agree-checkbox" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: '1.5' }}>
                      I agree to the{' '}
                      <button type="button" onClick={() => setLegalViewType('terms')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', padding: 0, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}>
                        Terms &amp; Conditions
                      </button>{' '}
                      and{' '}
                      <button type="button" onClick={() => setLegalViewType('privacy')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', padding: 0, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}>
                        Privacy Policy
                      </button>.
                    </label>
                  </div>
                  <div className="login-bottom-row">
                    <div className="login-help-text">
                      Having trouble logging in? <a href="#">Get Help</a>
                    </div>
                    
                    <button
                      type="submit"
                      className="floating-continue-btn"
                      disabled={(authMethod === 'phone' ? phoneInput.length !== 10 : !emailInput.trim()) || !legalAgreed}
                    >
                      <ArrowRight size={24} color="#fff" />
                    </button>
                  </div>

                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="margin-top-20" style={{ position: 'relative', zIndex: 2 }}>
                  <p className="otp-sent-info" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Verification code sent to <strong>{authMethod === 'phone' ? `+91 ${phoneInput}` : emailInput}</strong>
                  </p>

                  <div className="premium-input-group margin-top-16">
                    <div className="premium-input-wrapper">
                        <span className="premium-label">4-digit code</span>
                      <input
                        type="text"
                        className="premium-text-input"
                        style={{ letterSpacing: '8px' }}
                        value={otpInput}
                        onChange={e => {
                           const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setOtpInput(val);
                          setLoginError('');
                        }}
                         maxLength={4}
                        autoFocus
                      />
                    </div>
                  </div>

                  {loginError && (
                    <p className="error-text-msg margin-top-10">
                      <AlertCircle size={15} /> {loginError}
                    </p>
                  )}

                  <div className="login-bottom-row" style={{ marginTop: '32px' }}>
                    <button
                      type="button"
                      className="duolingo-secondary-btn"
                      style={{ minHeight: '40px', padding: '0 16px', fontSize: '13px' }}
                      onClick={() => setOtpSent(false)}
                    >
                      {authMethod === 'phone' ? 'Change Phone' : 'Change Email'}
                    </button>

                    <button
                      type="submit"
                      className="floating-continue-btn"
                      disabled={otpInput.length < 4}
                    >
                      <ArrowRight size={24} color="#fff" />
                    </button>
                  </div>
                </form>
              )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* STEP 3: BUSINESS UPLOAD / ANALYSIS */}
        {stepIndex === 3 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">{t('bizWelcome')}</h1>
                <p className="duolingo-subtitle-text">{t('bizSubtitle')}</p>
              </DuolingoSpeechBubble>
            </div>

            <div style={{ width: '100%', marginTop: '8px' }} className="chat-stagger-1">
              <BusinessUploadWidget 
                onAnalysisComplete={handleBusinessAnalysisDone} 
                activeTab={businessUploadTab}
                onTabChange={setBusinessUploadTab}
              />
            </div>
          </div>
        )}

        {/* STEP 4: BUSINESS PROFILE CONFIRMATION */}
        {stepIndex === 4 && (
          <div className="duolingo-step-card active-step-card compact-review-card-wrapper">
            <div className="duolingo-mascot-row" style={{ width: '100%' }}>
              <MascotLottiePlayer stepKey={currentStepKey} path="/lottiefile/intro-ilkokul.json" />
              
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble business-review-summary-card">
                 {/* ADDI Header & Title */}
                 <div className="conversational-sender-tag">
                   <span className="online-dot"></span> ADDI
                 </div>
                <h2 className="review-card-title">
                  {t('bizReviewWelcome')}
                </h2>

                 {/* Structured failure message from backend */}
                 {prof.sourceStatus && prof.sourceStatus !== 'LIKELY_BUSINESS_WEBSITE' && (
                   <div className="margin-top-12" style={{ textAlign: 'left' }}>
                     <div style={{ 
                       background: 'rgba(255, 107, 107, 0.08)', 
                       border: '1px solid rgba(255, 107, 107, 0.25)', 
                       borderRadius: '8px', 
                       padding: '10px 12px',
                       marginBottom: '8px'
                     }}>
                       <div style={{ fontSize: '13px', color: '#FF6B6B', marginBottom: '4px', fontWeight: 600 }}>
                         {prof.sourceStatus === 'ACCESS_BLOCKED' && 'Website access restricted'}
                         {prof.sourceStatus === 'RETRIEVAL_FAILED' && 'Website access failed'}
                         {prof.sourceStatus === 'INSUFFICIENT_EVIDENCE' && 'Limited website information'}
                         {(prof.sourceStatus === 'REJECTED_SOURCE' || prof.failureReason === 'INVALID_URL') && 'Invalid website address'}
                         {!['ACCESS_BLOCKED', 'RETRIEVAL_FAILED', 'INSUFFICIENT_EVIDENCE', 'REJECTED_SOURCE'].includes(prof.sourceStatus) && 'Website analysis incomplete'}
                       </div>
                       <div style={{ fontSize: '12px', color: '#B3B3B3', lineHeight: '1.5' }}>
                         {prof.userMessage || getDefaultFailureMessage(prof.sourceStatus, prof.failureReason)}
                       </div>
                     </div>
                     
                     {/* Recovery actions - always available when analysis did not produce a reliable business profile */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                       <button 
                         type="button" 
                         className="duolingo-option-card" 
                         style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left' }}
                         onClick={() => { setBusinessUploadTab('text'); setStepIndex(3); }}
                       >
                         <div style={{ fontWeight: 600, marginBottom: '2px' }}>✍️ Type my business info</div>
                         <div style={{ fontSize: '11px', opacity: 0.8 }}>Add your business details manually.</div>
                       </button>
                       <button 
                         type="button" 
                         className="duolingo-option-card" 
                         style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'left' }}
                         onClick={() => { setBusinessUploadTab('file'); setStepIndex(3); }}
                       >
                         <div style={{ fontWeight: 600, marginBottom: '2px' }}>📄 Upload File</div>
                         <div style={{ fontSize: '11px', opacity: 0.8 }}>Upload a document containing your business information.</div>
                       </button>
                     </div>
                   </div>
                 )}

                 {/* BUSINESS UNDERSTANDING SUMMARY */}
                 <div className="compact-summary-2col-grid margin-top-12" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="summary-grid-cell">
                      <span className="summary-label">{t('businessLabel')}</span>
                      <strong className="summary-val">{prof.businessName || 'Not yet identified'}</strong>
                    </div>

                    <div className="summary-grid-cell">
                      <span className="summary-label">{t('industryLabel')}</span>
                      <strong className="summary-val">{prof.industry || 'Not yet identified'}</strong>
                    </div>

                    {prof.location && (
                      <div className="summary-grid-cell">
                        <span className="summary-label">Location</span>
                        <strong className="summary-val">{prof.location}</strong>
                      </div>
                    )}

                    {prof.businessStage && (
                      <div className="summary-grid-cell">
                        <span className="summary-label">{t('stageLabel')}</span>
                        <strong className="summary-val">{prof.businessStage}</strong>
                      </div>
                    )}
                  </div>

                  {(prof.businessDescription || prof.summary) && (
                    <div className="margin-top-12" style={{ textAlign: 'left' }}>
                      <span className="summary-label" style={{ display: 'block', marginBottom: '4px' }}>About</span>
                      <p style={{ fontSize: '13px', color: '#E0E0E0', margin: 0, lineHeight: '1.5' }}>
                        {prof.businessDescription || prof.summary}
                      </p>
                    </div>
                  )}

                  {prof.summary && prof.summary !== prof.businessDescription && (
                    <div className="margin-top-12" style={{ textAlign: 'left' }}>
                      <span className="summary-label" style={{ display: 'block', marginBottom: '4px' }}>Summary</span>
                      <p style={{ fontSize: '13px', color: '#E0E0E0', margin: 0, lineHeight: '1.5' }}>
                        {prof.summary}
                      </p>
                    </div>
                  )}

                  {(Array.isArray(prof.services) && prof.services.length > 0) && (
                    <div className="margin-top-12" style={{ textAlign: 'left' }}>
                      <span className="summary-label" style={{ display: 'block', marginBottom: '6px' }}>What you offer</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {prof.services.map((srv, idx) => (
                          <span key={idx} style={{ background: '#2B2B36', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#FFF' }}>{srv}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(Array.isArray(prof.products) && prof.products.length > 0) && (
                    <div className="margin-top-12" style={{ textAlign: 'left' }}>
                      <span className="summary-label" style={{ display: 'block', marginBottom: '6px' }}>Products</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {prof.products.map((prod, idx) => (
                          <span key={idx} style={{ background: '#2B2B36', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#FFF' }}>{prod}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(Array.isArray(prof.assets) && prof.assets.length > 0) && (
                    <div className="margin-top-12" style={{ textAlign: 'left' }}>
                      <span className="summary-label" style={{ display: 'block', marginBottom: '6px' }}>Professional presence</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {prof.assets.map((ast, idx) => (
                          <span key={idx} style={{ background: '#1a3a2a', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#58CC02', border: '1px solid rgba(88,204,2,0.2)' }}>
                            {ast.type}: {ast.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(prof.contactInfo?.email || prof.contactInfo?.phone || (Array.isArray(prof.socialLinks) && prof.socialLinks.length > 0)) && (
                    <div className="margin-top-12" style={{ textAlign: 'left' }}>
                      <span className="summary-label" style={{ display: 'block', marginBottom: '6px' }}>Contact & Social</span>
                      <div style={{ fontSize: '12px', color: '#B3B3B3', lineHeight: '1.6' }}>
                        {prof.contactInfo?.email && <div>Email: {prof.contactInfo.email}</div>}
                        {prof.contactInfo?.phone && <div>Phone: {prof.contactInfo.phone}</div>}
                        {Array.isArray(prof.socialLinks) && prof.socialLinks.length > 0 && <div>Social: {prof.socialLinks.join(', ')}</div>}
                      </div>
                    </div>
                  )}

                  {(!prof.businessName && !prof.industry && !prof.businessStage && (!Array.isArray(prof.services) || prof.services.length === 0) && !prof.sourceStatus) && (
                    <div className="margin-top-12" style={{ textAlign: 'left', color: '#FF6B6B', fontSize: '13px' }}>
                      We couldn't retrieve any business information. Please enter your business details manually or upload a document.
                    </div>
                  )}

                 {/* BOTTOM ACTIONS: SUBTLE EDIT & PRIMARY CONTINUE */}
                 <div className="review-card-bottom-actions margin-top-14">
                   <button
                     type="button"
                     className="btn-edit-subtle"
                     onClick={() => setStepIndex(3)}
                   >
                     <Edit2 size={13} /> {t('edit')}
                   </button>

                    {(prof.sourceStatus === 'LIKELY_BUSINESS_WEBSITE') && (prof.businessName || prof.industry || (Array.isArray(prof.services) && prof.services.length > 0) || prof.businessDescription) && (
                     <button
                       type="button"
                       className="duolingo-option-card btn-looks-good-gradient btn-looks-good-compact"
                       onClick={() => handleSelectOption('confirm_profile', 'Profile Confirmed', handleConfirmProfile)}
                     >
                       <span>{t('looksGoodContinue')}</span>
                     </button>
                   )}
                 </div>
              </DuolingoSpeechBubble>
            </div>
          </div>
        )}

        {/* STEP 5: BRANCHING CHOICE (3 OPTIONS) */}
        {stepIndex === 5 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">What do you need help with?</h1>
                <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px', textAlign: 'center' }}>
                  Tell ADDI what you need — even if you're not sure yet.
                </p>
              </DuolingoSpeechBubble>
            </div>

            <StackedBranchCards
              onSelectBranch={handleSelectBranch}
              selectedOption={selectedOption}
              onSelectOption={handleSelectOption}
            />
          </div>
        )}

        {/* STEP 6: FLOW B (Help Me Figure Out) */}
        {stepIndex === 6 && branchChoice === 'figuring_out' && flowBQIdx === 0 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">What is your primary business goal right now?</h1>
              </DuolingoSpeechBubble>
            </div>

            <div className="duolingo-options-stack">
              {['Launch business', 'Grow', 'Rebrand', 'Product launch', 'More customers', 'Other'].map((opt, idx) => (
                <div key={opt} className={`chat-stagger-${Math.min(idx + 1, 3)}`}>
                  <button
                    type="button"
                    className={`duolingo-option-card w-full ${selectedOption === opt ? 'option-selected' : ''}`}
                     onClick={() => {
                        if (opt !== 'Other') {
                           handleSelectOption(opt, opt, () => handleFlowBAnswer('goal', opt));
                        } else {
                           if (selectTimeoutRef.current) {
                             clearTimeout(selectTimeoutRef.current);
                             selectTimeoutRef.current = null;
                           }
                           setSelectedOption('Other');
                        }
                     }}
                  >
                    <span>{opt}</span>
                  </button>
                   {selectedOption === 'Other' && opt === 'Other' && (
                      <div className="margin-top-10 other-input-wrapper" style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                         <input
                           type="text"
                           className="duolingo-text-input other-text-input"
                           placeholder="Tell ADDI what you're trying to achieve"
                           value={otherGoalInput}
                           onChange={e => setOtherGoalInput(e.target.value)}
                           onKeyDown={e => { if (e.key === 'Enter' && otherGoalInput.trim()) handleFlowBAnswer('goal', otherGoalInput.trim()); }}
                           autoFocus
                         />
                        <button
                          type="button"
                          className="duolingo-submit-btn"
                          style={{ padding: '0 16px', minWidth: 'auto', height: '48px' }}
                          disabled={!otherGoalInput.trim()}
                          onClick={() => handleFlowBAnswer('goal', otherGoalInput.trim())}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {stepIndex === 6 && branchChoice === 'figuring_out' && flowBQIdx === 1 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">What category does your business fall into?</h1>
              </DuolingoSpeechBubble>
            </div>

            <div className="duolingo-options-stack">
              {[
                'Hospitality & Tourism',
                'Medical & Healthcare',
                'E-commerce & Retail',
                'Food & Beverages',
                'FMCG (Fast-Moving Consumer Goods)',
                'Finance & Banking',
                'Professional Services & Corporate',
                'Other'
              ].map((opt, idx) => (
                <div key={opt} className={`chat-stagger-${Math.min(idx + 1, 3)}`}>
                  <button
                    type="button"
                    className={`duolingo-option-card w-full ${selectedOption === opt ? 'option-selected' : ''}`}
                     onClick={() => {
                        if (opt !== 'Other') {
                           handleSelectOption(opt, opt, () => handleFlowBAnswer('category', opt));
                        } else {
                           if (selectTimeoutRef.current) {
                             clearTimeout(selectTimeoutRef.current);
                             selectTimeoutRef.current = null;
                           }
                           setSelectedOption('Other');
                        }
                     }}
                  >
                    <span>{opt}</span>
                  </button>
                   {selectedOption === 'Other' && opt === 'Other' && (
                      <div className="margin-top-10 other-input-wrapper" style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 10 }}>
                         <input
                           type="text"
                           className="duolingo-text-input other-text-input"
                           placeholder="Tell ADDI what type of business you have"
                           value={otherCategoryInput}
                           onChange={e => setOtherCategoryInput(e.target.value)}
                           onKeyDown={e => { if (e.key === 'Enter' && otherCategoryInput.trim()) handleFlowBAnswer('category', otherCategoryInput.trim()); }}
                           autoFocus
                         />
                        <button
                          type="button"
                          className="duolingo-submit-btn"
                          style={{ padding: '0 16px', minWidth: 'auto', height: '48px' }}
                          disabled={!otherCategoryInput.trim()}
                          onClick={() => handleFlowBAnswer('category', otherCategoryInput.trim())}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: FLOW A (I Know What I Need) WITH MULTI-SELECT & SIMPLE EXPLANATIONS */}
        {stepIndex === 6 && branchChoice === 'know_need' && flowAQIdx === 0 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">What deliverables do you need?</h1>
                <p className="duolingo-subtitle-text">Select all the services you need for this project.</p>
              </DuolingoSpeechBubble>
            </div>

            <div className="netflix-media-grid margin-top-20 chat-stagger-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {[
                { title: '🎥 Video Shoot', explanation: 'Commercials, social media reels, and corporate films.' },
                { title: '📸 Photo Shoot', explanation: 'Product photography, brand visuals, and team portraits.' },
                { title: '🎨 Branding & Logo', explanation: 'Logos, color themes, visual identity, and brand guidelines.' },
                { title: '📱 Social Media Management', explanation: 'Content calendars, daily posts, and profile growth.' },
                { title: '📢 Paid Advertisements', explanation: 'Meta ads, Google ads, and billboard designs.' },
                { title: '📈 Marketing Strategy', explanation: 'Business growth planning, SEO, and email campaigns.' },
                { title: '✂️ Video & Photo Editing', explanation: 'Turning raw footage into polished reels, videos, and retouched photos.' },
                { title: '📦 Product & Packaging Design', explanation: 'Designing website UI/UX layouts and physical product packages.' },
                { title: '🚀 Product Launch Campaign', explanation: 'Big promotional rollouts and seasonal sales activations.' },
                { title: '✍️ Content & Copywriting', explanation: 'Website text, blogs, video scripts, and social media captions.' },
                { title: '🪄 Influencer & Talent Sourcing', explanation: 'Connecting your brand with matching creators, models, and influencers.' }
              ].map(opt => {
                const srv = opt.title;
                const isSelected = localSelectedServices.includes(srv);
                return (
                  <button
                    key={srv}
                    type="button"
                    className={`duolingo-option-card glass-service-card ${isSelected ? 'option-selected' : ''}`}
                    style={{
                      minHeight: '80px',
                      padding: '14px',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      position: 'relative'
                    }}
                    onClick={() => {
                      if (isSelected) {
                        setLocalSelectedServices(prev => prev.filter(s => s !== srv));
                      } else {
                        setLocalSelectedServices(prev => [...prev, srv]);
                      }
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFF', paddingRight: '20px' }}>{opt.title}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '4px', lineHeight: '1.3' }}>
                      {opt.explanation}
                    </span>
                    {isSelected && <CheckCircle size={16} style={{ position: 'absolute', top: '12px', right: '12px', color: '#00D1FF' }} />}
                  </button>
                );
              })}
            </div>

            {localSelectedServices.includes('Other') && (
              <div className="margin-top-12 chat-stagger-2 fade-in">
                 <input 
                   type="text" 
                   className="duolingo-text-input" 
                   placeholder="Please describe what else you need..." 
                   value={otherServiceInput}
                   onChange={e => setOtherServiceInput(e.target.value)}
                 />
              </div>
            )}

            <div className="chat-stagger-3 margin-top-20">
              <button 
                type="button"
                className="floating-continue-btn" 
                disabled={localSelectedServices.length === 0 || (localSelectedServices.includes('Other') && !otherServiceInput.trim())}
                onClick={handleMultiSelectFlowA}
                title="Continue"
              >
                <ArrowRight size={24} color="#fff" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: PHASE 3 - STRUCTURED ADDI RECOMMENDATION PAGE */}
        {stepIndex === 7 && (
          <div className="duolingo-step-card active-step-card" style={{ paddingBottom: '80px' }}>
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                {isGeneratingRecommendation ? (
                   <>
                     <h1 className="duolingo-question-heading">Analyzing your business context...</h1>
                     <p className="duolingo-subtitle-text">ADDI is formulating a structured strategy and mapping out a recommended roadmap.</p>
                   </>
                ) : (
                   <>
                     <h1 className="duolingo-question-heading">Your Business Strategy &amp; Opportunities</h1>
                     <p className="duolingo-subtitle-text">Review ADDI's complete understanding and recommendations based on your business context.</p>
                   </>
                )}
              </DuolingoSpeechBubble>
            </div>

            {isGeneratingRecommendation && (
              <div className="chat-stagger-1 fade-in margin-top-20" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="duolingo-profile-card" style={{ background: '#1A1A24', border: '1px solid rgba(0,209,255,0.3)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <RefreshCw size={20} className="spin-slow" color="#00D1FF" />
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#FFF' }}>Formulating Creative Strategy...</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#58CC02' }}>
                      <CheckCircle size={14} /> <span>Evaluating business positioning &amp; goals</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#00D1FF' }}>
                      <Sparkles size={14} className="pulse-glow" /> <span>Mapping high-impact deliverables &amp; roadmap</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#B3B3B3' }}>
                      <Clock size={14} /> <span>Finalizing asset assessment...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isGeneratingRecommendation && (
              <div className="chat-stagger-1 fade-in margin-top-20" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* A. WHAT ADDI UNDERSTOOD */}
                <div className="duolingo-profile-card">
                  <h4 className="margin-bottom-12" style={{ fontWeight: '700', fontSize: '15px', color: '#00D1FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    A. What ADDI Understood
                  </h4>
                  <div className="profile-row">
                    <span className="profile-label">Customer Name:</span>
                    <span className="profile-val">
                      {(() => {
                        const raw = state.name || state.businessProfile?.customerName || '';
                        if (!raw || (/^\d+$/.test(raw.replace(/\D/g, '')) && raw.length >= 7)) return 'Customer';
                        return raw;
                      })()}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Business:</span>
                     <span className="profile-val">{state.businessProfile?.businessName || 'Not confidently identified'}</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Industry:</span>
                    <span className="profile-val">{state.businessProfile?.industry || 'Not confidently identified'}</span>
                  </div>
                  {state.businessProfile?.segment && (
                    <div className="profile-row">
                      <span className="profile-label">Segment:</span>
                      <span className="profile-val">{state.businessProfile.segment}</span>
                    </div>
                  )}
                  <div className="profile-row" style={{ alignItems: 'flex-start' }}>
                    <span className="profile-label">Summary:</span>
                    <span className="profile-val" style={{ display: 'block', marginTop: '2px', lineHeight: '1.4' }}>
                      {state.businessProfile?.businessDescription || state.businessProfile?.summary || 'No business description provided yet.'}
                    </span>
                  </div>
                </div>

                {/* B. INFERRED TARGET AUDIENCE */}
                {state.fullRecommendationData?.targetAudience && (
                  <div className="duolingo-profile-card">
                    <h4 className="margin-bottom-10" style={{ fontWeight: '700', fontSize: '15px', color: '#FFC800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      B. ADDI Inferred Target Audience
                    </h4>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFF', marginBottom: '8px', lineHeight: '1.4' }}>
                      {state.fullRecommendationData?.targetAudience?.description || 'Not confidently identified'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowTargetAudienceRationale(prev => !prev)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#00D1FF',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {showTargetAudienceRationale ? 'Hide reasoning' : 'Why this?'}
                      {showTargetAudienceRationale ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showTargetAudienceRationale && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 12px',
                        background: '#1A1A24',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#B3B3B3',
                        lineHeight: '1.5',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <strong style={{ color: '#00D1FF' }}>Why ADDI inferred this:</strong>{' '}
                        {state.fullRecommendationData?.targetAudience?.reasoning || 'Insufficient evidence to determine target audience.'}
                      </div>
                    )}
                  </div>
                )}

                {/* C. OPPORTUNITIES, RECOMMENDATIONS & REFERENCES (MERGED D + E) */}
                <div className="duolingo-profile-card">
                  <h4 className="margin-bottom-14" style={{ fontWeight: '700', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    C. Opportunities &amp; Recommendations
                  </h4>
                  
                  {/* ADDI RECOMMENDS WITH EMBEDDED REFERENCES */}
                  {(() => {
                    const OFFICIAL_11 = [
                      'Video Shoot', 'Photo Shoot', 'Branding & Logo', 'Social Media Management',
                      'Paid Advertisements', 'Marketing Strategy', 'Video & Photo Editing',
                      'Product & Packaging Design', 'Product Launch Campaign', 'Content & Copywriting',
                      'Influencer & Talent Sourcing'
                    ];
                    let recs = state.fullRecommendationData?.recommendations || state.aiRecommendations || [];

                    if (branchChoice === 'know_need') {
                      const userSelected = state.selectedServices || finalScope || [];
                      if (userSelected.length > 0) {
                        return userSelected.map(srv => ({
                          serviceName: srv,
                          title: srv,
                          status: 'recommended',
                          reason: 'Directly selected for your project scope.'
                        }));
                      }
                    } else if (branchChoice === 'figuring_out') {
                      const filtered = recs.filter(r => {
                        const t = (r.serviceName || r.title || '').toLowerCase();
                        return OFFICIAL_11.some(cat => t.includes(cat.toLowerCase()) || cat.toLowerCase().includes(t));
                      });
                      if (filtered.length > 0) return filtered;
                    }
                    return recs;
                  })().length > 0 && (
                    <div style={{ marginBottom: state.selectedServices && state.selectedServices.length > 0 ? '16px' : '0' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#00D1FF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>
                        ADDI Recommends
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(() => {
                          const OFFICIAL_11 = [
                            'Video Shoot', 'Photo Shoot', 'Branding & Logo', 'Social Media Management',
                            'Paid Advertisements', 'Marketing Strategy', 'Video & Photo Editing',
                            'Product & Packaging Design', 'Product Launch Campaign', 'Content & Copywriting',
                            'Influencer & Talent Sourcing'
                          ];
                          let recs = state.fullRecommendationData?.recommendations || state.aiRecommendations || [];

                          if (branchChoice === 'know_need') {
                            const userSelected = state.selectedServices || finalScope || [];
                            if (userSelected.length > 0) {
                              return userSelected.map(srv => ({
                                serviceName: srv,
                                title: srv,
                                status: 'recommended',
                                reason: 'Directly selected for your project scope.'
                              }));
                            }
                          } else if (branchChoice === 'figuring_out') {
                            const filtered = recs.filter(r => {
                              const t = (r.serviceName || r.title || '').toLowerCase();
                              return OFFICIAL_11.some(cat => t.includes(cat.toLowerCase()) || cat.toLowerCase().includes(t));
                            });
                            if (filtered.length > 0) return filtered;
                          }
                          return recs;
                        })().map((rec, idx) => {
                          const title = rec.serviceName || rec.title || 'Recommended Service';
                          const statusText = rec.status ? rec.status.replace('_', ' ').toUpperCase() : 'RECOMMENDED';
                          const isExpanded = expandedRecommendations[idx];
                          const shortDesc = (rec.reason || rec.businessNeed || 'Based on your business positioning and goals.').split('.')[0] + '.';
                          return (
                            <div key={idx} style={{
                              padding: '14px',
                              background: '#2B2B36',
                              borderRadius: '8px',
                              borderLeft: rec.status === 'recommended' ? '3px solid #00D1FF' : '3px solid #3A3A46'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: 'rgba(0,209,255,0.1)',
                                    color: '#00D1FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <Sparkles size={14} />
                                  </div>
                                  <span style={{ fontWeight: '700', fontSize: '14px', color: '#FFF' }}>{title}</span>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: rec.status === 'recommended' ? 'rgba(0,209,255,0.15)' : '#1A1A24', color: rec.status === 'recommended' ? '#00D1FF' : '#B3B3B3', whiteSpace: 'nowrap' }}>
                                  {statusText}
                                </span>
                              </div>
                              <p style={{ fontSize: '12px', color: '#B3B3B3', margin: '0 0 8px 0', lineHeight: '1.4', paddingLeft: '36px' }}>
                                {shortDesc}
                              </p>
                              
                              <div style={{ paddingLeft: '36px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedRecommendations(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#00D1FF',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    padding: 0,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  {isExpanded ? 'Hide details' : 'Why this?'}
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                                
                                {isExpanded && (
                                  <div style={{
                                    padding: '10px 12px',
                                    background: '#1A1A24',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    color: '#B3B3B3',
                                    lineHeight: '1.5',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                  }}>
                                    <strong style={{ color: '#00D1FF' }}>Why ADDI recommends this:</strong>{' '}
                                    {rec.evidence && rec.evidence.length > 0
                                      ? rec.evidence[0].rationale
                                      : `High commercial impact for ${state.businessProfile?.industry || 'your business'} growth.`}
                                  </div>
                                )}

                                {/* EMBEDDED REFERENCE & INSPIRATION BOX INSIDE THE SAME CARD */}
                                <div style={{
                                  marginTop: '6px',
                                  padding: '10px 12px',
                                  background: '#1A1A24',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  border: '1px solid rgba(0,209,255,0.15)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={13} color="#00D1FF" />
                                    <div>
                                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#00D1FF', fontWeight: '700', display: 'block' }}>Reference Sample</span>
                                      <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>{title}</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="duolingo-secondary-btn"
                                    style={{ fontSize: '11px', padding: '5px 10px', minHeight: 'auto', textTransform: 'none' }}
                                    onClick={() => {
                                      setSelectedDeliverable(title);
                                      setSelectedType(title);
                                      setShowStylePreview(true);
                                    }}
                                  >
                                    View details →
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* YOU REQUESTED — SECONDARY */}
                  {state.selectedServices && state.selectedServices.length > 0 && (
                    <div style={{ padding: '10px 12px', background: 'rgba(0, 209, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 209, 255, 0.12)' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D1FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        You Requested
                      </span>
                      <div className="margin-top-6" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {state.selectedServices.map((req, idx) => (
                          <span key={idx} style={{ background: '#1A1A24', color: '#B3B3B3', padding: '3px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)' }}>
                            ✓ {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* G. FINALIZE SCOPE & ESTIMATED BUDGET */}
                <div className="duolingo-profile-card">
                  <h4 className="margin-bottom-12" style={{ fontWeight: '700', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    G. Finalize Project Scope
                  </h4>
                  <p style={{ fontSize: '13px', color: '#B3B3B3', marginBottom: '12px' }}>Select/deselect deliverables to customize your scope of work:</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Array.from(new Set([
                      ...(state.selectedServices || []), 
                      ...(state.fullRecommendationData?.recommendations || []).map(r => r.serviceName)
                    ])).map((srv, idx) => {
                      const isSelected = finalScope.includes(srv);
                      return (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#2B2B36', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setFinalScope(prev => [...prev, srv]);
                              else setFinalScope(prev => prev.filter(s => s !== srv));
                            }}
                            style={{ accentColor: '#00D1FF', width: '16px', height: '16px' }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: '600', color: isSelected ? '#FFF' : '#B3B3B3' }}>{srv}</span>
                        </label>
                      );
                    })}
                  </div>
                  
                  <div className="margin-top-16" style={{ padding: '12px 14px', background: '#1A1A24', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(0,209,255,0.2)' }}>
                    <span style={{ fontSize: '13px', color: '#B3B3B3' }}>Estimated Budget</span>
                    <span style={{ fontWeight: '700', color: '#00D1FF', fontSize: '14px' }}>
                      Estimated range — final quote after expert review
                    </span>
                  </div>
                </div>

                {/* H. CUSTOM SCOPE CHANGE / CHAT */}
                <div className="duolingo-profile-card" style={{ background: '#1A1A24', border: '1px solid #3A3A46' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: '#FFF' }}>
                    Need something else or have a custom request?
                  </p>
                  
                  {/* DISPLAY SAVED CUSTOM REQUESTS */}
                  {customRequests.length > 0 && (
                    <div className="margin-bottom-12" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {customRequests.map((note, nIdx) => (
                        <div key={nIdx} style={{ background: '#2B2B36', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#00D1FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(0,209,255,0.2)' }}>
                          <span>💬 Custom Request: "<strong>{note}</strong>"</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: '#58CC02', fontWeight: '700', background: 'rgba(88,204,2,0.15)', padding: '2px 8px', borderRadius: '4px' }}>ADDED TO SCOPE</span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: '#FF4B4B', cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: 0 }}
                              onClick={() => handleRemoveCustomRequest(note)}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddCustomRequest} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="duolingo-text-input" 
                      style={{ flex: 1, padding: '10px 14px', minHeight: 'auto', background: '#2B2B36', fontSize: '13px', color: '#FFF', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                      placeholder="Tell ADDI what else you need (e.g. 4K Drone Footage)..."
                      value={scopeChatInput}
                      onChange={e => setScopeChatInput(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="duolingo-submit-btn" 
                      style={{ padding: '0 16px', minHeight: 'auto', height: '42px', minWidth: '120px', cursor: 'pointer' }}
                      onClick={handleAddCustomRequest}
                    >
                      <span>Add Request</span>
                    </button>
                  </form>
                </div>

                {/* I. EXPERT REVIEW NOTIFICATION */}
                <div className="duolingo-profile-card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#2B2B36', borderLeft: '3px solid #58CC02' }}>
                  <ShieldCheck size={20} color="#58CC02" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0', color: '#FFF' }}>ADDI Expert Review</h5>
                    <p style={{ fontSize: '12px', color: '#B3B3B3', margin: 0, lineHeight: '1.4' }}>
                      Your business details and recommendations have been shared with our relevant experts for review. They will review ADDI's recommendations and provide their suggestions within approximately 3 hours.
                    </p>
                  </div>
                </div>

                <div className="margin-top-14">
                  <button 
                    type="button"
                    className="duolingo-submit-btn w-full" 
                    style={{ boxShadow: '0 4px 20px rgba(0, 209, 255, 0.25)' }}
                    onClick={() => {
                      if (finalScope.length === 0) {
                        setShowNoDeliverablesModal(true);
                        return;
                      }
                      updateState({ selectedServices: finalScope });
                      setStepIndex(8);
                    }}
                  >
                    <span>Proceed to Scheduling</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Fallback for when API fails */}
            {!isGeneratingRecommendation && !state.fullRecommendationData && (
              <div className="duolingo-options-stack margin-top-20">
                {(state.aiRecommendations || []).map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    className={`duolingo-option-card chat-stagger-${Math.min(idx + 1, 3)}`}
                    onClick={() => {
                      updateState({ selectedServices: [item.title] });
                      setFinalScope([item.title]);
                      setStepIndex(8);
                    }}
                  >
                    <div className="option-content-col">
                      <span className="option-title-text">★★★★★ {item.title}</span>
                      <span className="option-sub-text">{item.reasoning}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 8: SCHEDULING (INDEPENDENT PER-SERVICE DATE REQUESTS — NO TIME PICKER) */}
        {stepIndex === 8 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">Request your preferred dates</h1>
                <p className="duolingo-subtitle-text">
                  These are your preferred dates. ADDUS will review your request and confirm the final schedule after your project is accepted.
                </p>
              </DuolingoSpeechBubble>
            </div>

            <div className="chat-stagger-1 margin-top-20" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* PER-SERVICE INDEPENDENT DATE REQUEST CARDS */}
              {finalScope.map(srv => {
                const scheduleType = getServiceScheduleType(srv);
                const isShoot = scheduleType === 'SHOOT_DATE_REQUEST';
                const label = isShoot ? 'Preferred shoot date' : 'Preferred delivery date';
                const currentDate = scheduleRequests[srv]?.preferredDate || '';

                return (
                  <div key={srv} className="duolingo-profile-card" style={{ borderLeft: isShoot ? '3px solid #00D1FF' : '3px solid #58CC02' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isShoot ? <Video size={18} color="#00D1FF" /> : <CalendarIcon size={18} color="#58CC02" />}
                        <h4 style={{ fontWeight: '700', fontSize: '15px', margin: 0, color: '#FFF' }}>{srv}</h4>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: isShoot ? 'rgba(0,209,255,0.15)' : 'rgba(88,204,2,0.15)', color: isShoot ? '#00D1FF' : '#58CC02' }}>
                        {label}
                      </span>
                    </div>

                    <div className="calendar-time-flex-layout" style={{ justifyContent: 'center', marginTop: '12px' }}>
                      <div className="calendar-left-col">
                        <ShootCalendar
                          minDate={new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]}
                          value={currentDate}
                          onChange={(dStr) => handleDateChangeForService(srv, dStr, scheduleType)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ padding: '12px 14px', background: 'rgba(0,209,255,0.08)', borderRadius: '8px', border: '1px solid rgba(0,209,255,0.2)', fontSize: '13px', color: '#E0E0E0' }}>
                ℹ️ <em>These are your preferred dates. ADDUS will review your request and confirm the final schedule after your project is accepted.</em>
              </div>

              <div className="margin-top-12">
                <button 
                  type="button"
                  className="duolingo-submit-btn w-full" 
                  onClick={handleConfirmBooking}
                >
                  <span>Review Project Summary</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: FINAL PROJECT SUMMARY */}
        {stepIndex === 9 && (
          <div className="duolingo-step-card active-step-card" style={{ paddingBottom: '80px' }}>
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">Final Project Summary</h1>
                <p className="duolingo-subtitle-text">Review your complete onboarding context before confirming.</p>
              </DuolingoSpeechBubble>
            </div>

            <div className="chat-stagger-1 margin-top-20" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="duolingo-profile-card">
                <h4 style={{ fontSize: '12px', color: '#B3B3B3', textTransform: 'uppercase', marginBottom: '8px' }}>Customer &amp; Business Information</h4>
                <div className="profile-row"><span className="profile-label">Customer Name:</span><span className="profile-val">{state.name || state.businessProfile?.customerName || 'Customer'}</span></div>
                <div className="profile-row"><span className="profile-label">Business Name:</span><span className="profile-val">{state.businessProfile?.businessName || 'Not confidently identified'}</span></div>
                <div className="profile-row"><span className="profile-label">Industry:</span><span className="profile-val">{state.businessProfile?.industry || 'Not specified'}</span></div>
                {state.businessProfile?.segment && <div className="profile-row"><span className="profile-label">Segment:</span><span className="profile-val">{state.businessProfile.segment}</span></div>}
                {state.businessProfile?.businessDescription && (
                  <div className="profile-row" style={{ alignItems: 'flex-start' }}><span className="profile-label">Description:</span><span className="profile-val" style={{ display: 'block', marginTop: '2px' }}>{state.businessProfile.businessDescription}</span></div>
                )}
              </div>

              {/* ASSET CONFIRMATIONS & UPLOADS REMOVED FROM STEP 9 — ACCESSIBLE IN USER PROFILE SECTION */}

              <div className="duolingo-profile-card">
                <h4 style={{ fontSize: '12px', color: '#B3B3B3', textTransform: 'uppercase', marginBottom: '8px' }}>Strategy &amp; Scope</h4>
                <div className="profile-row" style={{ alignItems: 'flex-start' }}>
                  <span className="profile-label">Final Scope:</span>
                  <span className="profile-val" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {finalScope.map((srv, idx) => <span key={idx} style={{ background: '#2B2B36', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#FFF' }}>{srv}</span>)}
                  </span>
                </div>
                {(state.customScopeNotes || []).length > 0 && (
                  <div className="profile-row" style={{ alignItems: 'flex-start' }}>
                    <span className="profile-label">Custom Requests:</span>
                    <span className="profile-val" style={{ color: '#00D1FF' }}>
                      {(state.customScopeNotes || []).join('; ')}
                    </span>
                  </div>
                )}
                <div className="profile-row"><span className="profile-label">Requested:</span><span className="profile-val">{state.selectedServices?.join(', ') || 'None'}</span></div>
                <div className="profile-row"><span className="profile-label">Recommended:</span><span className="profile-val">{state.fullRecommendationData?.recommendations?.filter(r => r.status === 'recommended').map(r => r.serviceName).join(', ') || 'None'}</span></div>
                <div className="profile-row"><span className="profile-label">Estimated Budget:</span><span className="profile-val" style={{ color: '#00D1FF' }}>Estimated range — final quote after expert review</span></div>
              </div>

              {/* PER-SERVICE SCHEDULE REQUESTS */}
              <div className="duolingo-profile-card">
                <h4 style={{ fontSize: '12px', color: '#B3B3B3', textTransform: 'uppercase', marginBottom: '8px' }}>Schedule Requests</h4>
                {Object.keys(scheduleRequests).length > 0 ? (
                  Object.entries(scheduleRequests).map(([srv, req]) => (
                    <div key={srv} className="profile-row">
                      <span className="profile-label">{srv}:</span>
                      <span className="profile-val">
                        {req.scheduleType === 'SHOOT_DATE_REQUEST' ? 'Shoot date requested' : 'Delivery date requested'}: <strong>{req.preferredDate ? new Date(req.preferredDate).toLocaleDateString() : 'To be confirmed'}</strong>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="profile-row"><span className="profile-label">Schedule:</span><span className="profile-val">To be confirmed</span></div>
                )}
              </div>

              <div className="duolingo-profile-card" style={{ background: '#2B2B36', borderLeft: '3px solid #58CC02' }}>
                <h4 style={{ fontSize: '12px', color: '#58CC02', textTransform: 'uppercase', marginBottom: '8px' }}>Expert Review</h4>
                <p style={{ fontSize: '13px', color: '#E0E0E0', margin: 0 }}>This summary and strategy is pending validation by our expert team. We will review and provide a confirmed quote within 3 hours.</p>
              </div>

              <div className="margin-top-12">
                <SwipeToConfirmButton
                  text="Confirm"
                  onConfirm={handleConfirmFinalProject}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ float: 'left', clear: 'both' }} />
      </main>
      
      {/* ── LEGAL PREVIEW MODAL OVERLAY ───────── */}
      {legalViewType && (
        <div className="celebration-modal-backdrop fade-in" style={{ zIndex: 10001, overflowY: 'auto', padding: '40px 10px' }} onClick={() => setLegalViewType(null)}>
          <div className="scale-in" style={{ maxWidth: '700px', width: '100%', background: '#111116', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button className="duolingo-secondary-btn micro-btn" onClick={() => setLegalViewType(null)}>Close Document</button>
            </div>
            <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '6px' }}>
              <LegalPages type={legalViewType} />
            </div>
          </div>
        </div>
      )}

      {/* Style Preview Modal */}
      {showStylePreview && selectedDeliverable && (
        <StylePreviewModal
          card={{ title: selectedDeliverable, style: selectedDeliverable, type: selectedDeliverable }}
          onSelect={(c) => {
            setShowStylePreview(false);
            try {
              const activeProj = state.projects?.[0] || {};
              const userName = state.name || 'A customer';
              
              if (activeProj.id) {
                const updatedRefs = Array.from(new Set([...(activeProj.selectedGalleryReferences || []), c.title]));
                updateProjectInStore(activeProj.id, { selectedGalleryReferences: updatedRefs });
              }

              UniversalNotificationEngine.notify({
                userId: 'admin',
                role: 'Admin',
                type: 'gallery_selected',
                title: 'Gallery Item Selected',
                message: `${userName} selected reference: "${c.title}" for service "${c.type}".`,
                metadata: {
                  customer: userName,
                  selectedItem: c.title,
                  category: c.type,
                  timestamp: new Date().toISOString(),
                  projectId: activeProj.id || 'N/A'
                }
              });
            } catch(e) {
              console.warn(e);
            }
          }}
          onClose={() => setShowStylePreview(false)}
        />
      )}
    </div>
      </div>
    </div>
  );
}

export default ConversationalOnboarding;
