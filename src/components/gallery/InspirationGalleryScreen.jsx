import React, { useState } from 'react';
import { Eye, Clock, DollarSign, Film, Filter, Check, ArrowLeft, Sparkles } from 'lucide-react';

/**
 * Inspiration Gallery Component
 * Categorized, filtered reference showcase with duration, style tags, budget estimates, and preview cards.
 */
export function InspirationGalleryScreen({ onSelectReference = null, onBack = null }) {
  const [activeCategory, setActiveCategory] = useState('Luxury');
  const [selectedBudget, setSelectedBudget] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);

  const categories = [
    'Luxury',
    'Corporate',
    'Restaurant',
    'Clinic',
    'Fashion',
    'Retail',
    'Resort',
    'Product'
  ];

  const galleryItems = [
    {
      id: 'gallery_1',
      category: 'Luxury',
      title: 'Aura Boutique Resort Showcase',
      duration: '30s Film',
      style: 'Cinematic Luxury',
      videoType: 'Brand Film',
      budget: '$2,500 - $4,000',
      budgetTier: 'MEDIUM',
      gradient: 'linear-gradient(135deg, #7C5CFF 0%, #1E1B4B 100%)'
    },
    {
      id: 'gallery_2',
      category: 'Luxury',
      title: 'Zenith Fine Jewelry Promo',
      duration: '15s Reel',
      style: 'High-Contrast Editorial',
      videoType: 'Social Reel',
      budget: '$1,800 - $3,000',
      budgetTier: 'LOW',
      gradient: 'linear-gradient(135deg, #49C6FF 0%, #0F172A 100%)'
    },
    {
      id: 'gallery_3',
      category: 'Corporate',
      title: 'FinTech App Launch Demo',
      duration: '45s Overview',
      style: 'Minimal Modern',
      videoType: 'Product Promo',
      budget: '$3,000 - $5,000',
      budgetTier: 'MEDIUM',
      gradient: 'linear-gradient(135deg, #34D399 0%, #064E3B 100%)'
    },
    {
      id: 'gallery_4',
      category: 'Restaurant',
      title: 'Bistro Culinary Tasting Menu',
      duration: '15s Reel',
      style: 'Warm Aesthetic',
      videoType: 'Social Reel',
      budget: '$1,200 - $2,000',
      budgetTier: 'LOW',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #451A03 100%)'
    },
    {
      id: 'gallery_5',
      category: 'Clinic',
      title: 'Aesthetic Medical Walkthrough',
      duration: '60s Tour',
      style: 'Clean Professional',
      videoType: 'Walkthrough',
      budget: '$2,200 - $3,500',
      budgetTier: 'MEDIUM',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #500724 100%)'
    },
    {
      id: 'gallery_6',
      category: 'Fashion',
      title: 'Velvet Autumn Runway Film',
      duration: '30s Promo',
      style: 'Dynamic Motion',
      videoType: 'Brand Film',
      budget: '$3,500 - $6,000',
      budgetTier: 'HIGH',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #2E1065 100%)'
    },
    {
      id: 'gallery_7',
      category: 'Resort',
      title: 'Oceanfront Villa Experience',
      duration: '45s Tour',
      style: 'Drone & Sunset Mood',
      videoType: 'Brand Film',
      budget: '$5,000+',
      budgetTier: 'HIGH',
      gradient: 'linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)'
    },
    {
      id: 'gallery_8',
      category: 'Product',
      title: 'Matte Fragrance Unboxing',
      duration: '15s Short',
      style: 'Macro Studio Lighting',
      videoType: 'Product Promo',
      budget: '$1,500 - $2,500',
      budgetTier: 'LOW',
      gradient: 'linear-gradient(135deg, #A855F7 0%, #3B0764 100%)'
    },
    {
      id: 'gallery_9',
      category: 'Retail',
      title: 'Boutique Storefront Launch',
      duration: '30s Promo',
      style: 'Vibrant Lifestyle',
      videoType: 'Social Reel',
      budget: '$2,000 - $3,500',
      budgetTier: 'MEDIUM',
      gradient: 'linear-gradient(135deg, #10B981 0%, #064E3B 100%)'
    }
  ];

  // Filtering Logic
  const filteredItems = galleryItems.filter((item) => {
    if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
    if (selectedBudget !== 'ALL' && item.budgetTier !== selectedBudget) return false;
    if (selectedType !== 'ALL' && item.videoType !== selectedType) return false;
    return true;
  });

  const handleChooseReference = (item) => {
    setSelectedItem(item.id);
    if (typeof onSelectReference === 'function') {
      onSelectReference(item);
    }
  };

  return (
    <div className="inspiration-gallery-viewport fade-in">
      {/* Top Header */}
      <div className="gallery-header flex-between">
        <div className="flex-center">
          {onBack && (
            <button className="icon-btn-ghost" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="gallery-title">Inspiration Gallery</h2>
            <p className="gallery-sub">Curated execution benchmarks with duration, style & budget estimates.</p>
          </div>
        </div>
      </div>

      {/* Filter Dropdowns Bar */}
      <div className="filter-controls-row flex-between">
        <div className="filter-select-group flex-center">
          <Filter size={14} className="filter-icon" />

          {/* Budget Filter */}
          <select
            className="filter-select"
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
          >
            <option value="ALL">All Budgets</option>
            <option value="LOW">&lt; $2,500</option>
            <option value="MEDIUM">$2,500 - $5,000</option>
            <option value="HIGH">$5,000+</option>
          </select>

          {/* Video Type Filter */}
          <select
            className="filter-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Video Types</option>
            <option value="Brand Film">Brand Film</option>
            <option value="Social Reel">Social Reel</option>
            <option value="Product Promo">Product Promo</option>
            <option value="Walkthrough">Walkthrough</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="gallery-category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-tab-btn ${activeCategory === cat ? 'tab-selected' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Cards Grid */}
      <div className="inspiration-cards-grid margin-top-20">
        {filteredItems.length === 0 ? (
          <div className="empty-state-card flex-center w-full" style={{ gridColumn: '1 / -1' }}>
            <Film size={32} className="empty-icon" />
            <p className="empty-state-text">No references found matching active filters.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`inspiration-card ${selectedItem === item.id ? 'card-chosen' : ''}`}
              onClick={() => handleChooseReference(item)}
            >
              {/* Preview Thumbnail */}
              <div className="card-preview-thumb" style={{ background: item.gradient }}>
                <span className="preview-category-badge">{item.category}</span>
                <span className="preview-style-badge">{item.style}</span>
              </div>

              {/* Card Meta */}
              <div className="card-body-content">
                <h4 className="card-item-title">{item.title}</h4>
                <div className="card-meta-tags">
                  <span className="meta-pill"><Clock size={12} /> {item.duration}</span>
                  <span className="meta-pill"><Film size={12} /> {item.videoType}</span>
                  <span className="meta-pill budget-pill"><DollarSign size={12} /> {item.budget}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
