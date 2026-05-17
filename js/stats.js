import { loadStore } from "./store.js";
import { escapeHtml, statusLabel, typeLabel, showError } from "./ui.js";

async function main() {
  const kpiBox = document.getElementById("stats-kpis");
  try {
    const { members, projects, process } = await loadStore();
    const stages = process.stages;

    const active = projects.filter((p) => p.status === "active");
    const done = projects.filter((p) => p.status === "done");
    const overdue = projects.filter((p) => p.overdue);
    const avgOverall = projects.length
      ? projects.reduce((s, p) => s + p.overall, 0) / projects.length
      : 0;

    kpiBox.innerHTML = `
      <div class="card kpi"><span class="num">${projects.length}</span><span class="lbl">Tổng dự án</span></div>
      <div class="card kpi"><span class="num">${active.length}</span><span class="lbl">Đang viết</span></div>
      <div class="card kpi done"><span class="num">${done.length}</span><span class="lbl">Hoàn thành</span></div>
      <div class="card kpi overdue"><span class="num">${overdue.length}</span><span class="lbl">Trễ hạn</span></div>
    `;

    // Chart: projects per current stage (active only)
    renderBarChart(
      "chart-stages",
      stages.map((s) => ({
        label: `GĐ ${s.num} — ${s.title}`,
        value: active.filter((p) => p.currentStage === s.num).length,
      })),
    );

    // Chart: status distribution
    const statuses = ["active", "paused", "done", "shelved"];
    renderBarChart(
      "chart-status",
      statuses.map((s) => ({
        label: statusLabel(s),
        value: projects.filter((p) => p.status === s).length,
      })),
    );

    // Chart: type distribution
    const types = ["short", "feature", "series", "adaptation"];
    renderBarChart(
      "chart-types",
      types.map((t) => ({
        label: typeLabel(t),
        value: projects.filter((p) => p.type === t).length,
      })),
    );

    // Leaderboards
    const memberStats = members.map((m) => {
      const total = m.projects.length;
      const avg = total ? m.projects.reduce((s, p) => s + p.overall, 0) / total : 0;
      const doneCount = m.projects.filter((p) => p.status === "done").length;
      return { m, total, avg, doneCount };
    });
    renderLeader(
      "leader-progress",
      memberStats.filter((x) => x.total > 0)
        .sort((a, b) => b.avg - a.avg)
        .map((x) => ({ name: x.m.name, id: x.m.id, val: `${Math.round(x.avg * 100)}%` })),
    );
    renderLeader(
      "leader-done",
      memberStats.filter((x) => x.doneCount > 0)
        .sort((a, b) => b.doneCount - a.doneCount)
        .map((x) => ({ name: x.m.name, id: x.m.id, val: `${x.doneCount} dự án` })),
    );
  } catch (err) {
    showError(kpiBox, err);
  }
}

function renderBarChart(elementId, data) {
  const el = document.getElementById(elementId);
  const max = Math.max(1, ...data.map((d) => d.value));
  el.innerHTML = data.map((d) => {
    const w = (d.value / max) * 100;
    return `
      <div class="bc-row">
        <div class="bc-label">${escapeHtml(d.label)}</div>
        <div class="bc-track"><div class="bc-fill" style="width:${w}%;"></div></div>
        <div class="bc-num">${d.value}</div>
      </div>
    `;
  }).join("");
}

function renderLeader(elementId, rows) {
  const el = document.getElementById(elementId);
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
