import React from 'react';

/**
 * Reusable Input Component
 * Supports text, tel, url, textarea inputs with prefix badges and error states.
 */
export function Input({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onKeyDown,
  onPaste,
  prefix = null,
  error = '',
  autoFocus = false,
  maxLength = undefined,
  multiline = false,
  rows = 4,
  className = ''
}) {
  if (multiline) {
    return (
      <div className="input-field-wrapper">
        <textarea
          className={`explain-textarea ${error ? 'input-error' : ''} ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          autoFocus={autoFocus}
          rows={rows}
        />
        {error && <span className="field-error-text">{error}</span>}
      </div>
    );
  }

  return (
    <div className="input-field-wrapper">
      <div className={`input-group ${error ? 'input-error' : ''}`}>
        {prefix && <span className="country-code">{prefix}</span>}
        <input
          type={type}
          className={`phone-input ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          autoFocus={autoFocus}
          maxLength={maxLength}
        />
      </div>
      {error && <span className="field-error-text">{error}</span>}
    </div>
  );
}
