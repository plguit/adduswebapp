import React, { useState } from 'react';
import {
  Building2, Star, FolderKanban, Users, Bell, BarChart3,
  LogOut, Menu, X, Sparkles, MessageSquare, UserPlus, Send,
  ChevronDown, Camera
} from 'lucide-react';
import { BusinessesTab } from './tabs/BusinessesTab.jsx';
import { ExpertReviewTab } from './tabs/ExpertReviewTab.jsx';
import { AdminProjectsTab } from './tabs/AdminProjectsTab.jsx';
import { UsersTab } from './tabs/UsersTab.jsx';
import { NotificationsTab } from './tabs/NotificationsTab.jsx';
import { AnalyticsTab } from './tabs/AnalyticsTab.jsx';
import { AdminChatTab } from './tabs/AdminChatTab.jsx';
import { AdminOnboardingTab } from './tabs/AdminOnboardingTab.jsx';
import { AdminPushTab } from './tabs/AdminPushTab.jsx';
import { AdminCreatorTab } from './tabs/AdminCreatorTab.jsx';

const SECTIONS = [
  {
    id: 'customer',
    label: 'Customer',
    icon: Building2,
    items: [
      { id: 'businesses', label: 'Businesses', icon: Building2 },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'projects', label: 'Projects', icon: FolderKanban },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
    ]
  },
  {
    id: 'creator',
    label: 'Creator',
    icon: Camera,
    items: [
      { id: 'creators', label: 'Creators', icon: Camera },
      { id: 'creator_projects', label: 'Projects', icon: FolderKanban },
      { id: 'creator_equipment', label: 'Equipment', icon: Award },
      { id: 'creator_payments', label: 'Payments', icon: DollarSign },
      { id: 'creator_notifications', label: 'Notifications', icon: Bell },
      { id: 'creator_chat', label: 'Chat', icon: MessageSquare },
      { id: 'creator_onboarding', label: 'Onboarding', icon: UserPlus },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    items: [
      { id: 'analytics', label: 'Overview', icon: BarChart3 },
      { id: 'expert_review', label: 'Expert Review', icon: Star },
      { id: 'onboarding', label: 'Bulk Onboarding', icon: UserPlus },
      { id: 'push', label: 'Push Notifications', icon: Send },
    ]
  }
];

export function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({ customer: true, creator: false, analytics: true });

  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  React.useEffect(() => {
    loadNotifications();

    const handleActionPopup = (e) => {
      if (e.detail) {
        setNotifications(prev => [
          {
            id: e.detail.id,
            title: `⚡ Action Required: ${e.detail.customerName}`,
            message: `Requested: "${e.detail.requestText}" (${e.detail.businessName})`,
            unread: true,
            deepLink: 'projects'
          },
          ...prev
        ]);
        setUnreadCount(c => c + 1);
        setShowNotifPopup(true);
      }
    };

    window.addEventListener('addus_admin_action_popup', handleActionPopup);
    window.addEventListener('addus_notification_dispatched', loadNotifications);
    return () => {
      window.removeEventListener('addus_admin_action_popup', handleActionPopup);
      window.removeEventListener('addus_notification_dispatched', loadNotifications);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiService.fetchAdminNotifications();
      
      // Merge local action queue if present
      const queueRaw = localStorage.getItem('ADDUS_ADMIN_POPUP_QUEUE');
      let queueItems = [];
      if (queueRaw) {
        try {
          const parsed = JSON.parse(queueRaw);
          queueItems = parsed.map(q => ({
            id: q.id,
            title: `⚡ Action Required: ${q.customerName}`,
            message: `Requested: "${q.requestText}" (${q.businessName})`,
            unread: q.unread !== false,
            deepLink: 'projects'
          }));
        } catch(e) {}
      }

      const combined = [...queueItems, ...data];
      const unread = combined.filter(n => n.unread).length;
      setNotifications(combined.slice(0, 8));
      setUnreadCount(unread);
      if (unread > 0) {
        setShowNotifPopup(true);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleNotifAction = (tab) => {
    setActiveTab(tab);
    setShowNotifPopup(false);
    // Mark popup queue as read
    localStorage.removeItem('ADDUS_ADMIN_POPUP_QUEUE');
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'businesses': return <BusinessesTab />;
      case 'expert_review': return <ExpertReviewTab />;
      case 'projects': return <AdminProjectsTab />;
      case 'users': return <UsersTab />;
      case 'notifications': return <NotificationsTab />;
      case 'chat': return <AdminChatTab />;
      case 'onboarding': return <AdminOnboardingTab />;
      case 'push': return <AdminPushTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'creators': return <AdminCreatorTab />;
      case 'creator_projects':
      case 'creator_equipment':
      case 'creator_payments':
      case 'creator_notifications':
      case 'creator_chat':
      case 'creator_onboarding':
        return (
          <div className="admin-tab-content fade-in">
            <div className="admin-section-header">
              <h2>{SECTIONS.find(s => s.id === 'creator')?.items.find(i => i.id === activeTab)?.label || 'Creator'}</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>This module is being built. Check back soon.</p>
            </div>
            <div className="creator-coming-soon-box">
              <div className="creator-coming-soon-icon">🚀</div>
              <h3>Coming Soon</h3>
              <p>This workspace module is being built. Check back soon.</p>
            </div>
          </div>
        );
      default: return <AnalyticsTab />;
    }
  };

  const getAllNavItems = () => {
    const items = [];
    for (const section of SECTIONS) {
      for (const item of section.items) {
        items.push({ ...item, sectionId: section.id });
      }
    }
    return items;
  };

  const activeItem = getAllNavItems().find(n => n.id === activeTab);
  const activeSection = SECTIONS.find(s => s.items.some(i => i.id === activeTab));

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="admin-sidebar-brand">
          <Sparkles size={18} className="sidebar-sparkle" />
          {sidebarOpen && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">ADDUS</div>
              <div className="sidebar-brand-sub">Admin Portal</div>
            </div>
          )}
        </div>

        <nav className="admin-nav">
          {SECTIONS.map(section => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections[section.id];
            const isActiveSection = section.items.some(i => i.id === activeTab);

            return (
              <div key={section.id} className="admin-nav-section">
                <button
                  className={`admin-nav-item admin-nav-section-toggle ${isActiveSection ? 'nav-item-active' : ''}`}
                  onClick={() => {
                    toggleSection(section.id);
                    if (!isExpanded && section.items.length > 0) {
                      setActiveTab(section.items[0].id);
                    }
                  }}
                  title={section.label}
                >
                  <SectionIcon size={18} />
                  {sidebarOpen && <span>{section.label}</span>}
                  {sidebarOpen && <ChevronDown size={14} style={{ marginLeft: 'auto', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />}
                </button>
                {isExpanded && sidebarOpen && (
                  <div className="admin-nav-submenu">
                    {section.items.map(item => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          className={`admin-nav-item admin-nav-subitem ${activeTab === item.id ? 'nav-item-active' : ''}`}
                          onClick={() => {
                            setActiveTab(item.id);
                            if (window.innerWidth <= 768) setSidebarOpen(false);
                          }}
                        >
                          <ItemIcon size={16} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <button className="admin-nav-item admin-logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={18} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="mobile-drawer-backdrop active"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notification Popup */}
      {showNotifPopup && (
        <div className="celebration-modal-backdrop fade-in" style={{ zIndex: 10002 }} onClick={() => setShowNotifPopup(false)}>
          <div className="scale-in" style={{ maxWidth: '520px', width: '90%', background: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFF', margin: 0 }}>
                🔔 You have {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
              </h3>
              <button onClick={() => setShowNotifPopup(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.map((n, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFF' }}>{n.title}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{n.message}</div>
                  </div>
                  {n.deepLink && (
                    <button
                      onClick={() => handleNotifAction(n.deepLink.replace('/', ''))}
                      style={{ background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', borderRadius: '6px', padding: '4px 10px', color: '#A78BFA', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowNotifPopup(false)} style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#FFF', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-topbar-title">
            {activeItem?.icon && <activeItem.icon size={18} />}
            <span>{activeItem?.label || activeSection?.label}</span>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-badge-live">● Live</span>
          </div>
        </header>

        {/* Tab content */}
        <main className="admin-content">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
