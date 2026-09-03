import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Search, Paperclip, User, X, Briefcase, Calendar, DollarSign, Award, ShieldCheck } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { getAllProjectsAcrossUsers, updateProjectInStore } from '../../../../shared/hooks/useProjectStore.js';
import { NotificationEngine } from '../../../../src/services/brain/UniversalNotificationEngine.js';
import { adminApiService } from '../services/adminApiService.js';
import { syncService } from '../../../../src/services/syncService.js';

/**
 * MessagesTab — Real Customer Communication Center
 * Reads from actual persisted customer chatHistory + project.chat[]
 * Admin replies persist to profile.chatHistory, project.chat, backend vault, and notify the correct customer.
 * Supports complete customer name resolution and full Customer Profile Inspector drawer.
 */
export function MessagesTab({ dataSource = 'localStorage', adminReady = false }) {
  const [activeGroup, setActiveGroup] = useState('all');
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [threads, setThreads] = useState([]);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState(null);

  const buildThreads = useCallback(async () => {
    let profiles = [];
    let allProjects = [];
    try {
      const localProfiles = profileService.getAllProfiles() || [];
      const localProjects = getAllProjectsAcrossUsers() || [];

      if (dataSource === 'backend' && adminReady) {
        const [usersRes, projectsRes] = await Promise.all([
          adminApiService.getUsers().catch(() => ({ users: [] })),
          adminApiService.getProjects().catch(() => ({ projects: [] }))
        ]);
        const beUsers = usersRes.users || [];
        const beProjects = projectsRes.projects || [];

        // Merge backend + local so no profiles/chats are missed
        const mergedProfMap = new Map();
        [...localProfiles, ...beUsers].forEach(p => {
          const key = p.userId || p.customerId || (p.phoneNumber ? p.phoneNumber.slice(-10) : null);
          if (key) {
            const existing = mergedProfMap.get(key) || {};
            const chatA = existing.chatHistory || [];
            const chatB = p.chatHistory || [];
            const mergedChat = [...chatA];
            chatB.forEach(cb => {
              if (!mergedChat.some(ca => ca.id === cb.id || (ca.text === cb.text && Math.abs(new Date(ca.timestamp) - new Date(cb.timestamp)) < 5000))) {
                mergedChat.push(cb);
              }
            });
            mergedProfMap.set(key, { ...existing, ...p, chatHistory: mergedChat });
          }
        });
        profiles = Array.from(mergedProfMap.values());
        allProjects = [...beProjects, ...localProjects];
      } else {
        profiles = localProfiles;
        allProjects = localProjects;
      }
    } catch (e) {
      console.warn('[MessagesTab] load fallback to localStorage:', e.message);
      profiles = profileService.getAllProfiles() || [];
      allProjects = getAllProjectsAcrossUsers() || [];
    }

    const built = [];

    for (const profile of profiles) {
      const brain = profile.businessBrain || {};

      const customerProjects = allProjects.filter(p => p.userId === profile.userId || p.userId === profile.customerId || p.customerId === profile.userId);
      const projWithName = customerProjects.find(p => p.customerName || p.businessName || p.title);

      const rawName = profile.name || profile.customerName || profile.userName || brain.customerName || profile.businessBrain?.customerName || profile.businessProfile?.customerName || projWithName?.customerName;
      const rawBiz = brain.businessName || profile.businessName || profile.businessBrain?.businessName || profile.businessProfile?.businessName || projWithName?.businessName;

      let displayName = '';
      if (rawBiz && rawBiz !== 'your business' && rawBiz !== 'My Business' && !/^[0-9+]+$/.test(rawBiz.trim())) {
        displayName = rawBiz.trim();
      } else if (rawName && rawName.toLowerCase() !== 'customer' && rawName.toLowerCase() !== 'user' && !/^[0-9+]+$/.test(rawName.trim())) {
        displayName = rawName.trim();
      } else if (profile.phoneNumber) {
        displayName = profile.phoneNumber.length === 10 ? `+91 ${profile.phoneNumber}` : profile.phoneNumber;
      } else {
        displayName = `Client ${profile.customerId ? profile.customerId.replace('customer_', '') : 'Profile'}`;
      }

      const avatarLetter = (displayName && !displayName.startsWith('+91') && displayName !== 'Valued Client' ? displayName[0] : (profile.name?.[0] || '👤')).toUpperCase();

      const addiMessages = (profile.chatHistory || []).map(m => {
        const isAdmin = m.sender === 'admin' || m.role === 'admin' || (m.senderName && m.senderName.toLowerCase().includes('admin'));
        return {
          messageId: m.id || `m_${Math.random()}`,
          sender: isAdmin ? (m.senderName || 'ADDUS Ops Team') : (m.sender === 'user' ? (profile.name || displayName) : 'ADDI'),
          senderType: isAdmin ? 'admin' : (m.sender === 'user' ? 'customer' : 'ai'),
          text: m.text || m.content || m.message || '',
          timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
          read: !!m.read,
          projectId: null
        };
      });

      const projectMessages = customerProjects.flatMap(proj =>
        (proj.chat || []).map(c => ({
          messageId: c.id,
          sender: c.senderName || (c.senderRole === 'Admin' ? 'ADDUS Ops Team' : displayName),
          senderType: c.senderRole === 'Admin' ? 'admin' : 'customer',
          text: c.text || '',
          timestamp: c.timestamp || new Date().toISOString(),
          read: !!c.read,
          projectId: proj.id,
          projectName: proj.service || proj.title || 'Project'
        }))
      );

      const allMessages = [...addiMessages, ...projectMessages].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      if (allMessages.length === 0 && addiMessages.length === 0) continue;

      const latestProject = customerProjects.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      const unread = allMessages.filter(m => m.senderType === 'customer' && !m.read).length;

      built.push({
        id: profile.userId || profile.customerId,
        group: 'customer',
        customerId: profile.userId || profile.customerId,
        businessId: profile.businessId,
        projectId: latestProject?.id || null,
        title: displayName,
        subtitle: latestProject
          ? `Project: ${latestProject.service || latestProject.title || latestProject.id}`
          : `ID: ${profile.customerId || profile.userId}`,
        avatar: avatarLetter,
        unreadCount: unread,
        messages: allMessages,
        profile: {
          ...profile,
          resolvedDisplayName: displayName,
          projects: customerProjects
        }
      });
    }

    setThreads(built);
    if (built.length > 0 && !activeThreadId) {
      setActiveThreadId(built[0].id);
    }
  }, [dataSource, adminReady, activeThreadId]);

  const markThreadAsRead = useCallback((targetCustomerId) => {
    if (!targetCustomerId) return;
    try {
      const allLocal = profileService.getAllProfiles() || [];
      const userProf = profileService.getProfileById(targetCustomerId) ||
        allLocal.find(p => p.userId === targetCustomerId || p.customerId === targetCustomerId);

      if (userProf) {
        let hasUnread = false;
        const updatedChat = (userProf.chatHistory || []).map(c => {
          const isCustomerMsg = c.sender === 'user' || c.role === 'user' || c.senderType === 'customer';
          if (isCustomerMsg && !c.read) {
            hasUnread = true;
            return { ...c, read: true, readAt: new Date().toISOString() };
          }
          return c;
        });

        if (hasUnread) {
          const updated = profileService.saveProfile({
            ...userProf,
            chatHistory: updatedChat
          });
          syncService.syncProfile(userProf.userId || targetCustomerId, updated);
          
          setThreads(prev => prev.map(t => {
            if (t.id === targetCustomerId || t.customerId === targetCustomerId) {
              return {
                ...t,
                unreadCount: 0,
                messages: t.messages.map(m => m.senderType === 'customer' ? { ...m, read: true } : m)
              };
            }
            return t;
          }));
        }
      }
    } catch (e) {
      console.warn('markThreadAsRead error:', e);
    }
  }, []);

  useEffect(() => {
    buildThreads();
    const interval = setInterval(buildThreads, 3000);
    window.addEventListener('addus_chat_updated', buildThreads);
    window.addEventListener('addus_profile_updated', buildThreads);

    return () => {
      clearInterval(interval);
      window.removeEventListener('addus_chat_updated', buildThreads);
      window.removeEventListener('addus_profile_updated', buildThreads);
    };
  }, [buildThreads]);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0] || null;

  useEffect(() => {
    if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].id);
    }
    if (activeThreadId) {
      markThreadAsRead(activeThreadId);
    }
  }, [threads, activeThreadId, markThreadAsRead]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const content = replyText.trim();
    const msgId = `msg_${Date.now()}`;
    const newMsg = {
      id: msgId,
      senderId: 'admin_team',
      senderName: 'ADDUS Ops Team',
      senderRole: 'Admin',
      senderType: 'admin',
      text: content,
      timestamp: new Date().toISOString(),
      isInternal: false,
      read: false
    };

    // 1. Save directly into customer's profile chatHistory
    try {
      const allLocal = profileService.getAllProfiles() || [];
      const userProf = profileService.getProfileById(activeThread.customerId) ||
        allLocal.find(p => 
          p.userId === activeThread.customerId || 
          p.customerId === activeThread.customerId ||
          (activeThread.profile?.phoneNumber && p.phoneNumber && p.phoneNumber.slice(-10) === activeThread.profile.phoneNumber.slice(-10))
        );

      if (userProf) {
        const chat = userProf.chatHistory || [];
        const updatedChat = [...chat, {
          id: msgId,
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
        syncService.syncProfile(userProf.userId || activeThread.customerId, updated);
      }
    } catch (profErr) {
      console.warn('Profile save error:', profErr);
    }

    // 2. Persist to project.chat if a project exists
    if (activeThread.projectId) {
      const allProjects = getAllProjectsAcrossUsers();
      const proj = allProjects.find(p => p.id === activeThread.projectId);
      if (proj) {
        updateProjectInStore(activeThread.projectId, {
          chat: [...(proj.chat || []), newMsg]
        });
      }
    }

    // 3. Send to backend chat API
    try {
      await adminApiService.sendChatMessage({
        recipientId: activeThread.customerId,
        senderId: 'admin',
        senderName: 'Admin Team',
        content: content,
        conversationId: `admin_${activeThread.customerId}`
      });
    } catch (err) {
      console.warn('Backend send notice:', err);
    }

    // 4. Notify customer and dispatch events for instant tab-to-tab sync
    NotificationEngine.notify({
      userId: activeThread.customerId,
      role: 'Customer',
      type: 'admin_message',
      title: 'New Message from ADDUS',
      message: content.slice(0, 100),
      priority: 'high'
    });

    window.dispatchEvent(new CustomEvent('addus_chat_updated'));
    window.dispatchEvent(new CustomEvent('addus_profile_updated'));

    // 5. Optimistic UI update
    setThreads(prev => prev.map(t => {
      if (t.id !== activeThread.id) return t;
      return {
        ...t,
        messages: [
          ...t.messages,
          {
            messageId: msgId,
            sender: 'ADDUS Ops Team',
            senderType: 'admin',
            text: content,
            timestamp: new Date().toISOString(),
            projectId: activeThread.projectId
          }
        ]
      };
    }));

    setReplyText('');
  };

  const filteredThreads = threads.filter(t =>
    activeGroup === 'all' ? true : t.group === activeGroup
  );

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">Customer Communication Center</h2>
          <p className="tab-pane-subtitle">Real-time conversations with your customers, synced from their ADDI chat and project workspaces.</p>
        </div>
        <div className="tab-filter-pills">
          {['all', 'customer'].map(g => (
            <button
              key={g}
              className={`filter-pill ${activeGroup === g ? 'pill-active' : ''}`}
              onClick={() => setActiveGroup(g)}
            >
              {g.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="messages-layout-grid margin-top-20">
        {/* Thread Sidebar */}
        <div className="threads-list-box">
          <div className="thread-search-bar">
            <Search size={14} />
            <input type="text" placeholder="Search conversations..." className="thread-search-input" />
          </div>
          <div className="threads-scroll-col">
            {filteredThreads.length === 0 ? (
              <div style={{ padding: '24px 16px', color: '#6b7280', fontSize: '13px', textAlign: 'center' }}>
                No customer conversations yet.<br />
                Conversations appear here when customers use ADDI or send messages.
              </div>
            ) : filteredThreads.map(t => (
              <div
                key={t.id}
                className={`thread-item ${t.id === activeThreadId ? 'thread-item-active' : ''}`}
                onClick={() => setActiveThreadId(t.id)}
              >
                <div className="thread-avatar" style={{ background: 'linear-gradient(135deg, #7C5CFF, #6366F1)', color: '#fff', fontWeight: 800 }}>
                  {t.avatar}
                </div>
                <div className="thread-info-col">
                  <div className="thread-title-row">
                    <span className="thread-title">{t.title}</span>
                    {t.unreadCount > 0 && <span className="unread-badge">{t.unreadCount}</span>}
                  </div>
                  <span className="thread-subtitle">{t.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Chat Window */}
        <div className="chat-window-box">
          {activeThread ? (
            <>
              <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="chat-header-avatar" style={{ background: 'linear-gradient(135deg, #7C5CFF, #6366F1)', color: '#fff', fontWeight: 800, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    {activeThread.avatar}
                  </div>
                  <div>
                    <h3 className="chat-header-title" style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#FFF' }}>{activeThread.title}</h3>
                    <span className="chat-header-sub" style={{ fontSize: '12px', color: '#9CA3AF' }}>{activeThread.subtitle}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomerProfile(activeThread.profile || activeThread)}
                  style={{
                    background: 'rgba(124, 92, 255, 0.15)',
                    border: '1px solid rgba(124, 92, 255, 0.35)',
                    color: '#A78BFA',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <User size={15} /> View Customer Profile
                </button>
              </div>

              <div className="messages-stream-col">
                {activeThread.messages.length === 0 ? (
                  <div style={{ padding: '24px', color: '#6b7280', textAlign: 'center', fontSize: '13px' }}>
                    No messages yet. Use the composer below to send a message.
                  </div>
                ) : activeThread.messages.map((m, idx) => (
                  <div key={m.messageId || idx} className={`message-bubble-row ${m.senderType === 'admin' ? 'msg-outgoing' : 'msg-incoming'}`}>
                    <div className="message-content-card">
                      <div className="msg-sender-name">{m.sender}</div>
                      <p className="msg-text">{m.text}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '8px' }}>
                        <span className="msg-timestamp" style={{ margin: 0 }}>
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          {m.projectId && <span style={{ marginLeft: 8, opacity: 0.6, fontSize: '11px' }}>• {m.projectName || m.projectId}</span>}
                        </span>
                        {m.senderType === 'admin' && (
                          <span style={{ fontSize: '11px', fontWeight: '700', color: m.read ? '#00D1FF' : '#9CA3AF', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            {m.read ? (
                              <>
                                <span style={{ color: '#00D1FF' }}>✓✓</span> Seen
                              </>
                            ) : (
                              <>
                                <span>✓</span> Delivered
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendReply} className="chat-composer-box">
                <button type="button" className="composer-attach-btn" title="Attach file">
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  className="chat-composer-input"
                  placeholder="Type a message to this customer..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                <button type="submit" className="chat-send-btn" disabled={!replyText.trim()}>
                  <Send size={16} /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              No customer conversations found.<br />
              Conversations appear here once customers interact with ADDI.
            </div>
          )}
        </div>
      </div>

      {/* Customer Profile Inspector Modal */}
      {selectedCustomerProfile && (
        <div 
          className="fade-in"
          onClick={() => setSelectedCustomerProfile(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999, padding: '16px', boxSizing: 'border-box'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '560px', background: '#161622',
              border: '1px solid rgba(124, 92, 255, 0.4)', borderRadius: '20px',
              padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
              boxSizing: 'border-box', maxHeight: '85vh', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #7C5CFF, #6366F1)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                  {(selectedCustomerProfile.resolvedDisplayName || selectedCustomerProfile.name || selectedCustomerProfile.businessBrain?.businessName || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#FFF' }}>
                    {selectedCustomerProfile.resolvedDisplayName || selectedCustomerProfile.name || selectedCustomerProfile.businessBrain?.businessName || 'Customer Profile'}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#A78BFA' }}>
                    ID: {selectedCustomerProfile.userId || selectedCustomerProfile.customerId}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerProfile(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Grid Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>👤 Full Name / Contact</span>
                <strong style={{ fontSize: '13px', color: '#FFF' }}>{selectedCustomerProfile.name || selectedCustomerProfile.customerName || 'N/A'}</strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>📞 Phone Number</span>
                <strong style={{ fontSize: '13px', color: '#00D1FF' }}>{selectedCustomerProfile.phoneNumber || 'N/A'}</strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>🏢 Business Name</span>
                <strong style={{ fontSize: '13px', color: '#10B981' }}>
                  {selectedCustomerProfile.businessBrain?.businessName || selectedCustomerProfile.businessName || 'N/A'}
                </strong>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>🏷️ Industry / Category</span>
                <strong style={{ fontSize: '13px', color: '#A78BFA' }}>
                  {selectedCustomerProfile.businessBrain?.industry || selectedCustomerProfile.industry || 'Commercial & Creative'}
                </strong>
              </div>
            </div>

            {/* Business Details */}
            {(selectedCustomerProfile.businessBrain?.businessDescription || selectedCustomerProfile.description) && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginBottom: '6px' }}>📝 Business Summary / Description</span>
                <p style={{ margin: 0, fontSize: '13px', color: '#D1D5DB', lineHeight: '1.5' }}>
                  {selectedCustomerProfile.businessBrain?.businessDescription || selectedCustomerProfile.description}
                </p>
              </div>
            )}

            {/* Projects List */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🎬 Customer Projects ({(selectedCustomerProfile.projects || []).length})
              </h4>
              {(selectedCustomerProfile.projects || []).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>No active projects recorded.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedCustomerProfile.projects || []).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{p.service || p.title || p.id}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>ID: {p.id} · Budget: {p.budget || 'N/A'}</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                        {p.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedCustomerProfile(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesTab;
