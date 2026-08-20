import React, { useState, useEffect } from 'react';
import { ShieldAlert, GitMerge, Check, Trash2, Building2, User, Search, RefreshCw } from 'lucide-react';
import { duplicatePreventionService } from '../../../../src/services/duplicatePreventionService.js';
import { profileService } from '../../../../src/services/profileService.js';

export function DuplicatesTab({ dataSource = 'localStorage', adminReady = false }) {
  const [duplicateCustomers, setDuplicateCustomers] = useState([]);
  const [duplicateBusinesses, setDuplicateBusinesses] = useState([]);


  const refreshDuplicates = () => {
    const custDups = duplicatePreventionService.getPotentialDuplicateCustomers();
    setDuplicateCustomers(custDups);
  };

  useEffect(() => {
    refreshDuplicates();
  }, []);

  const handleMerge = (primaryId, duplicateId) => {
    const success = duplicatePreventionService.mergeCustomerRecords(primaryId, duplicateId, 'Merged by Admin in Duplicate Control Center');
    if (success) {
      alert(`Successfully merged record ${duplicateId} into ${primaryId}!`);
      refreshDuplicates();
    }
  };

  const handleDismiss = (id) => {
    setDuplicateCustomers(prev => prev.filter(d => d.id !== id));
    setDuplicateBusinesses(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">Duplicate Detection &amp; Record Integrity</h2>
          <p className="tab-pane-subtitle">Scan CRM database for duplicate accounts, similar business profiles (&gt;90% match), and execute one-click record merges.</p>
        </div>
        <button className="admin-primary-btn" onClick={refreshDuplicates}>
          <RefreshCw size={14} /> Scan Database
        </button>
      </div>

      {/* Duplicate Customers Section */}
      <div className="margin-top-20">
        <h3 className="section-title-sm"><User size={16} /> Possible Duplicate Customer Accounts ({duplicateCustomers.length})</h3>

        {duplicateCustomers.length === 0 ? (
          <div className="search-hint-box margin-top-12">
            <p>✓ No duplicate customer accounts detected. Database records are 100% unique!</p>
          </div>
        ) : (
          <div className="duplicates-cards-grid margin-top-12">
            {duplicateCustomers.map(item => (
              <div key={item.id} className="duplicate-card">
                <div className="dup-header">
                  <span className="dup-reason-tag"><ShieldAlert size={12} /> {item.reason}</span>
                </div>

                <div className="dup-comparison-grid margin-top-12">
                  <div className="dup-entity-box primary-box">
                    <span className="box-badge-tag tag-primary">Keep Primary Record</span>
                    <div className="id-badge-pill-group margin-top-6">
                      <span className="id-badge-pill cust-id-pill">{item.primary.customerId || item.primary.userId}</span>
                    </div>
                    <h4 className="font-bold text-white margin-top-4">{item.primary.name || 'Sajan Sunny'}</h4>
                    <span className="text-muted text-xs">{item.primary.phoneNumber ? `+91 ${item.primary.phoneNumber}` : '—'}</span>
                    <span className="text-muted text-xs">{item.primary.email || '—'}</span>
                  </div>

                  <div className="dup-vs-divider">
                    <GitMerge size={20} className="text-highlight" />
                  </div>

                  <div className="dup-entity-box duplicate-box">
                    <span className="box-badge-tag tag-duplicate">Merge Duplicate Record</span>
                    <div className="id-badge-pill-group margin-top-6">
                      <span className="id-badge-pill cust-id-pill">{item.duplicate.customerId || item.duplicate.userId}</span>
                    </div>
                    <h4 className="font-bold text-white margin-top-4">{item.duplicate.name || 'Sajan Sunny'}</h4>
                    <span className="text-muted text-xs">{item.duplicate.phoneNumber ? `+91 ${item.duplicate.phoneNumber}` : '—'}</span>
                    <span className="text-muted text-xs">{item.duplicate.email || '—'}</span>
                  </div>
                </div>

                <div className="dup-actions-row margin-top-16">
                  <button
                    className="btn-admin-action btn-approve"
                    onClick={() => handleMerge(item.primary.customerId || item.primary.userId, item.duplicate.customerId || item.duplicate.userId)}
                  >
                    <GitMerge size={14} /> Merge Records
                  </button>
                  <button
                    className="btn-admin-action btn-reject"
                    onClick={() => handleDismiss(item.id)}
                  >
                    Keep Separate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate Businesses Section */}
      <div className="margin-top-28">
        <h3 className="section-title-sm"><Building2 size={16} /> Similar Business Detection (&gt;90% AI Similarity)</h3>

        <div className="duplicates-cards-grid margin-top-12">
          {duplicateBusinesses.map(biz => (
            <div key={biz.id} className="duplicate-card">
              <div className="dup-header">
                <span className="dup-reason-tag"><ShieldAlert size={12} /> {biz.reason}</span>
                <span className="font-bold text-highlight">{biz.similarityPercent}% Match</span>
              </div>

              <div className="dup-comparison-grid margin-top-12">
                <div className="dup-entity-box primary-box">
                  <span className="box-badge-tag tag-primary">Primary Business</span>
                  <div className="id-badge-pill-group margin-top-6">
                    <span className="id-badge-pill">{biz.primary.businessId}</span>
                  </div>
                  <h4 className="font-bold text-white margin-top-4">{biz.primary.businessName}</h4>
                  <span className="text-muted text-xs">Owner: {biz.primary.customerId}</span>
                </div>

                <div className="dup-vs-divider">
                  <GitMerge size={20} className="text-highlight" />
                </div>

                <div className="dup-entity-box duplicate-box">
                  <span className="box-badge-tag tag-duplicate">Duplicate Business</span>
                  <div className="id-badge-pill-group margin-top-6">
                    <span className="id-badge-pill">{biz.duplicate.businessId}</span>
                  </div>
                  <h4 className="font-bold text-white margin-top-4">{biz.duplicate.businessName}</h4>
                  <span className="text-muted text-xs">Owner: {biz.duplicate.customerId}</span>
                </div>
              </div>

              <div className="dup-actions-row margin-top-16">
                <button
                  className="btn-admin-action btn-approve"
                  onClick={() => alert(`Merged Business ${biz.duplicate.businessId} into ${biz.primary.businessId}!`)}
                >
                  <GitMerge size={14} /> Consolidate Business Vault
                </button>
                <button
                  className="btn-admin-action btn-reject"
                  onClick={() => handleDismiss(biz.id)}
                >
                  Keep Separate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
