// Loads everything the site needs in one round-trip: sheet tabs + process.json.
// Returns a fully-joined in-memory data model. Cached for the lifetime of the
// page so multiple modules can call `loadStore()` cheaply.

import { CONFIG } from "./config.js";
import { fetchSheet } from "./sheets.js";
import {
  allStagePcts,
  deriveCurrentStage,
  overallPct,
  isOverdue,
} from "./progress.js";

let _storePromise = null;

export function loadStore() {
  if (!_storePromise) _storePromise = build();
  return _storePromise;
}

export function invalidateStore() {
  _storePromise = null;
}

async function build() {
  const [members, projects, progress, errors, events, process] = await Promise.all([
    fetchSheet(CONFIG.TABS.members),
    fetchSheet(CONFIG.TABS.projects),
    fetchSheet(CONFIG.TABS.progress),
    fetchSheet(CONFIG.TABS.errors).catch(() => []),     // optional tabs
    fetchSheet(CONFIG.TABS.events).catch(() => []),     // optional tabs
    fetch("./data/process.json").then((r) => r.json()),
  ]);

  const memberById = new Map(members.map((m) => [m.id, m]));
  const progressByProject = new Map(progress.map((p) => [p.project_id, p]));
  const errorsByProject = new Map(errors.map((e) => [e.project_id, e]));

  // Join: every project gets .member, .progress, .stagePcts, .overall,
  // .currentStage, .overdue
  for (const p of projects) {
    p.member = memberById.get(p.member_id) || null;
    p.progress = progressByProject.get(p.id) || null;
    p.errors = errorsByProject.get(p.id) || null;
    p.stagePcts = allStagePcts(p.progress, process.stages);
    p.overall = overallPct(p.progress, process.stages);
    p.rewriteTimes = Number(p.progress?.rewrite_times) || 0;
    // Sheet column can override; otherwise derive.
    const fromSheet = Number(p.current_stage);
    p.currentStage = Number.isInteger(fromSheet) && fromSheet >= 1 && fromSheet <= process.stages.length
      ? fromSheet
      : deriveCurrentStage(p.progress, process.stages);
    p.overdue = isOverdue(p);
  }

  // Reverse-join: every member gets .projects (array, active first).
  for (const m of members) {
    m.projects = projects
      .filter((p) => p.member_id === m.id)
      .sort((a, b) => statusRank(a.status) - statusRank(b.status));
  }

  // Sort projects: active first, then paused, done, shelved.
  projects.sort((a, b) => statusRank(a.status) - statusRank(b.status));

  return { members, projects, progress, errors, events, process };
}

function statusRank(status) {
  return { active: 0, paused: 1, done: 2, shelved: 3 }[status] ?? 4;
}
