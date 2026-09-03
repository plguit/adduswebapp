import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, FolderKanban, Star, UserCheck, Calendar as CalendarIcon, FileSpreadsheet, BrainCircuit, BarChart3, LogOut, Menu, X, Sparkles, CheckSquare, MessageSquare, Shield, History, Search, Bell, CreditCard, ShieldAlert, TrendingUp, Users, ShieldCheck, DollarSign, Layers, Globe } from 'lucide-react';

import { profileService } from '../../../shared/services/profileService.js';
import { adminApiService } from './services/adminApiService.js';
import { DashboardTab } from './tabs/DashboardTab.jsx';
import { BusinessesTab } from './tabs/BusinessesTab.jsx';
import { AdminProjectsTab } from './tabs/AdminProjectsTab.jsx';
import { ExpertReviewTab } from './tabs/ExpertReviewTab.jsx';
import { CreatorAssignmentTab } from './tabs/CreatorAssignmentTab.jsx';
import { CreatorManagementTab } from './tabs/CreatorManagementTab.jsx';
import { CalendarTab } from './tabs/CalendarTab.jsx';
import { QuotationBuilderTab } from './tabs/QuotationBuilderTab.jsx';
import { BusinessBrainTab } from './tabs/BusinessBrainTab.jsx';
import { AnalyticsTab } from './tabs/AnalyticsTab.jsx';
import { ApprovalsTab } from './tabs/ApprovalsTab.jsx';
import { MessagesTab } from './tabs/MessagesTab.jsx';
import { SettingsTab } from './tabs/SettingsTab.jsx';
import { AuditLogsTab } from './tabs/AuditLogsTab.jsx';
import { UrlAnalysisTab } from './tabs/UrlAnalysisTab.jsx';
import { PaymentsTab } from './tabs/PaymentsTab.jsx';
import { DuplicatesTab } from './tabs/DuplicatesTab.jsx';
import { FounderDashboardTab } from './tabs/FounderDashboardTab.jsx';
import { PlanningBrainTab } from './tabs/PlanningBrainTab.jsx';
import { QualityBrainTab } from './tabs/QualityBrainTab.jsx';
import { FinanceTab } from './tabs/FinanceTab.jsx';
import { ReferencesTab } from './tabs/ReferencesTab.jsx';
import { GlobalSearchModal } from './components/GlobalSearchModal.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'businesses', label: 'Businesses (CRM)', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'creators', label: 'Work Allocation', icon: UserCheck },
  { id: 'creator_management', label: 'Creator Pool', icon: Users },
  { id: 'references', label: 'References & Pricing', icon: Layers },
  { id: 'brain', label: 'Business Brain', icon: BrainCircuit },
  { id: 'planning_brain', label: 'Planning Brain', icon: Sparkles },
  { id: 'quality_brain', label: 'Quality Brain', icon: ShieldCheck },
  { id: 'expert_review', label: 'AI Reviews', icon: Star },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'analytics', label: 'Reports', icon: BarChart3 },
  { id: 'founder', label: 'Founder View', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Shield },
  { id: 'audit', label: 'Audit Logs', icon: History },
  { id: 'url_analysis', label: 'URL Analysis', icon: Globe },
  { id: 'duplicates', label: 'Duplicates', icon: ShieldAlert },
];

export function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [dataSource, setDataSource] = useState('localStorage');
  const [adminReady, setAdminReady] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadNotifications = () => {
    try {
      const notifsMap = new Map();

      // Read admin profile notifications
      const adminProf = profileService.getProfileById('admin');
      if (adminProf && adminProf.notifications) {
        adminProf.notifications.forEach(n => notifsMap.set(n.id, n));
      }

      // Read all user profiles notifications
      const allProfiles = profileService.getAllProfiles();
      allProfiles.forEach(p => {
        if (p.notifications) {
          p.notifications.forEach(n => {
            if (!notifsMap.has(n.id)) {
              notifsMap.set(n.id, {
                ...n,
                userName: p.name || p.phoneNumber || p.businessBrain?.businessName || p.userId
              });
            }
          });
        }
      });

      const list = Array.from(notifsMap.values());
      list.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
      setAdminNotifications(list);
    } catch (e) {
      console.warn('Load admin notifications error:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const handleNotifDispatched = () => loadNotifications();
    window.addEventListener('addus_notification_dispatched', handleNotifDispatched);
    window.addEventListener('addus_projects_updated', handleNotifDispatched);
    window.addEventListener('addus_project_store_updated', handleNotifDispatched);
    return () => {
      window.removeEventListener('addus_notification_dispatched', handleNotifDispatched);
      window.removeEventListener('addus_projects_updated', handleNotifDispatched);
      window.removeEventListener('addus_project_store_updated', handleNotifDispatched);
    };
  }, []);

  // Keyboard shortcut Cmd/Ctrl + K for Global Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Silent admin auth + data source detection
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await adminApiService.ensureAuthenticated();
        if (!cancelled) {
          setAdminReady(ok);
          setDataSource(ok ? 'backend' : 'localStorage');
        }
      } catch (e) {
        if (!cancelled) {
          setAdminReady(false);
          setDataSource('localStorage');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // One-time cleanup of obviously fake generated profiles from old localStorage mutation bug
  useEffect(() => {
    try {
      const all = profileService.getAllProfiles();
      const cleaned = all.filter(p => {
        const name = (p.name || '').trim();
        const biz = (p.businessName || '').trim();
        const desc = (p.businessDescription || '').trim();
        const phone = (p.phoneNumber || '').trim();
        const email = (p.email || '').trim();
        const custId = (p.customerId || '').trim();
        const bizId = (p.businessId || '').trim();

        if (biz === 'Aura Skincare') return false;
        if (biz === 'Your Business Name' && desc.startsWith('AI analyzed')) return false;
        if (/^ACA\d{5,}$/.test(custId) && /^ABA\d{5,}$/.test(bizId) && !name && !phone && !email && !biz) return false;
        return true;
      });

      if (cleaned.length !== all.length) {
        profileService.saveAllProfiles(cleaned);
      }
    } catch (e) {
      console.warn('[Admin] Cleanup skipped:', e.message);
    }
  }, []);

  const handleSelectSearchResult = (result) => {
    if (result && result.tab) {
      setActiveTab(result.tab);
      if (isMobile) setSidebarOpen(false);
    }
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) setSidebarOpen(false);
  };

  const unreadNotifsCount = adminNotifications.filter(n => n.unread !== false).length;

  const renderTab = () => {
    const commonProps = { dataSource, adminReady };
    switch (activeTab) {
      case 'dashboard': return <DashboardTab onNavigateTab={setActiveTab} {...commonProps} />;
      case 'businesses': return <BusinessesTab {...commonProps} />;
      case 'projects': return <AdminProjectsTab {...commonProps} />;
      case 'creators': return <CreatorAssignmentTab {...commonProps} />;
      case 'creator_management': return <CreatorManagementTab {...commonProps} />;
      case 'references': return <ReferencesTab {...commonProps} />;
      case 'brain': return <BusinessBrainTab {...commonProps} />;
      case 'planning_brain': return <PlanningBrainTab {...commonProps} />;
      case 'quality_brain': return <QualityBrainTab {...commonProps} />;
      case 'expert_review': return <ExpertReviewTab {...commonProps} />;
      case 'approvals': return <ApprovalsTab {...commonProps} />;
      case 'finance': return <FinanceTab {...commonProps} />;
      case 'payments': return <PaymentsTab {...commonProps} />;
      case 'calendar': return <CalendarTab {...commonProps} />;
      case 'messages': return <MessagesTab {...commonProps} />;
      case 'analytics': return <AnalyticsTab {...commonProps} />;
      case 'founder': return <FounderDashboardTab {...commonProps} />;
      case 'settings': return <SettingsTab {...commonProps} />;
      case 'audit': return <AuditLogsTab {...commonProps} />;
      case 'url_analysis': return <UrlAnalysisTab {...commonProps} />;
      case 'duplicates': return <DuplicatesTab {...commonProps} />;
      default: return <DashboardTab onNavigateTab={setActiveTab} {...commonProps} />;
    }
  };

  const activeItem = NAV_ITEMS.find(n => n.id === activeTab);

  return (
    <div className={`admin-layout ${isMobile ? 'is-mobile-view' : ''}`}>
      {/* Mobile Backdrop Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="admin-sidebar-brand">
          <Sparkles size={18} className="sidebar-sparkle" />
          {(sidebarOpen || !isMobile) && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">ADDUS</div>
              <div className="sidebar-brand-sub">Admin OS Platform</div>
            </div>
          )}
          {isMobile && sidebarOpen && (
            <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)} title="Close Sidebar">
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
              >
                <Icon size={18} />
                {(sidebarOpen || isMobile) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button className="admin-nav-item admin-logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={18} />
          {(sidebarOpen || isMobile) && <span>Logout</span>}
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(o => !o)} title="Toggle Menu">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="admin-topbar-title">
            {activeItem?.icon && <activeItem.icon size={18} className="inline-icon" />}
            <span>{activeItem?.label}</span>
          </div>

          <div className="topbar-search-trigger" onClick={() => setSearchModalOpen(true)}>
            <Search size={14} />
            <span>Search...</span>
            <kbd className="cmd-k-badge">⌘K</kbd>
          </div>

          <div className="admin-topbar-right">
            <div style={{ position: 'relative' }}>
              <button 
                className="topbar-bell-btn" 
                title="Notifications"
                onClick={() => setNotifDropdownOpen(o => !o)}
                style={{ position: 'relative', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Bell size={16} color="#A78BFA" />
                {unreadNotifsCount > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#EF4444',
                      color: '#FFF',
                      fontSize: '10px',
                      fontWeight: '800',
                      borderRadius: '10px',
                      padding: '1px 5px',
                      lineHeight: '12px'
                    }}
                  >
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Admin Notifications Dropdown Modal */}
              {notifDropdownOpen && (
                <div 
                  className="fade-in"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: '0',
                    width: '360px',
                    maxHeight: '440px',
                    background: '#16161F',
                    border: '1px solid rgba(124, 92, 255, 0.3)',
                    borderRadius: '16px',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '14px 16px', background: '#1E1E2A', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bell size={16} color="#7C5CFF" />
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFF' }}>Notifications</span>
                      {unreadNotifsCount > 0 && (
                        <span style={{ background: 'rgba(124,92,255,0.2)', color: '#A78BFA', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                          {unreadNotifsCount} new
                        </span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        profileService.markAllNotificationsRead('admin');
                        loadNotifications();
                      }}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                    {adminNotifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                        No incoming notifications yet.
                      </div>
                    ) : (
                      adminNotifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setNotifDropdownOpen(false);
                            setActiveTab('projects');
                          }}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: n.unread !== false ? 'rgba(124, 92, 255, 0.08)' : 'transparent',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: n.priority === 'high' ? '#38BDF8' : '#FFF' }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748B' }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0, lineHeight: '1.4' }}>
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="admin-badge-live">● Live</span>
          </div>
        </header>

        <main className="admin-content">
          {renderTab()}
        </main>
      </div>

      {/* Global Command Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />
    </div>
  );
}

export default AdminDashboard;
