/* ============================================================
   MAIN.JS — v4 motion layer.
   script.js still renders all content and runs Edit mode; this file
   only adds motion on top of whatever it renders, and re-applies it
   whenever script.js re-renders (edits, server sync).
   Libraries (loaded as globals in index.html): gsap, ScrollTrigger,
   SplitText, Lenis. Three.js is loaded on demand by scene.js.
   ============================================================ */
import { makeWordImages, fontsReady, INKS } from './ink.js';

const gsap = window.gsap;
const ST = window.ScrollTrigger;
const SplitText = window.SplitText;
// ?motion in the URL forces full motion (handy for checking the animations on a machine set to reduce motion)
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !new URLSearchParams(location.search).has('motion');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const fit = (v, a, b) => clamp01((v - a) / (b - a));
const getData = () => { try{ return DATA; }catch(e){ return null; } };   // DATA lives in script.js
const isMobile = () => window.innerWidth < 768;

if(!gsap || !ST){
  // libraries failed to load: show the page as a plain, still document
  document.body.classList.remove('is-loading');
  document.body.classList.add('no-motion');
  throw new Error('GSAP not available — motion disabled');
}
gsap.registerPlugin(ST, SplitText);
ST.config({ ignoreMobileResize: true });
if(REDUCED) document.body.classList.add('no-motion');

/* ---------------------------------------------------------------
   1. LOADER — the UNet++ diagram lights up node by node
--------------------------------------------------------------- */
const loader = (() => {
  const pctEl = $('#loader-pct');
  const nodes = $$('#loader circle');
  const paths = $$('#loader path');
  paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${L}`; });
  const shown = { v: 0 };
  let done = false;
  function paint(){
    const v = shown.v;
    pctEl.textContent = Math.round(v) + '%';
    nodes.forEach((n, i) => n.classList.toggle('on', v >= (i + 1) / nodes.length * 100 - 1));
    paths.forEach((p, i) => { const L = parseFloat(p.style.strokeDasharray); p.style.strokeDashoffset = `${L * (1 - clamp01(v / 100 * 1.15 - i * .03))}`; });
  }
  function to(v){ gsap.to(shown, { v, duration: .6, ease: 'power2.out', onUpdate: paint }); }
  function finish(){
    if(done) return; done = true;
    gsap.to(shown, { v: 100, duration: .45, ease: 'power2.out', onUpdate: paint, onComplete: () => {
      document.body.classList.remove('is-loading');
      document.dispatchEvent(new Event('v4:ready'));
    }});
  }
  to(12);
  setTimeout(finish, 7000);   // never keep visitors waiting on a slow network
  return { to, finish };
})();

/* ---------------------------------------------------------------
   2. SMOOTH SCROLL — Lenis feeding ScrollTrigger
--------------------------------------------------------------- */
let lenis = null;
if(!REDUCED && window.Lenis){
  lenis = new window.Lenis({ lerp: .14, smoothWheel: true, wheelMultiplier: 1.15, touchMultiplier: 1.4 });   // quick to respond, still smooth
  lenis.on('scroll', ST.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const navH = () => $('#site-nav')?.offsetHeight || 64;
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if(!a) return;
  const id = a.getAttribute('href');
  if(id === '#') return;
  const target = id === '#top' ? 0 : document.getElementById(id.slice(1));
  if(target === null) return;
  e.preventDefault();
  if(lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -navH() + 2, duration: 1.1 });
  else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - navH(), behavior: REDUCED ? 'auto' : 'smooth' });
  history.replaceState(null, '', id);
});
// modals and owner panels scroll on their own
function preventLenisInPanels(){
  $$('.modal-backdrop, .owner-modal, .owner-modal-backdrop, .doc-overlay, [class*="overlay"]').forEach(el => el.setAttribute('data-lenis-prevent', ''));
}

const nav = $('#site-nav');
ST.create({ start: 40, end: 'max', onToggle: (self) => nav.classList.toggle('is-solid', self.isActive) });

/* ---------------------------------------------------------------
   3. LETTER ROLL — duplicated characters slide up on hover
--------------------------------------------------------------- */
function roll(el){
  if(!el || el.dataset.rolled) return;
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  if(!text || el.children.length && el.querySelector('svg') && !el.querySelector('span')) return;
  el.dataset.rolled = '1';
  const wrap = document.createElement('span');
  wrap.className = 'roll';
  wrap.setAttribute('aria-hidden', 'true');
  [...text].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'rc';
    s.style.setProperty('--i', i);
    s.dataset.c = c;
    s.textContent = c;
    wrap.appendChild(s);
  });
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  el.textContent = '';
  el.append(wrap, sr);
  (el.closest('a, button') || el).classList.add('roll-host');
}
function applyRolls(){
  $$('.nav-links a, .btn, .resume-btn, .vs-pill, .decode-btn').forEach(roll);
  $$('.contact-link > span, .oc-repos a > span').forEach(roll);
}
const srStyle = document.createElement('style');
srStyle.textContent = '.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}';
document.head.appendChild(srStyle);

/* ---------------------------------------------------------------
   4. HERO — the scribble dissolves, the name shrinks into the nav
--------------------------------------------------------------- */
let scene = null;
const frame = $('#card-frame');
const cfPct = $('#cf-pct');

function titleCase(s){ return String(s || '').toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()); }

async function initScene(){
  await fontsReady();
  loader.to(40);
  try{
    const { createHeroScene } = await import('./scene.js' + new URL(import.meta.url).search);   // same cache version as main.js
    loader.to(80);
    const d = getData();
    scene = createHeroScene($('#gl'), {
      word: titleCase(d?.hero?.name || 'Rishi Singh'),
      slot: $('#hero-slot'),
      onFrame: ({ x0, y0, x1, y1, restore, leave }) => {
        const pad = 14;
        frame.style.transform = `translate(${x0 - pad}px, ${y0 - pad}px)`;
        frame.style.width = `${x1 - x0 + pad * 2}px`;
        frame.style.height = `${y1 - y0 + pad * 2}px`;
        frame.classList.toggle('is-on', leave < .4 && !document.body.classList.contains('is-loading'));
        cfPct.textContent = Math.round(restore * 100) + '%';
      },
    });
  }catch(e){
    console.warn('3D card unavailable, showing the page without it.', e);
  }
  if(!scene){
    $('#gl').style.background = 'var(--ink)';
    frame.remove();
  }else if(REDUCED){
    scene.jumpTo(.72);   // restored, not lifting away
  }
  setTimeout(loader.finish, 60);   // first frame is drawn by then
}

function initHero(){
  const hero = $('#hero');
  const name = $('#hero-name');
  const brand = $('#nav-brand');
  if(REDUCED) return;

  // the scroll timeline of the pinned hero
  ST.create({
    trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => {
      scene?.setProgress(self.progress);
      scene?.setVisible(self.progress < .999);
      document.body.classList.toggle('brand-on', self.progress > .22);
    },
    onRefresh: (self) => { scene?.setProgress(self.progress); scene?.setVisible(self.progress < .999); },
  });

  // name → nav logo
  const shrink = () => {
    const nr = name.getBoundingClientRect();
    const br = brand.getBoundingClientRect();
    const cur = gsap.getProperty(name, 'scale') || 1;
    const baseW = nr.width / cur;
    const s = (parseFloat(getComputedStyle(brand).fontSize) / parseFloat(getComputedStyle(name).fontSize)) * 1.02;
    return { s, x: br.left - (nr.left - gsap.getProperty(name, 'x')), y: br.top - (nr.top - gsap.getProperty(name, 'y')) + 2, baseW };
  };
  let geo = shrink();
  ST.addEventListener('refreshInit', () => { gsap.set(name, { x: 0, y: 0, scale: 1 }); geo = shrink(); });
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: () => `+=${innerHeight * .55}`, scrub: .35, invalidateOnRefresh: true } })
    .to(name, { x: () => geo.x, y: () => geo.y, scale: () => geo.s, ease: 'power2.inOut' }, 0)
    .to(name, { opacity: 0, duration: .08, ease: 'none' }, .92);

  // copy blurs away instead of sliding
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: () => `+=${innerHeight * .45}`, scrub: true } })
    .to('.hero-side, .hero-tagline', { opacity: 0, y: -40, ease: 'none', stagger: .05 }, 0)
    .to('.hero-foot', { opacity: 0, y: 20, ease: 'none' }, .1);

  // caption on the left while the card is being restored
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true } })
    .fromTo('.hero-mid', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .12, ease: 'none' }, .2)
    .to('.hero-mid', { opacity: 0, y: -40, duration: .1, ease: 'none' }, .8);
}

function heroIntro(){
  if(REDUCED) return;
  const name = $('#hero-name');
  const split = SplitText.create(name, { type: 'chars', mask: 'chars' });
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(split.chars, { yPercent: 110, duration: .9, stagger: .025 }, 0)
    .from('.hero-tagline, .hero-side > *', { y: 20, opacity: 0, duration: .7, stagger: .05 }, .2)
    .from('.hero-note, .stat-strip .stat, .scroll-cue', { y: 20, opacity: 0, duration: .7, stagger: .04 }, .35);
  tl.eventCallback('onComplete', () => split.revert());
}

/* ---------------------------------------------------------------
   5. RESEARCH STORY — phases light up, the slider sweeps, counters run
--------------------------------------------------------------- */
const compare = { cut: 0, user: false };
function initResearchStory(){
  const section = $('#research-story');
  const cmp = $('#rs-compare');
  const frameEl = cmp.querySelector('.rs-compare-frame');
  const handle = cmp.querySelector('.rs-handle');
  const before = cmp.querySelector('.rs-before');
  const after = cmp.querySelector('.rs-after');

  const imgs = makeWordImages('Evidence', { width: 1200, height: 600, ink: INKS.blue, seed: 5, density: 1.25 });
  [[before, imgs.scribbled], [after, imgs.clean]].forEach(([c, src]) => {
    c.width = src.width; c.height = src.height;
    c.getContext('2d').drawImage(src, 0, 0);
  });

  const setCut = (pct) => {
    compare.cut = Math.max(0, Math.min(100, pct));
    frameEl.style.setProperty('--cut', compare.cut + '%');
    handle.setAttribute('aria-valuenow', Math.round(compare.cut));
  };
  setCut(REDUCED ? 50 : 0);

  const fromPointer = (e) => {
    const r = frameEl.getBoundingClientRect();
    setCut((e.clientX - r.left) / r.width * 100);
  };
  frameEl.addEventListener('pointerdown', (e) => {
    compare.user = true;
    frameEl.setPointerCapture(e.pointerId);
    fromPointer(e);
    const move = (ev) => fromPointer(ev);
    const up = () => { frameEl.removeEventListener('pointermove', move); frameEl.removeEventListener('pointerup', up); };
    frameEl.addEventListener('pointermove', move);
    frameEl.addEventListener('pointerup', up);
  });
  handle.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
      compare.user = true;
      setCut(compare.cut + (e.key === 'ArrowRight' ? 5 : -5));
      e.preventDefault();
    }
  });

  const phases = $$('#rs-phases li');
  const thresholds = [.04, .12, .2, .28, .38, .8];
  const metrics = $$('.rs-m-to').map(el => ({
    el, to: parseFloat(el.dataset.count), dec: +el.dataset.dec || 0, suffix: el.dataset.suffix || '',
    from: parseFloat(el.parentElement.querySelector('.rs-m-from').textContent),
  }));
  const barAfter = $('.rs-bar-after');

  const render = (p) => {
    phases.forEach((li, i) => li.classList.toggle('is-on', p >= thresholds[i]));
    if(!compare.user) setCut(fit(p, .22, .6) * 100);
    const t = fit(p, .46, .7);
    metrics.forEach(m => { m.el.textContent = (m.from + (m.to - m.from) * t).toFixed(m.dec) + m.suffix; });
    barAfter.style.transform = `scaleX(${(4.6 + (24.6 - 4.6) * t) / 24.6})`;
  };

  if(REDUCED){ render(1); setCut(50); return; }
  render(0);

  ST.matchMedia({
    '(min-width: 768px)': () => {
      ST.create({ trigger: section, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => render(s.progress) });
    },
    '(max-width: 767.98px)': () => {
      ST.create({ trigger: section, start: 'top 70%', end: 'bottom 80%', scrub: true, onUpdate: (s) => render(s.progress) });
    },
  });

  const title = SplitText.create('#rs-title', { type: 'chars', mask: 'chars' });
  gsap.from(title.chars, { yPercent: 105, duration: .8, stagger: .03, ease: 'expo.out',
    scrollTrigger: { trigger: section, start: 'top 60%' } });
  gsap.from('.rs-lead, .rs-tag', { opacity: 0, y: 20, duration: .7, stagger: .08, ease: 'power3.out',
    scrollTrigger: { trigger: section, start: 'top 45%' } });
}

/* ---------------------------------------------------------------
   6. SKILLS — scrambled characters decode into each tag
--------------------------------------------------------------- */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEF';
function decodePills(){
  const pills = $$('#skills-grid .skill-pill');
  pills.forEach((pill, idx) => {
    const text = pill.dataset.text || pill.textContent;
    pill.dataset.text = text;
    if(REDUCED){ pill.textContent = text; return; }
    pill.style.minWidth = pill.offsetWidth + 'px';
    pill.classList.add('is-scrambling');
    const start = performance.now() + idx * 45;
    const dur = 650 + text.length * 35;
    const tick = (now) => {
      const t = clamp01((now - start) / dur);
      const solved = Math.floor(t * text.length);
      let out = '';
      for(let i = 0; i < text.length; i++){
        out += i < solved || text[i] === ' ' ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      pill.textContent = out;
      if(t < 1) requestAnimationFrame(tick);
      else{ pill.textContent = text; pill.classList.remove('is-scrambling'); pill.style.minWidth = ''; }
    };
    requestAnimationFrame(tick);
  });
}
$('#decode-btn')?.addEventListener('click', decodePills);

/* ---------------------------------------------------------------
   7. CHOOSE YOUR VIEW + OPEN CODE (built from the same DATA)
--------------------------------------------------------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function allProjects(d){
  const ids = ['projects', ...(typeof PROJECT_SECTION_IDS !== 'undefined' ? PROJECT_SECTION_IDS : [])];
  return (d?.sections || []).filter(s => ids.includes(s.id)).flatMap(s => s.items || []);
}
function buildViews(){
  const d = getData();
  const projects = allProjects(d);
  const edu = (d?.sections || []).find(s => s.id === 'education')?.items?.[0];
  const cgpa = (edu?.meta || '').match(/CGPA\s*([\d.]+)/i)?.[1];
  const research = (d?.sections || []).find(s => /^current-research/.test(s.id));
  const github = d?.contact?.links?.find(l => /github\.com/.test(l.link))?.link || 'https://github.com/Rishichamp';
  return {
    recruiter: {
      title: 'HIRE',
      text: `M.Tech in AI &amp; Data Science at IIT (ISM) Dhanbad${cgpa ? `, <span>CGPA ${esc(cgpa)}</span>` : ''}. ${projects.length} projects built and documented. ${esc(d?.contact?.note || '')}`,
      actions: [['Download resume', '#resume'], ['Get in touch', '#contact']],
    },
    researcher: {
      title: 'READ',
      text: 'Thesis: recovering handwriting hidden under same-colour pen scribbles. On a writer the model never saw, OCR reads <span>24.6%</span> of words instead of <span>4.6%</span>. Phases 1–5 done, Phase 6 next.',
      actions: [['The research story', '#research-story'], ['Literature survey', '#research'], ...(research ? [['Thesis details', '#' + research.id]] : [])],
    },
    engineer: {
      title: 'BUILD',
      text: `From RAG systems and FastAPI services to edge AI, Android apps and Cloudflare Workers. <span>${projects.filter(p => /github\.com/.test(p.link || '')).length}</span> projects with their source on GitHub.`,
      actions: [['All projects', '#projects'], ['GitHub profile', github]],
    },
  };
}
let currentView = 'recruiter';
function renderView(view, animate){
  const panel = $('#vs-panel');
  const title = $('#vs-title');
  const v = buildViews()[view];
  const paint = () => {
    title.textContent = v.title;
    panel.innerHTML = `<p>${v.text}</p><div class="vs-actions">${v.actions.map(([label, href], i) =>
      `<a class="btn ${i ? 'btn-ghost' : 'btn-primary'}" href="${esc(href)}" ${/^https?:/.test(href) ? 'target="_blank" rel="noopener"' : ''}>${esc(label)}</a>`).join('')}</div>`;
    $$('.btn', panel).forEach(roll);
    $$('a[href="#resume"]', panel).forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); $('#nav-resume-btn')?.click(); }));
  };
  if(!animate || REDUCED){ paint(); return; }
  gsap.timeline()
    .to([panel, title], { opacity: 0, filter: 'blur(10px)', y: -12, duration: .25, ease: 'power2.in' })
    .add(paint)
    .fromTo([title, panel], { opacity: 0, filter: 'blur(10px)', y: 14 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: .5, ease: 'power3.out', stagger: .06 });
}
$$('.vs-pill').forEach(btn => btn.addEventListener('click', () => {
  if(btn.dataset.view === currentView) return;
  currentView = btn.dataset.view;
  $$('.vs-pill').forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
  renderView(currentView, true);
}));

function buildRepos(){
  const list = $('#oc-repos');
  if(!list) return;
  const items = (getData()?.sections || []).flatMap(s => s.items || [])
    .filter(it => /github\.com\/[^/]+\/[^/?#]+/.test(it.link || ''));
  const seen = new Set();
  list.innerHTML = items.filter(it => { const k = it.link.replace(/\/+$/, ''); if(seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 9)
    .map(it => {
      const repo = it.link.match(/github\.com\/([^/]+\/[^/?#]+)/)[1];
      return `<li><a href="${esc(it.link)}" target="_blank" rel="noopener"><span>${esc(repo)}</span><b>→</b></a></li>`;
    }).join('');
}

/* ---------------------------------------------------------------
   8. RE-APPLIED AFTER EVERY RENDER: about fill, section titles,
      ghost words, card reveals, rolls, view panel, repo list
--------------------------------------------------------------- */
let dynamic = [];
const track = (x) => { dynamic.push(x); return x; };

function splitWords(el){
  if(!el || el.dataset.split === el.textContent) return;
  const text = el.textContent;
  el.innerHTML = '';
  el.setAttribute('aria-label', text);
  text.split(/(\s+)/).forEach(part => {
    if(/^\s+$/.test(part)){ el.appendChild(document.createTextNode(part)); return; }
    if(!part) return;
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    w.textContent = part;
    el.appendChild(w);
  });
  el.dataset.split = text;
}
function aboutFillHTML(){
  // the heading keeps its <br>, so split its text nodes in place
  const h = $('.about-pre');
  if(h.dataset.split) return;
  h.dataset.split = '1';
  [...h.childNodes].forEach(n => {
    if(n.nodeType !== 3) return;
    const frag = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach(part => {
      if(!part) return;
      if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
      const w = document.createElement('span'); w.className = 'w'; w.textContent = part; frag.appendChild(w);
    });
    n.replaceWith(frag);
  });
}

function longestWord(title){
  return (String(title).toLowerCase().match(/[a-z]{3,}/g) || ['work']).sort((a, b) => b.length - a.length)[0];
}

// revert (not just kill) so a half-played "from" tween never leaves text hidden
function cleanup(x){
  if(!x) return;
  if(Array.isArray(x)){ x.forEach(cleanup); return; }
  if(typeof x.revert === 'function') x.revert();
  else if(typeof x.kill === 'function') x.kill();
}
/* NAV — script.js lists every section (13+ long titles); show a short curated set instead */
const NAV_ITEMS = [
  ['about', 'About'], ['research-story', 'Thesis'], ['projects', 'Projects'],
  ['education', 'Education'], ['research', 'Papers'], ['contact', 'Contact'],
];
function curateNav(){
  const nav = $('#nav-links');
  if(!nav) return;
  if(!nav.querySelector('a[data-section="research-story"]')){
    const a = document.createElement('a');
    a.href = '#research-story';
    a.dataset.section = 'research-story';
    a.textContent = 'Thesis';
    const about = nav.querySelector('a[data-section="about"]');
    about ? about.after(a) : nav.prepend(a);
  }
  const labels = new Map(NAV_ITEMS);
  $$('a', nav).forEach(a => {
    const label = labels.get(a.dataset.section);
    if(!label){ a.classList.add('nav-extra'); return; }
    if(!a.dataset.rolled) a.textContent = label;
  });
}

function rebuild(){
  dynamic.slice().reverse().forEach(cleanup);
  dynamic = [];

  curateNav();
  applyRolls();
  preventLenisInPanels();
  buildRepos();
  renderView(currentView, false);

  // ABOUT: words fill in with scroll
  aboutFillHTML();
  splitWords($('#about-bio'));
  const words = $$('#about [data-fill] .w, #about-bio .w');
  if(!REDUCED && words.length){
    gsap.set(words, { opacity: .16 });
    track(gsap.to(words, {
      opacity: 1, ease: 'none', stagger: .5,
      scrollTrigger: { trigger: '#about', start: () => isMobile() ? 'top 70%' : 'top top', end: () => isMobile() ? 'bottom 60%' : 'bottom bottom', scrub: true },
    }));
    track(gsap.from('#about-quote', { opacity: 0, y: 20, ease: 'none',
      scrollTrigger: { trigger: '#about', start: () => isMobile() ? 'center 70%' : '70% bottom', end: () => isMobile() ? 'bottom 70%' : 'bottom bottom', scrub: true } }));
  }

  // DYNAMIC SECTIONS
  $$('#dynamic-sections > section').forEach(sec => {
    const titleEl = sec.querySelector('.section-title');
    if(!sec.querySelector('.ghost-word')){
      const g = document.createElement('div');
      g.className = 'ghost-word';
      g.setAttribute('aria-hidden', 'true');
      g.textContent = longestWord(titleEl?.textContent || '');
      sec.prepend(g);
    }
    if(REDUCED) return;
    const ghost = sec.querySelector('.ghost-word');
    track(gsap.fromTo(ghost, { xPercent: 12 }, { xPercent: -38, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } }));

    if(titleEl && !document.body.classList.contains('editing')){
      const split = SplitText.create(titleEl, { type: 'lines', mask: 'lines' });
      track(split);
      track(gsap.from(split.lines, { yPercent: 105, duration: .8, stagger: .06, ease: 'expo.out',
        scrollTrigger: { trigger: sec, start: 'top 75%', once: true } }));
    }
    const desc = sec.querySelector('.section-desc');
    if(desc) track(gsap.from(desc, { opacity: 0, y: 16, duration: .7, ease: 'power3.out',
      scrollTrigger: { trigger: sec, start: 'top 65%', once: true } }));

    const items = sec.querySelectorAll('.entry-card, .timeline-item, .hobby-tile');
    if(items.length){
      track(ST.batch(items, {
        start: 'top 92%', once: true,
        onEnter: (els) => gsap.fromTo(els,
          { clipPath: 'inset(0% 0% 100% 0%)', y: 40 },
          { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: .75, stagger: .06, ease: 'expo.out', clearProps: 'clipPath,transform' }),
      }));
    }
  });

  // SKILLS: decode when the section scrolls in
  track(ST.create({ trigger: '#skills', start: 'top 70%', once: true, onEnter: decodePills }));

  // CONTACT pitch: line reveal
  if(!REDUCED){
    const pitch = SplitText.create('.contact-pitch', { type: 'lines', mask: 'lines' });
    track(pitch);
    track(gsap.from(pitch.lines, { yPercent: 105, duration: .85, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: '#contact', start: 'top 70%', once: true } }));
    track(gsap.from('.vs-title', { yPercent: 30, opacity: 0, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: '#view-switch', start: 'top 70%', once: true } }));
  }

  ST.refresh();
}

let rebuildTimer = 0;
let mutating = false;
function scheduleRebuild(){
  if(mutating) return;
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => { mutating = true; rebuild(); setTimeout(() => { mutating = false; }, 0); }, 120);
}
const watched = ['#dynamic-sections', '#skills-grid', '#about-bio', '#contact-links', '#nav-links', '#stat-strip'];
const mo = new MutationObserver((records) => {
  if(mutating) return;
  // ignore changes this file makes (rolls, splits, decoding text)
  const ours = (n) => n.nodeType === 1 && n.matches('.ghost-word, .roll, .sr-only');
  const external = records.some(r => {
    const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
    if(t && t.closest('.roll, .skill-pill, [data-split], .ghost-word, .section-title')) return false;
    if(r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].every(ours)) return false;
    return true;
  });
  if(external) scheduleRebuild();
});
watched.forEach(s => { const el = $(s); if(el) mo.observe(el, { childList: true, subtree: true, characterData: true }); });
// owner panels appear later
new MutationObserver(preventLenisInPanels).observe(document.body, { childList: true });
// switching Edit mode changes layout (pins become static), so measure again
new MutationObserver(() => ST.refresh()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
window.addEventListener('load', () => ST.refresh());
document.fonts?.ready.then(() => ST.refresh());

/* ---------------------------------------------------------------
   9. START
--------------------------------------------------------------- */
mutating = true;
initHero();
initResearchStory();
rebuild();
setTimeout(() => { mutating = false; }, 0);   // after the observer has seen our own changes
document.addEventListener('v4:ready', () => { heroIntro(); ST.refresh(); }, { once: true });
initScene();
