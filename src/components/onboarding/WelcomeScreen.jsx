import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation.js';
import { Button } from '../common/Button.jsx';

/**
 * Step 2: Welcome Screen Component
 * - ADDI Introduction message with character typing animation
 * - Primary CTA button ("Let's Get Started") appears after typing animation completes
 * - Navigates to 'phone' via useNavigation router or onNext prop
 */
export function WelcomeScreen({ onNext = null }) {
  const { navigateTo } = useNavigation();

  const fullMessage = "Hi 👋\n\nI'm ADDI.\n\nI'll understand your business and help you build everything needed for a professional presence people trust.";
  
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingFinished, setIsTypingFinished] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullMessage.length) {
        setDisplayedText(fullMessage.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTypingFinished(true);
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [fullMessage]);

  const handleStart = () => {
    if (typeof onNext === 'function') {
      onNext();
    } else {
      navigateTo('phone');
    }
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="addi-avatar-badge">
        <Sparkles className="sparkle-icon" size={28} />
      </div>

      <div className="welcome-chat-box">
        <div className="addi-typewriter-text">
          {displayedText.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="welcome-paragraph">
              {paragraph}
            </p>
          ))}
          {!isTypingFinished && <span className="typing-cursor">|</span>}
        </div>
      </div>

      {isTypingFinished && (
        <div className="cta-container fade-in margin-top-20">
          <Button onClick={handleStart} icon={ArrowRight}>
            Let's Get Started
          </Button>
        </div>
      )}
    </div>
  );
}
