import React, { useRef, useEffect } from 'react';
import lottie from 'lottie-web';

export function MascotLottiePlayer({ stepKey, path = '/lottiefile/mascot_on_chair.json', animationData, loop = true, width, height, className = '', stopAfterSeconds }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId;

    try {
      if (animRef.current) {
        animRef.current.destroy();
      }
      const lottiePlayer = window.lottie || lottie;
      if (lottiePlayer) {
        const animConfig = {
          container: containerRef.current,
          renderer: 'svg',
          loop: loop,
          autoplay: true
        };
        if (animationData) {
          animConfig.animationData = animationData;
        } else {
          animConfig.path = path;
        }
        animRef.current = lottiePlayer.loadAnimation(animConfig);
      }
      
      if (stopAfterSeconds) {
        timeoutId = setTimeout(() => {
          if (animRef.current) {
            try {
              animRef.current.pause();
            } catch (err) {
              // Ignore lottie internal audio pause errors
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
  }, [stepKey, path, animationData, loop, stopAfterSeconds]);

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

export default MascotLottiePlayer;
