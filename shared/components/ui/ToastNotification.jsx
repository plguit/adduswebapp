import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

export function ToastNotification({ message, type = 'success', duration = 4000, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (!message) return;
    requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => {
      setHiding(true);
      setTimeout(() => {
        setVisible(false);
        setHiding(false);
        if (onDismiss) onDismiss();
      }, 300);
    }, duration);
    return () => clearTimeout(hideTimer);
  }, [message, duration]);

  if (!message || !visible) return null;

  return (
    <div className={`toast-notification ${type === 'success' ? 'toast-success' : 'toast-error'} ${hiding ? 'toast-hiding' : ''}`}>
      <CheckCircle size={16} className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => { setHiding(true); setTimeout(onDismiss, 300); }}>
        <X size={14} />
      </button>
    </div>
  );
}
