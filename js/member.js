import { loadStore } from "./store.js";
import {
  escapeHtml, initials, roleBadgeClass, stageStripHTML, deadlineChipHTML,
  typeLabel, typeBadgeClass, statusLabel, docIconsHTML, showError,
} from "./ui.js";
import { formatDateVN } from "./progress.js";

async function main() {
  const root = document.getElementById("member-page");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    root.innerHTML = `<div class="error">Thiếu tham số <code>?id=</code>.</div>`;
    return;
  }
  try {
    const { members, process } = await loadStore();
    const m = members.find((x) => x.id === id);
    if (!m) {
      root.innerHTML = `<div class="error">Không tìm thấy thành viên với ID <code>${escapeHtml(id)}</code>.</div>`;
      return;
    }
    document.title = m.name;

    const stages = process.stages;
    const active = m.projects.filter((p) => p.status === "active");
    const done = m.projects.filter((p) => p.status === "done");
    const otherStatuses = m.projects.filter((p) => p.status !== "active" && p.status !== "done");

    const aggregate = m.projects.length
      ? m.projects.reduce((sum, p) => sum + p.overall, 0) / m.projects.length
      : 0;

    root.innerHTML = `
      <section class="member-hero">
        <span class="avatar avatar-lg">${escapeHtml(initials(m.name))}</span>
        <div>
          <h1>${escapeHtml(m.name)}</h1>
          <div class="row mt-1">
            ${m.role ? `<span class="badge ${roleBadgeClass(m.role)}">${escapeHtml(m.role)}</span>` : ""}
            ${m.joined ? `<span class="small muted">Tham gia từ ${formatDateVN(m.joined)}</span>` : ""}
          </div>
          ${m.bio ? `<p class="bio mt-2">${escapeHtml(m.bio)}</p>` : ""}
        </div>
      </section>

      <section class="grid grid-4 mt-2">
        <div class="card kpi"><span class="num">${active.length}</span><span class="lbl">Đang viết</span></div>
        <div class="card kpi done"><span class="num">${done.length}</span><span class="lbl">Hoàn thành</span></div>
        <div class="card kpi"><span class="num">${m.projects.length}</span><span class="lbl">Tổng dự án</span></div>
        <div class="card kpi"><span class="num">${Math.round(aggregate * 100)}%</span><span class="lbl">Tiến độ trung bình</span></div>
      </section>

      ${section("Đang viết", active, stages)}
      ${section("Hoàn thành", done, stages)}
      ${section("Khác", otherStatuses, stages)}

      <p class="mt-3"><a href="members.html">← Tất cả thành viên</a></p>
    `;
  } catch (err) {
    showError(root, err);
  }
}

function section(title, list, stages) {
  if (!list.length) return "";
  return `
    <section class="mt-4">
      <h2>${escapeHtml(title)} <span class="muted small">(${list.length})</span></h2>
      ${list.map((p) => projectRow(p, stages)).join("")}
    </section>
  `;
}

function projectRow(p, stages) {
  return `
    <article class="project-row">
      <div class="head">
        <h3 class="title"><a href="project.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></h3>
        <div class="row">
          <span class="badge ${typeBadgeClass(p.type)}">${escapeHtml(typeLabel(p.type))}</span>
          <span class="chip status-${p.status}">${escapeHtml(statusLabel(p.status))}</span>
          ${deadlineChipHTML(p)}
        </div>
      </div>
      ${p.logline ? `<p class="logline">${escapeHtml(p.logline)}</p>` : ""}
      ${stageStripHTML(p, stages)}
      <div class="row mt-1">
        <span class="muted small">GĐ ${p.currentStage} • ${Math.round(p.overall * 100)}%${p.rewriteTimes > 0 ? ` • ↻ ${p.rewriteTimes} lần viết lại` : ""}${p.start_date ? ` • bắt đầu ${formatDateVN(p.start_date)}` : ""}</span>
        <span class="spacer"></span>
        ${docIconsHTML(p)}
      </div>
    </article>
  `;
}

main();
