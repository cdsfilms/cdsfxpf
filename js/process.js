import { escapeHtml, showError } from "./ui.js";

async function main() {
  const root = document.getElementById("process-content");
  try {
    const data = await fetch("./data/process.json").then((r) => r.json());

    root.innerHTML = `
      ${renderPipeline(data.stages)}
      <div class="process-layout">
        ${renderToc(data)}
        <div class="process-main">
          ${renderIntro(data.intro)}
          ${data.stages.map(renderStage).join("")}
          ${data.appendices.map(renderAppendix).join("")}
          ${data.conclusion_html
            ? `<section class="process-section" id="conclusion">
                 <header class="process-header">
                   <div class="proc-badge" style="background:var(--text-2)">✦</div>
                   <div><span class="proc-label">Kết luận</span><h2>Kết luận</h2></div>
                 </header>
                 ${enrich(data.conclusion_html)}
               </section>`
            : ""}
        </div>
      </div>
    `;

    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    showError(root, err);
  }
}

// ── Pipeline ──────────────────────────────────────────────
function renderPipeline(stages) {
  const items = stages.map((s) => `
    <a href="#stage-${s.num}" class="pip-node sc-${s.num}">
      <span class="pip-num">${s.num}</span>
      <span class="pip-title">${escapeHtml(s.title)}</span>
    </a>
  `).join('<span class="pip-arrow">›</span>');
  return `<div class="stage-pipeline">${items}</div>`;
}

// ── TOC ───────────────────────────────────────────────────
function renderToc(data) {
  const stageLinks = data.stages.map((s) => `
    <li>
      <a href="#stage-${s.num}">
        <span class="toc-dot sc-${s.num}"></span>
        <span><strong>GĐ ${s.num}</strong> — ${escapeHtml(s.title)}</span>
      </a>
    </li>`).join("");
  const appLinks = data.appendices.map((a) => `
    <li>
      <a href="#appendix-${a.id.toLowerCase()}">
        <span class="toc-dot" style="background:var(--mint)"></span>
        <span><strong>PL ${a.id}</strong> — ${escapeHtml(a.title)}</span>
      </a>
    </li>`).join("");
  return `
    <nav class="process-toc">
      <p class="toc-heading">Mục lục</p>
      <ol>${stageLinks}${appLinks}</ol>
    </nav>
  `;
}

// ── Intro ─────────────────────────────────────────────────
function renderIntro(intro) {
  if (!intro || Object.keys(intro).length === 0) return "";
  const sections = Object.entries(intro)
    .map(([title, html]) => `<h3>${escapeHtml(title)}</h3>${enrich(html)}`)
    .join("");
  return `
    <section class="process-section" id="intro">
      <header class="process-header">
        <div class="proc-badge" style="background:var(--sky)">✦</div>
        <div><span class="proc-label">Lời mở đầu</span><h2>Trước khi bắt đầu</h2></div>
      </header>
      ${sections}
    </section>`;
}

// ── Stage ─────────────────────────────────────────────────
function renderStage(stage) {
  const substeps = stage.substeps.map((sub) => {
    // Extract deliverables if present
    const { main, deliverables } = splitDeliverables(sub.html);
    const delHTML = deliverables
      ? `<div class="callout callout-deliver">${enrich(deliverables)}</div>`
      : "";
    return `
      <details class="substep sc-${stage.num}" id="step-${sub.id.replace(".", "-")}">
        <summary>
          <span class="substep-id sc-${stage.num}">Bước ${escapeHtml(sub.id)}</span>
          <span class="substep-title">${escapeHtml(sub.title)}</span>
          <span class="substep-arrow">›</span>
        </summary>
        <div class="substep-body">${enrich(main)}${delHTML}</div>
      </details>`;
  }).join("");

  return `
    <section class="process-section" id="stage-${stage.num}">
      <header class="process-header">
        <div class="proc-badge sc-${stage.num}">${stage.num}</div>
        <div>
          <span class="proc-label">Giai đoạn ${stage.num}</span>
          <h2>${escapeHtml(stage.title)}</h2>
        </div>
      </header>
      ${stage.intro_html ? `<div class="stage-intro">${enrich(stage.intro_html)}</div>` : ""}
      <div class="substeps-list">${substeps}</div>
    </section>`;
}

// ── Appendix ──────────────────────────────────────────────
function renderAppendix(app) {
  const id = `appendix-${app.id.toLowerCase()}`;
  let body = app.intro_html ? enrich(app.intro_html) : "";

  if (app.sections) {
    body += app.sections.map((s) => `<h3>${escapeHtml(s.title)}</h3>${enrich(s.html)}`).join("");
  }
  if (app.substeps) {
    body += app.substeps.map((sub) => `
      <details class="substep" id="step-d-${sub.id.replace(".", "-")}">
        <summary>
          <span class="substep-id" style="background:var(--mint-lt);color:var(--mint-2)">Bước ${escapeHtml(sub.id)}</span>
          <span class="substep-title">${escapeHtml(sub.title)}</span>
          <span class="substep-arrow">›</span>
        </summary>
        <div class="substep-body">${enrich(sub.html)}</div>
      </details>`).join("");
  }
  if (app.categories) {
    body += app.categories.map((cat, ci) => `
      <div class="err-cat">
        <h4 class="err-cat-title">${escapeHtml(cat.title)}</h4>
        <ul class="err-list">
          ${cat.items.map((it) => `
            <li class="err-item">
              <span class="err-num">${it.n}</span>
              <span>${escapeHtml(it.text)}</span>
            </li>`).join("")}
        </ul>
      </div>`).join("");
  }

  return `
    <section class="process-section appendix-section" id="${id}">
      <header class="process-header">
        <div class="proc-badge" style="background:var(--mint)">${escapeHtml(app.id)}</div>
        <div>
          <span class="proc-label">Phụ lục ${escapeHtml(app.id)}</span>
          <h2>${escapeHtml(app.title)}</h2>
        </div>
      </header>
      ${body}
    </section>`;
}

// ── HTML enrichment ───────────────────────────────────────

// Separate the "📋 SẢN PHẨM" deliverables block from the rest of a substep's HTML.
function splitDeliverables(html) {
  const match = html.match(/^([\s\S]*?)<h4>📋([^<]*)<\/h4>([\s\S]*)$/);
  if (!match) return { main: html, deliverables: null };
  const [, main, title, listHtml] = match;
  return {
    main,
    deliverables: `<strong>📋 ${title.trim()}</strong>${listHtml}`,
  };
}

// Post-process HTML: convert markdown pipe tables, style warnings.
function enrich(html) {
  if (!html) return "";
  html = convertTables(html);
  html = wrapWarnings(html);
  html = html.replace(/\\\./g, ".").replace(/\\\[/g, "[").replace(/\\\]/g, "]");
  return html;
}

// Convert <p>| ... |</p> markdown pipe tables to proper <table> elements.
function convertTables(html) {
  return html.replace(/<p>(\|[^<]+)<\/p>/g, (_, raw) => {
    if (!raw.includes(" | ")) return `<p>${raw}</p>`;
    // Rows separated by " | | "
    const rowStrings = raw.split(/ \| \| |\|\|/);
    if (rowStrings.length < 2) return `<p>${raw}</p>`;

    const rows = rowStrings.map((r) =>
      r.replace(/^\||\|$/g, "").trim().split(/ \| | \|/).map((c) => c.trim()),
    );

    // Second row is alignment (contains :----)
    if (rows.length < 2 || !rows[1].every((c) => /^:?-+:?$/.test(c.replace(/\\/g, "")))) {
      return `<p>${raw}</p>`;
    }

    const [header, , ...dataRows] = rows;
    const thead = `<tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    const tbody = dataRows
      .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="tbl-wrap"><table class="proc-tbl"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
  });
}

// Wrap <h4>⚠️ ...</h4><p>...</p> in a warning callout.
function wrapWarnings(html) {
  return html.replace(
    /<h4>(⚠️[^<]*)<\/h4>\s*(<p>[\s\S]*?<\/p>)/g,
    (_, title, body) =>
      `<div class="callout callout-warn"><div class="callout-head">${title}</div>${body}</div>`,
  );
}

main();
