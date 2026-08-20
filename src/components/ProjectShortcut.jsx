import React, { useState } from 'react';
import { Camera, Video, Palette, Globe, Package, Share2, PlusCircle, ArrowRight } from 'lucide-react';

export function ProjectShortcut({ onSelectProject }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubType, setSelectedSubType] = useState(null);

  const categories = [
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'packaging', label: 'Packaging', icon: Package },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'other', label: 'Other', icon: PlusCircle }
  ];

  const videoSubTypes = [
    'Brand Film',
    'Product Video',
    'Advertisement',
    'Reel / Short',
    'Testimonial',
    'Event Coverage'
  ];

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    if (catId !== 'video') {
      onSelectProject({ category: catId, subType: '' });
    }
  };

  const handleSubTypeClick = (sub) => {
    setSelectedSubType(sub);
    onSelectProject({ category: 'video', subType: sub });
  };

  return (
    <div className="onboarding-card-wrapper fade-in">
      <div className="step-header">
        <h2 className="step-title">What do you need to build?</h2>
        <p className="step-subtitle">Select the primary deliverable for your project.</p>
      </div>

      <div className="shortcut-grid">
        {categories.map((cat) => {
          const IconComp = cat.icon;
          return (
            <div
              key={cat.id}
              className={`shortcut-card ${selectedCategory === cat.id ? 'card-selected' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <IconComp size={24} className="cat-icon" />
              <span>{cat.label}</span>
            </div>
          );
        })}
      </div>

      {selectedCategory === 'video' && (
        <div className="subtype-panel fade-in">
          <h4 className="subtype-heading">Select Video Type:</h4>
          <div className="subtype-chips">
            {videoSubTypes.map((sub) => (
              <button
                key={sub}
                type="button"
                className={`chip-select ${selectedSubType === sub ? 'chip-active' : ''}`}
                onClick={() => handleSubTypeClick(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
