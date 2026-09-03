import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Paperclip, Mic, Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { aiService } from '../../services/aiService.js';
import { sessionManager } from '../../services/sessionManager.js';
import { profileService } from '../../../shared/services/profileService.js';
import { updateProjectInStore } from '../../../shared/hooks/useProjectStore.js';
import { TypingIndicator } from './TypingIndicator.jsx';

/**
 * ADDI Chat Screen Component
 * Full-featured conversational AI chat interface with streaming, history, timestamps, counter-proposals, and input bar.
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

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const loadChatFromProfile = () => {
    try {
      const session = sessionManager.getSession();
      const uid = session?.userId || 'customer_7907963442';

      const prof = profileService.getProfileById(uid) || 
        (profileService.getAllProfiles() || []).find(p => p.userId === uid || p.customerId === uid);

      const historyMsgs = [];
      if (prof && prof.chatHistory && prof.chatHistory.length > 0) {
        prof.chatHistory.forEach((c, idx) => {
          historyMsgs.push({
            id: c.id || `msg_${idx}`,
            role: c.sender === 'user' || c.role === 'user' ? 'user' : 'assistant',
            content: c.text || c.content || '',
            timestamp: c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : formatTime(new Date()),
            counterProposal: c.counterProposal || null
          });
        });
      }

      // Check for global or project-specific proposal override in localStorage
      try {
        const rawProp = localStorage.getItem('ADDUS_LATEST_PROPOSAL_GLOBAL');
        if (rawProp) {
          const propMsg = JSON.parse(rawProp);
          if (propMsg && propMsg.id && !historyMsgs.some(m => m.id === propMsg.id)) {
            historyMsgs.push({
              id: propMsg.id,
              role: 'assistant',
              content: propMsg.text || '📋 ADDUS Admin Counter-Proposal',
              timestamp: formatTime(new Date()),
              counterProposal: propMsg.counterProposal
            });
          }
        }
      } catch {}

      if (historyMsgs.length > 0) {
        setMessages(historyMsgs);
      }

      // Automatically mark incoming Admin messages as seen by customer
      if (prof && prof.chatHistory && prof.chatHistory.some(c => (c.sender === 'admin' || c.role === 'admin') && !c.read)) {
        const updatedHistory = prof.chatHistory.map(c => {
          if ((c.sender === 'admin' || c.role === 'admin') && !c.read) {
            return { ...c, read: true, readAt: new Date().toISOString() };
          }
          return c;
        });
        profileService.saveProfile({ ...prof, chatHistory: updatedHistory });
        window.dispatchEvent(new CustomEvent('addus_approvals_updated'));
      }
    } catch (e) {
      console.warn('[ADDIChatScreen] Load chat error:', e);
    }
  };

  useEffect(() => {
    loadChatFromProfile();
    const handleChatUpdate = () => loadChatFromProfile();
    window.addEventListener('addus_chat_updated', handleChatUpdate);
    window.addEventListener('addus_profile_updated', handleChatUpdate);
    return () => {
      window.removeEventListener('addus_chat_updated', handleChatUpdate);
      window.removeEventListener('addus_profile_updated', handleChatUpdate);
    };
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleAcceptProposal = (proposal) => {
    try {
      const session = sessionManager.getSession();
      const uid = session?.userId || 'customer_7907963442';

      // 1. Update Project in projectStore
      if (proposal.projectId) {
        updateProjectInStore(proposal.projectId, {
          shootDate: proposal.proposedShootDate,
          budget: proposal.proposedBudget ? `₹${Number(proposal.proposedBudget).toLocaleString('en-IN')}` : '₹15,000',
          status: 'Approved',
          lifecycleStage: 'Approved'
        }, { actor: 'Customer', role: 'Customer' });
      }

      // 2. Update Chat History & Proposal status in profile
      const prof = profileService.getProfileById(uid) || {};
      const updatedChat = (prof.chatHistory || []).map(c => {
        if (c.counterProposal && c.counterProposal.reqId === proposal.reqId) {
          return { ...c, counterProposal: { ...c.counterProposal, status: 'accepted' } };
        }
        return c;
      });

      updatedChat.push({
        id: `msg_cust_${Date.now()}`,
        sender: 'user',
        role: 'user',
        text: '✓ I accepted the proposed date and budget changes. Let us proceed!',
        timestamp: new Date().toISOString()
      });

      updatedChat.push({
        id: `msg_addi_${Date.now()}`,
        sender: 'admin',
        role: 'admin',
        text: '🎉 Awesome! Proposal confirmed. Your project status is now LIVE in Strategy Preparation!',
        timestamp: new Date().toISOString()
      });

      profileService.saveProfile({
        ...prof,
        chatHistory: updatedChat
      });

      // 3. Broadcast events
      window.dispatchEvent(new CustomEvent('addus_chat_updated'));
      window.dispatchEvent(new CustomEvent('addus_profile_updated'));
      window.dispatchEvent(new CustomEvent('addus_approvals_updated'));
      window.dispatchEvent(new CustomEvent('addus_projects_updated'));

      alert('🎉 Proposal accepted! Your project is now active and live.');
    } catch (e) {
      console.warn('Accept proposal error:', e);
    }
  };

  const handleRejectProposal = (proposal) => {
    try {
      const reasonInput = window.prompt(
        'Please state your reason for declining this proposal so Admin can adjust the details:',
        'Shoot date not convenient / Budget needs adjustment'
      );

      if (reasonInput === null) return; // User cancelled
      const reason = reasonInput.trim() || 'Customer requested date/budget adjustments.';
      const session = sessionManager.getSession();
      const uid = session?.userId || 'customer_7907963442';

      // 1. Update Project status
      if (proposal.projectId) {
        updateProjectInStore(proposal.projectId, {
          status: 'Customer Rejected',
          rejectionReason: reason,
          customerNote: `Declined proposal. Reason: ${reason}`
        }, { actor: 'Customer', role: 'Customer' });
      }

      // 2. Update Chat History & Proposal status in profile
      const prof = profileService.getProfileById(uid) || {};
      const updatedChat = (prof.chatHistory || []).map(c => {
        if (c.counterProposal && c.counterProposal.reqId === proposal.reqId) {
          return { ...c, counterProposal: { ...c.counterProposal, status: 'rejected', rejectionReason: reason } };
        }
        return c;
      });

      updatedChat.push({
        id: `msg_cust_${Date.now()}`,
        sender: 'user',
        role: 'user',
        text: `✕ I declined the proposed date/budget. Reason: "${reason}". Please modify and resend.`,
        timestamp: new Date().toISOString()
      });

      updatedChat.push({
        id: `msg_addi_${Date.now()}`,
        sender: 'admin',
        role: 'admin',
        text: `Understood! We have notified the Admin team with your feedback ("${reason}"). They will modify the project details and resend a revised proposal to you shortly.`,
        timestamp: new Date().toISOString()
      });

      profileService.saveProfile({
        ...prof,
        chatHistory: updatedChat
      });

      // 3. Broadcast events
      window.dispatchEvent(new CustomEvent('addus_chat_updated'));
      window.dispatchEvent(new CustomEvent('addus_profile_updated'));
      window.dispatchEvent(new CustomEvent('addus_approvals_updated'));
      window.dispatchEvent(new CustomEvent('addus_projects_updated'));

      alert('Feedback sent! Admin has been notified to modify the details and resend.');
    } catch (e) {
      console.warn('Reject proposal error:', e);
    }
  };

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

              <p className="bubble-text-plain" style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>

              {/* Render Admin Counter-Proposal Card */}
              {msg.counterProposal && (
                <div 
                  style={{
                    background: 'linear-gradient(135deg, #1E1E2E, #161622)',
                    border: '1px solid rgba(124, 92, 255, 0.4)',
                    borderRadius: '14px',
                    padding: '14px',
                    marginTop: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    <Sparkles size={16} color="#7C5CFF" />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFF' }}>
                      📋 ADDUS Admin Counter-Proposal
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#D1D5DB', marginBottom: '12px' }}>
                    <div>📅 Proposed Shoot Date: <strong style={{ color: '#00D1FF' }}>{msg.counterProposal.proposedShootDate}</strong></div>
                    <div>💰 Proposed Budget: <strong style={{ color: '#10B981' }}>₹{Number(msg.counterProposal.proposedBudget).toLocaleString('en-IN')}</strong></div>
                    {msg.counterProposal.adminNote && (
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#9CA3AF', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                        "{msg.counterProposal.adminNote}"
                      </div>
                    )}
                  </div>

                  {msg.counterProposal.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleAcceptProposal(msg.counterProposal)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#FFF',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        ✓ Accept Admin Proposal
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectProposal(msg.counterProposal)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#EF4444',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Reject Proposal
                      </button>
                    </div>
                  ) : msg.counterProposal.status === 'accepted' ? (
                    <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10B981', fontSize: '12px', fontWeight: '800', textAlign: 'center' }}>
                      ✅ Proposal Accepted — Project is LIVE
                    </div>
                  ) : (
                    <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#EF4444', fontSize: '12px', fontWeight: '800', textAlign: 'center' }}>
                      ❌ Proposal Declined — Admin Notified to Modify Details
                    </div>
                  )}
                </div>
              )}

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

export default ADDIChatScreen;
