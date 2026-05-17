// Pure functions over progress data. No DOM, no fetching.

// A progress cell counts as "done" if it has a YYYY-MM-DD date, the literal
// "Done"/"done"/"✓"/"x", or a truthy value the admin entered to mark completion.
const DONE_RE = /^(done|✓|x|y|yes|hoàn thành|xong|true|1)$/i;
const WIP_RE = /^(wip|in progress|đang làm|đang viết)$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function cellStatus(value) {
  if (value == null) return "blank";
  const s = String(value).trim();
  if (!s) return "blank";
  if (ISO_DATE_RE.test(s)) return "done";
  if (DONE_RE.test(s)) return "done";
  if (WIP_RE.test(s)) return "wip";
  // Any other non-blank text is treated as a freeform note → wip.
  return "wip";
}

// Column key in the progress sheet for a substep id like "1.1" → "s1_1".
export function substepColumn(substepId) {
  return "s" + substepId.replace(".", "_");
}

export function stagePct(progressRow, stage) {
  if (!progressRow) return 0;
  let done = 0;
  let total = 0;
  for (const sub of stage.substeps) {
    total++;
    if (cellStatus(progressRow[substepColumn(sub.id)]) === "done") done++;
  }
  return total === 0 ? 0 : done / total;
}

export function stageHasAnyProgress(progressRow, stage) {
  if (!progressRow) return false;
  for (const sub of stage.substeps) {
    if (cellStatus(progressRow[substepColumn(sub.id)]) !== "blank") return true;
  }
  return false;
}

// All 9 stage percentages, in order. Returns [0..1, ...] of length 9.
export function allStagePcts(progressRow, stages) {
  return stages.map((s) => stagePct(progressRow, s));
}

// Overall project completion = mean of stage completions.
export function overallPct(progressRow, stages) {
  const pcts = allStagePcts(progressRow, stages);
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}

// If the sheet's `current_stage` is blank, derive it: the highest stage with
// at least one substep started. Matches the user's actual working position
// even when earlier stages have gaps. Returns 1 if nothing is started.
export function deriveCurrentStage(progressRow, stages) {
  if (!progressRow) return 1;
  let current = 1;
  for (const stage of stages) {
    if (stageHasAnyProgress(progressRow, stage)) current = stage.num;
  }
  return current;
}

// Date helpers
export function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parseISODate(s) {
  if (!s || typeof s !== "string" || !ISO_DATE_RE.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntil(isoDate) {
  const d = parseISODate(isoDate);
  if (!d) return null;
  return Math.round((d - today()) / 86_400_000);
}

export function isOverdue(project) {
  if (project.status !== "active") return false;
  const dd = daysUntil(project.target_date);
  return dd != null && dd < 0;
}

export function deadlineBucket(project) {
  // Returns "overdue" | "soon" | "later" | "none" for chip styling.
  if (project.status === "done" || project.status === "shelved") return "none";
  const dd = daysUntil(project.target_date);
  if (dd == null) return "none";
  if (dd < 0) return "overdue";
  if (dd <= 30) return "soon";
  return "later";
}

export function formatDateVN(isoDate) {
  const d = parseISODate(isoDate);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatRelative(isoDate) {
  const dd = daysUntil(isoDate);
  if (dd == null) return "";
  if (dd === 0) return "hôm nay";
  if (dd === 1) return "ngày mai";
  if (dd === -1) return "hôm qua";
  if (dd > 0) return `còn ${dd} ngày`;
  return `trễ ${Math.abs(dd)} ngày`;
}
