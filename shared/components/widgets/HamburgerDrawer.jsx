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
    <div className="celebration-modal-backdrop fade-in" style={{ zIndex: 99999, justifyContent: 'flex-start' }} onClick={onClose}>
      <div 
        className="scale-in" 
        style={{
          width: '320px',
          maxWidth: '85vw',
          height: '100%',
          background: '#14141B',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/addus_logo.png" alt="ADDUS" style={{ height: '24px', width: 'auto' }} />
            </div>
            <button 
              className="duolingo-secondary-btn micro-btn" 
              style={{ padding: '6px', borderRadius: '50%', minHeight: 'auto' }}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>

          {/* User Profile Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFF' }}>{businessName}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{userName}</div>
          </div>

          {/* Nav Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className={`drawer-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => handleNav('home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'home' ? 'rgba(0, 209, 255, 0.12)' : 'transparent',
                color: activeTab === 'home' ? '#00D1FF' : '#E5E7EB',
                fontWeight: activeTab === 'home' ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Home size={18} />
              <span style={{ flex: 1 }}>Dashboard Home</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </button>

            <button
              className={`drawer-nav-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => handleNav('projects')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'projects' ? 'rgba(0, 209, 255, 0.12)' : 'transparent',
                color: activeTab === 'projects' ? '#00D1FF' : '#E5E7EB',
                fontWeight: activeTab === 'projects' ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <FolderKanban size={18} />
              <span style={{ flex: 1 }}>Project Workspaces</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </button>

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
                background: activeTab === 'gallery' ? 'rgba(0, 209, 255, 0.12)' : 'transparent',
                color: activeTab === 'gallery' ? '#00D1FF' : '#E5E7EB',
                fontWeight: activeTab === 'gallery' ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Layers size={18} />
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
                background: activeTab === 'profile' ? 'rgba(0, 209, 255, 0.12)' : 'transparent',
                color: activeTab === 'profile' ? '#00D1FF' : '#E5E7EB',
                fontWeight: activeTab === 'profile' ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Brain size={18} />
              <span style={{ flex: 1 }}>Business Vault &amp; Profile</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </button>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />

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
                background: activeTab === 'products' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: '#9CA3AF',
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
                background: activeTab === 'terms' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: '#9CA3AF',
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
                background: activeTab === 'privacy' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: '#9CA3AF',
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
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
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
              border: '1px solid rgba(248,113,113,0.3)',
              background: 'rgba(248,113,113,0.08)',
              color: '#F87171',
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
