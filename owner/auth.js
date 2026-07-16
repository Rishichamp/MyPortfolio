/* ============================================================
   OWNER MODE — client-side auth flow
   ------------------------------------------------------------
   Security model (read this before changing anything):
   - This file ships to EVERY visitor, same as any other JS on a
     static site. It contains no secrets and grants nothing by
     itself. The real gate is the Worker: every sensitive action
     (AI resume analysis, and this session check) is verified
     server-side with a signed token. Hiding buttons here is only
     for a tidy public UI, never the security boundary.
   - Session token lives in sessionStorage (cleared when the tab
     closes) and is sent as `Authorization: Bearer <token>` to the
     Worker. It expires server-side after 2 hours regardless of
     what the client does with it.
   ------------------------------------------------------------
   Config: set WORKER_URL to your deployed Cloudflare Worker.
   ============================================================ */
(function () {
  const WORKER_URL = window.OWNER_WORKER_URL || 'https://your-worker-subdomain.workers.dev';
  const SESSION_KEY = 'owner_session_v1';

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.token || !s.exp || Date.now() / 1000 > s.exp) return null;
      return s;
    } catch { return null; }
  }
  function setSession(token, exp) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, exp }));
  }
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function verifyWithServer(token) {
    try {
      const res = await fetch(`${WORKER_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.valid;
    } catch { return false; }
  }

  async function isAuthenticated() {
    const s = getSession();
    if (!s) return false;
    return verifyWithServer(s.token);
  }

  async function login(password, totp) {
    const res = await fetch(`${WORKER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, totp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Sign-in failed.');
    setSession(data.token, data.exp);
    return true;
  }

  function logout() {
    clearSession();
    document.body.classList.remove('owner-mode');
    document.dispatchEvent(new CustomEvent('owner:signedout'));
  }

  // ---------- login modal UI ----------
  let modalEl = null;
  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'owner-modal-backdrop';
    modalEl.innerHTML = `
      <div class="owner-modal spring-reveal" role="dialog" aria-modal="true" aria-label="Owner sign-in">
        <h3>Owner sign-in</h3>
        <p class="owner-modal-sub">Password + authenticator code required.</p>
        <label>Password
          <input type="password" id="owner-pass" autocomplete="current-password" />
        </label>
        <label>Authenticator code
          <input type="text" id="owner-totp" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code" />
        </label>
        <p class="owner-modal-error" id="owner-modal-error" role="alert"></p>
        <div class="owner-modal-actions">
          <button type="button" class="btn btn-ghost" id="owner-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="owner-submit">Sign in</button>
        </div>
      </div>`;
    document.body.appendChild(modalEl);
    requestAnimationFrame(() => modalEl.querySelector('.spring-reveal').classList.add('is-in'));

    modalEl.querySelector('#owner-cancel').addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });
    modalEl.querySelector('#owner-submit').addEventListener('click', submitLogin);
    modalEl.querySelector('#owner-totp').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitLogin(); });
    return modalEl;
  }
  function closeModal() {
    if (modalEl) { modalEl.remove(); modalEl = null; }
  }
  let pendingResolve = null;
  async function submitLogin() {
    const pass = modalEl.querySelector('#owner-pass').value;
    const totp = modalEl.querySelector('#owner-totp').value;
    const errEl = modalEl.querySelector('#owner-modal-error');
    errEl.textContent = '';
    try {
      await login(pass, totp);
      closeModal();
      document.body.classList.add('owner-mode');
      document.dispatchEvent(new CustomEvent('owner:signedin'));
      if (pendingResolve) { pendingResolve(true); pendingResolve = null; }
    } catch (err) {
      errEl.textContent = err.message || 'Sign-in failed.';
    }
  }

  function openLoginModal() {
    buildModal();
    return new Promise((resolve) => { pendingResolve = resolve; });
  }

  /** Call before any owner-only action. Resolves true once a verified
   *  session exists (prompting for login if needed), false if the
   *  visitor cancels. */
  async function requireOwnerAuth() {
    if (await isAuthenticated()) {
      document.body.classList.add('owner-mode');
      return true;
    }
    return openLoginModal();
  }

  // ---------- hidden entry point ----------
  // No visible "Owner" link/button in the public UI. Recruiters and
  // visitors reach the whole site normally; Owner Mode is reached via
  // a keyboard gesture or a direct hash link, either way gated by
  // requireOwnerAuth() above.
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 'o' || e.key === 'O')) {
      requireOwnerAuth();
    }
  });
  if (location.hash === '#/owner') {
    requireOwnerAuth();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const link = document.getElementById('resume-builder-link');
    if (link) {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        if (await requireOwnerAuth()) window.location.href = link.href;
      });
    }
    // Public visitors never see either control until a session exists.
    isAuthenticated().then((ok) => {
      if (ok) document.querySelectorAll('.hidden-until-auth').forEach((el) => el.classList.add('owner-revealed'));
    });
  });
  document.addEventListener('owner:signedin', () => {
    document.querySelectorAll('.hidden-until-auth').forEach((el) => el.classList.add('owner-revealed'));
  });
  document.addEventListener('owner:signedout', () => {
    document.querySelectorAll('.hidden-until-auth').forEach((el) => el.classList.remove('owner-revealed'));
  });

  window.OwnerAuth = { isAuthenticated, requireOwnerAuth, login, logout, getSession };
})();
