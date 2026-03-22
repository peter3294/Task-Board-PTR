const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET = 'Tasks';
const HEADERS = ['ID', 'ParentID', 'Item', 'ActionDate', 'Status', 'Link', 'Notes', 'Archived', 'Order', 'CreatedAt'];

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
