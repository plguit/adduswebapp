/**
 * Conversation History Service
 * 
 * Storage Mode: In-Memory RAM Map (MVP)
 * Note: Resetting or restarting the server will reset RAM state.
 * 
 * Production Roadmap:
 * Replace in-memory Map with persistent database adapter:
 * - Supabase (PostgREST / Realtime)
 * - PostgreSQL (pg / Prisma / Drizzle)
 * 
 * Key: userId (string)
 * Value: Array of message objects [{ role: 'user' | 'assistant', content: string }]
 */
const historyStore = new Map();
const MAX_HISTORY_LENGTH = 30; // Max messages retained per user session

/**
 * Gets conversation history for a given user.
 * @param {string} userId
 * @returns {Array} messages array
 */
export function getUserHistory(userId) {
  if (!userId) return [];
  return historyStore.get(userId) || [];
}

/**
 * Appends a user message to history.
 * @param {string} userId
 * @param {string} content
 */
export function addMessageToHistory(userId, role, content) {
  if (!userId || !content) return;

  if (!historyStore.has(userId)) {
    historyStore.set(userId, []);
  }

  const history = historyStore.get(userId);
  history.push({ role, content });

  // Maintain max limit
  if (history.length > MAX_HISTORY_LENGTH) {
    history.splice(0, history.length - MAX_HISTORY_LENGTH);
  }
}

/**
 * Clears conversation history for a given user.
 * @param {string} userId
 */
export function clearUserHistory(userId) {
  if (userId) {
    historyStore.delete(userId);
  }
}

/**
 * Checks if user has existing history.
 * @param {string} userId
 * @returns {boolean}
 */
export function hasUserHistory(userId) {
  return historyStore.has(userId) && historyStore.get(userId).length > 0;
}
