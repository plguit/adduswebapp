import React, { useEffect, useState } from 'react';
import { Building2, FolderKanban, Star, Users, TrendingUp, Clock } from 'lucide-react';
import { apiService } from '../../../services/api.js';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="analytics-stat-card" style={{ borderColor: `${color}30` }}>
      <div className="stat-icon-wrap" style={{ background: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="analytics-bar-row">
      <span className="analytics-bar-label">{label}</span>
      <div className="analytics-bar-track">
        <div className="analytics-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="analytics-bar-count">{value}</span>
    </div>
  );
}

export function AnalyticsTab() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalProjects: 0,
    pendingReviews: 0,
    completedReviews: 0,
    activeProjects: 0,
    completedProjects: 0,
    estimatedRevenue: 0,
    industries: {},
  });

  useEffect(() => {
    apiService.fetchAdminAnalytics().then(data => {
      if (data) setStats(prev => ({ ...prev, ...data }));
    });
  }, []);

  const industryEntries = Object.entries(stats.industries).sort((a, b) => b[1] - a[1]);
  const maxIndustry = Math.max(...industryEntries.map(([, v]) => v), 1);

  const COLORS = ['#7c5cff', '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#fb923c'];

  return (
    <div className="admin-tab-content">
      {/* Stat cards */}
      <div className="analytics-stats-grid">
        <StatCard icon={Building2} label="Total Businesses" value={stats.totalBusinesses} color="#7c5cff" />
        <StatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects} color="#60a5fa" sub={`${stats.activeProjects} active`} />
        <StatCard icon={Star} label="Pending Reviews" value={stats.pendingReviews} color="#f59e0b" sub={`${stats.completedReviews} completed`} />
        <StatCard icon={TrendingUp} label="Est. Revenue" value={`₹${(stats.estimatedRevenue / 1000).toFixed(0)}k`} color="#34d399" />
        <StatCard icon={Clock} label="Active Projects" value={stats.activeProjects} color="#fb923c" />
        <StatCard icon={FolderKanban} label="Completed" value={stats.completedProjects} color="#10b981" />
      </div>

      {/* Industry breakdown */}
      {industryEntries.length > 0 && (
        <div className="analytics-section-card">
          <h3 className="admin-section-title">Business by Industry</h3>
          {industryEntries.map(([industry, count], i) => (
            <MiniBar key={industry} label={industry} value={count} max={maxIndustry} color={COLORS[i % COLORS.length]} />
          ))}
        </div>
      )}

      {/* Project status breakdown */}
      <div className="analytics-section-card">
        <h3 className="admin-section-title">Project Status Overview</h3>
        {[
          ['Planning', stats.activeProjects, '#a78bfa'],
          ['Completed', stats.completedProjects, '#34d399'],
          ['Pending Review', stats.pendingReviews, '#f59e0b'],
        ].map(([label, val, color]) => (
          <MiniBar key={label} label={label} value={val} max={Math.max(stats.totalProjects, 1)} color={color} />
        ))}
      </div>
    </div>
  );
}
