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

  /* an administrator gets the panel, everybody else gets the shop app */
  function homeFor(user) {
    return user && user.role === 'Admin' ? 'index.html' : 'seller/index.html';
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

    /* an invite link fills the code in; typed by hand it stays as typed */
    const inviter = document.getElementById('inviter');
    if (inviter) {
      const match = /[?&](?:inviter|invite)=([^&]+)/.exec(window.location.search);
      if (match) inviter.value = decodeURIComponent(match[1]);
    }

    const form = document.querySelector('form[data-auth]');
    if (!form) return;


    const card = form.closest('.signup-card') || form.closest('.auth-card');
    const signup = card && card.classList.contains('signup-card');

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

    const terms = document.querySelector('[data-terms]');
    if (terms) {
      terms.addEventListener('click', function () {
        errorBox.textContent =
          'Club Elite 21 accounts are for one person each. Orders are matched by the ' +
          'platform, commission is credited on submission, and withdrawals are reviewed ' +
          'by an administrator before payout.';
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
      form.querySelectorAll('.is-bad').forEach(function (i) { i.classList.remove('is-bad'); });
      if (missing.length) {
        missing[0].focus();
        if (signup) missing[0].classList.add('is-bad');
        else missing[0].style.borderColor = 'var(--danger)';
        return;
      }

      const mode = form.getAttribute('data-auth');
      const btn = form.querySelector('button[type="submit"]');
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = mode === 'register' ? 'Creating account...' : 'Signing in...';

      /* sign-in takes an email or a mobile number; the sign-up asks for a
         phone outright, so send whichever the form actually holds */
      const field = form.querySelector('#phone') || form.querySelector('#email');
      const who = field.value.trim();
      const asPhone = field.id === 'phone' || /^[+\d][\d\s-]{5,}$/.test(who);

      const payload =
        mode === 'register'
          ? {
              name: form.querySelector('#name').value.trim(),
              email: asPhone ? '' : who,
              phone: asPhone ? who : '',
              password: form.querySelector('#password').value,
              withdrawPassword: (form.querySelector('#wpass') || {}).value || '',
              inviter: form.querySelector('#inviter').value.trim(),
              /* this door opens a shopper's account; sellers sign up in the
                 seller app, which asks for its own things */
              as: form.getAttribute('data-role') || 'Customer'
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
