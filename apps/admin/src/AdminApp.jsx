import React from 'react';
import { AdminDashboard } from './AdminDashboard.jsx';

/**
 * AdminApp — Permanent Open Access (Authentication Bypassed)
 * Directly renders the Admin Operating System workspace without login gates.
 */
export function AdminApp() {
  return <AdminDashboard onLogout={() => {}} />;
}

export default AdminApp;
