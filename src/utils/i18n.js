import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en.js';
import { ml } from '../locales/ml.js';
import { storage } from './storage.js';

const LanguageContext = createContext(null);

const translations = { en, ml };

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      // Check localStorage first
      const saved = storage.get('APP_LANGUAGE', 'en');
      return saved === 'ml' ? 'ml' : 'en';
    } catch {
      return 'en';
    }
  });

  const changeLanguage = (lang) => {
    const newLang = lang === 'ml' ? 'ml' : 'en';
    setLanguage(newLang);
    try {
      storage.set('APP_LANGUAGE', newLang);
      
      // Sync with user profile state if session is active
      const session = storage.get('ACTIVE_AUTH_SESSION', null);
      if (session?.userId) {
        const stateKey = `ONBOARDING_STATE_${session.userId}`;
        const userState = storage.get(stateKey, null);
        if (userState) {
          userState.appLanguage = newLang;
          storage.set(stateKey, userState);
        }
      }
    } catch (e) {
      console.error('Failed to save language choice:', e);
    }
  };

  // Helper function to translate a key
  const t = (key, variables = {}) => {
    // Attempt translation in selected language
    let text = translations[language]?.[key];
    
    // Fallback to English if Malayalam translation is missing
    if (text === undefined && language === 'ml') {
      text = translations['en']?.[key];
    }
    
    if (text === undefined) {
      return key; // Return the key itself as a final fallback
    }

    // Replace variables (e.g., {name} -> "John")
    let result = text;
    Object.entries(variables).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v);
    });
    
    return result;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, changeLanguage, t } },
    children
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
