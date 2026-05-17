import { loadStore } from "./store.js";
import {
  escapeHtml, initials, typeLabel, typeBadgeClass, statusLabel,
  deadlineChipHTML, showError,
} from "./ui.js";
import {
  cellStatus, substepColumn, stagePct, formatDateVN,
} from "./progress.js";

async function main() {
  const root = document.getElementById("project-page");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    root.innerHTML = `<div class="error">Thiếu tham số <code>?id=</code>.</div>`;
    return;
  }
  try {
    const { projects, process } = await loadStore();
    const p = projects.find((x) => x.id === id);
    if (!p) {
      root.innerHTML = `<div class="error">Không tìm thấy dự án với ID <code>${escapeHtml(id)}</code>.</div>`;
      return;
    }
    document.title = p.title;
    render(root, p, process);
  } catch (err) {
    showError(root, err);
  }
}

function render(root, p, process) {
  const stages = process.stages;
  const currentStage = stages.find((s) => s.num === p.currentStage);

  root.innerHTML = `
    <section class="project-hero">
      <div class="row" style="justify-content: space-between; align-items: baseline;">
        <h1 class="mb-0">${escapeHtml(p.title)}</h1>
        <span class="muted">GĐ ${p.currentStage} • ${Math.round(p.overall * 100)}%</span>
      </div>
      ${p.logline ? `<p class="logline mt-1">${escapeHtml(p.logline)}</p>` : ""}
      <div class="meta-row">
        ${p.member ? `<span><span class="avatar avatar-sm">${escapeHtml(initials(p.member.name))}</span> <a href="member.html?id=${encodeURIComponent(p.member.id)}">${escapeHtml(p.member.name)}</a></span>` : ""}
        <span class="badge ${typeBadgeClass(p.type)}">${escapeHtml(typeLabel(p.type))}</span>
        <span class="chip status-${p.status}">${escapeHtml(statusLabel(p.status))}</span>
        ${deadlineChipHTML(p)}
        ${p.start_date ? `<span class="small muted">Bắt đầu ${formatDateVN(p.start_date)}</span>` : ""}
        ${p.target_date ? `<span class="small muted">Hạn ${formatDateVN(p.target_date)}</span>` : ""}
      </div>
    </section>

    <div class="split">
      <div>
        <div class="panel">
          <h3>Tiến độ chi tiết</h3>
          <div class="bar mb-2"><span style="width: ${Math.round(p.overall * 100)}%;"></span></div>
          <div class="matrix mt-2">
            ${stages.map((s) => matrixRow(p, s)).join("")}
          </div>
          <p class="muted small mt-3">
            <span class="cell" style="min-width:32px;">—</span> chưa bắt đầu
            &nbsp;<span class="cell wip" style="min-width:32px;">—</span> đang làm
            &nbsp;<span class="cell done" style="min-width:32px;">—</span> hoàn thành
          </p>
        </div>

        ${worksheetPanel(currentStage)}
        ${errorsPanel(p, process)}
      </div>

      <aside>
        ${docLinksPanel(p)}
        ${notesPanel(p)}
      </aside>
    </div>

    <p class="mt-3"><a href="kanban.html">← Bảng Kanban</a> &nbsp; ${p.member ? `<a href="member.html?id=${encodeURIComponent(p.member.id)}">${escapeHtml(p.member.name)} →</a>` : ""}</p>
  `;
}

function matrixRow(p, stage) {
  const pct = Math.round(stagePct(p.progress, stage) * 100);
  const cells = stage.substeps.map((sub) => {
    const raw = p.progress?.[substepColumn(sub.id)] ?? "";
    const status = cellStatus(raw);
    const cls = status === "done" ? "done" : status === "wip" ? "wip" : "";
    const label = `${sub.id} — ${sub.title}${raw ? " · " + raw : ""}`;
    return `<span class="cell ${cls}" tabindex="0">
              ${escapeHtml(sub.id)}
              <span class="tip">${escapeHtml(label)}</span>
            </span>`;
  }).join("");
  return `
    <div class="row-label">
      <strong>GĐ ${stage.num}</strong>
      <small>${escapeHtml(stage.title)}</small>
      <small class="muted">${pct}%</small>
    </div>
    <div class="row-cells">${cells}</div>
  `;
}

function worksheetPanel(stage) {
  if (!stage) return "";
  const substeps = stage.substeps.map((sub) => `
    <details>
      <summary><strong>Bước ${escapeHtml(sub.id)}</strong> — ${escapeHtml(sub.title)}</summary>
      <div class="mt-1">${sub.html}</div>
    </details>
  `).join("");
  return `
    <div class="panel mt-3">
      <h3>Worksheet: Giai đoạn ${stage.num} — ${escapeHtml(stage.title)}</h3>
      <p class="muted small">${stage.intro_html ? "" : ""}</p>
      ${stage.intro_html || ""}
      ${substeps}
      <p class="mt-2"><a href="process.html#stage-${stage.num}">Xem trong quy trình đầy đủ →</a></p>
    </div>
  `;
}

function errorsPanel(p, process) {
  const appB = process.appendices.find((a) => a.id === "B");
  if (!appB || !p.errors) return "";
  // Flatten into [{n, text, checked}]
  const flat = appB.categories.flatMap((c) => c.items.map((it) => ({
    n: it.n, text: it.text, checked: !!p.errors[`e${it.n}`],
  })));
  const checked = flat.filter((x) => x.checked).length;
  if (checked === 0 && p.currentStage < 9) return "";
  return `
    <div class="panel mt-3">
      <h3>Checklist 33 lỗi <span class="muted small">(${checked}/${flat.length})</span></h3>
      <ol style="padding-left: 1.6em;">
        ${flat.map((x) => `<li style="opacity:${x.checked ? 1 : .45};">${x.checked ? "✓ " : "○ "}${x.text}</li>`).join("")}
      </ol>
      <p class="mt-1"><a href="process.html#appendix-b">Xem Phụ lục B →</a></p>
    </div>
  `;
}

function docLinksPanel(p) {
  const ICONS = [
    ["docs_url",     "📁", "Thư mục dự án"],
    ["logline_doc",  "L",  "Logline"],
    ["synopsis_doc", "S",  "Synopsis"],
    ["outline_doc",  "O",  "Outline"],
    ["draft_doc",    "D",  "Bản nháp"],
  ];
  const present = ICONS.filter(([k]) => p[k]);
  if (present.length === 0) return `
    <div class="panel">
      <h3>Tài liệu</h3>
      <p class="muted small">Chưa có liên kết nào.</p>
    </div>
  `;
  const items = present.map(([k, icon, label]) => `
    <li>
      <a href="${escapeHtml(p[k])}" target="_blank" rel="noopener">
        <span class="doc-ico">${icon}</span>
        ${escapeHtml(label)}
      </a>
    </li>
  `).join("");
  return `
    <div class="panel">
      <h3>Tài liệu</h3>
      <ul class="doc-list">${items}</ul>
    </div>
  `;
}

function notesPanel(p) {
  if (!p.notes || !p.notes.trim()) return "";
  return `
    <div class="panel mt-3">
      <h3>Ghi chú</h3>
      <p class="notes">${escapeHtml(p.notes)}</p>
    </div>
  `;
}

main();
