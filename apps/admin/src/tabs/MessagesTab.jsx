import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Search, Paperclip } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { getAllProjectsAcrossUsers, updateProjectInStore } from '../../../../shared/hooks/useProjectStore.js';
import { NotificationEngine } from '../../../../src/services/brain/UniversalNotificationEngine.js';
import { adminApiService } from '../services/adminApiService.js';

import { syncService } from '../../../../src/services/syncService.js';

/**
 * MessagesTab — Real Customer Communication Center
 * Reads from actual persisted customer chatHistory + project.chat[]
 * Admin replies persist to profile.chatHistory, project.chat, backend vault, and notify the correct customer.
 */
export function MessagesTab({ dataSource = 'localStorage', adminReady = false }) {
  const [activeGroup, setActiveGroup] = useState('all');
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [threads, setThreads] = useState([]);

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
      const displayName = brain.businessName || profile.name || profile.phoneNumber || `Customer ${profile.customerId}`;

      const addiMessages = (profile.chatHistory || []).map(m => {
        const isAdmin = m.sender === 'admin' || m.role === 'admin' || (m.senderName && m.senderName.toLowerCase().includes('admin'));
        return {
          messageId: m.id || `m_${Math.random()}`,
          sender: isAdmin ? (m.senderName || 'ADDUS Ops Team') : (m.sender === 'user' ? (profile.name || 'Customer') : 'ADDI'),
          senderType: isAdmin ? 'admin' : (m.sender === 'user' ? 'customer' : 'ai'),
          text: m.text || m.content || m.message || '',
          timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
          projectId: null
        };
      });

      const customerProjects = allProjects.filter(p => p.userId === profile.userId || p.userId === profile.customerId);
      const projectMessages = customerProjects.flatMap(proj =>
        (proj.chat || []).map(c => ({
          messageId: c.id,
          sender: c.senderName || (c.senderRole === 'Admin' ? 'ADDUS Ops Team' : (profile.name || 'Customer')),
          senderType: c.senderRole === 'Admin' ? 'admin' : 'customer',
          text: c.text || '',
          timestamp: c.timestamp || new Date().toISOString(),
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
        id: profile.userId,
        group: 'customer',
        customerId: profile.userId,
        businessId: profile.businessId,
        projectId: latestProject?.id || null,
        title: displayName,
        subtitle: latestProject
          ? `Project: ${latestProject.service || latestProject.title || latestProject.id}`
          : `ID: ${profile.customerId}`,
        avatar: (brain.businessName || profile.name || '?')[0]?.toUpperCase() || '?',
        unreadCount: unread,
        messages: allMessages,
        profile
      });
    }

    setThreads(built);
    if (built.length > 0 && !activeThreadId) {
      setActiveThreadId(built[0].id);
    }
  }, [dataSource, adminReady, activeThreadId]);

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
  }, [threads, activeThreadId]);

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
                <div className="thread-avatar" style={{ background: '#7c5cff', color: '#fff', fontWeight: 700 }}>
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
              <div className="chat-header">
                <div className="chat-header-avatar" style={{ background: '#7c5cff', color: '#fff', fontWeight: 700 }}>
                  {activeThread.avatar}
                </div>
                <div>
                  <h3 className="chat-header-title">{activeThread.title}</h3>
                  <span className="chat-header-sub">{activeThread.subtitle}</span>
                </div>
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
                      <span className="msg-timestamp">
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        {m.projectId && <span style={{ marginLeft: 8, opacity: 0.6, fontSize: '11px' }}>• {m.projectName || m.projectId}</span>}
                      </span>
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
    </div>
  );
}
