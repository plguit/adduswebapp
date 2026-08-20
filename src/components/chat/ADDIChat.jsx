import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator.jsx';

/**
 * Reusable ADDI Chat Container Component
 * Interfaces with AI Service for conversational interactions.
 */
export function ADDIChat({
  messages = [],
  onSendMessage,
  isGenerating = false,
  placeholder = 'Describe your business or ask ADDI...'
}) {
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    if (typeof onSendMessage === 'function') {
      onSendMessage(input.trim());
    }
    setInput('');
  };

  return (
    <div className="addi-chat-widget">
      <div className="chat-thread-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
            {msg.role === 'assistant' && (
              <div className="avatar-small">
                <Sparkles size={14} />
              </div>
            )}
            <div className="bubble-text">{msg.content}</div>
          </div>
        ))}

        {isGenerating && <TypingIndicator />}
      </div>

      <form onSubmit={handleSend} className="chat-input-bar">
        <input
          type="text"
          className="chat-input-field"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isGenerating}
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim() || isGenerating}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
