/**
 * CLB Biên Kịch — Google Sheets Template Generator
 *
 * HOW TO USE:
 * 1. Open https://script.google.com  →  New project
 * 2. Paste this entire file into the editor
 * 3. Click  Run  →  createClubSheet
 * 4. Grant permissions when prompted
 * 5. The script opens (or prints the URL of) a new Google Sheet
 *    with all 5 tabs pre-configured.
 * 6. Share the sheet: File → Share → Anyone with the link → Viewer
 * 7. Copy the Sheet ID from the URL and paste it into js/config.js
 */

function createClubSheet() {
  const ss = SpreadsheetApp.create("CLB Biên Kịch — Tracker");

  // ── 1. members ──────────────────────────────────────────────────────────
  const membersSheet = ss.getSheets()[0];
  membersSheet.setName("members");

  const memberHeaders = ["id", "name", "role", "avatar_url", "joined", "bio"];
  membersSheet.getRange(1, 1, 1, memberHeaders.length).setValues([memberHeaders]);

  const memberRows = [
    ["m_anh",  "Nguyễn Văn Anh",  "Biên kịch chính", "", "2024-09-01", "Chuyên truyện ngắn phi tuyến"],
    ["m_linh", "Trần Thị Linh",   "Biên kịch",       "", "2024-10-15", "Đam mê phim tâm lý xã hội"],
    ["m_khoa", "Lê Minh Khoa",    "Học viên",        "", "2025-01-10", "Mới bắt đầu hành trình kịch bản"],
    ["m_minh", "Phạm Quốc Minh",  "Mentor",          "", "2023-06-01", "10 năm kinh nghiệm biên kịch"],
  ];
  membersSheet.getRange(2, 1, memberRows.length, memberHeaders.length).setValues(memberRows);

  // Data validation: role dropdown
  const roleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Mentor", "Biên kịch chính", "Biên kịch", "Học viên"], true)
    .setAllowInvalid(false)
    .build();
  membersSheet.getRange(2, 3, 100, 1).setDataValidation(roleRule);

  styleHeaderRow(membersSheet, memberHeaders.length);

  // ── 2. projects ─────────────────────────────────────────────────────────
  const projectsSheet = ss.insertSheet("projects");

  const projectHeaders = [
    "id", "member_id", "title", "type", "logline",
    "start_date", "target_date", "status", "current_stage",
    "docs_url", "logline_doc", "synopsis_doc", "outline_doc", "draft_doc", "notes",
  ];
  projectsSheet.getRange(1, 1, 1, projectHeaders.length).setValues([projectHeaders]);

  const projectRows = [
    ["p_001", "m_anh",  "Tiếng vọng tháng Bảy", "short",      "Một người đàn ông tìm lại ký ức tuổi thơ qua những bức thư cũ.",        "2025-01-15", "2025-08-01",  "active",  "", "", "", "", "", "", ""],
    ["p_002", "m_linh", "Ngã tư không đèn",      "feature",    "Bốn người lạ gặp nhau trong một vụ tai nạn đêm khuya.",                  "2025-02-01", "2025-12-01",  "active",  "", "", "", "", "", "", ""],
    ["p_003", "m_khoa", "Mưa đầu mùa",           "short",      "Cô gái trẻ đối mặt với quyết định rời bỏ quê hương.",                   "2025-03-10", "2025-09-30",  "active",  "", "", "", "", "", "", ""],
    ["p_004", "m_minh", "Hồi ký của gió",         "adaptation", "Chuyển thể từ tiểu thuyết cùng tên — cuộc đời một nhạc sĩ mù.",        "2024-06-01", "2025-06-01",  "done",    "", "", "", "", "", "", ""],
    ["p_005", "m_anh",  "Bên kia cửa sổ",         "series",    "Web-series 6 tập về cư dân một chung cư cũ ở Hà Nội.",                  "2025-04-01", "",            "active",  "", "", "", "", "", "", ""],
  ];
  projectsSheet.getRange(2, 1, projectRows.length, projectHeaders.length).setValues(projectRows);

  // Data validation dropdowns
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["short", "feature", "series", "adaptation"], true)
    .setAllowInvalid(false).build();
  projectsSheet.getRange(2, 4, 100, 1).setDataValidation(typeRule);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["active", "paused", "done", "shelved"], true)
    .setAllowInvalid(false).build();
  projectsSheet.getRange(2, 8, 100, 1).setDataValidation(statusRule);

  const stageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["", "1", "2", "3", "4", "5", "6", "7", "8", "9"], true)
    .setAllowInvalid(true).build();
  projectsSheet.getRange(2, 9, 100, 1).setDataValidation(stageRule);

  styleHeaderRow(projectsSheet, projectHeaders.length);

  // ── 3. progress ─────────────────────────────────────────────────────────
  const progressSheet = ss.insertSheet("progress");

  // Build header list: project_id, s1_1..s1_4, s2_1..s2_2, ... s9_1..s9_5
  const substepCounts = [4, 2, 4, 4, 4, 3, 4, 4, 5]; // sub-steps per stage 1–9
  const progressHeaders = ["project_id"];
  substepCounts.forEach((count, stageIdx) => {
    for (let sub = 1; sub <= count; sub++) {
      progressHeaders.push(`s${stageIdx + 1}_${sub}`);
    }
  });
  progressSheet.getRange(1, 1, 1, progressHeaders.length).setValues([progressHeaders]);

  // Sample rows (p_001 is well underway, others lighter)
  const today = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  const progressRows = [
    // p_001: stage 1 done, stage 2 done, stage 3 in progress
    ["p_001", today, today, today, today,  today, today,  today, today, "WIP", "",  "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    // p_002: stage 1 done, stage 2 in progress
    ["p_002", today, today, today, today,  "WIP", "",      "", "", "",  "",  "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    // p_003: stage 1 partial
    ["p_003", today, today, "",    "",     "", "",          "", "", "",  "",  "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    // p_004: all done (status=done)
    ["p_004", today, today, today, today,  today, today,  today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today, today],
    // p_005: just started stage 1
    ["p_005", "WIP", "",    "",    "",     "", "",          "", "", "",  "",  "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ];

  // Ensure each row has exactly progressHeaders.length columns
  const colCount = progressHeaders.length; // 35 total
  const paddedRows = progressRows.map(r => {
    while (r.length < colCount) r.push("");
    return r.slice(0, colCount);
  });
  progressSheet.getRange(2, 1, paddedRows.length, colCount).setValues(paddedRows);

  // Data validation for sub-step cells: allow WIP, Done, date, or blank
  const stepRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["", "WIP", "Done", "✓"], true)
    .setAllowInvalid(true) // also allow YYYY-MM-DD dates
    .setHelpText("Để trống = chưa bắt đầu | WIP = đang làm | YYYY-MM-DD hoặc Done = hoàn thành")
    .build();
  progressSheet.getRange(2, 2, 200, colCount - 1).setDataValidation(stepRule);

  styleHeaderRow(progressSheet, colCount);
  // Freeze first column so project_id stays visible when scrolling right
  progressSheet.setFrozenColumns(1);

  // ── 4. errors_checklist ─────────────────────────────────────────────────
  const errorsSheet = ss.insertSheet("errors_checklist");

  const errorsHeaders = ["project_id"];
  for (let i = 1; i <= 33; i++) errorsHeaders.push(`e${i}`);
  errorsSheet.getRange(1, 1, 1, errorsHeaders.length).setValues([errorsHeaders]);

  // Sample: p_004 (done project) has some errors checked
  const errorsRow = ["p_004"];
  for (let i = 1; i <= 33; i++) errorsRow.push(i % 7 === 0 ? "x" : ""); // every 7th checked
  errorsSheet.getRange(2, 1, 1, errorsHeaders.length).setValues([errorsRow]);

  const checkRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["", "x"], true)
    .setAllowInvalid(false)
    .setHelpText("x = lỗi này xuất hiện trong dự án")
    .build();
  errorsSheet.getRange(2, 2, 200, 33).setDataValidation(checkRule);

  styleHeaderRow(errorsSheet, errorsHeaders.length);
  errorsSheet.setFrozenColumns(1);

  // ── 5. events ───────────────────────────────────────────────────────────
  const eventsSheet = ss.insertSheet("events");

  const eventHeaders = ["date", "project_id", "kind", "text"];
  eventsSheet.getRange(1, 1, 1, eventHeaders.length).setValues([eventHeaders]);

  const eventRows = [
    ["2025-01-15", "p_001", "milestone",  "Bắt đầu dự án"],
    ["2025-02-20", "p_001", "stage_done", "Hoàn thành Giai đoạn 1 — Ý tưởng"],
    ["2025-03-05", "p_001", "stage_done", "Hoàn thành Giai đoạn 2 — Logline"],
    ["2025-02-01", "p_002", "milestone",  "Bắt đầu dự án"],
    ["2025-04-10", "p_002", "stage_done", "Hoàn thành Giai đoạn 1 — Ý tưởng"],
  ];
  eventsSheet.getRange(2, 1, eventRows.length, eventHeaders.length).setValues(eventRows);

  const kindRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["stage_done", "milestone", "note"], true)
    .setAllowInvalid(false).build();
  eventsSheet.getRange(2, 3, 200, 1).setDataValidation(kindRule);

  styleHeaderRow(eventsSheet, eventHeaders.length);

  // ── Done ─────────────────────────────────────────────────────────────────
  const url = ss.getUrl();
  const id  = ss.getId();
  Logger.log("✅ Sheet created!");
  Logger.log("URL: " + url);
  Logger.log("Sheet ID (paste into js/config.js): " + id);

  // Show a dialog so the user can grab the Sheet ID immediately
  const ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;
  if (ui) {
    ui.alert(
      "✅ Sheet đã được tạo!",
      `Sheet ID (dán vào js/config.js):\n\n${id}\n\nURL:\n${url}`,
      ui.ButtonSet.OK,
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function styleHeaderRow(sheet, numCols) {
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange
    .setBackground("#1F1B17")
    .setFontColor("#FAF6EF")
    .setFontWeight("bold")
    .setFontFamily("Arial");
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 120);
  // Auto-resize the rest
  for (let c = 2; c <= numCols; c++) {
    sheet.setColumnWidth(c, c <= 3 ? 160 : 90);
  }
}
