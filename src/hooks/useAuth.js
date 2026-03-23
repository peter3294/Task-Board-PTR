import { useState, useEffect, useCallback } from 'react';
import {
  initTokenClient, requestAccessToken, revokeToken,
  fetchUserInfo, getStoredEmail, storeEmail, clearStoredEmail,
} from '../lib/googleAuth';

const TOKEN_KEY = 'ptr_access_token';
const EXPIRY_KEY = 'ptr_token_expiry';
const USER_KEY = 'ptr_user_info';

function loadStoredSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0', 10);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    if (token && Date.now() < expiry) return { token, expiry, user };
  } catch { /* corrupt data — ignore */ }
  return null;
}

function storeSession(token, expiresAt, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRY_KEY, String(expiresAt));
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
  clearStoredEmail();
}

export function useAuth() {
  // Restore session from localStorage on first load
  const stored = loadStoredSession();
  const [accessToken, setAccessToken] = useState(stored?.token || null);
  const [expiresAt, setExpiresAt]     = useState(stored?.expiry || null);
  const [ready, setReady]             = useState(false);
  const [signingIn, setSigningIn]     = useState(false);
  const [userInfo, setUserInfo]       = useState(stored?.user || null);

  useEffect(() => {
    const poll = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(poll);
        initTokenClient(async (response) => {
          setSigningIn(false);
          if (response.error) return;
          const token = response.access_token;
          const expiry = Date.now() + (response.expires_in - 60) * 1000;
          setAccessToken(token);
          setExpiresAt(expiry);
          // Fetch user profile + persist session
          const info = await fetchUserInfo(token);
          if (info) {
            setUserInfo(info);
            storeEmail(info.email);
            storeSession(token, expiry, info);
          } else {
            storeSession(token, expiry, null);
          }
        });
        setReady(true);
      }
    }, 100);
    return () => clearInterval(poll);
  }, []);

  const signIn = useCallback(() => {
    setSigningIn(true);
    requestAccessToken('consent', getStoredEmail());
  }, []);

  const signOut = useCallback(() => {
    if (accessToken) revokeToken(accessToken);
    setAccessToken(null);
    setExpiresAt(null);
    setUserInfo(null);
    clearSession();
  }, [accessToken]);

  const getToken = useCallback(() => {
    if (!accessToken || Date.now() >= expiresAt) return null;
    return accessToken;
  }, [accessToken, expiresAt]);

  const isAuthenticated = !!accessToken && Date.now() < (expiresAt || 0);

  return { isAuthenticated, ready, signingIn, signIn, signOut, getToken, userInfo };
}
