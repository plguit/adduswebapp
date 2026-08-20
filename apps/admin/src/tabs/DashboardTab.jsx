import React, { useState, useEffect } from 'react';
import {
  Users, FolderKanban, Clock, CheckCircle2, Building2,
  TrendingUp, DollarSign, Activity, Star, ArrowRight, Sparkles, UserCheck, AlertTriangle
} from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';

export function DashboardTab({ onNavigateTab, dataSource = 'localStorage', adminReady = false }) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    awaitingReview: 0,
    awaitingAssignment: 0,
    inProduction: 0,
    delayed: 0,
    completedToday: 0,
    totalRevenue: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [recentBusinesses, setRecentBusinesses] = useState([]);

  useEffect(() => {
    const load = async () => {
      let profiles = [];
      let projects = [];
      try {
        if (dataSource === 'backend' && adminReady) {
          const [usersRes, projectsRes] = await Promise.all([
            adminApiService.getUsers(),
            adminApiService.getProjects()
          ]);
          profiles = usersRes.users || [];
          projects = projectsRes.projects || [];
        } else {
          profiles = profileService.getAllProfiles();
          projects = getAllProjectsAcrossUsers();
        }
      } catch (e) {
        console.warn('[DashboardTab] backend load failed, falling back to localStorage:', e.message);
        profiles = profileService.getAllProfiles();
        projects = getAllProjectsAcrossUsers();
      }

      const todayStr = new Date().toISOString().split('T')[0];

      const awaitingReview = projects.filter(p => ['Submitted', 'Under Review', 'Draft'].includes(p.status)).length;
      const awaitingAssignment = projects.filter(p => ['Strategy Preparation', 'Waiting for Customer Approval', 'Approved', 'Creator Assignment'].includes(p.status)).length;
      const inProduction = projects.filter(p => ['In Production', 'Internal Quality Review', 'Customer Review', 'Revision Requested', 'Revision in Progress'].includes(p.status)).length;
      const delayed = projects.filter(p => p.shootDate && new Date(p.shootDate) < new Date() && !['Delivered', 'Archived'].includes(p.status)).length;
      const completedToday = projects.filter(p => ['Delivered', 'Archived', 'Approved by Customer'].includes(p.status) && p.updatedAt && p.updatedAt.startsWith(todayStr)).length;

      const revenue = projects.reduce((acc, p) => {
        const budgetNum = parseInt((p.budget || '').replace(/\D/g, ''), 10);
        return acc + (budgetNum || 0);
      }, 0);

      setStats({
        totalCustomers: profiles.length,
        awaitingReview,
        awaitingAssignment,
        inProduction,
        delayed,
        completedToday,
        totalRevenue: revenue
      });

      setRecentBusinesses(profiles.slice(-5).reverse());

      const activities = [];
      projects.forEach(p => {
        activities.push({
          id: `act_${p.id}`,
          title: `Project ${p.id} stage: ${p.status || 'Submitted'}`,
          subtitle: `Service: ${p.service} · Customer: ${p.customerId || p.userId || 'Client'}`,
          timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
          icon: FolderKanban,
          color: '#818CF8'
        });
      });

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivities(activities.slice(0, 8));
    };

    load();
  }, [dataSource, adminReady]);

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Sprint 4 – Admin Operations Executive Dashboard</h2>
          <p className="admin-section-sub">Operational status across review queues, creator assignments, active shoots, and Business Vault archives.</p>
        </div>
        <span className="admin-badge-live">● System Live</span>
      </div>

      {/* Sprint 4 Admin Dashboard Widgets */}
      <div className="admin-kpi-grid margin-top-16">
        <div className="admin-kpi-card" onClick={() => onNavigateTab && onNavigateTab('projects')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <Clock size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Projects Awaiting Review</span>
            <h3 className="kpi-value">{stats.awaitingReview}</h3>
            <span className="kpi-sub yellow-text">Submitted &amp; Under Review</span>
          </div>
        </div>

        <div className="admin-kpi-card" onClick={() => onNavigateTab && onNavigateTab('creators')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
            <UserCheck size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Projects Awaiting Assignment</span>
            <h3 className="kpi-value">{stats.awaitingAssignment}</h3>
            <span className="kpi-sub blue-text">Brief Approved / Ready</span>
          </div>
        </div>

        <div className="admin-kpi-card" onClick={() => onNavigateTab && onNavigateTab('projects')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#A78BFA' }}>
            <FolderKanban size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Projects in Production</span>
            <h3 className="kpi-value">{stats.inProduction}</h3>
            <span className="kpi-sub purple-text">Shoot &amp; Editing active</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Projects Delayed</span>
            <h3 className="kpi-value">{stats.delayed}</h3>
            <span className="kpi-sub red-text">Overdue timeline alert</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Projects Completed Today</span>
            <h3 className="kpi-value">{stats.completedToday}</h3>
            <span className="kpi-sub green-text">Archived into Business Vault</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80' }}>
            <DollarSign size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Pipeline Value</span>
            <h3 className="kpi-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
            <span className="kpi-sub green-text">Gross contract value</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Activity Feed & Recent Businesses */}
      <div className="admin-dashboard-two-col margin-top-24">
        <div className="admin-card-box">
          <div className="card-box-header">
            <h3><Activity size={18} className="inline-icon" /> Operational Pipeline Activity Stream</h3>
          </div>
          <div className="activity-feed-list">
            {recentActivities.map(act => (
              <div key={act.id} className="activity-feed-item">
                <div className="act-icon-wrap" style={{ color: act.color, background: `${act.color}18` }}>
                  <FolderKanban size={16} />
                </div>
                <div className="act-content">
                  <span className="act-title">{act.title}</span>
                  <span className="act-sub">{act.subtitle}</span>
                </div>
                <span className="act-time">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card-box">
          <div className="card-box-header flex-between">
            <h3><Building2 size={18} className="inline-icon" /> Onboarded Client Businesses</h3>
            {typeof onNavigateTab === 'function' && (
              <button className="admin-link-btn" onClick={() => onNavigateTab('businesses')}>
                View CRM →
              </button>
            )}
          </div>

          <div className="recent-biz-list">
            {recentBusinesses.map(b => {
              const brain = b.businessBrain || {};
              return (
                <div key={b.userId} className="recent-biz-item">
                  <div className="recent-biz-avatar">
                    {(brain.businessName || b.name || 'B').charAt(0).toUpperCase()}
                  </div>
                  <div className="recent-biz-info">
                    <h4>{brain.businessName || b.name || 'Unnamed Business'}</h4>
                    <p>{brain.industry || 'General'} · {b.phoneNumber || b.email || 'Verified'}</p>
                  </div>
                  <span className="admin-badge admin-badge-indigo">
                    {brain.businessStage || 'Active Client'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardTab;
