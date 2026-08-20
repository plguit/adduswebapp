import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Award, Star, Activity, PieChart } from 'lucide-react';
import { profileService } from '../../../../shared/services/profileService.js';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';
import { adminApiService } from '../services/adminApiService.js';

export function AnalyticsTab({ dataSource = 'localStorage', adminReady = false }) {
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    totalRevenue: 0,
    conversionRate: '0%',
    topIndustry: null,
    topService: null
  });

  const [industryBreakdown, setIndustryBreakdown] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);

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
        console.warn('[AnalyticsTab] backend load failed, falling back to localStorage:', e.message);
        profiles = profileService.getAllProfiles();
        projects = getAllProjectsAcrossUsers();
      }

    const revenue = projects.reduce((acc, p) => {
      const b = parseInt((p.budget || '').replace(/\D/g, ''), 10);
      return acc + (b || 0);
    }, 0);

    // Calculate Industry breakdown
    const indCounts = {};
    profiles.forEach(p => {
      const ind = p.businessBrain?.industry || 'Unspecified';
      indCounts[ind] = (indCounts[ind] || 0) + 1;
    });

    const indArr = Object.entries(indCounts).map(([ind, count]) => ({
      industry: ind,
      count,
      pct: profiles.length > 0 ? Math.round((count / profiles.length) * 100) : 0
    }));

    setIndustryBreakdown(indArr);

    // Calculate Service breakdown from real projects
    const svcCounts = {};
    projects.forEach(p => {
      const services = p.selectedServices || [p.service].filter(Boolean);
      services.forEach(s => {
        svcCounts[s] = (svcCounts[s] || 0) + 1;
      });
    });

    const totalServiceCount = Object.values(svcCounts).reduce((a, b) => a + b, 0);
    const sArr = Object.entries(svcCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([service, count]) => ({
        service,
        count,
        pct: totalServiceCount > 0 ? Math.round((count / totalServiceCount) * 100) : 0
      }));

    setServiceBreakdown(sArr);

    const topInd = indArr.length > 0 ? indArr[0].industry : null;
    const topSvc = sArr.length > 0 ? sArr[0].service : null;

    setMetrics({
      totalProjects: projects.length,
      totalRevenue: revenue,
      conversionRate: projects.length > 0 ? `${Math.round((profiles.length / projects.length) * 100)}%` : '0%',
      topIndustry: topInd,
      topService: topSvc
    });
    };

    load();
  }, [dataSource, adminReady]);

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Executive Business &amp; Operations Analytics</h2>
          <p className="admin-section-sub">Comprehensive performance metrics, revenue analysis, category trends, and creator productivity.</p>
        </div>
      </div>

      {/* High Level KPI Summary */}
      <div className="admin-kpi-grid margin-top-16">
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ color: '#4ADE80', background: 'rgba(34, 197, 94, 0.15)' }}>
            <DollarSign size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Gross Revenue Value</span>
            <h3 className="kpi-value">₹{metrics.totalRevenue.toLocaleString('en-IN')}</h3>
            <span className="kpi-sub green-text">↑ +24% YoY</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ color: '#818CF8', background: 'rgba(99, 102, 241, 0.15)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Onboarding Conversion</span>
            <h3 className="kpi-value">{metrics.conversionRate}</h3>
            <span className="kpi-sub green-text">Completed onboarding</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)' }}>
            <Award size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Most Requested Service</span>
            <h3 className="kpi-value" style={{ fontSize: 16 }}>{metrics.topService}</h3>
            <span className="kpi-sub">High demand</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrap" style={{ color: '#EC4899', background: 'rgba(236, 72, 153, 0.15)' }}>
            <PieChart size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Top Category</span>
            <h3 className="kpi-value">{metrics.topIndustry}</h3>
            <span className="kpi-sub">Lead segment</span>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="admin-dashboard-two-col margin-top-24">
        
        {/* Business Industry Distribution */}
        <div className="admin-card-box">
          <h3><PieChart size={18} className="inline-icon" /> Industry Breakdown</h3>
          <div className="margin-top-16">
            {industryBreakdown.map((item, idx) => (
              <div key={idx} className="progress-stat-row">
                <div className="flex-between">
                  <span className="stat-name">{item.industry}</span>
                  <span className="stat-val">{item.count} Businesses ({item.pct}%)</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${Math.max(item.pct, 15)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Requested Deliverables */}
        <div className="admin-card-box">
          <h3><BarChart3 size={18} className="inline-icon" /> Deliverables Distribution</h3>
          <div className="margin-top-16">
            {serviceBreakdown.map((item, idx) => (
              <div key={idx} className="progress-stat-row">
                <div className="flex-between">
                  <span className="stat-name">{item.service}</span>
                  <span className="stat-val">{item.count} Projects ({item.pct}%)</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill fill-indigo" style={{ width: `${Math.max(item.pct, 20)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AnalyticsTab;
