import { storage } from '../utils/storage.js';

const REFERENCE_KEY = 'ADDUS_ADMIN_REFERENCE_LIBRARY';

const DEFAULT_REFERENCES = [
  {
    id: 'ref_resort_video_1',
    title: 'Resort Presentation video',
    subtitle: '4k video + Model',
    category: 'Video Shoot',
    deliverableType: 'Video Shoot',
    aspectRatio: 'portrait',
    mediaUrl: '/videos/cozy_office_decor.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    indicativePrice: '15,000',
    isActive: true,
    isVideo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ref_video_1',
    title: 'Cinematic Commercial Video Shoot',
    subtitle: '4K Commercial Shoot • Studio Lighting & Motion Graphics',
    category: 'Video Shoot',
    deliverableType: 'Video Shoot',
    aspectRatio: 'landscape',
    mediaUrl: '/videos/cozy_office_decor.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80',
    indicativePrice: 'Price available after expert review',
    isActive: true,
    isVideo: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ref_photo_1',
    title: 'Studio Product Photography',
    subtitle: 'High-Res Studio Showcase & Lens Macro Shots',
    category: 'Photo Shoot',
    deliverableType: 'Photo Shoot',
    aspectRatio: 'landscape',
    mediaUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80',
    indicativePrice: '₹15,000 - ₹30,000',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ref_branding_1',
    title: 'Minimalist Brand Identity & Guidelines',
    subtitle: 'Logo geometry, brand colors & vector typography assets',
    category: 'Branding',
    deliverableType: 'Branding',
    aspectRatio: 'landscape',
    mediaUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=600&q=80',
    indicativePrice: '₹12,000 - ₹25,000',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ref_video_edit_1',
    title: 'Post-Production Video & Photo Editing',
    subtitle: 'Color Grading, Audio Mix & VFX Motion Graphics',
    category: 'Video & Photo Editing',
    deliverableType: 'Video & Photo Editing',
    aspectRatio: 'landscape',
    mediaUrl: '/videos/cozy_office_decor.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80',
    indicativePrice: '₹10,000 - ₹20,000',
    isActive: true,
    isVideo: true,
    createdAt: new Date().toISOString()
  }
];

export const referenceLibraryService = {
  getReferences() {
    const raw = storage.get(REFERENCE_KEY, DEFAULT_REFERENCES);
    return (raw || []).map(item => {
      const isVideo = item.isVideo || 
        item.category?.toLowerCase().includes('video') || 
        item.deliverableType?.toLowerCase().includes('video') ||
        item.title?.toLowerCase().includes('video');
      let aspectRatio = item.aspectRatio;
      if (!aspectRatio) {
        const str = `${item.title || ''} ${item.subtitle || ''} ${item.category || ''}`.toLowerCase();
        if (str.includes('portrait') || str.includes('vertical') || str.includes('reel') || str.includes('model') || str.includes('resort')) {
          aspectRatio = 'portrait';
        } else {
          aspectRatio = 'landscape';
        }
      }
      return {
        ...item,
        isVideo: isVideo || false,
        aspectRatio
      };
    });
  },

  getActiveReferences(category = null) {
    const all = this.getReferences().filter(r => r.isActive !== false);
    if (!category || category === 'All') return all;
    return all.filter(r => 
      r.category?.toLowerCase() === category.toLowerCase() || 
      r.deliverableType?.toLowerCase() === category.toLowerCase()
    );
  },

  saveReference(item) {
    const all = this.getReferences();
    const existingIdx = all.findIndex(r => r.id === item.id);
    let updated = [];
    if (existingIdx >= 0) {
      updated = [...all];
      updated[existingIdx] = { ...updated[existingIdx], ...item, updatedAt: new Date().toISOString() };
    } else {
      const newItem = {
        id: item.id || `ref_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
        isActive: item.isActive !== undefined ? item.isActive : true,
        ...item
      };
      updated = [newItem, ...all];
    }
    storage.set(REFERENCE_KEY, updated);
    window.dispatchEvent(new CustomEvent('addus_references_updated', { detail: updated }));
    return updated;
  },

  deleteReference(id) {
    const all = this.getReferences();
    const updated = all.filter(r => r.id !== id);
    storage.set(REFERENCE_KEY, updated);
    window.dispatchEvent(new CustomEvent('addus_references_updated', { detail: updated }));
    return updated;
  },

  toggleActive(id) {
    const all = this.getReferences();
    const updated = all.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    storage.set(REFERENCE_KEY, updated);
    window.dispatchEvent(new CustomEvent('addus_references_updated', { detail: updated }));
    return updated;
  }
};
