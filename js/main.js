/* ============================================================
   ABC FC Foundation — Main JS
   ============================================================ */

// ── Theme Toggle ──────────────────────────────────────────
(function () {
  const btn  = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  const mq   = window.matchMedia('(prefers-color-scheme: dark)');
  let   theme = mq.matches ? 'dark' : 'light';
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
// If the Facebook embed is blocked (e.g., due to cookies), show a friendly fallback
(function () {
  const wrap = document.querySelector('.fb-embed-wrap');
  if (!wrap) return;

  const iframe = wrap.querySelector('iframe');
  if (!iframe) return;

  // Give it 5s to load, then check
  setTimeout(() => {
    try {
      // If iframe loaded with content it'll have clientHeight
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
