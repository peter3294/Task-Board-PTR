import { useState, useEffect, useCallback } from 'react';
import {
  initTokenClient, requestAccessToken, revokeToken,
  fetchUserInfo, getStoredEmail, storeEmail, clearStoredEmail,
} from '../lib/googleAuth';

export function useAuth() {
  const [accessToken, setAccessToken] = useState(null);
  const [expiresAt, setExpiresAt]     = useState(null);
  const [ready, setReady]             = useState(false);
  const [signingIn, setSigningIn]     = useState(false);
  const [userInfo, setUserInfo]       = useState(null);

  useEffect(() => {
    let silentTimeout;
    const poll = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(poll);
        initTokenClient(async (response) => {
          setSigningIn(false);
          if (response.error) return;
          setAccessToken(response.access_token);
          setExpiresAt(Date.now() + (response.expires_in - 60) * 1000);
          // Fetch user profile for display + store email for future silent sign-in
          const info = await fetchUserInfo(response.access_token);
          if (info) { setUserInfo(info); storeEmail(info.email); }
        });
        setReady(true);
        // Attempt silent sign-in using stored email as hint (avoids showing
        // the account picker if the user previously granted consent)
        silentTimeout = setTimeout(() => requestAccessToken('', getStoredEmail()), 200);
      }
    }, 100);
    return () => { clearInterval(poll); clearTimeout(silentTimeout); };
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
    clearStoredEmail();
  }, [accessToken]);

  const getToken = useCallback(() => {
    if (!accessToken || Date.now() >= expiresAt) return null;
    return accessToken;
  }, [accessToken, expiresAt]);

  const isAuthenticated = !!accessToken && Date.now() < (expiresAt || 0);

  return { isAuthenticated, ready, signingIn, signIn, signOut, getToken, userInfo };
}
