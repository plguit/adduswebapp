import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Image, Video, FileText, Link, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { referenceLibraryService } from '../../../../shared/services/referenceLibraryService.js';

const CATEGORIES = [
  'Website', 'Logo Design', 'Brand Identity', 'Packaging', 
  'Photography', 'Product Photography', 'Video Ad', 'Brand Film', 
  'Social Content', 'UI/UX', 'Graphic Design'
];

export function ReferencesTab({ dataSource = 'localStorage', adminReady = false }) {
  const [references, setReferences] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    category: 'Website',
    deliverableType: 'Website',
    mediaUrl: '',
    thumbnail: '',
    indicativePrice: '',
    isActive: true
  });

  const loadReferences = () => {
    setReferences(referenceLibraryService.getReferences());
  };

  useEffect(() => {
    loadReferences();
    const handleSync = () => loadReferences();
    window.addEventListener('addus_references_updated', handleSync);
    return () => window.removeEventListener('addus_references_updated', handleSync);
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      title: '',
      subtitle: '',
      category: 'Website',
      deliverableType: 'Website',
      mediaUrl: '',
      thumbnail: '',
      indicativePrice: 'Price available after expert review',
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title || '',
      subtitle: item.subtitle || '',
      category: item.category || 'Website',
      deliverableType: item.deliverableType || item.category || 'Website',
      mediaUrl: item.mediaUrl || '',
      thumbnail: item.thumbnail || '',
      indicativePrice: item.indicativePrice || 'Price available after expert review',
      isActive: item.isActive !== false
    });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    referenceLibraryService.saveReference({
      id: editingItem?.id,
      ...form,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      indicativePrice: form.indicativePrice.trim() || 'Price available after expert review'
    });
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this reference asset?')) {
      referenceLibraryService.deleteReference(id);
    }
  };

  const handleToggleActive = (id) => {
    referenceLibraryService.toggleActive(id);
  };

  const filtered = references.filter(r => 
    filterCategory === 'All' ? true : r.category?.toLowerCase() === filterCategory.toLowerCase()
  );

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header flex-between">
        <div>
          <h2>🎨 Admin Reference Library & Budget Control</h2>
          <p className="admin-section-sub">Manage active customer inspiration assets, reference videos, images, and approved indicative pricing.</p>
        </div>
        <button className="admin-primary-btn" onClick={handleOpenAdd}>
          <Plus size={16} /> Add New Reference Asset
        </button>
      </div>

      {/* Category Pills */}
      <div className="folder-pills-row margin-top-16">
        <button 
          className={`folder-pill ${filterCategory === 'All' ? 'folder-active' : ''}`}
          onClick={() => setFilterCategory('All')}
        >
          <span>All Items ({references.length})</span>
        </button>
        {CATEGORIES.map(cat => {
          const count = references.filter(r => r.category === cat).length;
          return (
            <button
              key={cat}
              className={`folder-pill ${filterCategory === cat ? 'folder-active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              <span>{cat}</span>
              <span className="folder-count-chip">{count}</span>
            </button>
          );
        })}
      </div>

      {/* References Grid */}
      <div className="projects-list-grid margin-top-20" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map(item => (
          <div key={item.id} className="admin-card flex-col justify-between" style={{ border: item.isActive ? '1px solid rgba(124,92,255,0.3)' : '1px solid rgba(255,255,255,0.08)', background: '#1A1A24', borderRadius: '12px', padding: '16px' }}>
            <div>
              <div className="flex-between margin-bottom-8">
                <span className="admin-badge admin-badge-indigo">{item.category}</span>
                <button
                  className="micro-btn"
                  style={{ background: 'none', border: 'none', color: item.isActive ? '#34D399' : '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                  onClick={() => handleToggleActive(item.id)}
                >
                  {item.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                  {item.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              {item.thumbnail && (
                <div style={{ height: '120px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: '#000' }}>
                  <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#FFF', marginBottom: '4px' }}>{item.title}</h4>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px', lineHeight: '1.4' }}>{item.subtitle}</p>

              <div style={{ padding: '8px 10px', background: 'rgba(124,92,255,0.08)', borderRadius: '6px', fontSize: '12px', color: '#A78BFA', marginBottom: '12px' }}>
                💰 <strong>Indicative Budget:</strong> {item.indicativePrice || 'Price available after expert review'}
              </div>
            </div>

            <div className="flex-end-gap margin-top-12" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
              <button className="duolingo-secondary-btn micro-btn" onClick={() => handleOpenEdit(item)}>
                <Edit2 size={13} /> Edit
              </button>
              <button className="duolingo-secondary-btn micro-btn" style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => handleDelete(item.id)}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 className="modal-title">{editingItem ? '✏️ Edit Reference Asset' : '➕ Add New Reference Asset'}</h3>

            <form onSubmit={handleSave} className="margin-top-16 flex-col gap-12">
              <div className="admin-field-group">
                <label className="admin-field-label">Reference Title *</label>
                <input 
                  type="text" 
                  className="admin-field-input" 
                  placeholder="e.g. Modern E-Commerce Landing Page"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required 
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Short Subtitle / Style Description</label>
                <input 
                  type="text" 
                  className="admin-field-input" 
                  placeholder="e.g. High converting layout, fast loading, dark aesthetic"
                  value={form.subtitle}
                  onChange={e => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="admin-field-group">
                  <label className="admin-field-label">Service Category</label>
                  <select 
                    className="admin-field-input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value, deliverableType: e.target.value })}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="admin-field-group">
                  <label className="admin-field-label">Indicative Budget / Price Range</label>
                  <input 
                    type="text" 
                    className="admin-field-input" 
                    placeholder="e.g. ₹25,000 - ₹45,000"
                    value={form.indicativePrice}
                    onChange={e => setForm({ ...form, indicativePrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">Media Asset URL / Cloud Link (Video, Image, PDF)</label>
                <input 
                  type="text" 
                  className="admin-field-input" 
                  placeholder="https://... or /products/frame_18.png"
                  value={form.mediaUrl}
                  onChange={e => setForm({ ...form, mediaUrl: e.target.value, thumbnail: e.target.value })}
                />
              </div>

              <div className="flex-end-gap margin-top-16">
                <button type="button" className="duolingo-secondary-btn" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-primary-btn">Save Reference Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
