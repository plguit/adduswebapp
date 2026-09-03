import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, Sparkles, Video, Camera, Palette, Globe, Share2, Package,
  MoreHorizontal, Home, FolderKanban, User, Send, LogOut, Clock,
  Calendar, Rocket, CheckCircle2, ChevronRight, Brain, Edit2, AlertCircle, MessageSquare, Download, Menu, FileText, ShieldCheck, Upload,
  Megaphone, TrendingUp, Scissors, Smartphone, Plus, Play
} from 'lucide-react';
import { useOnboardingStore } from '../../../../shared/hooks/useOnboardingStore.js';
import { useProjectStore, updateProjectInStore, getProjectBudgetDisplay, getServiceScheduleType } from '../../../../shared/hooks/useProjectStore.js';
import { authService } from '../../../../shared/services/authService.js';
import { NotificationEngine } from '../../../../src/services/brain/UniversalNotificationEngine.js';
import { profileService } from '../../../../shared/services/profileService.js';
import { sessionManager } from '../../../../shared/services/sessionManager.js';
import { dashboardService } from '../../../../src/services/dashboardService.js';
import { aiService } from '../../../../shared/services/aiService.js';
import { syncService } from '../../../../src/services/syncService.js';
import { ProjectsTab } from '../components/ProjectsTab.jsx';
import { ExpertReviewCard } from '../../../../shared/components/widgets/ExpertReviewCard.jsx';
import { ToastNotification } from '../../../../shared/components/ui/ToastNotification.jsx';
import { ProjectTimeline } from '../../../../src/components/operations/ProjectTimeline.jsx';
import { DeliverablesManager } from '../../../../src/components/operations/DeliverablesManager.jsx';
import { ProjectFolders } from '../../../../src/components/operations/ProjectFolders.jsx';
import { ActivityFeed } from '../../../../src/components/operations/ActivityFeed.jsx';
import { LegalPages } from '../components/LegalPages.jsx';
import { HamburgerDrawer } from '../../../../shared/components/widgets/HamburgerDrawer.jsx';
import { CustomerGalleryView } from '../../../../shared/components/widgets/CustomerGalleryView.jsx';
import { ProfileTab } from '../../../../shared/components/widgets/ProfileTab.jsx';
import { ExpertSuggestionsSection } from '../../../../shared/components/widgets/ExpertSuggestionsSection.jsx';
import { MascotLottiePlayer } from '../../../../src/components/chat/MascotLottiePlayer.jsx';

function CustomerQuotationWidget({ project }) {
  if (!project) return null;
  const rawBudget = project.budget || (project.quotation?.total ? `₹${Number(project.quotation.total).toLocaleString('en-IN')}` : '₹15,000');
  const budgetText = typeof rawBudget === 'object' ? (rawBudget.total || rawBudget.amount || 'Standard Budget') : String(rawBudget);

  const rawShootDate = project.shootDate || project.requestedShootDate || 'TBC';
  const shootDateText = typeof rawShootDate === 'object' ? (rawShootDate.date || 'TBC') : String(rawShootDate);

  const rawDelivery = project.estimatedDelivery || '7 Days';
  const deliveryText = typeof rawDelivery === 'object' ? (rawDelivery.time || '7 Days') : String(rawDelivery);

  const rawDeliverables = project.deliverables || project.selectedServices || [project.service || 'Video Ad'];
  const deliverableList = Array.isArray(rawDeliverables) ? rawDeliverables : [rawDeliverables];

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💰 Quotation & Deliverables
        </h4>
        <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(16,185,129,0.12)', color: '#10B981', padding: '3px 8px', borderRadius: '6px' }}>
          Budget: {budgetText}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
        <div>📅 <strong>Shoot Date:</strong> {shootDateText}</div>
        <div>⏱️ <strong>Estimated Delivery:</strong> {deliveryText}</div>
      </div>

      <div style={{ fontSize: '12px', color: '#475569' }}>
        <strong>Included Deliverables:</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
          {deliverableList.map((item, idx) => {
            let label = '';
            if (typeof item === 'string') {
              label = item;
            } else if (item && typeof item === 'object') {
              label = item.name || item.title || item.serviceName || item.service || item.category || item.id || 'Deliverable Item';
            } else {
              label = String(item || 'Deliverable');
            }
            return (
              <span key={idx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#1E293B', fontWeight: '600' }}>
                ✓ {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NotificationCenter({ userId, isOpen, onClose }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const profile = profileService.getProfileById(userId);
    setNotifs((profile?.notifications || []).slice(-20).reverse());
  }, [userId, isOpen]);

  const markRead = (id) => {
    profileService.markNotificationRead(userId, id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose} style={{ zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="admin-modal-content" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', maxWidth: '520px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)', padding: '24px', margin: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-top-header flex-between" style={{ paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 className="modal-title" style={{ fontSize: '17px', fontWeight: '700', color: '#111111', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Bell size={18} style={{ color: '#7C5CFF' }} /> Notifications
          </h3>
          <button className="duolingo-secondary-btn micro-btn" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer' }} onClick={onClose}>Close</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifs.length === 0 && <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>No notifications yet.</div>}
          {notifs.map(n => (
            <div key={n.id} style={{ padding: '12px 14px', border: '1px solid #F1F5F9', borderRadius: '10px', background: n.read ? '#FFFFFF' : '#F8FAFC', borderLeft: n.read ? '1px solid #F1F5F9' : '3px solid #7C5CFF' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', marginBottom: '4px' }}>{n.title || 'System Notification'}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', lineHeight: '1.4' }}>{n.message}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                {!n.read && (
                  <button 
                    className="micro-btn" 
                    style={{ fontSize: '11px', padding: '4px 10px', background: '#7C5CFF', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }} 
                    onClick={() => markRead(n.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsPanel({ userId }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const profile = profileService.getProfileById(userId);
    setNotifs((profile?.notifications || []).slice(-5).reverse());
  }, [userId]);

  const markRead = (id) => {
    profileService.markNotificationRead(userId, id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (!notifs.length) return null;

  return (
    <div className="notifications-panel" style={{ marginBottom: '16px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px' }}>
      <div className="notifs-header" style={{ fontSize: '13px', fontWeight: '700', color: '#111111', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Bell size={15} style={{ color: '#7C5CFF' }} /> Recent Notifications
      </div>
      {notifs.map(n => (
        <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid #F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#111111' }}>{n.title || n.message}</div>
            <div style={{ fontSize: '10px', color: '#6B6B6B' }}>{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
          </div>
          {!n.read && <button className="duolingo-secondary-btn micro-btn" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => markRead(n.id)}>Read</button>}
        </div>
      ))}
    </div>
  );
}

function ProjectWorkspaceCard({ project, onOpenDetails }) {
  if (!project) return null;

  const budgetDisplay = getProjectBudgetDisplay(project);
  const customerNotes = project.customerNotes || [];

  const renderSchedule = () => {
    const services = project.selectedServices && project.selectedServices.length > 0 
      ? project.selectedServices 
      : [project.service || 'Video Production'];

    return services.map(sName => {
      const type = getServiceScheduleType(sName);
      const isShoot = type === 'SHOOT_DATE_REQUEST';
      const req = project.scheduleRequests?.[sName] || {};
      const preferred = req.preferredDate || (isShoot ? project.shootDate : project.deliveryDate);
      if (!preferred) return null;
      
      let formatted = preferred;
      try {
        formatted = new Date(preferred).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } catch (err) {
        // fallback
      }

      return (
        <span className="ws-meta-chip" key={sName}>
          <Calendar size={12} /> {sName} ({isShoot ? 'Shoot' : 'Delivery'}): {formatted}
        </span>
      );
    });
  };

  return (
    <div className="project-status-workspace-card">
      <div className="ws-project-id flex-between">
        <span>{project.id}</span>
        <button className="create-new-link micro-btn" onClick={() => onOpenDetails(project)}>
          Open Full Project Workspace <ChevronRight size={14} />
        </button>
      </div>

      <h2 className="ws-project-title">{project.service}</h2>

      <div className="ws-meta-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px' }}>
        <span className="ws-meta-chip"><span style={{ color: '#34d399', fontWeight: 700 }}>●</span> {project.status || 'Submitted'}</span>
        {renderSchedule()}
        {budgetDisplay && (
          <span className="ws-meta-chip" style={{ borderColor: 'rgba(124,92,255,0.3)', color: '#a78bfa' }}>
            {budgetDisplay}
          </span>
        )}
      </div>

      {/* Shared Operational Timeline */}
      <ProjectTimeline project={project} />

      {/* Customer Visible Progress Notes */}
      {customerNotes.length > 0 && (
        <div className="margin-top-12 customer-notes-preview">
          <div className="text-xs font-semibold text-emerald flex-center-gap margin-bottom-4">
            <CheckCircle2 size={12} /> Latest Progress Update
          </div>
          <div className="text-xs text-white" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
            "{customerNotes[0].text}" — <span className="text-muted">{new Date(customerNotes[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessBrainCard({ brain, onEdit, userId }) {
  if (!brain || !brain.businessName) return null;
  const coverage = typeof brain.aiConfidenceScore === 'number' ? brain.aiConfidenceScore : null;

  const rawColors = brain.brandColors || brain.brandAssets?.colors;
  const initialColors = Array.isArray(rawColors) ? rawColors : (typeof rawColors === 'string' ? rawColors.split(',').map(c => c.trim()).filter(Boolean) : ['#7c5cff', '#00D1FF']);

  const [logoUrl, setLogoUrl] = useState(brain.logoUrl || brain.brandAssets?.logoUrl || null);
  const [brandColors, setBrandColors] = useState(initialColors);
  const [editingColors, setEditingColors] = useState(false);
  const [colorInput, setColorInput] = useState(Array.isArray(initialColors) ? initialColors.join(', ') : '');
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result;
      setLogoUrl(dataUrl);
      if (userId) {
        const profile = profileService.getProfileById(userId) || {};
        const updatedVault = { ...(profile.vault || {}), logoUrl: dataUrl };
        profileService.saveProfile({ ...profile, vault: updatedVault });
        syncService.syncProfile(userId, { vault: updatedVault });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveColors = () => {
    const arr = colorInput.split(',').map(c => c.trim()).filter(Boolean);
    if (arr.length > 0) {
      setBrandColors(arr);
      if (userId) {
        const profile = profileService.getProfileById(userId) || {};
        const updatedVault = { ...(profile.vault || {}), brandColors: arr };
        profileService.saveProfile({ ...profile, vault: updatedVault });
        syncService.syncProfile(userId, { vault: updatedVault });
      }
    }
    setEditingColors(false);
  };

  return (
    <div className="brain-summary-card" style={{ marginBottom: '20px' }}>
      <div className="brain-card-header">
        <div className="brain-card-title-row">
          <Brain size={16} style={{ color: '#7c5cff' }} />
          <span className="brain-card-title">{brain.businessName}</span>
          {coverage !== null && <span className="brain-confidence-badge">Business Context Coverage: {coverage}%</span>}
        </div>
        <button className="brain-edit-btn" onClick={onEdit}>
          <Edit2 size={13} /> Edit Business Profile
        </button>
      </div>

      <div className="brain-fields-grid" style={{ marginBottom: '16px' }}>
        {[
          ['Industry', brain.industry],
          ['Audience', brain.targetAudience],
          ['Stage', brain.businessStage],
          ['Services', Array.isArray(brain.services) ? brain.services.slice(0,3).join(', ') : brain.services],
        ].filter(([,v]) => v).map(([label, val]) => (
          <div key={label} className="brain-field-item">
            <span className="brain-field-label">{label}</span>
            <span className="brain-field-value">{val}</span>
          </div>
        ))}
      </div>

      {/* Brand Identity & Assets Section */}
      <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#00D1FF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          🎨 Existing Brand Identity &amp; Assets
        </h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          
          {/* Logo Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#111111' }}>Logo Design</span>
              <span style={{ fontSize: '10px', color: logoUrl ? '#34d399' : '#9CA3AF', background: logoUrl ? 'rgba(52,211,153,0.15)' : '#E5E7EB', padding: '2px 6px', borderRadius: '4px' }}>
                {logoUrl ? 'DETECTED / UPLOADED' : 'MISSING'}
              </span>
            </div>
            {logoUrl && (
              <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                <img src={logoUrl} alt="Logo" style={{ maxHeight: '36px', maxWidth: '100px', objectFit: 'contain' }} />
              </div>
            )}
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <button className="duolingo-secondary-btn micro-btn" style={{ fontSize: '11px', marginTop: 'auto' }} onClick={() => fileInputRef.current?.click()}>
              <Upload size={12} /> {logoUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
          </div>

          {/* Brand Colors Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#111111' }}>Brand Colors</span>
              <span style={{ fontSize: '10px', color: '#00D1FF', background: 'rgba(0,209,255,0.15)', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minHeight: '32px' }}>
              {(Array.isArray(brandColors) ? brandColors : []).map((col, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: col }} />
                  <span style={{ fontSize: '11px', color: '#111111' }}>{col}</span>
                </div>
              ))}
            </div>
            {editingColors ? (
              <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                <input type="text" className="duolingo-text-input micro-input" style={{ fontSize: '11px', padding: '4px 8px' }} value={colorInput} onChange={e => setColorInput(e.target.value)} placeholder="#hex1, #hex2" />
                <button className="duolingo-submit-btn micro-btn" style={{ padding: '0 8px', height: '28px' }} onClick={handleSaveColors}>Save</button>
              </div>
            ) : (
              <button className="duolingo-secondary-btn micro-btn" style={{ fontSize: '11px', marginTop: 'auto' }} onClick={() => setEditingColors(true)}>
                <Edit2 size={12} /> Edit Brand Colors
              </button>
            )}
          </div>

          {/* Brand Guidelines Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#111111' }}>Brand Guidelines / Fonts</span>
              <span style={{ fontSize: '10px', color: '#6B6B6B', background: '#E5E7EB', padding: '2px 6px', borderRadius: '4px' }}>DOCUMENT</span>
            </div>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0, lineHeight: '1.3' }}>Upload brand guideline PDF or fonts list for team alignment.</p>
            <input type="file" ref={docInputRef} accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={() => alert('Brand Document Uploaded Successfully!')} />
            <button className="duolingo-secondary-btn micro-btn" style={{ fontSize: '11px', marginTop: 'auto' }} onClick={() => docInputRef.current?.click()}>
              <Upload size={12} /> Upload Document
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function ADDIChatStrip({ project, brain, userId, userName: propUserName, products, selectedProductId }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesAreaRef = useRef(null);

  const activeUser = sessionManager.getCurrentUser();
  const profile = userId ? profileService.getProfileById(userId) : null;
  const rawUserName = propUserName || profile?.name || profile?.customerName || activeUser?.name || project?.customerName || '';
  const resolvedUserName = (rawUserName && rawUserName.trim().toLowerCase() !== 'customer' && rawUserName.trim().toLowerCase() !== 'user')
    ? rawUserName.trim()
    : 'there';

  const rawBizName = brain?.businessName || profile?.businessBrain?.businessName || 'your business';
  const cleanBizName = rawBizName.includes(' - ') ? rawBizName.split(' - ')[0].trim() : rawBizName;
  const businessName = cleanBizName.length > 50 ? cleanBizName.slice(0, 48) + '...' : cleanBizName;

  const scrollChatContainerOnly = () => {
    setTimeout(() => {
      if (chatMessagesAreaRef.current) {
        chatMessagesAreaRef.current.scrollTop = chatMessagesAreaRef.current.scrollHeight;
      }
    }, 50);
  };

  const syncChatFromStorageAndBackend = async () => {
    if (!userId) return;
    const allLocal = profileService.getAllProfiles() || [];
    const userProf = profileService.getProfileById(userId) ||
      allLocal.find(p => p.customerId === userId || (p.phoneNumber && userId.includes(p.phoneNumber.slice(-10))));

    let chatList = userProf?.chatHistory || [];

    // Also fetch latest backend chat messages
    try {
      const backendMsgs = await apiService.fetchChatMessages({ userId });
      if (Array.isArray(backendMsgs) && backendMsgs.length > 0) {
        const merged = [...chatList];
        backendMsgs.forEach(bm => {
          const msgContent = bm.content || bm.text || '';
          if (msgContent && !merged.some(m => m.id === bm.id || ((m.text === msgContent || m.content === msgContent) && Math.abs(new Date(m.timestamp) - new Date(bm.timestamp)) < 10000))) {
            merged.push({
              id: bm.id,
              sender: bm.senderRole === 'ADMIN' ? 'admin' : (bm.senderId === userId ? 'user' : 'assistant'),
              senderName: bm.senderRole === 'ADMIN' ? 'Admin Team' : 'ADDI',
              text: msgContent,
              content: msgContent,
              timestamp: bm.timestamp
            });
          }
        });
        merged.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
        chatList = merged;
      }
    } catch (err) {
      // fallback to local profile
    }

    // Also merge project chat messages if a project is active
    if (project && Array.isArray(project.chat)) {
      project.chat.forEach(c => {
        const text = c.text || c.content || '';
        if (text && !chatList.some(m => m.id === c.id || m.text === text || m.content === text)) {
          const isAdmin = c.senderRole === 'Admin' || c.senderType === 'admin' || c.senderId === 'admin_team';
          chatList.push({
            id: c.id || `proj_${Math.random()}`,
            sender: isAdmin ? 'admin' : (c.senderId === userId ? 'user' : 'assistant'),
            role: isAdmin ? 'admin' : (c.senderId === userId ? 'user' : 'assistant'),
            senderName: c.senderName || (isAdmin ? 'Admin Team' : 'ADDI'),
            text: text,
            content: text,
            timestamp: c.timestamp || new Date().toISOString()
          });
        }
      });
      chatList.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
    }

    if (chatList.length > 0) {
      const mapped = chatList.map(m => {
        const isAdmin = m.sender === 'admin' || m.role === 'admin' || m.senderRole === 'Admin' || m.senderType === 'admin' || (m.senderName && m.senderName.toLowerCase().includes('admin'));
        return {
          id: m.id || `msg_${Math.random()}`,
          role: isAdmin ? 'admin' : ((m.sender === 'user' || m.role === 'user') ? 'user' : 'assistant'),
          senderName: isAdmin ? (m.senderName || 'Admin Team') : ((m.sender === 'user' || m.role === 'user') ? resolvedUserName : 'ADDI'),
          text: m.text || m.content || '',
          counterProposal: m.counterProposal || null
        };
      });

      setMessages(prev => {
        if (
          prev.length === mapped.length &&
          prev.every((p, idx) => p.id === mapped[idx].id && p.text === mapped[idx].text && p.role === mapped[idx].role && p.counterProposal === mapped[idx].counterProposal)
        ) {
          return prev;
        }
        return mapped;
      });

      // Mark incoming Admin messages as read by customer
      if (userProf && userProf.chatHistory && userProf.chatHistory.some(c => (c.sender === 'admin' || c.role === 'admin' || c.senderRole === 'Admin') && !c.read)) {
        const updatedHistory = userProf.chatHistory.map(c => {
          if ((c.sender === 'admin' || c.role === 'admin' || c.senderRole === 'Admin') && !c.read) {
            return { ...c, read: true, readAt: new Date().toISOString() };
          }
          return c;
        });
        profileService.saveProfile({ ...userProf, chatHistory: updatedHistory });
      }
    } else {
      const initialGreeting = resolvedUserName !== 'there'
        ? `Hi ${resolvedUserName}! 👋 I'm ADDI, your AI Creative Strategist. I can assist with shoot schedules, drone footage, budget adjustments, branding, reels, or package updates for ${businessName}. What would you like to work on today?`
        : `Hi! 👋 I'm ADDI, your AI Creative Strategist. I can assist with shoot schedules, drone footage, budget adjustments, branding, reels, or package updates for ${businessName}. What would you like to work on today?`;
      setMessages(prev => {
        if (prev.length === 1 && prev[0].text === initialGreeting) return prev;
        return [{ role: 'assistant', text: initialGreeting, senderName: 'ADDI' }];
      });
    }
  };

  const handleAcceptProposal = (proposal) => {
    try {
      if (proposal.projectId) {
        updateProjectInStore(proposal.projectId, {
          shootDate: proposal.proposedShootDate,
          budget: proposal.proposedBudget ? `₹${Number(proposal.proposedBudget).toLocaleString('en-IN')}` : '₹15,000',
          status: 'Approved',
          lifecycleStage: 'Approved'
        }, { actor: 'Customer', role: 'Customer' });
      }

      const allProfiles = profileService.getAllProfiles();
      allProfiles.forEach(prof => {
        const chat = (prof.chatHistory || []).map(c => {
          if (c.counterProposal && (c.counterProposal.reqId === proposal.reqId || c.counterProposal.projectId === proposal.projectId)) {
            return { ...c, counterProposal: { ...c.counterProposal, status: 'accepted' } };
          }
          return c;
        });

        chat.push({
          id: `msg_cust_${Date.now()}`,
          sender: 'user',
          role: 'user',
          text: '✓ I accepted the proposed date and budget changes. Let us proceed!',
          timestamp: new Date().toISOString()
        });

        chat.push({
          id: `msg_addi_${Date.now()}`,
          sender: 'admin',
          role: 'admin',
          text: '🎉 Awesome! Proposal confirmed. Your project status is now LIVE in Strategy Preparation!',
          timestamp: new Date().toISOString()
        });

        const updated = profileService.saveProfile({ ...prof, chatHistory: chat });
        syncService.syncProfile(prof.userId, updated);
      });

      try {
        localStorage.removeItem('ADDUS_LATEST_PROPOSAL_GLOBAL');
        if (proposal.projectId) localStorage.removeItem(`ADDUS_LATEST_PROPOSAL_${proposal.projectId}`);
      } catch {}

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

      if (proposal.projectId) {
        updateProjectInStore(proposal.projectId, {
          status: 'Customer Rejected',
          rejectionReason: reason,
          customerNote: `Declined proposal. Reason: ${reason}`
        }, { actor: 'Customer', role: 'Customer' });
      }

      const allProfiles = profileService.getAllProfiles();
      allProfiles.forEach(prof => {
        const chat = (prof.chatHistory || []).map(c => {
          if (c.counterProposal && (c.counterProposal.reqId === proposal.reqId || c.counterProposal.projectId === proposal.projectId)) {
            return { ...c, counterProposal: { ...c.counterProposal, status: 'rejected', rejectionReason: reason } };
          }
          return c;
        });

        chat.push({
          id: `msg_cust_${Date.now()}`,
          sender: 'user',
          role: 'user',
          text: `✕ I declined the proposed date/budget. Reason: "${reason}". Please modify and resend.`,
          timestamp: new Date().toISOString()
        });

        chat.push({
          id: `msg_addi_${Date.now()}`,
          sender: 'admin',
          role: 'admin',
          text: `Understood! We have notified the Admin team with your feedback ("${reason}"). They will modify the project details and resend a revised proposal to you shortly.`,
          timestamp: new Date().toISOString()
        });

        const updated = profileService.saveProfile({ ...prof, chatHistory: chat });
        syncService.syncProfile(prof.userId, updated);
      });

      // Dispatch high-priority notification to Admin
      NotificationEngine.notify({
        userId: 'admin',
        role: 'Admin',
        type: 'proposal_rejected',
        title: '⚠️ Proposal Declined by Customer',
        message: `Customer declined proposal for "${proposal.projectName || 'Project'}". Reason: "${reason}". Click to re-edit & resend.`,
        priority: 'high',
        deepLink: '/admin?tab=approvals'
      });

      try {
        localStorage.removeItem('ADDUS_LATEST_PROPOSAL_GLOBAL');
        if (proposal.projectId) localStorage.removeItem(`ADDUS_LATEST_PROPOSAL_${proposal.projectId}`);
      } catch {}

      window.dispatchEvent(new CustomEvent('addus_chat_updated'));
      window.dispatchEvent(new CustomEvent('addus_profile_updated'));
      window.dispatchEvent(new CustomEvent('addus_approvals_updated'));
      window.dispatchEvent(new CustomEvent('addus_projects_updated'));

      alert('Feedback sent! Admin has been notified to modify the details and resend.');
    } catch (e) {
      console.warn('Reject proposal error:', e);
    }
  };

  useEffect(() => {
    syncChatFromStorageAndBackend();
    const interval = setInterval(syncChatFromStorageAndBackend, 3000);
    window.addEventListener('addus_profile_updated', syncChatFromStorageAndBackend);
    window.addEventListener('addus_chat_updated', syncChatFromStorageAndBackend);

    return () => {
      clearInterval(interval);
      window.removeEventListener('addus_profile_updated', syncChatFromStorageAndBackend);
      window.removeEventListener('addus_chat_updated', syncChatFromStorageAndBackend);
    };
  }, [userId, resolvedUserName, businessName]);

  const saveChatMessage = async (sender, text) => {
    if (!userId) return;
    const userProf = profileService.getProfileById(userId);
    if (!userProf) return;
    const chat = userProf.chatHistory || [];
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sender: sender === 'user' ? 'user' : 'ai',
      senderName: sender === 'user' ? resolvedUserName : 'ADDI',
      text,
      timestamp: new Date().toISOString()
    };
    const updatedChat = [...chat, newMsg];
    const updatedProfile = profileService.saveProfile({ ...userProf, chatHistory: updatedChat });
    syncService.syncProfile(userId, updatedProfile);

    // Sync to backend chat store so Admin sees it in AdminChatTab
    try {
      if (sender === 'user') {
        await apiService.sendChatMessage({
          recipientId: 'admin',
          content: text,
          conversationId: `admin_${userId}`,
          senderId: userId,
          senderName: resolvedUserName
        });
      }
    } catch (err) {
      console.warn('Backend chat sync notice:', err);
    }

    // Mirror to active project chat if a project is active!
    if (project && project.id) {
      const projectChat = project.chat || [];
      const mirroredMsg = {
        id: newMsg.id,
        senderId: sender === 'user' ? userId : 'addi_bot',
        senderName: sender === 'user' ? (resolvedUserName !== 'there' ? resolvedUserName : 'Customer') : 'ADDI',
        senderRole: sender === 'user' ? 'Customer' : 'AI Strategist',
        text,
        timestamp: newMsg.timestamp,
        isInternal: false
      };
      updateProjectInStore(project.id, { chat: [...projectChat, mirroredMsg] });
    }
  };

  const SUGGESTIONS = [
    'Can we change the shoot date?',
    'Add drone footage',
    'Need more reels',
    'Reduce budget',
    'Add photography too',
    'I also need branding',
  ];

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsgText = text.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsgText, senderName: resolvedUserName }]);
    setInput('');
    setIsTyping(true);
    scrollChatContainerOnly();

    await saveChatMessage('user', userMsgText);

    try {
      const clean = userMsgText.trim();
      const lower = clean.toLowerCase();

      // 1. Filter out gibberish, single syllables, or non-meaningful words (e.g. "ho", "hui", "asdf", "lol", "ok")
      const isVeryShort = clean.length < 3;
      const isSingleSyllableOrNoise = /^(ho|hui|ha|he|hihi|haha|hmm|hm|umm|um|uh|uhh|lol|asdf|qwerty|zzz|test|xyz|abc|aaa|bbb|ccc|ddd|eee|fff|ggg)$/i.test(clean);
      const isRandomConsonants = /^[^aeiou\s]{4,}$/i.test(clean) || /(.)\1{3,}/.test(clean);

      let botReply = '';
      let shouldNotifyAdmin = false;
      let intent = 'General Request';

      if ((isVeryShort && !['hi', 'ok', 'no'].includes(lower)) || isSingleSyllableOrNoise || isRandomConsonants) {
        botReply = `I didn't quite catch that! 😊 Could you please tell me what you'd like to work on for ${businessName}? I can assist with booking video shoots, photo shoots, branding & logo design, social media reels, website creation, or updating your projects.`;
        shouldNotifyAdmin = false;
      } else if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|yo|namaste|greetings)(\s|$|[!.,?])/i.test(lower)) {
        botReply = resolvedUserName !== 'there'
          ? `Hi ${resolvedUserName}! 👋 I'm ADDI, your AI Creative Strategist. I can assist with shoot schedules, drone footage, budget adjustments, branding, reels, or package updates for ${businessName}. What would you like to work on today?`
          : `Hi there! 👋 I'm ADDI, your AI Creative Strategist. I can assist with shoot schedules, drone footage, budget adjustments, branding, reels, or package updates for ${businessName}. What would you like to work on today?`;
        shouldNotifyAdmin = false;
      } else if (/^(ok|okay|cool|great|thanks|thank you|thx|perfect|got it|noted|sure|awesome|done|fine)(\s|$|[!.,?])/i.test(lower)) {
        botReply = `You're very welcome! Feel free to ask anytime if you want to launch a new shoot, add services, or adjust your project for ${businessName}. 🚀`;
        shouldNotifyAdmin = false;
      } else if (lower.includes('what service') || lower.includes('what do you do') || lower.includes('how does it work') || (lower.includes('pricing') && !lower.includes('reduce'))) {
        botReply = `At ADDUS, we provide 8 high-impact creative services tailored for ${businessName}:\n\n🎥 **Video Shoot & Commercials** (Commercials, social media reels, corporate films)\n📸 **Photo Shoot** (Product photography, brand visuals & team portraits)\n🎨 **Branding & Logo** (Logos, visual identity, and brand guidelines)\n📱 **Social Media Management** (Content calendars, daily reels & posts)\n📢 **Paid Advertisements** (Meta ads & Google ad creatives)\n📈 **Marketing Strategy** (Growth roadmaps & brand positioning)\n🌐 **High-Converting Website** (Custom landing pages & web portals)\n📦 **Packaging Design** (Custom labels & dieline proofs)\n\nWhich of these would you like to explore for ${businessName}?`;
        shouldNotifyAdmin = false;
      } else {
        // Classify genuine project request intents
        if (lower.includes('shoot date') || lower.includes('change date') || lower.includes('reschedule') || lower.includes('schedule')) {
          intent = 'Change Shoot Date';
        } else if (lower.includes('drone') || lower.includes('aerial')) {
          intent = 'Add Drone Footage';
        } else if (lower.includes('reel') || lower.includes('video') || lower.includes('videoshoot')) {
          intent = 'Video Production / Reels';
        } else if (lower.includes('budget') || lower.includes('reduce') || lower.includes('price') || lower.includes('cost')) {
          intent = 'Budget Adjustment';
        } else if (lower.includes('photo') || lower.includes('photography')) {
          intent = 'Add Photography';
        } else if (lower.includes('brand') || lower.includes('logo')) {
          intent = 'Branding & Logo';
        } else if (lower.includes('website') || lower.includes('web')) {
          intent = 'Website Development';
        } else if (lower.includes('packaging')) {
          intent = 'Packaging Design';
        } else {
          intent = 'Project Customization';
        }

        botReply = `Got it! 🚀 I have logged your request regarding **${intent}** ("${userMsgText}") for ${businessName}. Your request has been forwarded directly to our expert review team. They will evaluate it and get back to you with updated options on your dashboard shortly!`;
        shouldNotifyAdmin = true;
      }

      if (shouldNotifyAdmin) {
        const revId = `rev_${Date.now()}`;
        const newRevRequest = {
          id: revId,
          type: intent,
          details: userMsgText,
          requestedAt: new Date().toISOString(),
          status: 'pending',
          customerId: userId,
          customerName: resolvedUserName !== 'there' ? resolvedUserName : (businessName || 'Customer'),
          projectId: project?.id || `proj_${userId}`,
          projectName: project?.service || project?.title || `${businessName} Campaign`,
          impact: {
            timeline: intent.includes('Date') || intent.includes('Shoot') ? 'Schedule Reschedule' : '+2-3 Days',
            budget: intent.includes('Budget') ? 'Adjustment Requested' : (intent.includes('Drone') || intent.includes('Reels') || intent.includes('Photo') || intent.includes('Brand') ? 'Add-on Estimate' : 'Standard')
          }
        };

        if (project) {
          const existingRevs = project.revisionRequests || [];
          updateProjectInStore(project.id, {
            revisionRequests: [newRevRequest, ...existingRevs]
          });
        }

        // Also record on user profile
        try {
          if (userId) {
            const prof = profileService.getProfileById(userId);
            if (prof) {
              const profRevs = prof.revisionRequests || [];
              const updatedProf = profileService.saveProfile({
                ...prof,
                revisionRequests: [newRevRequest, ...profRevs]
              });
              syncService.syncProfile(userId, updatedProf);
            }
          }
        } catch (profErr) {
          console.warn('Profile rev save notice:', profErr);
        }

        // Dispatch High-Priority Notification to Admin
        NotificationEngine.dispatchNotification({
          userId: 'admin',
          role: 'Admin',
          type: 'customer_action_required',
          title: `⚡ Action Required: ${resolvedUserName !== 'there' ? resolvedUserName : 'Customer'}`,
          message: `${resolvedUserName !== 'there' ? resolvedUserName : 'Customer'} (${businessName}) requested: "${userMsgText}" [Intent: ${intent}]`,
          priority: 'high',
          deepLink: '/admin?tab=approvals'
        });

        // Store in local action popup queue for immediate Admin Dashboard popup
        try {
          const popupQueue = JSON.parse(localStorage.getItem('ADDUS_ADMIN_POPUP_QUEUE') || '[]');
          popupQueue.unshift({
            id: revId,
            customerName: resolvedUserName !== 'there' ? resolvedUserName : 'Customer',
            businessName: businessName,
            requestText: userMsgText,
            intent: intent,
            timestamp: new Date().toISOString(),
            status: 'pending',
            unread: true
          });
          localStorage.setItem('ADDUS_ADMIN_POPUP_QUEUE', JSON.stringify(popupQueue.slice(0, 10)));
          window.dispatchEvent(new CustomEvent('addus_admin_action_popup', { detail: popupQueue[0] }));
        } catch (err) {
          console.warn('Action popup dispatch error:', err);
        }

        window.dispatchEvent(new CustomEvent('addus_approvals_updated'));
      }

      setMessages(prev => [...prev, { role: 'assistant', text: botReply, senderName: 'ADDI' }]);
      saveChatMessage('assistant', botReply);
    } catch {
      const fallbackReply = "Got it! Your message has been sent to our expert team. They will evaluate it and get back to you shortly!";
      setMessages(prev => [...prev, { role: 'assistant', text: fallbackReply, senderName: 'ADDI' }]);
      saveChatMessage('assistant', fallbackReply);
    } finally { setIsTyping(false); }
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto 12px auto' }}>
      {/* 1ST: Message Showing Box (Expanded Chat History & Suggestions) */}
      {(expanded || messages.length > 0) && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
        }}>
          <div className="flex-between" style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="addi-strip-avatar" style={{ background: '#F3E8FF', color: '#7C5CFF', padding: '4px', borderRadius: '50%' }}><Sparkles size={14} /></div>
              <span style={{ fontWeight: '700', fontSize: '13px', color: '#1E293B' }}>ADDI &amp; Admin Support</span>
            </div>
            <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '12px' }}>Close</button>
          </div>

          <div ref={chatMessagesAreaRef} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {messages.map((m, i) => {
              const isAdmin = m.role === 'admin' || m.senderName?.toLowerCase().includes('admin');
              const isUser = m.role === 'user';
              return (
                <div key={m.id || i} style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', width: '100%' }}>
                  <span style={{ fontSize: '10px', color: isAdmin ? '#7C5CFF' : (isUser ? '#64748B' : '#0284C7'), marginBottom: '2px', fontWeight: '600' }}>
                    {isAdmin ? '🛡️ Admin Team' : (isUser ? '👤 You' : '🤖 ADDI')}
                  </span>
                  <div style={{
                    background: isUser ? '#7C5CFF' : (isAdmin ? '#F3E8FF' : '#F8FAFC'),
                    borderRadius: isUser ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                    padding: '8px 12px', maxWidth: '85%', fontSize: '13px', color: isUser ? '#FFFFFF' : '#1E293B', border: isUser ? 'none' : '1px solid #E2E8F0'
                  }}>
                    {m.text}
                  </div>

                  {m.counterProposal && (
                    <div 
                      style={{
                        background: 'linear-gradient(135deg, #1E1E2E, #161622)',
                        border: '1px solid rgba(124, 92, 255, 0.4)',
                        borderRadius: '14px',
                        padding: '14px',
                        marginTop: '6px',
                        color: '#FFF',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        maxWidth: '90%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                        <Sparkles size={14} color="#7C5CFF" />
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFF' }}>
                          📋 ADDUS Admin Counter-Proposal
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#D1D5DB', marginBottom: '10px' }}>
                        <div>📅 Proposed Shoot Date: <strong style={{ color: '#00D1FF' }}>{m.counterProposal.proposedShootDate}</strong></div>
                        <div>💰 Proposed Budget: <strong style={{ color: '#10B981' }}>₹{Number(m.counterProposal.proposedBudget).toLocaleString('en-IN')}</strong></div>
                        {m.counterProposal.adminNote && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#9CA3AF', background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '6px' }}>
                            "{m.counterProposal.adminNote}"
                          </div>
                        )}
                      </div>

                      {m.counterProposal.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleAcceptProposal(m.counterProposal)}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              background: 'linear-gradient(135deg, #10B981, #059669)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#FFF',
                              fontSize: '11px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            ✓ Accept Admin Proposal
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectProposal(m.counterProposal)}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              color: '#EF4444',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            ✕ Reject Proposal
                          </button>
                        </div>
                      ) : m.counterProposal.status === 'accepted' ? (
                        <div style={{ padding: '6px 10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#10B981', fontSize: '11px', fontWeight: '800', textAlign: 'center' }}>
                          ✅ Proposal Accepted — Project is LIVE
                        </div>
                      ) : (
                        <div style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#EF4444', fontSize: '11px', fontWeight: '800', textAlign: 'center' }}>
                          ❌ Proposal Declined — Admin Notified to Modify Details
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2ND: Message Typing Box / Keyboard Input Pill Bar */}
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '50px',
          padding: '8px 12px 8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          transition: 'all 0.2s ease'
        }}
      >
        <button 
          type="button"
          onClick={() => setExpanded(!expanded)}
          title="Toggle Chat View"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <Plus size={18} color="#64748B" />
        </button>

        <input
          type="text"
          placeholder="Ask ADDI or message admin team..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { sendMessage(input.trim()); setExpanded(true); } }}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontSize: '15px',
            color: '#1E293B'
          }}
        />

        <button 
          type="button"
          disabled={!input.trim() || isTyping}
          onClick={() => { sendMessage(input.trim()); setExpanded(true); }}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: input.trim() ? '#7C5CFF' : '#F1F5F9',
            color: input.trim() ? '#FFFFFF' : '#94A3B8',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export function DashboardPage({ showToast, onToastDismiss }) {
  const { state, updateState, resetState } = useOnboardingStore();
  const { projects, createDraftProject, reloadProjects } = useProjectStore();
  const [activeTab, setActiveTab] = useState('home');
  const [profileSubTab, setProfileSubTab] = useState('personal');
  const [projectsFilter, setProjectsFilter] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [toast, setToast] = useState(showToast || '');
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);
  const [showStylePreview, setShowStylePreview] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState('All');

  const session = sessionManager.getSession();
  const userId = session?.userId || state.userId;
  
  // Load dashboard data through centralized service
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const data = await dashboardService.getDashboardData();
        if (cancelled || !data) return;

        const localProfile = profileService.getProfileById(userId) || {};

        const mergedProfile = {
          ...localProfile,
          businessName: data.businessProfile.businessName ?? localProfile.businessName,
          industry: data.businessProfile.industry ?? localProfile.industry,
          businessStage: data.businessProfile.businessStage ?? localProfile.businessStage,
          businessDescription: data.businessProfile.businessDescription ?? localProfile.businessDescription,
          services: data.businessProfile.services?.length > 0 ? data.businessProfile.services : (localProfile.services || []),
          targetAudience: data.businessProfile.targetAudience ?? localProfile.targetAudience,
          website: data.businessProfile.website ?? localProfile.website,
          brandAssets: data.businessProfile.brandAssets ?? localProfile.brandAssets,
          aiConfidenceScore: data.businessProfile.aiConfidenceScore ?? localProfile.aiConfidenceScore,
          conversationStatus: data.businessProfile.conversationStatus ?? localProfile.conversationStatus,
          chatHistory: localProfile.chatHistory,
          projects: data.projects.length > 0 ? data.projects.map(p => ({
            ...p,
            id: p.projectId,
            service: p.service,
            status: p.status,
            createdAt: p.createdAt,
            submittedAt: p.submittedAt
          })) : (localProfile.projects || []),
          conversations: localProfile.conversations,
          notifications: data.notifications.length > 0 ? data.notifications.map(n => ({
            ...n,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt
          })) : (localProfile.notifications || []),
          ...data.businessProfile
        };

        updateState({ businessProfile: mergedProfile });
      } catch (err) {
        console.warn('[Dashboard] Failed to load dashboard data:', err);
      } finally {
        cancelled = true;
      }
    };

    loadDashboard();
  }, [userId]);

  const userProfile = userId ? profileService.getProfileById(userId) : null;
  const brain = userProfile?.businessBrain || state.businessProfile || {};
  const expertStatus = userProfile?.expertReviewStatus || state.expertReviewStatus;
  const expertSubmitted = userProfile?.expertReviewSubmittedAt || state.expertReviewSubmittedAt;
  const expertCompleted = userProfile?.expertReviewCompletedAt || state.expertReviewCompletedAt;
  const expertNotes = userProfile?.expertNotes ?? '';
  const products = userProfile?.products || [];
  const unreadNotifications = (userProfile?.notifications || []).filter(n => !n.read).length;

  // Persist session to last screen
  useEffect(() => {
    if (userId) {
      sessionManager.updateLastVisitedScreen('dashboard');
    }
  }, [userId]);

  // Sync projects to backend vault whenever they change
  useEffect(() => {
    if (!userId || !Array.isArray(projects)) return;
    syncService.syncProjects(userId, projects);
  }, [userId, projects]);

  // Sync profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      reloadProjects();
    };
    window.addEventListener('addus_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('addus_profile_updated', handleProfileUpdate);
  }, [reloadProjects]);

  useEffect(() => {
    if (showToast) setToast(showToast);
  }, [showToast]);

  const latestProject = projects.length > 0 ? projects[0] : null;

  // Customer Dashboard Widgets
  const pendingReviewsCount = projects.filter(p => ['Customer Review', 'Waiting for Customer Approval'].includes(p.status)).length;
  const upcomingDeliveriesCount = projects.filter(p => !['Delivered', 'Archived'].includes(p.status)).length;
  const recentUpdatesCount = projects.reduce((acc, p) => acc + (p.customerNotes || []).length, 0);

  const allUpdates = [];
  projects.forEach(p => {
    const notes = p.customerNotes || [];
    notes.forEach(n => {
      allUpdates.push({
        projectId: p.id,
        projectService: p.service,
        id: n.id,
        text: n.text,
        author: n.author,
        createdAt: n.createdAt
      });
    });
  });
  allUpdates.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
  };

  const updateProfile = (patch) => {
    if (!userId) return;
    const profile = profileService.getProfileById(userId);
    if (!profile) return;
    const updated = { ...profile, ...patch };
    const saved = profileService.saveProfile(updated);
    syncService.syncProfile(userId, saved);
    window.dispatchEvent(new CustomEvent('addus_profile_updated'));
  };

  const getDynamicQuickActions = () => {
    return [
      {
        id: 'video_shoot',
        category: '🎥 Video Shoot',
        exploreLabel: 'Video Shoot',
        icon: Video,
        color: '#7C5CFF',
        description: 'Commercials, social media reels, and corporate films.'
      },
      {
        id: 'photo_shoot',
        category: '📸 Photo Shoot',
        exploreLabel: 'Photo Shoot',
        icon: Camera,
        color: '#00D1FF',
        description: 'Product photography, brand visuals, and team portraits.'
      },
      {
        id: 'branding_logo',
        category: '🎨 Branding & Logo',
        exploreLabel: 'Branding & Logo',
        icon: Palette,
        color: '#EC4899',
        description: 'Logos, color themes, visual identity, and brand guidelines.'
      },
      {
        id: 'social_media',
        category: '📱 Social Media Management',
        exploreLabel: 'Social Media Management',
        icon: Share2,
        color: '#F59E0B',
        description: 'Content calendars, daily posts, and profile growth.'
      },
      {
        id: 'paid_ads',
        category: '📢 Paid Advertisements',
        exploreLabel: 'Paid Advertisements',
        icon: Megaphone,
        color: '#EF4444',
        description: 'Meta ads, Google ads, and billboard designs.'
      },
      {
        id: 'marketing_strategy',
        category: '📈 Marketing Strategy',
        exploreLabel: 'Marketing Strategy',
        icon: TrendingUp,
        color: '#10B981',
        description: 'Business growth planning, SEO, and email campaigns.'
      },
      {
        id: 'editing',
        category: '✂️ Video & Photo Editing',
        exploreLabel: 'Video & Photo Editing',
        icon: Scissors,
        color: '#8B5CF6',
        description: 'Turning raw footage into polished reels, videos, and retouched photos.'
      },
      {
        id: 'packaging_design',
        category: '📦 Product & Packaging Design',
        exploreLabel: 'Product & Packaging Design',
        icon: Package,
        color: '#6366F1',
        description: 'Designing website UI/UX layouts and physical product packages.'
      },
      {
        id: 'launch_campaign',
        category: '🚀 Product Launch Campaign',
        exploreLabel: 'Product Launch Campaign',
        icon: Rocket,
        color: '#F43F5E',
        description: 'Big promotional rollouts and seasonal sales activations.'
      },
      {
        id: 'copywriting',
        category: '✍️ Content & Copywriting',
        exploreLabel: 'Content & Copywriting',
        icon: FileText,
        color: '#38BDF8',
        description: 'Website text, blogs, video scripts, and social media captions.'
      },
      {
        id: 'influencer_sourcing',
        category: '🪄 Influencer & Talent Sourcing',
        exploreLabel: 'Influencer & Talent Sourcing',
        icon: Sparkles,
        color: '#A855F7',
        description: 'Connecting your brand with matching creators, models, and influencers.'
      }
    ];
  };

  const handleQuickAction = (action) => {
    setGalleryCategory(action.category || action.exploreLabel || 'All');
    setActiveTab('gallery');
  };

  const usedCategories = [];
  const allServicesUsed = new Set();
  projects.forEach(p => {
    const services = p.selectedServices && p.selectedServices.length > 0 ? p.selectedServices : [p.service || ''];
    services.forEach(s => {
      const lower = s.toLowerCase();
      if (lower.includes('video') || lower.includes('film') || lower.includes('explainer') || lower.includes('cinema')) {
        allServicesUsed.add('Video Production');
      } else if (lower.includes('photo') || lower.includes('camera') || lower.includes('shoot')) {
        allServicesUsed.add('Photography');
      } else if (lower.includes('logo')) {
        allServicesUsed.add('Logo Design');
      } else if (lower.includes('branding') || lower.includes('identity')) {
        allServicesUsed.add('Branding');
      } else if (lower.includes('packaging')) {
        allServicesUsed.add('Packaging Design');
      } else if (lower.includes('website') || lower.includes('web')) {
        allServicesUsed.add('Website Development');
      } else if (lower.includes('ui') || lower.includes('ux') || lower.includes('experience')) {
        allServicesUsed.add('UI/UX Design');
      } else if (lower.includes('content') || lower.includes('marketing') || lower.includes('social') || lower.includes('graphic')) {
        allServicesUsed.add('Content & Marketing');
      }
    });
  });
  const usedServicesList = Array.from(allServicesUsed);

  const userNameText = userProfile?.name || state.name || latestProject?.customerName || 'there';
  const greetingHeadline = userNameText !== 'there' ? `Hi, ${userNameText} 👋` : 'Hi there 👋';

  if (activeTab === 'projects') {
    return (
      <div className="dashboard-viewport fade-in">
        <ProjectsTab onCreateNew={() => setActiveTab('home')} defaultFilter={projectsFilter} />
      </div>
    );
  }

  if (activeTab === 'gallery') {
    return (
      <div className="dashboard-viewport fade-in">
        <CustomerGalleryView 
          selectedCategory={galleryCategory} 
          onBack={() => setActiveTab('home')}
          onBookPackage={(payload) => {
            createDraftProject(payload);
            setToast('Project Created Successfully 🎉');
            setActiveTab('home');
          }}
        />
      </div>
    );
  }

  if (activeTab === 'products') {
    return (
      <div className="dashboard-viewport fade-in">
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111111' }}>Products</h2>
            <button className="duolingo-primary-btn micro-btn" onClick={() => {
              const name = prompt('Product name:');
              if (!name) return;
              const category = prompt('Product category (optional):') || '';
              const description = prompt('Product description (optional):') || '';
              const added = profileService.addProduct(userId, { name, category, description });
              if (added) syncService.syncProfile(userId, added);
              reloadProjects();
              setToast('Product added');
            }}>+ Add Product</button>
          </div>
          {products.length === 0 && (
            <div className="empty-state-card flex-center" style={{ padding: '40px 20px', background: '#FFFFFF', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '12px' }}>
              <Package size={32} className="empty-icon" style={{ color: '#7C5CFF' }} />
              <p className="empty-state-text" style={{ fontSize: '15px', fontWeight: '600', marginTop: '8px' }}>No products yet.</p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '4px', textAlign: 'center' }}>Add products to create product-specific projects and ADDI conversations.</p>
            </div>
          )}
          <div style={{ display: 'grid', gap: '12px' }}>
            {products.map(p => (
              <div key={p.productId} className="admin-card" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
                <div className="flex-between">
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111111', margin: '0 0 4px 0' }}>{p.name}</h3>
                    {p.category && <span style={{ fontSize: '12px', color: '#6B6B6B' }}>{p.category}</span>}
                    {p.description && <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '8px 0 0 0' }}>{p.description}</p>}
                  </div>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <button className="duolingo-secondary-btn micro-btn" onClick={() => {
                       const newName = prompt('Product name:', p.name);
                       if (!newName) return;
                       const updated = profileService.updateProduct(userId, p.productId, { name: newName });
                       if (updated) syncService.syncProfile(userId, updated);
                       setToast('Product updated');
                     }}>Edit</button>
                     <button className="duolingo-secondary-btn micro-btn" style={{ borderColor: '#EF4444', color: '#EF4444' }} onClick={() => {
                       if (confirm('Delete this product?')) {
                         const updated = profileService.deleteProduct(userId, p.productId);
                         if (updated) syncService.syncProfile(userId, updated);
                         setToast('Product deleted');
                       }
                     }}>Delete</button>
                   </div>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#6B7280', background: '#F9FAFB', padding: '4px 10px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    Projects: {projects.filter(pr => pr.productId === p.productId).length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderDrawer = () => {
    return (
      <HamburgerDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userName={userNameText}
        businessName={brain?.businessName || 'Your Business'}
        onLogout={() => { authService.logout(); resetState(); window.location.reload(); }} 
      />
    );
  };

  const renderActivityFeedDrawer = () => {
    if (!isActivityOpen) return null;
    return (
      <div className="admin-modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.5)' }} onClick={() => setIsActivityOpen(false)}>
        <div className="hamburger-drawer-panel" style={{ right: 0, left: 'auto', width: '360px', maxWidth: '90vw', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '0 0 0 16px', boxShadow: '-8px 0 24px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
          <div className="drawer-header flex-between" style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111111', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} style={{ color: '#10B981' }} /> Activity Updates
            </h3>
            <button className="duolingo-secondary-btn micro-btn" onClick={() => setIsActivityOpen(false)}>Close</button>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '80vh' }}>
            {allUpdates.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#6B6B6B', padding: '10px 0', textAlign: 'center' }}>No recent updates published yet.</div>
            ) : (
              allUpdates.map(up => (
                <div key={up.id} style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '8px', borderLeft: '3px solid #10B981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6B6B6B', marginBottom: '2px' }}>
                    <strong>{up.projectId} · {up.projectService}</strong>
                    <span>{new Date(up.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#111111' }}>"{up.text}"</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  if (activeTab === 'profile') {
    return (
      <div className="dashboard-viewport fade-in">
        <ProfileTab 
          userProfile={userProfile} 
          brain={brain} 
          userId={userId} 
          onBack={() => setActiveTab('home')} 
          onSaveProfile={(patch) => updateProfile(patch)} 
        />
      </div>
    );
  }

  if (activeTab === 'terms') {
    return (
      <div className="dashboard-viewport fade-in" style={{ overflowY: 'auto' }}>
        <LegalPages type="terms" onBack={() => setActiveTab('home')} />
      </div>
    );
  }

  if (activeTab === 'privacy') {
    return (
      <div className="dashboard-viewport fade-in" style={{ overflowY: 'auto' }}>
        <LegalPages type="privacy" onBack={() => setActiveTab('home')} />
      </div>
    );
  }

  return (
    <div className="dashboard-viewport customer-dashboard-page fade-in" style={{ background: '#FFFFFF', minHeight: '100vh', color: '#111111' }}>
      
      

      <ToastNotification message={toast} onDismiss={() => { setToast(''); if (onToastDismiss) onToastDismiss(); }} />

      <header style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: '64px', padding: '0 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100, boxSizing: 'border-box' }}>
        {/* Left Side: Hamburger Menu & ADDUS Logo */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            title="Open Menu" 
            style={{ background: 'none', border: 'none', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '8px' }} 
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/addus_logo.png" alt="ADDUS" style={{ height: '24px', width: 'auto', display: 'block' }} />
          </div>
        </div>

        {/* Right Side: Product Selector, Notifications Bell & Logout Button */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          {products.length > 0 && (
            <select
              value={selectedProductId || ''}
              onChange={(e) => setSelectedProductId(e.target.value || null)}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer' }}
            >
              <option value="">All Business</option>
              {products.map(p => (
                <option key={p.productId} value={p.productId}>{p.name}</option>
              ))}
            </select>
          )}

          <button 
            type="button"
            title="Notifications" 
            onClick={() => setIsNotificationCenterOpen(true)} 
            style={{ position: 'relative', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0F172A', flexShrink: 0 }}
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#EF4444', color: '#FFFFFF', fontSize: '10px', fontWeight: '700', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFFFFF' }}>
                {unreadNotifications}
              </span>
            )}
          </button>

          <button 
            type="button"
            title="Logout" 
            onClick={() => { authService.logout(); resetState(); window.location.reload(); }} 
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0F172A', flexShrink: 0 }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {renderDrawer()}
      {renderActivityFeedDrawer()}
      <NotificationCenter userId={userId} isOpen={isNotificationCenterOpen} onClose={() => setIsNotificationCenterOpen(false)} />

      <main className="dashboard-content-container" style={{ padding: '32px 24px 100px 24px', background: '#FFFFFF', minHeight: '100vh', color: '#111111' }}>
        <section className="greeting-section" style={{ marginBottom: '20px' }}>
          <h1 className="greeting-headline" style={{ fontSize: '28px', fontWeight: '800', color: '#111111' }}>{greetingHeadline}</h1>
          <p className="greeting-subtext" style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{getGreeting()} — Welcome to your ADDUS workspace</p>
        </section>

        {/* CURRENT PROJECT BUTTON ABOVE ADDI CHAT BOX */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              if (latestProject) {
                setSelectedDetailProject(latestProject);
              } else {
                setSelectedDetailProject({ isNoProject: true });
              }
            }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '30px',
              padding: '10px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              fontSize: '14px',
              fontWeight: '700',
              color: '#0F172A',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
            }}
          >
            <FolderKanban size={18} style={{ color: '#7C5CFF' }} />
            <span>
              {latestProject
                ? `Current Project: ${latestProject.service || latestProject.title || `#${latestProject.id}`}`
                : 'View Project Details'}
            </span>
            <span style={{ fontSize: '11px', background: '#F3E8FF', color: '#7C5CFF', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              {latestProject?.status || 'Active Workspace'}
            </span>
            <ChevronRight size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        {/* 1. TOP: ADDI & ADMIN SUPPORT CHAT STRIP */}
        <section style={{ marginBottom: '24px' }}>
          <ADDIChatStrip project={latestProject} brain={brain} userId={userId} userName={userNameText} products={products} selectedProductId={selectedProductId} />
        </section>

        {/* 2. WHAT DO YOU NEED HELP WITH? */}
        <section className="quick-actions-section" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' }}>
            What do you need help with?
          </h2>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '16px',
              maxWidth: '960px',
              margin: '0 auto'
            }}
          >
            {[
              { id: 'video_shoot', category: 'Video Shoot', exploreLabel: 'Video Shoot', isVideo: true, image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80' },
              { id: 'photo_shoot', category: 'Photo Shoot', exploreLabel: 'Photo Shoot', image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80' },
              { id: 'branding', category: 'Branding', exploreLabel: 'Branding', image: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=600&q=80' },
              { id: 'social_media', category: 'Social Media Management', exploreLabel: 'Social Media Management', image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80' },
              { id: 'paid_ads', category: 'Paid Advertisements', exploreLabel: 'Paid Advertisements', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80' },
              { id: 'video_photo_edit', category: 'Video & Photo Editing', exploreLabel: 'Video & Photo Editing', image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80' },
              { id: 'packaging_design', category: 'Product & Packaging Design', exploreLabel: 'Product & Packaging Design', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80' },
              { id: 'product_campaign', category: 'Product Campaign', exploreLabel: 'Product Campaign', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80' },
              { id: 'content_copywriting', category: 'Content & Copywriting', exploreLabel: 'Content & Copywriting', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80' },
              { id: 'influencer_sourcing', category: 'Influencer & Collab', exploreLabel: 'Influencer & Collab', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80' }
            ].map(card => {
              return (
                <div
                  key={card.id}
                  onClick={() => handleQuickAction(card)}
                  style={{
                    height: '140px',
                    borderRadius: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: `url(${card.image}) center/cover no-repeat`,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
                  }}
                >
                  {/* Dark Gradient Overlay */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.35) 55%, rgba(0, 0, 0, 0.05) 100%)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justify: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div 
                      style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        color: '#FFFFFF',
                        lineHeight: '1.25',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)'
                      }}
                    >
                      {card.exploreLabel}
                    </div>

                    {card.isVideo && (
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.25)',
                          backdropFilter: 'blur(4px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        <Play size={18} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '2px' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {expertStatus && (
          <section style={{ marginBottom: '16px' }}>
            <ExpertReviewCard
              status={expertStatus}
              submittedAt={expertSubmitted}
              completedAt={expertCompleted}
              expertNotes={expertNotes}
            />
          </section>
        )}

        {/* 5. EXPERT SUGGESTIONS */}
        <ExpertSuggestionsSection 
          userProfile={userProfile} 
          brain={brain} 
          onBookSuggestion={(sug) => {
            createDraftProject({
              service: sug.service || 'Creative Service',
              type: `${sug.title || sug.service} Package`,
              budget: sug.budget || 'Price available after expert review',
              notes: `Booked from Expert Suggestions`
            });
            setToast('Project Created Successfully 🎉');
            setActiveTab('home');
          }} 
        />

        <div style={{ height: '40px' }} />
      </main>

      {/* Customer Full Project Workspace Modal */}
      {selectedDetailProject && (
        selectedDetailProject.isNoProject || !selectedDetailProject.id ? (
          <div className="admin-modal-overlay" onClick={() => setSelectedDetailProject(null)} style={{ zIndex: 99999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="admin-modal-content" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '24px', maxWidth: '480px', width: '100%', padding: '36px 28px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              
              {/* Mascot Sitting Lottie Player */}
              <div style={{ width: '180px', height: '180px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MascotLottiePlayer width={180} height={180} path="/lottiefile/mascot_on_chair.json" />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: '0 0 8px 0' }}>
                No Active Projects
              </h3>

              <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 24px 0', lineHeight: '1.5', maxWidth: '380px' }}>
                You don't have any active projects right now. Start a new project with ADDI to launch your campaign!
              </p>

              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDetailProject(null)}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailProject(null);
                    setActiveTab('home');
                  }}
                  style={{ background: 'linear-gradient(135deg, #7C5CFF, #6366F1)', border: 'none', color: '#FFFFFF', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124, 92, 255, 0.4)' }}
                >
                  + Start Project with ADDI
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-modal-overlay" onClick={() => setSelectedDetailProject(null)} style={{ zIndex: 99999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="admin-modal-content large-ops-modal" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '20px', maxWidth: '850px', width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '24px', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)', margin: 'auto' }} onClick={e => e.stopPropagation()}>
              <div className="modal-top-header flex-between">
                <div>
                  <h3 className="modal-title" style={{ fontSize: '18px', fontWeight: '800' }}>🎬 Project Workspace: {selectedDetailProject.id}</h3>
                <span className="text-muted text-xs">Service: {selectedDetailProject.service} · Status: <strong>{selectedDetailProject.status}</strong></span>
              </div>
              <button className="duolingo-secondary-btn micro-btn" onClick={() => setSelectedDetailProject(null)}>Close</button>
            </div>

            <div className="margin-top-16">
              <CustomerQuotationWidget project={selectedDetailProject} onUpdate={reloadProjects} />
            </div>

            <div className="margin-top-16">
              <ProjectTimeline project={selectedDetailProject} />
            </div>

            {/* Progress & Chat */}
            <div className="margin-top-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="admin-card">
                <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700' }}>Project Execution Progress</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedDetailProject.tasks || []).filter(t => t.assignedTo === 'creator').map(task => (
                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', background: '#F9FAFB', borderRadius: '6px', border: '1px solid #F3F4F6' }}>
                      <span style={{ color: task.status === 'completed' ? '#34D399' : '#111111', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</span>
                      <span style={{ color: task.status === 'completed' ? '#34D399' : '#9CA3AF', fontSize: '11px' }}>{task.status === 'completed' ? '✓ Done' : 'Pending'}</span>
                    </div>
                  ))}
                  {(!selectedDetailProject.tasks || selectedDetailProject.tasks.length === 0) && <span className="text-muted text-xs">No tasks assigned yet.</span>}
                </div>
              </div>

              <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', height: '300px' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} /> Project Chat Room
                </h4>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px' }}>
                  {(selectedDetailProject.chat || []).filter(m => !m.isInternal).map(msg => (
                    <div key={msg.id} style={{ alignSelf: msg.senderRole === 'Customer' ? 'flex-end' : 'flex-start', background: msg.senderRole === 'Customer' ? '#7c5cff' : '#374151', padding: '6px 10px', borderRadius: '8px', maxWidth: '85%' }}>
                      <div style={{ fontSize: '10px', color: '#6B6B6B', marginBottom: '2px' }}>{msg.senderName} ({msg.senderRole})</div>
                      <div style={{ fontSize: '12px', color: '#111111' }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px' }}>
                  <input 
                    className="duolingo-input" 
                    style={{ flex: 1, padding: '6px' }}
                    placeholder="Type message to team..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const newMsg = { id: `msg_${Date.now()}`, senderId: userId, senderName: userNameText, senderRole: 'Customer', text: e.target.value.trim(), timestamp: new Date().toISOString() };
                        updateProjectInStore(selectedDetailProject.id, { chat: [...(selectedDetailProject.chat || []), newMsg] });
                        e.target.value = '';
                      }
                    }}
                  />
                  <button className="duolingo-primary-btn" style={{ padding: '6px 12px' }} onClick={(e) => {
                    const input = e.currentTarget.previousSibling;
                    if (input.value.trim()) {
                      const newMsg = { id: `msg_${Date.now()}`, senderId: userId, senderName: userNameText, senderRole: 'Customer', text: input.value.trim(), timestamp: new Date().toISOString() };
                      updateProjectInStore(selectedDetailProject.id, { chat: [...(selectedDetailProject.chat || []), newMsg] });
                      input.value = '';
                    }
                  }}>Send</button>
                </div>
              </div>
            </div>

            {/* Suggested Services Panel */}
            {selectedDetailProject.suggestedServices && selectedDetailProject.suggestedServices.filter(s => s.status === 'suggested').length > 0 && (
              <div className="admin-card margin-top-16" style={{ border: '1px solid #7c5cff', background: 'rgba(124,92,255,0.08)', padding: '16px' }}>
                <h4 style={{ color: '#A78BFA', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>💡 Suggested Add-on Services</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDetailProject.suggestedServices.filter(s => s.status === 'suggested').map(sug => (
                    <div key={sug.id} style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                      <div className="flex-between">
                        <strong style={{ color: '#111111', fontSize: '14px' }}>{sug.serviceName}</strong>
                        <span style={{ color: '#34D399', fontWeight: '700', fontSize: '14px' }}>₹{sug.price.toLocaleString()}</span>
                      </div>
                      {sug.description && <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '4px 0' }}>{sug.description}</p>}
                      {sug.reason && <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '2px 0 8px 0', fontStyle: 'italic' }}>Reason: {sug.reason}</p>}
                      {sug.note && <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '0 0 8px 0' }}>Note: {sug.note}</p>}
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="duolingo-primary-btn micro-btn"
                          style={{ background: '#10B981', minHeight: '32px', fontSize: '12px', padding: '0 12px', border: 'none', color: '#111111', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => {
                            const updatedSuggestions = selectedDetailProject.suggestedServices.map(s => 
                              s.id === sug.id ? { ...s, status: 'accepted' } : s
                            );
                            const updatedScope = Array.from(new Set([...(selectedDetailProject.finalScope || []), sug.serviceName]));
                            const updatedSelected = Array.from(new Set([...(selectedDetailProject.selectedServices || []), sug.serviceName]));
                            
                            const systemMsg = {
                              id: `msg_${Date.now()}`,
                              senderId: userId,
                              senderName: userNameText,
                              senderRole: 'Customer',
                              text: `Accepted suggested service: ${sug.serviceName}`,
                              timestamp: new Date().toISOString()
                            };

                            updateProjectInStore(selectedDetailProject.id, {
                              suggestedServices: updatedSuggestions,
                              finalScope: updatedScope,
                              selectedServices: updatedSelected,
                              chat: [...(selectedDetailProject.chat || []), systemMsg]
                            });

                            NotificationEngine.notify({
                              userId: 'admin',
                              role: 'Admin',
                              type: 'suggestion_accepted',
                              title: 'Service Suggestion Accepted',
                              message: `${userNameText} accepted: ${sug.serviceName} for ₹${sug.price.toLocaleString()}`
                            });

                            reloadProjects();
                            alert(`Accepted! "${sug.serviceName}" has been added to your project scope.`);
                          }}
                        >
                          Accept
                        </button>
                        
                        <button
                          type="button"
                          className="duolingo-secondary-btn micro-btn"
                          style={{ borderColor: '#EF4444', color: '#EF4444', minHeight: '32px', fontSize: '12px', padding: '0 12px', background: 'transparent', border: '1px solid #EF4444', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => {
                            const updatedSuggestions = selectedDetailProject.suggestedServices.map(s => 
                              s.id === sug.id ? { ...s, status: 'rejected' } : s
                            );
                            
                            const systemMsg = {
                              id: `msg_${Date.now()}`,
                              senderId: userId,
                              senderName: userNameText,
                              senderRole: 'Customer',
                              text: `Declined suggested service: ${sug.serviceName}`,
                              timestamp: new Date().toISOString()
                            };

                            updateProjectInStore(selectedDetailProject.id, {
                              suggestedServices: updatedSuggestions,
                              chat: [...(selectedDetailProject.chat || []), systemMsg]
                            });

                            reloadProjects();
                          }}
                        >
                          Decline
                        </button>
                        
                        <button
                          type="button"
                          className="duolingo-secondary-btn micro-btn"
                          style={{ minHeight: '32px', fontSize: '12px', padding: '0 12px', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#111111', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => {
                            const queryText = `Tell me more about the suggested service: ${sug.serviceName}`;
                            const chatStripInput = document.querySelector('.addi-strip-input');
                            if (chatStripInput) {
                              chatStripInput.value = queryText;
                              chatStripInput.focus();
                              setSelectedDetailProject(null);
                            }
                          }}
                        >
                          Ask ADDI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Suggestions Panel */}
            {(() => {
              const selectedSrvs = selectedDetailProject.selectedServices || [];
              const suggestions = [];
              const selectedSet = new Set(selectedSrvs.map(s => s.toLowerCase()));
              if (selectedSet.has('logo design') || selectedSet.has('logo') || selectedSet.has('branding') || selectedSet.has('brand identity')) {
                if (!selectedSet.has('website')) {
                  suggestions.push({ serviceName: 'Website', description: 'Establish a high-converting digital storefront.', price: 35000, reason: 'Provides a digital hub for your new brand identity.' });
                }
                if (!selectedSet.has('brand guidelines')) {
                  suggestions.push({ serviceName: 'Brand Guidelines', description: 'Establish typographic, layout, and logo rules.', price: 15000, reason: 'Ensures visual consistency across all team members.' });
                }
              }
              if (selectedSet.has('website') || selectedSet.has('landing page')) {
                if (!selectedSet.has('seo') && !selectedSet.has('marketing')) {
                  suggestions.push({ serviceName: 'SEO Setup & Marketing', description: 'Optimize site ranking on search engines.', price: 18000, reason: 'Drives organic traffic to your new website.' });
                }
              }
              if (selectedSet.has('product photography') || selectedSet.has('photoshoot')) {
                if (!selectedSet.has('product packaging design') && !selectedSet.has('packaging')) {
                  suggestions.push({ serviceName: 'Product Packaging Design', description: 'Premium print-ready label designs.', price: 12000, reason: 'Ensures packaging matches high-end product photos.' });
                }
              }
              
              if (suggestions.length === 0) return null;
              
              return (
                <div className="admin-card margin-top-16" style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', padding: '16px' }}>
                  <h4 style={{ color: '#00D1FF', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>⚡ Smart Strategic Add-ons</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {suggestions.map((sug, sIdx) => (
                      <div key={sIdx} style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <div className="flex-between">
                          <strong style={{ color: '#111111', fontSize: '13px' }}>{sug.serviceName}</strong>
                          <span style={{ color: '#00D1FF', fontWeight: '700', fontSize: '13px' }}>₹{sug.price.toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#6B6B6B', margin: '4px 0' }}>{sug.description}</p>
                        <p style={{ fontSize: '10px', color: '#6B6B6B', margin: '2px 0 8px 0', fontStyle: 'italic' }}>Reason: {sug.reason}</p>
                        <button
                          type="button"
                          className="duolingo-primary-btn micro-btn"
                          style={{ minHeight: '28px', fontSize: '11px', padding: '0 10px', background: '#00D1FF', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => {
                            const updatedScope = Array.from(new Set([...(selectedDetailProject.finalScope || []), sug.serviceName]));
                            const updatedSelected = Array.from(new Set([...(selectedDetailProject.selectedServices || []), sug.serviceName]));
                            
                            const systemMsg = {
                              id: `msg_${Date.now()}`,
                              senderId: userId,
                              senderName: userNameText,
                              senderRole: 'Customer',
                              text: `Added smart suggested service: ${sug.serviceName}`,
                              timestamp: new Date().toISOString()
                            };

                            updateProjectInStore(selectedDetailProject.id, {
                              finalScope: updatedScope,
                              selectedServices: updatedSelected,
                              chat: [...(selectedDetailProject.chat || []), systemMsg]
                            });

                            NotificationEngine.notify({
                              userId: 'admin',
                              role: 'Admin',
                              type: 'suggestion_accepted',
                              title: 'Service Added from Recommendations',
                              message: `${userNameText} added: ${sug.serviceName}`
                            });

                            reloadProjects();
                            alert(`Added! "${sug.serviceName}" has been added to your project scope.`);
                          }}
                        >
                          Add to Scope
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Submit Asset for Review */}
            <div className="admin-card margin-top-16" style={{ padding: '16px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>📎 Submit Brand Asset for Review</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                const titleInput = e.currentTarget.elements.assetTitle;
                const linkInput = e.currentTarget.elements.assetLink;
                
                if (!titleInput.value.trim()) return;

                const newAssetFile = {
                  id: `file_${Date.now()}`,
                  name: titleInput.value.trim(),
                  category: 'General Reference',
                  projectId: selectedDetailProject.id,
                  url: linkInput.value.trim() || '#',
                  uploadedBy: 'Customer',
                  createdAt: new Date().toISOString()
                };

                const updatedFiles = [...(selectedDetailProject.uploadedFiles || []), newAssetFile];
                updateProjectInStore(selectedDetailProject.id, { uploadedFiles: updatedFiles });

                const profile = profileService.getProfileById(userId);
                if (profile) {
                  const vaultFiles = profile.uploadedFiles || [];
                  profileService.saveProfile({
                    ...profile,
                    uploadedFiles: [...vaultFiles, newAssetFile]
                  });
                }

                const systemMsg = {
                  id: `msg_${Date.now()}`,
                  senderId: userId,
                  senderName: userNameText,
                  senderRole: 'Customer',
                  text: `Submitted reference asset: "${titleInput.value.trim()}"` + (linkInput.value.trim() ? ` (${linkInput.value.trim()})` : ''),
                  timestamp: new Date().toISOString()
                };
                updateProjectInStore(selectedDetailProject.id, { chat: [...(selectedDetailProject.chat || []), systemMsg] });

                NotificationEngine.notify({
                  userId: 'admin',
                  role: 'Admin',
                  type: 'asset_uploaded',
                  title: 'Brand Asset Uploaded',
                  message: `${userNameText} uploaded a new reference asset for review: ${titleInput.value.trim()}`
                });

                titleInput.value = '';
                linkInput.value = '';
                reloadProjects();
                alert('Reference asset successfully submitted for review!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input name="assetTitle" className="duolingo-input" style={{ padding: '8px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', color: '#111111', borderRadius: '4px' }} placeholder="Asset Title (e.g. Current Logo, Guidelines)..." required />
                  <input name="assetLink" className="duolingo-input" style={{ padding: '8px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', color: '#111111', borderRadius: '4px' }} placeholder="Asset URL / Drive link (Optional)..." />
                </div>
                <button type="submit" className="duolingo-primary-btn" style={{ alignSelf: 'flex-start', padding: '6px 16px', background: '#7c5cff', border: 'none', color: '#111111', borderRadius: '4px', cursor: 'pointer' }}>Submit Asset</button>
              </form>
            </div>

            <div className="margin-top-16">
              <DeliverablesManager project={selectedDetailProject} role="Customer" onUpdate={reloadProjects} />
            </div>

            <div className="margin-top-16">
              <ProjectFolders project={selectedDetailProject} role="Customer" onUpdate={reloadProjects} />
            </div>
            </div>
          </div>
        )
      )}

      {/* Style Preview Modal */}
      {showStylePreview && selectedDeliverable && (
        <StylePreviewModal
          card={{ title: selectedDeliverable, style: selectedDeliverable, type: selectedDeliverable }}
          onSelect={(c) => {
            setShowStylePreview(false);
            try {
              const activeProj = latestProject || {};
              const userName = userProfile?.name || 'Customer';
              
              if (activeProj.id) {
                const updatedRefs = Array.from(new Set([...(activeProj.selectedGalleryReferences || []), c.title]));
                updateProjectInStore(activeProj.id, { selectedGalleryReferences: updatedRefs });
              }

              NotificationEngine.notify({
                userId: 'admin',
                role: 'Admin',
                type: 'gallery_selected',
                title: 'Gallery Item Selected',
                message: `${userName} selected reference: "${c.title}" for service "${c.type}".`,
                metadata: {
                  customer: userName,
                  selectedItem: c.title,
                  category: c.type,
                  timestamp: new Date().toISOString(),
                  projectId: activeProj.id || 'N/A'
                }
              });
            } catch(e) {
              console.warn(e);
            }
          }}
          onClose={() => setShowStylePreview(false)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
