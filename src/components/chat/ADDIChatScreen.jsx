import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Paperclip, Mic, Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { aiService } from '../../services/aiService.js';
import { sessionManager } from '../../services/sessionManager.js';
import { TypingIndicator } from './TypingIndicator.jsx';

/**
 * ADDI Chat Screen Component
 * Full-featured conversational AI chat interface with streaming, history, timestamps, and input bar.
 */
export function ADDIChatScreen({ onBack = null, context = {} }) {
  const { businessName, industry, productName, projectService, projectStatus } = context;
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hello 👋 I'm ADDI. ${businessName ? `I know your business as ${businessName}. How can I help you build your professional presence today?` : "How can I help you build your professional presence today?"}`,
      timestamp: formatTime(new Date())
    }
  ]);

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachment, setAttachment] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const userText = input.trim();
    if (!userText || isGenerating) return;

    const userTime = formatTime(new Date());
    const userMsgObj = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: userTime,
      attachment: attachment ? attachment.name : null
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setInput('');
    setAttachment(null);
    setIsGenerating(true);

    const assistantId = Date.now() + 1;
    const assistantTime = formatTime(new Date());

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: assistantTime
      }
    ]);

    let accumulatedText = '';

    const contextLines = [];
    if (businessName) contextLines.push(`Business: ${businessName}`);
    if (industry) contextLines.push(`Industry: ${industry}`);
    if (productName) contextLines.push(`Product: ${productName}`);
    if (projectService) contextLines.push(`Project: ${projectService} (${projectStatus || 'Submitted'})`);
    const contextHeader = contextLines.length > 0 ? contextLines.join('. ') + '.' : '';

    await aiService.chatStream({
      message: contextHeader ? `${contextHeader}\nUser: ${userText}` : userText,
      userId: sessionManager.getSession()?.userId || null,
      onChunk: (token) => {
        accumulatedText += token;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: accumulatedText } : msg
          )
        );
      },
      onDone: () => {
        setIsGenerating(false);
      },
      onError: (err) => {
        setIsGenerating(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: 'ADDI is temporarily unavailable. Please try again.' }
              : msg
          )
        );
      }
    });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachment(file);
  };

  const handleMicClick = () => {
    alert('Voice input is coming in a future release.');
  };

  return (
    <div className="addi-chat-screen-viewport fade-in">
      {/* --- CHAT HEADER --- */}
      <header className="chat-header-bar flex-between">
        <div className="header-left flex-center">
          {onBack && (
            <button className="icon-btn-ghost" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="addi-avatar-small flex-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="chat-header-title">ADDI</h3>
            <span className="chat-status-sub">Online</span>
          </div>
        </div>

        <button className="icon-btn-ghost">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* --- MESSAGES THREAD --- */}
      <div className="chat-messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble-wrapper ${msg.role === 'user' ? 'user-bubble-align' : 'assistant-bubble-align'}`}
          >
            {msg.role === 'assistant' && (
              <div className="addi-bubble-avatar">
                <Sparkles size={14} />
              </div>
            )}

            <div className={`chat-bubble-content ${msg.role === 'user' ? 'user-bubble-style' : 'assistant-bubble-style'}`}>
              {msg.attachment && (
                <div className="attachment-chip flex-center">
                  <Paperclip size={12} />
                  <span>{msg.attachment}</span>
                </div>
              )}

              <p className="bubble-text-plain">{msg.content}</p>

              <span className="bubble-timestamp">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="chat-bubble-wrapper assistant-bubble-align">
            <TypingIndicator label="ADDI is responding..." />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* --- BOTTOM INPUT BAR --- */}
      <footer className="chat-bottom-input-bar">
        {attachment && (
          <div className="attached-preview-banner flex-between">
            <span className="preview-text">Attached: {attachment.name}</span>
            <button className="remove-attach-btn" onClick={() => setAttachment(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSend} className="chat-input-form flex-center">
          {/* Attachment Button */}
          <button
            type="button"
            className="input-tool-btn"
            onClick={handleAttachmentClick}
            title="Attach File"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Microphone Placeholder Button */}
          <button
            type="button"
            className="input-tool-btn"
            onClick={handleMicClick}
            title="Voice Input (Coming Soon)"
          >
            <Mic size={18} />
          </button>

          {/* Main Text Area */}
          <input
            type="text"
            className="chat-main-input"
            placeholder="Ask ADDI anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
          />

          {/* Send Button */}
          <button
            type="submit"
            className="chat-submit-btn flex-center"
            disabled={!input.trim() || isGenerating}
          >
            <Send size={16} />
          </button>
        </form>
      </footer>
    </div>
  );
}
