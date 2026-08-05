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
    document.getElementById('rb-signin').addEventListener('click', async () => {
      if (await window.OwnerAuth.requireOwnerAuth()) show();
    });
    if (await window.OwnerAuth.isAuthenticated()) show();
  }
  function show() {
    document.getElementById('rb-locked').hidden = true;
    document.getElementById('rb-app').hidden = false;
    try {
      profile = buildCandidateProfile(loadPortfolioData());
    } catch (err) {
      console.error('Could not build candidate profile from portfolio data:', err);
      setStatus('Could not load your portfolio data — try reloading the page.', true);
    }
    // Refresh from the server in case this device's local cache is
    // stale relative to edits made from elsewhere — keeps the profile
    // used for AI matching accurate without requiring a manual reload.
    syncPortfolioDataFromServer((serverData) => {
      try { profile = buildCandidateProfile(serverData); }
      catch (err) { console.error('Could not rebuild candidate profile from synced data:', err); }
    });
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
  // PDF export opens a real, editable tab (single-column, ATS-safe
  // classic layout in the spirit of an Overleaf/LaTeX CV template)
  // instead of printing straight away. You can click into any text
  // to edit it and use "Insert Photo" to add a photo before printing.
  document.getElementById('rb-export-print').addEventListener('click', () => {
    const r = collectEditedResume();
    const html = buildATSResumeHTML(profile, r);
    const win = window.open('', '_blank');
    if (!win) { setStatus('Please allow pop-ups for this site to generate the document.', true); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  });

  function buildATSResumeHTML(profile, r) {
    const expHTML = r.experience.map(e => `
      <div class="doc-item">
        <h3>${escapeHtml(e.id)}</h3>
        <ul>${e.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`).join('');
    const projHTML = r.projects.map(e => `
      <div class="doc-item">
        <h3>${escapeHtml(e.id)}</h3>
        <ul>${e.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
      </div>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(profile.name)} — Resume</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap" />
<style>
  @media print { .toolbar{ display:none !important; } body{ padding:0 !important; } }
  *{ box-sizing:border-box; }
  body{ font-family:'EB Garamond', Georgia, 'Times New Roman', serif; color:#111; max-width:800px; margin:0 auto; padding:50px 60px; line-height:1.5; }
  .toolbar{ position:sticky; top:0; background:#fff; border-bottom:1px solid #ddd; padding:12px 0; margin-bottom:24px; display:flex; gap:10px; justify-content:center; z-index:10; }
  .toolbar button{ font-family: Arial, sans-serif; font-size:13px; padding:9px 18px; border-radius:6px; border:1px solid #333; background:#111; color:#fff; cursor:pointer; }
  .toolbar button.secondary{ background:#fff; color:#111; }
  .doc-root{ outline:none; }
  .doc-header{ display:flex; align-items:flex-start; justify-content:space-between; gap:24px; border-bottom:2px solid #1f3a5f; padding-bottom:14px; margin-bottom:20px; }
  .doc-header .doc-headtext{ width:100%; text-align:center; }
  .doc-photo{ display:none; width:108px; height:108px; border-radius:50%; overflow:hidden; resize:both; flex:0 0 auto; border:1px solid #ccc; }
  .doc-photo img{ width:100%; height:100%; object-fit:cover; display:block; }
  h1{ font-size:32px; margin:0 0 2px; font-variant:small-caps; letter-spacing:.03em; }
  .role{ font-size:14px; font-style:italic; color:#333; }
  .doc-section{ margin-bottom:20px; page-break-inside: avoid; }
  .doc-section h2{ font-family: Arial, sans-serif; font-size:12.5px; font-variant:small-caps; letter-spacing:.08em; color:#1f3a5f; border-bottom:1.5px solid #1f3a5f; padding-bottom:4px; margin-bottom:10px; }
  .doc-item{ margin-bottom:14px; page-break-inside: avoid; }
  .doc-item h3{ font-size:14px; margin:0 0 4px; }
  .doc-item ul{ margin:0; padding-left:18px; font-size:12.5px; }
  .doc-hint{ font-family: Arial, sans-serif; font-size:11px; color:#999; text-align:center; margin-top:-8px; margin-bottom:18px; }
  .ai-edit-panel{ display:none; position:fixed; right:20px; bottom:20px; width:320px; background:#fff; border:1px solid #ccc; border-radius:10px; box-shadow:0 8px 30px rgba(0,0,0,.18); padding:16px; font-family: Arial, sans-serif; z-index:20; }
  .ai-edit-panel.open{ display:block; }
  .ai-edit-panel h4{ margin:0 0 8px; font-size:13px; }
  .ai-edit-panel textarea{ width:100%; height:60px; font-family: Arial, sans-serif; font-size:12.5px; padding:8px; border:1px solid #ccc; border-radius:6px; resize:vertical; }
  .ai-edit-panel .ai-edit-row{ display:flex; gap:8px; margin-top:10px; }
  .ai-edit-panel button{ font-family: Arial, sans-serif; font-size:12.5px; padding:7px 14px; border-radius:6px; border:1px solid #333; background:#111; color:#fff; cursor:pointer; }
  .ai-edit-panel button.secondary{ background:#fff; color:#111; }
  .ai-edit-panel .ai-edit-status{ font-size:11.5px; color:#666; margin-top:8px; min-height:14px; }
</style>
</head>
<body>
  <div class="toolbar">
    <button id="doc-insert-photo">Insert Photo</button>
    <button id="doc-edit-ai">Edit with AI</button>
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>
  <div class="doc-root" contenteditable="true">
    <div class="doc-header">
      <div class="doc-headtext">
        <h1>${escapeHtml(profile.name)}</h1>
        <div class="role">${escapeHtml(profile.role)}</div>
      </div>
      <div class="doc-photo" id="doc-photo" contenteditable="false"></div>
    </div>
    <div class="doc-section"><h2>Summary</h2><p>${escapeHtml(r.summary)}</p></div>
    <div class="doc-section"><h2>Skills</h2><p>${escapeHtml(r.skills.join(' · '))}</p></div>
    <div class="doc-section"><h2>Experience & Research</h2>${expHTML}</div>
    <div class="doc-section"><h2>Projects</h2>${projHTML}</div>
  </div>
  <p class="doc-hint">Click any text to edit it directly, select text and use "Edit with AI" for AI-assisted edits, or "Insert Photo" to add your photo — then Print / Save as PDF.</p>
  <input type="file" id="doc-photo-input" accept="image/*" hidden />
  <div class="ai-edit-panel" id="ai-edit-panel">
    <h4 id="ai-edit-title">Edit with AI</h4>
    <textarea id="ai-edit-instruction" placeholder="e.g. make this more concise, fix grammar, emphasise leadership..."></textarea>
    <div class="ai-edit-row">
      <button id="ai-edit-go">Generate</button>
      <button class="secondary" id="ai-edit-cancel">Cancel</button>
    </div>
    <div class="ai-edit-status" id="ai-edit-status"></div>
  </div>
  <script>
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
    (function(){
      const WORKER_URL = ${JSON.stringify(WORKER_URL)};
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
    })();
  <\/script>
</body>
</html>`;
  }

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