/* =========================================================
   Club Elite 21 — seller app shell and screens.
   Talks to /api/seller/* and never sees another seller's data.
   ========================================================= */
(function () {
  /* ---------------- icons ---------------- */
  const svg = function (body, size, stroke) {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + (size || 24) + '" height="' + (size || 24) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (stroke || 1.7) +
      '" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>'
    );
  };

  const I = {
    bag: '<defs>' +
      '<linearGradient id="sBag" x1="8" y1="20" x2="56" y2="60" gradientUnits="userSpaceOnUse">' +
      '<stop stop-color="#3B82F6"/><stop offset="1" stop-color="#1E40AF"/></linearGradient>' +
      '<linearGradient id="sStar" x1="18" y1="4" x2="46" y2="26" gradientUnits="userSpaceOnUse">' +
      '<stop stop-color="#FDE047"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs>' +
      '<path d="M10 22h44l-4 34a4 4 0 0 1-4 3.6H18A4 4 0 0 1 14 56z" fill="url(#sBag)" stroke="none"/>' +
      '<path d="M22 26V19a10 10 0 0 1 20 0v7" stroke="#1E3A8A" stroke-width="3.4"/>' +
      '<path d="M14 40c8 4 14 5 20 3s12-5 20-3l-2.2 16a4 4 0 0 1-4 3.6H18A4 4 0 0 1 14 56z" fill="#22C55E" opacity=".85" stroke="none"/>' +
      '<path d="M32 2l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L32 25.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill="url(#sStar)" stroke="none"/>',
    headset: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2.5" y="13" width="4.5" height="6" rx="2"/>' +
      '<rect x="17" y="13" width="4.5" height="6" rx="2"/><path d="M19 19v.6a2.4 2.4 0 0 1-2.4 2.4H13"/>',
    withdraw: '<rect x="3" y="13" width="4.5" height="7" rx="1"/><rect x="9.5" y="10" width="4.5" height="10" rx="1"/>' +
      '<path d="M13 8l7-4"/><path d="M15.5 3.4L20.6 3.6l.2 5.1"/>',
    recharge: '<path d="M2.6 9.6l7-6.2 11.8 5.6-7 6.2z"/><path d="M9.6 15.2l-.1 5.4-7-5.5.1-5.5"/>' +
      '<path d="M13.8 8.2a2 2 0 0 0-2.6-.3c-.9.6-.8 1.7.2 2.1l1.4.5c1 .4 1.1 1.5.2 2.1a2 2 0 0 1-2.6-.3"/>' +
      '<path d="M11 6.6l1.2-.6"/><path d="M12.2 13.4l1.2-.6"/>',
    about: '<path d="M4 12a8 8 0 0 1 16 0"/><rect x="2.5" y="11.5" width="4.5" height="6.5" rx="2"/>' +
      '<path d="M17 11.5h2a2.5 2.5 0 0 1 2.5 2.5v1.5a2.5 2.5 0 0 1-2.5 2.5h-2z"/>' +
      '<path d="M12 13.5v5.5a2 2 0 0 0 2 2h1.4"/><circle cx="12" cy="11.5" r="1.6"/>',
    popular: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.4 6.4L12 13l8.6-6.6"/>',
    home: '<path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-4.6v-6H9.1v6H4.5a1 1 0 0 1-1-1z"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    wallet: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M12 9v6"/>' +
      '<path d="M13.9 10.4a2 2 0 0 0-1.6-.8h-.7a1.6 1.6 0 0 0-.3 3.2l1.3.2a1.6 1.6 0 0 1-.3 3.2h-.7a2 2 0 0 1-1.6-.8"/>',
    rocket: '<path d="M12 2.5c2.7 2 4.2 5.2 4.2 8.6 0 2.6-.9 5-2.5 6.9h-3.4A10.6 10.6 0 0 1 7.8 11c0-3.4 1.5-6.6 4.2-8.5z"/>' +
      '<circle cx="12" cy="9.8" r="1.9"/><path d="M10.3 18h3.4l-1.7 3.4z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    fingerprint: '<path d="M5 11a7 7 0 0 1 12-4.9"/><path d="M8 12.4a4 4 0 0 1 7.7-1.5"/>' +
      '<path d="M11 13.6c.3 2.4-.2 4.5-1.4 6.4"/><path d="M14.6 13.9c.2 2.3-.2 4.2-1.1 5.9"/>' +
      '<path d="M18.6 9.6c.6 1.8.7 3.8.2 5.9"/><path d="M4.6 16.4A9 9 0 0 0 5.4 8"/>',
    chevron: '<polyline points="9 6 15 12 9 18"/>',
    back: '<polyline points="15 6 9 12 15 18"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
    bell: '<path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    chat: '<rect x="2.5" y="4.5" width="13" height="10" rx="2"/><rect x="8.5" y="9.5" width="13" height="10" rx="2" fill="currentColor" stroke="none" opacity=".9"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.4l2.6 12.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21 7H6"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>' +
      '<circle cx="3.6" cy="6" r="1.2"/><circle cx="3.6" cy="12" r="1.2"/><circle cx="3.6" cy="18" r="1.2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    box: '<path d="M6 7V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1"/><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M3 12h18"/>',
    team: '<path d="M16 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20"/><circle cx="9.5" cy="7.4" r="3.6"/>' +
      '<path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.6 4a3.6 3.6 0 0 1 0 6.9"/>',
    vip: '<path d="M3 8l4.5 3.2L12 5l4.5 6.2L21 8l-1.7 10.2a1.5 1.5 0 0 1-1.5 1.3H6.2a1.5 1.5 0 0 1-1.5-1.3z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    getOrder: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M8 8h6"/><path d="M8 12h4"/>' +
      '<circle cx="17.5" cy="16.5" r="4.5"/><path d="M17.5 14.6v2l1.3.9"/>',
    account: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M6.5 9.5h4"/><path d="M6.5 14.5h11"/><path d="M14.5 9.5h3"/>',
    funds: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1"/><rect x="3" y="7.5" width="18" height="12" rx="2.5"/>' +
      '<circle cx="16.5" cy="13.5" r="1.4"/>',
    records: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M8 4v3"/><path d="M16 4v3"/><path d="M12 14v3"/>',
    usdt: '<circle cx="12" cy="12" r="9.2"/><path d="M7.5 8.4h9"/><path d="M12 8.4v8"/><ellipse cx="12" cy="11.4" rx="4.4" ry="1.5"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.4"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>',
    star: '<path d="M12 3.6l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    gift: '<rect x="3" y="9" width="18" height="11" rx="1.6"/><path d="M2 6.5h20V9H2z"/>'
      + '<path d="M12 6.5V20"/><path d="M12 6.5C12 4.6 10.6 3 8.9 3S6 4.3 6 5.6 7.4 6.5 8.9 6.5z"/>'
      + '<path d="M12 6.5c0-1.9 1.4-3.5 3.1-3.5S18 4.3 18 5.6s-1.4.9-2.9.9z"/>',
    moneybag: '<path d="M9.4 3h5.2l-1.6 3h-2z"/><path d="M13 6c4 1.6 6.4 5 6.4 9.1 0 3.3-2.4 5.4-7.4 5.4s-7.4-2.1-7.4-5.4C4.6 11 7 7.6 11 6z"/>'
      + '<path d="M12 10v7"/><path d="M13.9 11.6h-2.6a1.4 1.4 0 0 0 0 2.8h1.4a1.4 1.4 0 0 1 0 2.8h-2.7"/>',
    bulb: '<path d="M9 17h6"/><path d="M10 20.5h4"/><path d="M12 2.8a6 6 0 0 1 3.6 10.8c-.6.5-.9 1-.9 1.6H9.3c0-.6-.3-1.1-.9-1.6A6 6 0 0 1 12 2.8z"/>',
    link: '<path d="M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.3 1.3"/>' +
      '<path d="M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3"/>'
  };

  /* ---------------- api ---------------- */
  function api(method, path, body) {
    return fetch('/api' + path, {
      method: method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          const err = new Error(data.error || 'Request failed');
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  /* Both apps draw the same symbols, so where the panel already has one the
     seller app uses its drawing — one icon set across the two sides. */
  if (window.ICONS && window.ICONS.paths) {
    Object.keys(I).forEach(function (name) {
      if (window.ICONS.paths[name]) I[name] = window.ICONS.paths[name];
    });
  }

  /* ---------------- helpers ---------------- */
  const money = function (n) {
    return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  const dmy = function (iso) {
    const p = String(iso).slice(0, 10).split('-');
    return p[2] + '-' + p[1] + '-' + p[0];
  };

  function toast(msg) {
    let stack = document.querySelector('.s-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 's-toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 's-toast';
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(function () { el.remove(); }, 2800);
  }

  /* The gap dialog. Whenever the balance falls short the seller is told the
     three numbers that matter — what they hold, what the order needs, and the
     difference — with a way straight to the recharge screen. */
  function gapDialog(g) {
    document.querySelectorAll('.s-modal').forEach(function (m) { m.remove(); });

    const wrap = document.createElement('div');
    wrap.className = 's-modal';
    wrap.innerHTML =
      '<div class="s-modal-card" role="alertdialog" aria-labelledby="gapTitle">' +
      '<h3 id="gapTitle">Insufficient Funds</h3>' +
      '<p class="line">Sir your balance is <b>$' + money(g.balance) + '</b> but required amount is ' +
      '<b>$' + money(g.required) + '</b></p>' +
      '<div class="s-gap-figure"><span class="k">Your gap</span>' +
      '<span class="v">$' + money(g.gap) + '</span></div>' +
      '<p class="line">Add <b>$' + money(g.gap) + '</b> and complete the gap first.</p>' +
      '<a class="s-btn s-modal-go" href="recharge.html">Recharge now</a>' +
      '<button class="s-modal-close" type="button">Close</button>' +
      '</div>';
    document.body.appendChild(wrap);

    const shut = function () { wrap.remove(); };
    wrap.querySelector('.s-modal-close').addEventListener('click', shut);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) shut(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { shut(); document.removeEventListener('keydown', esc); }
    });
    return wrap;
  }

  /* Withdrawing without an account on file is the same conversation every
     time: what is missing, and the two steps in Wallet address that fix it. */
  function payoutDialog(pay) {
    document.querySelectorAll('.s-modal').forEach(function (m) { m.remove(); });

    const wrap = document.createElement('div');
    wrap.className = 's-modal';
    wrap.innerHTML =
      '<div class="s-modal-card" role="alertdialog" aria-labelledby="payTitle">' +
      '<h3 id="payTitle">' + esc(pay.title || 'Add a bank account first') + '</h3>' +
      '<p class="line">' + esc(pay.error) + '</p>' +
      '<ol class="s-payout-steps">' +
      '<li>Open <b>Wallet address</b>.</li>' +
      '<li>Select your <b>payment method</b>.</li>' +
      '<li>Add the account and save it.</li>' +
      '</ol>' +
      '<a class="s-btn s-modal-go" href="wallet.html?add=1">Go to Wallet address</a>' +
      '<button class="s-modal-close" type="button">Close</button>' +
      '</div>';
    document.body.appendChild(wrap);

    const shut = function () { wrap.remove(); };
    wrap.querySelector('.s-modal-close').addEventListener('click', shut);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) shut(); });
    document.addEventListener('keydown', function esc2(e) {
      if (e.key === 'Escape') { shut(); document.removeEventListener('keydown', esc2); }
    });
    return wrap;
  }

  /* Every matched order is rated before it is submitted, the way the shop
     asks its sellers to score what they just handled. */
  function rateDialog(order, done) {
    document.querySelectorAll('.s-modal').forEach(function (m) { m.remove(); });
    let chosen = 0;

    const wrap = document.createElement('div');
    wrap.className = 's-modal';
    wrap.innerHTML =
      '<div class="s-modal-card" role="dialog" aria-labelledby="rateTitle">' +
      '<h3 id="rateTitle">Rate this product</h3>' +
      '<div class="s-rate-item"><span class="thumb">' + (order.image || '\u{1F4E6}') + '</span>' +
      '<span class="name">' + esc(order.product) + '</span></div>' +
      '<div class="s-stars" role="radiogroup" aria-label="Rating out of five">' +
      [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" class="s-star" data-star="' + n + '" role="radio" ' +
          'aria-checked="false" aria-label="' + n + ' star' + (n > 1 ? 's' : '') + '">\u2605</button>';
      }).join('') +
      '</div>' +
      '<p class="s-rate-word" data-word>Tap the stars to rate</p>' +
      '<button class="s-btn s-modal-go" data-send disabled>Submit rating</button>' +
      '<button class="s-modal-close" type="button">Rate later</button>' +
      '</div>';
    document.body.appendChild(wrap);

    const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
    const stars = wrap.querySelectorAll('.s-star');
    const send = wrap.querySelector('[data-send]');
    const word = wrap.querySelector('[data-word]');

    stars.forEach(function (b) {
      b.addEventListener('click', function () {
        chosen = Number(b.getAttribute('data-star'));
        stars.forEach(function (x) {
          const on = Number(x.getAttribute('data-star')) <= chosen;
          x.classList.toggle('on', on);
          x.setAttribute('aria-checked', on && Number(x.getAttribute('data-star')) === chosen ? 'true' : 'false');
        });
        word.textContent = WORDS[chosen];
        send.disabled = false;
      });
    });

    const shut = function () { wrap.remove(); if (done) done(); };
    wrap.querySelector('.s-modal-close').addEventListener('click', shut);

    send.addEventListener('click', function () {
      send.disabled = true;
      send.textContent = 'Saving…';
      api('POST', '/seller/orders/' + order.id + '/rate', { rating: chosen })
        .then(function () { toast('Thanks — you rated it ' + chosen + ' of 5'); shut(); })
        .catch(function (err) { toast(err.message); shut(); });
    });
    return wrap;
  }

  /* five stars, filled up to the score */
  function starRow(n) {
    let out = '<span class="s-star-row" aria-label="Rated ' + n + ' of 5">';
    for (let i = 1; i <= 5; i++) out += '<span class="' + (i <= n ? 'on' : '') + '">\u2605</span>';
    return out + '</span>';
  }

  /* an error carrying a gap gets the dialog; anything else is just a toast */
  function reportGap(err) {
    const d = err && err.data;
    if (d && typeof d.gap === 'number' && d.gap > 0) return gapDialog(d);
    if (d && d.gap && typeof d.gap.gap === 'number' && d.gap.gap > 0) return gapDialog(d.gap);
    toast(err.message);
    return null;
  }

  /* ---------------- shell ---------------- */
  const TABS = [
    { key: 'home', label: 'Home page', href: 'index.html', icon: 'home' },
    { key: 'recharge', label: 'Recharge', href: 'recharge.html', icon: 'wallet' },
    { key: 'start', label: 'Start', href: 'start.html', icon: 'rocket', fab: true },
    { key: 'orders', label: 'Order', href: 'orders.html', icon: 'clock' },
    { key: 'my', label: 'My', href: 'my.html', icon: 'fingerprint' }
  ];

  function topbar(page) {
    const meta = TOPBARS[page];
    return (
      '<header class="s-topbar">' +
      '<button class="back" data-back>' + svg(I.back, 24) + '</button>' +
      '<h1>' + meta[0] + '</h1>' +
      '<button class="right" data-support>' + svg(I[meta[1]] || I.bell, 22) + '</button>' +
      '</header>'
    );
  }

  function header() {
    return (
      '<header class="s-header">' +
      '<a class="s-brand" href="index.html">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 64 64" fill="none" ' +
      'stroke="currentColor" stroke-width="0" stroke-linecap="round" stroke-linejoin="round">' + I.bag + '</svg>' +
      '<span>Club Elite 21</span></a>' +
      '<div class="s-header-actions">' +
      '<button class="s-icon-btn" data-support title="Customer service">' + svg(I.headset, 24) + '</button>' +
      '<button class="s-lang" data-lang>' + currentLang().toUpperCase() + '</button>' +
      '</div></header>'
    );
  }

  /* the teal bar screens: title, right-hand icon and whether the tab bar shows */
  const TOPBARS = {
    withdraw: ['Withdrawal', 'headset'],
    account: ['Account Details', 'bell'],
    'recharge-record': ['Recharge Record', 'bell'],
    'withdraw-records': ['Withdrawal Record', 'bell'],
    bank: ['Bank Information', 'headset'],
    wallet: ['Wallet Management', 'headset'],
    password: ['Change Password', 'bell'],
    'password-login': ['Change Password', 'bell'],
    'password-withdraw': ['Modify the withdrawal', 'bell'],
    team: ['Invite & Team', 'bell'],
    vip: ['VIP Level', 'bell'],
    products: ['My Products', 'bell'],
    about: ['About Us', 'headset'],
    funds: ['Fund Details', 'bell']
  };

  /* screens that use the plain white bar instead of the teal one */
  const PLAINBARS = {
    linked: ['Linked Account', 'chevron'],
    language: ['Select language', 'text']
  };

  function plainbar(page) {
    const meta = PLAINBARS[page];
    return (
      '<header class="s-plainbar">' +
      '<button class="back" data-back>' + svg(I.back, 20) +
      (meta[1] === 'text' ? 'Back' : '') + '</button>' +
      '<h1>' + meta[0] + '</h1><span class="pad"></span></header>'
    );
  }

  /* the profile family keeps the My tab lit */
  const MY_PAGES = ['my', 'account', 'funds', 'withdraw-records', 'wallet', 'usdt', 'password', 'linked', 'team', 'vip', 'withdraw'];

  function tabbar(page) {
    if (MY_PAGES.indexOf(page) > -1) page = 'my';
    return (
      '<nav class="s-tabbar">' +
      TABS.map(function (t) {
        if (t.fab) {
          return (
            '<div class="fab-slot"><a class="fab" href="' + t.href + '">' +
            svg(I[t.icon], 26, 1.7) + '<span>' + t.label + '</span></a></div>'
          );
        }
        return (
          '<a class="' + (t.key === page ? 'active' : '') + '" href="' + t.href + '">' +
          svg(I[t.icon], 22) + '<span>' + t.label + '</span></a>'
        );
      }).join('') +
      '</nav>'
    );
  }

  /* ---------------- screens ---------------- */
  const SCREENS = {};

  SCREENS.home = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/home').then(function (data) {
      const quick = [
        ['Withdraw', 'withdraw.html', 'withdraw'],
        ['Recharge', 'recharge.html', 'recharge'],
        ['About us', 'about.html', 'about'],
        ['Popular', 'products.html', 'popular']
      ];

      const feedRow = function (f) {
        return (
          '<div class="s-feed-row"><span class="acc">@ ' + esc(f.account) + '</span>' +
          '<span class="amt">+' + Math.round(f.amount) + '</span>' +
          '<span class="date">' + dmy(f.date) + '</span></div>'
        );
      };
      /* the ticker scrolls one full copy of the list, then the duplicate has
         taken its place, so the loop never shows a seam */
      const rows = data.feed.map(feedRow).join('');

      main.innerHTML =
        bannerRail() +
        '<div class="s-quick">' +
        quick.map(function (q) {
          return '<a href="' + q[1] + '">' + svg(I[q[2]], 42, 1.4) + '<span>' + q[0] + '</span></a>';
        }).join('') +
        '</div>' +
        '<h2 class="s-section-title">Withdrawal information</h2>' +
        '<div class="s-feed"><div class="s-feed-track" data-ticker>' +
        '<div class="s-feed-set">' + rows + '</div>' +
        '<div class="s-feed-set" aria-hidden="true">' + rows + '</div>' +
        '</div></div>' +
        '<h2 class="s-title">Partner</h2>' +
        '<div class="s-partners">' +
        data.partners.map(function (p) {
          const style = p.bg
            ? 'background:' + p.bg + ';color:' + p.color
            : 'color:' + p.color + ';border:1px solid #eee';
          return '<div class="s-partner" style="' + style + '">' + esc(p.name) + '</div>';
        }).join('') +
        '</div>';

      runBanner(main);
      runTicker(main);
    });
  };

  /* The ticker runs on one CSS animation whose duration follows the row count,
     so a long list scrolls at the same pace as a short one. */
  function runTicker(host) {
    const track = host.querySelector('[data-ticker]');
    if (!track) return;
    const rows = track.querySelectorAll('.s-feed-set:first-child .s-feed-row').length;
    if (!rows) return;
    track.style.animationDuration = rows * 2.2 + 's';
    track.classList.add('running');
  }

  /* the promotion images the panel runs on its home screen */
  const SLIDES = [
    ['jewellery', 'Fine jewellery'],
    ['fashion', 'Summer fashion'],
    ['couple', 'City style'],
    ['city', 'Rainy season picks'],
    ['beauty', 'Beauty and care']
  ];

  function slide(i) {
    /* the first one loads with the page, the rest arrive as they come round */
    return (
      '<img src="../assets/img/ads/' + SLIDES[i][0] + '.jpg" alt="' + esc(SLIDES[i][1]) + '"' +
      (i ? ' loading="lazy"' : '') + ' decoding="async">'
    );
  }

  /* the banner rail: every slide side by side, moved one width at a time */
  function bannerRail() {
    return (
      '<div class="s-banner"><div class="s-banner-rail" data-rail>' +
      SLIDES.map(function (_, i) { return '<div class="s-slide">' + slide(i) + '</div>'; }).join('') +
      '</div>' +
      '<div class="s-banner-dots" data-dots>' +
      SLIDES.map(function (_, i) {
        return '<button class="' + (i ? '' : 'active') + '" data-go="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>';
      }).join('') +
      '</div></div>'
    );
  }

  /* advance the rail on a timer, and let a tap on a dot jump straight there */
  function runBanner(host) {
    const rail = host.querySelector('[data-rail]');
    const dots = host.querySelectorAll('[data-go]');
    if (!rail) return;
    let at = 0;
    let timer = 0;

    function show(i) {
      at = (i + SLIDES.length) % SLIDES.length;
      rail.style.transform = 'translateX(-' + at * 100 + '%)';
      dots.forEach(function (d, k) { d.classList.toggle('active', k === at); });
    }
    function start() { stop(); timer = setInterval(function () { show(at + 1); }, 4000); }
    function stop() { if (timer) clearInterval(timer); timer = 0; }

    dots.forEach(function (d) {
      d.addEventListener('click', function () { show(Number(d.getAttribute('data-go'))); start(); });
    });
    /* a hidden tab should not keep cycling */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    start();
  }

  SCREENS.recharge = function (main) {
    const presets = [100, 200, 500, 1000, 2000, 3000, 5000, 8000];
    let amount = 100;

    main.innerHTML =
      '<p class="s-field-label">recharge amount</p>' +
      '<input class="s-amount-input" id="amt" type="number" step="0.01" min="0" placeholder="00.00">' +
      '<div class="s-presets">' +
      presets.map(function (v) {
        return '<button class="s-preset" data-v="' + v + '">' + v.toFixed(2) + '</button>';
      }).join('') +
      '</div>' +
      '<h2 class="s-section-title">Please select payment method</h2>' +
      '<div class="s-pay-row">' +
      '<button class="s-pay selected" data-method="USDT">' +
      '<span class="head">' + svg(I.card, 20) + 'RECHARGE</span>' +
      '<span class="body"><b>USDT</b><small>$50 ~ $1000000</small></span></button>' +
      '</div>' +
      '<div class="s-dots"><span class="dot active"></span></div>' +
      '<div class="s-notes" id="notes"></div>' +
      '<button class="s-btn s-big-btn" id="submitRecharge" style="margin-top:22px">Recharge now</button>';

    api('GET', '/seller/home').then(function (d) {
      const host = main.querySelector('#notes');
      if (host) {
        host.innerHTML = (d.rechargeNotes || [])
          .map(function (n, i) { return '<p>*' + (i + 1) + '. ' + esc(n) + '</p>'; })
          .join('');
      }
    });

    const input = main.querySelector('#amt');
    main.querySelectorAll('.s-preset').forEach(function (b) {
      b.addEventListener('click', function () {
        main.querySelectorAll('.s-preset').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        amount = Number(b.getAttribute('data-v'));
        input.value = amount.toFixed(2);
      });
    });
    input.addEventListener('input', function () {
      amount = Number(input.value || 0);
      main.querySelectorAll('.s-preset').forEach(function (x) {
        x.classList.toggle('active', Number(x.getAttribute('data-v')) === amount);
      });
    });

    main.querySelector('#submitRecharge').addEventListener('click', function (e) {
      const btn = e.currentTarget;
      btn.disabled = true;
      api('POST', '/seller/recharge', { amount: Number(input.value || amount) })
        .then(function (r) {
          toast('Recharge request of ' + money(r.amount) + ' sent for approval');
          btn.disabled = false;
        })
        .catch(function (err) {
          toast(err.message);
          btn.disabled = false;
        });
    });
  };

  SCREENS.start = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/summary').then(function (s) {
      main.innerHTML =
        '<div class="s-stat-card">' +
        '<div class="s-stat-grid">' +
        '<div><div class="k">My Balance</div><div class="v">' + money(s.balance) + '</div></div>' +
        '<div><div class="k">Today\'s commission</div><div class="v">' + money(s.todayCommission) + '</div></div>' +
        '<div><div class="k">commission</div><div class="v">' + money(s.totalCommission) + '</div></div>' +
        '</div>' +
        '<div class="s-stat-grid two">' +
        '<div><div class="k">completed</div><div class="v">' + s.completed + '</div></div>' +
        '<div><div class="k">pending</div><div class="v">' + s.pending + '</div></div>' +
        '</div></div>' +
        '<a class="s-vip-row" href="vip.html">' +
        '<span class="s-vip-chip" style="background:' + s.level.color + '">' + s.level.name + '</span>' +
        '<span class="s-vip-meta">' + s.level.rate + '% commission &middot; ' +
        s.dailyUsed + '/' + s.dailyLimit + ' orders today</span>' +
        '<span class="chev">' + svg(I.chevron, 18) + '</span></a>' +
        (s.frozen && s.gap
          ? '<div class="s-frozen-note">Sir your balance is <b>$' + money(s.gap.balance) +
            '</b> but required amount is <b>$' + money(s.gap.required) + '</b>. ' +
            'Your gap is <b>$' + money(s.gap.gap) + '</b> — add $' + money(s.gap.gap) +
            ' and complete the gap first. <a href="recharge.html">Recharge now</a></div>'
          : '') +
        '<button class="s-btn" id="grab" style="margin-top:24px">start grabbing orders</button>' +
        '<div class="s-coupon-art">' + couponArt() + '</div>';

      main.querySelector('#grab').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'matching an order…';
        api('POST', '/seller/grab')
          .then(function (order) {
            /* a premium task lands frozen: show the gap before moving on */
            if (order.status === 'Freezing' && order.gap) {
              gapDialog(order.gap).querySelector('.s-modal-close').addEventListener('click', function () {
                window.location.href = 'orders.html?status=freezing';
              });
              btn.disabled = false;
              btn.textContent = 'start grabbing orders';
              return;
            }
            /* the shop asks for the score on what was just matched, then
               the seller carries on to the order itself */
            toast('Order ' + order.code + ' matched');
            rateDialog(order, function () {
              window.location.href = 'orders.html?status=pending';
            });
          })
          .catch(function (err) {
            const shown = reportGap(err);
            /* a pending order is not a money problem — take them to it */
            if (!shown && err.status === 409) {
              window.location.href = 'orders.html?status=pending';
              return;
            }
            btn.disabled = false;
            btn.textContent = 'start grabbing orders';
          });
      });
    });
  };

  /* the coupon illustration under the grab button */
  function couponArt() {
    return (
      '<svg viewBox="0 0 320 200" aria-hidden="true">' +
      '<defs><linearGradient id="cpn" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#ffb3ab"/><stop offset="100%" stop-color="#f98077"/>' +
      '</linearGradient></defs>' +
      '<g fill="url(#cpn)">' +
      '<g transform="rotate(-18 70 60)">' +
      '<rect x="26" y="40" width="86" height="46" rx="9"/>' +
      '<circle cx="26" cy="63" r="7" fill="#f7f8fa"/><circle cx="112" cy="63" r="7" fill="#f7f8fa"/>' +
      '</g>' +
      '<g transform="rotate(14 210 78)">' +
      '<rect x="168" y="52" width="112" height="60" rx="11"/>' +
      '<circle cx="168" cy="82" r="9" fill="#f7f8fa"/><circle cx="280" cy="82" r="9" fill="#f7f8fa"/>' +
      '</g>' +
      '</g>' +
      '<g fill="#fff" font-family="inherit" font-weight="800">' +
      '<text x="52" y="72" font-size="20" transform="rotate(-18 70 60)">%</text>' +
      '<text x="206" y="96" font-size="28" transform="rotate(14 210 78)">%</text>' +
      '</g>' +
      '<path d="M150 196c-14-6-22-18-22-32 0-10 5-18 13-24l10-7 4 12 9-9c9 8 14 18 14 29 0 14-8 25-22 31z" ' +
      'fill="#f6c9a8"/>' +
      '</svg>'
    );
  }

  SCREENS.orders = function (main) {
    const TABS_O = ['all', 'pending', 'completed', 'freezing'];
    const start = (new URL(window.location.href).searchParams.get('status') || 'all').toLowerCase();
    let active = TABS_O.indexOf(start) > -1 ? start : 'all';

    main.innerHTML =
      '<div class="s-balance-card"><div class="k">My Balance</div><div class="v" id="bal">—</div></div>' +
      '<div class="s-tabs">' +
      TABS_O.map(function (t) {
        return '<button class="s-tab' + (t === active ? ' active' : '') + '" data-t="' + t + '">' + t + '</button>';
      }).join('') +
      '</div><div id="list"><div class="s-loading">Loading…</div></div>';

    const list = main.querySelector('#list');

    function refreshBalance() {
      api('GET', '/seller/summary').then(function (s) { main.querySelector('#bal').textContent = money(s.balance); });
    }

    function load() {
      list.innerHTML = '<div class="s-loading">Loading…</div>';
      api('GET', '/seller/orders?status=' + active).then(function (rows) {
        if (!rows.length) {
          list.innerHTML = '<div class="s-empty">No ' + (active === 'all' ? '' : active + ' ') + 'orders yet</div>';
          return;
        }
        list.innerHTML = rows.map(orderCard).join('');
        list.querySelectorAll('[data-rate]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const o = rows.filter(function (r) { return String(r.id) === btn.getAttribute('data-rate'); })[0];
            if (o) rateDialog(o, load);
          });
        });
        list.querySelectorAll('[data-submit]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            btn.disabled = true;
            api('POST', '/seller/orders/' + btn.getAttribute('data-submit') + '/submit')
              .then(function (r) {
                toast('Order submitted — ' + money(r.order.commission) + ' commission added');
                refreshBalance();
                load();
              })
              .catch(function (err) { reportGap(err); btn.disabled = false; });
          });
        });
      });
    }

    function orderCard(o) {
      const status = String(o.status).toLowerCase();
      return (
        '<div class="s-order">' +
        '<div class="s-order-head"><span class="code">' + esc(o.code) + '</span>' +
        '<span class="s-pill ' + status + '">' + status + '</span></div>' +
        '<div class="time">' + esc(o.createdAt) + '</div>' +
        '<div class="s-item"><div class="thumb">' + (o.image || '\u{1F4E6}') + '</div>' +
        '<div><div class="name">' + esc(o.product) + '</div>' +
        '<div class="meta"><span>$' + money(o.price) + '</span><span>X' + o.qty + '</span></div></div></div>' +
        '<div class="s-order-lines">' +
        '<div><span class="k">Total order:</span><span class="v">$' + money(o.total) + '</span></div>' +
        '<div><span class="k">commission:</span><span class="v money">$' + money(o.commission) + '</span></div>' +
        '</div>' +
        (o.rating
          ? '<div class="s-order-rating"><span class="k">Your rating</span>' + starRow(o.rating) + '</div>'
          : status === 'pending'
            ? '<button class="s-btn s-btn-square s-btn-ghost" data-rate="' + o.id + '">RATE THIS PRODUCT</button>'
            : '') +
        (status === 'pending'
          ? '<button class="s-btn s-btn-square" data-submit="' + o.id + '">SUBMIT ORDER</button>'
          : '') +
        (status === 'freezing'
          ? '<div class="s-frozen-note" style="margin-top:14px">' + esc(o.frozenReason || 'Order frozen') +
            '. Recharge to ' + money(o.total) + ' to unfreeze.</div>' +
            '<a class="s-btn s-btn-square s-btn-ghost" href="recharge.html">RECHARGE TO UNFREEZE</a>'
          : '') +
        '</div>'
      );
    }

    main.querySelectorAll('.s-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        main.querySelectorAll('.s-tab').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        active = b.getAttribute('data-t');
        load();
      });
    });

    refreshBalance();
    load();
  };

  SCREENS.my = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/profile').then(function (p) {
      const tiles = [
        ['Get Order', 'start.html', 'getOrder'],
        ['Account Details', 'account.html', 'account'],
        ['Fund details', 'recharge-record.html', 'funds'],
        ['Withdrawal records', 'withdraw-records.html', 'records'],
        ['Wallet address', 'wallet.html', 'fingerprint'],
        ['USDT', 'usdt.html', 'usdt'],
        ['Change Password', 'password.html', 'lock'],
        ['Linked Account', 'linked.html', 'link']
      ];

      main.innerHTML =
        '<div class="s-me">' +
        '<span class="s-me-avatar">' + svg(I.user || I.fingerprint, 34) + '</span>' +
        '<div class="s-me-info">' +
        '<div class="row"><b>' + esc(p.accountNumber) + '</b>' +
        '<span class="s-tag">' + esc(p.membership) + '</span></div>' +
        '<div class="row">Invite Code: <b class="s-invite-code">' + esc(p.inviteCode) + '</b></div>' +
        '<div class="row muted">Credit Score:' + p.creditScore + '</div>' +
        '</div></div>' +

        '<div class="s-wallet-card">' +
        '<div class="cols">' +
        '<div><div class="k">My Balance</div><div class="v">' + money(p.balance) + '$</div></div>' +
        '<div class="right"><div class="k">Frozen Amount</div><div class="v">' + money(p.frozenAmount) + '$</div></div>' +
        '</div>' +
        /* a frozen order names the gap right on the wallet */
        (p.gap && p.gap.gap > 0
          ? '<a class="s-wallet-gap" href="recharge.html">' +
            '<span class="k">Gap to complete</span>' +
            '<span class="v">$' + money(p.gap.gap) + '</span>' +
            '<span class="sub">balance $' + money(p.gap.balance) +
            ' &middot; required $' + money(p.gap.required) + '</span></a>'
          : '') +
        '<div class="acts">' +
        '<a class="s-dark-btn" href="withdraw.html">' + svg(I.card, 18) + 'Withdraw</a>' +
        '<a class="s-dark-btn" href="recharge.html">' + svg(I.funds, 18) + 'Recharge</a>' +
        '</div></div>' +

        '<div class="s-tiles">' +
        tiles.map(function (t) {
          return (
            '<a class="s-tile" href="' + t[1] + '">' +
            '<span class="ic">' + svg(I[t[2]], 24) + '</span>' +
            '<span class="lb">' + t[0] + '</span></a>'
          );
        }).join('') +
        '</div>' +

        '<button class="s-btn" data-logout style="margin-top:30px">Logout</button>';

      /* no account on file means the form has nothing to pay into, so the
         button says so here rather than letting the seller fill it in first */
      const wBtn = main.querySelector('.acts a[href="withdraw.html"]');
      if (wBtn && p.payout && !p.payout.ready) {
        wBtn.addEventListener('click', function (e) {
          e.preventDefault();
          payoutDialog(p.payout);
        });
      }

      main.querySelector('[data-logout]').addEventListener('click', function () {
        api('POST', '/auth/logout').then(function () { window.location.href = 'login.html'; });
      });
    });
  };

  function row(k, v) {
    return '<div><span class="k">' + k + '</span><span class="v">' + v + '</span></div>';
  }

  SCREENS.funds = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    Promise.all([api('GET', '/seller/profile'), api('GET', '/seller/funds')]).then(function (r) {
      const p = r[0];
      const rows = r[1];
      main.innerHTML =
        '<div class="s-balance-card"><div class="k">My Balance</div><div class="v">' + money(p.balance) + '$</div></div>' +
        '<h2 class="s-section-title">Fund details</h2>' +
        (rows.length
          ? '<div class="s-ledger">' +
            rows.map(function (f) {
              const cls = f.sign > 0 ? 'in' : f.sign < 0 ? 'out' : 'held';
              const sign = f.sign > 0 ? '+' : f.sign < 0 ? '-' : '';
              return (
                '<div class="s-fund"><span class="who"><b>' + esc(f.kind) + '</b>' +
                '<small>' + esc(f.detail) + ' · ' + esc(f.date) + '</small></span>' +
                '<span class="num"><b class="' + cls + '">' + sign + money(f.amount) + '</b>' +
                '<small>' + esc(f.status) + '</small></span></div>'
              );
            }).join('') +
            '</div>'
          : '<div class="s-empty">No movements yet</div>');
    });
  };

  SCREENS.usdt = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/profile').then(function (p) {
      main.innerHTML =
        '<h2 class="s-section-title">USDT</h2>' +
        '<div class="s-card"><div class="s-kv">' +
        row('Network', 'TRC20') +
        row('Recharge range', '$50 ~ $1000000') +
        row('Your wallet', esc(p.wallet || 'not set yet')) +
        row('Balance', money(p.balance) + '$') +
        '</div>' +
        '<div class="s-note" style="margin:16px 0 0">Send USDT on the TRC20 network only. After paying, open ' +
        'Recharge and submit the amount so an administrator can confirm it.</div></div>' +
        '<a class="s-btn" href="recharge.html" style="margin-top:18px">Go to recharge</a>' +
        '<a class="s-btn s-btn-ghost" href="wallet.html" style="margin-top:10px">Set wallet address</a>';
    });
  };

  SCREENS.linked = function (main) {
    function benefit(ic, title, text) {
      return (
        '<div class="s-benefit"><span class="ic">' + svg(I[ic], 22) + '</span>' +
        '<div><b>' + title + '</b><p>' + text + '</p></div></div>'
      );
    }

    function condition(ic, text) {
      return '<div class="s-condition"><span class="ic">' + svg(I[ic], 20) + '</span><p>' + esc(text) + '</p></div>';
    }

    function load() {
      api('GET', '/seller/linked').then(function (d) {
        const shortfall = d.required + 1 - d.completed;

        main.innerHTML =
          '<div class="s-linked-hero">' +
          '<div><h2>Linked Account</h2><p>Bind linked account to enjoy more exclusive benefits</p></div>' +
          '<span class="art">' + svg(I.link, 44, 1.6) + '</span>' +
          '</div>' +

          '<div class="s-panel">' +
          '<div class="s-panel-title">' + svg(I.user, 18) + 'Account Information</div>' +
          '<div class="s-acc-row"><span class="av">' + svg(I.user, 20) + '</span>' +
          '<span class="who"><small>Main Account</small><b>' + esc(d.mainAccount) + '</b></span>' +
          '<button class="s-copy-btn" data-copy="' + esc(d.mainAccount) + '">' + svg(I.copy, 18) + '</button></div>' +
          '<div class="s-acc-row"><span class="av team">' + svg(I.team, 20) + '</span>' +
          '<span class="who"><small>Linked Account</small>' +
          (d.linked ? '<b>' + esc(d.linked.account) + '</b>' : '') + '</span>' +
          (d.linked
            ? '<button class="s-copy-btn" data-copy="' + esc(d.linked.account) + '">' + svg(I.copy, 18) + '</button>'
            : '<button class="s-copy-btn" disabled>' + svg(I.copy, 18) + '</button>') +
          '</div></div>' +

          '<div class="s-divider"><span class="s-divider-chip">' + svg(I.star, 14) + '</span>Member Benefits</div>' +

          '<div class="s-panel tight">' +
          benefit('gift', '🎉 Lucky Order Bonus',
            'After successfully binding a linked account, the probability of triggering a lucky order is ' +
            'increased by 50% compared to ordinary members.') +
          '<hr class="s-hr">' +
          benefit('moneybag', '💵 Increased Commission Rewards',
            'Linked accounts participating in tasks together can enjoy higher commission rewards and ' +
            'increase task earnings.') +
          '</div>' +

          '<div class="s-panel">' +
          '<div class="s-panel-title">' + svg(I.lock, 18) + 'Function Unlock Conditions</div>' +
          condition('vip', 'The linked account function is only available to premium members (VIP).') +
          condition('user', 'This feature is not yet available to regular members.') +
          condition('records', 'Once a member has completed more than ' + d.required +
            ' tasks, the linked account access will be unlocked.') +
          '</div>' +

          '<div class="s-reminder"><span class="ic">' + svg(I.bulb, 18) + '</span>' +
          '<div><b>Friendly Reminder</b><p>Linked accounts are only for member benefits. Each member can only ' +
          'bind one linked account. Please ensure the binding information is accurate.</p></div></div>' +

          (d.linked
            ? '<div class="s-panel"><div class="s-kv">' +
              row('Type', esc(d.linked.kind)) +
              row('Account holder', esc(d.linked.holder || '—')) +
              row('Bound on', esc(d.linked.createdAt)) +
              '</div>' +
              '<button class="s-btn s-btn-ghost danger" data-del="' + d.linked.id + '">Unbind</button></div>'
            : d.unlocked
              ? '<div class="s-panel">' +
                '<div class="s-input-group"><label>Type</label>' +
                '<select class="s-input" id="kind"><option>USDT (TRC20)</option>' +
                '<option>Bank Transfer</option><option>UPI</option></select></div>' +
                '<div class="s-input-group"><label>Account holder</label><input class="s-input" id="holder"></div>' +
                '<div class="s-input-group"><label class="s-req">Account number or address</label>' +
                '<input class="s-input" id="account"></div>' +
                '<button class="s-btn s-big-btn" id="add">Bind linked account</button></div>'
              : '<div class="s-locked">' + svg(I.lock, 20) +
                '<p>' +
                (!d.premium
                  ? 'Your account is a <b>' + esc(d.membership) + '</b> member. Reach a VIP tier to open this feature.'
                  : 'You have completed <b>' + d.completed + '</b> task(s). Complete ' + shortfall +
                    ' more to unlock the linked account.') +
                '</p>' +
                '<a class="s-btn" href="' + (d.premium ? 'start.html' : 'vip.html') + '">' +
                (d.premium ? 'Grab an order' : 'See VIP levels') + '</a></div>');

        main.querySelectorAll('[data-copy]').forEach(function (b) {
          b.addEventListener('click', function () {
            const text = b.getAttribute('data-copy');
            const done = function () { toast('Copied'); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
            else done();
          });
        });

        const add = main.querySelector('#add');
        if (add) {
          add.addEventListener('click', function () {
            add.disabled = true;
            api('POST', '/seller/linked', {
              kind: main.querySelector('#kind').value,
              holder: main.querySelector('#holder').value,
              account: main.querySelector('#account').value
            })
              .then(function () { toast('Linked account bound'); load(); })
              .catch(function (err) { toast(err.message); add.disabled = false; });
          });
        }

        const del = main.querySelector('[data-del]');
        if (del) {
          del.addEventListener('click', function () {
            del.disabled = true;
            api('DELETE', '/seller/linked/' + del.getAttribute('data-del'))
              .then(function () { toast('Linked account removed'); load(); })
              .catch(function (err) { toast(err.message); del.disabled = false; });
          });
        }
      });
    }

    main.innerHTML = '<div class="s-loading">Loading…</div>';
    load();
  };

  function menuLink(href, icon, label) {
    return (
      '<a href="' + href + '">' + svg(I[icon], 20) + esc(label) +
      '<span class="chev">' + svg(I.chevron, 18) + '</span></a>'
    );
  }

  SCREENS.withdraw = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/profile').then(function (p) {
      const masked = String(p.phone || '').replace(/^(\d{3})\d+(\d{3})$/, '$1****$2') || p.email;

      /* reached straight from the address bar, with nothing to be paid into */
      if (p.payout && !p.payout.ready) {
        main.innerHTML =
          '<div class="s-form-card">' +
          '<p class="s-page-title" style="margin-top:0">' + esc(p.payout.title) + '</p>' +
          '<p class="s-form-note" style="text-align:left">' + esc(p.payout.error) + '</p>' +
          '<p class="s-form-note" style="text-align:left">' + esc(p.payout.hint) + '</p>' +
          '<a class="s-btn s-big-btn" href="wallet.html?add=1">Go to Wallet address</a>' +
          '</div>';
        payoutDialog(p.payout);
        return;
      }

      main.innerHTML =
        '<div class="s-withdraw-card">' +
        '<div class="amount">$: ' + money(p.balance) + '</div>' +
        '<div class="cap">amount that can be withdrawn</div>' +
        '<div class="who">' +
        '<div><span class="k">account name</span><span>' + esc(p.name) + '</span></div>' +
        '<div><span class="k">Mobile number</span><span>' + esc(masked) + '</span></div>' +
        '</div></div>' +

        '<p class="s-label-caps">Withdrawal amount</p>' +
        '<div class="s-amount-line"><span>$</span>' +
        '<input id="amt" inputmode="decimal" placeholder="Please enter the withdrawal amount"></div>' +
        '<input class="s-input" id="pw" type="password" placeholder="Enter login password">' +
        '<button class="s-btn s-big-btn" id="go">Withdrawal</button>' +
        (p.frozenAmount ? '<p class="s-form-note">' + money(p.frozenAmount) + ' is held by a request waiting for approval.</p>' : '');

      main.querySelector('#go').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        btn.disabled = true;
        api('POST', '/seller/withdraw', {
          amount: Number(main.querySelector('#amt').value || 0),
          password: main.querySelector('#pw').value
        })
          .then(function (r) {
            toast('Withdrawal of ' + money(r.amount) + ' requested');
            window.location.href = 'withdraw-records.html';
          })
          .catch(function (err) {
            const pay = err && err.data && err.data.payout;
            if (pay) payoutDialog(pay); else toast(err.message);
            btn.disabled = false;
          });
      });
    });
  };

  /* ACCOUNT DETAILS is the money ledger */
  SCREENS.account = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/ledger').then(function (rows) {
      main.innerHTML =
        '<p class="s-page-title">Account details</p>' +
        (rows.length
          ? rows.map(function (r) {
              return (
                '<div class="s-ledger-row"><span>' +
                '<div class="when">' + esc(r.at) + '</div>' +
                (r.tag ? '<span class="tag">' + esc(r.tag) + '</span>' : '') +
                '</span>' +
                '<span class="amt' + (r.sign < 0 ? ' out' : '') + '">' +
                (r.sign < 0 ? '-' : '+') + money(r.amount) + '$</span></div>'
              );
            }).join('')
          : '<div class="s-nodata">NOT Data</div>');
    });
  };

  SCREENS['recharge-record'] = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/records/recharge').then(function (d) {
      main.innerHTML =
        '<p class="s-page-title">Recharge record</p>' +
        '<div class="s-cumulative">Cumulative recharge: $' + money(d.cumulative) + '</div>' +
        (d.rows.length
          ? d.rows.map(function (r) {
              return (
                '<div class="s-ledger-row"><span>' +
                '<div class="when">' + esc(r.date) + (r.time ? ' ' + esc(r.time) : '') + '</div>' +
                '<span class="tag">' + esc(r.status) + ' · ' + esc(r.method) + '</span></span>' +
                '<span class="amt">+' + money(r.amount) + '$</span></div>'
              );
            }).join('')
          : '<div class="s-nodata">NOT Data</div>');
    });
  };

  SCREENS['withdraw-records'] = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/records/withdraw').then(function (d) {
      main.innerHTML =
        '<p class="s-page-title">Withdrawal record</p>' +
        '<div class="s-cumulative">Cumulative withdrawal: $' + money(d.cumulative) + '</div>' +
        (d.rows.length
          ? d.rows.map(function (w) {
              return (
                '<div class="s-ledger-row"><span>' +
                '<div class="when">' + esc(w.date) + (w.time ? ' ' + esc(w.time) : '') + '</div>' +
                '<span class="tag">' + esc(w.status) + (w.method ? ' · ' + esc(w.method) : '') + '</span></span>' +
                '<span class="amt out">-' + money(w.amount) + '$</span></div>'
              );
            }).join('')
          : '<div class="s-nodata">NOT Data</div>');
    });
  };

  SCREENS.bank = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/bank').then(function (b) {
      main.innerHTML =
        '<p class="s-page-title">Your bank card information</p>' +
        '<div class="s-input-group"><span class="s-hint-label">Bank name</span>' +
        '<select class="s-input" id="bank">' +
        b.banks.map(function (n) {
          return '<option' + (n === b.bank ? ' selected' : '') + '>' + esc(n) + '</option>';
        }).join('') +
        '</select></div>' +
        '<div class="s-input-group"><label class="s-req">Beneficiary Name</label>' +
        '<input class="s-input" id="beneficiary" value="' + esc(b.beneficiary) + '"></div>' +
        '<div class="s-input-group"><label class="s-req">Bank Account Number</label>' +
        '<input class="s-input" id="account" inputmode="numeric" value="' + esc(b.account) + '"></div>' +
        '<div class="s-input-group"><label class="s-req">IFSC</label>' +
        '<input class="s-input" id="ifsc" value="' + esc(b.ifsc) + '"></div>' +
        '<div class="s-input-group"><span class="s-hint-label">Enter login password</span>' +
        '<input class="s-input" id="pw" type="password"></div>' +
        '<button class="s-btn s-big-btn" id="go">Confirm modification</button>' +
        '<div class="s-form-card"><p class="s-form-note" style="margin:0">Do not enter the bank password, and do not ' +
        'disclose your bank card information to others</p></div>';

      main.querySelector('#go').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        btn.disabled = true;
        api('PUT', '/seller/bank', {
          bank: main.querySelector('#bank').value,
          beneficiary: main.querySelector('#beneficiary').value,
          account: main.querySelector('#account').value,
          ifsc: main.querySelector('#ifsc').value,
          password: main.querySelector('#pw').value
        })
          .then(function () { toast('Bank card saved'); btn.disabled = false; main.querySelector('#pw').value = ''; })
          .catch(function (err) { toast(err.message); btn.disabled = false; });
      });
    });
  };

  SCREENS.wallet = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/wallet').then(function (w) {
      /* a bank payout needs the card details, a crypto payout needs an
         address — so the method decides which form comes next */
      const isBank = function (m) { return /bank/i.test(m || ''); };

      function fields(m) {
        if (!m) return '<p class="s-form-note" style="text-align:left">Choose how you want to be paid.</p>';
        if (isBank(m)) {
          return (
            '<div class="s-input-group"><span class="s-hint-label">Bank name</span>' +
            '<select class="s-input" id="bank">' +
            w.banks.map(function (n) {
              return '<option' + (n === w.bank ? ' selected' : '') + '>' + esc(n) + '</option>';
            }).join('') +
            '</select></div>' +
            '<div class="s-input-group"><label class="s-req">Beneficiary Name</label>' +
            '<input class="s-input" id="beneficiary" value="' + esc(w.beneficiary) + '"></div>' +
            '<div class="s-input-group"><label class="s-req">Bank Account Number</label>' +
            '<input class="s-input" id="account" inputmode="numeric" value="' + esc(w.account) + '"></div>' +
            '<div class="s-input-group"><label class="s-req">IFSC</label>' +
            '<input class="s-input" id="ifsc" value="' + esc(w.ifsc) + '"></div>'
          );
        }
        return (
          '<div class="s-input-group"><label class="s-req">Wallet Address</label>' +
          '<input class="s-input" id="addr" value="' + esc(w.wallet) + '"></div>'
        );
      }

      /* sent here by the withdrawal screen: say which step comes first */
      const sentToAdd = /[?&]add=1/.test(window.location.search);

      function draw(m) {
        main.innerHTML =
          '<p class="s-page-title">Your wallet information</p>' +
          (sentToAdd && !m
            ? '<div class="s-form-card s-payout-call"><p class="s-form-note" style="margin:0;text-align:left">' +
              'Select your payment method below, then add the account you want to be paid into. ' +
              'Withdrawals open once it is saved.</p></div>'
            : '') +
          '<div class="s-input-group">' +
          '<select class="s-input" id="method">' +
          '<option value="">Select withdrawal method</option>' +
          w.methods.map(function (x) {
            return '<option' + (x === m ? ' selected' : '') + '>' + esc(x) + '</option>';
          }).join('') +
          '</select></div>' +
          fields(m) +
          '<div class="s-input-group"><span class="s-hint-label">Enter login password</span>' +
          '<input class="s-input" id="pw" type="password"></div>' +
          '<button class="s-btn s-big-btn" id="go"' + (m ? '' : ' disabled') + '>Confirm modification</button>' +
          (isBank(m)
            ? '<div class="s-form-card"><p class="s-form-note" style="margin:0">Do not enter the bank password, and do ' +
              'not disclose your bank card information to others</p></div>'
            : '');

        main.querySelector('#method').addEventListener('change', function (e) {
          draw(e.target.value);
        });

        main.querySelector('#go').addEventListener('click', function (e) {
          const btn = e.currentTarget;
          const password = main.querySelector('#pw').value;
          btn.disabled = true;

          const done = function (what) {
            toast(what + ' saved');
            btn.disabled = false;
            main.querySelector('#pw').value = '';
          };
          const fail = function (err) { toast(err.message); btn.disabled = false; };

          if (isBank(m)) {
            api('PUT', '/seller/bank', {
              bank: main.querySelector('#bank').value,
              beneficiary: main.querySelector('#beneficiary').value,
              account: main.querySelector('#account').value,
              ifsc: main.querySelector('#ifsc').value,
              password: password
            }).then(function () {
              w.bank = main.querySelector('#bank').value;
              w.beneficiary = main.querySelector('#beneficiary').value;
              w.account = main.querySelector('#account').value;
              w.ifsc = main.querySelector('#ifsc').value;
              done('Bank card');
            }, fail);
            return;
          }

          api('PUT', '/seller/wallet', {
            wallet: main.querySelector('#addr').value,
            method: m,
            password: password
          }).then(function () {
            w.wallet = main.querySelector('#addr').value;
            done('Wallet');
          }, fail);
        });
      }

      draw(w.method);
    });
  };

  /* the hub with the two password buttons */
  SCREENS.password = function (main) {
    main.innerHTML =
      '<div class="s-stack">' +
      '<a class="s-btn" href="password-login.html">Change password</a>' +
      '<a class="s-btn" href="password-withdraw.html">Modify the withdrawal password</a>' +
      '</div>';
  };

  function passwordForm(main, heading, type) {
    main.innerHTML =
      '<h2 class="s-heading-lg">' + heading + '</h2>' +
      '<div class="s-error" id="err" style="display:none"></div>' +
      '<div class="s-input-group"><input class="s-input" id="old" type="password" placeholder="Old password"></div>' +
      '<div class="s-input-group"><input class="s-input" id="next" type="password" placeholder="new password"></div>' +
      '<div class="s-input-group"><input class="s-input" id="again" type="password" placeholder="Confirm Password"></div>' +
      '<button class="s-btn s-big-btn" id="go">Next</button>' +
      '<p class="s-form-note">Please remember your password . if you forget your password, please contact customer service .</p>';

    const err = main.querySelector('#err');
    main.querySelector('#go').addEventListener('click', function (e) {
      const btn = e.currentTarget;
      const next = main.querySelector('#next').value;
      err.style.display = 'none';

      if (next !== main.querySelector('#again').value) {
        err.textContent = 'The two passwords do not match';
        err.style.display = 'block';
        return;
      }

      btn.disabled = true;
      api('POST', '/seller/password', { type: type, current: main.querySelector('#old').value, next: next })
        .then(function () {
          toast(type === 'withdraw' ? 'Withdrawal password changed' : 'Password changed');
          main.querySelectorAll('input').forEach(function (i) { i.value = ''; });
          btn.disabled = false;
        })
        .catch(function (e2) {
          err.textContent = e2.message;
          err.style.display = 'block';
          btn.disabled = false;
        });
    });
  }

  SCREENS['password-login'] = function (main) { passwordForm(main, 'Change Password', 'login'); };
  SCREENS['password-withdraw'] = function (main) { passwordForm(main, 'modify the withdrawal password', 'withdraw'); };

  SCREENS.products = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/products').then(function (rows) {
      main.innerHTML =
        '<h2 class="s-section-title">My products</h2>' +
        rows.map(function (p) {
          return (
            '<div class="s-order"><div class="s-item">' +
            '<div class="thumb">' + p.image + '</div>' +
            '<div><div class="name">' + esc(p.name) + '</div>' +
            '<div class="meta"><span>$' + money(p.price) + '</span><span>' + p.rate + '% commission</span></div>' +
            '</div></div></div>'
          );
        }).join('');
    });
  };

  SCREENS.vip = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/vip').then(function (v) {
      main.innerHTML =
        '<div class="s-balance-card"><div class="k">My Balance</div><div class="v">' + money(v.balance) + '</div></div>' +
        '<h2 class="s-section-title">VIP levels</h2>' +
        v.levels.map(function (l) {
          const current = l.name === v.current;
          return (
            '<div class="s-vip-card' + (current ? ' current' : '') + '" style="border-color:' + l.color + '">' +
            '<div class="head"><span class="s-vip-chip" style="background:' + l.color + '">' + l.name + '</span>' +
            (current
              ? '<span class="tag">current</span>'
              : l.unlocked
                ? '<span class="tag done">unlocked</span>'
                : '<span class="tag locked">needs ' + money(l.needed) + ' more</span>') +
            '</div>' +
            '<div class="s-kv">' +
            '<div><span class="k">Commission per order</span><span class="v">' + l.rate + '%</span></div>' +
            '<div><span class="k">Orders per day</span><span class="v">' + l.dailyOrders + '</span></div>' +
            '<div><span class="k">Balance required</span><span class="v">' + money(l.minBalance) + '</span></div>' +
            '</div></div>'
          );
        }).join('') +
        '<p class="s-hint">Your level follows your balance — recharge to reach the next tier and every ' +
        'order you grab pays the higher rate.</p>' +
        '<a class="s-btn" href="recharge.html" style="margin-top:16px">Recharge</a>';
    });
  };

  SCREENS.team = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/team').then(function (t) {
      main.innerHTML =
        '<div class="s-stat-card">' +
        '<div class="s-stat-grid two">' +
        '<div><div class="k">Team members</div><div class="v">' + t.totals.members + '</div></div>' +
        '<div><div class="k">Team commission</div><div class="v">' + money(t.totals.commission) + '</div></div>' +
        '</div></div>' +
        '<h2 class="s-section-title">Invite link</h2>' +
        '<div class="s-card">' +
        '<div class="s-invite"><span id="link">' + esc(t.link) + '</span>' +
        '<button class="s-icon-btn" data-copy>' + svg(I.copy, 20) + '</button></div>' +
        '<div class="s-kv" style="margin-top:14px">' +
        '<div><span class="k">Invite code</span><span class="v">' + esc(t.inviteCode) + '</span></div>' +
        '</div></div>' +
        '<h2 class="s-section-title">Commission from the team</h2>' +
        '<div class="s-levels">' +
        t.levels.map(function (l) {
          return (
            '<div class="s-level"><b>Level ' + l.level + '</b>' +
            '<span>' + l.members + ' member' + (l.members === 1 ? '' : 's') + '</span>' +
            '<span class="rate">' + l.rate + '%</span>' +
            '<span class="amt">' + money(l.commission) + '</span></div>'
          );
        }).join('') +
        '</div>' +
        '<h2 class="s-section-title">Members</h2>' +
        (t.members.length
          ? t.members.map(function (m) {
              return (
                '<div class="s-member"><span class="s-avatar sm">' + esc(m.name.charAt(0).toUpperCase()) + '</span>' +
                '<span class="who"><b>' + esc(m.name) + '</b><small>L' + m.level + ' &middot; joined ' + esc(m.joined) + '</small></span>' +
                '<span class="num"><b>' + money(m.share) + '</b><small>' + m.orders + ' orders</small></span></div>'
              );
            }).join('')
          : '<div class="s-empty">No one has joined with your link yet</div>');

      main.querySelector('[data-copy]').addEventListener('click', function () {
        const text = t.link;
        const done = function () { toast('Invite link copied'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed'); }
          ta.remove();
        }
      });
    });
  };

  SCREENS.about = function (main) {
    main.innerHTML =
      '<h2 class="s-section-title">About us</h2>' +
      '<div class="s-card">' +
      '<p style="margin-top:0">Club Elite 21 partners with international retailers to match sellers with ' +
      'order tasks. Every order you grab pays a commission on the order value, credited to your balance ' +
      'as soon as you submit it.</p>' +
      '<p>Recharge to raise the order value you can take on, and withdraw your balance at any time — ' +
      'requests are reviewed by an administrator before payout.</p>' +
      '<p style="margin-bottom:0">Support is available around the clock from the headset icon in the header.</p>' +
      '</div>';
  };

  /* ---------------- login and register ---------------- */
  SCREENS.login = function (main) {
    const url = new URL(window.location.href);
    const startTab = (url.searchParams.get('tab') || 'login').toLowerCase();
    /* an invite link carries the code, so the joiner does not have to type it */
    const invited = url.searchParams.get('invite') || url.searchParams.get('inviter') || '';
    let tab = startTab === 'register' ? 'register' : 'login';

    function draw() {
      main.innerHTML =
        '<div class="s-auth-cart">\u{1F6D2}</div>' +
        '<div class="s-auth-tabs">' +
        '<button class="' + (tab === 'login' ? 'active' : '') + '" data-tab="login">Login</button>' +
        '<button class="' + (tab === 'register' ? 'active' : '') + '" data-tab="register">Register</button>' +
        '</div>' +
        '<div class="s-error" id="err" style="display:none"></div>' +
        (tab === 'login'
          ? '<div class="s-auth-field"><label>your mobile phone number</label>' +
            '<input class="s-input" id="phone" inputmode="numeric" placeholder="your mobile phone number"></div>' +
            '<div class="s-auth-field"><label>your password</label>' +
            '<input class="s-input" id="password" type="password" placeholder="your password"></div>' +
            '<button class="s-btn" id="go">Login</button>'
          : '<div class="s-auth-field"><label>your name</label>' +
            '<input class="s-input" id="name" placeholder="your name"></div>' +
            '<div class="s-auth-field"><label>your mobile phone number</label>' +
            '<input class="s-input" id="phone" inputmode="numeric" placeholder="your mobile phone number"></div>' +
            '<div class="s-auth-field"><label>your password</label>' +
            '<input class="s-input" id="password" type="password" placeholder="your password"></div>' +
            '<div class="s-auth-field"><label>confirm password</label>' +
            '<input class="s-input" id="confirm" type="password" placeholder="confirm password"></div>' +
            '<div class="s-auth-field"><label>invitation code</label>' +
            '<input class="s-input" id="invite" placeholder="invitation code" value="' + esc(invited) + '"></div>' +
            '<button class="s-btn" id="go">Register</button>') +
        '<p class="s-terms">By continuing, you agree to our Terms and Conditions &amp; Privacy Policy</p>';

      main.querySelectorAll('[data-tab]').forEach(function (b) {
        b.addEventListener('click', function () {
          tab = b.getAttribute('data-tab');
          draw();
        });
      });

      const err = main.querySelector('#err');
      const fail = function (message, btn, label) {
        err.textContent = message;
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = label;
      };

      main.querySelector('#go').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        const label = btn.textContent;
        const phone = main.querySelector('#phone').value.trim();
        const password = main.querySelector('#password').value;
        err.style.display = 'none';

        if (!phone || !password) return fail('Enter your mobile number and password', btn, label);

        btn.disabled = true;
        btn.textContent = tab === 'login' ? 'Signing in…' : 'Creating account…';

        if (tab === 'login') {
          api('POST', '/auth/login', { phone: phone, password: password })
            .then(function (r) {
              /* an administrator is signed in either way — send them to their
                 own side rather than turning them away */
              window.location.href = r.user.role === 'Admin' ? '../index.html' : 'index.html';
            })
            .catch(function (e2) { fail(e2.message, btn, label); });
          return;
        }

        if (password !== main.querySelector('#confirm').value) return fail('The two passwords do not match', btn, label);

        const named = main.querySelector('#name').value.trim();
        if (!named) return fail('Enter your name', btn, label);

        api('POST', '/auth/register', {
          name: named,
          phone: phone,
          password: password,
          inviter: main.querySelector('#invite').value.trim() || 'admin',
          /* this door opens a seller account — the panel's own sign-up
             makes customers */
          as: 'Seller'
        })
          .then(function () { window.location.href = 'index.html'; })
          .catch(function (e2) { fail(e2.message, btn, label); });
      });
    }

    draw();
  };

  /* ---------------- the shop window shown to a visitor ---------------- */
  SCREENS.welcome = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/landing').then(function (d) {
      main.innerHTML =
        '<div class="s-guest-top"><span style="font-size:28px">\u{1F6D2}</span>' +
        '<button class="s-icon-btn" data-lang>' + svg(I.globe, 24) + '</button></div>' +
        '<div class="s-guest-banner">' +
        '<h2>' + esc(d.headline) + '</h2>' +
        '<p>' + esc(d.sub) + '</p>' +
        '<span class="offer">' + esc(d.offer) + '</span>' +
        '<div><a class="shop" href="login.html">Shop Now</a></div>' +
        '</div>' +
        '<a class="s-guest-cta" href="login.html">' + svg(I.fingerprint, 22) + 'Login / Registered account</a>' +
        '<div class="s-guest-grid">' +
        d.products.map(function (p) {
          return (
            '<a class="s-guest-item" href="login.html">' +
            '<div class="shot">' + p.image + '</div>' +
            '<div class="name">' + esc(p.name) + '</div>' +
            '<div class="price">$' + money(p.price) + '</div></a>'
          );
        }).join('') +
        '</div>' +
        '<div class="s-guest-bar"><span class="cart">\u{1F6D2}</span>' +
        '<a class="ghost" href="login.html">Login</a>' +
        '<a class="solid" href="login.html?tab=register">Registered account</a></div>';
    });
  };

  /* ---------------- MALL: customer service ---------------- */
  /* the EN chip in the header opens this list */
  const LANGUAGES = [
    ['en', 'English'], ['es', 'Spanish'], ['pt', 'Portuguese'], ['id', 'Indonesia'],
    ['vi', 'Vietnamese'], ['tr', 'Turkish'], ['au', 'Australia'], ['ar', 'Arabic'],
    ['th', 'Thai'], ['az', 'Azerbaijani'], ['uz', 'Uzbekistan'], ['ko', 'Korea'],
    ['ru', 'Russia'], ['bn', 'Bengali'], ['kk', 'Kazakh'], ['ka', 'Georgian'],
    ['hi', 'Hindi'], ['ur', 'Urdu'], ['fr', 'French'], ['de', 'German'],
    ['it', 'Italian'], ['ja', 'Japan'], ['zh', 'Chinese'], ['ms', 'Malaysia'],
    ['fil', 'Philippines'], ['fa', 'Persian']
  ];

  function currentLang() {
    try { return localStorage.getItem('club21-lang') || 'en'; } catch (e) { return 'en'; }
  }

  SCREENS.language = function (main) {
    const active = currentLang();
    main.innerHTML =
      '<div class="s-lang-list">' +
      LANGUAGES.map(function (l) {
        return (
          '<button class="s-lang-row' + (l[0] === active ? ' active' : '') + '" data-code="' + l[0] + '">' +
          '<span class="flag">' + l[0].slice(0, 2).toUpperCase() + '</span>' +
          '<span class="name">' + l[1] + '</span>' +
          '<span class="chev">' + svg(I.chevron, 18) + '</span></button>'
        );
      }).join('') +
      '</div>';

    main.querySelectorAll('[data-code]').forEach(function (b) {
      b.addEventListener('click', function () {
        const code = b.getAttribute('data-code');
        try { localStorage.setItem('club21-lang', code); } catch (e) {}
        main.querySelectorAll('[data-code]').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        toast(code === 'en'
          ? 'English selected'
          : b.querySelector('.name').textContent + ' selected — the interface stays in English for now');
      });
    });
  };

  SCREENS.mall = function (main) {
    main.innerHTML = '<div class="s-loading">Loading…</div>';
    api('GET', '/seller/home').then(function (d) {
      const svc = d.service;
      main.innerHTML =
        '<div class="s-service-card">' +
        '<div class="ic">' + svg(I.chat, 34) + '</div>' +
        '<div class="t">' + esc(svc.title) + '</div>' +
        '<div class="h">' + esc(svc.hours) + '</div>' +
        '</div>' +
        '<div class="s-mas"><span class="dot"></span>' +
        '<b>MAS</b><span>MONETARY AUTHORITY<br>OF SINGAPORE</span></div>';
    });
  };

  /* ---------------- boot ---------------- */
  function boot() {
    const app = document.querySelector('.app');
    if (!app) return;
    const page = app.getAttribute('data-page');
    const main = app.querySelector('.s-main');
    const teal = !!TOPBARS[page];

    if (page === 'welcome') {
      /* the shop window has its own chrome */
      SCREENS.welcome(main);
      return;
    }

    if (page === 'language') {
      app.insertAdjacentHTML('afterbegin', plainbar(page));
      wireChrome(app);
      SCREENS.language(main);
      return;
    }

    if (page === 'login') {
      app.insertAdjacentHTML('afterbegin',
        '<header class="s-topbar"><button class="back" data-back>' + svg(I.back, 24) + '</button>' +
        '<h1>Login</h1><button class="right" data-lang>' + svg(I.globe, 22) + '</button></header>');
      wireChrome(app);
      SCREENS.login(main);
      return;
    }

    if (page === 'mall') {
      app.insertAdjacentHTML('afterbegin',
        '<div class="s-mall-hero"><button class="s-icon-btn bell" data-bell>' + svg(I.bell, 24) + '</button>' +
        '<h1>MALL</h1></div>');
    } else {
      app.insertAdjacentHTML('afterbegin', PLAINBARS[page] ? plainbar(page) : teal ? topbar(page) : header());
    }

    if (!teal && !PLAINBARS[page]) app.insertAdjacentHTML('beforeend', tabbar(page));
    wireChrome(app);

    /* guard: only a signed-in seller may open the app */
    api('GET', '/seller/summary')
      .then(function () { SCREENS[page](main); })
      .catch(function (err) {
        if (err.status === 401) return (window.location.href = 'login.html');
        if (err.status === 403) return (window.location.href = '../index.html');
        main.innerHTML =
          '<div class="s-empty">Could not reach the server.<br><br>' +
          'Start it with <b>npm start</b> and open this page from that address.</div>';
      });
  }

  function wireChrome(app) {
    const back = app.querySelector('[data-back]');
    if (back) {
      back.addEventListener('click', function () {
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'my.html';
      });
    }
    const support = app.querySelector('[data-support]');
    if (support) support.addEventListener('click', function () { window.location.href = 'mall.html'; });
    const bell = app.querySelector('[data-bell]');
    if (bell) bell.addEventListener('click', function () { toast('No new notifications'); });
    const lang = app.querySelector('[data-lang]');
    if (lang) lang.addEventListener('click', function () { window.location.href = 'language.html'; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
(function(){var s=document.createElement('script');s.src='https://plugin-code.salesmartly.com/js/project_817643_847406_1788056247.js';document.head.appendChild(s);})();