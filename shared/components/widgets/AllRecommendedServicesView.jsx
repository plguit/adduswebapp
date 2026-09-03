import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { referenceLibraryService } from '../../../shared/services/referenceLibraryService.js';

const CATEGORIES = ['All', 'Video Shoot', 'Photo Shoot', 'Branding', 'Social Media Management', 'Paid Advertisements', 'Video & Photo Editing', 'Product & Packaging Design', 'Product Campaign', 'Content & Copywriting', 'Influencer & Collab'];

export function AllRecommendedServicesView({ onBack, selectedFilter = 'All' }) {
  const [fullscreenVideo, setFullscreenVideo] = useState(null);
  const [activeFilter, setActiveFilter] = useState(selectedFilter || 'All');
  const [references, setReferences] = useState([]);

  useEffect(() => {
    if (selectedFilter) {
      setActiveFilter(selectedFilter);
    }
    
    // Fetch data from admin reference library
    setReferences(referenceLibraryService.getActiveReferences());
    
    const handleSync = () => setReferences(referenceLibraryService.getActiveReferences());
    window.addEventListener('addus_references_updated', handleSync);
    return () => window.removeEventListener('addus_references_updated', handleSync);
  }, [selectedFilter]);

  const cleanCat = (catStr) => (catStr || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim().toLowerCase();

  // Combine fetched references with hardcoded mock items for a rich UI experience
  const mockItems = [
    { category: 'Video Shoot', title: 'Video Production', mediaUrl: '/videos/video1.mp4', indicativePrice: '₹15,000', includes: ['Influencer / Model', 'Camera', 'Script Writer', 'Video Editor'] },
    { category: 'Photo Shoot', title: 'Photography', mediaUrl: '/videos/video2.mp4', indicativePrice: '₹25,000', includes: ['Pro Camera Gear', 'Studio Lighting', 'Creative Director', 'Advanced Editing'] },
    { category: 'Video & Photo Editing', title: 'Video & Photo Editing', mediaUrl: '/videos/video3.mp4', indicativePrice: '₹10,000', includes: ['Basic Setup', 'Standard Lighting', 'Raw Footage', 'Minimal Edit'] },
    { category: 'Social Media Management', title: 'Social Media Management', mediaUrl: '/videos/video1.mp4', indicativePrice: '₹15,000', includes: ['Content Calendar', 'Daily Posting', 'Community Management'] },
    { category: 'Product & Packaging Design', title: 'Packaging Design', mediaUrl: '/videos/video2.mp4', indicativePrice: '₹18,000', includes: ['Box Design', 'Label Design', '3D Mockup'] },
    { category: 'Influencer & Collab', title: 'Influencer Marketing', mediaUrl: '/videos/video3.mp4', indicativePrice: '₹20,000', includes: ['Creator Sourcing', 'Content Brief', 'Campaign Management'] }
  ];

  // Map references to the UI format
  const mappedReferences = references.map(r => ({
    id: r.id,
    category: r.category || 'Package',
    title: r.title,
    mediaUrl: r.mediaUrl || r.thumbnail || '/videos/video1.mp4',
    indicativePrice: r.indicativePrice || 'Custom Price',
    includes: r.subtitle ? r.subtitle.split(',').map(s => s.trim()) : ['Standard Package', 'Professional Review']
  }));

  const allItems = [...mockItems, ...mappedReferences];

  const filteredItems = allItems.filter(item => {
    if (activeFilter === 'All') return true;
    const itemCat = cleanCat(item.category || item.title);
    const targetCat = cleanCat(activeFilter);
    return itemCat.includes(targetCat) || targetCat.includes(itemCat);
  });

  const isVideo = (url) => url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg'));

  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: '#F8F9FA', overflowY: 'auto', padding: '24px 16px'
    }}>
      {/* Fullscreen Media Overlay */}
      {fullscreenVideo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#000', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <button 
            onClick={() => setFullscreenVideo(null)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}
          >
            ✕
          </button>
          {isVideo(fullscreenVideo) ? (
            <video 
              src={fullscreenVideo}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <img src={fullscreenVideo} alt="Fullscreen Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button 
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '24px', color: '#111' }}
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px', color: '#111' }}>All Recommended Services</h1>
        
        {/* Category Pills (Sections) */}
        <div className="folder-pills-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`folder-pill ${activeFilter === cat ? 'folder-active' : ''}`}
              onClick={() => setActiveFilter(cat)}
              style={{
                padding: '10px 18px',
                borderRadius: '24px',
                border: activeFilter === cat ? '1px solid #111111' : '1px solid #E5E7EB',
                background: activeFilter === cat ? '#111111' : '#FFFFFF',
                color: activeFilter === cat ? '#FFFFFF' : '#6B7280',
                fontWeight: activeFilter === cat ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <style>{`
          .view-all-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            padding-bottom: 60px;
            max-width: 100%;
          }
          @media (min-width: 768px) {
            .view-all-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>

        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
            No gallery packages available in this category yet. Check back soon!
          </div>
        ) : (
          <div className="view-all-grid">
            {filteredItems.map((item, idx) => (
              <div key={item.id || idx} style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#FFF', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                <div style={{ width: '100%', paddingTop: '140%', position: 'relative', backgroundColor: '#000' }}>
                  {isVideo(item.mediaUrl) ? (
                    <video src={item.mediaUrl} autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={item.mediaUrl} alt={item.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <button type="button" onClick={() => setFullscreenVideo(item.mediaUrl)} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.9)', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', paddingLeft: isVideo(item.mediaUrl) ? '3px' : '0', zIndex: 2 }}>
                    {isVideo(item.mediaUrl) ? (
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5L12.5 8L1.5 14.5V1.5Z" fill="#111111" stroke="#111111" strokeWidth="2" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    )}
                  </button>
                  <span style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>
                    {item.category.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: '#FFFFFF', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '60%' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Includes</span>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#666', lineHeight: '1.4', listStyleType: 'disc' }}>{item.includes.map((inc, i) => <li key={i} style={{ paddingBottom: '2px' }}>{inc}</li>)}</ul>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', maxWidth: '40%' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111111', textAlign: 'right', lineHeight: '1.2' }}>{item.title}</h3>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#00D1FF' }}>{item.indicativePrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


