/* Phoenixflames | Fire transitions v1
   Graceful multi-page navigation (DE/EN). No external libraries.
   A small sessionStorage handoff keeps the curtain moving across full page loads.
*/
(() => {
  'use strict';

  const KEY = 'phoenixflames-fire-transition-v1';
  const ROOT = document.documentElement;
  const reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const enabled = !reducedMotion && !saveData;

  function readArrival() {
    let state;
    try {
      const raw = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
      if (!raw) return null;
      state = JSON.parse(raw);
    } catch (_) {
      return null;
    }
    if (!state || state.path !== location.pathname ||
        !Number.isFinite(state.at) || Date.now() - state.at > 15000) {
      return null;
    }
    return state;
  }

  function themeFor(pathname) {
    const filename = pathname.split('/').filter(Boolean).pop() || 'index.html';
    switch (filename) {
      case 'shows.html': return 'shows';
      case 'workshops.html': return 'workshops';
      case 'tools.html': return 'tools';
      case 'gallery.html': return 'gallery';
      case 'booking.html': return 'booking';
      case 'thanks.html': return 'thanks';
      case 'datenschutz.html':
      case 'impressum.html': return 'legal';
      default: return 'home';
    }
  }

  const arrival = readArrival();
  if (arrival && enabled) {
    // Mark the arriving document in <head>, before the first body paint.
    // CSS displays an opaque placeholder until the animated curtain is ready.
    ROOT.classList.add('pf-arriving');
  }

  function createCurtain(theme) {
    const layer = document.createElement('div');
    layer.className = 'pf-transition pf-theme-' + theme;
    layer.setAttribute('aria-hidden', 'true');

    const curtain = document.createElement('div');
    curtain.className = 'pf-curtain';

    const edge = document.createElement('div');
    edge.className = 'pf-edge';
    curtain.appendChild(edge);

    // Irregular flames across the leading edge of the fire curtain.
    const heights = [23, 31, 21, 35, 24, 30, 19, 34, 26, 32, 24];
    for (let i = 0; i < heights.length; i += 1) {
      const flame = document.createElement('span');
      flame.className = 'pf-tongue';
      flame.style.setProperty('--left', (i * 9.6 - 2) + '%');
      flame.style.setProperty('--height', heights[i] + 'svh');
      flame.style.setProperty('--angle', ((i % 2 ? -1 : 1) * (3 + i % 4)) + 'deg');
      flame.style.setProperty('--delay', -(i % 5) * .11 + 's');
      curtain.appendChild(flame);
    }
    layer.appendChild(curtain);

    const sparks = document.createElement('div');
    sparks.className = 'pf-sparks';
    for (let i = 0; i < 20; i += 1) {
      const spark = document.createElement('i');
      spark.style.setProperty('--x', ((i * 37 + 11) % 97) + '%');
      spark.style.setProperty('--bottom', ((i * 29) % 34) + '%');
      spark.style.setProperty('--s', (2 + i % 3) + 'px');
      spark.style.setProperty('--t', (1.2 + (i % 6) * .25) + 's');
      spark.style.setProperty('--delay', -((i * 7) % 18) / 10 + 's');
      spark.style.setProperty('--dx', (((i * 11) % 61) - 30) + 'px');
      sparks.appendChild(spark);
    }
    layer.appendChild(sparks);

    document.body.appendChild(layer);
    return layer;
  }

  function clearTransition() {
    document.querySelectorAll('.pf-transition').forEach((el) => el.remove());
    ROOT.classList.remove('pf-arriving', 'pf-ready', 'pf-leaving');
  }

  function initialize() {
    if (arrival && enabled) {
      const layer = createCurtain(themeFor(location.pathname));
      layer.classList.add('pf-entering');
      ROOT.classList.add('pf-ready');
      const finishArrival = () => clearTransition();
      const panel = layer.querySelector('.pf-curtain');
      panel.addEventListener('animationend', (event) => {
        if (event.animationName === 'pf-fire-reveal') finishArrival();
      }, { once: true });
      setTimeout(finishArrival, 850);
    }

    let leaving = false;
    document.addEventListener('click', (event) => {
      if (!enabled || leaving || event.defaultPrevented ||
          event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey) return;

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target && target.closest('a[href]');
      if (!anchor || anchor.hasAttribute('download') ||
          anchor.hasAttribute('data-no-transition') ||
          (anchor.target && anchor.target !== '_self')) return;

      let url;
      try { url = new URL(anchor.href, location.href); }
      catch (_) { return; }

      // Let external URLs, hash jumps and same-page actions work normally.
      if (url.origin !== location.origin ||
          !['http:', 'https:'].includes(url.protocol) ||
          url.pathname === location.pathname) return;

      try {
        sessionStorage.setItem(KEY, JSON.stringify({
          path: url.pathname,
          at: Date.now()
        }));
      } catch (_) {
        return; // Without storage, use ordinary navigation.
      }

      event.preventDefault();
      leaving = true;
      const layer = createCurtain(themeFor(url.pathname));
      layer.classList.add('pf-exiting');
      ROOT.classList.add('pf-leaving');

      let navigated = false;
      const navigate = () => {
        if (navigated) return;
        navigated = true;
        location.assign(url.href);
      };
      layer.querySelector('.pf-curtain').addEventListener('animationend', (e) => {
        if (e.animationName === 'pf-fire-cover') navigate();
      }, { once: true });
      setTimeout(navigate, 780);
    });

    // Restore a normal page when returning through the browser's back/forward cache.
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        leaving = false;
        clearTransition();
        try { sessionStorage.removeItem(KEY); } catch (_) {}
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
