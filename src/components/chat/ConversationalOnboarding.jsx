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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ADDI â€” Continuous Vertical Conversation Onboarding
   - Splash Screen -> Login Step -> Login Celebration Popup (mascot (2).json) -> Onboarding Stream
   - Recovered Video Showcase Section
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

// Inline SVG India flag (saffron/white/green tricolor + Ashoka Chakra)
function IndiaFlag() {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    return { x2: 450 + 80 * Math.sin(angle), y2: 300 - 80 * Math.cos(angle) };
  });
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className="india-flag-svg" aria-label="India flag">
      <rect width="900" height="600" fill="#138808" />
      <rect width="900" height="400" fill="#FFFFFF" />
      <rect width="900" height="200" fill="#FF9933" />
      <circle cx="450" cy="300" r="90" fill="none" stroke="#000088" strokeWidth="8" />
      <circle cx="450" cy="300" r="10" fill="#000088" />
      {spokes.map((s, i) => (
        <line key={i} x1="450" y1="300" x2={s.x2} y2={s.y2} stroke="#000088" strokeWidth="4" />
      ))}
    </svg>
  );
}

function MascotLottiePlayer({ stepKey, path = '/bg/chat.json', loop = true, width, height, className = '', stopAfterSeconds }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId;

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
      
      if (stopAfterSeconds) {
        timeoutId = setTimeout(() => {
          if (animRef.current) {
            try {
              animRef.current.pause();
            } catch (err) {
              // Ignore lottie internal audio pause errors (this.audio.pause is not a function)
            }
          }
        }, stopAfterSeconds * 1000);
      }
    } catch (e) {
      console.warn('Lottie player error:', e);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, [stepKey, path, loop, stopAfterSeconds]);

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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   STACKED BRANCH CARDS (INTERACTIVE 3-CARD STACK)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StackedBranchCards({ onSelectBranch, selectedOption, onSelectOption }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const cards = [
    {
      id: 'know_need',
      title: 'I know what I need',
      desc: 'I already have something in mind. Help me plan it and get it done.',
      icon: '/images/target_3d.svg',
      chatText: 'I know what I need',
      staggerClass: 'chat-stagger-1'
    },
    {
      id: 'figuring_out',
      title: "I don't know",
      desc: "I know I need to build my professional presence, but I'm not sure where to start. Help me figure it out.",
      icon: '/images/compass_3d.svg',
      chatText: "I don't know",
      staggerClass: 'chat-stagger-2'
    },
    {
      id: 'explore',
      title: 'Skip to Dashboard',
      desc: 'Skip onboarding for now and explore the ADDUS workspace directly.',
      icon: '/images/home_3d.svg',
      chatText: 'Skip to Dashboard',
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
              className={`stacked-card-wrapper ${isFront ? 'stacked-card-front' : 'stacked-card-back'} ${isSelected ? 'branch-card-selected' : ''} editorial-card-bg card-bg-${card.id} ${!isFront ? 'stacked-back-tint' : ''}`}
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SWIPE TO CONFIRM BUTTON (MINIMALIST, ICON-FREE)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
        <span className="poster-rating">{item.rating || '5.0'} â˜…</span>
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
      subtitle: '4K Commercial Shoot â€¢ Spatial & Studio Lighting',
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
      subtitle: '360Â° Studio Showcase & Lens Macro Shots',
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
                <Play size={20} style={{ color: '#00A3FF' }} /> ðŸŽ¬ {activeGalleryTitle} Gallery
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
                Choose {activeGalleryTitle} â†’
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
                <span className="poster-rating" style={{ fontSize: '14px' }}>{activeVideoItem.rating} â˜…</span>
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
                  Select Package â†’
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
    { key: 'branding', question: 'Do you have brand guidelines ready?', options: ['Yes â€” fully ready', 'Partially ready', 'Need help creating guidelines'] }
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
    { key: 'timeline', question: 'What is your priority timeline?', options: ['Standard (7â€“14 days)', 'Fast (3â€“7 days)', 'Urgent (1â€“3 days)'] }
  ]
};

function getDefaultFailureMessage(sourceStatus, failureReason) {
  if (sourceStatus === 'RETRIEVAL_FAILED') {
    if (failureReason === 'TIMEOUT') return 'The website took too long to respond. It may be slow or temporarily unavailable.';
    if (failureReason === 'DNS_FAILED') return 'We couldn\'t resolve the website address. The domain may be incorrect or the site may not exist.';
    if (failureReason === 'CONNECTION_FAILED') return 'We couldn\'t establish a connection to the website. It may be offline or blocking access.';
    if (failureReason === 'CONNECTION_RESET') return 'The connection was interrupted. This may be temporary â€” please try again.';
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

    const [stepIndex, setStepIndex] = useState(() => {
    try {
      const session = sessionManager.getSession();
      if (session && session.userId) {
        if (state.currentStep === 'business_input' || session.lastVisitedScreen === 'business_input') {
          return 3;
        }
        if (state.currentStep === 'name' || session.lastVisitedScreen === 'name') {
          return 3;
        }
      }
    } catch {}
    return 3;
  });

  /* Auth handled centrally by AuthScreen */

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
  const [legalAgreed, setLegalAgreed] = useState(true);
  const [businessUploadTab, setBusinessUploadTab] = useState('text');
  const [legalViewType, setLegalViewType] = useState(null);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false);
  const [finalScope, setFinalScope] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [scopeChatInput, setScopeChatInput] = useState('');
  const [customRequests, setCustomRequests] = useState(state.customScopeNotes || []);
  const [isExpertReviewRequested, setIsExpertReviewRequested] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState(null);
  const [showViewAll, setShowViewAll] = useState(false);

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
  const [timeSlot, setTimeSlot] = useState('11 AM â€“ 1 PM');
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

  // Ensure selectedOption is reset whenever the user navigates between steps/questions
  useEffect(() => {
    setSelectedOption(null);
  }, [stepIndex, branchChoice, flowAQIdx, flowBQIdx]);


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
          await handleVerifyOTP({ preventDefault: () => {} });
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
        handleSelectBranch('know_need');
      }
      return;
    }

    addHistoryItem("How else can ADDI help with your creative strategy?", null, text);
  };

  const prevStepRef = useRef(stepIndex);
  useEffect(() => {
    if (prevStepRef.current !== stepIndex) {
      prevStepRef.current = stepIndex;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stepIndex]);

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
      lang === 'ml' ? 'à´®à´²à´¯à´¾à´³à´‚ (Malayalam) âœ“' : 'English âœ“'
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

  // â”€â”€ RECOVERED LOGIN FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    if (!legalAgreed) {
      setLoginError('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    if (authMethod === 'phone') {
      const pVal = validatePhone(phoneInput);
      if (!pVal.isValid) {
        setLoginError(pVal.message);
        return;
      }
      try {
        const res = await otpService.sendOTP(phoneInput);
        if (!res.success) {
          setLoginError(res.message || 'Failed to send OTP. Please try again.');
          return;
        }
      } catch (err) {
        setLoginError(err.message || 'Failed to send OTP. Please try again.');
        return;
      }
    } else {
      const eVal = validateEmail(emailInput);
      if (!eVal.isValid) {
        setLoginError(eVal.message);
        return;
      }
      try {
        const res = await emailAuthService.sendEmailOTP(emailInput);
        if (!res.success) {
          setLoginError(res.message || 'Failed to send email OTP. Please try again.');
          return;
        }
      } catch (err) {
        setLoginError(err.message || 'Failed to send email OTP. Please try again.');
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
    try {
      if (authMethod === 'phone') {
        verifyRes = await otpService.verifyOTP(phoneInput, otpInput, otpAttempts);
      } else {
        verifyRes = await emailAuthService.verifyEmailOTP(emailInput, otpInput);
      }
    } catch (err) {
      console.warn('OTP verify exception:', err);
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
    
    const existing = profiles.find(p => {
      if (authMethod === 'phone') {
        const pPhone = (p.phoneNumber || p.phone || '').replace(/\D/g, '');
        return cleanPhone.length >= 10 && pPhone.length >= 10 && cleanPhone.slice(-10) === pPhone.slice(-10);
      }
      if (authMethod === 'email') {
        const pEmail = (p.email || '').trim().toLowerCase();
        return cleanEmail && pEmail && cleanEmail === pEmail;
      }
      return false;
    });

    let finalUserId = `user_${Date.now()}`;
    if (existing) {
      finalUserId = existing.userId || existing.customerId || finalUserId;
    }

    updateState({ verified: true });

    let loginRes = null;
    try {
      if (authMethod === 'phone') {
        loginRes = await authService.loginWithPhone(phoneInput);
      } else {
        loginRes = await authService.loginWithEmail(emailInput);
      }
    } catch (err) {
      console.warn('Login exception fallback:', err);
    }

    const userProfile = loginRes?.profile || existing || {};
    const canonicalUserId = userProfile.userId || userProfile.customerId || finalUserId;

    const newUserState = {
      verified: true,
      phone: phoneInput,
      email: emailInput,
      name: userProfile.name || '',
      currentStep: 'business_input',
      lastVisitedScreen: 'business_input',
      onboardingStatus: 'in_progress',
      businessProfile: userProfile.businessBrain || userProfile.businessProfile || {}
    };

    if (typeof bindToUser === 'function') {
      try {
        bindToUser(canonicalUserId, newUserState);
      } catch (bindErr) {
        console.warn('bindToUser warning:', bindErr);
      }
    }

    try {
      sessionManager.updateLastVisitedScreen('business_input');
    } catch (e) {}

    updateState(newUserState);

    // Auth turn omitted from visual history

    localStorage.setItem('HAS_EXISTING_ADDUS_ACCOUNT', 'true');

    // IMMEDIATELY TRANSITION TO EXISTING ADDI BUSINESS INFORMATION SCREEN (Step 3)
    setStepIndex(3);
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
    const displayText = choice === 'figuring_out' ? "I don't know" : "I know what I need";
    addHistoryItem("Do you know what you need?", null, displayText, 'branchWelcome', null, 5);
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

      // Build rich context â€” include all known profile fields so backend
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

      // â”€â”€ PERSIST to profile.businessBrain.addiRecommendations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // This is the single source of truth.
      // Admin reads from here. Customer reads from here. No separate regeneration.
      const updatedRecs = businessProfileService.updateBusinessProfile(userId, {
        addiRecommendations: mergedData,
        addiRecommendationsGeneratedAt: new Date().toISOString()
      });
      syncService.syncProfile(userId, updatedRecs);

      // Map serviceAssessments (new) â†’ display format for customer UI
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
  const isLoginScreen = stepIndex === 1;

  // Authentication handled centrally by AuthScreen



  return (
    <div className="hotstar-layout-wrapper white-page-mode">
      {isLoginScreen ? null : (
        <>
      {/* Desktop Minimal Sidebar */}
      <nav className="hotstar-desktop-sidebar">
        <div className="hotstar-nav-group">
          <div className="hotstar-nav-item" title="Search"><Search size={22} /><span className="hotstar-nav-label">Search</span></div>
          <div className="hotstar-nav-item" title="Help"><HelpCircle size={22} /><span className="hotstar-nav-label">Help</span></div>
          <div className="hotstar-nav-item" title="Logout" style={{ cursor: 'pointer' }} onClick={() => { authService.logout(); window.location.reload(); }}>
            <LogOut size={22} />
            <span className="hotstar-nav-label">Logout</span>
          </div>
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
            <div className="hotstar-nav-item" title="Logout" style={{ cursor: 'pointer' }} onClick={() => { authService.logout(); window.location.reload(); }}>
              <LogOut size={22} />
              <span className="hotstar-nav-label-mobile">Logout</span>
            </div>
          </nav>
        </div>
      )}

      </>
      )}

      {/* Main Content Area */}
      <div className="hotstar-main-content">
        <div className="duolingo-onboarding-viewport fade-in" style={{ paddingTop: '32px' }}>
          
      {/* â”€â”€ LOGIN SUCCESS CELEBRATION POPUP MODAL (mascot (2).json) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showCelebrationModal && (
        <div className="celebration-modal-backdrop fade-in">
          <div className="celebration-modal-card scale-in">
            <CelebrationLottiePlayer width={240} height={240} />
            <h2 className="celebration-heading">Successfully! ðŸŽ‰</h2>
          </div>
        </div>
      )}

      {/* â”€â”€ PROJECT CONFIRMED SUCCESS POPUP MODAL (MASCOT_CELEBRATION.JSON LOTTIE) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showProjectConfirmedModal && (
        <div className="celebration-modal-backdrop fade-in">
          <div className="celebration-modal-card project-confirmed-modal-card scale-in">
            <CelebrationLottiePlayer width={260} height={260} />
            <h2 className="celebration-heading" style={{ fontSize: '24px', marginTop: '12px' }}>
              Project Confirmed Successfully! ðŸŽ‰
            </h2>
            <p className="celebration-subtext" style={{ maxWidth: '380px', marginTop: '8px', lineHeight: '1.5' }}>
              Your project has been confirmed successfully. Our team will now begin the production process and keep you updated at every stage.
            </p>
          </div>
        </div>
      )}

      {/* â”€â”€ DUPLICATE BUSINESS DETECTED MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              This business identity is already linked to an existing ADDUS account. You can log in to your existing account, or enter different details to register a new business.
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
                  setDuplicateMatch(null);
                  setDuplicateConfirmed(false);
                  // Clear conflicting inputs so user can enter new business details
                  updateState({
                    businessProfile: {
                      ...(state.businessProfile || {}),
                      website: '',
                      businessName: ''
                    }
                  });
                  setStepIndex(3); // Return to Business Input step to enter new website/details
                }}
              >
                <span>Register with different details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ NO DELIVERABLES SELECTED MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
        
        {/* â”€â”€ HISTORICAL CHAT MESSAGES (COMPLETED TURNS FOR STEPS > 4) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {stepIndex > 4 && history.filter(turn => turn.stepIndex !== 1 && !turn.id?.includes("turn_auth")).map((turn, idx) => (
          <div key={turn.id || idx} className="chat-turn-group fade-in">
            {/* Previous AI Message (Speech Bubble with small ADDI avatar) */}
            <div className="completed-addi-row" style={{ display: "flex", justifyContent: "flex-start", width: "100%", marginBottom: "12px" }}>
              <div className="whatsapp-addi-bubble">
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading past-heading">
                  {turn.question || (turn.questionKey ? t(turn.questionKey) : '')}
                </h1>
                {turn.subtitle && (
                  <p className="duolingo-subtitle-text past-subtitle">
                    {turn.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* User Answer Bubble on the Right */}
            {turn.userAnswerText && (
              <div 
                className="whatsapp-user-bubble"
                onClick={() => {
                  if (turn.stepIndex) {
                    setStepIndex(turn.stepIndex);
                    setHistory(prev => prev.slice(0, idx)); // Truncate history
                  }
                }}
                style={{ cursor: turn.stepIndex ? 'pointer' : 'default', transition: 'all 0.2s' }}
                title={turn.stepIndex ? 'Click to edit your answer' : ''}
              >
                <User size={14} className="user-bubble-icon" />
                <span>{turn.userAnswerText}</span>
                {turn.stepIndex ? <Edit2 size={12} className="user-check-icon" style={{ opacity: 0.7 }} /> : <CheckCircle size={14} className="user-check-icon" />}
              </div>
            )}
          </div>
        ))}

        {/* â”€â”€ CURRENT ACTIVE QUESTION STEP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        
        {/* STEP 3: BUSINESS UPLOAD / INFORMATION (MINIMAL WHITE THEME) */}
        {stepIndex === 3 && (
          <div className="white-onboarding-container">
            {/* ADDI Intro Section */}
            <div className="addi-intro-section active-addi-section">
              <div className="active-mascot-wrapper">
                <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} />
              </div>
              
              {/* WHATSAPP-STYLE ADDI SPEECH BOX WITH THIN PURPLE-PINK GRADIENT BORDER */}
              <div className="whatsapp-addi-bubble active-addi-bubble">
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <div className="addi-title-text">
                  Hi, I'm ADDI.
                </div>
                <p className="addi-desc-text">
                  Tell me about your business and I'll help build your profile.
                </p>
              </div>
            </div>

            {/* Section Heading */}
            <h2 className="onboarding-subheading">
              What would you like to share?
            </h2>

            {/* 2-Option Accordion Cards & Analysis Control */}
            <BusinessUploadWidget 
              onAnalysisComplete={handleBusinessAnalysisDone} 
              activeTab={businessUploadTab}
              onTabChange={setBusinessUploadTab}
            />
          </div>
        )}

        {/* STEP 4: COMPLETED ADDI CONVERSATION & ANALYSIS (EXACT REFERENCE WHATSAPP STYLE) */}
        {stepIndex === 4 && (
          <div className="white-onboarding-container">
            {/* 1. FIRST ADDI MESSAGE (NO MASCOT) */}
            <div className="completed-addi-row" style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '14px' }}>
              <div className="whatsapp-addi-bubble" style={{ maxWidth: '440px' }}>
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 800, color: '#111111', lineHeight: '1.4', marginBottom: '4px' }}>
                  Hi, I'm ADDI.
                </div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 500, color: '#4B5563', lineHeight: '1.45', margin: 0 }}>
                  Tell me about your business and I'll help build your profile.
                </p>
              </div>
            </div>

            {/* 2. USER RESPONSE MESSAGE (ON THE RIGHT - NO MASCOT) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '14px' }}>
              <div 
                className="whatsapp-user-bubble"
                onClick={() => setStepIndex(3)}
                style={{ cursor: 'pointer', margin: 0 }}
                title="Click to edit"
              >
                <User size={14} className="user-bubble-icon" />
                <span>Business details uploaded</span>
                <Edit2 size={12} className="user-check-icon" style={{ opacity: 0.7 }} />
              </div>
            </div>

            {/* 3. SECOND ADDI MESSAGE / RESULT (WITH MASCOT RESTORED) */}
            <div className="duolingo-mascot-row" style={{ marginBottom: '16px' }}>
              <style>{`
                @keyframes slideInRightOneShot {
                  0% { transform: translateX(30px); opacity: 0; }
                  100% { transform: translateX(0); opacity: 1; }
                }
              `}</style>
              <MascotLottiePlayer stepKey="business-summary-mascot" width={160} height={160} path="/lottiefile/intro-ilkokul (1).json" stopAfterSeconds={8} />
              
              <div className="whatsapp-addi-bubble fade-in" style={{ maxWidth: '460px', width: '100%', animation: 'slideInRightOneShot 0.5s ease-out 2s both', margin: 0 }}>
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 800, color: '#111111', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                  Here's what I understood about your business:
                </div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12.5px', color: '#6B7280', margin: '0 0 12px 0', fontWeight: 500 }}>
                  Review your business brain profile below.
                </p>

                {/* Business Details (Clean Key-Value Rows) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', marginBottom: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6B7280', fontWeight: 600 }}>Business Name</span>
                    <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.businessName || state.businessName || 'Business'}</strong>
                  </div>
                  {(prof.website || prof.url || state.website) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6B7280', fontWeight: 600 }}>Website</span>
                      <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.website || prof.url || state.website}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6B7280', fontWeight: 600 }}>Industry</span>
                    <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.industry || 'Technology'}</strong>
                  </div>
                  {prof.segment && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6B7280', fontWeight: 600 }}>Segment</span>
                      <strong style={{ color: '#111111', fontWeight: 700 }}>{prof.segment}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#6B7280', fontWeight: 600, flexShrink: 0 }}>Summary</span>
                    <strong style={{ color: '#111111', fontWeight: 700, textAlign: 'right', paddingLeft: '16px' }}>
                      {prof.businessDescription || prof.summary || ''}
                    </strong>
                  </div>
                </div>

                {/* Small subtle Edit link */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 0',
                      textDecoration: 'underline'
                    }}
                    onClick={() => setStepIndex(3)}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>
            </div>

            {/* 4. BOTTOM ANALYSIS ACTION (Left text: Analysis, Right button: Round Go button) */}
            <div className="analysis-action-bar" style={{ marginTop: '16px' }}>
              <span className="analysis-action-text">Analysis</span>
              <button
                type="button"
                className="analysis-go-circle-btn"
                onClick={() => {
                  if (!prof.businessName) {
                    updateState({
                      businessProfile: {
                        ...prof,
                        businessName: prof.businessName || state.businessName || 'My Business',
                        industry: prof.industry || 'Commercial & Creative Services'
                      }
                    });
                  }
                  handleSelectOption('confirm_profile', 'Profile Confirmed', handleConfirmProfile);
                }}
                title="Continue"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: BRANCHING CHOICE (3 OPTIONS) */}
        {stepIndex === 5 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">Do you know what you need?</h1>
                <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '8px', textAlign: 'center' }}>
                  Tell ADDI what you need â€” even if you're not sure yet.
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
              <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble">
                <div className="conversational-sender-tag">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 className="duolingo-question-heading">What's your goal?</h1>
              </DuolingoSpeechBubble>
            </div>

            <div className="goal-options-grid">
              {['Launch', 'Grow', 'Rebrand', 'Product Launch', 'More Customers', 'Other'].map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <div key={opt} className={`chat-stagger-${Math.min(idx + 1, 3)}`}>
                    <button
                      type="button"
                      className={`goal-option-card ${isSelected ? 'option-selected' : ''}`}
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
                  </div>
                );
              })}
            </div>
            
            {selectedOption === 'Other' && (
              <div className="chat-stagger-3" style={{ width: '100%', position: 'relative', zIndex: 10, display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'flex-end' }}>
                <textarea
                  className="other-goal-textarea"
                  placeholder="Type your goal..."
                  value={otherGoalInput}
                  onChange={e => {
                    setOtherGoalInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && otherGoalInput.trim()) {
                      e.preventDefault();
                      handleFlowBAnswer('goal', otherGoalInput.trim());
                    }
                  }}
                  autoFocus
                  rows={1}
                />
                <button
                  type="button"
                  className="other-goal-send-btn"
                  disabled={!otherGoalInput.trim()}
                  onClick={() => handleFlowBAnswer('goal', otherGoalInput.trim())}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}

        {stepIndex === 6 && branchChoice === 'figuring_out' && flowBQIdx === 1 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} />
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

        {/* STEP 6: FLOW A (I Know What I Need) WITH 6 PREMIUM IMAGE SERVICE CARDS & CIRCULAR GO ACTION */}
        {stepIndex === 6 && branchChoice === 'know_need' && flowAQIdx === 0 && (
          <div className="white-onboarding-container" style={{ maxWidth: '680px' }}>
            {/* 1. ADDI INTRODUCTION MESSAGE (WhatsApp Bubble with small mascot) */}
            <div className="addi-intro-section" style={{ alignItems: 'flex-start', marginBottom: '14px' }}>
              <div className="addi-mascot-wrapper" style={{ marginTop: '2px' }}>
                <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} />
              </div>
              
              <div className="whatsapp-addi-bubble" style={{ flex: 1, maxWidth: '100%' }}>
                <div className="addi-badge-name">
                  <span className="online-dot"></span> ADDI
                </div>
                <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 800, color: '#111111', margin: '0 0 4px 0', lineHeight: 1.35 }}>
                  What deliverables do you need?
                </h1>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 500, color: '#4B5563', lineHeight: '1.4', margin: 0 }}>
                  Select all the services you need for this project.
                </p>
              </div>
            </div>

            {/* 2. BUSINESS DETAILS UPLOADED STATUS PILL (ALIGNED TO RIGHT) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '14px' }}>
              <div 
                className="whatsapp-user-bubble"
                onClick={() => setStepIndex(3)}
                style={{ cursor: 'pointer', margin: 0 }}
                title="Click to edit business details"
              >
                <User size={14} className="user-bubble-icon" />
                <span>Business details uploaded</span>
                <Edit2 size={12} className="user-check-icon" style={{ opacity: 0.7 }} />
              </div>
            </div>

            {/* 3. 6 SERVICE CARDS (RESPONSIVE 2-COLUMN GRID) */}
            <div className="services-2col-grid">
              {[
                {
                  id: 'video_production',
                  title: 'Video Production',
                  explanation: 'Commercials, social media reels, and corporate videos.',
                  image: '/images/services/video_production.jpg'
                },
                {
                  id: 'photography',
                  title: 'Photography',
                  explanation: 'Product photography, brand visuals, and team portraits.',
                  image: '/images/services/photography.jpg'
                },
                {
                  id: 'branding_logo',
                  title: 'Branding & Logo',
                  explanation: 'Logos, visual identity, and brand guidelines.',
                  image: '/images/services/branding_logo.jpg'
                },
                {
                  id: 'social_media_management',
                  title: 'Social Media Management',
                  explanation: 'Content planning, social posts, and profile growth.',
                  image: '/images/services/social_media.jpg'
                },
                {
                  id: 'marketing_strategy',
                  title: 'Marketing Strategy',
                  explanation: 'Business growth planning, SEO, and campaigns.',
                  image: '/images/services/marketing_strategy.jpg'
                },
                {
                  id: 'video_photo_editing',
                  title: 'Video & Photo Editing',
                  explanation: 'Reels, videos, and professional photo editing.',
                  image: '/images/services/video_photo_editing.jpg'
                }
              ].map(opt => {
                const srv = opt.title;
                const isSelected = localSelectedServices.includes(srv);
                return (
                  <div
                    key={opt.id}
                    className={`service-selection-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        setLocalSelectedServices(prev => prev.filter(s => s !== srv));
                      } else {
                        setLocalSelectedServices(prev => [...prev, srv]);
                      }
                    }}
                  >
                    {/* Thumbnail Image */}
                    <div className="service-card-thumbnail-wrapper">
                      <img 
                        src={opt.image} 
                        alt={opt.title} 
                        className="service-card-thumbnail-img" 
                        loading="lazy"
                      />
                    </div>

                    {/* Content info */}
                    <div className="service-card-content">
                      <h3 className="service-card-title">{opt.title}</h3>
                      <p className="service-card-desc">{opt.explanation}</p>
                    </div>

                    {/* Checkbox (Top-Right) */}
                    <div className={`service-card-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5L4.5 8.5L11 1.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. BOTTOM ANALYSIS ACTION (Left text: Analysis, Right button: Circular Go button) */}
            <div className="analysis-action-bar" style={{ marginTop: '20px' }}>
              <span className="analysis-action-text">Analysis</span>
              <button 
                type="button"
                className="analysis-go-circle-btn" 
                disabled={localSelectedServices.length === 0}
                onClick={handleMultiSelectFlowA}
                title="Continue to Analysis"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: PHASE 3 - STRUCTURED ADDI RECOMMENDATION PAGE */}
        {stepIndex === 7 && (
          <div className="duolingo-step-card active-step-card" style={{ paddingBottom: '80px' }}>
            <div className="duolingo-mascot-row">
              <style>{`
                @keyframes slideInRightOneShotStep7 {
                  0% { transform: translateX(30px); opacity: 0; }
                  100% { transform: translateX(0); opacity: 1; }
                }
              `}</style>
              <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} path="/lottiefile/intro-ilkokul (1).json" stopAfterSeconds={8} />
              <DuolingoSpeechBubble key={currentStepKey} className="chat-message-bubble" style={{ animation: 'slideInRightOneShotStep7 0.5s ease-out 1s both' }}>
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
              <div className="chat-stagger-1 fade-in margin-top-20" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%' }}>
                
                {/* C. SELECTED SERVICES RESULTS PRESENTATION */}
                <div style={{ background: '#FFFFFF', padding: '0', margin: '20px 0', width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
                  <style>{`
                    .services-horizontal-carousel::-webkit-scrollbar {
                      display: none;
                    }
                    @keyframes badgeSparkle {
                      0% { transform: translateX(-150%) skewX(-15deg); opacity: 0; }
                      20% { opacity: 0.6; }
                      80% { opacity: 0.6; }
                      100% { transform: translateX(250%) skewX(-15deg); opacity: 0; }
                    }
                    .recommended-badge {
                      position: absolute;
                      top: 16px;
                      right: 16px;
                      background: linear-gradient(135deg, #9b51e0, #ff007f);
                      color: #FFF;
                      padding: 6px 12px;
                      border-radius: 20px;
                      font-size: 10px;
                      font-weight: 700;
                      letter-spacing: 0.5px;
                      z-index: 1;
                      box-shadow: 0 2px 10px rgba(255, 0, 127, 0.4);
                      overflow: hidden;
                    }
                    .recommended-badge::after {
                      content: '';
                      position: absolute;
                      top: 0; left: 0; width: 40%; height: 100%;
                      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
                      animation: badgeSparkle 3s infinite ease-in-out;
                      pointer-events: none;
                    }
                  `}</style>

                  {/* Header & View All */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 16px', width: '100%', boxSizing: 'border-box' }}>
                    <h4 style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ADDI RECOMMENDS
                    </h4>
                    <button 
                      type="button"
                      onClick={() => setShowViewAll(true)}
                      style={{ 
                        background: 'transparent', 
                        border: '1px solid #CCCCCC', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        color: '#111111', 
                        cursor: 'pointer',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      View All
                    </button>
                  </div>

                  <div 
                    className="services-horizontal-carousel"
                    style={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      gap: '12px',
                      overflowX: 'auto',
                      scrollSnapType: 'x mandatory',
                      padding: '0 9vw 20px 9vw',
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none', 
                      WebkitOverflowScrolling: 'touch',
                      width: '100%',
                      boxSizing: 'border-box'
                  }}>
                    {(() => {
                      const userSelected = state.selectedServices || finalScope || [];
                      const displayItems = userSelected.length > 0 ? userSelected : (state.fullRecommendationData?.recommendations || state.aiRecommendations || []).map(r => r.serviceName || r.title);
                      const validItems = displayItems.filter(Boolean);

                      if (validItems.length === 0) return null;

                      const carouselItems = validItems.flatMap(title => {
                        if (title === 'Video Production' || title === 'Photography' || title === 'Video & Photo Editing') {
                          return [
                            { title, video: '/videos/video1.mp4', amount: '₹15,000', includes: ['Influencer / Model', 'Camera', 'Script Writer', 'Video Editor'] },
                            { title, video: '/videos/video2.mp4', amount: '₹25,000', includes: ['Pro Camera Gear', 'Studio Lighting', 'Creative Director', 'Advanced Editing'] },
                            { title, video: '/videos/video3.mp4', amount: '₹10,000', includes: ['Basic Setup', 'Standard Lighting', 'Raw Footage', 'Minimal Edit'] }
                          ];
                        }
                        return [{ title, video: '/videos/video1.mp4', amount: '₹15,000', includes: ['Standard Delivery', 'Expert Review', 'Quality Check'] }];
                      });

                      return carouselItems.map((item, idx) => {
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              flex: '0 0 auto',
                              width: '72vw', 
                              maxWidth: '260px', 
                              scrollSnapAlign: 'center',
                              position: 'relative',
                              borderRadius: '24px',
                              overflow: 'hidden',
                              backgroundColor: '#F8F9FA',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.06)'
                            }}
                          >
                            <div style={{ width: '100%', paddingTop: '110%', position: 'relative' }}>
                              <video 
                                src={item.video}
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  zIndex: 0,
                                  pointerEvents: 'none' /* Prevents video from intercepting swipe */
                                }}
                              />
                              {/* Click overlay to handle fullscreen video while letting swipes pass through */}
                              <div 
                                onClick={() => setFullscreenVideo(item.video)}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  zIndex: 1,
                                  cursor: 'pointer',
                                  touchAction: 'pan-x pan-y'
                                }}
                              />
                              
                              {/* Recommended Badge */}
                              <div className="recommended-badge">
                                RECOMMENDED
                              </div>

                              {/* Play Button */}
                              <button
                                type="button"
                                onClick={() => setFullscreenVideo(item.video)}
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '50%',
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  border: 'none',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                  zIndex: 1,
                                  paddingLeft: '3px'
                                }}
                              >
                                <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M1.5 1.5L12.5 8L1.5 14.5V1.5Z" fill="#111111" stroke="#111111" strokeWidth="2" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                            
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '100%',
                              background: '#FFFFFF',
                              borderBottomLeftRadius: '24px',
                              borderBottomRightRadius: '24px',
                              padding: '16px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
                            }}>
                              {/* Left side: Includes */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '55%' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Includes</span>
                                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: '#666', lineHeight: '1.4', listStyleType: 'disc' }}>
                                  {item.includes.map((inc, i) => <li key={i} style={{ paddingBottom: '2px' }}>{inc}</li>)}
                                </ul>
                              </div>
                              
                              {/* Right side: Title & Price */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', maxWidth: '45%' }}>
                                <h3 style={{ 
                                  margin: 0, 
                                  fontSize: '14px', 
                                  fontWeight: '800', 
                                  color: '#111111',
                                  fontFamily: 'Manrope, sans-serif',
                                  textAlign: 'right',
                                  lineHeight: '1.2'
                                }}>
                                  {item.title}
                                </h3>
                                <span style={{ 
                                  fontSize: '15px', 
                                  fontWeight: '800', 
                                  color: '#00D1FF'
                                }}>
                                  {item.amount}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
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
                      Estimated range â€” final quote after expert review
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
                          <span>ðŸ’¬ Custom Request: "<strong>{note}</strong>"</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: '#58CC02', fontWeight: '700', background: 'rgba(88,204,2,0.15)', padding: '2px 8px', borderRadius: '4px' }}>ADDED TO SCOPE</span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: '#FF4B4B', cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: 0 }}
                              onClick={() => handleRemoveCustomRequest(note)}
                            >
                              âœ• Remove
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
                      <span className="option-title-text">â˜…â˜…â˜…â˜…â˜… {item.title}</span>
                      <span className="option-sub-text">{item.reasoning}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 8: SCHEDULING (INDEPENDENT PER-SERVICE DATE REQUESTS â€” NO TIME PICKER) */}
        {stepIndex === 8 && (
          <div className="duolingo-step-card active-step-card">
            <div className="duolingo-mascot-row">
              <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} />
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
                â„¹ï¸ <em>These are your preferred dates. ADDUS will review your request and confirm the final schedule after your project is accepted.</em>
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
              <MascotLottiePlayer stepKey={currentStepKey} width={160} height={160} />
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

              {/* ASSET CONFIRMATIONS & UPLOADS REMOVED FROM STEP 9 â€” ACCESSIBLE IN USER PROFILE SECTION */}

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
                <div className="profile-row"><span className="profile-label">Estimated Budget:</span><span className="profile-val" style={{ color: '#00D1FF' }}>Estimated range â€” final quote after expert review</span></div>
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
      
      {/* â”€â”€ LEGAL PREVIEW MODAL OVERLAY â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
      
      {/* Fullscreen Video Player */}
      {fullscreenVideo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <button 
            onClick={() => setFullscreenVideo(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', color: '#FFF', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
          <video 
            src={fullscreenVideo}
            controls
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* View All Recommendations Route/Page Overlay */}
      {showViewAll && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#F8F9FA', zIndex: 99998, overflowY: 'auto', padding: '24px 16px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <button 
              onClick={() => setShowViewAll(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '24px', color: '#111' }}
            >
              <ChevronLeft size={20} /> Back to Onboarding
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '32px', color: '#111' }}>All Recommended Services</h1>
            
            <style>{`
              .view-all-grid {
                display: grid;
                grid-template-columns: 1fr; /* Mobile: 1 column */
                gap: 24px;
                padding-bottom: 60px;
                max-width: 100%;
              }
              @media (min-width: 768px) {
                .view-all-grid {
                  grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns exactly */
                }
              }
            `}</style>

            <div className="view-all-grid">
              {[
                { title: 'Video Production', video: '/videos/video1.mp4', amount: '₹15,000', includes: ['Influencer / Model', 'Camera', 'Script Writer', 'Video Editor'] },
                { title: 'Photography', video: '/videos/video2.mp4', amount: '₹25,000', includes: ['Pro Camera Gear', 'Studio Lighting', 'Creative Director', 'Advanced Editing'] },
                { title: 'Video & Photo Editing', video: '/videos/video3.mp4', amount: '₹10,000', includes: ['Basic Setup', 'Standard Lighting', 'Raw Footage', 'Minimal Edit'] },
                { title: 'Social Media Management', video: '/videos/video1.mp4', amount: '₹15,000', includes: ['Content Calendar', 'Daily Posting', 'Community Management'] }
              ].map((item, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#FFF', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: '100%', paddingTop: '140%', position: 'relative' }}>
                    <video src={item.video} autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setFullscreenVideo(item.video)} style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.9)', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', paddingLeft: '3px' }}>
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L12.5 8L1.5 14.5V1.5Z" fill="#111111" stroke="#111111" strokeWidth="2" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: '#FFFFFF', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '60%' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Includes</span>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#666', lineHeight: '1.4', listStyleType: 'disc' }}>{item.includes.map((inc, i) => <li key={i} style={{ paddingBottom: '2px' }}>{inc}</li>)}</ul>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', maxWidth: '40%' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111111', textAlign: 'right', lineHeight: '1.2' }}>{item.title}</h3>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#00D1FF' }}>{item.amount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
      </div>
    </div>
  );
}

export default ConversationalOnboarding;

