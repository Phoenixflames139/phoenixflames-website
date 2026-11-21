/* Phoenixflames | Paper burns into ash v4
   Unlike a moving overlay, the EXISTING page develops a real transparent hole.
   A small ignition grows into a scorched, irregular burn ring with sparks.
   No third-party libraries; supports iPhone Safari, keyboard clicks and DE/EN. */
(() => {
  'use strict';

  const KEY = 'phoenixflames-paper-burn-v4';
  const ROOT = document.documentElement;
  const BURN_MS = 1550;
  const REVEAL_MS = 580;
  const reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const maskSupported = window.CSS && typeof CSS.supports === 'function' &&
    (CSS.supports('mask-image', 'radial-gradient(circle, transparent 20px, black 30px)') ||
     CSS.supports('-webkit-mask-image', 'radial-gradient(circle, transparent 20px, black 30px)'));
  const enabled = !reduced && !saveData && !!maskSupported &&
    typeof window.requestAnimationFrame === 'function';

  function readArrival() {
    try {
      const raw = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
      if (!raw) return null;
      const state = JSON.parse(raw);
      return state && state.path === location.pathname &&
        Number.isFinite(state.at) && Date.now() - state.at < 15000 ? state : null;
    } catch (_) { return null; }
  }

  function themeFor(pathname) {
    const file = pathname.split('/').filter(Boolean).pop() || 'index.html';
    if (file === 'shows.html') return 'shows';
    if (file === 'workshops.html') return 'workshops';
    if (file === 'tools.html') return 'tools';
    if (file === 'gallery.html') return 'gallery';
    if (file === 'booking.html') return 'booking';
    if (file === 'thanks.html') return 'thanks';
    if (file === 'impressum.html' || file === 'datenschutz.html') return 'legal';
    return 'home';
  }

  const arrival = readArrival();
  if (arrival && enabled) ROOT.classList.add('pf-arriving');

  function createLayer(theme, state) {
    const layer = document.createElement('div');
    layer.className = 'pf-transition pf-theme-' + theme + ' pf-' + state;
    layer.setAttribute('aria-hidden', 'true');

    const veil = document.createElement('div');
    veil.className = 'pf-ash-veil';
    layer.appendChild(veil);

    const canvas = document.createElement('canvas');
    canvas.className = 'pf-burn-canvas';
    layer.appendChild(canvas);
    document.body.appendChild(layer);
    return { layer, veil, canvas };
  }

  let frameId = 0;
  let restoreMasks = [];

  function clearMasks() {
    for (const item of restoreMasks) {
      item.node.style.maskImage = item.mask;
      item.node.style.webkitMaskImage = item.webkitMask;
    }
    restoreMasks = [];
  }

  function cleanup() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    clearMasks();
    document.querySelectorAll('.pf-transition').forEach((node) => node.remove());
    ROOT.classList.remove('pf-arriving', 'pf-ready', 'pf-leaving');
  }

  function maskSections() {
    const sections = Array.from(document.body.children).filter((node) => {
      if (!(node instanceof HTMLElement) ||
          node.matches('script, style, .pf-transition')) return false;
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0 &&
        box.bottom > -60 && box.top < innerHeight + 60;
    });
    return sections.map((node) => {
      const box = node.getBoundingClientRect();
      restoreMasks.push({
        node,
        mask: node.style.maskImage,
        webkitMask: node.style.webkitMaskImage
      });
      return { node, box };
    });
  }

  function setHole(sections, cx, cy, radius) {
    const inner = Math.max(0, radius - 18);
    const middle = Math.max(1, radius - 5);
    const outer = Math.max(middle + 2, radius + 14);

    for (const { node, box } of sections) {
      // CSS masks hide pixels within the burned hole. The untouched page is
      // still the real page, not a screenshot or an opaque color overlay.
      const x = Math.round(cx - box.left);
      const y = Math.round(cy - box.top);
      const mask = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, ' +
        'transparent 0px, transparent ' + inner + 'px, ' +
        'rgba(0,0,0,.22) ' + middle + 'px, ' +
        '#000 ' + outer + 'px)';
      node.style.maskImage = mask;
      node.style.webkitMaskImage = mask;
    }
  }

  function setupCanvas(canvas) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function edgeRadius(base, angle, seconds) {
    const noise = Math.min(22, 3 + base * .047);
    return base +
      Math.sin(angle * 7 + .7 + seconds * 1.8) * noise * .45 +
      Math.sin(angle * 17 - .6 - seconds * 2.4) * noise * .31 +
      Math.sin(angle * 31 + .4 + seconds * 2) * noise * .18;
  }

  function drawBurn(canvasState, cx, cy, r, elapsed) {
    const { ctx, w, h } = canvasState;
    ctx.clearRect(0, 0, w, h);
    const seconds = elapsed / 1000;

    // A small flame at the ignition point makes the beginning legible.
    if (elapsed < 430) {
      const strength = Math.min(1, elapsed / 140) * Math.min(1, (530 - elapsed) / 140);
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 95);
      glow.addColorStop(0, 'rgba(255,220,128,' + (.40 * strength) + ')');
      glow.addColorStop(.28, 'rgba(255,101,13,' + (.23 * strength) + ')');
      glow.addColorStop(1, 'rgba(255,70,12,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, 95, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = strength * .92;
      ctx.fillStyle = '#ff9a30';
      ctx.shadowColor = '#ff5a12';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(-12, 10);
      ctx.quadraticCurveTo(-22, -8, -4, -32 - Math.sin(seconds * 19) * 8);
      ctx.quadraticCurveTo(5, -17, 13, -3);
      ctx.quadraticCurveTo(20, 10, -12, 10);
      ctx.fill();
      ctx.fillStyle = '#fff1a0';
      ctx.beginPath();
      ctx.moveTo(-5, 9);
      ctx.quadraticCurveTo(-8, -6, 0, -16);
      ctx.quadraticCurveTo(10, 2, 5, 9);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    if (r < 9) return;

    const path = new Path2D();
    const steps = 104;
    for (let i = 0; i <= steps; i += 1) {
      const a = (i / steps) * Math.PI * 2;
      const d = edgeRadius(r, a, seconds);
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
    path.closePath();

    // Dark paper, reddish char, glowing ember, bright hot fracture.
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(14,8,7,.96)';
    ctx.lineWidth = 49;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(71,35,22,.95)';
    ctx.lineWidth = 32;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(197,58,16,.89)';
    ctx.lineWidth = 17;
    ctx.shadowColor = '#ed4e10';
    ctx.shadowBlur = 15;
    ctx.stroke(path);
    ctx.shadowBlur = 9;
    ctx.strokeStyle = 'rgba(255,160,49,.94)';
    ctx.lineWidth = 7;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(255,235,141,.96)';
    ctx.lineWidth = 2.4;
    ctx.stroke(path);
    ctx.restore();

    // Embers and individual flecks of burned paper drift away from the edge.
    // Deterministic positions keep the effect consistent frame to frame.
    for (let i = 0; i < 56; i += 1) {
      const a = ((i * 137.508) % 360) * Math.PI / 180;
      const edge = edgeRadius(r, a, seconds);
      const flicker = (seconds * (.7 + (i % 5) * .12) + (i * .173)) % 1;
      const distance = 12 + flicker * (36 + (i % 7) * 8);
      const px = cx + Math.cos(a) * (edge + distance) + Math.sin(i * 13.1) * 6;
      const py = cy + Math.sin(a) * (edge + distance) - flicker * 61;
      if (px < -12 || px > w + 12 || py < -12 || py > h + 12) continue;
      ctx.globalAlpha = (1 - flicker) * (.3 + (i % 4) * .15);
      ctx.fillStyle = i % 4 === 0 ? '#8f7563' : (i % 3 ? '#ffb049' : '#ffe7a3');
      ctx.beginPath();
      ctx.arc(px, py, .9 + (i % 3) * .55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function ignite(destination, url) {
    const { layer, canvas } = createLayer(themeFor(destination), 'burning');
    const drawing = setupCanvas(canvas);
    if (!drawing) { location.assign(url); return; }
    const sections = maskSections();
    const cx = Math.round(drawing.w * .23);
    const cy = Math.round(drawing.h * .88);
    const maxRadius = Math.max(
      Math.hypot(cx, cy), Math.hypot(drawing.w - cx, cy),
      Math.hypot(cx, drawing.h - cy),
      Math.hypot(drawing.w - cx, drawing.h - cy)
    ) + 100;

    ROOT.classList.add('pf-leaving');
    let start = 0;
    let navigated = false;
    const navigate = () => {
      if (navigated) return;
      navigated = true;
      setHole(sections, cx, cy, maxRadius + 50);
      location.assign(url);
    };

    function frame(timestamp) {
      if (!start) start = timestamp;
      const elapsed = Math.min(BURN_MS, timestamp - start);
      const p = elapsed / BURN_MS;

      // The flame catches first; only then does it consume the paper.
      let radius;
      if (p <= .20) {
        const q = p / .20;
        radius = 2 + q * q * 35;
      } else {
        const q = (p - .20) / .80;
        const smooth = q * q * (3 - 2 * q);
        radius = 37 + (maxRadius - 37) * smooth;
      }

      setHole(sections, cx, cy, radius);
      drawBurn(drawing, cx, cy, radius, elapsed);

      if (p >= 1) navigate();
      else frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);
    // Hidden tabs may throttle requestAnimationFrame: never strand navigation.
    setTimeout(navigate, BURN_MS + 200);
    return layer;
  }

  function initialize() {
    if (arrival && enabled) {
      const { veil } = createLayer(themeFor(location.pathname), 'entering');
      ROOT.classList.add('pf-ready');
      const done = () => cleanup();
      veil.addEventListener('animationend', (event) => {
        if (event.target === veil && event.animationName === 'pf-ash-reveal') done();
      });
      setTimeout(done, REVEAL_MS + 150);
    }

    let leaving = false;
    document.addEventListener('click', (event) => {
      if (!enabled || leaving || event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      const origin = event.target instanceof Element ? event.target : null;
      const anchor = origin && origin.closest('a[href]');
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
        return; // A normal link remains usable if storage is disabled.
      }

      event.preventDefault();
      leaving = true;
      try {
        ignite(url.pathname, url.href);
      } catch (_) {
        location.assign(url.href); // Never block a link on animation failure.
      }
    });

    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        leaving = false;
        cleanup();
        try { sessionStorage.removeItem(KEY); } catch (_) {}
      }
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
