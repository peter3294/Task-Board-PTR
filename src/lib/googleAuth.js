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
    callback: (response) => {
      if (_onToken) _onToken(response);
    },
  });
}

export function requestAccessToken(prompt = '') {
  _tokenClient?.requestAccessToken({ prompt });
}

export function revokeToken(accessToken) {
  window.google?.accounts.oauth2.revoke(accessToken, () => {});
}
