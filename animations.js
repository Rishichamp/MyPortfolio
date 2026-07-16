/* ============================================================
   ANIMATIONS.JS — original, reusable motion modules (v3 upgrade)
   Additive layer: never touches the existing "book page" reveal
   system in script.js (that stays as the site's signature motion).
   Each module is self-contained and no-ops safely if its target
   markup isn't present. All skip work under prefers-reduced-motion.
   ============================================================ */
(function(){
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Ambient mesh field (hero background) ---------- */
  function initMeshField(){
    const host = document.querySelector('.hero-visual');
    if(!host || REDUCED) return;
    if(host.querySelector('.mesh-field')) return;
    const mesh = document.createElement('div');
    mesh.className = 'mesh-field';
    mesh.setAttribute('aria-hidden', 'true');
    mesh.innerHTML = '<span></span><span></span><span></span>';
    host.prepend(mesh);
  }

  /* ---------- 2. Magnetic buttons ---------- */
  function initMagnetic(){
    if(REDUCED) return;
    const targets = document.querySelectorAll('.btn-primary, .resume-btn, [data-magnetic]');
    targets.forEach(el => {
      if(el.dataset.magneticBound) return;
      el.dataset.magneticBound = '1';
      el.setAttribute('data-magnetic', '');
      const strength = 14;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 3. Spring reveal (for net-new panels: owner login, resume builder) ---------- */
  let springObserver;
  function initSpringReveal(root = document){
    const els = root.querySelectorAll('.spring-reveal:not(.is-in)');
    if(!els.length) return;
    if(REDUCED){ els.forEach(el => el.classList.add('is-in')); return; }
    if(!springObserver){
      springObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('is-in');
            springObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
    }
    els.forEach(el => springObserver.observe(el));
  }

  /* ---------- 4. Tilt cards (project cards) ---------- */
  function initTilt(){
    if(REDUCED || matchMedia('(hover:none)').matches) return;
    const cards = document.querySelectorAll('.entry-card');
    cards.forEach(card => {
      if(card.dataset.tiltBound) return;
      card.dataset.tiltBound = '1';
      card.setAttribute('data-tilt', '');
      if(!card.querySelector('.tilt-glare')){
        const glare = document.createElement('span');
        glare.className = 'tilt-glare';
        card.appendChild(glare);
      }
      const maxDeg = 5;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * maxDeg * 2;
        const ry = (px - 0.5) * maxDeg * 2;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
        card.style.setProperty('--gx', `${px * 100}%`);
        card.style.setProperty('--gy', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- 5. Elastic counters (hero stats) ---------- */
  function easeOutElastic(t){
    const c4 = (2 * Math.PI) / 4.2;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -8 * t) * Math.sin((t * 8 - 0.7) * c4) + 1;
  }
  function animateCounter(el){
    const raw = el.textContent.trim();
    const match = raw.match(/^([\d.]+)(.*)$/);
    if(!match){ return; } // non-numeric label (e.g. "Top 5%") — leave untouched
    const end = parseFloat(match[1]);
    const suffix = match[2] || '';
    if(REDUCED){ return; }
    el.classList.add('counter-value');
    const duration = 1200;
    const start = performance.now();
    function tick(now){
      const t = Math.min(1, (now - start) / duration);
      const val = end * easeOutElastic(t);
      const decimals = match[1].includes('.') ? 1 : 0;
      el.textContent = val.toFixed(decimals) + suffix;
      if(t < 1) requestAnimationFrame(tick);
      else el.textContent = end.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }
  let statsObserver;
  function initCounters(){
    const nums = document.querySelectorAll('.stat .num');
    if(!nums.length) return;
    if(!statsObserver){
      statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            animateCounter(entry.target);
            statsObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
    }
    nums.forEach(n => statsObserver.observe(n));
  }

  /* ---------- 6. Liquid theme toggle (restyle existing control, same logic) ---------- */
  function initLiquidToggle(){
    const btn = document.getElementById('theme-toggle');
    if(!btn || btn.dataset.liquidBound) return;
    btn.dataset.liquidBound = '1';
    btn.classList.add('liquid-toggle');
    const sun = document.getElementById('icon-sun');
    const moon = document.getElementById('icon-moon');
    if(sun && moon && !btn.querySelector('.lt-thumb')){
      const thumb = document.createElement('span');
      thumb.className = 'lt-thumb';
      thumb.appendChild(sun);
      thumb.appendChild(moon);
      btn.innerHTML = '';
      btn.appendChild(thumb);
      const syncIcons = () => {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        sun.style.display = dark ? 'none' : 'block';
        moon.style.display = dark ? 'block' : 'none';
      };
      syncIcons();
      new MutationObserver(syncIcons).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
    }
  }

  function initAll(){
    initMeshField();
    initMagnetic();
    initSpringReveal();
    initTilt();
    initCounters();
    initLiquidToggle();
  }

  // Run once DOM is ready, and again after script.js re-renders
  // (it rebuilds cards/sections on data changes and section reorders).
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('portfolio:rerendered', initAll); // dispatched by script.js hook, see below

  // Fallback: also re-scan on a light debounce after any DOM mutation
  // inside <main>, in case the render hook isn't present in an older
  // script.js — cheap because each init() is idempotent (checks *Bound flags).
  const main = document.getElementById('top');
  if(main){
    let t;
    new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(initAll, 120);
    }).observe(main, { childList:true, subtree:true });
  }

  window.PortfolioAnimations = { initAll, initSpringReveal };
})();
