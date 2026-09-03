import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Check, Clock, Eye, Layers, Play, Smartphone, Monitor, Maximize2, ExternalLink } from 'lucide-react';
import { referenceLibraryService } from '../../../shared/services/referenceLibraryService.js';
import { getEmbeddableVideoUrl, isLikelyVideoUrl, detectVideoAspectRatio } from '../../../shared/utils/mediaUtils.js';
import { UniversalNotificationEngine } from '../../../src/services/brain/UniversalNotificationEngine.js';
import { StylePreviewModal } from './StylePreviewModal.jsx';

const CATEGORIES = [
  'All',
  'Video Shoot',
  'Photo Shoot',
  'Branding',
  'Social Media Management',
  'Paid Advertisements',
  'Video & Photo Editing',
  'Product & Packaging Design',
  'Product Campaign',
  'Content & Copywriting',
  'Influencer & Collab'
];

export function CustomerGalleryView({ selectedCategory = 'All', onBack, onBookPackage }) {
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'All');
  const [formatFilter, setFormatFilter] = useState('all'); // 'all' | 'portrait' | 'landscape'
  const [references, setReferences] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [bookingModalItem, setBookingModalItem] = useState(null);
  const [preferredDate, setPreferredDate] = useState('');

  useEffect(() => {
    if (selectedCategory) setActiveCategory(selectedCategory);
    setReferences(referenceLibraryService.getActiveReferences());

    const handleSync = () => setReferences(referenceLibraryService.getActiveReferences());
    window.addEventListener('addus_references_updated', handleSync);
    return () => window.removeEventListener('addus_references_updated', handleSync);
  }, [selectedCategory]);

  const cleanCat = (catStr) => (catStr || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim().toLowerCase();

  const filtered = references.filter(r => {
    // 1. Category Filter
    let catMatch = true;
    if (activeCategory !== 'All') {
      const cat = cleanCat(r.category || r.deliverableType || r.title || '');
      const target = cleanCat(activeCategory);
      if (cat.includes(target) || target.includes(cat)) {
        catMatch = true;
      } else if (target.includes('video') && (cat.includes('video') || isLikelyVideoUrl(r.mediaUrl) || r.isVideo)) {
        catMatch = true;
      } else if (target.includes('photo') && (cat.includes('photo') || cat.includes('photography'))) {
        catMatch = true;
      } else if (target.includes('brand') && (cat.includes('brand') || cat.includes('logo'))) {
        catMatch = true;
      } else {
        catMatch = false;
      }
    }
    if (!catMatch) return false;

    // 2. Format / Orientation Filter (Portrait vs Landscape)
    if (formatFilter !== 'all') {
      const itemRatio = r.aspectRatio || detectVideoAspectRatio(r);
      if (itemRatio !== formatFilter) return false;
    }

    return true;
  });

  const handleConfirmBooking = (item) => {
    if (!item) return;
    const projectPayload = {
      service: item.category || item.deliverableType || 'Creative Service',
      type: `${item.title} Package`,
      title: item.title,
      budget: item.indicativePrice || 'Price available after expert review',
      referenceId: item.id,
      referenceTitle: item.title,
      date: preferredDate || new Date().toISOString().split('T')[0],
      status: 'pending_expert_review'
    };

    if (typeof onBookPackage === 'function') {
      onBookPackage(projectPayload);
    }

    UniversalNotificationEngine.notify({
      title: 'Package Booking Request Submitted',
      message: `Your booking request for "${item.title}" (${item.indicativePrice || 'Review'}) has been submitted. Our creative team will reach out.`,
      type: 'project_created',
      audience: 'customer'
    });

    setBookingModalItem(null);
  };

  return (
    <div className="customer-gallery-container fade-in" style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Bar / Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button 
              type="button" 
              onClick={onBack}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
              🎨 Inspiration & Service Packages Gallery
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
              Explore benchmark creative deliverables, 4K shoot samples, and approved pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="folder-pills-row margin-bottom-16" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`folder-pill ${activeCategory === cat ? 'folder-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '7px 15px',
              borderRadius: '20px',
              border: activeCategory === cat ? '1px solid #7C5CFF' : '1px solid #E2E8F0',
              background: activeCategory === cat ? '#7C5CFF' : '#F8FAFC',
              color: activeCategory === cat ? '#FFFFFF' : '#475569',
              fontWeight: activeCategory === cat ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Format Model Tabs: Portrait (9:16) vs Landscape (16:9) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={() => setFormatFilter('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: formatFilter === 'all' ? '700' : '600',
              border: 'none',
              background: formatFilter === 'all' ? '#FFFFFF' : 'transparent',
              color: formatFilter === 'all' ? '#7C5CFF' : '#64748B',
              boxShadow: formatFilter === 'all' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            🌐 All Formats
          </button>
          <button
            type="button"
            onClick={() => setFormatFilter('portrait')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: formatFilter === 'portrait' ? '700' : '600',
              border: 'none',
              background: formatFilter === 'portrait' ? '#FFFFFF' : 'transparent',
              color: formatFilter === 'portrait' ? '#7C5CFF' : '#64748B',
              boxShadow: formatFilter === 'portrait' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Smartphone size={15} /> 📱 Portrait Reels (9:16 Full Height)
          </button>
          <button
            type="button"
            onClick={() => setFormatFilter('landscape')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: formatFilter === 'landscape' ? '700' : '600',
              border: 'none',
              background: formatFilter === 'landscape' ? '#FFFFFF' : 'transparent',
              color: formatFilter === 'landscape' ? '#7C5CFF' : '#64748B',
              boxShadow: formatFilter === 'landscape' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Monitor size={15} /> 🖥️ Landscape Cinema (16:9 Widescreen)
          </button>
        </div>

        <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>
          Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'package' : 'packages'}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div 
        className="gallery-cards-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', 
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#64748B', fontSize: '15px' }}>
            No gallery packages available matching this filter. Try selecting <strong>All Formats</strong>!
          </div>
        ) : (
          filtered.map(item => {
            const isVideoMedia = item.isVideo || 
              item.category?.toLowerCase().includes('video') || 
              item.deliverableType?.toLowerCase().includes('video') ||
              isLikelyVideoUrl(item.mediaUrl) || 
              isLikelyVideoUrl(item.thumbnail);

            const itemRatio = item.aspectRatio || detectVideoAspectRatio(item);
            const isPortrait = itemRatio === 'portrait';
            const videoEmbed = isVideoMedia ? getEmbeddableVideoUrl(item.mediaUrl || item.thumbnail) : null;
            
            // Full-size media container height: 380px for portrait reels so you see the full video, 210px for landscape widescreen
            const mediaHeight = isPortrait ? '380px' : '210px';

            return (
              <div 
                key={item.id} 
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, boxShadow 0.2s'
                }}
              >
                <div>
                  {/* Media Container: Full-size height dynamically adapts to Portrait (380px) vs Landscape (210px) */}
                  <div 
                    style={{ 
                      height: mediaHeight, 
                      background: '#000000', 
                      position: 'relative', 
                      overflow: 'hidden', 
                      borderBottom: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'height 0.3s ease'
                    }}
                  >
                    {(() => {
                      if (videoEmbed && videoEmbed.type === 'iframe') {
                        return (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
                            <iframe 
                              src={videoEmbed.url} 
                              style={{ width: '100%', height: '100%', border: 'none' }} 
                              allow="autoplay; encrypted-media; fullscreen" 
                              allowFullScreen
                              title={item.title} 
                            />
                          </div>
                        );
                      }
                      if (videoEmbed && videoEmbed.type === 'video') {
                        return (
                          <video 
                            src={videoEmbed.url} 
                            poster={item.thumbnail !== item.mediaUrl ? item.thumbnail : undefined}
                            controls 
                            playsInline
                            preload="metadata"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: isPortrait ? 'contain' : 'cover',
                              background: '#000000'
                            }} 
                          />
                        );
                      }
                      if (item.thumbnail) {
                        return (
                          <div 
                            style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
                            onClick={() => setPreviewItem(item)}
                          >
                            <img 
                              src={item.thumbnail} 
                              alt={item.title} 
                              style={{ width: '100%', height: '100%', objectFit: isPortrait ? 'contain' : 'cover' }} 
                            />
                            {isVideoMedia && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}>
                                  <Play size={24} color="#7C5CFF" fill="#7C5CFF" style={{ marginLeft: '2px' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C5CFF' }}>
                          <Sparkles size={32} />
                        </div>
                      );
                    })()}

                    {/* Format Orientation Badge (Top Left) */}
                    {isVideoMedia && (
                      <span 
                        style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          left: '10px', 
                          background: 'rgba(15, 23, 42, 0.85)', 
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          border: '1px solid rgba(255,255,255,0.15)', 
                          zIndex: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isPortrait ? <Smartphone size={12} color="#A78BFA" /> : <Monitor size={12} color="#38BDF8" />}
                        {isPortrait ? '9:16 Portrait' : '16:9 Landscape'}
                      </span>
                    )}

                    {/* Category Badge (Top Right) */}
                    <span 
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        background: '#FFFFFF', 
                        color: '#7C5CFF', 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        border: '1px solid #E2E8F0', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
                        zIndex: 3 
                      }}
                    >
                      {item.category || 'Package'}
                    </span>

                    {/* Watch Full Size Button (Bottom Right of Media) */}
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      title="Watch Full Size Video"
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        zIndex: 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}
                    >
                      <Maximize2 size={12} /> Watch Full Size
                    </button>

                    {/* Direct link for Drive links */}
                    {item.mediaUrl?.includes('drive.google.com') && (
                      <a
                        href={item.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Original Video in New Tab"
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '10px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          padding: '5px 8px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          zIndex: 3
                        }}
                      >
                        <ExternalLink size={12} /> Full Video
                      </a>
                    )}
                  </div>

                  {/* Card Content Area */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '6px', lineHeight: '1.3' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.4' }}>
                      {item.subtitle}
                    </p>

                    <div style={{ padding: '10px 12px', background: '#F5F3FF', borderRadius: '8px', fontSize: '13px', color: '#6D28D9', marginBottom: '14px', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>💰 <strong>Admin Approved Price:</strong></span>
                      <strong style={{ fontSize: '14px', color: '#4C1D95' }}>₹{String(item.indicativePrice || '15,000').replace('₹', '')}</strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="duolingo-secondary-btn"
                    style={{ flex: 1, padding: '9px 10px', fontSize: '12px', minHeight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    onClick={() => setPreviewItem(item)}
                  >
                    <Eye size={14} /> View Details
                  </button>
                  <button
                    type="button"
                    className="duolingo-primary-btn"
                    style={{ flex: 1, padding: '9px 10px', fontSize: '12px', minHeight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: 'linear-gradient(135deg, #7C5CFF, #6366F1)', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                    onClick={() => setBookingModalItem(item)}
                  >
                    <Check size={14} /> Book Service
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Details Video Modal */}
      {previewItem && (
        <StylePreviewModal
          card={{
            ...previewItem,
            title: previewItem.title,
            style: previewItem.category,
            type: previewItem.category,
            indicativePrice: previewItem.indicativePrice,
            mediaUrl: previewItem.mediaUrl,
            thumbnail: previewItem.thumbnail,
            aspectRatio: previewItem.aspectRatio || detectVideoAspectRatio(previewItem),
            subtitle: previewItem.subtitle
          }}
          onSelect={() => {
            const item = previewItem;
            setPreviewItem(null);
            setBookingModalItem(item);
          }}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {/* Booking Confirmation Modal */}
      {bookingModalItem && (
        <div className="admin-modal-overlay" onClick={() => setBookingModalItem(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              Confirm Booking: {bookingModalItem.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
              Reserve this benchmark service package. Our creative lead will review your requirements.
            </p>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Deliverable:</span>
                <strong style={{ color: '#0F172A' }}>{bookingModalItem.category}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Format:</span>
                <strong style={{ color: '#0F172A' }}>{bookingModalItem.aspectRatio === 'portrait' ? '📱 9:16 Portrait' : '🖥️ 16:9 Landscape'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Indicative Budget:</span>
                <strong style={{ color: '#7C5CFF', fontSize: '14px' }}>₹{String(bookingModalItem.indicativePrice || '15,000').replace('₹', '')}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Preferred Shoot / Delivery Date:
              </label>
              <input 
                type="date" 
                value={preferredDate} 
                onChange={e => setPreferredDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="duolingo-secondary-btn" 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setBookingModalItem(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="duolingo-primary-btn" 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #7C5CFF, #6366F1)', color: '#FFF', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                onClick={() => handleConfirmBooking(bookingModalItem)}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerGalleryView;
