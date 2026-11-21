/* Phoenixflames | Burning-page transitions v3
   A jagged clipping line actually removes the outgoing page while
   embers and flame trace the edge. DE/EN + bfcache safe. No libraries. */
(() => {
  'use strict';

  const KEY = 'phoenixflames-burn-navigation-v3';
  const ROOT = document.documentElement;
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const enabled = !prefersReducedMotion && !saveData &&
    typeof Element.prototype.animate === 'function';

  function readArrival() {
    try {
      const raw = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (!state || state.path !== location.pathname ||
          !Number.isFinite(state.at) || Date.now() - state.at > 15000) {
        return null;
      }
      return state;
    } catch (_) {
      return null;
    }
  }

  function themeFor(path) {
    const file = path.split('/').filter(Boolean).pop() || 'index.html';
    switch (file) {
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

  const arrival = enabled ? readArrival() : null;
  if (arrival) ROOT.classList.add('pf-arriving');

  function createBurnLayer(theme) {
    const layer = document.createElement('div');
    layer.className = 'pf-transition pf-theme-' + theme;
    layer.setAttribute('aria-hidden', 'true');

    const shroud = document.createElement('div');
    shroud.className = 'pf-burn-shroud';
    layer.appendChild(shroud);

    const front = document.createElement('div');
    front.className = 'pf-burn-front';

    // The leading edge has independent, asymmetric flame tongues.
    const heights = [72, 114, 84, 138, 92, 122, 76, 141, 88, 130, 100, 116, 75];
    for (let i = 0; i < heights.length; i += 1) {
      const flame = document.createElement('span');
      flame.className = 'pf-flame';
      flame.style.setProperty('--x', (i * 8.3 - 3) + '%');
      flame.style.setProperty('--h', heights[i] + 'px');
      flame.style.setProperty('--delay', (-i * .051) + 's');
      front.appendChild(flame);
    }

    const sparks = document.createElement('div');
    sparks.className = 'pf-ash-sparks';
    for (let i = 0; i < 26; i += 1) {
      const spark = document.createElement('i');
      spark.style.setProperty('--x', ((i * 41 + 7) % 100) + '%');
      spark.style.setProperty('--y', ((i * 13) % 31 - 4) + 'px');
      spark.style.setProperty('--s', (2 + i % 4) + 'px');
      spark.style.setProperty('--t', (.42 + (i % 5) * .08) + 's');
      spark.style.setProperty('--delay', (-(i * 7 % 13) / 20) + 's');
      spark.style.setProperty('--dx', (((i * 17) % 85) - 42) + 'px');
      sparks.appendChild(spark);
    }
    front.appendChild(sparks);
    layer.appendChild(front);

    document.body.appendChild(layer);
    return { layer, front };
  }

  let burnAnimations = [];
  function resetAnimations() {
    burnAnimations.forEach((animation) => {
      try { animation.cancel(); } catch (_) {}
    });
    burnAnimations = [];
  }

  function clearTransition() {
    resetAnimations();
    document.querySelectorAll('.pf-transition').forEach((el) => el.remove());
    ROOT.classList.remove('pf-arriving', 'pf-ready', 'pf-leaving');
  }

  // Coordinates are expressed in the element's local box. Applying the same
  // world-space edge to navbar, header, main and footer makes the actual
  // visible HTML vanish behind a broken, jagged burn line.
  const xStops = Array.from({ length: 26 }, (_, i) => i * 4);
  const ragged = [13,-7,18,-14,22,-11,6,-21,16,-5,20,-16,9,-10,
                  23,-8,11,-19,18,-6,10,-18,20,-9,13,-12];

  function burnPolygon(rect, frontY) {
    const points = ['0% 0px', '100% 0px'];
    for (let i = xStops.length - 1; i >= 0; i -= 1) {
      const y = Math.round(frontY + ragged[i] - rect.top);
      points.push(xStops[i] + '% ' + y + 'px');
    }
    return 'polygon(' + points.join(', ') + ')';
  }

  function ignitePage(front, navigate) {
    const height = window.innerHeight;
    const begin = height + 170;
    const end = -170;
    const options = {
      duration: 300,
      easing: 'cubic-bezier(.16,.73,.31,1)',
      fill: 'forwards'
    };

    // Only animate visible page sections; avoid altering scripts or the overlay.
    const sections = Array.from(document.body.children).filter((node) => {
      if (!node.matches || node.matches('script, style, .pf-transition')) return false;
      const box = node.getBoundingClientRect();
      return box.height > 0 && box.width > 0 &&
        box.bottom > -90 && box.top < height + 90;
    });

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const animation = section.animate([
        { clipPath: burnPolygon(rect, begin) },
        { clipPath: burnPolygon(rect, end) }
      ], options);
      burnAnimations.push(animation);
    }

    const fireAnimation = front.animate([
      { transform: 'translate3d(0, ' + begin + 'px, 0)' },
      { transform: 'translate3d(0, ' + end + 'px, 0)' }
    ], options);
    burnAnimations.push(fireAnimation);
    fireAnimation.addEventListener('finish', navigate, { once: true });
  }

  function initialize() {
    if (arrival) {
      const { layer } = createBurnLayer(themeFor(location.pathname));
      layer.classList.add('pf-entering');
      ROOT.classList.add('pf-ready');

      const finishArrival = () => clearTransition();
      const shroud = layer.querySelector('.pf-burn-shroud');
      shroud.addEventListener('animationend', (event) => {
        if (event.target === shroud && event.animationName === 'pf-ash-reveal') {
          finishArrival();
        }
      });
      setTimeout(finishArrival, 490);
    }

    let leaving = false;
    document.addEventListener('click', (event) => {
      if (!enabled || leaving || event.defaultPrevented ||
          event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey) return;

      const element = event.target instanceof Element ? event.target : null;
      const anchor = element && element.closest('a[href]');
      if (!anchor || anchor.hasAttribute('download') ||
          anchor.hasAttribute('data-no-transition') ||
          (anchor.target && anchor.target !== '_self')) return;

      let url;
      try { url = new URL(anchor.href, location.href); }
      catch (_) { return; }

      if (url.origin !== location.origin ||
          !['http:', 'https:'].includes(url.protocol) ||
          url.pathname === location.pathname) return;

      try {
        sessionStorage.setItem(KEY, JSON.stringify({
          path: url.pathname,
          at: Date.now()
        }));
      } catch (_) {
        return;
      }

      event.preventDefault();
      leaving = true;
      const { layer, front } = createBurnLayer(themeFor(url.pathname));
      layer.classList.add('pf-exiting');
      ROOT.classList.add('pf-leaving');

      let navigated = false;
      const navigate = () => {
        if (navigated) return;
        navigated = true;
        location.assign(url.href);
      };

      try {
        ignitePage(front, navigate);
      } catch (_) {
        navigate(); // Never block navigation for an animation error.
      }
      setTimeout(navigate, 430);
    });

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
