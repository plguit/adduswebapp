import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, UserCheck, UserX, Search } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import { profileService } from '../../../services/profileService.js';
import { syncService } from '../../../services/syncService.js';

export function AdminChatTab() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.userId);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time polling for incoming customer messages
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers(true);
      if (selectedUser?.userId) {
        loadMessages(selectedUser.userId, true);
      }
    }, 3000);

    const handleChatUpdated = () => {
      loadUsers(true);
      if (selectedUser?.userId) {
        loadMessages(selectedUser.userId, true);
      }
    };

    window.addEventListener('addus_chat_updated', handleChatUpdated);
    window.addEventListener('addus_profile_updated', handleChatUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('addus_chat_updated', handleChatUpdated);
      window.removeEventListener('addus_profile_updated', handleChatUpdated);
    };
  }, [selectedUser]);

  const loadUsers = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      let vaultUsers = [];
      try {
        const data = await apiService.fetchAdminVaults();
        vaultUsers = (data || []).map(item => {
          const v = item.vault || item || {};
          const uId = item.userId || v.userId || v.customerId;
          return {
            userId: uId,
            customerId: v.customerId || (uId && uId.startsWith('ACA') ? uId : null),
            name: v.name || v.customerName || 'Customer',
            businessName: v.businessName || v.businessBrain?.businessName || v.name || 'Business Account',
            industry: v.industry || v.businessBrain?.industry || 'General',
            phoneNumber: v.phoneNumber || v.phone || '',
            email: v.email || '',
            chatHistory: v.chatHistory || [],
            chatRestricted: v.chatRestricted || false
          };
        }).filter(u => u.userId && u.userId !== 'admin');
      } catch (e) {
        console.warn('Backend vaults fetch notice:', e);
      }

      // Also get all registered/local profiles
      const localProfiles = profileService.getAllProfiles() || [];
      const localUsers = localProfiles.map(p => ({
        userId: p.userId || p.customerId,
        customerId: p.customerId || (p.userId && p.userId.startsWith('ACA') ? p.userId : null),
        name: p.name || p.customerName || 'Customer',
        businessName: p.businessBrain?.businessName || p.businessName || p.name || 'Business Account',
        industry: p.businessBrain?.industry || p.industry || 'General',
        phoneNumber: p.phoneNumber || p.phone || '',
        email: p.email || '',
        chatHistory: p.chatHistory || [],
        chatRestricted: p.chatRestricted || false
      })).filter(u => u.userId && u.userId !== 'admin');

      const userMap = new Map();
      [...vaultUsers, ...localUsers].forEach(u => {
        if (!userMap.has(u.userId)) {
          userMap.set(u.userId, u);
        } else {
          userMap.set(u.userId, { ...userMap.get(u.userId), ...u });
        }
      });

      const merged = Array.from(userMap.values());
      setUsers(merged);
      if (!selectedUser && merged.length > 0) {
        setSelectedUser(merged[0]);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const loadMessages = async (userId, isBackground = false) => {
    if (!userId) return;
    try {
      let backendMsgs = [];
      try {
        const msgs = await apiService.fetchChatMessages({ userId });
        backendMsgs = (msgs || []).filter(m => !m.deleted);
      } catch (e) {
        console.warn('Backend chat fetch notice:', e);
      }

      // Search local profile by exact userId or phone
      const allLocal = profileService.getAllProfiles() || [];
      const userProf = profileService.getProfileById(userId) ||
        allLocal.find(p => p.customerId === userId || (p.phoneNumber && userId.includes(p.phoneNumber.slice(-10))));

      const localChat = (userProf?.chatHistory || []).map((m, idx) => ({
        id: m.id || `msg_${idx}`,
        userId: userId,
        senderId: m.sender === 'user' ? userId : (m.sender === 'admin' ? 'admin' : 'addi_bot'),
        senderRole: m.sender === 'user' ? 'CUSTOMER' : (m.sender === 'admin' ? 'ADMIN' : 'AI_STRATEGIST'),
        senderName: m.senderName || (m.sender === 'user' ? (userProf?.name || 'Customer') : (m.sender === 'admin' ? 'Admin Team' : 'ADDI')),
        content: m.text || m.content || '',
        timestamp: m.timestamp || new Date().toISOString()
      }));

      // Combine and deduplicate
      const msgMap = new Map();
      [...localChat, ...backendMsgs].forEach(m => {
        const key = m.id || `${m.content}_${m.timestamp?.slice(0, 19)}`;
        if (!msgMap.has(key)) {
          msgMap.set(key, m);
        }
      });

      const sorted = Array.from(msgMap.values()).sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
      setMessages(sorted);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedUser || sending) return;
    
    const content = input.trim();
    setSending(true);
    const newMsg = {
      id: `msg_admin_${Date.now()}`,
      userId: selectedUser.userId,
      senderId: 'admin',
      senderRole: 'ADMIN',
      senderName: 'Admin Team',
      recipientId: selectedUser.userId,
      recipientRole: 'CUSTOMER',
      content: content,
      timestamp: new Date().toISOString()
    };

    // 1. Instantly update UI
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // 2. Save into Customer Profile Chat History so customer gets it in real-time
    try {
      const allLocal = profileService.getAllProfiles() || [];
      const normPhone = selectedUser.phoneNumber ? selectedUser.phoneNumber.replace(/\D/g, '').slice(-10) : '';
      const userProf = profileService.getProfileById(selectedUser.userId) ||
        allLocal.find(p => 
          p.customerId === selectedUser.userId || 
          p.userId === selectedUser.customerId ||
          (normPhone && p.phoneNumber && p.phoneNumber.replace(/\D/g, '').slice(-10) === normPhone)
        );

      if (userProf) {
        const chat = userProf.chatHistory || [];
        const updatedChat = [...chat, {
          id: newMsg.id,
          sender: 'admin',
          role: 'admin',
          senderName: 'Admin Team',
          text: content,
          timestamp: newMsg.timestamp
        }];
        const notifs = userProf.notifications || [];
        notifs.unshift({
          id: `notif_${Date.now()}`,
          title: 'Message from ADDUS Team',
          message: content.length > 80 ? content.slice(0, 77) + '...' : content,
          read: false,
          createdAt: newMsg.timestamp
        });
        const updated = profileService.saveProfile({
          ...userProf,
          chatHistory: updatedChat,
          notifications: notifs
        });
        syncService.syncProfile(userProf.userId || selectedUser.userId, updated);
      }
    } catch (profErr) {
      console.warn('Profile save error:', profErr);
    }

    // 3. Send to backend chat API
    try {
      await apiService.sendChatMessage({
        recipientId: selectedUser.userId,
        senderId: 'admin',
        senderName: 'Admin Team',
        content: content,
        conversationId: `admin_${selectedUser.userId}`
      });
    } catch (err) {
      console.warn('Backend send notice:', err);
    }

    // 4. Dispatch global real-time event
    window.dispatchEvent(new CustomEvent('addus_chat_updated'));
    window.dispatchEvent(new CustomEvent('addus_profile_updated'));
    setSending(false);
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await apiService.deleteChatMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));

      if (selectedUser?.userId) {
        const userProf = profileService.getProfileById(selectedUser.userId);
        if (userProf) {
          const chat = (userProf.chatHistory || []).filter(m => m.id !== messageId);
          const updated = profileService.saveProfile({ ...userProf, chatHistory: chat });
          syncService.syncProfile(selectedUser.userId, updated);
        }
      }
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
  };

  const handleRestrict = async (userId, currentRestricted) => {
    try {
      await apiService.restrictUserChat(userId, !currentRestricted);
      const userProf = profileService.getProfileById(userId);
      if (userProf) {
        profileService.saveProfile({ ...userProf, chatRestricted: !currentRestricted });
      }
      await loadUsers();
      if (selectedUser?.userId === userId) {
        setSelectedUser(prev => ({ ...prev, chatRestricted: !currentRestricted }));
      }
    } catch (err) {
      alert('Failed to update restriction: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const name = (u.businessName || u.name || u.userId || '').toLowerCase();
    const phone = (u.phoneNumber || u.phone || '').toLowerCase();
    return !q || name.includes(q) || phone.includes(q);
  });

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Live Customer Support &amp; Chat</h2>
        <span style={{ fontSize: '12px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }}></span>
          Live Sync Active
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', height: '620px', background: '#1D1A34', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {/* Users list */}
        <div style={{ width: '300px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px 12px' }}>
              <Search size={16} style={{ color: '#9CA3AF' }} />
              <input
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '13px', width: '100%' }}
                placeholder="Search business or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                No customers found
              </div>
            ) : filteredUsers.map(u => (
              <div
                key={u.userId}
                onClick={() => setSelectedUser(u)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: selectedUser?.userId === u.userId ? 'rgba(129,140,248,0.12)' : 'transparent',
                  borderLeft: selectedUser?.userId === u.userId ? '3px solid #7c5cff' : '3px solid transparent'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFF' }}>
                  {u.businessName || u.name || u.userId}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{u.name !== u.businessName ? u.name : (u.industry || 'Client')}</span>
                  <span style={{ color: u.chatRestricted ? '#EF4444' : '#34D399' }}>{u.chatRestricted ? 'Restricted' : 'Active'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>
                    {selectedUser.businessName || selectedUser.name || selectedUser.userId}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                    Contact: {selectedUser.name} · Phone: {selectedUser.phoneNumber || 'N/A'} · Customer ID: {selectedUser.customerId || (selectedUser.userId.startsWith('customer_') ? `ACA${selectedUser.userId.replace('customer_', '').slice(-6)}` : selectedUser.userId)}
                  </div>
                </div>
                <button
                  onClick={() => handleRestrict(selectedUser.userId, selectedUser.chatRestricted)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: selectedUser.chatRestricted ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${selectedUser.chatRestricted ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: '8px', padding: '6px 12px', color: selectedUser.chatRestricted ? '#34D399' : '#EF4444',
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  {selectedUser.chatRestricted ? <><UserCheck size={14} /> Unrestrict</> : <><UserX size={14} /> Restrict Chat</>}
                </button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px', fontSize: '13px' }}>
                    No messages with this customer yet. Send a message below.
                  </div>
                ) : messages.map((msg, mIdx) => {
                  const isAdmin = msg.senderId === 'admin' || msg.senderRole === 'ADMIN' || msg.sender === 'admin';
                  const isAI = msg.senderId === 'addi_bot' || msg.senderRole === 'AI_STRATEGIST' || msg.sender === 'ai';
                  return (
                    <div
                      key={msg.id || mIdx}
                      style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isAdmin
                          ? 'linear-gradient(135deg, rgba(124,92,255,0.25), rgba(79,70,229,0.25))'
                          : (isAI ? 'rgba(0,209,255,0.08)' : 'rgba(255,255,255,0.06)'),
                        border: `1px solid ${isAdmin ? 'rgba(124,92,255,0.4)' : (isAI ? 'rgba(0,209,255,0.2)' : 'rgba(255,255,255,0.1)')}`,
                        position: 'relative'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: '700', color: isAdmin ? '#A78BFA' : (isAI ? '#00D1FF' : '#34D399'), marginBottom: '4px', textTransform: 'uppercase' }}>
                        {isAdmin ? '🛡️ Admin Team' : (isAI ? '🤖 ADDI (AI Strategist)' : `👤 ${msg.senderName || 'Customer'}`)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#FFF', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{msg.content}</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px', textAlign: 'right' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {!isAdmin && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          style={{
                            position: 'absolute', top: '4px', right: '4px',
                            background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '4px',
                            padding: '2px 6px', color: '#EF4444', fontSize: '10px', cursor: 'pointer'
                          }}
                          title="Delete message"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)' }}>
                <input
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none'
                  }}
                  placeholder={selectedUser.chatRestricted ? "Chat is restricted for this user" : `Reply to ${selectedUser.businessName || selectedUser.name}...`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={sending || selectedUser.chatRestricted}
                />
                <button
                  type="submit"
                  disabled={sending || selectedUser.chatRestricted || !input.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #7c5cff, #4f46e5)', border: 'none',
                    borderRadius: '10px', padding: '10px 18px', color: '#FFF', cursor: 'pointer',
                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: (sending || selectedUser.chatRestricted || !input.trim()) ? 0.5 : 1
                  }}
                >
                  <Send size={16} /> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '14px' }}>
              Select a customer from the left list to view and reply to messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
