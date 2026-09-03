/**
 * Background Sync Service
 * Seamlessly mirrors localStorage state to the backend API without blocking the UI.
 */
import { storage } from './storage.js';
import { io } from 'socket.io-client';
import { sessionManager } from '../services/sessionManager.js';

class BackgroundSync {
  initSocket() {
    this.socket = io('http://localhost:3000');
    this.socket.on('state_updated', (data) => {
      this.pullState(true);
    });
  }
  constructor() {
    this.namespaces = ['PROJECTS_STORE', 'PROFILE_STORE'];
    this.isSyncing = false;
    this.pendingSync = false;
  }

  start() {
    // Listen for local changes from this tab
    window.addEventListener('addus_project_store_updated', () => this.scheduleSync());
    window.addEventListener('addus_profile_updated', () => this.scheduleSync());

    // Listen for changes from other tabs via localStorage
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('ADDUS_MVP_')) {
        this.scheduleSync();
      }
    });

    // Do an initial pull to hydrate state from the server if we're missing it
    this.pullState();
    this.initSocket();
    

  }

  scheduleSync() {
    if (this.isSyncing) {
      this.pendingSync = true;
      return;
    }
    
    // Debounce sync
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => this.pushState(), 1000);
  }

  async pushState() {
    this.isSyncing = true;
    try {
      const session = sessionManager.getSession();
      const userId = session?.userId;
      const headers = { 'Content-Type': 'application/json' };
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      
      if (!userId) {
        // Can't push without a logged-in user
        this.isSyncing = false;
        return;
      }

      // 1. Push Profile
      const profileData = storage.get('PROFILE_STORE', null);
      if (profileData && Object.keys(profileData).length > 0) {
        await fetch(`/api/customer/profile/${userId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ profile: profileData })
        });
      }

      // 2. Push Projects
      const projectsData = storage.get('PROJECTS_STORE', null);
      if (projectsData) {
        // The API expects { projects: [...] }
        const projectsArray = Array.isArray(projectsData) ? projectsData : Object.values(projectsData);
        await fetch(`/api/customer/projects/${userId}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ projects: projectsArray })
        });
      }
      
    } catch (err) {
      console.warn('[BackgroundSync] Push failed:', err);
    } finally {
      this.isSyncing = false;
      if (this.pendingSync) {
        this.pendingSync = false;
        this.scheduleSync();
      }
    }
  }

  async pullState(notify = false) {
    try {
      const session = sessionManager.getSession();
      const userId = session?.userId;
      const headers = { 'Content-Type': 'application/json' };
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      
      if (!userId) return;

      let stateChanged = false;

      // 1. Pull Profile
      const profileRes = await fetch(`/api/customer/profile/${userId}`, { headers });
      if (profileRes.ok) {
        const json = await profileRes.json();
        if (json.profile) {
          const currentStr = JSON.stringify(storage.get('PROFILE_STORE', {}));
          const newStr = JSON.stringify(json.profile);
          if (currentStr !== newStr) {
            localStorage.setItem('ADDUS_MVP_PROFILE_STORE', newStr);
            stateChanged = true;
          }
        }
      }

      // 2. Pull Projects
      const projectsRes = await fetch(`/api/customer/projects/${userId}`, { headers });
      if (projectsRes.ok) {
        const json = await projectsRes.json();
        if (json.projects) {
          const currentStr = JSON.stringify(storage.get('PROJECTS_STORE', {}));
          const newStr = JSON.stringify(json.projects);
          if (currentStr !== newStr) {
            localStorage.setItem('ADDUS_MVP_PROJECTS_STORE', newStr);
            stateChanged = true;
          }
        }
      }
      
      if (stateChanged && notify) {
        // Trigger generic storage event so React hooks reload
        window.dispatchEvent(new Event('storage'));
        // Fire specific events for UI refresh
        window.dispatchEvent(new CustomEvent('addus_project_store_updated', { detail: { sync: true } }));
        window.dispatchEvent(new CustomEvent('addus_profile_updated', { detail: { sync: true } }));
      }
    } catch (err) {
      console.warn('[BackgroundSync] Pull failed:', err);
    }
  }

  }


export const backgroundSync = new BackgroundSync();
