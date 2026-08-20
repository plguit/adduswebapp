import React, { useState } from 'react';
import { Send, Users } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export function AdminPushTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    apiService.fetchAdminVaults().then(vaults => {
      setUsers(vaults.filter(u => u.userId && u.userId !== 'admin'));
    });
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const userIds = target === 'all' ? [] : selectedUsers;
      const res = await apiService.sendPushNotification({ userIds, title: title.trim(), message: message.trim() });
      setResult(res);
      setTitle('');
      setMessage('');
    } catch (err) {
      alert('Failed to send push notification: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Send Push Notification</h2>
      </div>

      <div style={{ background: '#1D1A34', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', maxWidth: '600px' }}>
        <form onSubmit={handleSend}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#FFF', marginBottom: '6px' }}>Title</label>
            <input
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none' }}
              placeholder="Notification title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#FFF', marginBottom: '6px' }}>Message</label>
            <textarea
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none', minHeight: '100px', resize: 'vertical' }}
              placeholder="Notification message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#FFF', marginBottom: '6px' }}>Target</label>
            <select
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 14px', color: '#FFF', fontSize: '14px', outline: 'none' }}
              value={target}
              onChange={e => setTarget(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="selected">Selected Users</option>
            </select>
          </div>

          {target === 'selected' && (
            <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px' }}>
              {users.map(u => (
                <label key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', cursor: 'pointer', fontSize: '13px', color: '#FFF' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.userId)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedUsers(prev => [...prev, u.userId]);
                      } else {
                        setSelectedUsers(prev => prev.filter(id => id !== u.userId));
                      }
                    }}
                  />
                  {u.businessName || u.name || u.userId}
                </label>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)', borderRadius: '10px', padding: '12px 24px', color: '#A78BFA', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: sending ? 0.5 : 1 }}
          >
            <Send size={16} /> {sending ? 'Sending...' : 'Send Push Notification'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '10px', fontSize: '13px', color: '#34D399' }}>
            Sent to {result.totalSent} users successfully.
          </div>
        )}
      </div>
    </div>
  );
}
