const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET = 'Tasks';
const HEADERS = ['ID', 'ParentID', 'Item', 'ActionDate', 'Status', 'Link', 'Notes', 'Archived', 'Order', 'CreatedAt'];

// Cached numeric sheet IDs (key = spreadsheetId)
const _sheetIdCache = {};

async function getNumericSheetId(token, spreadsheetId, sheetName) {
  const cacheKey = `${spreadsheetId}:${sheetName}`;
  if (_sheetIdCache[cacheKey] != null) return _sheetIdCache[cacheKey];
  const data = await req(`${BASE}/${spreadsheetId}?fields=sheets.properties`, token);
  const sheet = (data.sheets || []).find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);
  _sheetIdCache[cacheKey] = sheet.properties.sheetId;
  return sheet.properties.sheetId;
}

async function req(url, token, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Sheets API ${res.status}`);
  }
  return res.json();
}

function rowToTask(row, rowIndex) {
  return {
    id: row[0] || '',
    parentId: row[1] || null,
    item: row[2] || '',
    actionDate: row[3] || '',
    status: row[4] || 'Not Started',
    link: row[5] || '',
    notes: row[6] || '',
    archived: row[7] === 'TRUE',
    order: parseInt(row[8] || '0', 10),
    createdAt: row[9] || '',
    rowIndex,
  };
}

function taskToRow(task) {
  return [
    task.id,
    task.parentId || '',
    task.item,
    task.actionDate,
    task.status,
    task.link,
    task.notes,
    task.archived ? 'TRUE' : 'FALSE',
    String(task.order),
    task.createdAt,
  ];
}

export async function ensureSheet(token, sheetId) {
  const url = `${BASE}/${sheetId}/values/${SHEET}!A1:J1`;
  try {
    const data = await req(url, token);
    if (data.values?.[0]?.[0] === 'ID') return;
  } catch (_) {
    // sheet row might be empty
  }
  await req(
    `${BASE}/${sheetId}/values/${SHEET}!A1:J1?valueInputOption=RAW`,
    token,
    { method: 'PUT', body: JSON.stringify({ values: [HEADERS] }) }
  );
}

export async function fetchTasks(token, sheetId) {
  const url = `${BASE}/${sheetId}/values/${SHEET}!A2:J`;
  const data = await req(url, token);
  const rows = data.values || [];
  return rows
    .map((row, i) => rowToTask(row, i + 2))
    .filter(t => t.id);
}

export async function appendTask(token, sheetId, task) {
  const url = `${BASE}/${sheetId}/values/${SHEET}!A:J:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const data = await req(url, token, {
    method: 'POST',
    body: JSON.stringify({ values: [taskToRow(task)] }),
  });
  const range = data.updates?.updatedRange || '';
  const match = range.match(/!A(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export async function updateTask(token, sheetId, task) {
  const url = `${BASE}/${sheetId}/values/${SHEET}!A${task.rowIndex}:J${task.rowIndex}?valueInputOption=RAW`;
  await req(url, token, {
    method: 'PUT',
    body: JSON.stringify({ values: [taskToRow(task)] }),
  });
}

export async function deleteRow(token, spreadsheetId, rowIndex) {
  const numericId = await getNumericSheetId(token, spreadsheetId, SHEET);
  await req(`${BASE}/${spreadsheetId}:batchUpdate`, token, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId: numericId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // API is 0-based
            endIndex: rowIndex,
          },
        },
      }],
    }),
  });
}

// ── Quotes sheet ──────────────────────────────────────────────────────────────
const QUOTES_SHEET = 'Quotes';
const SEED_QUOTES = [
  ['The Pareto Principle: 20% of your efforts drive 80% of your results — focus relentlessly on what moves the needle.', 'Pareto Principle'],
  ['Worry is not the same as preparation.', 'Ping Yeh, StemoniX'],
  ['The test of a first-rate intelligence is the ability to hold two opposed ideas in mind at the same time and still retain the ability to function.', 'F. Scott Fitzgerald'],
  ['Be an Elephant, not a Hippopotamus — listen deeply, speak thoughtfully, and lead with care rather than dominance.', 'Lead Life Well'],
  ["It's not what you do, it's how well you communicate what you do.", 'Beamer'],
  ['Individuals vary, but percentages remain constant.', 'Arthur Conan Doyle, The Sign of the Four'],
  ['Until you make the unconscious conscious, it will direct your life and you will call it fate.', 'attr. Carl Jung'],
  ['Why do we fall, Bruce? So we can learn to pick ourselves up.', 'Thomas Wayne, Batman Begins'],
  ['Through discipline comes freedom.', 'attr. Aristotle'],
  ['Lord, let me be smart enough to know how dumb I am, and give me the courage to carry on anyway.', ''],
];

export async function ensureQuotesSheet(token, spreadsheetId) {
  // Check if Quotes tab exists
  const meta = await req(`${BASE}/${spreadsheetId}?fields=sheets.properties`, token);
  const exists = (meta.sheets || []).some(s => s.properties.title === QUOTES_SHEET);
  if (!exists) {
    // Create the sheet
    await req(`${BASE}/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: QUOTES_SHEET } } }] }),
    });
    // Write headers + seed data
    const rows = [['Quote', 'Attribution'], ...SEED_QUOTES];
    await req(`${BASE}/${spreadsheetId}/values/${QUOTES_SHEET}!A1:B${rows.length}?valueInputOption=RAW`, token, {
      method: 'PUT',
      body: JSON.stringify({ values: rows }),
    });
  }
}

export async function fetchQuotes(token, spreadsheetId) {
  const url = `${BASE}/${spreadsheetId}/values/${QUOTES_SHEET}!A2:B`;
  const data = await req(url, token);
  return (data.values || [])
    .filter(r => r[0]?.trim())
    .map(r => ({ text: r[0] || '', attribution: r[1] || '' }));
}
