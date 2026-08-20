import React, { useState } from 'react';
import { Upload, Download, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { apiService } from '../../../services/api.js';

export function AdminOnboardingTab() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setPreview([]);
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (values[i] || '').trim();
        });
        return obj;
      });
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(selected);
  };

  const handleBulkUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResults(null);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV must have headers and at least one row');
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const users = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (values[i] || '').trim();
        });
        return obj;
      }).filter(u => u.name || u.phone || u.email);

      const result = await apiService.bulkOnboard(users);
      setResults(result);
    } catch (err) {
      alert('Bulk upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h2>Bulk User Onboarding</h2>
      </div>

      <div style={{ background: '#1D1A34', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFF', marginBottom: '12px' }}>Download Template</h3>
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>
          Download the CSV template, fill in user details, and upload it below. All onboarded users will receive login credentials via email and land directly on their dashboard.
        </p>
        <button
          onClick={() => apiService.downloadOnboardingTemplate()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: '10px', padding: '10px 18px', color: '#A78BFA', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          <Download size={16} /> Download CSV Template
        </button>
      </div>

      <div style={{ background: '#1D1A34', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFF', marginBottom: '12px' }}>Upload Completed Template</h3>
        <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
          <Upload size={32} style={{ color: '#9CA3AF', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '12px' }}>
            {file ? file.name : 'Drop your CSV here or click to browse'}
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ fontSize: '12px', color: '#9CA3AF' }}
          />
        </div>

        {preview.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#FFF', marginBottom: '8px' }}>Preview (first 5 rows)</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>{Object.keys(preview[0]).map(k => <th key={k} style={{ padding: '6px 10px', textAlign: 'left', color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{k}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ padding: '6px 10px', color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{v || '—'}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleBulkUpload}
          disabled={!file || loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', padding: '10px 18px', color: '#34D399', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: (!file || loading) ? 0.5 : 1 }}
        >
          <UserPlus size={16} /> {loading ? 'Processing...' : 'Bulk Onboard Users'}
        </button>
      </div>

      {results && (
        <div style={{ background: '#1D1A34', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFF', marginBottom: '12px' }}>Upload Results</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontSize: '14px' }}>
              <CheckCircle size={16} /> {results.successful} successful
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '14px' }}>
              <XCircle size={16} /> {results.total - results.successful} failed
            </div>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {results.results.map((r, i) => (
              <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '4px', fontSize: '13px', color: r.status === 'success' ? '#34D399' : '#EF4444' }}>
                {r.userId} — {r.status === 'success' ? `Created: ${r.businessName || 'User'}` : `Error: ${r.error}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
