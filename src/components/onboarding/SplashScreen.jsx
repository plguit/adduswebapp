import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import mascotBirdLottieData from '../../../lottiefile/mascot_with_bird.json';

export function SplashScreen({ autoNavigateDelay = 3400, onComplete = null }) {
  const mascotRef = useRef(null);
  const animRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!mascotRef.current) return;

    if (animRef.current) {
      animRef.current.destroy();
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: mascotRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        animationData: mascotBirdLottieData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true
        }
      });

      animRef.current.addEventListener('complete', () => {
        if (animRef.current) {
          animRef.current.pause();
        }
      });
    } catch (err) {
      console.warn('Splash Lottie load error:', err);
    }

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem('HAS_SEEN_SPLASH', 'true');
      } catch (e) {}
      if (typeof onCompleteRef.current === 'function') {
        onCompleteRef.current();
      }
    }, autoNavigateDelay);

    return () => {
      clearTimeout(timer);
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, [autoNavigateDelay, onComplete]);

  return (
    <div 
      className="splash-screen-viewport cinematic-splash-viewport fade-in" 
      style={{ 
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#FFFFFF', 
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '50px 24px 40px',
        boxSizing: 'border-box'
      }}
    >
      <div className="splash-branding-container">
        <h1 className="splash-main-title">ADDUS</h1>
        <h2 className="splash-caption-text">Build a professional presence people trust.</h2>
      </div>

      <div className="splash-mascot-grounded-wrap">
        <div ref={mascotRef} className="splash-mascot-lottie" />
      </div>

      <div className="splash-three-dots-loader">
        <span className="splash-dot dot-1" />
        <span className="splash-dot dot-2" />
        <span className="splash-dot dot-3" />
      </div>
    </div>
  );
}

export default SplashScreen;
