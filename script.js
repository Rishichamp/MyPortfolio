/* ============================================================
   PORTFOLIO v3 — app logic
   Everything on this page — hero, about, skills, every section,
   every entry, and contact — is editable in the browser via
   Edit mode. Edit DEFAULT_DATA below to set your own "source of
   truth" before publishing.
   ============================================================ */

/* ---------------------------------------------------------------
   1. DATA — STORAGE_KEY / DEFAULT_DATA now live in data.js (shared
   with the Resume Builder). loadData() here just wraps the shared
   loader so the rest of this file is unchanged.
--------------------------------------------------------------- */
function loadData(){ return loadPortfolioData(); }
function saveData(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA)); }
  catch(e){ console.warn('Could not save data.', e); }
  pushPortfolioDataToServer(DATA);
}
function loadNote(){ try{ return localStorage.getItem(NOTES_KEY) || ''; }catch(e){ return ''; } }
function saveNote(text){ try{ localStorage.setItem(NOTES_KEY, text); }catch(e){} }

let DATA = loadData();
let editing = false;

/* ---------------------------------------------------------------
   3. THEME
--------------------------------------------------------------- */
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
})();
document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
});

/* ---------------------------------------------------------------
   4. EDIT MODE
--------------------------------------------------------------- */
const editBtn = document.getElementById('edit-toggle');
editBtn.addEventListener('click', async () => {
  // Owner Mode gate: real server-verified session (see owner/auth.js),
  // never a CSS/visibility check. Falls back to letting the click
  // through if auth.js hasn't loaded yet (e.g. slow network) — it will
  // still prompt on the next click once loaded.
  if (window.OwnerAuth) {
    const ok = await window.OwnerAuth.requireOwnerAuth();
    if (!ok) return;
  }
  editing = !editing;
  document.body.classList.toggle('editing', editing);
  editBtn.classList.toggle('on', editing);
});

/* ---------------------------------------------------------------
   5. ICONS
--------------------------------------------------------------- */
const ICONS = {
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3h7v7M21 3l-9 9M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 15l6-6 6 6"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.32.1-2.75 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3a1.94 1.94 0 1 0 0 3.88A1.94 1.94 0 0 0 5.25 3ZM20.44 21h.01v-6.9c0-3.37-.72-5.97-4.67-5.97-1.89 0-3.16 1.04-3.68 2.02h-.05V8.5H8.86V21h3.38v-6.15c0-1.62.31-3.19 2.32-3.19 1.98 0 2 1.85 2 3.3V21h3.88Z"/></svg>`,
};
function guessIcon(url){
  if(!url) return 'link';
  if(url.startsWith('mailto:')) return 'mail';
  if(url.includes('github.com')) return 'github';
  if(url.includes('linkedin.com')) return 'linkedin';
  return 'link';
}

/* Icon set + keyword matcher for the Hobbies showcase — picks a
   relevant icon per entry automatically so editing hobbies in Edit
   mode never requires manually choosing an icon. */
const HOBBY_ICONS = {
  sport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 3v4.2L15.8 10 12 12.8V21M4.5 9l3.5 1L12 7.2M19.5 9l-3.5 1L12 7.2M4.8 17l3.7-2.6M19.2 17l-3.7-2.6"/></svg>`,
  film: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M8 5 6 9M14 5l-2 4M20 5l-2 4"/></svg>`,
  music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13ZM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-3"/></svg>`,
  game: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v4M5 12h4M15.5 11.5h.01M18.5 13.5h.01"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8h3l2-2h6l2 2h3v11H4Z"/><circle cx="12" cy="13.5" r="3.3"/></svg>`,
  travel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 16.5 22 8l-7 3.5L11 21l-2.5-6L2 16.5Z"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m8 6-6 6 6 6M16 6l6 6-6 6"/></svg>`,
  art: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.2A4.3 4.3 0 0 0 21 12a9 9 0 0 0-9-9Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3"/></svg>`,
};
function guessHobbyIcon(title){
  const t = (title || '').toLowerCase();
  if(/football|soccer|cricket|badminton|tennis|basketball|sport|gym|fitness|run/.test(t)) return HOBBY_ICONS.sport;
  if(/anime|movie|film|cinema|series|watch/.test(t)) return HOBBY_ICONS.film;
  if(/music|song|guitar|piano|sing|band/.test(t)) return HOBBY_ICONS.music;
  if(/book|read|novel|story|stories|write|writing/.test(t)) return HOBBY_ICONS.book;
  if(/game|gaming|chess/.test(t)) return HOBBY_ICONS.game;
  if(/photo|camera/.test(t)) return HOBBY_ICONS.camera;
  if(/travel|hike|hiking|trip/.test(t)) return HOBBY_ICONS.travel;
  if(/code|coding|program/.test(t)) return HOBBY_ICONS.code;
  if(/art|paint|draw|sketch|design/.test(t)) return HOBBY_ICONS.art;
  return HOBBY_ICONS.spark;
}

/* ---------------------------------------------------------------
   6. RENDER — HERO
--------------------------------------------------------------- */
function renderHero(){
  const h = DATA.hero;
  document.getElementById('nav-brand').textContent = h.initials;
  document.getElementById('hero-eyebrow').textContent = h.eyebrow;
  document.getElementById('hero-name').textContent = h.name;
  document.getElementById('hero-role').textContent = h.role;
  document.getElementById('hero-pitch').textContent = h.pitch;
  document.getElementById('stat-strip').innerHTML = h.stats.map(s =>
    `<div class="stat"><span class="num">${escapeHtml(s.num)}</span><span class="lbl">${escapeHtml(s.lbl)}</span></div>`
  ).join('');
  document.getElementById('footer-name').textContent = h.name;
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  // Tab title from the stored name; an all-caps name ("RISHI SINGH") reads better title-cased.
  const tabName = h.name === h.name.toUpperCase()
    ? h.name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase())
    : h.name;
  document.title = `${tabName} — AI & Data Science Portfolio`;
}

/* ---------------------------------------------------------------
   7. RENDER — ABOUT / SKILLS
--------------------------------------------------------------- */
function renderAbout(){
  document.getElementById('about-bio').textContent = DATA.about.bio;
  document.getElementById('about-quote').textContent = '“' + DATA.about.quote + '”';
}
function renderSkills(){
  const el = document.getElementById('skills-grid');
  el.innerHTML = DATA.skills.map((s,i) => `<span class="skill-pill stagger" style="--i:${i}">${escapeHtml(s)}</span>`).join('');
}

/* ---------------------------------------------------------------
   8. RENDER — NAV (dynamic, matches current sections)
--------------------------------------------------------------- */
function renderNav(){
  const nav = document.getElementById('nav-links');
  const indicator = document.getElementById('nav-indicator');
  nav.innerHTML = '';
  const items = [
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    ...DATA.sections.map(s => ({ id: s.id, label: s.title })),
    { id: 'contact', label: 'Contact' },
  ];
  items.forEach(it => {
    const a = document.createElement('a');
    a.href = '#' + it.id;
    a.dataset.section = it.id;
    a.textContent = it.label;
    nav.appendChild(a);
  });
  nav.appendChild(indicator);
}

/* Makes the horizontally-scrollable nav-links row discoverable: shows a
   fade on the right edge only when there's actually more to scroll to,
   and lets a normal vertical mouse-wheel scroll it sideways (the usual
   pattern for horizontal tab/nav bars) instead of requiring a trackpad
   swipe or shift+wheel that most visitors won't think to try. */
function initNavScrollAffordance(){
  const nav = document.getElementById('nav-links');
  if(!nav) return;
  const update = () => {
    const hasOverflow = nav.scrollWidth - nav.clientWidth > 4;
    const atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
    nav.classList.toggle('has-overflow', hasOverflow && !atEnd);
  };
  update();
  if(!nav.dataset.scrollBound){
    nav.dataset.scrollBound = '1';
    nav.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    nav.addEventListener('wheel', (e) => {
      if(nav.scrollWidth <= nav.clientWidth) return; // nothing to scroll, let the page scroll normally
      if(Math.abs(e.deltaY) > Math.abs(e.deltaX)){
        e.preventDefault();
        nav.scrollLeft += e.deltaY;
      }
    }, { passive:false });
  }
}

/* ---------------------------------------------------------------
   9. RENDER — DYNAMIC SECTIONS (cards / timeline)
--------------------------------------------------------------- */
function renderDynamicSections(){
  const root = document.getElementById('dynamic-sections');
  root.innerHTML = '';
  DATA.sections.forEach((sec, secIdx) => {
    const isShowcase = sec.kind === 'showcase' || /^(hobbies|interests)$/i.test(sec.title.trim());
    const section = document.createElement('section');
    section.id = sec.id;
    section.className = 'section reveal';
    section.innerHTML = `
      <div class="dyn-section-head">
        <div>
          <p class="section-eyebrow"><span class="section-num">${String(secIdx + 3).padStart(2, '0')}</span> ${escapeHtml(sec.title)}</p>
          <h3 class="section-title">${escapeHtml(sec.title)}</h3>
          ${sec.subtitle ? `<p class="section-desc">${escapeHtml(sec.subtitle)}</p>` : ''}
        </div>
        <div class="dyn-section-controls">
          <button class="entry-icon-btn reorder-btn sec-up" title="Move section up" ${secIdx === 0 ? 'disabled' : ''}>${ICONS.up}</button>
          <button class="entry-icon-btn reorder-btn sec-down" title="Move section down" ${secIdx === DATA.sections.length - 1 ? 'disabled' : ''}>${ICONS.down}</button>
          <button class="entry-icon-btn sec-edit" title="Edit section">${ICONS.edit}</button>
          <button class="entry-icon-btn sec-del" title="Hide section">${ICONS.trash}</button>
        </div>
      </div>
      <div class="${isShowcase ? 'hobby-showcase' : sec.kind === 'timeline' ? 'timeline' : 'card-grid'}" data-role="items"></div>
      <button class="add-entry-btn" data-target="${sec.id}">+ Add entry</button>
      ${sec.hasNotes ? `
        <div class="notebook">
          <p class="notebook-label">Research notebook</p>
          <textarea id="notes-area" class="notes-area" placeholder="Working notes, ideas, half-finished thoughts…"></textarea>
          <p class="notes-status" id="notes-status">Saved locally in this browser.</p>
        </div>` : ''}
    `;
    root.appendChild(section);

    const itemsWrap = section.querySelector('[data-role="items"]');
    (sec.items || []).forEach((item, i) => {
      const renderer = isShowcase ? renderHobbyTile : (sec.kind === 'timeline' ? renderTimelineItem : renderCard);
      itemsWrap.appendChild(renderer(sec, item, i));
    });

    section.querySelector('.add-entry-btn').addEventListener('click', () => {
      sec.items = sec.items || [];
      sec.items.push({ title: 'New entry', description: '', link: '', meta: '', tags: [] });
      saveData();
      renderAll();
      openEntryModal(sec.id, sec.items.length - 1, true);
    });
    section.querySelector('.sec-edit').addEventListener('click', () => openSectionHeaderModal(sec.id));
    section.querySelector('.sec-del').addEventListener('click', () => {
      if(confirm(`Hide the "${sec.title}" section? You can restore it later from the bottom of the page.`)){
        DATA.hiddenSections.push(sec);
        DATA.sections = DATA.sections.filter(s => s.id !== sec.id);
        saveData();
        renderAll();
      }
    });
    const upBtn = section.querySelector('.sec-up');
    const downBtn = section.querySelector('.sec-down');
    if(upBtn) upBtn.addEventListener('click', () => moveSection(sec.id, -1));
    if(downBtn) downBtn.addEventListener('click', () => moveSection(sec.id, 1));
  });

  if(document.getElementById('notes-area')) initNotebook();
}

function renderCard(sec, item, i){
  const card = document.createElement('div');
  card.className = 'entry-card stagger';
  card.style.setProperty('--i', i);
  const hasLink = item.link && item.link.trim();
  const last = (sec.items || []).length - 1;
  card.innerHTML = `
    <div class="entry-top">
      <div class="entry-title">${escapeHtml(item.title)}</div>
      ${hasLink ? `<span class="entry-link-badge">${ICONS.link} View</span>` : ''}
    </div>
    ${item.meta ? `<div class="entry-meta">${escapeHtml(item.meta)}</div>` : ''}
    ${item.description ? `<div class="entry-desc">${escapeHtml(item.description)}</div>` : ''}
    ${(item.tags&&item.tags.length) ? `<div class="entry-tags">${item.tags.map(t=>`<span class="entry-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    <div class="entry-controls">
      <button class="entry-icon-btn reorder-btn item-up" title="Move up" ${i === 0 ? 'disabled' : ''}>${ICONS.up}</button>
      <button class="entry-icon-btn reorder-btn item-down" title="Move down" ${i === last ? 'disabled' : ''}>${ICONS.down}</button>
      <button class="entry-icon-btn edit-item">${ICONS.edit}</button>
    </div>
  `;
  card.addEventListener('click', () => { if(!editing && hasLink) window.open(safeHref(item.link), '_blank', 'noopener'); });
  card.querySelector('.edit-item').addEventListener('click', (e) => { e.stopPropagation(); openEntryModal(sec.id, i); });
  const upBtn = card.querySelector('.item-up');
  const downBtn = card.querySelector('.item-down');
  if(upBtn) upBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, -1); });
  if(downBtn) downBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, 1); });
  return card;
}

function renderTimelineItem(sec, item, i){
  const el = document.createElement('div');
  el.className = 'timeline-item stagger';
  el.style.setProperty('--i', i);
  const hasLink = item.link && item.link.trim();
  const last = (sec.items || []).length - 1;
  el.innerHTML = `
    <div class="timeline-head">
      <span class="timeline-title">${escapeHtml(item.title)}</span>
      <span class="timeline-meta">${escapeHtml(item.meta||'')}</span>
    </div>
    <div class="timeline-desc">${escapeHtml(item.description||'')}</div>
    ${(item.tags&&item.tags.length) ? `<div class="entry-tags">${item.tags.map(t=>`<span class="entry-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    <div class="timeline-controls">
      <button class="entry-icon-btn reorder-btn item-up" title="Move up" ${i === 0 ? 'disabled' : ''}>${ICONS.up}</button>
      <button class="entry-icon-btn reorder-btn item-down" title="Move down" ${i === last ? 'disabled' : ''}>${ICONS.down}</button>
      <button class="entry-icon-btn edit-item">${ICONS.edit}</button>
    </div>
  `;
  if(hasLink){ el.style.cursor = 'pointer'; el.addEventListener('click', (e) => { if(!editing && !e.target.closest('.entry-controls, .timeline-controls')) window.open(safeHref(item.link), '_blank', 'noopener'); }); }
  el.querySelector('.edit-item').addEventListener('click', (e) => { e.stopPropagation(); openEntryModal(sec.id, i); });
  const upBtn = el.querySelector('.item-up');
  const downBtn = el.querySelector('.item-down');
  if(upBtn) upBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, -1); });
  if(downBtn) downBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, 1); });
  return el;
}

function renderHobbyTile(sec, item, i){
  const el = document.createElement('div');
  el.className = 'hobby-tile stagger';
  el.style.setProperty('--i', i);
  const last = (sec.items || []).length - 1;
  el.innerHTML = `
    <div class="hobby-tile-badge">${guessHobbyIcon(item.title)}</div>
    <span class="hobby-tile-label">${escapeHtml(item.title)}</span>
    <div class="hobby-tile-controls">
      <button class="entry-icon-btn reorder-btn item-up" title="Move up" ${i === 0 ? 'disabled' : ''}>${ICONS.up}</button>
      <button class="entry-icon-btn reorder-btn item-down" title="Move down" ${i === last ? 'disabled' : ''}>${ICONS.down}</button>
      <button class="entry-icon-btn edit-item">${ICONS.edit}</button>
    </div>
  `;
  el.querySelector('.edit-item').addEventListener('click', (e) => { e.stopPropagation(); openEntryModal(sec.id, i); });
  const upBtn = el.querySelector('.item-up');
  const downBtn = el.querySelector('.item-down');
  if(upBtn) upBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, -1); });
  if(downBtn) downBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, 1); });
  return el;
}

function renderHobbyTile(sec, item, i){
  const el = document.createElement('div');
  el.className = 'hobby-tile stagger';
  el.style.setProperty('--i', i);
  const hasLink = item.link && item.link.trim();
  const last = (sec.items || []).length - 1;
  el.innerHTML = `
    <div class="hobby-tile-icon">${guessHobbyIcon(item.title)}</div>
    <div class="hobby-tile-label">${escapeHtml(item.title)}</div>
    ${item.description ? `<div class="hobby-tile-desc">${escapeHtml(item.description)}</div>` : ''}
    <div class="hobby-tile-controls">
      <button class="entry-icon-btn reorder-btn item-up" title="Move up" ${i === 0 ? 'disabled' : ''}>${ICONS.up}</button>
      <button class="entry-icon-btn reorder-btn item-down" title="Move down" ${i === last ? 'disabled' : ''}>${ICONS.down}</button>
      <button class="entry-icon-btn edit-item">${ICONS.edit}</button>
    </div>
  `;
  if(hasLink){ el.style.cursor = 'pointer'; el.addEventListener('click', (e) => { if(!editing && !e.target.closest('.hobby-tile-controls')) window.open(safeHref(item.link), '_blank', 'noopener'); }); }
  el.querySelector('.edit-item').addEventListener('click', (e) => { e.stopPropagation(); openEntryModal(sec.id, i); });
  const upBtn = el.querySelector('.item-up');
  const downBtn = el.querySelector('.item-down');
  if(upBtn) upBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, -1); });
  if(downBtn) downBtn.addEventListener('click', (e) => { e.stopPropagation(); moveEntry(sec.id, i, 1); });
  return el;
}

/* ---------------------------------------------------------------
   REORDERING — sections and entries
--------------------------------------------------------------- */
function moveSection(id, dir){
  const idx = DATA.sections.findIndex(s => s.id === id);
  const newIdx = idx + dir;
  if(newIdx < 0 || newIdx >= DATA.sections.length) return;
  [DATA.sections[idx], DATA.sections[newIdx]] = [DATA.sections[newIdx], DATA.sections[idx]];
  saveData();
  renderAll();
}
function moveEntry(sectionId, index, dir){
  const sec = DATA.sections.find(s => s.id === sectionId);
  const newIdx = index + dir;
  if(newIdx < 0 || newIdx >= sec.items.length) return;
  [sec.items[index], sec.items[newIdx]] = [sec.items[newIdx], sec.items[index]];
  saveData();
  renderAll();
}

/* ---------------------------------------------------------------
   10. RENDER — hidden-section restore chips + contact
--------------------------------------------------------------- */
function renderHiddenRestore(){
  const wrap = document.getElementById('hidden-sections-restore');
  wrap.innerHTML = (DATA.hiddenSections || []).map((s,i) =>
    `<button class="restore-chip" data-i="${i}">+ Restore "${escapeHtml(s.title)}"</button>`
  ).join('');
  wrap.querySelectorAll('.restore-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      const sec = DATA.hiddenSections.splice(i, 1)[0];
      DATA.sections.push(sec);
      saveData();
      renderAll();
    });
  });
}

function renderContact(){
  document.getElementById('contact-desc').textContent = DATA.contact.note;
  document.getElementById('contact-links').innerHTML = DATA.contact.links.map((c,i) =>
    `<a class="contact-link stagger" style="--i:${i}" href="${escapeAttr(safeHref(c.link))}" target="_blank" rel="noopener">${ICONS[c.icon]||ICONS.link}<span>${escapeHtml(c.title)}</span></a>`
  ).join('');
  const numEl = document.getElementById('contact-num');
  if(numEl) numEl.textContent = String(DATA.sections.length + 3).padStart(2, '0');
}

/* ---------------------------------------------------------------
   11. MASTER RENDER
--------------------------------------------------------------- */
function renderAll(){
  renderHero();
  renderAbout();
  renderSkills();
  renderNav();
  renderDynamicSections();
  renderHiddenRestore();
  renderContact();
  refreshRevealObserver();
  recomputeSectionEls();
  initNavScrollAffordance();
}

/* ---------------------------------------------------------------
   12. ENTRY MODAL (project / education / cert / research items)
--------------------------------------------------------------- */
const entryBackdrop = document.getElementById('edit-modal-backdrop');
let entryCtx = { sectionId: null, index: null };

function openEntryModal(sectionId, index, isNew){
  entryCtx = { sectionId, index };
  const sec = DATA.sections.find(s => s.id === sectionId);
  const item = sec.items[index];
  document.getElementById('modal-title').textContent = isNew ? 'Add entry' : 'Edit entry';
  document.getElementById('m-title').value = item.title || '';
  document.getElementById('m-desc').value = item.description || '';
  document.getElementById('m-link').value = item.link || '';
  document.getElementById('m-meta').value = item.meta || '';
  document.getElementById('m-tags').value = (item.tags||[]).join(', ');
  entryBackdrop.classList.add('open');
}
function closeEntryModal(){ entryBackdrop.classList.remove('open'); }
document.getElementById('m-cancel').addEventListener('click', closeEntryModal);
entryBackdrop.addEventListener('click', (e) => { if(e.target === entryBackdrop) closeEntryModal(); });
document.getElementById('m-save').addEventListener('click', () => {
  const sec = DATA.sections.find(s => s.id === entryCtx.sectionId);
  const item = sec.items[entryCtx.index];
  item.title = document.getElementById('m-title').value || 'Untitled';
  item.description = document.getElementById('m-desc').value;
  item.link = document.getElementById('m-link').value;
  item.meta = document.getElementById('m-meta').value;
  item.tags = document.getElementById('m-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  saveData();
  renderAll();
  closeEntryModal();
});
document.getElementById('m-delete').addEventListener('click', () => {
  const sec = DATA.sections.find(s => s.id === entryCtx.sectionId);
  if(confirm('Delete this entry?')){
    sec.items.splice(entryCtx.index, 1);
    saveData();
    renderAll();
    closeEntryModal();
  }
});

/* ---------------------------------------------------------------
   13. BLOCK MODAL (hero / about / skills / contact / section header)
--------------------------------------------------------------- */
const blockBackdrop = document.getElementById('block-modal-backdrop');
const blockModal = document.getElementById('block-modal');
let blockCtx = null;

document.querySelectorAll('.editable-block').forEach(block => {
  block.querySelector('.block-edit-btn').addEventListener('click', () => openBlockModal(block.dataset.editor));
});

function closeBlockModal(){ blockBackdrop.classList.remove('open'); }
blockBackdrop.addEventListener('click', (e) => { if(e.target === blockBackdrop) closeBlockModal(); });

function openBlockModal(kind){
  blockCtx = kind;
  let html = '';
  if(kind === 'hero'){
    const h = DATA.hero;
    html = `
      <h4>Edit hero</h4>
      <label>Status line</label><input id="bm-eyebrow" value="${escapeAttr(h.eyebrow)}" />
      <label>Name</label><input id="bm-name" value="${escapeAttr(h.name)}" />
      <label>Initials (logo)</label><input id="bm-initials" value="${escapeAttr(h.initials)}" maxlength="3" />
      <label>Role / title (also used as the terminal's first line)</label><input id="bm-role" value="${escapeAttr(h.role)}" />
      <label>Pitch</label><textarea id="bm-pitch" rows="3">${escapeHtml(h.pitch)}</textarea>
      <label>Terminal line 2</label><input id="bm-terminal2" value="${escapeAttr(h.terminalLine2 || 'Building: AI agents & ML systems, research to deployment')}" />
      <label>Terminal line 3</label><input id="bm-terminal3" value="${escapeAttr(h.terminalLine3 || 'Status: open to opportunities')}" />
      <label>Stats — one per line, "number | label"</label>
      <textarea id="bm-stats" rows="4">${h.stats.map(s=>`${s.num} | ${s.lbl}`).join('\n')}</textarea>
      <div class="modal-actions"><span></span><div class="modal-actions-right">
        <button class="btn-text" id="bm-cancel">Cancel</button>
        <button class="btn btn-primary small" id="bm-save">Save</button>
      </div></div>`;
  } else if(kind === 'about'){
    const a = DATA.about;
    html = `
      <h4>Edit about</h4>
      <label>Bio</label><textarea id="bm-bio" rows="5">${escapeHtml(a.bio)}</textarea>
      <label>Pull quote</label><textarea id="bm-quote" rows="2">${escapeHtml(a.quote)}</textarea>
      <div class="modal-actions"><span></span><div class="modal-actions-right">
        <button class="btn-text" id="bm-cancel">Cancel</button>
        <button class="btn btn-primary small" id="bm-save">Save</button>
      </div></div>`;
  } else if(kind === 'skills'){
    html = `
      <h4>Edit skills</h4>
      <label>Skills — comma separated</label>
      <textarea id="bm-skills" rows="4">${escapeHtml(DATA.skills.join(', '))}</textarea>
      <div class="modal-actions"><span></span><div class="modal-actions-right">
        <button class="btn-text" id="bm-cancel">Cancel</button>
        <button class="btn btn-primary small" id="bm-save">Save</button>
      </div></div>`;
  } else if(kind === 'contact'){
    const c = DATA.contact;
    html = `
      <h4>Edit contact</h4>
      <label>Note</label><textarea id="bm-note" rows="2">${escapeHtml(c.note)}</textarea>
      <label>Links — one per line, "Title | URL"</label>
      <textarea id="bm-links" rows="4">${escapeHtml(c.links.map(l=>`${l.title} | ${l.link}`).join('\n'))}</textarea>
      <div class="modal-actions"><span></span><div class="modal-actions-right">
        <button class="btn-text" id="bm-cancel">Cancel</button>
        <button class="btn btn-primary small" id="bm-save">Save</button>
      </div></div>`;
  }
  blockModal.innerHTML = html;
  blockModal.querySelector('#bm-cancel').addEventListener('click', closeBlockModal);
  blockModal.querySelector('#bm-save').addEventListener('click', saveBlockModal);
  blockBackdrop.classList.add('open');
}

function saveBlockModal(){
  if(blockCtx === 'hero'){
    const h = DATA.hero;
    h.eyebrow = document.getElementById('bm-eyebrow').value;
    h.name = document.getElementById('bm-name').value || 'Your Name';
    h.initials = document.getElementById('bm-initials').value || 'YN';
    h.role = document.getElementById('bm-role').value;
    h.pitch = document.getElementById('bm-pitch').value;
    h.terminalLine2 = document.getElementById('bm-terminal2').value;
    h.terminalLine3 = document.getElementById('bm-terminal3').value;
    h.stats = document.getElementById('bm-stats').value.split('\n').map(l => {
      const [num, lbl] = l.split('|').map(s => (s||'').trim());
      return num ? { num, lbl: lbl || '' } : null;
    }).filter(Boolean);
  } else if(blockCtx === 'about'){
    DATA.about.bio = document.getElementById('bm-bio').value;
    DATA.about.quote = document.getElementById('bm-quote').value;
  } else if(blockCtx === 'skills'){
    DATA.skills = document.getElementById('bm-skills').value.split(',').map(s=>s.trim()).filter(Boolean);
  } else if(blockCtx === 'contact'){
    DATA.contact.note = document.getElementById('bm-note').value;
    DATA.contact.links = document.getElementById('bm-links').value.split('\n').map(l => {
      const [title, link] = l.split('|').map(s => (s||'').trim());
      return title && link ? { title, link, icon: guessIcon(link) } : null;
    }).filter(Boolean);
  }
  saveData();
  renderAll();
  closeBlockModal();
}

/* section header (title/subtitle) modal — reuses block-modal shell */
function openSectionHeaderModal(sectionId){
  const sec = DATA.sections.find(s => s.id === sectionId);
  blockCtx = 'section:' + sectionId;
  blockModal.innerHTML = `
    <h4>Edit section</h4>
    <label>Title</label><input id="bm-sec-title" value="${escapeAttr(sec.title)}" />
    <label>Subtitle</label><textarea id="bm-sec-subtitle" rows="2">${escapeHtml(sec.subtitle||'')}</textarea>
    <div class="modal-actions"><span></span><div class="modal-actions-right">
      <button class="btn-text" id="bm-cancel">Cancel</button>
      <button class="btn btn-primary small" id="bm-save">Save</button>
    </div></div>`;
  blockModal.querySelector('#bm-cancel').addEventListener('click', closeBlockModal);
  blockModal.querySelector('#bm-save').addEventListener('click', () => {
    sec.title = document.getElementById('bm-sec-title').value || sec.title;
    sec.subtitle = document.getElementById('bm-sec-subtitle').value;
    saveData();
    renderAll();
    closeBlockModal();
  });
  blockBackdrop.classList.add('open');
}

/* ---------------------------------------------------------------
   14. ADD SECTION MODAL
--------------------------------------------------------------- */
const sectionBackdrop = document.getElementById('section-modal-backdrop');
document.getElementById('add-section-btn').addEventListener('click', () => sectionBackdrop.classList.add('open'));
document.getElementById('ns-cancel').addEventListener('click', () => sectionBackdrop.classList.remove('open'));
sectionBackdrop.addEventListener('click', (e) => { if(e.target === sectionBackdrop) sectionBackdrop.classList.remove('open'); });
document.getElementById('ns-create').addEventListener('click', () => {
  const title = document.getElementById('ns-title').value.trim();
  if(!title){ return; }
  const subtitle = document.getElementById('ns-subtitle').value.trim();
  const kind = document.getElementById('ns-kind').value;
  const id = slugify(title) + '-' + Date.now();
  DATA.sections.push({ id, title, subtitle, kind, items: [] });
  saveData();
  renderAll();
  document.getElementById('ns-title').value = '';
  document.getElementById('ns-subtitle').value = '';
  sectionBackdrop.classList.remove('open');
});

/* ---------------------------------------------------------------
   15. SCROLL PROGRESS + SCROLLSPY NAV
--------------------------------------------------------------- */
const progressEl = document.getElementById('scroll-progress');
const navIndicator = document.getElementById('nav-indicator');
let navLinks = [];
let sectionEls = [];
let lastActiveIdx = -1;
function recomputeSectionEls(){
  navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  sectionEls = navLinks.map(a => document.getElementById(a.dataset.section)).filter(Boolean);
  lastActiveIdx = -1;
  // Clicking a link should immediately bring it into view within the
  // horizontally-scrollable nav, not just jump the page — otherwise a
  // link near the scrolled-off edge stays hard to find after clicking it.
  navLinks.forEach(a => a.addEventListener('click', () => scrollNavLinkIntoView(a)));
}
function scrollNavLinkIntoView(link){
  const nav = document.getElementById('nav-links');
  if(!nav || !link) return;
  nav.scrollTo({
    left: link.offsetLeft - nav.clientWidth / 2 + link.offsetWidth / 2,
    behavior: 'smooth',
  });
}

function onScroll(){
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressEl.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';

  let activeIdx = -1;
  sectionEls.forEach((sec, i) => {
    const rect = sec.getBoundingClientRect();
    if(rect.top <= 120) activeIdx = i;
  });
  navLinks.forEach((a,i) => a.classList.toggle('active', i === activeIdx));
  if(activeIdx >= 0){
    const el = navLinks[activeIdx];
    navIndicator.style.opacity = '1';
    navIndicator.style.left = el.offsetLeft + 'px';
    navIndicator.style.width = el.offsetWidth + 'px';
    // Keep the active section's link scrolled into view as the visitor
    // scrolls the page up/down — the nav follows along automatically in
    // both directions instead of silently leaving it off-screen.
    if(activeIdx !== lastActiveIdx){
      lastActiveIdx = activeIdx;
      scrollNavLinkIntoView(el);
    }
  }else{
    navIndicator.style.opacity = '0';
  }
}
window.addEventListener('scroll', onScroll, { passive:true });
window.addEventListener('resize', onScroll);

/* ---------------------------------------------------------------
   16. SCROLL REVEAL (IntersectionObserver) — "page opening" effect
--------------------------------------------------------------- */
let revealObserver;
function refreshRevealObserver(){
  if(revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* ---------------------------------------------------------------
   17. HERO TERMINAL TYPING EFFECT
   Types the prompt, then streams each output line in turn — reads
   as a command actually executing rather than static text appearing.
--------------------------------------------------------------- */
let terminalRunToken = 0;
function typeHeroTerminal(){
  const myToken = ++terminalRunToken;
  const target = document.getElementById('type-target');
  const output = document.getElementById('terminal-output');
  const h = DATA.hero;
  const promptText = `whoami("${h.name}")`;
  const lines = [
    h.role,
    h.terminalLine2 || 'Building: AI agents & ML systems, research to deployment',
    h.terminalLine3 || 'Status: open to opportunities',
  ];
  output.innerHTML = '';
  target.textContent = '';

  function typeInto(el, text, speed, done){
    let i = 0;
    (function step(){
      if(myToken !== terminalRunToken) return; // a newer run superseded this one — stop silently
      if(i <= text.length){
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(step, speed);
      }else if(done){
        done();
      }
    })();
  }

  function typeLine(idx){
    if(myToken !== terminalRunToken) return;
    if(idx >= lines.length){
      const rest = document.createElement('span');
      rest.className = 'cursor';
      rest.textContent = '\u2588';
      output.lastElementChild?.appendChild(rest);
      return;
    }
    const lineEl = document.createElement('div');
    lineEl.className = 'terminal-out-line';
    const arrow = document.createElement('span');
    arrow.className = 'terminal-arrow';
    arrow.textContent = '→ ';
    const textSpan = document.createElement('span');
    lineEl.append(arrow, textSpan);
    output.appendChild(lineEl);
    typeInto(textSpan, lines[idx], 15, () => setTimeout(() => typeLine(idx + 1), 220));
  }

  typeInto(target, promptText, 38, () => setTimeout(() => typeLine(0), 300));
}

/* ---------------------------------------------------------------
   18. RESEARCH NOTEBOOK
--------------------------------------------------------------- */
function initNotebook(){
  const textarea = document.getElementById('notes-area');
  const status = document.getElementById('notes-status');
  textarea.value = loadNote();
  let t;
  textarea.addEventListener('input', () => {
    status.textContent = 'Saving…';
    clearTimeout(t);
    t = setTimeout(() => {
      saveNote(textarea.value);
      status.textContent = 'Saved locally in this browser · ' + new Date().toLocaleTimeString();
    }, 500);
  });
}

/* ---------------------------------------------------------------
   19. RESUME / CV GENERATION
   Builds a clean, print-ready document straight from DATA, opened
   in a new tab. The person uses the browser's Print dialog and
   picks "Save as PDF" as the destination — no external libraries,
   and it always reflects their current, live content.
--------------------------------------------------------------- */
function trimText(str, n){
  if(!str) return '';
  return str.length <= n ? str : str.slice(0, n - 1).trim() + '…';
}

function buildDocumentHTML(kind){
  const isCV = kind === 'cv';
  const h = DATA.hero, a = DATA.about, c = DATA.contact;
  const docTitle = `${h.name} — ${isCV ? 'CV' : 'Resume'}`;

  // Show the actual handle/address (e.g. "you@gmail.com", "github.com/you"),
  // not just the generic label — the way a real resume lists contact info.
  const contactValue = (link) => {
    if (/^mailto:/i.test(link)) return link.replace(/^mailto:/i, '');
    if (/^tel:/i.test(link)) return link.replace(/^tel:/i, '');
    return link.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  };
  const contactLine = c.links.map(l => `<a href="${escapeAttr(safeHref(l.link))}">${escapeHtml(contactValue(l.link))}</a>`).join(isCV ? ' &nbsp;|&nbsp; ' : ' &nbsp;·&nbsp; ');

  // Sections that are really just a flat list of names (like "AI Tools
  // Known") render as one continuous inline line, same treatment as Skills.
  const isFlatListSection = (sec) => /ai tools/i.test(sec.title || '');

  // Resume-only trimming (CV still shows everything): drop any section
  // that's explicitly about research papers, cut off a "Research Papers
  // Read" item and anything listed after it inside a mixed section, and
  // cap Projects to a manageable number so the resume stays scannable.
  // Projects are split into sections; keep the resume to ~5 projects in
  // total (Minor projects appear in the CV only).
  const RESUME_PROJECT_CAPS = { 'projects': 3, 'software-engineering-projects': 2, 'minor-projects': 0 };
  const isResearchPapersTitle = (title) => /research paper/i.test(title || '');

  const sectionsHTML = DATA.sections.map(sec => {
    if (!isCV && isResearchPapersTitle(sec.title)) return ''; // whole section is a papers bibliography — drop it from the resume

    let items = sec.items || [];
    if (!isCV) {
      const cutIdx = items.findIndex(it => isResearchPapersTitle(it.title));
      if (cutIdx !== -1) items = items.slice(0, cutIdx); // drop the papers sub-list and everything after it
      if (sec.id in RESUME_PROJECT_CAPS) items = items.slice(0, RESUME_PROJECT_CAPS[sec.id]);
    }
    if (!items.length) return '';

    if (isFlatListSection(sec)) {
      const line = items.map(item => escapeHtml(item.title)).join(' · ');
      return `
      <div class="doc-section" data-section-id="${escapeAttr(sec.id)}">
        <button class="sec-remove" contenteditable="false" title="Remove this whole section" onclick="this.closest('.doc-section').remove()">✕</button>
        <h2>${escapeHtml(sec.title)}</h2>
        <div class="skills-line">${line}</div>
      </div>`;
    }
    const itemsHTML = items.map((item, idx) => {
      const desc = isCV ? item.description : trimText(item.description, 160);
      return `
        <div class="doc-item" data-item-id="${escapeAttr(sec.id)}-${idx}">
          <button class="item-remove" contenteditable="false" title="Remove this item" onclick="this.closest('.doc-item').remove()">✕</button>
          <div class="doc-item-row">
            <span class="doc-item-title">${escapeHtml(item.title)}</span>
            <span class="doc-item-meta">${escapeHtml(item.meta || '')}</span>
          </div>
          ${desc ? `<div class="doc-item-desc">${escapeHtml(desc)}</div>` : ''}
          ${(isCV && item.tags && item.tags.length) ? `<div class="doc-item-tags">${item.tags.map(escapeHtml).join(' · ')}</div>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="doc-section" data-section-id="${escapeAttr(sec.id)}">
        <button class="sec-remove" contenteditable="false" title="Remove this whole section" onclick="this.closest('.doc-section').remove()">✕</button>
        <h2>${escapeHtml(sec.title)}</h2>
        ${itemsHTML}
      </div>`;
  }).join('');

  const summaryHTML = isCV
    ? `<div class="summary">${escapeHtml(a.bio)}</div><div class="quote">“${escapeHtml(a.quote)}”</div>`
    : `<div class="summary">${escapeHtml(h.pitch)}</div>`;

  // Owner-only extension: on the Resume doc (not CV), if the visitor is
  // signed in as Owner in this browser, offer "Tailor to Job Profile" —
  // paste a JD and the AI trims the Projects section down to what's
  // relevant and tightens the summary. Public visitors never see this;
  // it's gated purely on a local, already-issued session token, same
  // trust model as the rest of Owner Mode (see owner/auth.js).
  const ownerSession = !isCV ? getLocalOwnerSession() : null;
  let tailorBundle = { toolbarBtn: '', panelHtml: '', script: '' };
  let latexBundle = { toolbarBtn: '', script: '' };
  if (ownerSession) {
    tailorBundle = buildTailorBundle(ownerSession.token);
    latexBundle = buildLatexBundle();
  }

  return buildDocumentShell({
    docTitle,
    isCV,
    name: h.name,
    role: h.role,
    contactLine,
    bodyHTML: `
      ${summaryHTML}
      <div class="doc-section" data-section-id="skills">
        <button class="sec-remove" contenteditable="false" title="Remove this whole section" onclick="this.closest('.doc-section').remove()">✕</button>
        <h2>Skills</h2>
        <div class="skills-line">${DATA.skills.map(escapeHtml).join(' · ')}</div>
      </div>
      ${sectionsHTML}`,
    extraToolbarHTML: tailorBundle.toolbarBtn + latexBundle.toolbarBtn,
    extraPanelHTML: tailorBundle.panelHtml,
    extraScript: tailorBundle.script + latexBundle.script,
  });
}

/* ---------------------------------------------------------------
   Owner-only "Tailor to Job Profile" — reuses the existing, already-
   authenticated /api/resume/analyze endpoint (same one the ATS Resume
   Builder uses) rather than adding a new backend route. Local session
   check mirrors owner/auth.js's getSession() exactly.
--------------------------------------------------------------- */
function getLocalOwnerSession(){
  try {
    const raw = sessionStorage.getItem('owner_session_v1');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.token || !s.exp || Date.now() / 1000 > s.exp) return null;
    return s;
  } catch { return null; }
}

function buildTailorBundle(token){
  const candidateProfile = buildCandidateProfile(DATA);
  const toolbarBtn = `<button id="doc-tailor">Tailor to Job Profile</button>`;
  const panelHtml = `
  <div class="ai-edit-panel tailor-panel" id="tailor-panel">
    <h4>Tailor to Job Profile</h4>
    <p class="tailor-hint">Owner only. Paste a job description — the Projects section will be trimmed to what's relevant and the summary tightened.</p>
    <textarea id="tailor-jd" placeholder="Paste the job description here..."></textarea>
    <div class="ai-edit-row">
      <button id="tailor-go">Tailor Resume</button>
      <button class="secondary" id="tailor-cancel">Cancel</button>
    </div>
    <div class="ai-edit-status" id="tailor-status"></div>
  </div>`;
  const script = `
    (function(){
      const WORKER_URL = ${JSON.stringify(DOC_WORKER_URL)};
      const TOKEN = ${JSON.stringify(token)};
      const PROFILE = ${JSON.stringify(candidateProfile)};
      const docRoot = document.querySelector('.doc-root');
      const panel = document.getElementById('tailor-panel');
      const statusEl = document.getElementById('tailor-status');
      const jdEl = document.getElementById('tailor-jd');

      document.getElementById('doc-tailor').addEventListener('click', () => {
        panel.classList.add('open');
        jdEl.focus();
      });
      document.getElementById('tailor-cancel').addEventListener('click', () => panel.classList.remove('open'));

      document.getElementById('tailor-go').addEventListener('click', async () => {
        const jdText = jdEl.value.trim();
        if (!jdText) { statusEl.textContent = 'Paste a job description first.'; return; }
        statusEl.textContent = 'Analyzing against the job profile…';
        try {
          const res = await fetch(WORKER_URL + '/api/resume/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
            body: JSON.stringify({ jdText, profile: PROFILE }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { statusEl.textContent = data.error || 'Something went wrong.'; return; }

          if (data.tailoredSummary) {
            const summaryEl = docRoot.querySelector('.summary');
            if (summaryEl) summaryEl.textContent = data.tailoredSummary;
          }

          const keepIds = new Set(data.suggestedProjectIds || []);
          if (keepIds.size) {
            docRoot.querySelectorAll('.doc-section[data-section-id]').forEach((section) => {
              const items = section.querySelectorAll('.doc-item[data-item-id]');
              if (!items.length) return;
              const sectionHasMatches = Array.from(items).some(el => keepIds.has(el.dataset.itemId));
              if (!sectionHasMatches) return; // AI didn't address this section — leave it as-is
              items.forEach((el) => {
                if (!keepIds.has(el.dataset.itemId)) el.remove();
              });
            });
          }

          if (data.tailoredBullets) {
            Object.keys(data.tailoredBullets).forEach((id) => {
              const el = docRoot.querySelector('.doc-item[data-item-id="' + id + '"] .doc-item-desc');
              const bullets = data.tailoredBullets[id];
              if (el && Array.isArray(bullets) && bullets.length) el.textContent = bullets.join(' ');
            });
          }

          statusEl.textContent = 'Tailored. Review the changes, then Print / Save as PDF.';
          setTimeout(() => panel.classList.remove('open'), 1200);
        } catch (err) {
          statusEl.textContent = 'Could not reach the AI service — check your connection.';
        }
      });
    })();`;
  return { toolbarBtn, panelHtml, script };
}

/* ---------------------------------------------------------------
   Owner-only "Edit using LaTeX" — walks the current doc-root DOM
   (so it reflects any manual edits, AI edits, or Tailor to Job
   Profile changes already applied) and builds a plain, single-
   column, ATS-safe .tex file, zipped via JSZip, ready to upload to
   Overleaf as a New Project. Public visitors never see this button.
--------------------------------------------------------------- */
function buildLatexBundle(){
  const toolbarBtn = `<button id="doc-edit-latex" class="secondary">Edit using LaTeX</button>`;
  const script = `
    document.getElementById('doc-edit-latex').addEventListener('click', async () => {
      if (typeof JSZip === 'undefined') { alert('The zip library did not load — check your internet connection and try again.'); return; }
      try {
        const BS = String.fromCharCode(92); // a single backslash — avoids escaping headaches when building LaTeX source from JS strings
        const esc = (s) => String(s || '')
          .split(BS).join(BS + 'textbackslash{}')
          .replace(/([&%$#_{}])/g, BS + '$1')
          .split('~').join(BS + 'textasciitilde{}')
          .split('^').join(BS + 'textasciicircum{}');

        const root = document.querySelector('.doc-root');
        const nameEl = root.querySelector('h1');
        const roleEl = root.querySelector('.role');
        const contactEl = root.querySelector('.contact');
        const name = nameEl ? nameEl.textContent.trim() : 'Resume';
        const role = roleEl ? roleEl.textContent.trim() : '';
        const contact = contactEl ? contactEl.textContent.trim() : '';

        const lines = [];
        const push = (s) => lines.push(s);
        push(BS + 'documentclass[letterpaper,10.5pt]{article}');
        push(BS + 'usepackage[margin=0.65in]{geometry}');
        push(BS + 'usepackage{titlesec}');
        push(BS + 'usepackage{enumitem}');
        push(BS + 'usepackage{hyperref}');
        push(BS + 'usepackage[T1]{fontenc}');
        push(BS + 'pagestyle{empty}');
        push(BS + 'raggedbottom');
        push(BS + 'raggedright');
        push(BS + 'setlist[itemize]{leftmargin=0.18in, itemsep=1pt, topsep=2pt, parsep=0pt}');
        push(BS + 'titleformat{' + BS + 'section}{' + BS + 'bfseries' + BS + 'large}{}{0em}{}[' + BS + 'vspace{-4pt}' + BS + 'hrule' + BS + 'vspace{4pt}]');
        push(BS + 'titlespacing{' + BS + 'section}{0pt}{10pt}{4pt}');
        push(BS + 'begin{document}');
        push(BS + 'begin{center}');
        push('{' + BS + 'LARGE ' + BS + 'textbf{' + esc(name) + '}}' + BS + BS);
        if (role) push(esc(role) + BS + BS);
        if (contact) push(esc(contact));
        push(BS + 'end{center}');
        push('');

        root.querySelectorAll(':scope > .summary, :scope > .quote').forEach(el => {
          const t = esc(el.textContent);
          push(el.classList.contains('quote') ? (BS + 'textit{' + t + '}') : t);
          push('');
        });

        root.querySelectorAll('.doc-section').forEach(sec => {
          const h = sec.querySelector('h2');
          if (!h) return;
          push(BS + 'section*{' + esc(h.textContent) + '}');
          const skillsLine = sec.querySelector('.skills-line');
          if (skillsLine) { push(esc(skillsLine.textContent)); push(''); }
          sec.querySelectorAll('.doc-item').forEach(item => {
            const title = item.querySelector('.doc-item-title, h3');
            const meta = item.querySelector('.doc-item-meta');
            const desc = item.querySelector('.doc-item-desc');
            const tags = item.querySelector('.doc-item-tags');
            if (title) {
              let row = BS + 'textbf{' + esc(title.textContent) + '}';
              if (meta && meta.textContent) row += ' ' + BS + 'hfill ' + esc(meta.textContent);
              push(row + ' ' + BS + BS);
            }
            if (desc) push(esc(desc.textContent) + ' ' + BS + BS);
            if (tags) push(BS + 'textit{' + esc(tags.textContent) + '} ' + BS + BS);
            const ul = item.querySelector('ul');
            if (ul) {
              push(BS + 'begin{itemize}');
              ul.querySelectorAll('li').forEach(li => push('  ' + BS + 'item ' + esc(li.textContent)));
              push(BS + 'end{itemize}');
            }
            push('');
          });
        });

        push(BS + 'end{document}');
        const tex = lines.join(String.fromCharCode(10));

        const zip = new JSZip();
        const base = name.replace(/\\s+/g, '-') || 'Resume';
        zip.file(base + '-Resume.tex', tex);
        zip.file('README.txt', 'Upload this .zip to Overleaf: New Project > Upload Project > select this .zip.\\nThis is a plain, single-column, ATS-safe layout with no photo/icons/tables — edit freely in Overleaf.');
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = base + '-LaTeX-Overleaf.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('Could not generate the LaTeX project: ' + err.message);
      }
    });`;
  return { toolbarBtn, script };
}

/* ---------------------------------------------------------------
   AI-assisted editing, shared by both the Resume and CV documents.
   Select some text inside the generated doc, describe the change,
   and only that selection is sent to the Worker's public, rate-
   limited /api/resume/edit endpoint (Gemini-backed) and swapped
   back in — nothing else in the document is touched.
--------------------------------------------------------------- */
const DOC_WORKER_URL = window.OWNER_WORKER_URL || 'https://portfolio-owner-backend.rishichamp.workers.dev';

const AI_EDIT_CSS = `
  .ai-edit-panel{ display:none; position:fixed; right:20px; bottom:20px; width:320px; background:#fff; border:1px solid #ccc; border-radius:10px; box-shadow:0 8px 30px rgba(0,0,0,.18); padding:16px; font-family: Arial, sans-serif; z-index:20; }
  .ai-edit-panel.open{ display:block; }
  .ai-edit-panel h4{ margin:0 0 8px; font-size:13px; }
  .ai-edit-panel textarea{ width:100%; height:60px; font-family: Arial, sans-serif; font-size:12.5px; padding:8px; border:1px solid #ccc; border-radius:6px; resize:vertical; }
  .ai-edit-panel .ai-edit-row{ display:flex; gap:8px; margin-top:10px; }
  .ai-edit-panel button{ font-family: Arial, sans-serif; font-size:12.5px; padding:7px 14px; border-radius:6px; border:1px solid #333; background:#111; color:#fff; cursor:pointer; }
  .ai-edit-panel button.secondary{ background:#fff; color:#111; }
  .ai-edit-panel .ai-edit-status{ font-size:11.5px; color:#666; margin-top:8px; min-height:14px; }
`;

const AI_EDIT_PANEL_HTML = `
  <div class="ai-edit-panel" id="ai-edit-panel">
    <h4 id="ai-edit-title">Edit with AI</h4>
    <textarea id="ai-edit-instruction" placeholder="e.g. make this more concise, fix grammar, emphasise leadership..."></textarea>
    <div class="ai-edit-row">
      <button id="ai-edit-go">Generate</button>
      <button class="secondary" id="ai-edit-cancel">Cancel</button>
    </div>
    <div class="ai-edit-status" id="ai-edit-status"></div>
  </div>`;

const AI_EDIT_SCRIPT = `
    (function(){
      const WORKER_URL = ${JSON.stringify(DOC_WORKER_URL)};
      const docRoot = document.querySelector('.doc-root');
      const panel = document.getElementById('ai-edit-panel');
      const statusEl = document.getElementById('ai-edit-status');
      const titleEl = document.getElementById('ai-edit-title');
      const instructionEl = document.getElementById('ai-edit-instruction');
      let savedRange = null;

      document.getElementById('doc-edit-ai').addEventListener('click', () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !docRoot.contains(sel.anchorNode)) {
          alert('Select the text you want the AI to revise first (click and drag over it), then click "Edit with AI".');
          return;
        }
        savedRange = sel.getRangeAt(0).cloneRange();
        const selectedText = savedRange.toString();
        titleEl.textContent = 'Edit with AI — "' + (selectedText.length > 40 ? selectedText.slice(0, 40) + '…' : selectedText) + '"';
        statusEl.textContent = '';
        instructionEl.value = '';
        panel.classList.add('open');
        instructionEl.focus();
      });

      document.getElementById('ai-edit-cancel').addEventListener('click', () => { panel.classList.remove('open'); });

      document.getElementById('ai-edit-go').addEventListener('click', async () => {
        if (!savedRange) return;
        const instruction = instructionEl.value.trim();
        if (!instruction) { statusEl.textContent = 'Describe the change you want first.'; return; }
        const selectedText = savedRange.toString();
        statusEl.textContent = 'Thinking…';
        try {
          const res = await fetch(WORKER_URL + '/api/resume/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: selectedText, instruction }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { statusEl.textContent = data.error || 'Something went wrong.'; return; }
          savedRange.deleteContents();
          savedRange.insertNode(document.createTextNode(data.edited));
          panel.classList.remove('open');
        } catch (err) {
          statusEl.textContent = 'Could not reach the AI service — check your connection.';
        }
      });
    })();`;

/* ---------------------------------------------------------------
   "Save as Word (.docx)" — shared by Resume, CV, and the ATS export.
   Walks the current .doc-root DOM (so it captures anything already
   changed via manual edits, Insert Photo, Edit with AI, or Tailor to
   Job Profile) and builds a real, further-editable .docx using the
   docx.js library loaded from a CDN in <head>. From Word, the person
   can then use File > Save As > PDF if they want a PDF instead.
--------------------------------------------------------------- */
const DOCX_CDN_SCRIPT = `<script src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js"><\/script>`;
const JSZIP_CDN_SCRIPT = `<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"><\/script>`;

const DOCX_EXPORT_SCRIPT = `
    document.getElementById('doc-save-docx').addEventListener('click', async () => {
      if (typeof docx === 'undefined') { alert('The Word export library did not load — check your internet connection and try again.'); return; }
      try {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = docx;
        const root = document.querySelector('.doc-root');
        const children = [];
        const nameEl = root.querySelector('h1');
        const roleEl = root.querySelector('.role');
        const contactEl = root.querySelector('.contact');
        if (nameEl) children.push(new Paragraph({ text: nameEl.textContent, heading: HeadingLevel.TITLE }));
        if (roleEl) children.push(new Paragraph({ children: [ new TextRun({ text: roleEl.textContent, italics: true }) ] }));
        if (contactEl) children.push(new Paragraph({ text: contactEl.textContent }));

        const photoImg = root.querySelector('#doc-photo img, .doc-photo img');
        if (photoImg && photoImg.src && photoImg.src.indexOf('data:') === 0) {
          try {
            const base64 = photoImg.src.split(',')[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            children.push(new Paragraph({ children: [ new ImageRun({ data: bytes, transformation: { width: 100, height: 100 } }) ] }));
          } catch (e) { /* skip photo if it can't be decoded */ }
        }

        root.querySelectorAll(':scope > .summary, :scope > .quote').forEach(el => {
          children.push(new Paragraph({ children: [ new TextRun({ text: el.textContent, italics: el.classList.contains('quote') }) ] }));
        });

        root.querySelectorAll('.doc-section').forEach(sec => {
          const h = sec.querySelector('h2');
          if (h) children.push(new Paragraph({ text: h.textContent, heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
          const skillsLine = sec.querySelector('.skills-line');
          if (skillsLine) children.push(new Paragraph({ text: skillsLine.textContent }));
          const p = sec.querySelector('p'); // ATS-builder doc's Summary/Skills sections use a plain <p>
          if (p) children.push(new Paragraph({ text: p.textContent }));
          sec.querySelectorAll('.doc-item').forEach(item => {
            const title = item.querySelector('.doc-item-title, h3');
            const meta = item.querySelector('.doc-item-meta');
            const desc = item.querySelector('.doc-item-desc');
            const tags = item.querySelector('.doc-item-tags');
            const runs = [];
            if (title) runs.push(new TextRun({ text: title.textContent, bold: true }));
            if (meta && meta.textContent) runs.push(new TextRun({ text: '   ' + meta.textContent, italics: true, size: 18 }));
            if (runs.length) children.push(new Paragraph({ children: runs }));
            if (desc) children.push(new Paragraph({ text: desc.textContent }));
            if (tags) children.push(new Paragraph({ children: [ new TextRun({ text: tags.textContent, italics: true }) ] }));
            const ul = item.querySelector('ul');
            if (ul) ul.querySelectorAll('li').forEach(li => children.push(new Paragraph({ text: li.textContent, bullet: { level: 0 } })));
          });
        });

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (nameEl ? nameEl.textContent.trim().replace(/\\s+/g, '_') : 'Resume') + '.docx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('Could not generate the Word file: ' + err.message);
      }
    });`;

/* ---------------------------------------------------------------
   Shared "document" shell used by the Resume/CV generator here and
   by the Resume Builder's ATS export (owner/resume-builder.js).
   Two looks:
   - Resume: compact, grayscale, single-column — kept deliberately
     plain so it stays easy for ATS parsers to read.
   - CV: a single-column academic layout in the spirit of a classic
     Overleaf/LaTeX CV template (small-caps header, ruled section
     headings, serif body face).
   Both are opened in a new tab as a real, editable page — click into
   any text and change it, and use "Insert Photo" to drop in a photo
   before printing/saving as PDF. Nothing here touches DATA or
   localStorage; it only affects this one generated tab.
--------------------------------------------------------------- */
function buildDocumentShell({ docTitle, isCV, name, role, contactLine, bodyHTML, extraToolbarHTML = '', extraPanelHTML = '', extraScript = '' }){
  const sharedCSS = `
  @media print { .toolbar{ display:none !important; } body{ padding:0 !important; } }
  *{ box-sizing:border-box; }
  body{ color:#111; max-width:800px; margin:0 auto; padding:50px 60px; line-height:1.5; }
  .toolbar{ position:sticky; top:0; background:#fff; border-bottom:1px solid #ddd; padding:12px 0; margin-bottom:24px; display:flex; gap:10px; justify-content:center; z-index:10; flex-wrap:wrap; }
  .toolbar button{ font-family: Arial, sans-serif; font-size:13px; padding:9px 18px; border-radius:6px; border:1px solid #333; background:#111; color:#fff; cursor:pointer; }
  .toolbar button.secondary{ background:#fff; color:#111; }
  .doc-root{ outline:none; }
  .doc-root:focus{ outline:none; }
  .doc-header{ display:flex; align-items:flex-start; justify-content:space-between; gap:24px; }
  .doc-photo{ display:none; width:108px; height:108px; border-radius:50%; overflow:hidden; resize:both; flex:0 0 auto; border:1px solid #ccc; }
  .doc-photo img{ width:100%; height:100%; object-fit:cover; display:block; }
  .doc-hint{ font-family: Arial, sans-serif; font-size:11px; color:#999; text-align:center; margin-top:-8px; margin-bottom:18px; }
  .doc-section{ margin-bottom: 20px; page-break-inside: avoid; position:relative; }
  .doc-item{ margin-bottom:12px; page-break-inside: avoid; position:relative; }
  .doc-item-row{ display:flex; justify-content:space-between; gap:12px; }
  .doc-item-title{ font-weight:bold; }
  .sec-remove, .item-remove{ display:none; position:absolute; top:0; right:0; width:20px; height:20px; line-height:18px; text-align:center; font-family: Arial, sans-serif; font-size:11px; color:#a00; background:#fff; border:1px solid #a00; border-radius:50%; cursor:pointer; padding:0; }
  body.manual-edit-on .sec-remove, body.manual-edit-on .item-remove{ display:block; }
  body.manual-edit-on .doc-section, body.manual-edit-on .doc-item{ outline:1px dashed #ddd; padding:4px 24px 4px 4px; }
  `;

  const kindCSS = isCV ? `
  body{ font-family: 'EB Garamond', Georgia, 'Times New Roman', serif; }
  .doc-header{ flex-direction:column; align-items:center; text-align:center; }
  .doc-header .doc-headtext{ width:100%; }
  h1{ font-size:32px; margin:0 0 2px; font-variant:small-caps; letter-spacing:.03em; }
  .role{ font-size:14px; font-style:italic; color:#333; margin-bottom:8px; }
  .contact{ font-size:12px; color:#333; font-family: Arial, sans-serif; margin-bottom:6px; }
  .contact a{ color:#1f3a5f; text-decoration:none; }
  body > .doc-root > .doc-header{ border-bottom:2px solid #1f3a5f; padding-bottom:14px; margin-bottom:20px; }
  .summary{ font-size:13px; margin-bottom: 16px; }
  .quote{ font-style:italic; font-size:13px; color:#333; margin: 0 0 20px; border-left:2px solid #1f3a5f; padding-left:12px; }
  .doc-section h2{ font-family: Arial, sans-serif; font-size:12.5px; font-variant:small-caps; letter-spacing:.08em; color:#1f3a5f; border-bottom:1.5px solid #1f3a5f; padding-bottom:4px; margin-bottom:10px; }
  .doc-item-row{ font-size:13.5px; }
  .doc-item-meta{ font-family: Arial, sans-serif; font-size:11px; color:#555; white-space:nowrap; font-style:italic; }
  .doc-item-desc{ font-size:12.5px; color:#222; margin-top:3px; }
  .doc-item-tags{ font-family: Arial, sans-serif; font-size:10.5px; color:#1f3a5f; margin-top:3px; }
  .skills-line{ font-size:12.5px; margin-bottom:20px; }
  ` : `
  body{ font-family: Georgia, 'Times New Roman', serif; }
  .doc-header .doc-headtext{ width:100%; }
  h1{ font-size:26px; margin:0 0 2px; }
  .role{ font-size:14px; color:#333; margin-bottom:6px; font-family: Arial, sans-serif; }
  .contact{ font-size:12px; color:#333; font-family: Arial, sans-serif; margin-bottom: 18px; }
  .contact a{ color:#111; text-decoration:none; border-bottom:1px solid #999; }
  .summary{ font-size:13px; margin-bottom: 20px; }
  .doc-section h2{ font-family: Arial, sans-serif; font-size:12px; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px; }
  .doc-item-row{ font-size:13.5px; }
  .doc-item-meta{ font-family: Arial, sans-serif; font-size:11px; color:#555; white-space:nowrap; }
  .doc-item-desc{ font-size:12.5px; color:#222; margin-top:2px; }
  .doc-item-tags{ font-family: Arial, sans-serif; font-size:10.5px; color:#666; margin-top:3px; }
  .skills-line{ font-size:12.5px; margin-bottom:20px; }
  `;

  const fontLink = isCV ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap" />` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(docTitle)}</title>
${fontLink}
${DOCX_CDN_SCRIPT}
${JSZIP_CDN_SCRIPT}
<style>${sharedCSS}${kindCSS}${AI_EDIT_CSS}
  .tailor-panel{ left:20px; right:auto; }
  .tailor-hint{ font-size:11px; color:#777; margin:0 0 8px; }
</style>
</head>
<body>
  <div class="toolbar">
    <button id="doc-toggle-edit">Lock Editing</button>
    <button id="doc-manual-edit">Remove Sections/Items</button>
    <button id="doc-insert-photo">Insert Photo</button>
    <button id="doc-edit-ai">Edit with AI</button>
    ${extraToolbarHTML}
    <button onclick="window.print()">Print / Save as PDF</button>
    <button id="doc-save-docx" class="secondary">Save as Word (.docx)</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>
  <div class="doc-root" contenteditable="true">
    <div class="doc-header">
      <div class="doc-headtext">
        <h1>${escapeHtml(name)}</h1>
        <div class="role">${escapeHtml(role)}</div>
        <div class="contact">${contactLine}</div>
      </div>
      <div class="doc-photo" id="doc-photo" contenteditable="false"></div>
    </div>
    ${bodyHTML}
  </div>
  <p class="doc-hint">Click any text to edit it directly, select text and use "Edit with AI" for AI-assisted edits, "Remove Sections/Items" for one-click deletes, or "Insert Photo" to add your photo — then Print / Save as PDF or Save as Word.</p>
  <input type="file" id="doc-photo-input" accept="image/*" hidden />
  ${AI_EDIT_PANEL_HTML}
  ${extraPanelHTML}
  <script>
    document.getElementById('doc-toggle-edit').addEventListener('click', () => {
      const root = document.querySelector('.doc-root');
      const btn = document.getElementById('doc-toggle-edit');
      const editable = root.getAttribute('contenteditable') !== 'false';
      root.setAttribute('contenteditable', editable ? 'false' : 'true');
      btn.textContent = editable ? 'Enable Editing' : 'Lock Editing';
    });
    document.getElementById('doc-manual-edit').addEventListener('click', () => {
      document.body.classList.toggle('manual-edit-on');
      const on = document.body.classList.contains('manual-edit-on');
      document.getElementById('doc-manual-edit').textContent = on ? 'Done Removing' : 'Remove Sections/Items';
    });
    document.getElementById('doc-insert-photo').addEventListener('click', () => document.getElementById('doc-photo-input').click());
    document.getElementById('doc-photo-input').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const slot = document.getElementById('doc-photo');
        slot.innerHTML = '<img src="' + reader.result + '" alt="Photo" />';
        slot.style.display = 'block';
      };
      reader.readAsDataURL(f);
    });
    ${AI_EDIT_SCRIPT}
    ${DOCX_EXPORT_SCRIPT}
    ${extraScript}
  <\/script>
</body>
</html>`;
}

function openGeneratedDocument(kind){
  const html = buildDocumentHTML(kind);
  const win = window.open('', '_blank');
  if(!win){ alert('Please allow pop-ups for this site to generate the document.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

document.getElementById('create-resume-btn').addEventListener('click', () => openGeneratedDocument('resume'));
document.getElementById('publish-content-btn').addEventListener('click', async () => {
  const btn = document.getElementById('publish-content-btn');
  const status = document.getElementById('publish-status');
  btn.disabled = true;
  status.className = 'publish-status';
  status.textContent = 'Publishing…';
  const ok = await pushPortfolioDataToServer(DATA);
  btn.disabled = false;
  if(ok){
    status.className = 'publish-status ok';
    status.textContent = 'Published — live on every device now.';
  }else{
    status.className = 'publish-status error';
    status.textContent = 'Could not publish — check your connection and try again.';
  }
  setTimeout(() => { status.textContent = ''; status.className = 'publish-status'; }, 6000);
});
document.getElementById('create-cv-btn').addEventListener('click', () => openGeneratedDocument('cv'));
document.getElementById('nav-resume-btn').addEventListener('click', () => openGeneratedDocument('resume'));

/* ---------------------------------------------------------------
   20. UTILITIES
--------------------------------------------------------------- */
function slugify(s){ return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(str){ return escapeHtml(str).replace(/`/g,'&#96;'); }
// Links come from saved content: only allow web, mail and phone links (or
// scheme-less/relative ones), so a "javascript:" URL can never run on click.
function safeHref(url){
  const u = String(url ?? '').trim();
  return /^(https?:|mailto:|tel:)/i.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : '#';
}

/* ---------------------------------------------------------------
   21. INIT
--------------------------------------------------------------- */
renderAll();
typeHeroTerminal();
onScroll();

/* ---------------------------------------------------------------
   22. SERVER CONTENT SYNC
   Keeps every device/browser showing the same content instead of
   whatever happens to be cached locally. Runs after the first paint
   so the page is never blank waiting on a network round trip — if
   the server has different content, it swaps in seamlessly. See
   data.js for what happens on a brand new (empty) server.
--------------------------------------------------------------- */
syncPortfolioDataFromServer((serverData) => {
  if(editing) return; // don't clobber in-progress edits with a background sync
  DATA = serverData;
  renderAll();
  typeHeroTerminal();
  onScroll();
});

// The check above runs once at page load, before there's any chance to
// have signed in yet — so it can only ever pull server content, never
// publish local content for the first time. Re-running it right after
// a successful sign-in is what actually lets the one-time auto-publish
// happen, since isAuthenticated() only becomes true at that point.
document.addEventListener('owner:signedin', () => {
  syncPortfolioDataFromServer((serverData) => {
    if(editing) return;
    DATA = serverData;
    renderAll();
    typeHeroTerminal();
    onScroll();
  });
});