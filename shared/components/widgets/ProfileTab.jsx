import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Upload, Building2, Package, FileText, Globe, CheckCircle2 } from 'lucide-react';
import { NotificationEngine } from '../../../src/services/brain/UniversalNotificationEngine.js';

export function ProfileTab({ userProfile, brain = {}, userId, onBack, onSaveProfile }) {
  const p = userProfile || {};
  const br = brain || {};

  const [bizName, setBizName] = useState(br.businessName || '');
  const [bizInd, setBizInd] = useState(br.industry || '');
  const [bizStage, setBizStage] = useState(br.businessStage || '');
  const [bizDesc, setBizDesc] = useState(br.businessDescription || '');
  const [bizWeb, setBizWeb] = useState(br.website || '');
  const [bizGoal, setBizGoal] = useState(br.businessGoal || '');

  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  const [assetName, setAssetName] = useState('');
  const [assetCat, setAssetCat] = useState('Logo Reference');

  const handleSaveBusiness = (e) => {
    if (e) e.preventDefault();
    const updatedBrain = {
      ...br,
      businessName: bizName,
      industry: bizInd,
      businessStage: bizStage,
      businessDescription: bizDesc,
      website: bizWeb,
      businessGoal: bizGoal
    };
    if (typeof onSaveProfile === 'function') {
      onSaveProfile({ businessBrain: updatedBrain });
    }
    alert('Business Profile saved successfully!');
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const products = br.productsList || [];
    const newProd = {
      id: `prod_${Date.now()}`,
      name: prodName.trim(),
      category: prodCat.trim(),
      description: prodDesc.trim(),
      createdAt: new Date().toISOString()
    };
    const updatedBrain = {
      ...br,
      productsList: [...products, newProd],
      products: [...(br.products || []), prodName.trim()]
    };
    if (typeof onSaveProfile === 'function') {
      onSaveProfile({ businessBrain: updatedBrain });
    }

    NotificationEngine.notify({
      userId: 'admin',
      role: 'Admin',
      type: 'product_added',
      title: 'New Product Added',
      message: `Customer ${p.name || 'User'} added product "${prodName}" to their profile.`
    });

    setProdName('');
    setProdCat('');
    setProdDesc('');
    alert('Product added successfully!');
  };

  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    const files = p.uploadedFiles || [];
    const newAsset = {
      id: `file_${Date.now()}`,
      name: assetName.trim(),
      category: assetCat,
      uploadedAt: new Date().toISOString()
    };
    const updatedFiles = [...files, newAsset];

    if (typeof onSaveProfile === 'function') {
      onSaveProfile({ uploadedFiles: updatedFiles });
    }

    NotificationEngine.notify({
      userId: 'admin',
      role: 'Admin',
      type: 'asset_uploaded',
      title: 'New Asset Uploaded',
      message: `Customer ${p.name || 'User'} uploaded asset "${assetName}" in category "${assetCat}".`
    });

    setAssetName('');
    alert('Asset saved to Business Vault!');
  };

  return (
    <div className="profile-container fade-in" style={{ padding: '24px 24px 100px 24px', color: '#FFF' }}>
      {/* Header */}
      <div className="flex-between margin-bottom-20" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="duolingo-secondary-btn micro-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#FFF' }}>
              Business Profile &amp; Vault
            </h2>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
              Manage your business metadata, product offerings, and brand collateral.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Business Information Card */}
        <div className="admin-card" style={{ background: '#1A1A24', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#00D1FF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} /> Business Information
          </h3>

          <form onSubmit={handleSaveBusiness} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Business Name</label>
              <input type="text" className="duolingo-text-input" style={{ width: '100%', background: '#14141B', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} value={bizName} onChange={e => setBizName(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Industry</label>
                <input type="text" className="duolingo-text-input" style={{ width: '100%', background: '#14141B', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} value={bizInd} onChange={e => setBizInd(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Stage</label>
                <input type="text" className="duolingo-text-input" style={{ width: '100%', background: '#14141B', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} value={bizStage} onChange={e => setBizStage(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Website URL</label>
              <input type="text" className="duolingo-text-input" style={{ width: '100%', background: '#14141B', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} value={bizWeb} onChange={e => setBizWeb(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '4px' }}>Business Summary</label>
              <textarea rows={3} className="duolingo-text-input" style={{ width: '100%', background: '#14141B', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} value={bizDesc} onChange={e => setBizDesc(e.target.value)} />
            </div>

            <button type="submit" className="duolingo-primary-btn margin-top-8" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Save size={16} /> Save Business Profile
            </button>
          </form>
        </div>

        {/* Product Catalog Card */}
        <div className="admin-card" style={{ background: '#1A1A24', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#00D1FF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} /> Product &amp; Service Offerings
          </h3>

          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <input type="text" className="duolingo-text-input" placeholder="Product Name (e.g. Executive Laptop Bag)" style={{ width: '100%', background: '#14141B', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} value={prodName} onChange={e => setProdName(e.target.value)} required />
            <input type="text" className="duolingo-text-input" placeholder="Category (e.g. Leather Goods)" style={{ width: '100%', background: '#14141B', color: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} value={prodCat} onChange={e => setProdCat(e.target.value)} />
            <button type="submit" className="duolingo-secondary-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Product to Profile
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(br.productsList || []).map((item, idx) => (
              <div key={idx} style={{ background: '#14141B', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>{item.name}</strong> ({item.category || 'General'})</span>
                <CheckCircle2 size={14} style={{ color: '#34D399' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
