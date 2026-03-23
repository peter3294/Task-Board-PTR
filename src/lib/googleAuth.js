const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ');

let _tokenClient = null;
let _onToken = null;

export function initTokenClient(onToken) {
  _onToken = onToken;
  if (_tokenClient) return;
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => { if (_onToken) _onToken(response); },
  });
}

export function requestAccessToken(prompt = '', hint = '') {
  const opts = { prompt };
  if (hint) opts.login_hint = hint;
  _tokenClient?.requestAccessToken(opts);
}

export async function fetchUserInfo(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json(); // { name, email, picture, ... }
  } catch { return null; }
}

export function revokeToken(accessToken) {
  window.google?.accounts.oauth2.revoke(accessToken, () => {});
}

const EMAIL_KEY = 'ptr_gsi_email';
export const getStoredEmail   = () => localStorage.getItem(EMAIL_KEY) || '';
export const storeEmail       = (e) => { if (e) localStorage.setItem(EMAIL_KEY, e); };
export const clearStoredEmail = () => localStorage.removeItem(EMAIL_KEY);
