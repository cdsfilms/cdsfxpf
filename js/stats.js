import { loadStore } from "./store.js";
import { escapeHtml, statusLabel, typeLabel, showError } from "./ui.js";

async function main() {
  const kpiBox = document.getElementById("stats-kpis");
  try {
    const { members, projects, process } = await loadStore();
    const stages = process.stages;

    const active  = projects.filter((p) => p.status === "active");
    const done    = projects.filter((p) => p.status === "done");
    const overdue = projects.filter((p) => p.overdue);

    // KPI strip — same visual as home page
    kpiBox.innerHTML = `
      <div class="kpi-strip">
        <div class="kpi-item kpi-members">
          <span class="kpi-num">${projects.length}</span>
          <span class="kpi-label">Tổng dự án</span>
        </div>
        <div class="kpi-item kpi-active">
          <span class="kpi-num">${active.length}</span>
          <span class="kpi-label">Đang viết</span>
        </div>
        <div class="kpi-item kpi-done">
          <span class="kpi-num">${done.length}</span>
          <span class="kpi-label">Hoàn thành</span>
        </div>
        <div class="kpi-item kpi-overdue">
          <span class="kpi-num">${overdue.length}</span>
          <span class="kpi-label">Trễ hạn</span>
        </div>
      </div>
    `;

    // Remove the grid-4 class that no longer applies now we use kpi-strip
    kpiBox.classList.remove("grid", "grid-4");

    // Stage chart — coloured bars matching stage palette
    const stageColors = ["#D4786A","#C49068","#5A9DB8","#6B9E87","#8B7EC0","#B87EA0","#C47858","#5A9E9E","#7A9E5A"];
    renderBarChart(
      "chart-stages",
      stages.map((s) => ({
        badge: String(s.num),
        label: s.title,
        value: active.filter((p) => p.currentStage === s.num).length,
        color: stageColors[s.num - 1],
      })),
    );

    // Status chart
    const statuses = ["active", "paused", "done", "shelved"];
    renderBarChart(
      "chart-status",
      statuses.map((s) => ({
        label: statusLabel(s),
        value: projects.filter((p) => p.status === s).length,
      })),
    );

    // Type chart
    const types = ["short", "feature", "series", "adaptation"];
    renderBarChart(
      "chart-types",
      types.map((t) => ({
        label: typeLabel(t),
        value: projects.filter((p) => p.type === t).length,
      })),
    );

    // Leaderboard — progress
    const memberStats = members.map((m) => {
      const total = m.projects.length;
      const avg = total ? m.projects.reduce((s, p) => s + p.overall, 0) / total : 0;
      const doneCount = m.projects.filter((p) => p.status === "done").length;
      return { m, total, avg, doneCount };
    });
    renderLeader(
      "leader-progress",
      memberStats
        .filter((x) => x.total > 0)
        .sort((a, b) => b.avg - a.avg)
        .map((x) => ({ name: x.m.name, id: x.m.id, val: `${Math.round(x.avg * 100)}%` })),
    );
    renderLeader(
      "leader-done",
      memberStats
        .filter((x) => x.doneCount > 0)
        .sort((a, b) => b.doneCount - a.doneCount)
        .map((x) => ({ name: x.m.name, id: x.m.id, val: `${x.doneCount} dự án` })),
    );
  } catch (err) {
    showError(kpiBox, err);
  }
}

function renderBarChart(elementId, data) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const max = Math.max(1, ...data.map((d) => d.value));
  el.innerHTML = data.map((d) => {
    const w = (d.value / max) * 100;
    const fillColor = d.color ? `background:${d.color};` : "";
    const badge = d.badge
      ? `<span class="bc-badge" style="background:${d.color || "var(--primary)"};">${escapeHtml(d.badge)}</span>`
      : "";
    return `
      <div class="bc-row">
        <div class="bc-label">${badge}${escapeHtml(d.label)}</div>
        <div class="bc-track">
          <div class="bc-fill" style="width:${w}%;${fillColor}opacity:0.85;"></div>
        </div>
        <div class="bc-num">${d.value}</div>
      </div>
    `;
  }).join("");
}

function renderLeader(elementId, rows) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (rows.length === 0) {
    el.innerHTML = `<li class="muted small">Chưa có dữ liệu.</li>`;
    return;
  }
  el.innerHTML = rows.map((r, i) => `
    <li>
      <span class="rank">${i + 1}</span>
      <span class="nm"><a href="member.html?id=${encodeURIComponent(r.id)}">${escapeHtml(r.name)}</a></span>
      <span class="val">${escapeHtml(r.val)}</span>
    </li>
  `).join("");
}

main();
