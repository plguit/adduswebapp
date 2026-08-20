import React, { useState, useEffect } from 'react';
import { Send, Bell } from 'lucide-react';
import { apiService } from '../../../services/api.js';
import { NotificationEngine } from '../../../services/brain/UniversalNotificationEngine.js';

const NOTIF_TYPES = [
  { value: 'request_details', label: '📋 Request Additional Details' },
  { value: 'send_quotation', label: '💰 Send Quotation' },
  { value: 'expert_review_complete', label: '⭐ Mark Expert Review Completed' },
  { value: 'custom', label: '✉️ Custom Message' },
];

export function NotificationsTab() {
  const [profiles, setProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [type, setType] = useState('custom');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [allNotifs, setAllNotifs] = useState([]);

  useEffect(() => {
    apiService.fetchAdminUsers().then(setProfiles);
    apiService.fetchAdminNotifications().then(setAllNotifs);
  }, [sent]);

  const handleSend = () => {
    if (!selectedUser || !message.trim()) return;
    
    NotificationEngine.notify({
      userId: selectedUser,
      role: 'Admin',
      type: type,
      title: NOTIF_TYPES.find(t => t.value === type)?.label || 'System Update',
      message: message.trim(),
      priority: 'high'
    });
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="admin-tab-content">
      {/* Compose */}
      <div className="admin-compose-card">
        <h3 className="admin-section-title"><Bell size={16} /> Send Notification</h3>
        <div className="admin-compose-grid">
          <div className="admin-field-group">
            <label className="admin-field-label">Select User</label>
            <select className="admin-field-input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
              <option value="">— Select business —</option>
              {profiles.map(p => (
                <option key={p.userId} value={p.userId}>
                  {p.businessName || p.name || p.phoneNumber || p.email}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field-group">
            <label className="admin-field-label">Notification Type</label>
            <select className="admin-field-input" value={type} onChange={e => setType(e.target.value)}>
              {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-field-group" style={{ marginTop: 12 }}>
          <label className="admin-field-label">Message</label>
          <textarea
            className="admin-field-textarea"
            rows={3}
            placeholder="Enter your message to the business..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>
        <button className="admin-primary-btn" style={{ marginTop: 12 }} onClick={handleSend} disabled={!selectedUser || !message.trim()}>
          {sent ? '✓ Notification Sent!' : <><Send size={14} /> Send Notification</>}
        </button>
      </div>

      {/* History */}
      <div style={{ marginTop: 24 }}>
        <h3 className="admin-section-title">Notification History ({allNotifs.length})</h3>
        {allNotifs.length === 0 ? (
          <div className="admin-empty-state"><Bell size={24} /><p>No notifications sent yet.</p></div>
        ) : allNotifs.map(n => (
          <div key={n.id} className="admin-notif-row">
            <div className="admin-notif-user">{n.userName}</div>
            <div className="admin-notif-type"><span className="admin-badge admin-badge-grey">{n.type}</span></div>
            <div className="admin-notif-msg">{n.message}</div>
            <div className="admin-notif-date">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
