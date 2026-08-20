import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Video, Users, Clock, Package, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllProjectsAcrossUsers } from '../../../../shared/hooks/useProjectStore.js';
import { adminApiService } from '../services/adminApiService.js';

const EVENT_TYPES = [
  { id: 'shoot', label: 'Upcoming Shoots', icon: Video, color: '#818CF8' },
  { id: 'meeting', label: 'Strategy Meetings', icon: Users, color: '#F59E0B' },
  { id: 'deadline', label: 'Project Deadlines', icon: Clock, color: '#EC4899' },
  { id: 'delivery', label: 'Deliveries', icon: Package, color: '#10B981' }
];

export function CalendarTab({ dataSource = 'localStorage', adminReady = false }) {
  const [selectedType, setSelectedType] = useState('All');
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('July 2026');

  useEffect(() => {
    const load = async () => {
      let projects = [];
      try {
        if (dataSource === 'backend' && adminReady) {
          const res = await adminApiService.getProjects();
          projects = res.projects || [];
        } else {
          projects = getAllProjectsAcrossUsers();
        }
      } catch (e) {
        console.warn('[CalendarTab] backend load failed, falling back to localStorage:', e.message);
        projects = getAllProjectsAcrossUsers();
      }

      const compiledEvents = [];

    projects.forEach(p => {
      if (p.shootDate) {
        compiledEvents.push({
          id: `evt_shoot_${p.id}`,
          title: `🎬 Production Shoot: ${p.service || 'Video Shoot'}`,
          date: p.shootDate,
          time: p.timeSlot || '',
          type: 'shoot',
          project: p.id,
          color: '#818CF8'
        });
      }

      compiledEvents.push({
        id: `evt_dl_${p.id}`,
        title: `📦 Final Master Delivery: ${p.id}`,
        date: p.estimatedDelivery || new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
        time: '5:00 PM',
        type: 'delivery',
        project: p.id,
        color: '#10B981'
      });
    });

    compiledEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(compiledEvents);
    };

    load();
  }, [dataSource, adminReady]);

  const filteredEvents = events.filter(e => selectedType === 'All' || e.type === selectedType);

  return (
    <div className="admin-tab-content fade-in">
      <div className="admin-section-header">
        <div>
          <h2>Production &amp; Shoot Schedule Calendar</h2>
          <p className="admin-section-sub">Master schedule for upcoming shoots, strategy meetings, production deadlines, and final deliveries.</p>
        </div>
        <div className="admin-month-nav">
          <button className="admin-icon-btn"><ChevronLeft size={16} /></button>
          <span className="month-title">{currentMonth}</span>
          <button className="admin-icon-btn"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Event Type Filter Chips */}
      <div className="admin-filter-bar margin-top-16">
        <button
          type="button"
          className={`calendar-type-chip ${selectedType === 'All' ? 'active-chip' : ''}`}
          onClick={() => setSelectedType('All')}
        >
          All Events ({events.length})
        </button>
        {EVENT_TYPES.map(t => {
          const count = events.filter(e => e.type === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              className={`calendar-type-chip ${selectedType === t.id ? 'active-chip' : ''}`}
              onClick={() => setSelectedType(t.id)}
            >
              <t.icon size={14} style={{ color: t.color }} />
              <span>{t.label} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Event Timeline Cards */}
      <div className="admin-calendar-timeline margin-top-20">
        {filteredEvents.length === 0 ? (
          <div className="admin-empty-state">
            <CalendarIcon size={36} />
            <p>No events scheduled for this filter.</p>
          </div>
        ) : filteredEvents.map(evt => {
          const typeObj = EVENT_TYPES.find(t => t.id === evt.type) || EVENT_TYPES[0];
          const IconComp = typeObj.icon;
          return (
            <div key={evt.id} className="calendar-event-card">
              <div className="event-date-badge">
                <span className="evt-day">{new Date(evt.date).getDate() || ''}</span>
                <span className="evt-month">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
              </div>
              
              <div className="event-body-content">
                <div className="flex-between">
                  <h4>{evt.title}</h4>
                  <span className="admin-badge" style={{ color: evt.color, borderColor: evt.color, background: `${evt.color}15` }}>
                    <IconComp size={12} className="inline-icon" /> {typeObj.label}
                  </span>
                </div>

                <p className="event-time-text">
                  <Clock size={14} className="inline-icon" /> {evt.time} · {evt.project ? `Project ${evt.project}` : 'General Agenda'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarTab;
