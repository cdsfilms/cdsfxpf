// Renders the full screenplay-process reference from data/process.json.
// No sheet data needed — pure static content.

import { escapeHtml, showError } from "./ui.js";

async function main() {
  const root = document.getElementById("process-content");
  try {
    const data = await fetch("./data/process.json").then((r) => r.json());

    const tocItems = [
      ...data.stages.map((s) => `<li><a href="#stage-${s.num}"><strong>Giai đoạn ${s.num}</strong> — ${escapeHtml(s.title)}</a></li>`),
      ...data.appendices.map((a) => `<li><a href="#appendix-${a.id.toLowerCase()}"><strong>Phụ lục ${a.id}</strong> — ${escapeHtml(a.title)}</a></li>`),
    ].join("");

    const intro = renderIntro(data.intro);
    const stages = data.stages.map(renderStage).join("");
    const appendices = data.appendices.map(renderAppendix).join("");
    const conclusion = data.conclusion_html
      ? `<section class="process-stage" id="conclusion">
           <header><span class="stage-tag">Kết luận</span><h2>Kết luận</h2></header>
           ${data.conclusion_html}
         </section>`
      : "";

    root.innerHTML = `
      <nav class="process-toc">
        <h3 class="mb-2">Mục lục</h3>
        <ol>${tocItems}</ol>
      </nav>
      ${intro}
      ${stages}
      ${appendices}
      ${conclusion}
    `;

    // Hash navigation: if a hash is present, scroll into view after render.
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    showError(root, err);
  }
}

function renderIntro(intro) {
  if (!intro || Object.keys(intro).length === 0) return "";
  const sections = Object.entries(intro)
    .map(([title, html]) => `<h3>${escapeHtml(title)}</h3>${html}`)
    .join("");
  return `<section class="process-stage" id="intro">
    <header><span class="stage-tag">Lời mở đầu</span><h2>Trước khi bắt đầu</h2></header>
    ${sections}
  </section>`;
}

function renderStage(stage) {
  const substeps = stage.substeps.map((sub) => `
    <article class="substep" id="step-${sub.id.replace(".", "-")}">
      <h3><span class="id">Bước ${escapeHtml(sub.id)}</span> ${escapeHtml(sub.title)}</h3>
      ${sub.html}
    </article>
  `).join("");
  return `
    <section class="process-stage" id="stage-${stage.num}">
      <header>
        <span class="stage-tag">Giai đoạn ${stage.num}</span>
        <h2>${escapeHtml(stage.title)}</h2>
      </header>
      ${stage.intro_html || ""}
      ${substeps}
    </section>
  `;
}

function renderAppendix(app) {
  const idAttr = `appendix-${app.id.toLowerCase()}`;
  let body = app.intro_html || "";
  if (app.sections) {
    body += app.sections.map((s) => `<h3>${escapeHtml(s.title)}</h3>${s.html}`).join("");
  }
  if (app.substeps) {
    body += app.substeps.map((sub) => `
      <article class="substep">
        <h3><span class="id">Bước ${escapeHtml(sub.id)}</span> ${escapeHtml(sub.title)}</h3>
        ${sub.html}
      </article>
    `).join("");
  }
  if (app.categories) {
    body += app.categories.map((cat) => `
      <div class="err-cat">
        <h4>${escapeHtml(cat.title)}</h4>
        <ol start="${cat.items[0]?.n || 1}">
          ${cat.items.map((it) => `<li value="${it.n}">${it.text}</li>`).join("")}
        </ol>
      </div>
    `).join("");
  }
  return `
    <section class="appendix" id="${idAttr}">
      <header><span class="stage-tag">Phụ lục ${escapeHtml(app.id)}</span><h2>${escapeHtml(app.title)}</h2></header>
      ${body}
    </section>
  `;
}

main();
