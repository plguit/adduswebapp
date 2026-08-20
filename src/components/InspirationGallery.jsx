import React, { useState } from 'react';
import { Eye, Clock, DollarSign, ArrowRight } from 'lucide-react';

export function InspirationGallery({ onSelectInspiration }) {
  const [activeCategory, setActiveCategory] = useState('Luxury');
  const [selectedItem, setSelectedItem] = useState(null);

  const categories = ['Luxury', 'Corporate', 'Restaurant', 'Clinic', 'Retail', 'Fashion'];

  const galleryItems = [
    {
      id: 1,
      category: 'Luxury',
      title: 'Aura Boutique Resort Promo',
      duration: '30s Film',
      budget: '$2,500 - $4,000',
      gradient: 'linear-gradient(135deg, #7C5CFF 0%, #1E1B4B 100%)'
    },
    {
      id: 2,
      category: 'Luxury',
      title: 'Zenith Watch Collection',
      duration: '15s Reel',
      budget: '$1,800 - $3,000',
      gradient: 'linear-gradient(135deg, #49C6FF 0%, #0F172A 100%)'
    },
    {
      id: 3,
      category: 'Corporate',
      title: 'FinTech App Launch Demo',
      duration: '45s Script',
      budget: '$3,000 - $5,000',
      gradient: 'linear-gradient(135deg, #34D399 0%, #064E3B 100%)'
    },
    {
      id: 4,
      category: 'Restaurant',
      title: 'Bistro Gourmet Reel',
      duration: '15s Reel',
      budget: '$1,200 - $2,000',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #451A03 100%)'
    },
    {
      id: 5,
      category: 'Clinic',
      title: 'Aesthetic Medical Walkthrough',
      duration: '60s Tour',
      budget: '$2,200 - $3,500',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #500724 100%)'
    },
    {
      id: 6,
      category: 'Fashion',
      title: 'Velvet Autumn Runway Shoot',
      duration: '30s Promo',
      budget: '$3,500 - $6,000',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #2E1065 100%)'
    }
  ];

  const filteredItems = galleryItems.filter(item => item.category === activeCategory);

  const handleChoose = (item) => {
    setSelectedItem(item.id);
    onSelectInspiration(item);
  };

  return (
    <div className="onboarding-card-wrapper fade-in" style={{ maxWidth: 540 }}>
      <div className="step-header">
        <h2 className="step-title">Inspiration Gallery</h2>
        <p className="step-subtitle">Explore examples of how businesses can present themselves through video and content.</p>
      </div>

      <div className="gallery-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`gallery-tab ${activeCategory === cat ? 'tab-active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`gallery-card ${selectedItem === item.id ? 'gallery-card-selected' : ''}`}
            onClick={() => handleChoose(item)}
          >
            <div className="gallery-preview" style={{ background: item.gradient }}>
              <span className="preview-badge">{item.category}</span>
            </div>
            <div className="gallery-info">
              <h4 className="item-title">{item.title}</h4>
              <div className="item-meta">
                <span><Clock size={12} /> {item.duration}</span>
                <span><DollarSign size={12} /> {item.budget}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="primary-btn margin-top-20"
        onClick={() => onSelectInspiration(galleryItems[0])}
      >
        <span>Continue</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
