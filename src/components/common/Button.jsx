import React from 'react';

/**
 * Reusable Button Component
 * Supports variants: 'primary' | 'secondary' | 'outline' | 'ghost'
 */
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  className = '',
  icon: Icon
}) {
  const baseClass = `btn-${variant}`;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`primary-btn ${baseClass} ${widthClass} ${disabled ? 'btn-disabled' : 'pulse-glow'} ${className}`}
    >
      {loading ? (
        <span>Loading...</span>
      ) : (
        <>
          {children}
          {Icon && <Icon size={18} />}
        </>
      )}
    </button>
  );
}
