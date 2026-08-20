/**
 * History Service — Session Conversation Memory
 */

const userHistories = new Map();

export function getUserHistory(userId) {
  if (!userId) return [];
  if (!userHistories.has(userId)) {
    userHistories.set(userId, []);
  }
  return userHistories.get(userId);
}

export function addMessageToHistory(userId, role, content) {
  if (!userId || !role || !content) return;
  const history = getUserHistory(userId);
  history.push({ role, content, timestamp: new Date().toISOString() });
  if (history.length > 50) {
    history.shift();
  }
}

export function clearUserHistory(userId) {
  if (userId) {
    userHistories.delete(userId);
  }
}
