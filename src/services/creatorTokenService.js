/**
 * ADDUS Platform — Creator Token Service (Frontend)
 *
 * Frontend helper for managing creator JWT tokens in localStorage.
 */

const CREATOR_TOKEN_KEY = 'addus_creator_token';
const CREATOR_SESSION_KEY = 'addus_creator_session';

export function getCreatorToken() {
  try {
    return localStorage.getItem(CREATOR_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setCreatorToken(token) {
  try {
    localStorage.setItem(CREATOR_TOKEN_KEY, token);
  } catch {}
}

export function removeCreatorToken() {
  try {
    localStorage.removeItem(CREATOR_TOKEN_KEY);
  } catch {}
}

export function getCreatorSession() {
  try {
    return JSON.parse(localStorage.getItem(CREATOR_SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setCreatorSession(session) {
  try {
    localStorage.setItem(CREATOR_SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function removeCreatorSession() {
  try {
    localStorage.removeItem(CREATOR_SESSION_KEY);
  } catch {}
}

export function isCreatorLoggedIn() {
  return !!getCreatorToken();
}

export function clearCreatorAuth() {
  removeCreatorToken();
  removeCreatorSession();
}
