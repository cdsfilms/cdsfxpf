# CLB Biên Kịch — Screenplay Club Progress Tracker

A static website that tracks each member's screenplay projects through the 9-stage / 33-sub-step writing process from `quy_trinh_viet_kich_ban.docx.pdf`. Data lives in a Google Sheet you edit directly; the site reads it client-side via the public `gviz` JSON endpoint. No backend, no API keys, no build step.

Live preview (after deploy): `https://<your-user>.github.io/<repo>/`

---

## Quick start (preview with mock data)

```bash
# from the repo root
python3 -m http.server 8000
# open http://localhost:8000
```

The site ships with `USE_MOCK_DATA = true` and a small mock dataset in `data/mock/` so you can preview every page before setting up the real sheet.

---

## Connecting your Google Sheet

### 1. Create the sheet

Make a new Google Sheet with **5 tabs** named exactly:

- `members`
- `projects`
- `progress`
- `errors_checklist` *(optional)*
- `events` *(optional)*

The first row of each tab is the header row. Column names must match what the frontend expects (see schemas below).

### 2. Share it

`File → Share → Anyone with the link → Viewer`. This is required for the public `gviz` endpoint to work. No write access is exposed.

### 3. Point the site at it

Edit [`js/config.js`](js/config.js):

```js
export const CONFIG = {
  CLUB_NAME: "CLB Biên Kịch",           // change to your club name
  CLUB_TAGLINE: "Từ ý tưởng đến kịch bản hoàn chỉnh",
  USE_MOCK_DATA: false,                  // flip this
  SHEET_ID: "1AbCdEf...",                // copy from the sheet URL
  TABS: { /* keep these unless you renamed tabs */ },
  CACHE_TTL_MS: 5 * 60 * 1000,
};
```

The Sheet ID is the long string in `https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`.

---

## Sheet schemas

### Tab `members`

| Column | Type | Notes |
|---|---|---|
| `id` | string | Stable short ID, used as foreign key. Example: `m_anh`. |
| `name` | string | Display name. |
| `role` | string | Badge text. Recognised: `Mentor`, `Biên kịch chính`, `Biên kịch`, `Học viên`. |
| `avatar_url` | URL | Optional. Falls back to initials. |
| `joined` | date | YYYY-MM-DD. |
| `bio` | string | One-line tagline. |

### Tab `projects`

| Column | Type | Notes |
|---|---|---|
| `id` | string | Stable short ID. Example: `p_001`. |
| `member_id` | string | FK → `members.id`. A member can have multiple projects. |
| `title` | string | |
| `type` | enum | `short` / `feature` / `series` / `adaptation`. |
| `logline` | string | One-sentence pitch. |
| `start_date` | date | YYYY-MM-DD. |
| `target_date` | date | YYYY-MM-DD. Used for overdue calculation. |
| `status` | enum | `active` / `paused` / `done` / `shelved`. |
| `current_stage` | 1–9 or blank | Explicit override. Leave blank to auto-derive (lowest stage not 100% done). |
| `docs_url` | URL | Project folder. |
| `logline_doc` / `synopsis_doc` / `outline_doc` / `draft_doc` | URL | Optional per-stage doc links. |
| `notes` | string | Freeform. Shown on the project page. |

### Tab `progress` *(wide format, one row per project)*

| Column | Type | Notes |
|---|---|---|
| `project_id` | string | FK. |
| `s1_1`, `s1_2`, `s1_3`, `s1_4` | status | Bước 1.1 → 1.4 |
| `s2_1`, `s2_2` | status | Bước 2.1 → 2.2 |
| `s3_1` … `s3_4` | status | Bước 3.1 → 3.4 |
| `s4_1` … `s4_4` | status | Bước 4.1 → 4.4 |
| `s5_1` … `s5_4` | status | Bước 5.1 → 5.4 |
| `s6_1`, `s6_2`, `s6_3` | status | Bước 6.1 → 6.3 |
| `s7_1` … `s7_4` | status | Bước 7.1 → 7.4 |
| `s8_1` … `s8_4` | status | Bước 8.1 → 8.4 |
| `s9_1` … `s9_5` | status | Bước 9.1 → 9.5 |

**Each cell takes one of:**
- blank → not started
- `WIP` (or `đang làm`) → in progress (amber)
- A date `YYYY-MM-DD` → completed on that date (green)
- `Done`, `✓`, `x` → completed (green)

Tip: in Google Sheets, type `=TODAY()` to stamp a completion date.

### Tab `errors_checklist` *(optional — for Appendix B's 33 errors)*

| Column | Type |
|---|---|
| `project_id` | string |
| `e1` … `e33` | blank or `x` |

Shown on project pages only when the project enters Stage 9 (rewriting).

### Tab `events` *(optional — for future activity feed)*

| Column | Type |
|---|---|
| `date` | YYYY-MM-DD |
| `project_id` | string |
| `kind` | `stage_done` / `milestone` / `note` |
| `text` | string |

---

## Common tasks

**Add a new member:** add one row to `members` with a fresh `id`.

**Add a new project:** add one row to `projects`, then add a row to `progress` with the same `project_id` (all sub-step columns blank to start).

**Mark a sub-step done:** put a date (e.g. `2026-05-17`) in the matching cell.

**Refresh the site:** click "Làm mới dữ liệu" in the footer to force a fresh fetch (otherwise data is cached 5 minutes in the browser).

---

## Repository layout

```
/
├── index.html              Home
├── kanban.html             9 stage columns × project cards
├── members.html            Grid of member cards
├── member.html             ?id=<member_id> — single member + their projects
├── project.html            ?id=<project_id> — full 33-cell progress matrix
├── process.html            The 9-stage guide + worksheets + appendices
├── stats.html              Club-wide dashboard
├── timeline.html           Deadlines + overdue list
├── assets/style.css
├── js/
│   ├── config.js           Sheet ID, tab names, cache TTL
│   ├── sheets.js           gviz fetch + parse + localStorage cache
│   ├── store.js            Joined data model
│   ├── progress.js         Pure helpers (stage %, overdue, dates)
│   ├── ui.js               Reusable markup snippets
│   ├── nav.js              Shared header / footer
│   └── home.js / kanban.js / members.js / member.js / project.js /
│       process.js / stats.js / timeline.js
├── data/
│   ├── process.json        The 9-stage doctrine, generated from the PDF
│   └── mock/               Mock sheet data for local preview
└── scripts/
    └── build_process_json.py   Re-generate process.json from the markdown
```

---

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Repo settings → Pages → "Deploy from branch" → `main`, root.
3. Wait ~30s and visit `https://<user>.github.io/<repo>/`.

No build step.

---

## Re-generating `data/process.json`

The 9-stage reference text in `data/process.json` is generated from `quy_trinh_viet_kich_ban.docx.md`. If you edit that markdown, regenerate:

```bash
python3 scripts/build_process_json.py
```

Requires `pypdf` (only used if you want to re-run against the PDF). The markdown path is the primary source.

---

## What's intentionally NOT here (v1)

- **Member self-edit through the site.** Read-only display only. Members edit the sheet.
- **Authentication / private data.** The site is fully public, same as the sheet's "Anyone with link → Viewer" setting.
- **Real-time updates.** A 5-minute cache + manual refresh button is enough for a club.
- **A backend / Apps Script.** Not needed unless you later want write capability.

Easy to add later if needed: an Apps Script web app behind a passphrase would unlock member self-edit without changing the read path.
