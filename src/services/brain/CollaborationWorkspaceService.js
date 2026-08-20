import { storage } from '../../utils/storage.js';

const CHATS_KEY_PREFIX = 'ADDUS_PROJECT_CHAT_DB_';

/**
 * Collaboration Workspace Service — Unified project communications & activity
 */
export const CollaborationWorkspaceService = {
  getMessages(projectId) {
    if (!projectId) return [];
    return storage.get(`${CHATS_KEY_PREFIX}${projectId}`, [
      {
        id: 'msg_1',
        sender: 'ADDUS AI Operations',
        role: 'System',
        text: 'Project collaboration channel established. All discussions, approvals, and revisions remain archived inside this project.',
        timestamp: new Date().toISOString()
      }
    ]);
  },

  sendMessage(projectId, text, sender = 'User', role = 'Customer') {
    if (!projectId || !text.trim()) return null;
    const messages = this.getMessages(projectId);
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender,
      role,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    const updated = [...messages, newMessage];
    storage.set(`${CHATS_KEY_PREFIX}${projectId}`, updated);
    return newMessage;
  }
};

export default CollaborationWorkspaceService;
