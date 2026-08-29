/* =========================================================
   Login / register screens. Demo-only: no backend call is
   made, submitting simply drops the user into the dashboard.
   ========================================================= */
(function () {
  const icon = window.ICONS;

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('club21-theme', t); } catch (e) {}
    const b = document.getElementById('themeToggle');
    if (b) b.innerHTML = icon(t === 'dark' ? 'moon' : 'sun', 22);
  }

  function boot() {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      let saved = 'light';
      try { saved = localStorage.getItem('club21-theme') || 'light'; } catch (e) {}
      applyTheme(saved);
      themeBtn.addEventListener('click', function () {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    }

    /* show/hide password */
    document.querySelectorAll('.toggle-pass').forEach(function (btn) {
      btn.innerHTML = icon('eye', 18);
      btn.addEventListener('click', function () {
        const input = btn.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = icon(show ? 'x' : 'eye', 18);
      });
    });

    /* prefill the inviter from ?inviter=... on the register page */
    const inviter = document.getElementById('inviter');
    if (inviter) {
      const match = /[?&]inviter=([^&]+)/.exec(window.location.search);
      inviter.value = match ? decodeURIComponent(match[1]) : 'admin';
    }

    const form = document.querySelector('form[data-auth]');
    if (!form) return;

    const errorBox = document.createElement('div');
    errorBox.className = 'auth-error';
    errorBox.style.display = 'none';
    form.insertBefore(errorBox, form.firstChild);

    function fail(message, btn, label) {
      errorBox.textContent = message;
      errorBox.style.display = 'block';
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.style.display = 'none';

      const missing = Array.prototype.filter.call(form.querySelectorAll('input[required]'), function (i) {
        return i.type === 'checkbox' ? !i.checked : !i.value.trim();
      });
      if (missing.length) {
        missing[0].focus();
        missing[0].style.borderColor = 'var(--danger)';
        return;
      }

      const mode = form.getAttribute('data-auth');
      const btn = form.querySelector('button[type="submit"]');
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = mode === 'register' ? 'Creating account...' : 'Signing in...';

      const payload =
        mode === 'register'
          ? {
              name: form.querySelector('#name').value.trim(),
              email: form.querySelector('#email').value.trim(),
              password: form.querySelector('#password').value,
              inviter: form.querySelector('#inviter').value.trim()
            }
          : {
              email: form.querySelector('#email').value.trim(),
              password: form.querySelector('#password').value
            };

      fetch('/api/auth/' + mode, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Something went wrong');
            return data;
          });
        })
        .then(function () { window.location.href = 'index.html'; })
        .catch(function (err) {
          /* no backend running: the static demo signs in without one */
          if (err instanceof TypeError) return (window.location.href = 'index.html');
          fail(err.message, btn, label);
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
