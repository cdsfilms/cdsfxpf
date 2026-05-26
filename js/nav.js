import { CONFIG } from "./config.js";
import { clearSheetCache } from "./sheets.js";
import { invalidateStore } from "./store.js";

const PAGES = [
  { href: "index.html",    label: "Trang chủ",  code: "TC" },
  { href: "kanban.html",   label: "Kanban",      code: "KB" },
  { href: "members.html",  label: "Thành viên",  code: "TV" },
  { href: "process.html",  label: "Quy trình",   code: "QT" },
  { href: "timeline.html",  label: "Lịch trình",   code: "LT" },
  { href: "stats.html",     label: "Thống kê",     code: "TK" },
  { href: "sponsors.html",  label: "Nhà tài trợ",  code: "NT" },
];

function currentPage() {
  return location.pathname.split("/").pop() || "index.html";
}

function renderSidebar() {
  const here = currentPage();
  const links = PAGES.map((p) => {
    const active = p.href === here ? " active" : "";
    return `<a href="${p.href}" class="sidebar-link${active}">
      <span class="nav-code">${p.code}</span>
      <span class="nav-label">${p.label}</span>
    </a>`;
  }).join("");

  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <a class="brand" href="index.html">
          <span class="brand-mark">✎</span>
          <span class="brand-text">
            <strong>${CONFIG.CLUB_NAME}</strong>
            <em>${CONFIG.CLUB_TAGLINE}</em>
          </span>
        </a>
      </div>
      <nav class="sidebar-nav">${links}</nav>
      <div class="sidebar-foot">
        <button id="refresh-btn" class="refresh-btn" type="button">↻ Làm mới dữ liệu</button>
        <p class="sidebar-copy">© ${new Date().getFullYear()} · ${CONFIG.USE_MOCK_DATA ? "Mock data" : "Google Sheet"}</p>
      </div>
    </aside>
  `;
}

// Mobile top bar and overlay are injected directly into <body>, NOT inside
// #site-nav. This is critical: #site-nav uses CSS transform on mobile to
// slide off-screen, and a transform creates a new containing block for any
// position:fixed descendants — which would drag them off-screen too.
function injectMobileChrome() {
  if (document.getElementById("mob-topbar")) return; // already injected
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="mob-topbar" id="mob-topbar">
      <a class="brand brand-sm" href="index.html">
        <span class="brand-mark brand-mark-sm">✎</span>
        <strong>${CONFIG.CLUB_NAME}</strong>
      </a>
      <button class="mob-toggle" id="mob-toggle" aria-label="Mở menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="mob-overlay" id="mob-overlay"></div>
  `;
  document.body.appendChild(div);
}

function wire() {
  const toggle  = document.getElementById("mob-toggle");
  const nav     = document.getElementById("site-nav");
  const overlay = document.getElementById("mob-overlay");

  if (toggle && nav && overlay) {
    const openNav  = () => { nav.classList.add("open"); overlay.classList.add("open"); toggle.setAttribute("aria-expanded","true"); };
    const closeNav = () => { nav.classList.remove("open"); overlay.classList.remove("open"); toggle.setAttribute("aria-expanded","false"); };
    toggle.addEventListener("click", () => nav.classList.contains("open") ? closeNav() : openNav());
    overlay.addEventListener("click", closeNav);
  }

  const refresh = document.getElementById("refresh-btn");
  if (refresh) {
    refresh.addEventListener("click", () => { clearSheetCache(); invalidateStore(); location.reload(); });
  }
}

export function mountChrome() {
  const nav  = document.getElementById("site-nav");
  const foot = document.getElementById("site-foot");
  if (nav)  nav.innerHTML  = renderSidebar();
  if (foot) foot.innerHTML = "";
  injectMobileChrome();
  document.title = document.title.includes("—")
    ? document.title
    : `${document.title} — ${CONFIG.CLUB_NAME}`;
  wire();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountChrome);
} else {
  mountChrome();
}
