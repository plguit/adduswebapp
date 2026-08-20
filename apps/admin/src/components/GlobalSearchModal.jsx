import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, FolderKanban, User, MessageSquare, BrainCircuit, FileText, CreditCard, UserCheck } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { paymentService } from '../../../../src/services/paymentService.js';
import { UniversalSearchEngine } from '../../../../src/services/brain/UniversalSearchEngine.js';

export function GlobalSearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const profiles = profileService.getAllProfiles();
  const payments = paymentService.getAllPayments();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search Results via UniversalSearchEngine
  const results = [];

  if (q) {
    const engineResults = UniversalSearchEngine.search(q, {
      profiles,
      projects: [],
      payments,
      creators: []
    });

    engineResults.businesses.forEach(b => results.push({
      id: `biz_${b.id}`,
      type: 'Business (ABA)',
      title: `${b.id} — ${b.label}`,
      subtitle: `Industry: ${b.sub || 'General'}`,
      icon: Building2,
      tab: 'businesses'
    }));

    engineResults.projects.forEach(p => results.push({
      id: `proj_${p.id}`,
      type: 'Project (APR)',
      title: `${p.id} — ${p.label}`,
      subtitle: `Status: ${p.sub}`,
      icon: FolderKanban,
      tab: 'projects'
    }));

    engineResults.creators.forEach(c => results.push({
      id: `creator_${c.id}`,
      type: 'Creator (ACRA)',
      title: `${c.id} — ${c.label}`,
      subtitle: c.sub,
      icon: UserCheck,
      tab: 'creators'
    }));

    engineResults.payments.forEach(p => results.push({
      id: `pay_${p.id}`,
      type: 'Payment (APT)',
      title: `${p.id} — ${p.label}`,
      subtitle: p.sub,
      icon: CreditCard,
      tab: 'payments'
    }));

    if ('brain'.includes(q) || 'memory'.includes(q) || 'addi'.includes(q) || 'vault'.includes(q)) {
      results.push({
        id: 'brain_global',
        type: 'AI Memory',
        title: 'Business Brain & Vault',
        subtitle: 'Business profiles, vault assets, AI recommendations',
        icon: BrainCircuit,
        tab: 'brain'
      });
    }
  }

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()}>
        <div className="global-search-header">
          <Search size={20} className="search-modal-icon" />
          <input
            ref={inputRef}
            type="text"
            className="global-search-input"
            placeholder="Search Businesses, Projects, Creators, Files, Messages, AI Memory... (Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="global-search-body">
          {!query ? (
            <div className="search-hint-box">
              <span className="hint-pill">⌘ K</span>
              <p>Type anything to search across the entire ADDUS Admin Operating System</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty-box">
              <p>No results found matching "{query}"</p>
            </div>
          ) : (
            <div className="search-results-list">
              {results.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                  >
                    <div className="result-icon-badge">
                      <Icon size={16} />
                    </div>
                    <div className="result-text-col">
                      <div className="result-title-row">
                        <span className="result-title">{item.title}</span>
                        <span className="result-type-tag">{item.type}</span>
                      </div>
                      <span className="result-subtitle">{item.subtitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
