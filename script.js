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
  // slots 11-18
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/a5324ba75_photo_2026-06-04_19-50-18.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/2836f7ed1_photo_2026-06-04_19-44-55.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/6892536e7_photo_2026-06-04_19-44-58.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/57c3165ec_photo_2026-06-04_19-45-01.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/4374437b4_photo_2026-06-04_19-45-42.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/f2152c165_photo_2026-06-04_19-45-48.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/ab11610ea_photo_2026-06-04_19-45-54.jpg',
  'https://media.base44.com/images/public/6a217f32754a4d8eb71025d6/33bbbe352_photo_2026-06-04_19-48-05.jpg'
];

// ============================================================
// LANGUAGE
// ============================================================
let currentLang = localStorage.getItem('ldd_lang') || 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ldd_lang', lang);
  document.body.setAttribute('data-lang', lang);
  document.documentElement.setAttribute('lang', lang);

  // Inline style direkt setzen — gewinnt immer über CSS-Klassen (ohne !important in CSS)
  const INLINE_TAGS = new Set(['SPAN', 'A', 'BUTTON', 'STRONG', 'EM', 'I', 'B', 'LABEL']);
  document.querySelectorAll('.lang-de, .lang-en').forEach(el => {
    const show = el.classList.contains('lang-' + lang);
    el.style.display = show ? (INLINE_TAGS.has(el.tagName) ? 'inline' : 'block') : 'none';
  });
  document.querySelectorAll('[data-de]').forEach(el => {
    if (!el.querySelector('[data-de]')) {
      el.textContent = lang === 'de' ? el.getAttribute('data-de') : el.getAttribute('data-en');
    }
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  // NOTE: loadReviews() is NOT called here — reviews call setLang() themselves after render

  // Update review count badge language
  const cntEl2 = document.getElementById('reviewsCountText');
  if (cntEl2 && cntEl2.textContent) {
    const num = parseInt(cntEl2.textContent);
    if (!isNaN(num)) {
      cntEl2.textContent = lang === 'de'
        ? num + ' Bewertung' + (num === 1 ? '' : 'en')
        : num + ' Review' + (num === 1 ? '' : 's');
    }
  }
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
  return window.innerWidth >= 1100 ? 2 : window.innerWidth >= 700 ? 1.15 : 1;
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
// REVIEWS — EmailJS + Vercel Functions + GitHub JSON
// ============================================================

// ---- EmailJS Configuration ----
// REPLACE the two placeholders below with your actual values from emailjs.com
// Dashboard → Account → API Keys → Public Key
// Dashboard → Email Templates → Template ID
const EMAILJS_PUBLIC_KEY  = 'JE0Hl_6lx3oeNHRmU';
const EMAILJS_SERVICE_ID  = 'service_t40ka4h';
const EMAILJS_TEMPLATE_ID = 'template_nofngog';

// ---- Init EmailJS once DOM is ready ----
function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.warn('[EmailJS] Library not loaded');
    return;
  }
  emailjs.init('JE0Hl_6lx3oeNHRmU');
  console.log('[EmailJS] Initialized ✓');
}

// ---- Utility ----
function starsHTML(n)  { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function escHtml(s)    { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function generateId()  { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ============================================================
// REVIEW FORM — Submit
// ============================================================
async function submitReview(e) {
  e.preventDefault();

  // Validate star selection
  if (selectedStars === 0) {
    alert(currentLang === 'de' ? 'Bitte wähle eine Bewertung (1–5 Sterne).' : 'Please select a rating (1–5 stars).');
    return;
  }

  const name  = document.getElementById('rName').value.trim();
  const text  = document.getElementById('rText').value.trim();
  const stars = selectedStars;

  if (!name || !text) {
    alert(currentLang === 'de' ? 'Bitte fülle alle Felder aus.' : 'Please fill in all fields.');
    return;
  }

  // Disable submit button while processing
  const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = currentLang === 'de' ? 'Wird gesendet…' : 'Sending…'; }

  // Generate unique review ID
  const reviewId   = generateId();
  const publishUrl = `${window.location.origin}/api/publish-review?id=${reviewId}`;

  try {
    // ---- Step 1: Save to pending-reviews.json via Vercel Function ----
    const saveRes = await fetch('/api/save-review', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: reviewId, name, stars, text }),
    });

    if (!saveRes.ok) {
      const errData = await saveRes.json().catch(() => ({}));
      throw new Error(errData.error || `save-review returned ${saveRes.status}`);
    }

    console.log('[submitReview] Review saved to pending ✓', reviewId);

    // ---- Step 2: Send email notification via EmailJS ----
    const starsLabel = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    let emailSent = false;

    if (typeof emailjs !== 'undefined') {
      try {
        const templateParams = {
          reviewer_name: name,
          stars:         starsLabel,
          stars_count:   String(stars),
          message:       text,
          publish_url:   publishUrl,
          date:          new Date().toLocaleDateString('de-DE'),
          email:         'l.m@hotmail.ch',
          to_email:      'l.m@hotmail.ch',
        };
        const response = await emailjs.send('service_t40ka4h', 'template_nofngog', templateParams, 'JE0Hl_6lx3oeNHRmU');
        emailSent = true;
        console.log('[EmailJS] E-Mail gesendet ✓', response.status);
      } catch (emailErr) {
        console.warn('[EmailJS] Fehler:', emailErr.text || emailErr.message || emailErr);
      }
    } else {
      console.warn('[submitReview] EmailJS nicht geladen');
    }

    // ---- Step 3: Show success message ----
    const sEl = document.getElementById('reviewSuccess');
    if (sEl) {
      sEl.style.display = '';
      setTimeout(() => { sEl.style.display = 'none'; }, 8000);
    }

    // Reset form
    document.getElementById('reviewForm').reset();
    setStars(0);

    if (!emailSent) {
      console.info('[submitReview] Review saved but email not sent — check EmailJS keys');
    }

  } catch (err) {
    console.error('[submitReview] Error:', err);
    const msg = currentLang === 'de'
      ? `Fehler beim Senden der Bewertung. Bitte versuche es erneut.\n(${err.message})`
      : `Error submitting review. Please try again.\n(${err.message})`;
    alert(msg);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = currentLang === 'de' ? 'Bewertung senden' : 'Submit review'; }
  }
}

// ============================================================
// REVIEW SLIDER — load from /api/get-reviews
// ============================================================
let rvSliderIndex = 0;
let rvTotalReviews = 0;

function getRvVisibleCount() {
  // Must match CSS: @media(min-width:900px) => calc(100%/3.3), else calc(100%/1.2)
  return window.innerWidth >= 900 ? 3.3 : 1.2;
}

function getRvSlideWidth() {
  const s = document.querySelector('#reviewsTrack .rv-slide');
  return s ? s.offsetWidth : 0;
}

function rvMaxIndex(total) {
  return Math.max(0, total - Math.floor(getRvVisibleCount()));
}

function goToRvSlide(idx, total) {
  rvSliderIndex = Math.max(0, Math.min(idx, rvMaxIndex(total)));
  const track = document.getElementById('reviewsTrack');
  if (track) {
    track.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
    track.style.transform  = `translateX(-${rvSliderIndex * getRvSlideWidth()}px)`;
  }
  updateRvDots(total);
}

function updateRvDots(total) {
  document.querySelectorAll('.rv-dot').forEach((d, i) =>
    d.classList.toggle('active', i === rvSliderIndex));
}

function buildRvDots(total) {
  const container = document.getElementById('reviewsDots');
  if (!container) return;
  container.innerHTML = '';
  const pages = rvMaxIndex(total) + 1;
  for (let i = 0; i < pages; i++) {
    const btn = document.createElement('button');
    btn.className   = 'slider-dot rv-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', `Review ${i + 1}`);
    btn.addEventListener('click', () => goToRvSlide(i, total));
    container.appendChild(btn);
  }
}

function initRvDrag(total) {
  const vpClean = document.querySelector('.rv-viewport');
  const trClean = document.getElementById('reviewsTrack');
  if (!vpClean || !trClean) return;

  let isDragging = false, dragStartX = 0, dragDelta = 0;

  const startDrag = x => { isDragging = true; dragStartX = x; dragDelta = 0; trClean.style.transition = 'none'; };
  const moveDrag  = x => { if (!isDragging) return; dragDelta = x - dragStartX; trClean.style.transform = `translateX(${-rvSliderIndex * getRvSlideWidth() + dragDelta}px)`; };
  const endDrag   = ()  => {
    if (!isDragging) return;
    isDragging = false;
    if      (dragDelta < -60) goToRvSlide(rvSliderIndex + 1, total);
    else if (dragDelta >  60) goToRvSlide(rvSliderIndex - 1, total);
    else                       goToRvSlide(rvSliderIndex,     total);
  };

  vpClean.addEventListener('mousedown',  e => startDrag(e.clientX));
  vpClean.addEventListener('mousemove',  e => { if (isDragging) moveDrag(e.clientX); });
  vpClean.addEventListener('mouseup',    endDrag);
  vpClean.addEventListener('mouseleave', endDrag);
  vpClean.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
  vpClean.addEventListener('touchmove',  e => moveDrag(e.touches[0].clientX),  { passive: true });
  vpClean.addEventListener('touchend',   endDrag);
}

function renderReviews(reviews) {
  const list  = document.getElementById('reviewsList');
  const noMsg = document.getElementById('noReviewsMsg');
  const badge = document.getElementById('reviewsCountBadge');
  if (!list) return;

  if (!reviews || reviews.length === 0) {
    list.innerHTML = '';
    if (noMsg) noMsg.style.display = '';
    if (badge) badge.style.display = 'none';
    return;
  }

  if (noMsg) noMsg.style.display = 'none';
  rvTotalReviews = reviews.length;

  // Update badge
  if (badge) {
    const avg = (reviews.reduce((s, r) => s + (r.stars || 0), 0) / reviews.length).toFixed(1);
    const avgEl = document.getElementById('reviewsAvgStars');
    const cntEl = document.getElementById('reviewsCountText');
    if (avgEl) avgEl.textContent = avg + ' / 5';
    if (cntEl) {
      const lang = currentLang || document.documentElement.lang || 'en';
      if (lang === 'de') {
        cntEl.textContent = reviews.length + ' Bewertung' + (reviews.length === 1 ? '' : 'en');
      } else {
        cntEl.textContent = reviews.length + ' Review' + (reviews.length === 1 ? '' : 's');
      }
    }
    badge.style.display = '';
  }

  // Newest first
  rvSliderIndex = 0;
  const sorted = [...reviews].reverse();

  const slidesHtml = sorted.map((r, idx) => {
    const MAX_CHARS = 320;
    const fullText  = escHtml(r.text);
    const isLong    = fullText.length > MAX_CHARS;
    const shortText = isLong ? fullText.slice(0, MAX_CHARS).trimEnd() + '…' : fullText;
    const uid       = 'rv-' + idx;
    return `
    <div class="rv-slide">
      <div class="review-card">
        <div class="review-header">
          <span class="review-stars">${starsHTML(r.stars)}</span>
          <span class="review-author">${escHtml(r.name)}</span>
          <span class="review-date">${r.date || ''}</span>
        </div>
        <p class="review-text" id="${uid}-text">
          <span class="rv-short">&ldquo;${shortText}&rdquo;</span>
          ${isLong ? `<span class="rv-full" style="display:none">&ldquo;${fullText}&rdquo;</span>` : ''}
        </p>
        ${isLong ? `<button class="rv-toggle" data-uid="${uid}" onclick="toggleReviewText('${uid}')">
          <span class="lang-de">Mehr anzeigen ▾</span><span class="lang-en">Read more ▾</span>
        </button>` : ''}
      </div>
    </div>`;
  }).join('');

  list.innerHTML = `
    <div class="reviews-slider-outer">
      <button class="slider-btn rv-prev" aria-label="Previous" onclick="goToRvSlide(rvSliderIndex-1,${sorted.length})">&#8249;</button>
      <div class="reviews-viewport rv-viewport">
        <div class="slider-track" id="reviewsTrack" style="display:flex">${slidesHtml}</div>
      </div>
      <button class="slider-btn rv-next" aria-label="Next" onclick="goToRvSlide(rvSliderIndex+1,${sorted.length})">&#8250;</button>
    </div>
    <div class="slider-dots" id="reviewsDots"></div>`;

  // Sprache auf neue Review-Elemente anwenden
  setLang(currentLang);

  // Init slider interactions after DOM is painted
  // Use double-rAF to ensure layout is complete before reading offsetWidth
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      buildRvDots(sorted.length);
      goToRvSlide(0, sorted.length); // reset position cleanly after layout
      initRvDrag(sorted.length);
      // Remove old resize listener before adding new one
      if (window._rvResizeHandler) window.removeEventListener('resize', window._rvResizeHandler);
      window._rvResizeHandler = () => {
        buildRvDots(sorted.length);
        goToRvSlide(Math.min(rvSliderIndex, rvMaxIndex(sorted.length)), sorted.length);
      };
      window.addEventListener('resize', window._rvResizeHandler);
    });
  });

  // Language is handled by CSS data-lang rules
}

async function loadReviews() {
  try {
    const res = await fetch('/api/get-reviews');
    if (res.ok) {
      const reviews = await res.json();
      renderReviews(reviews);
    } else {
      console.warn('[loadReviews] get-reviews returned', res.status);
      renderReviews([]);
    }
  } catch (e) {
    console.error('[loadReviews] Network error:', e.message);
    renderReviews([]);
  }
}

// ── Review text expand/collapse
function toggleReviewText(uid) {
  const shortEl = document.querySelector('#' + uid + '-text .rv-short');
  const fullEl  = document.querySelector('#' + uid + '-text .rv-full');
  const btn     = document.querySelector('[data-uid="' + uid + '"]');
  if (!shortEl || !fullEl || !btn) return;

  const isExpanded = fullEl.style.display !== 'none';
  shortEl.style.display = isExpanded ? '' : 'none';
  fullEl.style.display  = isExpanded ? 'none' : '';

  const deSpan = btn.querySelector('.lang-de');
  const enSpan = btn.querySelector('.lang-en');
  if (isExpanded) {
    if (deSpan) deSpan.textContent = 'Mehr anzeigen ▾';
    if (enSpan) enSpan.textContent = 'Read more ▾';
  } else {
    if (deSpan) deSpan.textContent = 'Weniger anzeigen ▴';
    if (enSpan) enSpan.textContent = 'Show less ▴';
  }
}

// ============================================================
// ============================================================

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
  if (!targets.length) return;

  // Fallback: mark as visible after 600ms regardless
  setTimeout(() => {
    targets.forEach(el => el.classList.add('visible'));
  }, 600);

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible')); return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
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
  initEmailJS();
  loadReviews(); // called once here; setLang() no longer calls it
});

