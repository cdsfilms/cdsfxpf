// Small DOM helpers + reusable markup snippets shared across pages.

import {
  stagePct,
  stageHasAnyProgress,
  cellStatus,
  substepColumn,
  deadlineBucket,
  formatDateVN,
  formatRelative,
} from "./progress.js";

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  // Vietnamese names: last word is given name → use first letter of given name + first letter.
  const last = parts[parts.length - 1] || "";
  const first = parts[0] || "";
  return (first[0] + (last[0] || "")).toUpperCase();
}

// Convert any Google Drive share/view link to a direct thumbnail URL.
// Handles: /file/d/ID/view, /open?id=ID, /uc?id=ID, lh3 links → passthrough.
function driveImgUrl(url) {
  if (!url) return url;
  const fileId = url.match(/\/file\/d\/([^/?#]+)/)?.[1]
    || url.match(/[?&]id=([^&]+)/)?.[1];
  if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
  return url; // already direct (lh3, imgur, etc.)
}

export function avatarHTML(member, size = "sm") {
  if (!member) return `<span class="avatar avatar-${size}">?</span>`;
  if (member.avatar_url) {
    const src = driveImgUrl(member.avatar_url);
    return `<img class="avatar avatar-${size}" src="${escapeHtml(src)}" alt="${escapeHtml(member.name)}"
      onerror="this.outerHTML='<span class=\\'avatar avatar-${size}\\'>${escapeHtml(initials(member.name))}</span>'">`;
  }
  return `<span class="avatar avatar-${size}">${escapeHtml(initials(member.name))}</span>`;
}

const ROLE_BADGE = {
  "Mentor": "role-mentor",
  "Biên kịch chính": "role-bk",
  "Biên kịch": "role-bk",
  "Học viên": "role-hv",
};
export function roleBadgeClass(role) {
  return ROLE_BADGE[role] || "";
}

const TYPE_LABEL = {
  short: "Phim ngắn",
  feature: "Phim dài",
  series: "Phim bộ",
  adaptation: "Chuyển thể",
};
const TYPE_BADGE = {
  short: "type-short",
  feature: "type-feature",
  series: "type-series",
  adaptation: "type-adapt",
};
export function typeLabel(t) { return TYPE_LABEL[t] || t || ""; }
export function typeBadgeClass(t) { return TYPE_BADGE[t] || ""; }

const STATUS_LABEL = {
  active: "Đang viết",
  paused: "Tạm dừng",
  done: "Hoàn thành",
  shelved: "Gác lại",
};
export function statusLabel(s) { return STATUS_LABEL[s] || s; }

// 9 chiclet strip showing stage completion. `currentStage` highlights the
// stage actively being worked on.
export function stageStripHTML(project, stages) {
  const cells = stages.map((stage) => {
    const pct = stagePct(project.progress, stage);
    const has = stageHasAnyProgress(project.progress, stage);
    let cls = "empty";
    if (pct >= 1) cls = "full";
    else if (has) cls = "partial";
    const current = stage.num === project.currentStage ? " current" : "";
    const w = Math.max(0, Math.min(1, pct));
    return `
      <div class="stage-chiclet ${cls}${current}" title="GĐ ${stage.num}: ${escapeHtml(stage.title)} — ${Math.round(pct * 100)}%">
        <span class="fill" style="transform: scaleX(${w}); ${w === 0 ? "display:none" : ""}"></span>
        <span class="num">${stage.num}</span>
      </div>
    `;
  }).join("");
  return `<div class="stage-strip">${cells}</div>`;
}

// Compact substep bar for the current stage only — used on Kanban cards.
export function currentStageSubstepBarHTML(project, stages) {
  const stage = stages.find((s) => s.num === project.currentStage);
  if (!stage) return "";
  const cells = stage.substeps.map((sub) => {
    const st = cellStatus(project.progress?.[substepColumn(sub.id)]);
    return `<i class="${st}" title="${escapeHtml(sub.id + ' ' + sub.title)}"></i>`;
  }).join("");
  return `<div class="substep-bar" aria-label="Tiến độ giai đoạn hiện tại">${cells}</div>`;
}

export function deadlineChipHTML(project) {
  if (!project.target_date) return "";
  const bucket = deadlineBucket(project);
  if (bucket === "none") return "";
  const rel = formatRelative(project.target_date);
  return `<span class="chip ${bucket}">${escapeHtml(rel)}</span>`;
}

// A doc field value is "secure" when it's non-empty but not a real URL.
// e.g. user writes "security" in the cell to mean the doc exists but is restricted.
function isSecureValue(v) {
  return v && !v.startsWith("http");
}

export function docIconsHTML(project) {
  const author = project.member?.name ? escapeHtml(project.member.name) : "tác giả";
  const ICONS = [
    ["docs_url",     "📁", "Thư mục dự án"],
    ["logline_doc",  "L",  "Logline"],
    ["synopsis_doc", "S",  "Synopsis"],
    ["outline_doc",  "O",  "Outline"],
    ["draft_doc",    "D",  "Bản nháp"],
    ["final_doc",    "F",  "Bản hoàn chỉnh"],
  ];
  const items = ICONS
    .filter(([k]) => project[k])
    .map(([k, icon, label]) => {
      if (isSecureValue(project[k])) {
        return `<span class="doc-ico-lock" title="${label} — liên hệ ${author} để xem">🔒</span>`;
      }
      return `<a href="${escapeHtml(project[k])}" target="_blank" rel="noopener" title="${label}">${icon}</a>`;
    }).join("");
  return items ? `<div class="doclinks">${items}</div>` : "";
}

// Project cards have child links (doc icons), so we can't make the whole
// card an anchor — nested <a> is invalid and the browser auto-splits it.
// Instead use a <div> with a delegated click handler (see wireCardClicks).
export function projectCardHTML(project, stages) {
  const member = project.member;
  const href = `project.html?id=${encodeURIComponent(project.id)}`;
  return `
    <div class="card project-card" data-href="${href}" tabindex="0" role="link">
      <a class="title" href="${href}">${escapeHtml(project.title)}</a>
      <span class="by">
        ${avatarHTML(member, "sm")}
        ${escapeHtml(member?.name || "—")}
        <span class="badge ${typeBadgeClass(project.type)}">${escapeHtml(typeLabel(project.type))}</span>
      </span>
      ${project.logline ? `<span class="logline">${escapeHtml(project.logline)}</span>` : ""}
      ${stageStripHTML(project, stages)}
      <div class="meta">
        <span class="muted">GĐ ${project.currentStage} • ${Math.round(project.overall * 100)}%</span>
        ${project.rewriteTimes > 0 ? `<span class="rewrite-badge" title="Đã viết lại ${project.rewriteTimes} lần">↻${project.rewriteTimes}</span>` : ""}
        <span class="spacer"></span>
        ${deadlineChipHTML(project)}
        ${docIconsHTML(project)}
      </div>
    </div>
  `;
}

// Wire clicks on any `.card[data-href]` so the whole card navigates, but
// clicks on inner links still go to their own targets. Avoids nested <a>.
export function wireCardClicks(root = document) {
  root.addEventListener("click", (e) => {
    const card = e.target.closest(".card[data-href]");
    if (!card) return;
    if (e.target.closest("a, button")) return;
    location.href = card.dataset.href;
  });
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card[data-href]");
    if (!card || e.target !== card) return;
    e.preventDefault();
    location.href = card.dataset.href;
  });
}

export function showLoading(target) {
  target.innerHTML = `<div class="loading">Đang tải…</div>`;
}

export function showError(target, err) {
  target.innerHTML = `<div class="error">Không tải được dữ liệu: ${escapeHtml(err.message || err)}</div>`;
}

// Avatar CSS lives in assets/style.css — no injection needed.
