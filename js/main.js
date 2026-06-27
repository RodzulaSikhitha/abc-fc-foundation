/* ============================================================
   ABC FC Foundation — Main JS
   ============================================================ */

// ── Theme Toggle ──────────────────────────────────────────
(function () {
  const btn  = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  // Respect saved preference; default to dark if none saved
  let theme = localStorage.getItem('abcfc-theme') || 'dark';
  root.setAttribute('data-theme', theme);
  updateIcon();

  if (btn) btn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('abcfc-theme', theme);
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

// ── Contact Form (real submit → /api/contact) ─────────────
// Pages that load main.js and contain a #contact-form without their own
// dedicated handler (e.g. index.html) are wired up here. Pages that define
// their own submit handler (club.html, tournament4.html) opt out by NOT
// using the id "contact-form", or by setting data-custom-handler.
(function () {
  const form = document.getElementById('contact-form');
  if (!form || form.hasAttribute('data-custom-handler')) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn  = form.querySelector('button[type="submit"]');
    const orig = btn ? btn.textContent : '';
    let feedback = form.querySelector('[data-form-feedback]');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.setAttribute('data-form-feedback', '');
      feedback.style.cssText = 'margin-top:12px;font-size:14px;font-weight:600;';
      form.appendChild(feedback);
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    feedback.textContent = '';

    try {
      const fd = new FormData(form);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     fd.get('name'),
          phone:    fd.get('phone'),
          email:    fd.get('email'),
          interest: fd.get('interest'),
          message:  fd.get('message'),
          hp_field: fd.get('hp_field'), // honeypot — left blank by humans
        }),
      });

      if (res.ok) {
        feedback.textContent = 'Message sent! We will get back to you within 48 hours.';
        feedback.style.color = '#28a745';
        form.reset();
      } else {
        feedback.textContent = 'Something went wrong. Please email us at tshibalo.lucas@gmail.com';
        feedback.style.color = '#dc3545';
      }
    } catch {
      feedback.textContent = 'Connection error. Please email us at tshibalo.lucas@gmail.com';
      feedback.style.color = '#dc3545';
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = orig || 'Send Message'; }
    }
  });
})();

// ── Cookie Consent Banner ─────────────────────────────────
(function () {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  const STORAGE_KEY = 'abcfc-cookie-consent';
  const modal       = document.getElementById('cookie-modal');
  const accept      = document.getElementById('cookie-accept');
  const decline     = document.getElementById('cookie-decline');
  const learnMore   = document.getElementById('cookie-learn-more');
  const modalClose  = document.getElementById('cookie-modal-close');
  const modalAccept = document.getElementById('cookie-modal-accept');

  function showBanner()  { banner.style.display = 'block'; }
  function hideBanner()  { banner.style.display = 'none'; }
  function showModal()   { if (modal) modal.style.display = 'block'; }
  function hideModal()   { if (modal) modal.style.display = 'none'; }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
    hideModal();
    hideBanner();
  }

  // Only prompt if the visitor has not chosen yet
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
  if (!saved) showBanner();

  if (accept)      accept.addEventListener('click', () => setConsent('accepted'));
  if (modalAccept) modalAccept.addEventListener('click', () => setConsent('accepted'));
  if (decline)     decline.addEventListener('click', () => setConsent('declined'));
  if (learnMore)   learnMore.addEventListener('click', e => { e.preventDefault(); showModal(); });
  if (modalClose)  modalClose.addEventListener('click', hideModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) hideModal(); });
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
   Auto-refreshes every 5 minutes without a page reload.
   Falls back gracefully to static HTML if fetch fails.
   ============================================================ */

const API_BASE = '';
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

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
  let ts = container.querySelector('[data-ts]');
  if (!ts) {
    ts = document.createElement('p');
    ts.setAttribute('data-ts', '');
    ts.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:10px;text-align:right;letter-spacing:0.03em;';
    container.appendChild(ts);
  }
  const d = new Date(iso);
  const formatted = d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' });
  ts.textContent = source === 'inqaku'
    ? `Live · Updated ${formatted}`
    : `Cached data · ${formatted}`;
}

// ── Parse date string into { dayName, dd, mon } ───────────
function parseDateParts(dateStr) {
  const DAY_NAMES  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const MON_ABBRS  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const parts = (dateStr || '').trim().split(/[\s,]+/);
  let dayName = '', dd = '', mon = '';
  for (const p of parts) {
    const u = p.toUpperCase();
    if (DAY_NAMES.includes(u))                                        dayName = u;
    else if (/^\d{1,2}$/.test(p) && +p <= 31)                        dd = p;
    else if (MON_ABBRS.some(m => u.startsWith(m)))                   mon = u.substring(0, 3);
  }
  if (!dayName && dd && mon) {
    try {
      const yr = new Date().getFullYear();
      const dt = new Date(`${dd} ${mon} ${yr}`);
      if (!isNaN(dt.getTime())) dayName = DAY_NAMES[dt.getDay()];
    } catch (_) {}
  }
  return { dayName, dd, mon };
}

// ── SVG icons reused across renderers ─────────────────────
const SVG_CLOCK = `<svg class="icon-shield-clock" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 1L2 4.5V10.5C2 15.2 5.4 19.6 10 21C14.6 19.6 18 15.2 18 10.5V4.5L10 1Z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="11" r="4.5" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="11" x2="10" y2="8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="10" y1="11" x2="12.5" y2="11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
const SVG_PITCH = `<svg class="icon-shield-pitch" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 1L1.5 4V10C1.5 14.4 4.8 18.4 9 19.6C13.2 18.4 16.5 14.4 16.5 10V4L9 1Z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="9" cy="10.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="9" cy="10.5" r="0.9" fill="currentColor"/></svg>`;

// ── FIXTURES ──────────────────────────────────────────────
function fetchAndRenderFixtures() {
  const fixturesSection    = document.getElementById('fixtures');
  const allFixturesSection = document.getElementById('all-fixtures');
  if (!fixturesSection && !allFixturesSection) return;

  fetch(`${API_BASE}/api/fixtures`)
    .then(r => r.json())
    .then(data => {
      const fixtures = data.fixtures || [];
      if (!fixtures.length) return;

      // "Next Match" — rendered silently into any [data-next-match] or [data-next-match-only] container
      if (fixturesSection) {
        const nextEl = fixturesSection.querySelector('[data-next-match],[data-next-match-only]');
        if (nextEl) {
          renderNextMatch(nextEl, fixtures[0]);
        }
      }

      // Update ticker spans with live next match info
      const { dayName: tDay, dd: tDd, mon: tMon } = parseDateParts(fixtures[0].date);
      const tickerText = `NEXT: ABC FC vs ${fixtures[0].opponent} ${tDay} ${tDd} ${tMon} · ${fixtures[0].time} · ${fixtures[0].isHome ? 'HOME' : 'AWAY'} · ${fixtures[0].venue}`;
      document.querySelectorAll('[data-ticker-next]').forEach(el => { el.textContent = tickerText; });

      // "All Fixtures" — render remaining fixtures (skip first, already shown in Next Match)
      if (allFixturesSection) {
        const grid = allFixturesSection.querySelector('.fixtures-list, [data-fixtures-container]');
        if (grid) {
          const rest = fixtures.length > 1 ? fixtures.slice(1) : fixtures;
          renderFxRows(grid, rest);
          renderTimestamp(grid, data.fetchedAt, data.source);
        }
      }
    })
    .catch(() => {});
}

// Renders a list of fixtures in .fx-row style (used for "All Fixtures" sections)
function renderFxRows(container, fixtures) {
  container.innerHTML = fixtures.map(f => fxRowHTML(f)).join('');
}

// Renders a single fixture in .fx-row style (used for "Next Match" sections)
function renderNextMatch(container, f) {
  container.innerHTML = fxRowHTML(f);
}

const TEAM_CRESTS = {
  'smsa fc': 'images/smsa-fc-logo.jpeg',
  'smsa': 'images/smsa-fc-logo.jpeg',
  'saudi fc': 'images/saudi-fc-logo.png',
  'saudi': 'images/saudi-fc-logo.png',
  'thohoyandou manchester flying stars': 'images/manchester-flying-stars-logo.png',
  'manchester flying stars': 'images/manchester-flying-stars-logo.png',
  'tshamutilikwa b': 'images/tshamutilikwa-b-logo.png',
  'tshamutilikwa b fire boys': 'images/tshamutilikwa-b-logo.png',
  'makonde home defenders': 'images/makonde-home-defenders-logo.png',
  'tshitavha brave lions': 'images/tshitavha-brave-lions-logo.png',
  'tshitavha brave lions amabhubesi': 'images/tshitavha-brave-lions-logo.png',
  'ndiitwani shooting stars': 'images/ndiitwani-shooting-stars-logo.png',
  'ndiitwani': 'images/ndiitwani-shooting-stars-logo.png',
  'vhembe tron fc': 'images/vhembe-tron-fc-logo.png',
  'vhembe tron': 'images/vhembe-tron-fc-logo.png',
  'malale black cat fc': 'images/malale-black-cat-fc-logo.png',
  'malale black cat': 'images/malale-black-cat-fc-logo.png',
  'malale': 'images/malale-black-cat-fc-logo.png',
  'maelula united brothers': 'images/maelula-united-brothers-logo.png',
  'maelula united': 'images/maelula-united-brothers-logo.png',
  'mub': 'images/maelula-united-brothers-logo.png',
  'mahagala young stars': 'images/mahagala-young-stars-logo.png',
  'mahagala': 'images/mahagala-young-stars-logo.png',
  'musasenda big v': 'images/musasenda-big-v-logo.png',
  'musasenda': 'images/musasenda-big-v-logo.png',
  'magomani all zones fc': 'images/magomani-all-zones-logo.png',
  'magomani all zones': 'images/magomani-all-zones-logo.png',
  'magomani': 'images/magomani-all-zones-logo.png',
  'mashamba soccer academy': 'images/mashamba-soccer-academy-logo.png',
  'mashamba': 'images/mashamba-soccer-academy-logo.png',
  'mukula young santos fc': 'images/mukula-young-santos-logo.png',
  'mukula young santos': 'images/mukula-young-santos-logo.png',
  'mukula': 'images/mukula-young-santos-logo.png',
};

function getOpponentCrest(opponent) {
  const key = (opponent || '').toLowerCase().trim();
  const src = TEAM_CRESTS[key];
  if (src) return `<img src="${src}" alt="${opponent}" class="fx-crest" />`;
  return `<svg class="fx-crest fx-crest-generic" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="13" cy="13" r="13" fill="#1a1a1a"/><path d="M13 4 L20 7.5 V14 C20 18 17 21.5 13 23 C9 21.5 6 18 6 14 V7.5 Z" fill="none" stroke="#444" stroke-width="1.4" stroke-linejoin="round"/><circle cx="13" cy="14" r="3" fill="none" stroke="#555" stroke-width="1"/><circle cx="13" cy="14" r="0.9" fill="#555"/></svg>`;
}

function fxRowHTML(f) {
  const { dayName, dd, mon } = parseDateParts(f.date);
  const isHome = f.isHome;
  const opponentCrest = getOpponentCrest(f.opponent);
  return `
    <div class="fx-row ${isHome ? 'fx-home' : 'fx-away'}">
      <div class="fx-date-col">
        <span class="fx-day">${dayName}</span>
        <span class="fx-dd">${dd}</span>
        <span class="fx-mon">${mon}</span>
      </div>
      <div class="fx-badge-col">
        <span class="fx-type ${isHome ? 'home' : 'away'}">${isHome ? 'HOME' : 'AWAY'}</span>
      </div>
      <div class="fx-teams-col">
        <div class="fx-team">
          <img src="images/abc-fc-logo.jpeg" alt="ABC FC" class="fx-crest" />
          <span class="fx-tname">ABC FC</span>
        </div>
        <div class="fx-vs">VS</div>
        <div class="fx-team fx-team-right">
          ${opponentCrest}
          <span class="fx-tname">${f.opponent || 'TBC'}</span>
        </div>
      </div>
      <div class="fx-meta-col">
        <span class="fx-time"><span class="fx-ko">${SVG_CLOCK}</span> ${f.time || 'TBC'}</span>
        <span class="fx-venue"><span class="fx-ground-dot">${SVG_PITCH}</span> ${f.venue || 'TBC'}</span>
        <span class="fx-comp">${f.competition || 'Hollywoodbets Regional League'}</span>
      </div>
    </div>`;
}

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
function fetchAndRenderResults() {
  const section = document.getElementById('results');
  if (!section) return;

  let grid = section.querySelector('.results-list, .result-grid, [data-results-container]');
  if (!grid) {
    grid = document.createElement('div');
    grid.setAttribute('data-results-container', '');
    grid.style.cssText = 'margin-top:24px;';
    const heading = section.querySelector('h2, .section-label');
    if (heading && heading.parentNode) heading.parentNode.insertBefore(grid, heading.nextSibling);
    else section.appendChild(grid);
  }

  showSkeleton(grid, 5);

  fetch(`${API_BASE}/api/results`)
    .then(r => r.json())
    .then(data => {
      if (!data.results || !data.results.length) {
        grid.innerHTML = '<p style="color:var(--text-muted);font-size:14px;padding:20px 0;">No recent results found.</p>';
        return;
      }
      renderResults(grid, data.results);
      renderTimestamp(grid, data.fetchedAt, data.source);
    })
    .catch(() => { grid.style.display = 'none'; });
}

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
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${r.type} · ${r.isHome ? 'Makonde Stadium' : 'Away'}</div>
      </div>
    </div>
  `).join('');
}

// ── LEAGUE TABLE ──────────────────────────────────────────
function fetchAndRenderTable() {
  const section = document.getElementById('table');
  if (!section) return;

  const existingTop   = document.getElementById('table-top');
  const existingExtra = document.getElementById('table-extra');
  const showBtn       = document.getElementById('show-full-table');
  let tableEl = section.querySelector('table');
  let tbody   = tableEl ? tableEl.querySelector('tbody') : null;
  let wrapper = section.querySelector('[data-table-container]');

  if (!tableEl) {
    wrapper = document.createElement('div');
    wrapper.setAttribute('data-table-container', '');
    wrapper.style.cssText = 'margin-top:24px;overflow-x:auto;';
    const heading = section.querySelector('h2, .section-label');
    if (heading && heading.parentNode) heading.parentNode.insertBefore(wrapper, heading.nextSibling);
    else section.appendChild(wrapper);
    showSkeleton(wrapper, 6);
  } else if (tbody) {
    showSkeleton(tbody, 6);
  }

  fetch(`${API_BASE}/api/table`)
    .then(r => r.json())
    .then(data => {
      if (!data.table || !data.table.length) return;
      if (tableEl && tbody) {
        renderTableRows(tbody, data.table, existingTop, existingExtra, showBtn);
      } else if (wrapper) {
        renderFullTable(wrapper, data.table);
      }
      let ts = section.querySelector('[data-table-ts]');
      if (!ts) {
        ts = document.createElement('p');
        ts.setAttribute('data-table-ts', '');
        ts.style.cssText = 'font-size:11px;color:var(--text-muted);margin-top:10px;text-align:right;letter-spacing:0.03em;';
        section.appendChild(ts);
      }
      const d = new Date(data.fetchedAt);
      const formatted = d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' });
      ts.textContent = data.source === 'inqaku' ? `Live · Updated ${formatted}` : `Cached data · ${formatted}`;
    })
    .catch(() => {});
}

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
    </table>`;
}

// ── Initial load + 5-minute auto-refresh ──────────────────
fetchAndRenderFixtures();
fetchAndRenderResults();
fetchAndRenderTable();

setInterval(() => {
  fetchAndRenderFixtures();
  fetchAndRenderResults();
  fetchAndRenderTable();
}, REFRESH_MS);

// Dynamic copyright year
const fy = document.getElementById('footer-year'); if (fy) fy.textContent = new Date().getFullYear();
