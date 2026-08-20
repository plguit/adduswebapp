import React, { useState } from 'react';
import { Shield, Key, Users, Settings as SettingsIcon, Check, Lock, UserCheck } from 'lucide-react';

export function SettingsTab({ dataSource = 'localStorage', adminReady = false }) {
  const [activeSubTab, setActiveSubTab] = useState('roles');

  const [roles, setRoles] = useState([
    { id: 'r1', name: 'Super Admin', usersCount: null, access: 'Full Unrestricted System Access', color: '#EF4444' },
    { id: 'r2', name: 'Business Strategist', usersCount: null, access: 'Businesses CRM, Business Brain, AI Queue', color: '#8B5CF6' },
    { id: 'r3', name: 'Operations Manager', usersCount: null, access: 'Projects, Creators, Calendar, Approvals', color: '#3B82F6' },
    { id: 'r4', name: 'Finance Lead', usersCount: null, access: 'Budgets, Invoices, Revenue Analytics', color: '#10B981' },
    { id: 'r5', name: 'Project Manager', usersCount: null, access: 'Projects, Timelines, Creators, Client Chat', color: '#F59E0B' },
    { id: 'r6', name: 'Viewer / Auditor', usersCount: null, access: 'Read-only Access across all modules', color: '#6B7280' },
  ]);

  return (
    <div className="tab-pane-container fade-in">
      <div className="tab-header-row">
        <div>
          <h2 className="tab-pane-title">Settings & Access Control</h2>
          <p className="tab-pane-subtitle">Manage role-based permissions, system security, team roles, and platform defaults.</p>
        </div>
      </div>

      <div className="settings-grid margin-top-20">
        <div className="roles-list-container">
          <h3 className="section-title-sm"><Shield size={16} /> Role-Based Access Control (RBAC)</h3>
          <p className="section-desc-sm">Every employee role enforces explicit data visibility and action scoping.</p>

          <div className="roles-cards-grid margin-top-16">
            {roles.map(role => (
              <div key={role.id} className="role-card">
                <div className="role-card-top">
                  <span className="role-badge-pill" style={{ backgroundColor: `${role.color}20`, color: role.color, border: `1px solid ${role.color}40` }}>
                    ● {role.name}
                  </span>
                   <span className="role-users-count"><UserCheck size={12} /> {role.usersCount !== null ? `${role.usersCount} Assigned` : 'Not configured'}</span>
                </div>
                <div className="role-access-desc">{role.access}</div>
                <button className="btn-role-config">Configure Permissions</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
