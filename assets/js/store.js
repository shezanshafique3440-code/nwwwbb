/* =========================================================
   Data access layer.

   With the Node backend running the panel reads and writes
   the SQLite database over /api. Opened straight from disk
   (file://) or from a plain static host, it falls back to the
   seed data in data.js kept in localStorage, so the demo
   still works with no server at all.
   ========================================================= */
window.Store = (function () {
  const DB = window.DB;

  /* endpoint for each local collection */
  const PATHS = {
    orders: '/api/orders',
    withdraws: '/api/withdraws',
    recharges: '/api/recharges',
    products: '/api/products',
    users: '/api/users',
    archived: '/api/archived-users'
  };

  const S = { online: false, user: null };

  function request(method, path, body) {
    return fetch(path, {
      method: method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        S.online = false;
        sendHome(res.status);
        throw new Error(res.status === 401 ? 'Not signed in' : 'Not allowed here');
      }
      return res.json().then(function (data) {
        if (!res.ok) {
          /* the status travels with the error so a caller can tell a missing
             record apart from a server that is unhappy */
          const err = new Error(data.error || 'Request failed');
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  /** Pull every collection the panel renders into DB.*. */
  function load() {
    return Promise.all([
      request('GET', '/api/stats'),
      request('GET', PATHS.orders),
      request('GET', PATHS.withdraws),
      request('GET', PATHS.recharges),
      request('GET', PATHS.products),
      request('GET', PATHS.users + '?role=Agent'),
      request('GET', PATHS.users + '?role=Customer'),
      request('GET', PATHS.archived)
    ]).then(function (r) {
      const stats = r[0];
      DB.stats.totalAgents = stats.totalAgents;
      DB.stats.totalCustomers = stats.totalCustomers;
      DB.stats.pendingCustomers = stats.pendingCustomers;
      DB.stats.totalRevenue = stats.totalRevenue;
      DB.pendingOrders = stats.pendingOrders;
      DB.pendingRecharges = stats.pendingRecharges;
      DB.ordersOverview = stats.ordersOverview;

      DB.orders = r[1];
      DB.withdraws = r[2];
      DB.recharges = r[3];
      DB.products = r[4];
      DB.users = r[5].concat(r[6]);
      DB.archived = r[7];
    });
  }

  const AUTH_PAGE = /(login|register|404)\.html$/.test(window.location.pathname);

  /* Send whoever is signed in to the panel that belongs to them. */
  function sendHome(status) {
    if (AUTH_PAGE) return;
    const seller = S.user && S.user.role === 'Seller';
    window.location.href = status === 403 && seller ? 'seller/index.html' : 'login.html';
  }

  S.ready = fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('no api')); })
    .then(function (data) {
      S.online = true;
      S.user = data.user;
      if (!data.user) {
        if (!AUTH_PAGE) window.location.href = 'login.html';
        return;
      }
      if (data.user.role !== 'Admin') {
        /* sellers belong in the mobile app, not the admin panel */
        sendHome(403);
        return;
      }
      if (data.user.name) DB.admin.name = data.user.name;
      if (data.user.email) DB.admin.email = data.user.email;
      return load();
    })
    .catch(function () {
      /* no backend — stay on the seeded, browser-stored demo data */
      S.online = false;
    });

  /* ---------------------------------------------------------
     Mutations. Local arrays are already updated by the caller,
     so these push the change to the server (or persist locally).
     --------------------------------------------------------- */
  function offline() {
    DB.persist();
    return Promise.resolve(null);
  }

  /* a failed write must not pass silently — the row on screen would
     otherwise disagree with the database */
  function guard(promise, what) {
    return promise.catch(function (err) {
      if (window.U) window.U.toast('Could not ' + what + ': ' + err.message);
      return null;
    });
  }

  S.create = function (coll, row) {
    if (!S.online) return offline();
    return guard(
      request('POST', PATHS[coll], row).then(function (saved) {
        if (saved && saved.id) row.id = saved.id;
        return saved;
      }),
      'save the new record'
    );
  };

  S.update = function (coll, row) {
    if (!S.online) return offline();
    return guard(request('PUT', PATHS[coll] + '/' + row.id, row), 'save changes');
  };

  S.remove = function (coll, id) {
    if (!S.online) return offline();
    return guard(request('DELETE', PATHS[coll] + '/' + id), 'delete the record');
  };

  S.toggle = function (coll, id) {
    if (!S.online) return offline();
    return guard(request('POST', PATHS[coll] + '/' + id + '/toggle'), 'change the status');
  };

  S.restore = function (id) {
    if (!S.online) return offline();
    return guard(request('POST', PATHS.archived + '/' + id + '/restore'), 'restore the user');
  };

  S.logout = function () {
    const done = function () { window.location.href = 'login.html'; };
    if (!S.online) return done();
    request('POST', '/api/auth/logout').then(done, done);
  };

  S.request = request;
  return S;
})();
