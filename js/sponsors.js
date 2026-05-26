import { CONFIG } from "./config.js";
import { fetchSheet } from "./sheets.js";
import { escapeHtml, showError } from "./ui.js";

async function main() {
  const root = document.getElementById("sponsors-content");
  try {
    const rows = await fetchSheet(CONFIG.TABS.sponsors);

    // Group by category
    const grouped = {};
    for (const row of rows) {
      const cat = row.category || "Khác";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row);
    }

    if (Object.keys(grouped).length === 0) {
      root.innerHTML = `<p class="muted">Chưa có thông tin nhà tài trợ.</p>`;
      return;
    }

    root.innerHTML = Object.entries(grouped).map(([cat, sponsors]) => `
      <section class="sponsor-group mt-4">
        <h2 class="sponsor-cat">${escapeHtml(cat)}</h2>
        <div class="sponsor-grid">
          ${sponsors.map(s => sponsorCard(s)).join("")}
        </div>
      </section>
    `).join("");

  } catch (err) {
    showError(root, err);
  }
}

function sponsorCard(s) {
  const initial = (s.sponsor || "?")[0].toUpperCase();
  const inner = `
    <div class="sponsor-logo">${escapeHtml(initial)}</div>
    <div class="sponsor-info">
      <div class="sponsor-name">${escapeHtml(s.sponsor || "")}</div>
      ${s.brand ? `<div class="sponsor-link">${escapeHtml(domainOf(s.brand))}</div>` : ""}
    </div>
  `;

  if (s.brand) {
    return `
      <a class="sponsor-card" href="${escapeHtml(s.brand)}" target="_blank" rel="noopener">
        ${inner}
        <span class="sponsor-arrow">↗</span>
      </a>`;
  }
  return `<div class="sponsor-card">${inner}</div>`;
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

main();
