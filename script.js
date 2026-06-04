/* ============================================
   LINDA'S DOGGY DAYCARE – script.js v2
   • Language switch (EN default / DE optional)
   • Mobile burger menu
   • Gallery slider (drag + buttons + dots)
   • Star rating input
   • Review form → email via mailto + localStorage
   • Contact form → mailto
   • Scroll animations
   • Header shadow on scroll
============================================ */

'use strict';

// ============================================================
// LANGUAGE
// ============================================================

let currentLang = localStorage.getItem('ldd_lang') || 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ldd_lang', lang);
  document.body.setAttribute('data-lang', lang);
  document.documentElement.lang = lang;

  // Show/hide .lang-de / .lang-en blocks
  document.querySelectorAll('.lang-de, .lang-en').forEach(el => {
    el.style.display = el.classList.contains('lang-' + lang) ? '' : 'none';
  });

  // Fill [data-de] / [data-en] text content
  document.querySelectorAll('[data-de]').forEach(el => {
    // Only set textContent on elements that aren't containers of other elements
    if (!el.querySelector('[data-de]')) {
      el.textContent = lang === 'de'
        ? el.getAttribute('data-de')
        : el.getAttribute('data-en');
    }
  });

  // Activate lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Re-render reviews in correct language
  renderReviews();
}

// ============================================================
// BURGER MENU
// ============================================================

function toggleMenu() {
  const nav = document.getElementById('mobileNav');
  const btn = document.getElementById('burgerBtn');
  const isOpen = nav.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

function closeMenu() {
  document.getElementById('mobileNav')?.classList.remove('open');
  document.getElementById('burgerBtn')?.classList.remove('open');
}

document.addEventListener('click', e => {
  const header = document.getElementById('header');
  if (header && !header.contains(e.target)) closeMenu();
});

// ============================================================
// GALLERY SLIDER
// ============================================================

let sliderIndex = 0;
let isDragging  = false;
let dragStartX  = 0;
let dragDelta   = 0;
const TOTAL_SLIDES = 18;

function getVisibleCount() {
  return window.innerWidth >= 900 ? 4.5 : 1.5;
}

function getSlideWidth() {
  const track = document.getElementById('galleryTrack');
  if (!track) return 0;
  const slide = track.querySelector('.slide');
  return slide ? slide.offsetWidth : 0;
}

function maxIndex() {
  const visible = Math.floor(getVisibleCount());
  return Math.max(0, TOTAL_SLIDES - visible);
}

function goToSlide(idx) {
  sliderIndex = Math.max(0, Math.min(idx, maxIndex()));
  const track = document.getElementById('galleryTrack');
  if (track) {
    track.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
    track.style.transform = `translateX(-${sliderIndex * getSlideWidth()}px)`;
  }
  updateDots();
}

function slideGallery(dir) { goToSlide(sliderIndex + dir); }

function updateDots() {
  const dots = document.querySelectorAll('.slider-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === sliderIndex));
}

function buildDots() {
  const container = document.getElementById('sliderDots');
  if (!container) return;
  container.innerHTML = '';
  const pages = maxIndex() + 1;
  for (let i = 0; i < pages; i++) {
    const btn = document.createElement('button');
    btn.className = 'slider-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
    btn.addEventListener('click', () => goToSlide(i));
    container.appendChild(btn);
  }
}

function initSlider() {
  const viewport = document.getElementById('galleryViewport');
  const track    = document.getElementById('galleryTrack');
  if (!viewport || !track) return;

  buildDots();

  // Touch / mouse drag
  const startDrag = x => { isDragging = true; dragStartX = x; dragDelta = 0; track.style.transition = 'none'; };
  const moveDrag  = x => {
    if (!isDragging) return;
    dragDelta = x - dragStartX;
    track.style.transform = `translateX(${-sliderIndex * getSlideWidth() + dragDelta}px)`;
  };
  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    if (dragDelta < -60)       goToSlide(sliderIndex + 1);
    else if (dragDelta > 60)   goToSlide(sliderIndex - 1);
    else                       goToSlide(sliderIndex);
  };

  viewport.addEventListener('mousedown',  e => startDrag(e.clientX));
  viewport.addEventListener('mousemove',  e => moveDrag(e.clientX));
  viewport.addEventListener('mouseup',    endDrag);
  viewport.addEventListener('mouseleave', endDrag);

  viewport.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchmove',  e => moveDrag(e.touches[0].clientX),  { passive: true });
  viewport.addEventListener('touchend',   endDrag);

  // Recalculate on resize
  window.addEventListener('resize', () => {
    buildDots();
    goToSlide(Math.min(sliderIndex, maxIndex()));
  });
}

// ============================================================
// STAR RATING
// ============================================================

let selectedStars = 0;

function setStars(val) {
  selectedStars = val;
  document.getElementById('rStars').value = val;
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
}

// ============================================================
// REVIEWS  (stored in localStorage, approved flag)
// ============================================================

const REVIEWS_KEY = 'ldd_reviews';

function getReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || []; }
  catch { return []; }
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

function starsHTML(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function renderReviews() {
  const list    = document.getElementById('reviewsList');
  const noMsg   = document.getElementById('noReviewsMsg');
  if (!list) return;

  const reviews  = getReviews().filter(r => r.approved);
  list.innerHTML = '';

  if (!reviews.length) {
    noMsg && (noMsg.style.display = '');
    return;
  }
  noMsg && (noMsg.style.display = 'none');

  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-header">
        <span class="review-author">${escHtml(r.name)}</span>
        <span class="review-stars">${starsHTML(r.stars)}</span>
        <span class="review-date">${r.date || ''}</span>
      </div>
      <p class="review-text">${escHtml(r.text)}</p>
    `;
    list.appendChild(card);
  });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function submitReview(e) {
  e.preventDefault();
  if (selectedStars === 0) {
    alert(currentLang === 'de' ? 'Bitte wähle eine Bewertung.' : 'Please select a rating.');
    return;
  }
  const name  = document.getElementById('rName').value.trim();
  const text  = document.getElementById('rText').value.trim();
  const stars = selectedStars;
  const date  = new Date().toLocaleDateString(currentLang === 'de' ? 'de-DE' : 'en-GB');

  // Generate a simple unique ID
  const id = Date.now().toString(36);

  // Save as pending
  const reviews = getReviews();
  reviews.push({ id, name, stars, text, date, approved: false });
  saveReviews(reviews);

  // Build approval mailto
  const approvalLink = buildApprovalLink(id, name, stars, text, date);
  const subject = encodeURIComponent(`[Review] New review from ${name} – ${stars}★`);
  const body = encodeURIComponent(
    `New review on Linda's Doggy Daycare:\n\n`
    + `Name: ${name}\n`
    + `Rating: ${'★'.repeat(stars)}${'☆'.repeat(5-stars)} (${stars}/5)\n`
    + `Message:\n${text}\n\n`
    + `Date: ${date}\n\n`
    + `--- PUBLISH THIS REVIEW ---\n`
    + `Copy this approval link and open it in the browser to publish:\n`
    + approvalLink
  );

  window.location.href = `mailto:l.m@hotmail.ch?subject=${subject}&body=${body}`;

  // Show success
  const sEl = document.getElementById('reviewSuccess');
  if (sEl) {
    sEl.querySelectorAll('.lang-de,.lang-en').forEach(el => {
      el.style.display = el.classList.contains('lang-' + currentLang) ? '' : 'none';
    });
    sEl.style.display = '';
    setTimeout(() => sEl.style.display = 'none', 6000);
  }

  // Reset form
  document.getElementById('reviewForm').reset();
  setStars(0);
}

function buildApprovalLink(id, name, stars, text, date) {
  // Returns a URL with a hash that auto-approves the review on open
  const base = window.location.href.split('#')[0].split('?')[0];
  const params = new URLSearchParams({ approve: id, n: name, s: stars, t: text, d: date });
  return `${base}?${params.toString()}`;
}

function checkApprovalParam() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('approve');
  if (!id) return;

  const reviews = getReviews();
  const existing = reviews.find(r => r.id === id);

  if (existing) {
    existing.approved = true;
    saveReviews(reviews);
  } else {
    // Review might not exist in this browser — create it
    reviews.push({
      id,
      name:     params.get('n') || 'Guest',
      stars:    parseInt(params.get('s')) || 5,
      text:     params.get('t') || '',
      date:     params.get('d') || '',
      approved: true,
    });
    saveReviews(reviews);
  }

  // Clean URL
  history.replaceState({}, '', window.location.pathname);
  renderReviews();

  // Show a brief banner
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#fff;color:#2a3a3d;padding:1rem 2rem;border-radius:12px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2)';
  banner.textContent = '✅ Review published!';
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

// ============================================================
// CONTACT FORM
// ============================================================

function submitContact(e) {
  e.preventDefault();
  const name    = document.getElementById('cName').value.trim();
  const email   = document.getElementById('cEmail').value.trim();
  const message = document.getElementById('cMessage').value.trim();

  const subject = encodeURIComponent(`[Linda's Doggy Daycare] Message from ${name}`);
  const body    = encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
  );

  window.location.href = `mailto:l.m@hotmail.ch?subject=${subject}&body=${body}`;

  const sEl = document.getElementById('contactSuccess');
  if (sEl) {
    sEl.querySelectorAll('.lang-de,.lang-en').forEach(el => {
      el.style.display = el.classList.contains('lang-' + currentLang) ? '' : 'none';
    });
    sEl.style.display = '';
    setTimeout(() => sEl.style.display = 'none', 5000);
  }

  document.getElementById('contactForm').reset();
}

// ============================================================
// SMOOTH SCROLL
// ============================================================

document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  const headerH = document.getElementById('header')?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
});

// ============================================================
// HEADER SHADOW ON SCROLL
// ============================================================

window.addEventListener('scroll', () => {
  const h = document.getElementById('header');
  if (h) h.style.boxShadow = window.scrollY > 20
    ? '0 4px 24px rgba(0,0,0,0.22)'
    : '0 2px 12px rgba(0,0,0,0.12)';
}, { passive: true });

// ============================================================
// SCROLL ANIMATIONS
// ============================================================

function initScrollAnimations() {
  const targets = document.querySelectorAll('.anim-fade');
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  targets.forEach(el => observer.observe(el));
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);
  initSlider();
  initScrollAnimations();
  renderReviews();
  checkApprovalParam();
});
