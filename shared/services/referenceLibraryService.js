import { storage } from '../utils/storage.js';

const REFERENCE_KEY = 'ADDUS_ADMIN_REFERENCE_LIBRARY';

const DEFAULT_REFERENCES = [
  {
    id: 'ref_web_1',
    title: 'Modern E-Commerce Experience',
    subtitle: 'High-converting layout, fast load time & interactive product cards',
    category: 'Website',
    deliverableType: 'Website',
    mediaUrl: '/products/frame_18.png',
    thumbnail: '/products/frame_18.png',
    indicativePrice: '₹25,000 - ₹45,000',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ref_logo_1',
    title: 'Minimalist Vector Identity',
    subtitle: 'Clean geometry, versatile scaling & brand mark design',
    category: 'Logo Design',
    deliverableType: 'Logo Design',
    mediaUrl: '/products/73690.jpg',
    thumbnail: '/products/73690.jpg',
    indicativePrice: '₹12,000 - ₹25,000',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ref_video_1',
    title: 'Cinematic Brand Film',
    subtitle: '4K Commercial Shoot • Spatial & Studio Lighting',
    category: 'Brand Film',
    deliverableType: 'Video Production',
    mediaUrl: '/videos/cozy_office_decor.mp4',
    thumbnail: '/products/73690.jpg',
    indicativePrice: 'Price available after expert review',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ref_photo_1',
    title: 'Studio Product Photography',
    subtitle: '360° Studio Showcase & Lens Macro Shots',
    category: 'Product Photography',
    deliverableType: 'Photography',
    mediaUrl: '/products/73689.jpg',
    thumbnail: '/products/73689.jpg',
    indicativePrice: '₹15,000 - ₹30,000',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const referenceLibraryService = {
  getReferences() {
    return storage.get(REFERENCE_KEY, DEFAULT_REFERENCES);
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
