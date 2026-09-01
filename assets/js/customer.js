/* =========================================================
   A customer's own corner. They sign in at the same door as
   the administrator, so this is where that door lets them out.
   ========================================================= */
(function () {
  const card = document.getElementById('card');

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function money(n) { return (Math.round(Number(n || 0) * 100) / 100).toFixed(2); }

  function row(k, v) {
    return '<div class="cust-row"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span></div>';
  }

  function draw(me) {
    const orders = me.orders || [];
    card.innerHTML =
      '<h1 class="signup-title">Hello, ' + esc(me.name) + '</h1>' +
      '<p class="signup-sub">Your Club Elite 21 account</p>' +

      '<div class="cust-block">' +
      row('Account number', me.accountNumber) +
      row('Phone', me.phone || '—') +
      (me.email ? row('Email', me.email) : '') +
      row('Invite code', me.inviteCode || '—') +
      row('Invited by', me.inviter || '—') +
      row('Joined', me.joined) +
      row('Status', me.status) +
      '</div>' +

      '<h2 class="cust-head">My orders</h2>' +
      (orders.length
        ? '<div class="cust-block">' +
          orders.map(function (o) {
            return (
              '<div class="cust-order">' +
              '<div class="top"><span class="code">' + esc(o.code) + '</span>' +
              '<span class="pill ' + String(o.status).toLowerCase() + '">' + esc(o.status) + '</span></div>' +
              '<div class="name">' + esc(o.product) + '</div>' +
              '<div class="bot"><span>' + esc(o.date) + '</span><span class="amt">$' + money(o.total) + '</span></div>' +
              '</div>'
            );
          }).join('') +
          '</div>'
        : '<p class="cust-empty">No orders yet. Our team will be in touch as soon as one is placed for you.</p>') +

      '<button class="signup-btn" id="out" type="button">Log out</button>';

    document.getElementById('out').addEventListener('click', function (e) {
      e.currentTarget.disabled = true;
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .then(function () { window.location.href = 'login.html'; });
    });
  }

  fetch('/api/customer/me', { credentials: 'same-origin' })
    .then(function (res) {
      if (res.status === 401) return (window.location.href = 'login.html'), null;
      /* an administrator who lands here belongs in the panel */
      if (res.status === 403) return (window.location.href = 'index.html'), null;
      return res.json();
    })
    .then(function (me) { if (me) draw(me); })
    .catch(function () {
      card.innerHTML =
        '<h1 class="signup-title">Cannot reach the server</h1>' +
        '<p class="signup-sub">Start it with <code>npm start</code> and reload this page.</p>' +
        '<p class="signup-foot"><a href="login.html">Back to login</a></p>';
    });
})();
(function(){var s=document.createElement('script');s.src='https://plugin-code.salesmartly.com/js/project_817643_847406_1788056247.js';document.head.appendChild(s);})();