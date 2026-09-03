import React from 'react';
import { Home, FolderKanban, Sparkles, Brain, FileText, ShieldCheck, LogOut, X, ChevronRight, Layers, Package } from 'lucide-react';

export function HamburgerDrawer({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  userName = 'Valued Client',
  businessName = 'Your Business',
  onLogout
}) {
  if (!isOpen) return null;

  const handleNav = (tabId) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <div className="celebration-modal-backdrop fade-in" style={{ zIndex: 99999, justifyContent: 'flex-start', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div 
        className="scale-in" 
        style={{
          width: '320px',
          maxWidth: '85vw',
          height: '100%',
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex-between" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/addus_logo.png" alt="ADDUS" style={{ height: '24px', width: 'auto' }} />
            </div>
            <button 
              className="duolingo-secondary-btn micro-btn" 
              style={{ padding: '6px', borderRadius: '50%', minHeight: 'auto', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', cursor: 'pointer' }}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>

          {/* User Profile Card */}
          <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{businessName}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{userName}</div>
          </div>

          {/* Nav Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

            <button
              className={`drawer-nav-btn ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => handleNav('gallery')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'gallery' ? '#F3E8FF' : 'transparent',
                color: activeTab === 'gallery' ? '#7C5CFF' : '#334155',
                fontWeight: activeTab === 'gallery' ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Layers size={18} style={{ color: '#7C5CFF' }} />
              <span style={{ flex: 1 }}>Inspiration &amp; Gallery</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </button>

            <button
              className={`drawer-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleNav('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'profile' ? '#F3E8FF' : 'transparent',
                color: activeTab === 'profile' ? '#7C5CFF' : '#334155',
                fontWeight: activeTab === 'profile' ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Brain size={18} style={{ color: '#7C5CFF' }} />
              <span style={{ flex: 1 }}>Edit Business Profile &amp; Assets</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </button>

            <div style={{ height: '1px', background: '#E2E8F0', margin: '12px 0' }} />

            <button
              className={`drawer-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => handleNav('products')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'products' ? '#F1F5F9' : 'transparent',
                color: '#64748B',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Package size={16} />
              <span style={{ flex: 1 }}>Products</span>
            </button>

            <button
              className={`drawer-nav-btn ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => handleNav('terms')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'terms' ? '#F1F5F9' : 'transparent',
                color: '#64748B',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <FileText size={16} />
              <span style={{ flex: 1 }}>Terms &amp; Conditions</span>
            </button>

            <button
              className={`drawer-nav-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => handleNav('privacy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'privacy' ? '#F1F5F9' : 'transparent',
                color: '#64748B',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <ShieldCheck size={16} />
              <span style={{ flex: 1 }}>Privacy Policy</span>
            </button>
          </div>
        </div>

        {/* Footer Logout */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
          <button
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #FEE2E2',
              background: '#FEF2F2',
              color: '#EF4444',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
