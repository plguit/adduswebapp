import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Check, Clock, Eye, Layers } from 'lucide-react';
import { referenceLibraryService } from '../../../shared/services/referenceLibraryService.js';
import { StylePreviewModal } from './StylePreviewModal.jsx';

const CATEGORIES = [
  'All',
  '🎥 Video Shoot',
  '📸 Photo Shoot',
  '🎨 Branding & Logo',
  '📱 Social Media Management',
  '📢 Paid Advertisements',
  '📈 Marketing Strategy',
  '✂️ Video & Photo Editing',
  '📦 Product & Packaging Design',
  '🚀 Product Launch Campaign',
  '✍️ Content & Copywriting',
  '🪄 Influencer & Talent Sourcing'
];

export function CustomerGalleryView({ selectedCategory = 'All', onBack, onBookPackage }) {
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'All');
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
    if (activeCategory === 'All') return true;
    const cat = cleanCat(r.category || r.deliverableType || r.title || '');
    const target = cleanCat(activeCategory);
    return cat.includes(target) || target.includes(cat);
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
      preferredShootDate: preferredDate || null,
      status: 'planning',
      notes: `Booked from Admin Reference Gallery (${item.title})`
    };

    if (typeof onBookPackage === 'function') {
      onBookPackage(projectPayload);
    }
    setBookingModalItem(null);
  };

  return (
    <div className="customer-gallery-container fade-in" style={{ padding: '24px 24px 100px 24px', color: '#FFF' }}>
      {/* Header */}
      <div className="flex-between margin-bottom-20" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="duolingo-secondary-btn micro-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={22} style={{ color: '#00D1FF' }} /> Creative Inspiration &amp; Package Gallery
            </h2>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
              Explore admin-approved creative packages, portfolio references, and indicative budgets.
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="folder-pills-row margin-bottom-24" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`folder-pill ${activeCategory === cat ? 'folder-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: activeCategory === cat ? '1px solid #00D1FF' : '1px solid rgba(255,255,255,0.1)',
              background: activeCategory === cat ? 'rgba(0,209,255,0.15)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? '#00D1FF' : '#9CA3AF',
              fontWeight: activeCategory === cat ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Cards Grid */}
      <div className="gallery-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', color: '#9CA3AF' }}>
            No gallery packages available in this category yet. Check back soon!
          </div>
        ) : (
          filtered.map(item => (
            <div 
              key={item.id} 
              style={{
                background: '#1A1A24',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
            >
              <div>
                {/* Media Thumbnail */}
                <div style={{ height: '150px', background: '#0F0F16', position: 'relative', overflow: 'hidden' }}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D1FF' }}>
                      <Sparkles size={32} />
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: '#00D1FF', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(0,209,255,0.3)' }}>
                    {item.category || 'Package'}
                  </span>
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFF', marginBottom: '6px' }}>{item.title}</h3>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '14px', lineHeight: '1.4' }}>{item.subtitle}</p>

                  <div style={{ padding: '10px 12px', background: 'rgba(124,92,255,0.1)', borderRadius: '8px', fontSize: '13px', color: '#A78BFA', marginBottom: '14px', border: '1px solid rgba(124,92,255,0.2)' }}>
                    💰 <strong>Admin Approved Price:</strong> {item.indicativePrice || 'Price available after expert review'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="duolingo-secondary-btn"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '12px', minHeight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  onClick={() => setPreviewItem(item)}
                >
                  <Eye size={14} /> View Details
                </button>
                <button
                  type="button"
                  className="duolingo-primary-btn"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '12px', minHeight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'linear-gradient(135deg, #00D1FF, #7c5cff)', border: 'none' }}
                  onClick={() => setBookingModalItem(item)}
                >
                  <Check size={14} /> Book Service
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <StylePreviewModal
          card={{ title: previewItem.title, style: previewItem.category, type: previewItem.category, indicativePrice: previewItem.indicativePrice }}
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
        <div className="celebration-modal-backdrop fade-in" style={{ zIndex: 9999 }} onClick={() => setBookingModalItem(null)}>
          <div className="celebration-modal-card scale-in" style={{ maxWidth: '440px', textAlign: 'left', padding: '24px', background: '#14141B', border: '1px solid rgba(0,209,255,0.3)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', marginBottom: '8px' }}>
              Confirm Booking: {bookingModalItem.title}
            </h3>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>
              {bookingModalItem.subtitle}
            </p>

            <div style={{ padding: '12px', background: '#1A1A24', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Approved Indicative Price:</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#00D1FF', marginTop: '2px' }}>
                {bookingModalItem.indicativePrice || 'Price available after expert review'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#FFF', marginBottom: '6px' }}>
                Preferred Shoot / Delivery Date (Optional)
              </label>
              <input
                type="date"
                className="duolingo-text-input"
                style={{ width: '100%', background: '#1A1A24', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                value={preferredDate}
                onChange={e => setPreferredDate(e.target.value)}
              />
            </div>

            <div className="flex-end-gap">
              <button className="duolingo-secondary-btn" onClick={() => setBookingModalItem(null)}>Cancel</button>
              <button className="duolingo-primary-btn" onClick={() => handleConfirmBooking(bookingModalItem)}>
                Confirm &amp; Launch Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
