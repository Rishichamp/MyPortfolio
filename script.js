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
    const section = document.createElement('section');
    section.id = sec.id;
    section.className = 'section reveal';
    section.innerHTML = `
      <div class="dyn-section-head">
        <div>
          <p class="section-eyebrow">${escapeHtml(sec.title)}</p>
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
      <div class="${sec.kind === 'timeline' ? 'timeline' : 'card-grid'}" data-role="items"></div>
      <button class="add-entry-btn" data-target="${sec.id}">+ Add ${sec.kind === 'timeline' ? 'entry' : 'entry'}</button>
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
      itemsWrap.appendChild(sec.kind === 'timeline' ? renderTimelineItem(sec, item, i) : renderCard(sec, item, i));
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
  card.addEventListener('click', () => { if(!editing && hasLink) window.open(item.link, '_blank', 'noopener'); });
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
  if(hasLink){ el.style.cursor = 'pointer'; el.addEventListener('click', (e) => { if(!editing && !e.target.closest('.entry-controls, .timeline-controls')) window.open(item.link, '_blank', 'noopener'); }); }
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
    `<a class="contact-link stagger" style="--i:${i}" href="${escapeAttr(c.link)}" target="_blank" rel="noopener">${ICONS[c.icon]||ICONS.link}<span>${escapeHtml(c.title)}</span></a>`
  ).join('');
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
      <label>Role / title</label><input id="bm-role" value="${escapeAttr(h.role)}" />
      <label>Pitch</label><textarea id="bm-pitch" rows="3">${escapeHtml(h.pitch)}</textarea>
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
      <textarea id="bm-links" rows="4">${c.links.map(l=>`${l.title} | ${l.link}`).join('\n')}</textarea>
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
--------------------------------------------------------------- */
function typeHeroTerminal(){
  const target = document.getElementById('type-target');
  const output = document.getElementById('terminal-output');
  const h = DATA.hero;
  const text = `whoami("${h.name}")`;
  let i = 0;
  const speed = 38;
  function step(){
    if(i <= text.length){
      target.textContent = text.slice(0, i);
      i++;
      setTimeout(step, speed);
    }else{
      output.textContent = `→ ${h.role}\n→ Building: ML systems, from data to deployment\n→ Status: open to opportunities`;
    }
  }
  step();
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

  const contactLine = c.links.map(l => `<a href="${escapeAttr(l.link)}">${escapeHtml(l.title)}</a>`).join(' &nbsp;·&nbsp; ');

  const sectionsHTML = DATA.sections.map(sec => {
    const items = (sec.items || []).map(item => {
      const desc = isCV ? item.description : trimText(item.description, 160);
      return `
        <div class="doc-item">
          <div class="doc-item-row">
            <span class="doc-item-title">${escapeHtml(item.title)}</span>
            <span class="doc-item-meta">${escapeHtml(item.meta || '')}</span>
          </div>
          ${desc ? `<div class="doc-item-desc">${escapeHtml(desc)}</div>` : ''}
          ${(isCV && item.tags && item.tags.length) ? `<div class="doc-item-tags">${item.tags.map(escapeHtml).join(' · ')}</div>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="doc-section">
        <h2>${escapeHtml(sec.title)}</h2>
        ${items}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(docTitle)}</title>
<style>
  @media print { .toolbar{ display:none !important; } body{ padding:0 !important; } }
  *{ box-sizing:border-box; }
  body{ font-family: Georgia, 'Times New Roman', serif; color:#111; max-width:800px; margin:0 auto; padding:50px 60px; line-height:1.5; }
  .toolbar{ position:sticky; top:0; background:#fff; border-bottom:1px solid #ddd; padding:12px 0; margin-bottom:24px; display:flex; gap:10px; justify-content:center; }
  .toolbar button{ font-family: Arial, sans-serif; font-size:13px; padding:9px 18px; border-radius:6px; border:1px solid #333; background:#111; color:#fff; cursor:pointer; }
  .toolbar button.secondary{ background:#fff; color:#111; }
  h1{ font-size:26px; margin:0 0 2px; }
  .role{ font-size:14px; color:#333; margin-bottom:6px; font-family: Arial, sans-serif; }
  .contact{ font-size:12px; color:#333; font-family: Arial, sans-serif; margin-bottom: 18px; }
  .contact a{ color:#111; text-decoration:none; border-bottom:1px solid #999; }
  .summary{ font-size:13px; margin-bottom: 20px; }
  .quote{ font-style:italic; font-size:13px; color:#333; margin: 0 0 20px; border-left:2px solid #999; padding-left:12px; }
  .doc-section{ margin-bottom: 20px; page-break-inside: avoid; }
  .doc-section h2{ font-family: Arial, sans-serif; font-size:12px; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px; }
  .doc-item{ margin-bottom:12px; page-break-inside: avoid; }
  .doc-item-row{ display:flex; justify-content:space-between; gap:12px; font-size:13.5px; }
  .doc-item-title{ font-weight:bold; }
  .doc-item-meta{ font-family: Arial, sans-serif; font-size:11px; color:#555; white-space:nowrap; }
  .doc-item-desc{ font-size:12.5px; color:#222; margin-top:2px; }
  .doc-item-tags{ font-family: Arial, sans-serif; font-size:10.5px; color:#666; margin-top:3px; }
  .skills-line{ font-size:12.5px; margin-bottom:20px; }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>
  <h1>${escapeHtml(h.name)}</h1>
  <div class="role">${escapeHtml(h.role)}</div>
  <div class="contact">${contactLine}</div>
  ${isCV ? `
    <div class="summary">${escapeHtml(a.bio)}</div>
    <div class="quote">“${escapeHtml(a.quote)}”</div>
  ` : `
    <div class="summary">${escapeHtml(h.pitch)}</div>
  `}
  <div class="doc-section">
    <h2>Skills</h2>
    <div class="skills-line">${DATA.skills.map(escapeHtml).join(' · ')}</div>
  </div>
  ${sectionsHTML}
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

/* ---------------------------------------------------------------
   21. INIT
--------------------------------------------------------------- */
renderAll();
typeHeroTerminal();
onScroll();
