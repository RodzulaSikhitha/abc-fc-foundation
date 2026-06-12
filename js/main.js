/* ============================================================
   ABC FC Foundation — Main JavaScript
   ============================================================ */

// ── Dark / Light Theme Toggle ──────────────────────────────
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root   = document.documentElement;
  let theme    = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  root.setAttribute('data-theme', theme);
  updateToggleIcon();

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateToggleIcon();
    });
  }

  function updateToggleIcon() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    toggle.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="5"/>
           <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
         </svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
         </svg>`;
  }
})();

// ── Sticky Header Scroll Behavior ─────────────────────────
(function () {
  const header = document.getElementById('site-header');
  if (!header) return;

  let lastScrollY = 0;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });
})();

// ── Mobile Navigation ──────────────────────────────────────
(function () {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileNav.setAttribute('aria-hidden', !isOpen);

    // Animate hamburger → X
    const spans = hamburger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
})();

function closeMobileNav() {
  const mobileNav = document.getElementById('mobile-nav');
  const hamburger = document.getElementById('hamburger');
  if (!mobileNav) return;
  mobileNav.classList.remove('open');
  if (hamburger) {
    hamburger.setAttribute('aria-expanded', 'false');
    const spans = hamburger.querySelectorAll('span');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
}

// ── Scroll Reveal Animations ───────────────────────────────
(function () {
  if (!('IntersectionObserver' in window)) return;

  const style = document.createElement('style');
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal.visible {
      opacity: 1;
      transform: none;
    }
    .reveal-delay-1 { transition-delay: 0.1s; }
    .reveal-delay-2 { transition-delay: 0.2s; }
    .reveal-delay-3 { transition-delay: 0.3s; }
  `;
  document.head.appendChild(style);

  // Add reveal class to eligible elements
  const targets = document.querySelectorAll(
    '.pillar-card, .program-card, .club-info-card, .timeline-item, .value-item, .contact-item'
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    const delay = i % 3;
    if (delay > 0) el.classList.add(`reveal-delay-${delay}`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

// ── Contact Form ───────────────────────────────────────────
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Message Sent!';
    btn.style.background = '#28a745';
    btn.style.borderColor = '#28a745';
    btn.style.color = '#fff';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.disabled = false;
      form.reset();
    }, 3500);
  });
})();

// ── Active nav link on scroll ──────────────────────────────
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.removeAttribute('aria-current');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.setAttribute('aria-current', 'page');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();
