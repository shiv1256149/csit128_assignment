// fetches /api/* data, renders it; each fn guards on its own target element existing

(function () {
  "use strict";

  /* ---------- small helpers --------------------------------------- */

  // Fetch JSON from a URL and throw on a non-OK response.
  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed: " + url);
    return res.json();
  }

  // Escape user / data strings before inserting as HTML (prevents XSS).
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Render a 1-5 star string from a numeric rating.
  function stars(n) {
    n = Math.max(0, Math.min(5, Number(n) || 0));
    return "★★★★★☆☆☆☆☆".slice(5 - n, 10 - n);
  }

  // Format an ISO date as e.g. "28 May 2026".
  function niceDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Inline SVG icons keyed by name (used by the services cards).
  const ICONS = {
    server:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><line x1="7" y1="7" x2="7" y2="7"/><line x1="7" y1="17" x2="7" y2="17"/></svg>',
    database:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
    globe:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>',
    wrench:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.1-.6-.6-2.1z"/></svg>',
    chart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V4M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>',
    shield:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
  };

  /* ---------- renderers (each guarded by its target element) ------- */

  // Company intro paragraphs + headline stats (Home / About).
  async function renderCompany() {
    const introEl = document.getElementById("companyIntro");
    const statsEl = document.getElementById("companyStats");
    if (!introEl && !statsEl) return;
    try {
      const { company } = await getJSON("/api/company");
      if (introEl) {
        introEl.innerHTML = company.history.map((p) => "<p>" + esc(p) + "</p>").join("");
      }
      if (statsEl) {
        statsEl.innerHTML = company.stats
          .map(
            (s) =>
              '<div class="stat"><div class="num">' +
              esc(s.value) +
              "</div>" +
              '<div class="lbl">' +
              esc(s.label) +
              "</div></div>",
          )
          .join("");
      }
    } catch {
      if (introEl) introEl.innerHTML = "<p>Unable to load company information.</p>";
    }
  }

  // Five-year progress timeline rendered as a <table>.
  async function renderTimeline() {
    const body = document.getElementById("timelineBody");
    if (!body) return;
    try {
      const rows = await getJSON("/api/timeline");
      body.innerHTML = rows
        .map(
          (r) =>
            '<tr><td><span class="year-badge">' +
            esc(r.year) +
            "</span></td>" +
            "<td><strong>" +
            esc(r.milestone) +
            "</strong></td>" +
            "<td>" +
            esc(r.detail) +
            "</td></tr>",
        )
        .join("");
    } catch {
      body.innerHTML = '<tr><td colspan="3">Unable to load timeline.</td></tr>';
    }
  }

  // Products / services cards (read from JSON).
  async function renderServices() {
    const wrap = document.getElementById("servicesGrid");
    if (!wrap) return;
    try {
      const services = await getJSON("/api/services");
      wrap.innerHTML = services
        .map(
          (s) =>
            '<article class="card">' +
            '<div class="icon-chip">' +
            (ICONS[s.icon] || ICONS.server) +
            "</div>" +
            "<h3>" +
            esc(s.name) +
            "</h3>" +
            "<p>" +
            esc(s.details) +
            "</p>" +
            '<span class="price-tag">' +
            esc(s.startingPrice) +
            "</span>" +
            '<p style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap">' +
            '<button type="button" class="btn btn--primary buy-btn" data-item-type="service" data-item-id="' +
            esc(s.id) +
            '">Buy this service</button>' +
            '<a class="btn btn--ghost" href="contact.html?subject=' +
            encodeURIComponent("Service inquiry: " + s.name) +
            '">Ask a question</a>' +
            "</p>" +
            "</article>",
        )
        .join("");
    } catch {
      wrap.innerHTML = "<p>Unable to load services.</p>";
    }
  }

  // Product cards (read from JSON), shown on products.html.
  async function renderProducts() {
    const wrap = document.getElementById("productsGrid");
    if (!wrap) return;
    try {
      const products = await getJSON("/api/products");
      if (!products.length) {
        wrap.innerHTML = '<p class="skeleton">No products published yet.</p>';
        return;
      }
      wrap.innerHTML = products
        .map(
          (p) =>
            '<article class="card">' +
            (p.category ? '<span class="tag">' + esc(p.category) + "</span>" : "") +
            "<h3>" +
            esc(p.name) +
            "</h3>" +
            "<p>" +
            esc(p.description) +
            "</p>" +
            '<span class="price-tag">' +
            esc(p.price) +
            "</span>" +
            '<p style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap">' +
            '<button type="button" class="btn btn--primary buy-btn" data-item-type="product" data-item-id="' +
            esc(p.id) +
            '">Buy this product</button>' +
            '<a class="btn btn--ghost" href="contact.html?subject=' +
            encodeURIComponent("Product inquiry: " + p.name) +
            '">Ask a question</a>' +
            "</p>" +
            "</article>",
        )
        .join("");
    } catch {
      wrap.innerHTML = "<p>Unable to load products.</p>";
    }
  }

  // Awards rendered as a <table>.
  async function renderAwards() {
    const body = document.getElementById("awardsBody");
    if (!body) return;
    try {
      const awards = await getJSON("/api/awards");
      body.innerHTML = awards
        .map(
          (a) =>
            '<tr><td><span class="year-badge">' +
            esc(a.year) +
            "</span></td>" +
            "<td><strong>" +
            esc(a.title) +
            "</strong></td>" +
            "<td>" +
            esc(a.organisation) +
            "</td>" +
            "<td>" +
            esc(a.note) +
            "</td></tr>",
        )
        .join("");
    } catch {
      body.innerHTML = '<tr><td colspan="4">Unable to load awards.</td></tr>';
    }
  }

  // Customer testimonials (curated, from JSON).
  async function renderTestimonials() {
    const wrap = document.getElementById("testimonialsGrid");
    if (!wrap) return;
    try {
      const items = await getJSON("/api/testimonials");
      wrap.innerHTML = items
        .map((t) => {
          const initials = t.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            '<article class="card">' +
            '<div class="stars" aria-label="' +
            t.rating +
            ' out of 5">' +
            stars(t.rating) +
            "</div>" +
            '<p class="quote">&ldquo;' +
            esc(t.quote) +
            "&rdquo;</p>" +
            '<div class="who"><div class="avatar" style="background:#2563eb">' +
            esc(initials) +
            "</div>" +
            '<div><div class="name">' +
            esc(t.name) +
            "</div>" +
            '<div class="role">' +
            esc(t.role) +
            ", " +
            esc(t.company) +
            "</div></div></div>" +
            "</article>"
          );
        })
        .join("");
    } catch {
      wrap.innerHTML = "<p>Unable to load testimonials.</p>";
    }
  }

  // Team / founders grid.
  async function renderTeam() {
    const founders = document.getElementById("foundersGrid");
    const staff = document.getElementById("staffGrid");
    if (!founders && !staff) return;
    try {
      const team = await getJSON("/api/team");
      const card = (m) =>
        '<article class="card member">' +
        '<div class="avatar" style="background:' +
        esc(m.accent) +
        '">' +
        esc(m.initials) +
        "</div>" +
        "<h3>" +
        esc(m.name) +
        "</h3>" +
        '<div class="role" style="color:var(--brand);font-weight:600">' +
        esc(m.role) +
        "</div>" +
        (m.founder ? '<span class="badge-founder">Founder</span>' : "") +
        '<p style="margin-top:12px">' +
        esc(m.bio) +
        "</p>" +
        "</article>";
      if (founders)
        founders.innerHTML = team
          .filter((m) => m.founder)
          .map(card)
          .join("");
      if (staff)
        staff.innerHTML = team
          .filter((m) => !m.founder)
          .map(card)
          .join("");
    } catch {
      if (founders) founders.innerHTML = "<p>Unable to load the team.</p>";
    }
  }

  // visitor comments, newest first; exposed on window so validation.js can refresh it
  async function renderComments() {
    const wrap = document.getElementById("commentsList");
    if (!wrap) return;
    try {
      const comments = await getJSON("/api/comments");
      if (!comments.length) {
        wrap.innerHTML = '<p class="skeleton">No comments yet. Be the first!</p>';
        return;
      }
      wrap.innerHTML = comments
        .map(
          (c) =>
            '<div class="comment">' +
            '<div class="head"><span class="name">' +
            esc(c.name) +
            "</span>" +
            '<span class="date">' +
            niceDate(c.submittedAt) +
            "</span></div>" +
            '<div class="stars" aria-label="' +
            c.rating +
            ' of 5">' +
            stars(c.rating) +
            "</div>" +
            '<p style="margin:6px 0 0">' +
            esc(c.message) +
            "</p>" +
            "</div>",
        )
        .join("");
    } catch {
      wrap.innerHTML = "<p>Unable to load comments.</p>";
    }
  }
  window.refreshComments = renderComments;

  // Image-map office hotspots -> show details for the clicked city.
  async function initOfficeMap() {
    const info = document.getElementById("officeInfo");
    const img = document.getElementById("officeMap");
    const mapEl = document.querySelector('map[name="offices"]');
    if (!info || !img || !mapEl) return;
    try {
      const { offices } = await getJSON("/api/company");
      const byId = {};
      offices.forEach((o) => {
        byId[o.id] = o;
      });

      function show(id) {
        const o = byId[id];
        if (!o) return;
        info.innerHTML =
          "<h3>" +
          esc(o.city) +
          ", " +
          esc(o.country) +
          "</h3>" +
          '<div class="role">' +
          esc(o.role) +
          " &middot; opened " +
          esc(o.opened) +
          "</div>" +
          '<p style="margin:8px 0 4px">' +
          esc(o.blurb) +
          "</p>" +
          '<p style="margin:0;color:var(--muted);font-size:.9rem">' +
          esc(o.address) +
          "</p>";
      }

      // Attach handlers to every <area> hotspot in the image map.
      mapEl.querySelectorAll("area").forEach(function (area) {
        const id = area.getAttribute("data-office");
        area.addEventListener("click", function (ev) {
          ev.preventDefault();
          show(id);
        });
        area.addEventListener("mouseenter", function () {
          show(id);
        });
      });

      // Show the headquarters by default.
      show("tashkent");
    } catch {
      info.innerHTML = "<p>Unable to load office locations.</p>";
    }
  }

  // news page: press releases read from MySQL via /api/news
  async function renderNews() {
    const wrap = document.getElementById("newsContainer");
    if (!wrap) return;
    try {
      const releases = await getJSON("/api/news");
      wrap.innerHTML = releases
        .map(
          (r) =>
            '<article class="news-item">' +
            '<div class="date">' +
            niceDate(r.publishedAt) +
            (r.category ? ' <span class="tag">' + esc(r.category) + "</span>" : "") +
            "</div>" +
            "<h3>" +
            esc(r.title) +
            "</h3>" +
            "<p>" +
            esc(r.summary) +
            "</p>" +
            "</article>",
        )
        .join("");
    } catch {
      wrap.innerHTML = "<p>Unable to load company news.</p>";
    }
  }

  // simulated checkout: Buy buttons on product/service cards (delegated, cards render async)
  document.addEventListener("click", async function (ev) {
    const btn = ev.target.closest(".buy-btn");
    if (!btn) return;

    const itemType = btn.getAttribute("data-item-type");
    const itemId = btn.getAttribute("data-item-id");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Placing order…";

    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        window.location.href = "login.html";
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        btn.textContent = "Order placed ✓";
      } else {
        btn.disabled = false;
        btn.textContent = (data.errors && data.errors[0]) || "Order failed";
        setTimeout(() => (btn.textContent = originalText), 2500);
      }
    } catch {
      btn.disabled = false;
      btn.textContent = "Order failed";
      setTimeout(() => (btn.textContent = originalText), 2500);
    }
  });

  /* ---------- run everything relevant for this page --------------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderCompany();
    renderTimeline();
    renderServices();
    renderProducts();
    renderAwards();
    renderTestimonials();
    renderTeam();
    renderComments();
    initOfficeMap();
    renderNews();
  });
})();
