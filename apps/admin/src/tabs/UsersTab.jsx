import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { profileService } from '../../../../src/services/profileService.js';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';

/**
 * UsersTab — Real Customer Accounts CRM
 * Reads from actual USER_ACCOUNTS_DB. No demo/sample data.
 */
export function UsersTab() {
  const [profiles, setProfiles] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setProfiles(profileService.getAllProfiles());
    setAllProjects(getAllProjectsAcrossUsers());
  }, []);

  const q = query.toLowerCase().trim();

  const customers = profiles.map(p => {
    const brain = p.businessBrain || {};
    const customerProjects = allProjects.filter(proj => proj.userId === p.userId);
    return {
      customerId: p.customerId || p.userId,
      customerName: p.name || '—',
      businessName: brain.businessName || '—',
      mobile: p.phoneNumber ? `+91 ${p.phoneNumber}` : '—',
      email: p.email || '—',
      accountStatus: p.onboardingStatus === 'completed' ? 'Active' : 'In Onboarding',
      projectCount: customerProjects.length,
      joinedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—',
      rawJoinedDate: p.createdAt ? new Date(p.createdAt).getTime() : 0,
      lastActive: p.lastLoginAt ? new Date(p.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'
    };
  });

  const filtered = customers.filter(c => (
    !q ||
    c.customerId.toLowerCase().includes(q) ||
    c.customerName.toLowerCase().includes(q) ||
    c.businessName.toLowerCase().includes(q) ||
    c.mobile.includes(q) ||
    c.email.toLowerCase().includes(q)
  )).sort((a, b) => b.rawJoinedDate - a.rawJoinedDate);

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">Customer Accounts CRM</h2>
          <p className="tab-pane-subtitle">Registered customer accounts from USER_ACCOUNTS_DB — all real, no demo data.</p>
        </div>
        <div className="search-filter-wrap">
          <Search size={14} />
          <input
            type="text"
            className="table-search-input"
            placeholder="Search by Customer ID, Name, Mobile, Email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="audit-table-wrap margin-top-20">
        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            {profiles.length === 0
              ? 'No customers registered yet. Customer accounts appear here after completing onboarding.'
              : 'No customers match your search.'}
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Business</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Status</th>
                <th>Projects</th>
                <th>Joined</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cust => (
                <tr key={cust.customerId}>
                  <td>
                    <div className="id-badge-pill-group">
                      <span className="id-badge-pill cust-id-pill">{cust.customerId}</span>
                      <button
                        className="id-copy-btn"
                        title="Copy Customer ID"
                        onClick={() => navigator.clipboard.writeText(cust.customerId)}
                      >📋</button>
                    </div>
                  </td>
                  <td className="font-semibold text-white">{cust.customerName}</td>
                  <td><span className="text-highlight font-semibold">{cust.businessName}</span></td>
                  <td>{cust.mobile}</td>
                  <td className="text-muted">{cust.email}</td>
                  <td>
                    <span className={`status-tag ${cust.accountStatus === 'Active' ? 'tag-approved' : 'tag-pending'}`}>
                      ● {cust.accountStatus}
                    </span>
                  </td>
                  <td><span className="component-tag">{cust.projectCount} project{cust.projectCount !== 1 ? 's' : ''}</span></td>
                  <td className="text-muted text-xs">{cust.joinedDate}</td>
                  <td className="text-muted text-xs">{cust.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
