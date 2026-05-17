import { loadStore } from "./store.js";
import { escapeHtml, statusLabel, typeLabel, typeBadgeClass, showError } from "./ui.js";
import { deadlineBucket, daysUntil, formatDateVN, formatRelative } from "./progress.js";

async function main() {
  const root = document.getElementById("timeline-content");
  try {
    const { projects } = await loadStore();

    // Bucket every active/paused project
    const tracked = projects.filter((p) => p.status === "active" || p.status === "paused");
    const overdue = tracked.filter((p) => deadlineBucket(p) === "overdue")
      .sort((a, b) => daysUntil(a.target_date) - daysUntil(b.target_date));
    const soon = tracked.filter((p) => deadlineBucket(p) === "soon")
      .sort((a, b) => daysUntil(a.target_date) - daysUntil(b.target_date));
    const later = tracked.filter((p) => deadlineBucket(p) === "later")
      .sort((a, b) => daysUntil(a.target_date) - daysUntil(b.target_date));
    const undated = tracked.filter((p) => deadlineBucket(p) === "none");

    root.innerHTML = `
      ${section("Trễ hạn", overdue, "overdue", "Cần xử lý gấp.")}
      ${section("Sắp tới hạn (trong 30 ngày)", soon, "soon", "Tập trung tuần tới.")}
      ${section("Lên kế hoạch sau", later, "later", "Còn nhiều thời gian.")}
      ${section("Chưa có deadline", undated, "later", "Đặt mục tiêu hoàn thành vào ô <code>target_date</code>.")}
    `;
  } catch (err) {
    showError(root, err);
  }
}

function section(title, list, bucket, hint) {
  if (!list.length) return `
    <section class="timeline-section">
      <h2>${escapeHtml(title)}</h2>
      <p class="muted small">— không có —</p>
    </section>
  `;
  return `
    <section class="timeline-section">
      <h2>${escapeHtml(title)} <span class="muted small">(${list.length})</span></h2>
      <p class="muted small mt-1">${hint}</p>
      ${list.map((p) => row(p, bucket)).join("")}
    </section>
  `;
}

function row(p, bucket) {
  const dateTxt = p.target_date ? formatDateVN(p.target_date) : "—";
  const rel = p.target_date ? formatRelative(p.target_date) : "";
  return `
    <article class="timeline-row ${bucket}">
      <div class="date">
        ${dateTxt}
        ${rel ? `<span class="rel">${escapeHtml(rel)}</span>` : ""}
      </div>
      <div>
        <div class="ttl"><a href="project.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.title)}</a></div>
        <div class="sub">
          ${p.member ? `<a href="member.html?id=${encodeURIComponent(p.member.id)}">${escapeHtml(p.member.name)}</a> · ` : ""}
          GĐ ${p.currentStage} · ${Math.round(p.overall * 100)}%
        </div>
      </div>
      <div class="row">
        <span class="badge ${typeBadgeClass(p.type)}">${escapeHtml(typeLabel(p.type))}</span>
        <span class="chip status-${p.status}">${escapeHtml(statusLabel(p.status))}</span>
      </div>
    </article>
  `;
}

main();
