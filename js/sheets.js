// Fetches a Google Sheet tab as an array of records.
//
// Strategy:
//   - When CONFIG.USE_MOCK_DATA is true, load /data/mock/<tab>.json.
//   - Otherwise hit the public `gviz` endpoint, which returns JSON wrapped in
//     `google.visualization.Query.setResponse(...)`. No API key needed — the
//     sheet must be shared as "Anyone with the link → Viewer".
//
// Results are cached in localStorage for CONFIG.CACHE_TTL_MS to keep
// navigation snappy. Call `clearSheetCache()` (wired to the footer Refresh
// button) to force a fresh fetch.

import { CONFIG } from "./config.js";

const CACHE_PREFIX = "sheetcache:v1:";

function cacheKey(tab) {
  return CACHE_PREFIX + tab;
}

function readCache(tab) {
  try {
    const raw = localStorage.getItem(cacheKey(tab));
    if (!raw) return null;
    const { ts, rows } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG.CACHE_TTL_MS) return null;
    return rows;
  } catch {
    return null;
  }
}

function writeCache(tab, rows) {
  try {
    localStorage.setItem(
      cacheKey(tab),
      JSON.stringify({ ts: Date.now(), rows }),
    );
  } catch {
    // localStorage quota or disabled — fine, just skip caching.
  }
}

export function clearSheetCache() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
  }
}

// Cell value normaliser. The gviz response wraps each cell as { v, f } where
// `v` is the raw value and `f` is the formatted string. Dates arrive as
// "Date(YYYY,M,D)" strings (zero-indexed month). Normalise to ISO YYYY-MM-DD
// so the rest of the app can treat all dates uniformly.
function normaliseCell(cell) {
  if (cell == null) return "";
  const v = cell.v;
  if (v == null || v === "") return "";
  if (typeof v === "boolean") return v ? "true" : "";   // checkbox: unchecked → blank, checked → done
  if (typeof v === "string") {
    const m = v.match(/^Date\((\d+),(\d+),(\d+)(?:,\d+,\d+,\d+)?\)$/);
    if (m) {
      const [, y, mo, d] = m;
      const mm = String(Number(mo) + 1).padStart(2, "0");
      const dd = String(Number(d)).padStart(2, "0");
      return `${y}-${mm}-${dd}`;
    }
    return v;
  }
  if (typeof v === "number") return v;
  return String(v);
}

function parseGvizResponse(text) {
  // Wrap looks like:
  //   /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Unexpected gviz response shape");
  const json = JSON.parse(text.slice(start, end + 1));
  if (json.status === "error") {
    const msg = (json.errors || []).map((e) => e.detailed_message || e.message).join("; ");
    throw new Error(`Sheet API error: ${msg || "unknown"}`);
  }
  const cols = (json.table.cols || []).map((c, i) => {
    // gviz prefers `label` (the header row text), falling back to `id`.
    // Lowercase so sheet headers like "S1_1" match substepColumn("1.1") → "s1_1".
    const raw = (c.label || c.id || `col${i}`).toString().trim().toLowerCase();
    return raw;
  });
  return (json.table.rows || []).map((row) => {
    const obj = {};
    (row.c || []).forEach((cell, i) => {
      const key = cols[i] || `col${i}`;
      if (!key) return;
      obj[key] = normaliseCell(cell);
    });
    return obj;
  });
}

async function fetchSheetLive(tab) {
  const url =
    `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq` +
    `?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return parseGvizResponse(await res.text());
}

async function fetchSheetMock(tab) {
  const res = await fetch(`./data/mock/${tab}.json`);
  if (!res.ok) throw new Error(`Mock data missing for tab "${tab}"`);
  return await res.json();
}

export async function fetchSheet(tab) {
  const cached = readCache(tab);
  if (cached) return cached;
  const rows = CONFIG.USE_MOCK_DATA
    ? await fetchSheetMock(tab)
    : await fetchSheetLive(tab);
  writeCache(tab, rows);
  return rows;
}
