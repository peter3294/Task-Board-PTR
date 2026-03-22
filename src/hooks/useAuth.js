import { useState, useEffect, useCallback } from 'react';
import { initTokenClient, requestAccessToken, revokeToken } from '../lib/googleAuth';

export function useAuth() {
  const [accessToken, setAccessToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [ready, setReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    let silentTimeout;
    const poll = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(poll);
        initTokenClient((response) => {
          setSigningIn(false);
          if (response.error) return;
          setAccessToken(response.access_token);
          setExpiresAt(Date.now() + (response.expires_in - 60) * 1000);
        });
        setReady(true);
        // Attempt silent sign-in (succeeds if user previously authorized)
        silentTimeout = setTimeout(() => {
          requestAccessToken('');
        }, 200);
      }
    }, 100);

    return () => {
      clearInterval(poll);
      clearTimeout(silentTimeout);
    };
  }, []);

  const signIn = useCallback(() => {
    setSigningIn(true);
    requestAccessToken('consent');
  }, []);

  const signOut = useCallback(() => {
    if (accessToken) revokeToken(accessToken);
    setAccessToken(null);
    setExpiresAt(null);
  }, [accessToken]);

  const getToken = useCallback(() => {
    if (!accessToken || Date.now() >= expiresAt) return null;
    return accessToken;
  }, [accessToken, expiresAt]);

  const isExpired = accessToken && Date.now() >= expiresAt;
  const isAuthenticated = !!accessToken && !isExpired;

  return { isAuthenticated, ready, signingIn, signIn, signOut, getToken };
}
