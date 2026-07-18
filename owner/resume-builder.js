/* ============================================================
   RESUME BUILDER — Owner Mode only
   Never invents achievements: everything the AI proxy (Worker)
   returns must trace back to the CANDIDATE_PROFILE built from
   data.js. This file just handles I/O, rendering, and export.
   ============================================================ */
(function () {
  const WORKER_URL = window.OWNER_WORKER_URL || 'https://portfolio-owner-backend.rishichamp.workers.dev';
  let profile = null;
  let lastAnalysis = null;

  // ---------- 1. Auth guard ----------
  async function guard() {
    console.log('[RB-DEBUG] guard() starting. raw sessionStorage value:', sessionStorage.getItem('owner_session_v1'));
    console.log('[RB-DEBUG] rb-signin element found?', !!document.getElementById('rb-signin'));
    console.log('[RB-DEBUG] window.OwnerAuth exists?', typeof window.OwnerAuth, window.OwnerAuth);
    document.getElementById('rb-signin').addEventListener('click', async () => {
      console.log('[RB-DEBUG] Sign-in button clicked.');
      const ok = await window.OwnerAuth.requireOwnerAuth();
      console.log('[RB-DEBUG] requireOwnerAuth() resolved to:', ok);
      if (ok) show();
    });
    const authed = await window.OwnerAuth.isAuthenticated();
    console.log('[RB-DEBUG] isAuthenticated() on page load resolved to:', authed);
    if (authed) show();
    console.log('[RB-DEBUG] guard() finished.');
  }
  function show() {
    console.log('[RB-DEBUG] show() called.');
    const locked = document.getElementById('rb-locked');
    const app = document.getElementById('rb-app');
    console.log('[RB-DEBUG] rb-locked element:', locked, 'rb-app element:', app);
    locked.hidden = true;
    app.hidden = false;
    console.log('[RB-DEBUG] after setting hidden — rb-locked.hidden:', locked.hidden, 'rb-app.hidden:', app.hidden);
    try {
      profile = buildCandidateProfile(loadPortfolioData());
      console.log('[RB-DEBUG] profile built successfully:', profile);
    } catch (err) {
      console.error('[RB-DEBUG] buildCandidateProfile/loadPortfolioData threw:', err);
    }
  }
  document.getElementById('rb-signout').addEventListener('click', () => {
    window.OwnerAuth.logout();
    location.reload();
  });

  // ---------- 2. JD input: file drop / browse / paste ----------
  const dropzone = document.getElementById('rb-dropzone');
  const fileInput = document.getElementById('rb-file');
  const fileNameEl = document.getElementById('rb-file-name');
  const jdTextarea = document.getElementById('rb-jd-text');

  document.getElementById('rb-browse').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => e.target.files[0] && handleFile(e.target.files[0]));
  ['dragover', 'dragenter'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));
  dropzone.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });

  async function handleFile(file) {
    fileNameEl.textContent = file.name;
    setStatus('Reading file…');
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await extractPdfText(file);
      } else if (file.name.endsWith('.docx')) {
        text = await extractDocxText(file);
      } else {
        text = await file.text();
      }
      jdTextarea.value = text.trim();
      setStatus(`Loaded ${file.name} (${text.trim().split(/\s+/).length} words).`);
    } catch (err) {
      setStatus('Could not read that file: ' + err.message, true);
    }
  }

  async function extractPdfText(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('The PDF reader library failed to load — check your connection and reload the page.');
    }
    const buf = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n';
    }
    return text;
  }
  async function extractDocxText(file) {
    if (typeof mammoth === 'undefined') {
      throw new Error('The DOCX reader library failed to load — check your connection and reload the page.');
    }
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }

  function setStatus(msg, isError = false) {
    const el = document.getElementById('rb-status');
    el.textContent = msg;
    el.classList.toggle('error', isError);
  }

  // ---------- 3. Analyze ----------
  const analyzeBtn = document.getElementById('rb-analyze');
  analyzeBtn.addEventListener('click', async () => {
    const jdText = jdTextarea.value.trim();
    if (!jdText) { setStatus('Add a job description first.', true); return; }
    if (!(await window.OwnerAuth.isAuthenticated())) { await window.OwnerAuth.requireOwnerAuth(); return; }
    const session = window.OwnerAuth.getSession();
    if (!session) { setStatus('Your session expired — please sign in again.', true); await window.OwnerAuth.requireOwnerAuth(); return; }

    analyzeBtn.disabled = true;
    setStatus('Analyzing against your portfolio…');
    try {
      // AI generation genuinely can take a while, but it must still
      // give up eventually rather than hang forever with no feedback.
      const res = await window.OwnerAuth.fetchWithTimeout(`${WORKER_URL}/api/resume/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ jdText, profile }),
      }, 60000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Analysis failed (${res.status}).`);
      lastAnalysis = data;
      renderResults(data);
      setStatus('Analysis complete.');
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('The request took too long and was cancelled. Please try again.', true);
      } else {
        setStatus(err.message || 'Something went wrong. Please try again.', true);
      }
    } finally {
      analyzeBtn.disabled = false;
    }
  });

  // ---------- 4. Render results + editable draft ----------
  function renderResults(data) {
    document.getElementById('rb-results').hidden = false;
    document.getElementById('rb-editor').hidden = false;

    const circumference = 327;
    const fillEl = document.getElementById('rb-gauge-fill');
    const offset = circumference - (circumference * Math.max(0, Math.min(100, data.matchScore || 0))) / 100;
    requestAnimationFrame(() => { fillEl.style.strokeDashoffset = offset; });

    const scoreNum = document.getElementById('rb-score-num');
    scoreNum.textContent = '0';
    requestAnimationFrame(() => {
      scoreNum.textContent = String(data.matchScore || 0);
      if (window.PortfolioAnimations) window.PortfolioAnimations.initAll();
    });

    fillChips('rb-matched', data.matchedKeywords);
    fillChips('rb-missing', data.missingKeywords);
    const gapsEl = document.getElementById('rb-gaps');
    gapsEl.innerHTML = (data.gaps || []).map(g => `<li>${escapeHtml(g)}</li>`).join('') || '<li>None noted.</li>';

    document.getElementById('rb-summary').value = data.atsResume?.summary || data.tailoredSummary || '';
    document.getElementById('rb-skills').value = (data.atsResume?.skills || []).join(', ');

    renderExpBlock('rb-exp-block', 'Experience / Research', data.atsResume?.experience || []);
    renderExpBlock('rb-proj-block', 'Projects', data.atsResume?.projects || []);
  }
  function fillChips(id, items) {
    document.getElementById(id).innerHTML = (items || []).map(k => `<span>${escapeHtml(k)}</span>`).join('') || '<span>—</span>';
  }
  function renderExpBlock(containerId, heading, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<h3>${heading}</h3>` + items.map((it, i) => `
      <div class="rb-exp-item" data-id="${escapeAttr(it.id || '')}">
        <h4>${escapeHtml(it.id || `Item ${i + 1}`)}</h4>
        <textarea rows="3">${escapeHtml((it.bullets || []).join('\n'))}</textarea>
      </div>`).join('');
  }
  function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }

  function collectEditedResume() {
    const bullets = (containerId) => [...document.querySelectorAll(`#${containerId} .rb-exp-item`)].map(el => ({
      id: el.dataset.id,
      bullets: el.querySelector('textarea').value.split('\n').filter(Boolean),
    }));
    return {
      summary: document.getElementById('rb-summary').value,
      skills: document.getElementById('rb-skills').value.split(',').map(s => s.trim()).filter(Boolean),
      experience: bullets('rb-exp-block'),
      projects: bullets('rb-proj-block'),
    };
  }

  // ---------- 5. Export: PDF (print), DOCX, LaTeX ----------
  document.getElementById('rb-export-print').addEventListener('click', () => {
    const r = collectEditedResume();
    const root = document.getElementById('rb-print-root');
    root.innerHTML = `
      <h1>${escapeHtml(profile.name)}</h1>
      <p>${escapeHtml(profile.role)}</p>
      <h2>Summary</h2><p>${escapeHtml(r.summary)}</p>
      <h2>Skills</h2><p>${escapeHtml(r.skills.join(', '))}</p>
      <h2>Experience & Research</h2>${r.experience.map(e => `<h3>${escapeHtml(e.id)}</h3><ul>${e.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`).join('')}
      <h2>Projects</h2>${r.projects.map(e => `<h3>${escapeHtml(e.id)}</h3><ul>${e.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`).join('')}
    `;
    window.print();
  });

  document.getElementById('rb-export-docx').addEventListener('click', async () => {
    if (typeof docx === 'undefined') {
      setStatus('The DOCX export library failed to load — check your connection and reload the page.', true);
      return;
    }
    try {
      const r = collectEditedResume();
      const { Document, Packer, Paragraph, HeadingLevel } = docx;
      const children = [
        new Paragraph({ text: profile.name, heading: HeadingLevel.TITLE }),
        new Paragraph({ text: profile.role }),
        new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: r.summary }),
        new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: r.skills.join(', ') }),
        new Paragraph({ text: 'Experience & Research', heading: HeadingLevel.HEADING_2 }),
        ...r.experience.flatMap(e => [new Paragraph({ text: e.id, heading: HeadingLevel.HEADING_3 }), ...e.bullets.map(b => new Paragraph({ text: `• ${b}` }))]),
        new Paragraph({ text: 'Projects', heading: HeadingLevel.HEADING_2 }),
        ...r.projects.flatMap(e => [new Paragraph({ text: e.id, heading: HeadingLevel.HEADING_3 }), ...e.bullets.map(b => new Paragraph({ text: `• ${b}` }))]),
      ];
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, 'resume.docx');
      setStatus('DOCX downloaded.');
    } catch (err) {
      setStatus('Could not generate the DOCX file: ' + (err.message || 'unknown error'), true);
    }
  });

  document.getElementById('rb-export-tex').addEventListener('click', () => {
    const r = collectEditedResume();
    const esc = (s) => String(s).replace(/([&%$#_{}])/g, '\\$1');
    const tex = `\\documentclass[11pt]{article}
\\usepackage[margin=0.9in]{geometry}
\\usepackage{enumitem}
\\pagestyle{empty}
\\begin{document}
{\\LARGE \\textbf{${esc(profile.name)}}}\\\\[2pt]
{\\large ${esc(profile.role)}}\\\\[10pt]

\\textbf{Summary}\\\\
${esc(r.summary)}\\\\[10pt]

\\textbf{Skills}\\\\
${esc(r.skills.join(', '))}\\\\[10pt]

\\textbf{Experience \\& Research}\\\\
${r.experience.map(e => `\\textit{${esc(e.id)}}\\begin{itemize}[leftmargin=*]\n${e.bullets.map(b => `\\item ${esc(b)}`).join('\n')}\n\\end{itemize}`).join('\n')}

\\textbf{Projects}\\\\
${r.projects.map(e => `\\textit{${esc(e.id)}}\\begin{itemize}[leftmargin=*]\n${e.bullets.map(b => `\\item ${esc(b)}`).join('\n')}\n\\end{itemize}`).join('\n')}
\\end{document}`;
    downloadBlob(new Blob([tex], { type: 'text/plain' }), 'resume.tex');
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  guard();
})();
