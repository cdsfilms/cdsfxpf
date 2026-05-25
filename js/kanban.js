import { loadStore } from "./store.js";
import {
  escapeHtml, avatarHTML, deadlineChipHTML, docIconsHTML,
  currentStageSubstepBarHTML, typeLabel, typeBadgeClass,
  showError,
} from "./ui.js";

const filters = {
  member: "",
  type: "",
  status: "active",
  overdue: false,
};

let store;

async function main() {
  const board = document.getElementById("board");
  try {
    store = await loadStore();

    // Populate member dropdown
    const fMember = document.getElementById("f-member");
    for (const m of store.members) {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      fMember.appendChild(opt);
    }

    // Wire filter inputs
    fMember.addEventListener("change", (e) => { filters.member = e.target.value; render(); });
    document.getElementById("f-type").addEventListener("change", (e) => { filters.type = e.target.value; render(); });
    document.getElementById("f-status").addEventListener("change", (e) => { filters.status = e.target.value; render(); });
    document.getElementById("f-overdue").addEventListener("change", (e) => { filters.overdue = e.target.checked; render(); });

    render();
  } catch (err) {
    showError(board, err);
  }
}

function render() {
  const board = document.getElementById("board");
  const stages = store.process.stages;

  const filtered = store.projects.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.member && p.member_id !== filters.member) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.overdue && !p.overdue) return false;
    return true;
  });

  board.innerHTML = stages.map((stage) => {
    const here = filtered.filter((p) => p.currentStage === stage.num);
    const cards = here.map((p) => miniCard(p, stages)).join("");
    return `
      <div class="column">
        <div class="col-head">
          <div>
            <div class="stage-num">GĐ ${stage.num}</div>
            <div class="stage-title">${escapeHtml(stage.title)}</div>
          </div>
          <span class="count">${here.length}</span>
        </div>
        <div class="col-body">
          ${cards || `<p class="muted small">— trống —</p>`}
        </div>
      </div>
    `;
  }).join("");
}

function miniCard(project, stages) {
  const member = project.member;
  const href = `project.html?id=${encodeURIComponent(project.id)}`;
  return `
    <a class="mini-card" href="${href}">
      <div class="ttl">${escapeHtml(project.title)}${project.security ? " 🔒" : ""}</div>
      <div class="row">
        <span>${avatarHTML(member, "sm")} ${escapeHtml(member?.name || "—")}</span>
        <span class="badge ${typeBadgeClass(project.type)}">${escapeHtml(typeLabel(project.type))}</span>
      </div>
      ${currentStageSubstepBarHTML(project, stages)}
      <div class="row">
        <span class="muted small">${Math.round(project.overall * 100)}%</span>
        ${project.rewriteTimes > 0 ? `<span class="rewrite-badge" title="Đã viết lại ${project.rewriteTimes} lần">↻${project.rewriteTimes}</span>` : ""}
        <span class="spacer"></span>
        ${deadlineChipHTML(project)}
        ${docIconsHTML(project)}
      </div>
    </a>
  `;
}

main();
