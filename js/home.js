import { loadStore } from "./store.js";
import {
  projectCardHTML, showLoading, showError, wireCardClicks,
} from "./ui.js";

wireCardClicks();

async function main() {
  const kpis = document.getElementById("kpis");
  const active = document.getElementById("active-projects");
  const done = document.getElementById("done-projects");
  showLoading(active);
  showLoading(done);
  try {
    const { members, projects, process } = await loadStore();
    const stages = process.stages;

    const counts = {
      active: projects.filter((p) => p.status === "active").length,
      done: projects.filter((p) => p.status === "done").length,
      members: members.length,
      overdue: projects.filter((p) => p.overdue).length,
    };
    kpis.innerHTML = `
      <div class="kpi-strip">
        <div class="kpi-item kpi-active">
          <span class="kpi-num">${counts.active}</span>
          <span class="kpi-label">Đang viết</span>
        </div>
        <div class="kpi-item kpi-done">
          <span class="kpi-num">${counts.done}</span>
          <span class="kpi-label">Hoàn thành</span>
        </div>
        <div class="kpi-item kpi-members">
          <span class="kpi-num">${counts.members}</span>
          <span class="kpi-label">Thành viên</span>
        </div>
        <div class="kpi-item kpi-overdue">
          <span class="kpi-num">${counts.overdue}</span>
          <span class="kpi-label">Trễ hạn</span>
        </div>
      </div>
    `;

    const activeList = projects.filter((p) => p.status === "active");
    active.innerHTML = activeList.length
      ? activeList.map((p) => projectCardHTML(p, stages)).join("")
      : `<p class="muted">Chưa có dự án đang viết.</p>`;

    const doneList = projects.filter((p) => p.status === "done");
    done.innerHTML = doneList.length
      ? doneList.map((p) => projectCardHTML(p, stages)).join("")
      : `<p class="muted">Chưa có dự án nào hoàn thành — hãy bắt đầu nhé!</p>`;
  } catch (err) {
    showError(active, err);
    done.innerHTML = "";
    kpis.innerHTML = "";
  }
}

main();
