/* ============================================================
   ABC FC Foundation — Main JS
   ============================================================ */

// ── Theme Toggle ──────────────────────────────────────────
(function () {
  const btn  = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let   theme = 'light';
  root.setAttribute('data-theme', theme);
  updateIcon();

  if (btn) btn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    updateIcon();
  });

  function updateIcon() {
    if (!btn) return;
    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    btn.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="5"/>
           <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
         </svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
         </svg>`;
  }
})();

// ── Sticky Header ─────────────────────────────────────────
(function () {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 48);
  }, { passive: true });
})();

// ── Hamburger / Mobile Nav ────────────────────────────────
(function () {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobile-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    nav.setAttribute('aria-hidden', !open);
    const spans = btn.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
})();

function closeMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('hamburger');
  if (!nav) return;
  nav.classList.remove('open');
  nav.setAttribute('aria-hidden', 'true');
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
}

// ── Active Nav on Scroll ──────────────────────────────────
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.main-nav a, .bottom-quicknav .bqn-item:not(.bqn-center)');

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => {
          l.removeAttribute('aria-current');
          if (l.getAttribute('href') === `#${e.target.id}`) l.setAttribute('aria-current', 'page');
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => io.observe(s));
})();

// ── Scroll Reveal ─────────────────────────────────────────
(function () {
  if (!('IntersectionObserver' in window)) return;

  const style = document.createElement('style');
  style.textContent = `
    .sr { opacity:0; transform:translateY(28px); transition:opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1); }
    .sr.visible { opacity:1; transform:none; }
    .sr-d1 { transition-delay:0.08s; }
    .sr-d2 { transition-delay:0.16s; }
    .sr-d3 { transition-delay:0.24s; }
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll(
    '.pillar-card, .prog-card, .ci-card, .ot-item, .news-card, .fixture-card, .contact-card'
  );

  targets.forEach((el, i) => {
    el.classList.add('sr');
    const d = i % 3;
    if (d === 1) el.classList.add('sr-d1');
    if (d === 2) el.classList.add('sr-d2');
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  targets.forEach(el => io.observe(el));
})();

// ── Contact Form ──────────────────────────────────────────
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = '✓ Message Sent!';
    btn.style.background = '#28a745';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
})();

// ── Facebook iframe fallback ──────────────────────────────
(function () {
  const wrap = document.querySelector('.fb-embed-wrap');
  if (!wrap) return;

  const iframe = wrap.querySelector('iframe');
  if (!iframe) return;

  setTimeout(() => {
    try {
      if (iframe.clientHeight < 50) {
        showFbFallback(wrap);
      }
    } catch (_) {
      showFbFallback(wrap);
    }
  }, 5000);

  function showFbFallback(container) {
    container.innerHTML = `
      <div style="width:100%;padding:40px 24px;text-align:center;background:var(--surface);border-radius:12px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#1877F2" style="margin:0 auto 16px;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        <p style="font-family:var(--font-sub);font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px;letter-spacing:0.04em;">Live Feed Requires Cookies</p>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;max-width:36ch;margin-left:auto;margin-right:auto;">Visit our official Facebook page to see all the latest posts, photos and match updates.</p>
        <a href="https://www.facebook.com/p/ABC-fc-61556965480952/" target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;gap:8px;background:#1877F2;color:white;font-family:var(--font-sub);font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Open Facebook Page →
        </a>
      </div>`;
  }
})();

// ── Show/Hide Full League Table ────────────────────────────
(function () {
  const btn   = document.getElementById('show-full-table');
  const extra = document.getElementById('table-extra');
  if (!btn || !extra) return;

  btn.addEventListener('click', () => {
    const isHidden = extra.hasAttribute('hidden');
    if (isHidden) {
      extra.removeAttribute('hidden');
      btn.textContent = 'Show fewer ↑';
    } else {
      extra.setAttribute('hidden', '');
      btn.textContent = 'Show all 23 teams ↓';
    }
  });
})();

// ── data-reveal scroll animation ──────────────────────────
(function () {
  if (!('IntersectionObserver' in window)) return;
  const els = document.querySelectorAll('[data-reveal]');
  const style = document.createElement('style');
  style.textContent = `
    [data-reveal] { opacity:0; transform:translateY(22px); transition:opacity 0.5s ease, transform 0.5s ease; }
    [data-reveal].revealed { opacity:1; transform:none; }
  `;
  document.head.appendChild(style);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });
  els.forEach(el => io.observe(el));
})();


/* ============================================================
   REAL-TIME DATA — Vercel Serverless API
   Fetches fixtures, results and league table live from Inqaku
   via /api/* serverless functions on every page load.
   Falls back gracefully to static HTML if fetch fails.
   ============================================================ */

// Determine the API base URL:
// - On Vercel production: same domain, e.g. /api/fixtures
// - In local dev (file://) or non-Vercel hosts: relative path still works if served
const API_BASE = '';

// ── Skeleton loader helper ─────────────────────────────────
function showSkeleton(container, rows = 3) {
  const skRow = `<div style="height:44px;background:linear-gradient(90deg,var(--surface) 25%,var(--gold-10,rgba(245,168,0,0.08)) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px;margin-bottom:8px;"></div>`;
  container.innerHTML = Array(rows).fill(skRow).join('');
  if (!document.getElementById('shimmer-kf')) {
    const s = document.createElement('style');
    s.id = 'shimmer-kf';
    s.textContent = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
    document.head.appendChild(s);
  }
}

// ── Timestamp badge ────────────────────────────────────────
function renderTimestamp(container, iso, source) {
  const ts = document.createElement('p');
  ts.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:10px;text-align:right;letter-spacing:0.03em;';
  const d = new Date(iso);
  const formatted = d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' });
  ts.textContent = source === 'inqaku'
    ? `Live · Updated ${formatted}`
    : `Cached data · ${formatted}`;
  container.appendChild(ts);
}

// ── FIXTURES ──────────────────────────────────────────────
(function loadFixtures() {
  const section = document.getElementById('fixtures');
  if (!section) return;

  // Find the fixtures grid — look for the existing fixture list container
  let grid = section.querySelector('.fixtures-list, .fixture-grid, [data-fixtures-container]');
  if (!grid) {
    // Create a container below the section heading
    grid = document.createElement('div');
    grid.setAttribute('data-fixtures-container', '');
    grid.style.cssText = 'margin-top:24px;';
    const heading = section.querySelector('h2, .section-label');
    if (heading && heading.parentNode) {
      heading.parentNode.insertBefore(grid, heading.nextSibling);
    } else {
      section.appendChild(grid);
    }
  }

  showSkeleton(grid, 5);

  fetch(`${API_BASE}/api/fixtures`)
    .then(r => r.json())
    .then(data => {
      if (!data.fixtures || data.fixtures.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);font-size:14px;padding:20px 0;">No upcoming fixtures found.</p>';
        return;
      }
      renderFixtures(grid, data.fixtures);
      renderTimestamp(grid, data.fetchedAt, data.source);
    })
    .catch(() => {
      // Leave static HTML in place if API unreachable
      grid.style.display = 'none';
    });
})();

function renderFixtures(container, fixtures) {
  container.innerHTML = fixtures.map(f => `
    <div class="fixture-card" style="display:flex;align-items:center;gap:16px;padding:16px 20px;background:var(--surface);border-radius:10px;margin-bottom:10px;border-left:4px solid ${f.isHome ? 'var(--gold,#F5A800)' : 'var(--text-muted,#888)'};">
      <div style="min-width:80px;">
        <div style="font-family:var(--font-sub,sans-serif);font-size:11px;font-weight:700;letter-spacing:0.06em;color:var(--text-muted);text-transform:uppercase;">${f.date}</div>
        <div style="font-size:10px;margin-top:2px;">
          <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-family:var(--font-sub,sans-serif);font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;background:${f.isHome ? 'var(--gold,#F5A800)' : '#333'};color:${f.isHome ? '#111' : '#fff'};">${f.type}</span>
        </div>
      </div>
      <div style="flex:1;">
        <div style="font-family:var(--font-sub,sans-serif);font-size:15px;font-weight:800;letter-spacing:0.02em;color:var(--text);">
          ${f.isHome ? '<strong>ABC FC</strong> vs ' : ''}${f.opponent}${!f.isHome ? ' <strong style="color:var(--gold,#F5A800);">vs ABC FC</strong>' : ''}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="display:inline-flex;align-items:center;gap:3px;">
            <svg width="13" height="14" viewBox="0 0 18 20" fill="none" style="color:var(--gold,#F5A800);flex-shrink:0;" aria-hidden="true"><path d="M9 1L1.5 4V10C1.5 14.4 4.8 18.4 9 19.6C13.2 18.4 16.5 14.4 16.5 10V4L9 1Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="9" cy="10.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="9" cy="10.5" r="0.9" fill="currentColor"/></svg>
            ${f.venue}
          </span>
          <span style="color:var(--text-faint,#555);">·</span>
          <span style="display:inline-flex;align-items:center;gap:3px;">
            <svg width="13" height="15" viewBox="0 0 20 22" fill="none" style="color:var(--gold,#F5A800);flex-shrink:0;" aria-hidden="true"><path d="M10 1L2 4.5V10.5C2 15.2 5.4 19.6 10 21C14.6 19.6 18 15.2 18 10.5V4.5L10 1Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="11" r="4.5" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="11" x2="10" y2="8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="10" y1="11" x2="12.5" y2="11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            ${f.time}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

// ── RESULTS ───────────────────────────────────────────────
(function loadResults() {
  const section = document.getElementById('results');
  if (!section) return;

  let grid = section.querySelector('.results-list, .result-grid, [data-results-container]');
  if (!grid) {
    grid = document.createElement('div');
    grid.setAttribute('data-results-container', '');
    grid.style.cssText = 'margin-top:24px;';
    const heading = section.querySelector('h2, .section-label');
    if (heading && heading.parentNode) {
      heading.parentNode.insertBefore(grid, heading.nextSibling);
    } else {
      section.appendChild(grid);
    }
  }

  showSkeleton(grid, 5);

  fetch(`${API_BASE}/api/results`)
    .then(r => r.json())
    .then(data => {
      if (!data.results || data.results.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);font-size:14px;padding:20px 0;">No recent results found.</p>';
        return;
      }
      renderResults(grid, data.results);
      renderTimestamp(grid, data.fetchedAt, data.source);
    })
    .catch(() => {
      grid.style.display = 'none';
    });
})();

function renderResults(container, results) {
  const outcomeColor = { W: '#28a745', D: '#F5A800', L: '#dc3545' };
  const outcomeLabel = { W: 'WIN', D: 'DRAW', L: 'LOSS' };
  container.innerHTML = results.map(r => `
    <div style="display:flex;align-items:center;gap:16px;padding:14px 20px;background:var(--surface);border-radius:10px;margin-bottom:8px;border-left:4px solid ${outcomeColor[r.outcome] || '#888'};">
      <div style="min-width:80px;">
        <div style="font-family:var(--font-sub,sans-serif);font-size:11px;font-weight:700;letter-spacing:0.06em;color:var(--text-muted);text-transform:uppercase;">${r.date}</div>
        <span style="display:inline-block;margin-top:3px;padding:2px 8px;border-radius:20px;font-family:var(--font-sub,sans-serif);font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;background:${outcomeColor[r.outcome] || '#888'};color:#fff;">${outcomeLabel[r.outcome] || r.outcome}</span>
      </div>
      <div style="flex:1;">
        <div style="font-family:var(--font-sub,sans-serif);font-size:15px;font-weight:800;letter-spacing:0.02em;color:var(--text);">
          ${r.isHome ? '<strong>ABC FC</strong>' : r.opponent} ${r.abcGoals !== '' ? `<span style="font-size:18px;color:var(--gold,#F5A800);font-weight:900;">${r.abcGoals} – ${r.oppGoals}</span>` : r.score} ${r.isHome ? r.opponent : '<strong style="color:var(--gold,#F5A800);">ABC FC</strong>'}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${r.type} · ${r.isHome ? 'Phalama Ground' : 'Away'}</div>
      </div>
    </div>
  `).join('');
}

// ── LEAGUE TABLE ──────────────────────────────────────────
(function loadTable() {
  const section = document.getElementById('table');
  if (!section) return;

  const existingTop    = document.getElementById('table-top');
  const existingExtra  = document.getElementById('table-extra');
  const showBtn        = document.getElementById('show-full-table');

  // We'll replace the tbody content of an existing table, or build a fresh one
  let tableEl = section.querySelector('table');
  let tbody    = tableEl ? tableEl.querySelector('tbody') : null;

  // If no table found, create wrapper
  let wrapper = section.querySelector('[data-table-container]');
  if (!tableEl) {
    wrapper = document.createElement('div');
    wrapper.setAttribute('data-table-container', '');
    wrapper.style.cssText = 'margin-top:24px;overflow-x:auto;';
    const heading = section.querySelector('h2, .section-label');
    if (heading && heading.parentNode) {
      heading.parentNode.insertBefore(wrapper, heading.nextSibling);
    } else {
      section.appendChild(wrapper);
    }
    showSkeleton(wrapper, 6);
  } else if (tbody) {
    showSkeleton(tbody, 6);
  }

  fetch(`${API_BASE}/api/table`)
    .then(r => r.json())
    .then(data => {
      if (!data.table || data.table.length === 0) return; // keep static HTML

      if (tableEl && tbody) {
        // Update existing table rows in place
        renderTableRows(tbody, data.table, existingTop, existingExtra, showBtn);
      } else if (wrapper) {
        renderFullTable(wrapper, data.table);
      }

      // Update the timestamp indicator in the section
      let ts = section.querySelector('[data-table-ts]');
      if (!ts) {
        ts = document.createElement('p');
        ts.setAttribute('data-table-ts', '');
        ts.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:10px;text-align:right;letter-spacing:0.03em;';
        section.appendChild(ts);
      }
      const d = new Date(data.fetchedAt);
      const formatted = d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' });
      ts.textContent = data.source === 'inqaku'
        ? `Live · Updated ${formatted}`
        : `Cached data · ${formatted}`;
    })
    .catch(() => {
      // Keep static HTML table intact
    });
})();

function renderTableRows(tbody, teams, topEl, extraEl, showBtn) {
  const top   = teams.slice(0, 10);
  const extra = teams.slice(10);

  function rowHTML(t) {
    const isABC = t.team.toLowerCase().includes('abc');
    return `<tr style="${isABC ? 'background:rgba(245,168,0,0.12);font-weight:800;' : ''}">
      <td style="padding:10px 12px;text-align:center;font-variant-numeric:tabular-nums;">${t.pos}</td>
      <td style="padding:10px 12px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;">${isABC ? `<strong style="color:var(--gold,#F5A800);">${t.team}</strong>` : t.team}</td>
      <td style="padding:10px 8px;text-align:center;font-variant-numeric:tabular-nums;">${t.played}</td>
      <td style="padding:10px 8px;text-align:center;font-variant-numeric:tabular-nums;">${t.won}</td>
      <td style="padding:10px 8px;text-align:center;font-variant-numeric:tabular-nums;">${t.lost}</td>
      <td style="padding:10px 12px;text-align:center;font-variant-numeric:tabular-nums;font-weight:800;color:var(--gold,#F5A800);">${t.pts}</td>
    </tr>`;
  }

  if (topEl) topEl.innerHTML = top.map(rowHTML).join('');
  if (extraEl) extraEl.innerHTML = extra.map(rowHTML).join('');
}

function renderFullTable(container, teams) {
  const isABC = t => t.team.toLowerCase().includes('abc');
  const rowHTML = t => `<tr style="${isABC(t) ? 'background:rgba(245,168,0,0.12);font-weight:800;' : ''}">
    <td style="padding:10px 12px;text-align:center;">${t.pos}</td>
    <td style="padding:10px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">${isABC(t) ? `<strong style="color:var(--gold,#F5A800);">${t.team}</strong>` : t.team}</td>
    <td style="padding:10px 8px;text-align:center;">${t.played}</td>
    <td style="padding:10px 8px;text-align:center;">${t.won}</td>
    <td style="padding:10px 8px;text-align:center;">${t.lost}</td>
    <td style="padding:10px 12px;text-align:center;font-weight:800;color:var(--gold,#F5A800);">${t.pts}</td>
  </tr>`;

  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:var(--gold,#F5A800);color:#111;">
          <th style="padding:10px 12px;text-align:center;">#</th>
          <th style="padding:10px 12px;text-align:left;">Team</th>
          <th style="padding:10px 8px;text-align:center;">P</th>
          <th style="padding:10px 8px;text-align:center;">W</th>
          <th style="padding:10px 8px;text-align:center;">L</th>
          <th style="padding:10px 12px;text-align:center;">Pts</th>
        </tr>
      </thead>
      <tbody>${teams.map(rowHTML).join('')}</tbody>
    </table>
  `;
}

// Dynamic copyright year
const fy = document.getElementById('footer-year'); if (fy) fy.textContent = new Date().getFullYear();
