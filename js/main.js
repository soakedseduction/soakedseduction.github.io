/* Soaked Seduction — shared site behavior */
(function () {
  'use strict';

  // Age-gate is enforced by an inline <head> script on every protected page,
  // which redirects unverified visitors to index.html before any body renders.
  // No duplicate check needed here.

  document.addEventListener('DOMContentLoaded', function () {
    // ---- Mobile nav toggle ----
    var nav = document.querySelector('[data-nav]');
    var toggle = document.querySelector('[data-nav-toggle]');
    if (nav && toggle) {
      toggle.addEventListener('click', function () {
        var open = nav.getAttribute('data-open') === 'true';
        nav.setAttribute('data-open', String(!open));
        toggle.setAttribute('aria-expanded', String(!open));
      });
      // Close on link click (mobile)
      nav.querySelectorAll('.nav__links a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.setAttribute('data-open', 'false');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // ---- Reveal on scroll ----
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }

    // ---- Application form (Apply page) ----
    // The form POSTs to a Google Forms endpoint inside a hidden iframe so the
    // page doesn't navigate. Submission flow:
    //   1. User clicks Submit.
    //   2. Browser validation runs (preventDefault on failure, no submit).
    //   3. If valid, form submits naturally to the iframe target.
    //   4. Iframe load event fires after Google responds → we show success.
    //
    // We can't read the iframe's response (cross-origin), so success is
    // implicit. Google reliably accepts well-formed POSTs to formResponse.
    var form = document.querySelector('[data-apply-form]');
    var iframe = document.getElementById('ss_apply_iframe');
    if (form && iframe) {
      var submittedAt = 0;
      form.addEventListener('submit', function (e) {
        if (!form.checkValidity()) {
          e.preventDefault();
          form.reportValidity();
          return;
        }
        submittedAt = Date.now();
        // Disable the submit button to prevent double-clicks
        var btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      });
      iframe.addEventListener('load', function () {
        // Skip the initial empty-iframe load (before any submission)
        if (!submittedAt) return;
        form.classList.add('is-submitted');
        var success = form.querySelector('.form__success');
        if (success) {
          success.setAttribute('role', 'status');
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Reset the form so it's ready for another submission (and re-enable button)
        form.reset();
        var btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = false; btn.textContent = 'Submit Application'; }
        submittedAt = 0;
      });
    }

    // ---- Testimonial carousel (prev/next + scroll-disable state) ----
    var tTrack = document.querySelector('[data-t-track]');
    if (tTrack) {
      var prevBtn = document.querySelector('[data-t-prev]');
      var nextBtn = document.querySelector('[data-t-next]');
      function pageWidth() {
        var firstCard = tTrack.querySelector('.quote-card');
        if (!firstCard) return tTrack.clientWidth;
        var gap = parseFloat(getComputedStyle(tTrack).columnGap || getComputedStyle(tTrack).gap || '0') || 0;
        return firstCard.getBoundingClientRect().width + gap;
      }
      function updateBtns() {
        if (!prevBtn || !nextBtn) return;
        var max = tTrack.scrollWidth - tTrack.clientWidth - 2;
        prevBtn.disabled = tTrack.scrollLeft <= 2;
        nextBtn.disabled = tTrack.scrollLeft >= max;
      }
      if (prevBtn) prevBtn.addEventListener('click', function () {
        tTrack.scrollBy({ left: -pageWidth(), behavior: 'smooth' });
      });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        tTrack.scrollBy({ left:  pageWidth(), behavior: 'smooth' });
      });
      tTrack.addEventListener('scroll', updateBtns, { passive: true });
      window.addEventListener('resize', updateBtns);
      // Keyboard support
      tTrack.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); tTrack.scrollBy({ left:  pageWidth(), behavior: 'smooth' }); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); tTrack.scrollBy({ left: -pageWidth(), behavior: 'smooth' }); }
      });
      updateBtns();
    }

    // ---- Lightweight gallery lightbox ----
    var gallery = document.querySelector('[data-gallery]');
    if (gallery) {
      var overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.innerHTML = '<button class="lightbox__close" aria-label="Close">&times;</button><img alt="" />';
      overlay.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(1,37,75,0.92);z-index:90;padding:2rem;cursor:zoom-out;backdrop-filter:blur(6px);';
      var imgEl = overlay.querySelector('img');
      imgEl.style.cssText = 'max-width:min(1200px,92vw);max-height:90vh;border-radius:8px;box-shadow:0 30px 80px -30px rgba(0,0,0,0.7);';
      var closeBtn = overlay.querySelector('.lightbox__close');
      closeBtn.style.cssText = 'position:absolute;top:1.5rem;right:1.5rem;width:44px;height:44px;border-radius:50%;background:rgba(245,245,246,0.12);color:#F5F5F6;font-size:1.6rem;display:grid;place-items:center;border:1px solid rgba(245,245,246,0.2);';
      document.body.appendChild(overlay);

      function close() {
        overlay.style.display = 'none';
        imgEl.src = '';
        document.body.style.overflow = '';
      }
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target === closeBtn) close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.style.display === 'flex') close();
      });

      gallery.querySelectorAll('img').forEach(function (img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function () {
          imgEl.src = img.src;
          imgEl.alt = img.alt || '';
          overlay.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        });
      });
    }
  });
})();
