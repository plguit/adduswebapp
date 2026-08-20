import React, { useState, useEffect } from 'react';
import CustomerApp from '../apps/customer/src/CustomerApp.jsx';
import AdminApp from '../apps/admin/src/AdminApp.jsx';
import CreatorApp from '../apps/creator/src/CreatorApp.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

export function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash === '#/admin' || path === '/admin') return 'admin';
    if (hash === '#/creator' || path === '/creator') return 'creator';
    return 'customer';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/admin') setRoute('admin');
      else if (hash === '#/creator') setRoute('creator');
      else setRoute('customer');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <ErrorBoundary>
      {route === 'admin' && <AdminApp />}
      {route === 'creator' && <CreatorApp />}
      {route === 'customer' && <CustomerApp />}
    </ErrorBoundary>
  );
}

export default App;
