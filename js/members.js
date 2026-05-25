import { loadStore } from "./store.js";
import {
  escapeHtml, avatarHTML, roleBadgeClass, showError, wireCardClicks,
} from "./ui.js";

wireCardClicks();

async function main() {
  const grid = document.getElementById("members-grid");
  try {
    const { members } = await loadStore();
    grid.innerHTML = members.map(memberCard).join("");
  } catch (err) {
    showError(grid, err);
  }
}

function memberCard(m) {
  const active = m.projects.filter((p) => p.status === "active").length;
  const done = m.projects.filter((p) => p.status === "done").length;
  const aggregate = m.projects.length
    ? m.projects.reduce((sum, p) => sum + p.overall, 0) / m.projects.length
    : 0;
  const projectList = m.projects.slice(0, 4).map((p) =>
    `<li><a href="project.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a> <span class="muted small">— GĐ ${p.currentStage}</span></li>`,
  ).join("");
  const href = `member.html?id=${encodeURIComponent(m.id)}`;
  return `
    <div class="card member-card" data-href="${href}" tabindex="0" role="link">
      ${avatarHTML(m, "lg")}
      <div class="info">
        <div class="row" style="justify-content: space-between;">
          <h3 class="name"><a href="${href}">${escapeHtml(m.name)}</a></h3>
          <span class="badge ${roleBadgeClass(m.role)}">${escapeHtml(m.role || "")}</span>
        </div>
        ${m.bio ? `<p class="bio">${escapeHtml(m.bio)}</p>` : ""}
        <div class="stats">
          <span><strong>${active}</strong> đang viết</span>
          <span><strong>${done}</strong> hoàn thành</span>
          <span><strong>${Math.round(aggregate * 100)}%</strong> tổng tiến độ</span>
        </div>
        ${projectList ? `<ul class="muted small mt-1" style="padding-left: 1.1em; margin-top: .5rem;">${projectList}</ul>` : ""}
      </div>
    </div>
  `;
}

main();
