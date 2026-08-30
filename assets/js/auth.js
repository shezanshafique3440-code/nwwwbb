/* =========================================================
   Login / register screens — the one door into both apps.
   Sign in with an email or a mobile number; the account's
   role decides which side opens.
   ========================================================= */
(function () {
  const icon = window.ICONS;

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('club21-theme', t); } catch (e) {}
    const b = document.getElementById('themeToggle');
    if (b) b.innerHTML = icon(t === 'dark' ? 'moon' : 'sun', 22);
  }

  /* a seller belongs in the seller app, everyone else in the panel */
  function homeFor(user) {
    return user && user.role === 'Seller' ? 'seller/index.html' : 'index.html';
  }

  function boot() {
    /* someone who is already signed in has no business on these screens */
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && data.user) window.location.href = homeFor(data.user);
      })
      .catch(function () { /* no server: the static demo carries on */ });

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

    /* there is no mail service behind this build, so say who to ask instead
       of pretending a reset link went out */
    const forgot = document.querySelector('[data-forgot]');
    if (forgot) {
      forgot.addEventListener('click', function () {
        errorBox.textContent =
          'Passwords are reset by an administrator — ask yours to set a new one from ' +
          'Users, or use Profile → Security once you are signed in.';
        errorBox.style.display = 'block';
      });
    }

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

      /* the field takes an email or a mobile number, so send whichever it is */
      const who = form.querySelector('#email').value.trim();
      const asPhone = /^[+\d][\d\s-]{5,}$/.test(who);

      /* signing up here creates a seller, and a seller is known by their
         mobile number — so say that rather than making a dead account */
      if (mode === 'register' && !asPhone) {
        return fail('Enter a mobile number to sign up.', btn, label);
      }

      const payload =
        mode === 'register'
          ? {
              name: form.querySelector('#name').value.trim(),
              email: asPhone ? '' : who,
              phone: asPhone ? who : '',
              password: form.querySelector('#password').value,
              inviter: form.querySelector('#inviter').value.trim()
            }
          : {
              email: asPhone ? '' : who,
              phone: asPhone ? who : '',
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
        .then(function (data) { window.location.href = homeFor(data.user); })
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
