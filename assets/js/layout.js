/* =========================================================
   Shared shell: sidebar, navbar, footer, theme, helpers.
   ========================================================= */
(function () {
  const icon = window.ICONS;
  const DB = window.DB;

  /* ---------------- helpers ---------------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const U = {
    money: function (n) {
      return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    date: function (iso) {
      const p = String(iso).split('-');
      return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0];
    },
    initial: function (name) {
      return (name || '?').trim().charAt(0).toUpperCase();
    },
    avatarClass: function (name) {
      const tones = ['av-primary', 'av-success', 'av-warning', 'av-danger', 'av-info'];
      let sum = 0;
      for (let i = 0; i < (name || '').length; i++) sum += name.charCodeAt(i);
      return tones[sum % tones.length];
    },
    badge: function (status) {
      const key = String(status).toLowerCase().replace(/[^a-z]/g, '');
      return '<span class="badge badge-' + key + '">' + status + '</span>';
    },
    userCell: function (name, email) {
      if (!name) return '<span class="text-muted">N/A</span>';
      return (
        '<div class="user-cell">' +
        '<span class="avatar ' + U.avatarClass(name) + '">' + U.initial(name) + '</span>' +
        '<span><span class="u-name">' + name + '</span>' +
        (email ? '<br><span class="u-mail">' + email + '</span>' : '') +
        '</span></div>'
      );
    },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    toast: function (msg) {
      let stack = document.querySelector('.toast-stack');
      if (!stack) {
        stack = document.createElement('div');
        stack.className = 'toast-stack';
        document.body.appendChild(stack);
      }
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = '<span class="t-ok">' + icon('checkCircle', 18) + '</span><span>' + U.esc(msg) + '</span>';
      stack.appendChild(el);
      setTimeout(function () { el.remove(); }, 2600);
    },
    modal: function (title, bodyHtml, footHtml) {
      const back = document.createElement('div');
      back.className = 'modal-backdrop show';
      back.innerHTML =
        '<div class="modal">' +
        '<div class="modal-head"><h3>' + title + '</h3>' +
        '<button class="icon-btn" data-close>' + icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' + bodyHtml + '</div>' +
        '<div class="modal-foot">' + (footHtml || '<button class="btn btn-secondary" data-close>Close</button>') + '</div>' +
        '</div>';
      document.body.appendChild(back);
      function close() { back.remove(); }
      back.addEventListener('click', function (e) {
        if (e.target === back || e.target.closest('[data-close]')) close();
      });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
      });
      back.close = close;
      return back;
    },
    detailRows: function (pairs) {
      return (
        '<div class="detail-list">' +
        pairs
          .map(function (p) {
            return '<div class="detail-row"><span class="k">' + p[0] + '</span><span class="v">' + p[1] + '</span></div>';
          })
          .join('') +
        '</div>'
      );
    }
  };
  window.U = U;

  /* ---------------- theme ---------------- */
  const THEME_KEY = 'club21-theme';
  function currentTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'light'; } catch (e) { return 'light'; }
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = icon(t === 'dark' ? 'moon' : 'sun', 22);
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  applyTheme(currentTheme());

  /* ---------------- menu definition ---------------- */
  /* built per render so the badges reflect freshly loaded data */
  function menu() {
    return [
      { key: 'dashboard', label: 'Dashboard', icon: 'home', href: 'index.html' },
      { header: 'Apps & Pages' },
      { key: 'orders', label: 'Orders', icon: 'cart', href: 'orders.html', badge: DB.pendingOrders },
      { key: 'withdraws', label: 'Withdraw Requests', icon: 'withdraw', href: 'withdraw-requests.html' },
      { key: 'recharges', label: 'Recharge Requests', icon: 'recharge', href: 'recharge-requests.html', badge: DB.pendingRecharges },
      { key: 'products', label: 'Products', icon: 'products', href: 'products.html' },
      { key: 'seller-orders', label: 'Seller Tasks', icon: 'tasks', href: 'seller-orders.html' },
      { key: 'vip-levels', label: 'VIP Levels', icon: 'crown', href: 'vip-levels.html' },
      {
        key: 'users',
        label: 'Users',
        icon: 'users',
        children: [
          { key: 'users-agents', label: 'Agents', href: 'agents.html' },
          { key: 'users-sellers', label: 'Sellers', href: 'sellers.html' },
          { key: 'users-customers', label: 'Customers', href: 'customers.html' },
          { key: 'users-archived', label: 'Archived Users', href: 'archived-users.html' }
        ]
      }
    ];
  }

  const LOGO =
    '<svg class="brand-logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="bagG" x1="8" y1="20" x2="56" y2="60" gradientUnits="userSpaceOnUse">' +
    '<stop stop-color="#e9c159"/><stop offset="1" stop-color="#b07d12"/></linearGradient>' +
    '<linearGradient id="starG" x1="18" y1="4" x2="46" y2="26" gradientUnits="userSpaceOnUse">' +
    '<stop stop-color="#fff2cc"/><stop offset="1" stop-color="#e6b83f"/></linearGradient></defs>' +
    '<path d="M10 22h44l-4 34a4 4 0 0 1-4 3.6H18A4 4 0 0 1 14 56z" fill="url(#bagG)"/>' +
    '<path d="M22 26V19a10 10 0 0 1 20 0v7" stroke="#8a6210" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M14 40c8 4 14 5 20 3s12-5 20-3l-2.2 16a4 4 0 0 1-4 3.6H18A4 4 0 0 1 14 56z" fill="#f2d68e" opacity=".85"/>' +
    '<path d="M32 2l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L32 25.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill="url(#starG)"/>' +
    '</svg>';

  /* ---------------- sidebar ---------------- */
  function buildSidebar(page) {
    const items = menu().map(function (m) {
      if (m.header) return '<li class="menu-header">' + m.header + '</li>';

      if (m.children) {
        const openish = m.children.some(function (c) { return c.key === page; });
        const subs = m.children
          .map(function (c) {
            return (
              '<li class="menu-item' + (c.key === page ? ' active' : '') + '">' +
              '<a class="menu-link" href="' + c.href + '"><span class="sub-dot"></span>' +
              '<span class="menu-text">' + c.label + '</span></a></li>'
            );
          })
          .join('');
        return (
          '<li class="menu-item has-sub' + (openish ? ' open' : '') + '">' +
          '<a class="menu-link" href="javascript:void(0)" data-toggle-sub>' +
          icon(m.icon, 22) +
          '<span class="menu-text">' + m.label + '</span>' +
          '<span class="menu-arrow">' + icon('chevronRight', 18) + '</span></a>' +
          '<ul class="submenu">' + subs + '</ul></li>'
        );
      }

      return (
        '<li class="menu-item' + (m.key === page ? ' active' : '') + '">' +
        '<a class="menu-link" href="' + m.href + '">' +
        icon(m.icon, 22) +
        '<span class="menu-text">' + m.label + '</span>' +
        (m.badge ? '<span class="menu-badge">' + m.badge + '</span>' : '') +
        '</a></li>'
      );
    }).join('');

    return (
      '<div class="sidebar-brand">' +
      '<a class="brand-link" href="index.html">' + LOGO +
      '<span class="brand-text">Club Elite 21</span></a>' +
      '<button class="sidebar-toggle" id="sidebarToggle" title="Collapse menu">' + icon('circle', 20) + '</button>' +
      '</div>' +
      '<ul class="menu">' + items + '</ul>'
    );
  }

  /* the invite link the navbar shows is the very one it opens */
  function inviteHref() {
    return 'seller/login.html?tab=register&invite=' + encodeURIComponent(DB.admin.name);
  }
  function inviteUrl() {
    return new URL(inviteHref(), window.location.href).href;
  }

  /* ---------------- navbar ---------------- */
  function buildNavbar() {
    return (
      '<button class="nav-toggler" id="navToggler" aria-label="Menu">' + icon('menu', 24) + '</button>' +
      '<div class="invite-link">' +
      '<a href="' + inviteHref() + '" id="inviteLink"' +
      ' title="' + inviteUrl() + '">' + inviteUrl() + '</a>' +
      '<button class="copy-btn" id="copyLink" title="Copy invite link">' + icon('copy', 18) + '</button>' +
      '</div>' +
      '<div class="nav-right">' +
      '<span class="nav-clock" id="clock">--:-- --</span>' +
      '<button class="icon-btn" id="themeToggle" title="Toggle theme">' + icon('sun', 22) + '</button>' +
      '<div class="dropdown" id="userDropdown">' +
      '<span class="avatar-wrap" role="button" tabindex="0" id="avatarBtn">' +
      '<span class="avatar-img">' + icon('user', 26) + '</span><span class="status-dot"></span></span>' +
      '<div class="user-menu" id="userMenu">' +
      '<div class="um-head"><span class="avatar avatar-lg av-primary">' + U.initial(DB.admin.name) + '</span>' +
      '<span><strong>' + DB.admin.name + '</strong><br><small>' + DB.admin.role + '</small></span></div>' +
      '<a href="profile.html">' + icon('user', 18) + 'My Profile</a>' +
      '<a href="javascript:void(0)" data-settings>' + icon('settings', 18) + 'Settings</a>' +
      '<a class="logout" href="javascript:void(0)" data-logout>Logout ' + icon('logout', 18) + '</a>' +
      '</div></div></div>'
    );
  }

  /* ---------------- breadcrumb ---------------- */
  function buildBreadcrumb(trail) {
    return trail
      .map(function (t, i) {
        /* a single-item trail (the dashboard itself) still reads as a link */
        const last = i === trail.length - 1 && trail.length > 1;
        const href = t.href || (trail.length === 1 ? 'index.html' : null);
        const node = last || !href ? '<span>' + t.label + '</span>' : '<a href="' + href + '">' + t.label + '</a>';
        return (i ? '<span class="sep">' + icon('chevronRight', 16) + '</span>' : '') + node;
      })
      .join('');
  }

  /* ---------------- boot ---------------- */
  function boot() {
    const wrapper = document.querySelector('.layout');
    if (!wrapper) return;
    const page = wrapper.getAttribute('data-page') || '';

    document.getElementById('sidebar').innerHTML = buildSidebar(page);
    document.getElementById('navbar').innerHTML = buildNavbar();

    const foot = document.getElementById('footer');
    if (foot) foot.innerHTML = '&copy; ' + new Date().getFullYear() + ' , All Copyrights Reserved';

    const crumbHost = document.getElementById('breadcrumb');
    if (crumbHost) {
      const raw = crumbHost.getAttribute('data-trail') || 'Dashboard';
      const trail = raw.split('|').map(function (part, i, arr) {
        const bits = part.split('::');
        return { label: bits[0], href: i === arr.length - 1 ? null : bits[1] || 'index.html' };
      });
      crumbHost.innerHTML = buildBreadcrumb(trail);
    }

    applyTheme(currentTheme());

    /* sidebar collapse (desktop) + off-canvas (mobile) */
    const COLLAPSE_KEY = 'club21-sidebar';
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === '1') document.body.classList.add('sidebar-collapsed');
    } catch (e) {}

    const sToggle = document.getElementById('sidebarToggle');
    if (sToggle) {
      sToggle.addEventListener('click', function () {
        document.body.classList.toggle('sidebar-collapsed');
        try {
          localStorage.setItem(COLLAPSE_KEY, document.body.classList.contains('sidebar-collapsed') ? '1' : '0');
        } catch (e) {}
        document.dispatchEvent(new CustomEvent('layoutresize'));
      });
    }

    const navToggler = document.getElementById('navToggler');
    if (navToggler) {
      navToggler.addEventListener('click', function () {
        document.body.classList.toggle('sidebar-open');
      });
    }
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (backdrop) backdrop.addEventListener('click', function () { document.body.classList.remove('sidebar-open'); });

    /* expandable menu groups */
    document.querySelectorAll('[data-toggle-sub]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (document.body.classList.contains('sidebar-collapsed')) {
          document.body.classList.remove('sidebar-collapsed');
          try { localStorage.setItem(COLLAPSE_KEY, '0'); } catch (e) {}
        }
        a.parentElement.classList.toggle('open');
      });
    });

    /* live clock */
    function tick() {
      const d = new Date();
      let h = d.getHours();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const m = String(d.getMinutes()).padStart(2, '0');
      const el = document.getElementById('clock');
      if (el) el.textContent = String(h).padStart(2, '0') + ':' + m + ampm;
    }
    tick();
    setInterval(tick, 1000);

    /* theme toggle */
    const tBtn = document.getElementById('themeToggle');
    if (tBtn) {
      tBtn.addEventListener('click', function () {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    }

    /* copy invite link */
    const copyBtn = document.getElementById('copyLink');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        const text = inviteUrl();
        const done = function () { U.toast('Invite link copied!'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
    }
    function fallbackCopy(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { U.toast('Copy failed'); }
      ta.remove();
    }

    /* profile dropdown */
    const avatarBtn = document.getElementById('avatarBtn');
    const userMenu = document.getElementById('userMenu');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        userMenu.classList.toggle('show');
      });
      document.addEventListener('click', function () { userMenu.classList.remove('show'); });
      userMenu.addEventListener('click', function (e) { e.stopPropagation(); });
      userMenu.querySelector('[data-logout]').addEventListener('click', function () {
        userMenu.classList.remove('show');
        if (window.Store) window.Store.logout();
        else window.location.href = 'login.html';
      });
      userMenu.querySelector('[data-settings]').addEventListener('click', function () {
        userMenu.classList.remove('show');
        const sm = U.modal(
          'Settings',
          U.detailRows([
            ['Account', DB.admin.email],
            ['Role', DB.admin.role],
            ['Invite link', inviteUrl()],
            ['Theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'Dark' : 'Light']
          ]) +
            '<p style="margin:16px 0 0;font-size:13.5px;color:var(--muted)">' +
            'Edits, additions and deletions are stored in this browser. Reset to bring back the sample records.</p>',
          '<button class="btn btn-secondary" data-reset>Reset demo data</button>' +
            '<button class="btn btn-primary" data-close>Done</button>'
        );
        sm.querySelector('[data-reset]').addEventListener('click', function () {
          DB.reset();
          window.location.reload();
        });
      });
    }
  }

  function whenReady(fn) {
    const ready = window.Store ? window.Store.ready : Promise.resolve();
    ready.then(function () {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
      else fn();
    });
  }

  whenReady(boot);
})();
