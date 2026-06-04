/* ============================================
   LINDA'S DOGGY DAYCARE – script.js v3
   • Language switch (EN default)
   • Mobile burger menu
   • Gallery slider (drag + buttons + dots)
   • Lightbox with arrow navigation & keyboard
   • Star rating
   • Review form → mailto + localStorage approval
   • Contact form → mailto
   • Scroll animations
============================================ */

'use strict';

// ============================================================
// IMAGE SOURCES (update src here to swap gallery images)
// ============================================================
const GALLERY_IMAGES = [
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/46fefa1c1_photo_2026-06-04_19-44-32.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/3130980fd_photo_2026-06-04_19-43-37.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/97cd72a20_photo_2026-06-04_19-44-03.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/567213fce_photo_2026-06-04_19-44-08.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/1825ce20c_photo_2026-06-04_19-44-11.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/337a2b6ae_photo_2026-06-04_19-44-15.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/d84b024e3_photo_2026-06-04_19-44-17.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/8329d02be_photo_2026-06-04_19-44-20.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/05b4fc47a_photo_2026-06-04_19-44-23.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/54d90b507_photo_2026-06-04_19-44-27.jpg',
  // slots 11-18: add URLs here when you upload more images
  null, null, null, null, null, null, null, null
];

// ============================================================
// LANGUAGE
// ============================================================
let currentLang = localStorage.getItem('ldd_lang') || 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ldd_lang', lang);
  document.body.setAttribute('data-lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('.lang-de, .lang-en').forEach(el => {
    el.style.display = el.classList.contains('lang-' + lang) ? '' : 'none';
  });
  document.querySelectorAll('[data-de]').forEach(el => {
    if (!el.querySelector('[data-de]')) {
      el.textContent = lang === 'de' ? el.getAttribute('data-de') : el.getAttribute('data-en');
    }
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
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
}
function closeMenu() {
  document.getElementById('mobileNav')?.classList.remove('open');
  document.getElementById('burgerBtn')?.classList.remove('open');
}
document.addEventListener('click', e => {
  if (!document.getElementById('header')?.contains(e.target)) closeMenu();
});

// ============================================================
// GALLERY SLIDER
// ============================================================
let sliderIndex = 0;
let isDragging  = false;
let dragStartX  = 0;
let dragDelta   = 0;

const TOTAL_SLIDES = GALLERY_IMAGES.length; // 18

function getVisibleCount() {
  return window.innerWidth >= 900 ? 4.5 : 1.45;
}
function getSlideWidth() {
  const slide = document.querySelector('#galleryTrack .slide');
  return slide ? slide.offsetWidth : 0;
}
function maxIndex() {
  return Math.max(0, TOTAL_SLIDES - Math.floor(getVisibleCount()));
}
function goToSlide(idx) {
  sliderIndex = Math.max(0, Math.min(idx, maxIndex()));
  const track = document.getElementById('galleryTrack');
  if (track) {
    track.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
    track.style.transform  = `translateX(-${sliderIndex * getSlideWidth()}px)`;
  }
  updateDots();
}
function slideGallery(dir) { goToSlide(sliderIndex + dir); }

function updateDots() {
  document.querySelectorAll('.slider-dot').forEach((d, i) =>
    d.classList.toggle('active', i === sliderIndex));
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

  const startDrag = x => {
    isDragging = true; dragStartX = x; dragDelta = 0;
    track.style.transition = 'none';
  };
  const moveDrag = x => {
    if (!isDragging) return;
    dragDelta = x - dragStartX;
    track.style.transform = `translateX(${-sliderIndex * getSlideWidth() + dragDelta}px)`;
  };
  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    if      (dragDelta < -60) goToSlide(sliderIndex + 1);
    else if (dragDelta >  60) goToSlide(sliderIndex - 1);
    else                      goToSlide(sliderIndex);
  };

  viewport.addEventListener('mousedown',  e => startDrag(e.clientX));
  viewport.addEventListener('mousemove',  e => { if (isDragging) moveDrag(e.clientX); });
  viewport.addEventListener('mouseup',    endDrag);
  viewport.addEventListener('mouseleave', endDrag);
  viewport.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchmove',  e => moveDrag(e.touches[0].clientX),  { passive: true });
  viewport.addEventListener('touchend',   endDrag);

  // Hook prev/next buttons
  document.getElementById('sliderPrev')?.addEventListener('click', () => slideGallery(-1));
  document.getElementById('sliderNext')?.addEventListener('click', () => slideGallery(1));

  window.addEventListener('resize', () => {
    buildDots();
    goToSlide(Math.min(sliderIndex, maxIndex()));
  });
}

// ============================================================
// LIGHTBOX
// ============================================================
let lbIndex = 0;

function openLightbox(idx) {
  // Only open if that slide has a real image
  if (!GALLERY_IMAGES[idx]) return;
  lbIndex = idx;
  showLbImage(idx, false);
  document.getElementById('lightbox')?.classList.add('open');
  document.getElementById('lightboxOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.getElementById('lightboxOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function showLbImage(idx, fade = true) {
  const img     = document.getElementById('lbImg');
  const counter = document.getElementById('lbCounter');
  if (!img) return;

  // Count only real (non-null) images for counter display
  const realCount = GALLERY_IMAGES.filter(Boolean).length;
  // Index among real images
  const realPos   = GALLERY_IMAGES.slice(0, idx + 1).filter(Boolean).length;

  if (fade) {
    img.classList.add('fading');
    setTimeout(() => {
      img.src = GALLERY_IMAGES[idx] || '';
      img.classList.remove('fading');
    }, 180);
  } else {
    img.src = GALLERY_IMAGES[idx] || '';
  }
  if (counter) counter.textContent = `${realPos} / ${realCount}`;
}

function lbPrev() {
  // Find previous real image
  let i = lbIndex - 1;
  while (i >= 0 && !GALLERY_IMAGES[i]) i--;
  if (i >= 0) { lbIndex = i; showLbImage(i); }
}
function lbNext() {
  let i = lbIndex + 1;
  while (i < GALLERY_IMAGES.length && !GALLERY_IMAGES[i]) i++;
  if (i < GALLERY_IMAGES.length) { lbIndex = i; showLbImage(i); }
}

function initLightbox() {
  document.getElementById('lbClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lbPrev')?.addEventListener('click', lbPrev);
  document.getElementById('lbNext')?.addEventListener('click', lbNext);

  // Touch swipe in lightbox
  let lbTouchX = 0;
  const lbWrap = document.getElementById('lightbox');
  lbWrap?.addEventListener('touchstart', e => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lbWrap?.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - lbTouchX;
    if (dx < -50) lbNext();
    if (dx >  50) lbPrev();
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox')?.classList.contains('open')) return;
    if (e.key === 'ArrowRight') lbNext();
    if (e.key === 'ArrowLeft')  lbPrev();
    if (e.key === 'Escape')     closeLightbox();
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
// REVIEWS
// ============================================================
const REVIEWS_KEY = 'ldd_reviews';

function getReviews()     { try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || []; } catch { return []; } }
function saveReviews(r)   { localStorage.setItem(REVIEWS_KEY, JSON.stringify(r)); }
function starsHTML(n)     { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function escHtml(s)       { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderReviews() {
  const list  = document.getElementById('reviewsList');
  const noMsg = document.getElementById('noReviewsMsg');
  if (!list) return;
  const reviews = getReviews().filter(r => r.approved);
  list.innerHTML = '';
  if (!reviews.length) { noMsg && (noMsg.style.display = ''); return; }
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
      <p class="review-text">${escHtml(r.text)}</p>`;
    list.appendChild(card);
  });
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
  const id    = Date.now().toString(36);

  const reviews = getReviews();
  reviews.push({ id, name, stars, text, date, approved: false });
  saveReviews(reviews);

  const approvalLink = buildApprovalLink(id, name, stars, text, date);
  const subject = encodeURIComponent(`[Review] New review from ${name} – ${stars}★`);
  const body    = encodeURIComponent(
    `New review on Linda's Doggy Daycare:\n\nName: ${name}\nRating: ${'★'.repeat(stars)}${'☆'.repeat(5-stars)} (${stars}/5)\nMessage:\n${text}\n\nDate: ${date}\n\n--- PUBLISH THIS REVIEW ---\nOpen this link in your browser to publish:\n${approvalLink}`
  );
  window.location.href = `mailto:l.m@hotmail.ch?subject=${subject}&body=${body}`;

  const sEl = document.getElementById('reviewSuccess');
  if (sEl) { sEl.style.display = ''; setTimeout(() => sEl.style.display = 'none', 6000); }
  document.getElementById('reviewForm').reset();
  setStars(0);
}

function buildApprovalLink(id, name, stars, text, date) {
  const base   = window.location.href.split('#')[0].split('?')[0];
  const params = new URLSearchParams({ approve: id, n: name, s: stars, t: text, d: date });
  return `${base}?${params.toString()}`;
}

function checkApprovalParam() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('approve');
  if (!id) return;
  const reviews = getReviews();
  const existing = reviews.find(r => r.id === id);
  if (existing) {
    existing.approved = true;
  } else {
    reviews.push({ id, name: params.get('n') || 'Guest', stars: parseInt(params.get('s')) || 5, text: params.get('t') || '', date: params.get('d') || '', approved: true });
  }
  saveReviews(reviews);
  history.replaceState({}, '', window.location.pathname);
  renderReviews();
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
  const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
  window.location.href = `mailto:l.m@hotmail.ch?subject=${subject}&body=${body}`;
  const sEl = document.getElementById('contactSuccess');
  if (sEl) { sEl.style.display = ''; setTimeout(() => sEl.style.display = 'none', 5000); }
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
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerH - 8, behavior: 'smooth' });
});

// ============================================================
// HEADER SHADOW
// ============================================================
window.addEventListener('scroll', () => {
  const h = document.getElementById('header');
  if (h) h.style.boxShadow = window.scrollY > 20 ? '0 4px 24px rgba(0,0,0,0.22)' : '0 2px 12px rgba(0,0,0,0.12)';
}, { passive: true });

// ============================================================
// SCROLL ANIMATIONS
// ============================================================
function initScrollAnimations() {
  const targets = document.querySelectorAll('.anim-fade');
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible')); return;
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
  initLightbox();
  initScrollAnimations();
  renderReviews();
  checkApprovalParam();
});
