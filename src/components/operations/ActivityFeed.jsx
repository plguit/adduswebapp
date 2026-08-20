import React from 'react';
import { History, User, Shield, Camera, Sparkles } from 'lucide-react';

export function ActivityFeed({ activityLog = [], filterRole = null }) {
  const filtered = filterRole
    ? activityLog.filter(a => a.role === filterRole)
    : activityLog;

  const getActorBadge = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'customer':
        return <span className="activity-actor-tag tag-customer"><User size={12} /> Customer</span>;
      case 'admin':
      case 'admin strategist':
        return <span className="activity-actor-tag tag-admin"><Shield size={12} /> Admin Ops</span>;
      case 'creator':
        return <span className="activity-actor-tag tag-creator"><Camera size={12} /> Creator</span>;
      default:
        return <span className="activity-actor-tag tag-system"><Sparkles size={12} /> System</span>;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="activity-feed-container">
      <div className="activity-feed-header">
        <h4><History size={16} /> Activity History &amp; Audit Log</h4>
        <span className="activity-count">{filtered.length} entries</span>
      </div>

      {filtered.length === 0 ? (
        <div className="activity-empty-state">No activity logged yet.</div>
      ) : (
        <div className="activity-timeline-list">
          {filtered.map((item, idx) => (
            <div key={idx} className="activity-item-row">
              <div className="activity-dot-line">
                <span className="activity-node-dot" />
                {idx < filtered.length - 1 && <span className="activity-node-connector" />}
              </div>

              <div className="activity-card-content">
                <div className="activity-meta-top">
                  <span className="activity-timestamp">{formatTime(item.timestamp)}</span>
                  {getActorBadge(item.role || item.actor)}
                </div>
                <div className="activity-action-title">{item.action}</div>
                {item.notes && <div className="activity-notes">{item.notes}</div>}
                {item.previousValue && item.newValue && (
                  <div className="activity-diff-pill">
                    <span className="diff-old">{item.previousValue}</span>
                    <span className="diff-arrow">→</span>
                    <span className="diff-new">{item.newValue}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
