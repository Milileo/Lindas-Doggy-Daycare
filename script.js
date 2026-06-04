/* ============================================
   LINDA'S DOGGY DAYCARE – script.js
   • Language switch (DE / EN)
   • Mobile burger menu
   • Scroll animations
   • Contact form
============================================ */

// ---- Language ----

let currentLang = localStorage.getItem('ldd_lang') || 'de';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ldd_lang', lang);
  document.body.setAttribute('data-lang', lang);

  // Show/hide .lang-de and .lang-en elements
  document.querySelectorAll('.lang-de, .lang-en').forEach(el => {
    el.style.display = el.classList.contains('lang-' + lang) ? '' : 'none';
  });

  // Update [data-de] / [data-en] text content
  document.querySelectorAll('[data-de]').forEach(el => {
    el.textContent = lang === 'de' ? el.getAttribute('data-de') : el.getAttribute('data-en');
  });

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Update <html> lang attribute
  document.documentElement.lang = lang;
}

// ---- Burger Menu ----

function toggleMenu() {
  const nav = document.getElementById('mobileNav');
  const btn = document.getElementById('burgerBtn');
  const isOpen = nav.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-label', isOpen ? 'Menü schließen' : 'Menü öffnen');
}

function closeMenu() {
  const nav = document.getElementById('mobileNav');
  const btn = document.getElementById('burgerBtn');
  nav.classList.remove('open');
  btn.classList.remove('open');
}

// Close menu on outside click
document.addEventListener('click', function(e) {
  const header = document.getElementById('header');
  if (header && !header.contains(e.target)) {
    closeMenu();
  }
});

// ---- Scroll Animations ----

function initScrollAnimations() {
  const targets = document.querySelectorAll(
    '.service-card, .contact-item, .about-grid, .location-grid'
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger service cards
        const delay = entry.target.classList.contains('service-card') ? i * 80 : 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => observer.observe(el));
}

// ---- Contact Form ----

function submitForm(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  // Show success message (in correct language)
  const successDE = success.querySelector('.lang-de');
  const successEN = success.querySelector('.lang-en');
  if (successDE) successDE.style.display = currentLang === 'de' ? '' : 'none';
  if (successEN) successEN.style.display = currentLang === 'en' ? '' : 'none';

  success.style.display = 'block';

  // Reset form
  form.reset();

  // Hide success after 5 seconds
  setTimeout(() => {
    success.style.display = 'none';
  }, 5000);
}

// ---- Smooth Scroll for anchors ----

document.addEventListener('click', function(e) {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (target) {
    e.preventDefault();
    const headerH = document.getElementById('header')?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }
});

// ---- Header shadow on scroll ----

window.addEventListener('scroll', function() {
  const header = document.getElementById('header');
  if (!header) return;
  header.style.boxShadow = window.scrollY > 20
    ? '0 4px 24px rgba(0,0,0,0.22)'
    : '0 2px 12px rgba(0,0,0,0.12)';
}, { passive: true });

// ---- Init ----

document.addEventListener('DOMContentLoaded', function() {
  setLang(currentLang);
  initScrollAnimations();
});
