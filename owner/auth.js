/* ============================================================
   OWNER MODE — client-side auth flow
   ------------------------------------------------------------
   Security model (read this before changing anything):
   - This file ships to EVERY visitor, same as any other JS on a
     static site. It contains no secrets and grants nothing by
     itself. The real gate is the Worker: every sensitive action
     (right now, AI resume analysis) independently verifies the
     signed token server-side before doing anything. Hiding
     buttons or "unlocking" the UI here is convenience, never
     the security boundary — that boundary lives entirely in the
     Worker and can't be bypassed from this file no matter what
     it does.
   - Because of that, checking "am I logged in" to decide what
     to SHOW never needs a network round-trip: a JWT already
     carries its own expiry, so reading that locally is exactly
     as trustworthy for UI purposes as asking the server "is
     this still valid" — and unlike a network call, it can't
     hang, get blocked by a browser extension/shield, or fail
     for reasons unrelated to whether the session is real. The
     Worker still independently re-checks the token's signature
     and expiry on every actual sensitive request regardless of
     what this file decided to display.
   - Session token lives in sessionStorage (cleared when the tab
     closes) and is sent as `Authorization: Bearer <token>` to
     the Worker on real requests. It expires after 2 hours.
   ------------------------------------------------------------
   Config: set WORKER_URL to your deployed Cloudflare Worker.
   ============================================================ */
(function () {
  const WORKER_URL = window.OWNER_WORKER_URL || 'https://your-worker-subdomain.workers.dev';
  const SESSION_KEY = 'owner_session_v1';
  const FETCH_TIMEOUT_MS = 8000;

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

  /** fetch() with a hard timeout — no request in this file is ever
   *  allowed to hang indefinitely, regardless of the cause. */
  async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Local, network-free check: does a non-expired token exist?
   *  This is what every UI decision (show Edit button, unlock the
   *  Resume Builder page, etc.) is based on — see the comment at
   *  the top of this file for why that's sufficient. */
  function isAuthenticated() {
    return Promise.resolve(!!getSession());
  }

  async function login(password, totp) {
    const res = await fetchWithTimeout(`${WORKER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, totp }),
    }).catch(() => {
      throw new Error('Could not reach the sign-in server. Check your connection and try again.');
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
    modalEl.querySelector('#owner-pass').focus();
    return modalEl;
  }
  function closeModal() {
    if (modalEl) { modalEl.remove(); modalEl = null; }
  }
  let pendingResolve = null;
  let submitting = false;
  async function submitLogin() {
    if (submitting) return; // guards against double-submit (e.g. Enter + click)
    const submitBtn = modalEl.querySelector('#owner-submit');
    const pass = modalEl.querySelector('#owner-pass').value;
    const totp = modalEl.querySelector('#owner-totp').value;
    const errEl = modalEl.querySelector('#owner-modal-error');
    errEl.textContent = '';
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';
    try {
      await login(pass, totp);
      closeModal();
      document.body.classList.add('owner-mode');
      document.dispatchEvent(new CustomEvent('owner:signedin'));
      if (pendingResolve) { pendingResolve(true); pendingResolve = null; }
    } catch (err) {
      errEl.textContent = err.message || 'Sign-in failed.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
      submitting = false;
    }
  }

  function openLoginModal() {
    buildModal();
    return new Promise((resolve) => { pendingResolve = resolve; });
  }

  /** Call before any owner-only action. Resolves true once a valid
   *  local session exists (prompting for login if needed), false if
   *  the visitor cancels. Never touches the network — see the file
   *  header for why that's the correct design here. */
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

  function wireSharedControls() {
    const link = document.getElementById('resume-builder-link');
    if (link) {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        if (await requireOwnerAuth()) window.location.href = link.href;
      });
    }
    const logoutBtn = document.getElementById('owner-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logout();
        window.location.href = window.location.pathname.includes('/owner/') ? '../index.html' : 'index.html';
      });
    }
    // Public visitors never see owner controls until a session exists.
    // This is now a synchronous local check, so it applies instantly
    // with no flash of hidden/missing buttons while a network call
    // was pending.
    isAuthenticated().then((ok) => {
      if (ok) document.querySelectorAll('.hidden-until-auth').forEach((el) => el.classList.add('owner-revealed'));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireSharedControls);
  } else {
    wireSharedControls(); // DOM already parsed (e.g. this script loaded with `defer`)
  }

  document.addEventListener('owner:signedin', () => {
    document.querySelectorAll('.hidden-until-auth').forEach((el) => el.classList.add('owner-revealed'));
  });
  document.addEventListener('owner:signedout', () => {
    document.querySelectorAll('.hidden-until-auth').forEach((el) => el.classList.remove('owner-revealed'));
  });

  window.OwnerAuth = { isAuthenticated, requireOwnerAuth, login, logout, getSession, fetchWithTimeout };
})();
