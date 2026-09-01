/* =========================================================
   Club Elite 21 backend — Node's built-in http + node:sqlite,
   no npm dependencies.

     node server/index.js        (or: npm start)

   Serves the static panel from the repository root and a JSON
   API under /api. Session cookies are stored in SQLite.
   ========================================================= */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const store = require('./db.js');

const { db, q } = store;
const ROOT = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
const PORT = Number(process.env.PORT || 3000);
const COOKIE = 'club21_session';

/* ---------------------------------------------------------
   Small helpers
   --------------------------------------------------------- */
function send(res, code, payload, headers) {
  const body = JSON.stringify(payload);
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, headers || {}));
  res.end(body);
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let raw = '';
    req.on('data', function (chunk) {
      raw += chunk;
      if (raw.length > 4e6) reject(new Error('payload too large'));
    });
    req.on('end', function () {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------------------------------------------------------
   Sessions
   --------------------------------------------------------- */
function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, userId, new Date().toISOString());
  return token;
}

function sessionUser(req) {
  const token = cookies(req)[COOKIE];
  if (!token) return null;
  const row = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  if (!row) return null;
  const user = q.userById.get(row.user_id);
  return user && !user.deleted_at ? user : null;
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status };
}

/* ---------------------------------------------------------
   Row mapping — SQLite columns to the shape the UI expects
   --------------------------------------------------------- */
function mapUser(u) {
  const row = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    agent: u.agent,
    agentEmail: u.agent_email,
    referrals: u.referrals,
    balance: u.balance,
    status: u.status,
    joined: u.joined,
    phone: u.phone || '',
    code: u.code || '',
    approved: !!u.approved,
    creditScore: u.credit_score,
    inviteCode: u.invite_code || '',
    membership: u.membership || 'Free',
    freeze: u.freeze || 0,
    specialOrder: {
      orderNo: u.so_order_no || 0,
      amount: u.so_amount || 0,
      commission: u.so_commission || 0,
      limit: u.so_limit || 0
    },
    bank: {
      method: u.bank_method || '',
      bank: u.bank_name || '',
      account: u.bank_account || '',
      ifsc: u.bank_ifsc || '',
      crypto: u.crypto || '',
      cryptoAddress: u.crypto_address || ''
    }
  };
  if (u.role === 'Seller') {
    const vip = vipFor(u.balance).current;
    row.level = vip.name;
    row.rate = vip.rate;
    row.dailyOrders = vip.daily_orders;
    row.orders = q.sellerCount.get(u.id, 'Completed').n;
    row.team = q.invitedBy.all(u.name).length;
  }
  return row;
}

function mapArchived(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, deletedAt: u.deleted_at, status: u.status };
}

/* ---------------------------------------------------------
   Generic CRUD for the simple collections
   --------------------------------------------------------- */
const RESOURCES = {
  orders: {
    table: 'orders',
    order: 'date DESC, id DESC',
    fields: [
      'code', 'user', 'customer_code', 'product', 'sku', 'image', 'price', 'qty', 'total',
      'shipping', 'discount', 'commission', 'status', 'date', 'time',
      'rate_desc', 'rate_logistics', 'rate_service'
    ],
    defaults: function () {
      return {
        code: '', user: null, customer_code: '', product: '', sku: '', image: '\u{1F4E6}',
        price: 0, qty: 1, total: 0, shipping: 0, discount: 0, commission: 0,
        status: 'Pending', date: today(), time: '', rate_desc: 0, rate_logistics: 0, rate_service: 0
      };
    },
    map: function (row) {
      return {
        id: row.id,
        code: row.code,
        user: row.user,
        customerCode: row.customer_code,
        product: row.product,
        sku: row.sku,
        image: row.image,
        price: row.price,
        qty: row.qty,
        total: row.total,
        shipping: row.shipping,
        discount: row.discount,
        commission: row.commission,
        status: row.status,
        date: row.date,
        time: row.time,
        ratings: { description: row.rate_desc, logistics: row.rate_logistics, service: row.rate_service }
      };
    },
    unmap: function (body) {
      const out = Object.assign({}, body);
      if (body.customerCode !== undefined) out.customer_code = body.customerCode;
      if (body.ratings) {
        out.rate_desc = body.ratings.description;
        out.rate_logistics = body.ratings.logistics;
        out.rate_service = body.ratings.service;
      }
      return out;
    }
  },
  withdraws: {
    table: 'withdraws',
    order: 'date DESC, id DESC',
    fields: [
      'user', 'email', 'amount', 'method', 'account', 'wallet', 'txn', 'tx_status', 'flow',
      'description', 'status', 'date', 'time', 'updated_at', 'note'
    ],
    defaults: function () {
      return {
        user: '', email: '', amount: 0, method: '', account: '', wallet: '', txn: crypto.randomUUID(),
        tx_status: 'Pending', flow: 'Out', description: 'Withdrawal Request', status: 'Pending',
        date: today(), time: '', updated_at: '', note: ''
      };
    },
    map: function (row) {
      return {
        id: row.id, user: row.user, email: row.email, amount: row.amount, method: row.method,
        account: row.account, wallet: row.wallet, txn: row.txn, txStatus: row.tx_status, flow: row.flow,
        description: row.description, status: row.status, date: row.date, time: row.time,
        updatedAt: row.updated_at, note: row.note
      };
    },
    unmap: function (body) {
      const out = Object.assign({}, body);
      if (body.txStatus !== undefined) out.tx_status = body.txStatus;
      if (body.updatedAt !== undefined) out.updated_at = body.updatedAt;
      return out;
    }
  },
  recharges: {
    table: 'recharges',
    order: 'date DESC, id DESC',
    fields: [
      'user', 'email', 'amount', 'method', 'txn', 'tx_status', 'flow', 'description',
      'status', 'date', 'time', 'updated_at', 'note'
    ],
    defaults: function () {
      return {
        user: '', email: '', amount: 0, method: '', txn: crypto.randomUUID(), tx_status: 'Pending',
        flow: '', description: 'Wallet Recharge', status: 'Pending', date: today(), time: '',
        updated_at: '', note: ''
      };
    },
    map: function (row) {
      return {
        id: row.id, user: row.user, email: row.email, amount: row.amount, method: row.method,
        txn: row.txn, txStatus: row.tx_status, flow: row.flow, description: row.description,
        status: row.status, date: row.date, time: row.time, updatedAt: row.updated_at, note: row.note
      };
    },
    unmap: function (body) {
      const out = Object.assign({}, body);
      if (body.txStatus !== undefined) out.tx_status = body.txStatus;
      if (body.updatedAt !== undefined) out.updated_at = body.updatedAt;
      return out;
    }
  },
  products: {
    table: 'products',
    order: 'id DESC',
    fields: [
      'name', 'slug', 'sku', 'price', 'image', 'image_url', 'category',
      'description', 'reviews', 'rating', 'popular', 'rate', 'status'
    ],
    defaults: function () {
      return {
        name: '', slug: '', sku: '', price: 0, image: '\u{1F4E6}', image_url: '', category: '',
        description: '', reviews: 0, rating: 5, popular: 0, rate: 2, status: 'Active'
      };
    },
    /* the panel speaks camelCase, the table snake_case */
    map: function (row) {
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        price: row.price,
        image: row.image,
        imageUrl: row.image_url,
        category: row.category,
        description: row.description,
        reviews: row.reviews,
        rating: row.rating,
        popular: !!row.popular,
        rate: row.rate,
        status: row.status
      };
    },
    unmap: function (body) {
      const out = Object.assign({}, body);
      if (body.imageUrl !== undefined) out.image_url = body.imageUrl;
      if (body.popular !== undefined) out.popular = body.popular ? 1 : 0;
      return out;
    }
  }
};

function listRows(name) {
  const r = RESOURCES[name];
  const rows = db.prepare('SELECT * FROM ' + r.table + ' ORDER BY ' + r.order).all();
  return r.map ? rows.map(r.map) : rows;
}

function readRow(name, id) {
  const r = RESOURCES[name];
  const row = db.prepare('SELECT * FROM ' + r.table + ' WHERE id = ?').get(id);
  if (!row) return null;
  return r.map ? r.map(row) : row;
}

function insertRow(name, body) {
  const r = RESOURCES[name];
  const row = Object.assign(r.defaults(), pick(r.unmap ? r.unmap(body) : body, r.fields));
  const cols = r.fields.map(function (f) { return '"' + f + '"'; }).join(', ');
  const marks = r.fields.map(function () { return '?'; }).join(', ');
  const stmt = db.prepare('INSERT INTO ' + r.table + ' (' + cols + ') VALUES (' + marks + ')');
  const info = stmt.run(...r.fields.map(function (f) { return row[f]; }));
  return readRow(name, Number(info.lastInsertRowid));
}

function updateRow(name, id, body) {
  const r = RESOURCES[name];
  const current = db.prepare('SELECT * FROM ' + r.table + ' WHERE id = ?').get(id);
  if (!current) return null;
  const patch = pick(r.unmap ? r.unmap(body) : body, r.fields);
  const keys = Object.keys(patch);
  if (keys.length) {
    const sets = keys.map(function (k) { return '"' + k + '" = ?'; }).join(', ');
    const stmt = db.prepare('UPDATE ' + r.table + ' SET ' + sets + ' WHERE id = ?');
    stmt.run(...keys.map(function (k) { return patch[k]; }), id);
  }
  /* completing an order books its value into lifetime revenue */
  if (name === 'orders' && current.status !== 'Completed' && patch.status === 'Completed') {
    store.addRevenue(current.total);
  }

  if ((name === 'recharges' || name === 'withdraws') && patch.status && patch.status !== current.status) {
    const now = new Date();
    const at = now.toISOString().slice(0, 10) + ' ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const done = patch.status === 'Completed' || patch.status === 'Approved';
    db.prepare('UPDATE ' + r.table + ' SET updated_at = ?, tx_status = ? WHERE id = ?').run(
      at,
      done ? 'Completed' : patch.status === 'Rejected' ? 'Failed' : 'Pending',
      id
    );
    if (name === 'recharges' && done) db.prepare('UPDATE recharges SET flow = ? WHERE id = ?').run('In', id);
  }

  /* an approved recharge tops the account up; a refused withdrawal
     releases the amount that was held when it was requested */
  if (name === 'recharges' && current.status !== 'Completed' && patch.status === 'Completed') {
    db.prepare('UPDATE users SET balance = balance + ? WHERE lower(name) = lower(?)').run(current.amount, current.user);
  }
  if (name === 'withdraws' && current.status === 'Pending' && patch.status === 'Rejected') {
    db.prepare('UPDATE users SET balance = balance + ? WHERE lower(name) = lower(?)').run(current.amount, current.user);
  }
  return readRow(name, id);
}

function pick(obj, fields) {
  const out = {};
  fields.forEach(function (f) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, f)) out[f] = obj[f];
  });
  return out;
}

/** Attach the account a money request belongs to, and its payout details. */
function withRequester(row) {
  const user = q.userByName.get(row.user);
  return Object.assign({}, row, {
    userInfo: user
      ? {
          id: user.id,
          name: user.name,
          username: user.username || '',
          code: user.code || '',
          email: user.email || '',
          phone: user.phone || '',
          status: user.status,
          creditScore: user.credit_score,
          avatar: user.avatar || ''
        }
      : { name: row.user, username: '', code: '', email: row.email || '', phone: '', status: '', creditScore: 0, avatar: '' },
    payment: user
      ? {
          method: user.bank_method || '',
          bank: user.bank_name || '',
          beneficiary: user.bank_beneficiary || '',
          account: user.bank_account || '',
          type: user.bank_type || '',
          ifsc: user.bank_ifsc || '',
          branch: user.bank_branch || ''
        }
      : { method: '', bank: '', beneficiary: '', account: '', type: '', ifsc: '', branch: '' }
  });
}

/* ---------------------------------------------------------
   API
   --------------------------------------------------------- */
async function api(req, res, url) {
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const head = parts[0] || '';
  const id = parts[1] ? Number(parts[1]) : null;
  const sub = parts[2] || '';
  const method = req.method.toUpperCase();
  const body = method === 'GET' || method === 'DELETE' ? {} : await readBody(req);

  /* ---- auth ---- */
  if (head === 'auth') {
    if (parts[1] === 'login' && method === 'POST') {
      const who = String(body.email || body.phone || '').trim();
      const digits = who.replace(/\D/g, '');
      const user =
        q.userByEmail.get(who) ||
        q.userByName.get(who) ||
        q.userByUsername.get(who) ||
        (digits ? q.userByPhone.get(digits) : null);
      if (!user || !store.verifyPassword(body.password || '', user.password)) {
        return send(res, 401, { error: 'Invalid credentials' });
      }
      if (user.status !== 'Active') return send(res, 403, { error: 'Account is not active' });
      const token = createSession(user.id);
      return send(res, 200, { user: publicUser(user) }, {
        'Set-Cookie': COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800'
      });
    }

    if (parts[1] === 'register' && method === 'POST') {
      const phone = String(body.phone || '').replace(/\D/g, '');
      const name = String(body.name || phone).trim();
      const email = String(body.email || '').trim();
      if (!body.password) return send(res, 400, { error: 'A password is required' });
      if (!name || (!email && !phone)) return send(res, 400, { error: 'A mobile number or email is required' });
      if (email && q.userByEmail.get(email)) return send(res, 409, { error: 'That email is already registered' });
      if (phone && q.userByPhone.get(phone)) return send(res, 409, { error: 'That mobile number is already registered' });

      /* Signing up makes a customer. The site has one door and one kind of
         account behind it; the seeded Seller rows are the older demo records
         and the shop app serves both. */
      const wantsSeller = String(body.as || body.role || '').toLowerCase() === 'seller';
      if (!phone) return send(res, 400, { error: 'A mobile number is required' });

      const typed = String(body.inviter || '').trim();
      const given = typed || 'Admin';
      /* the link may carry either the inviter's name or their invite code */
      const inviter = q.userByInvite.get(given.toUpperCase()) || q.userByName.get(given);
      /* a code that matches nobody is a typo, not a new agent named after it */
      if (typed && !inviter) return send(res, 400, { error: 'That invitation code does not belong to anyone' });
      const inviterName = inviter ? inviter.name : given;
      const info = db
        .prepare(
          `INSERT INTO users (name, email, password, role, agent, agent_email, referrals, balance, status, joined)
           VALUES (?, ?, ?, 'Customer', ?, ?, 0, 0, 'Active', ?)`
        )
        .run(name, email, store.hashPassword(body.password), inviterName, inviter ? inviter.email : '', today());

      if (inviter && inviter.role === 'Agent') {
        db.prepare('UPDATE users SET referrals = referrals + 1 WHERE id = ?').run(inviter.id);
      }
      const newId = Number(info.lastInsertRowid);

      /* every account gets its own invite code, so the one on the My screen is
         real from the first visit and differs for each new member */
      let code = store.inviteCode();
      while (q.userByInvite.get(code)) code = store.inviteCode();
      db.prepare('UPDATE users SET invite_code = ? WHERE id = ?').run(code, newId);

      if (phone) db.prepare('UPDATE users SET phone = ?, username = ? WHERE id = ?').run(phone, phone, newId);
      if (body.withdrawPassword) {
        db.prepare('UPDATE users SET withdraw_password = ? WHERE id = ?')
          .run(store.hashPassword(body.withdrawPassword), newId);
      }
      if (wantsSeller) db.prepare("UPDATE users SET role = 'Seller' WHERE id = ?").run(newId);
      const user = q.userById.get(newId);
      const token = createSession(user.id);
      return send(res, 201, { user: publicUser(user), signedIn: true }, {
        'Set-Cookie': COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800'
      });
    }

    if (parts[1] === 'logout' && method === 'POST') {
      const token = cookies(req)[COOKIE];
      if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return send(res, 200, { ok: true }, { 'Set-Cookie': COOKIE + '=; Path=/; HttpOnly; Max-Age=0' });
    }

    if (parts[1] === 'me' && method === 'GET') {
      const user = sessionUser(req);
      return send(res, 200, { user: user ? publicUser(user) : null });
    }

    return send(res, 404, { error: 'Unknown auth route' });
  }

  /* the shop window a visitor sees before signing in */
  if (head === 'landing' && method === 'GET') {
    const seed = store.readSeed();
    return send(res, 200, Object.assign({ appName: seed.seller.appName }, seed.landing));
  }

  const me = sessionUser(req);
  if (!me) return send(res, 401, { error: 'Not signed in' });

  /* ---- the shop app: a customer's own side of the site ---- */
  if (head === 'seller') {
    if (me.role !== 'Customer' && me.role !== 'Seller') {
      return send(res, 403, { error: 'Customer account required' });
    }
    return sellerApi(req, res, me, parts.slice(1), method, body);
  }

  /* everything below requires a signed-in admin */
  if (me.role !== 'Admin') return send(res, 403, { error: 'Admin access required' });

  /* ---- the signed-in administrator's own profile ---- */
  if (head === 'profile') {
    const fresh = q.userById.get(me.id);
    let extra = {};
    try { extra = JSON.parse(fresh.profile || '{}'); } catch (e) {}

    if (method === 'GET') {
      return send(res, 200, Object.assign(
        {
          id: fresh.id,
          name: fresh.name,
          email: fresh.email,
          phone: fresh.phone || '',
          role: fresh.role,
          status: fresh.status,
          joined: fresh.joined,
          avatar: fresh.avatar || ''
        },
        {
          firstName: '', lastName: '', dob: '', country: '', city: '', zip: '', street: '',
          language: '', gender: '', marital: '', bio: '',
          social: { facebook: '', linkedin: '', skype: '', instagram: '', github: '' }
        },
        extra
      ));
    }

    if (parts[1] === 'password' && method === 'POST') {
      if (!store.verifyPassword(body.current || '', fresh.password)) {
        return send(res, 400, { error: 'Your current password is not right' });
      }
      if (String(body.next || '').length < 6) return send(res, 400, { error: 'Use at least six characters' });
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(store.hashPassword(body.next), me.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(me.id, cookies(req)[COOKIE] || '');
      return send(res, 200, { ok: true });
    }

    if (method === 'PUT') {
      const keep = [
        'firstName', 'lastName', 'dob', 'country', 'city', 'zip', 'street',
        'language', 'gender', 'marital', 'bio', 'social'
      ];
      const next = Object.assign({}, extra);
      keep.forEach(function (k) { if (body[k] !== undefined) next[k] = body[k]; });

      db.prepare('UPDATE users SET profile = ?, phone = ?, email = ?, avatar = ? WHERE id = ?').run(
        JSON.stringify(next),
        body.phone !== undefined ? String(body.phone) : fresh.phone,
        body.email !== undefined ? String(body.email) : fresh.email,
        body.avatar !== undefined ? String(body.avatar) : fresh.avatar,
        me.id
      );
      if (body.firstName || body.lastName) {
        const display = [body.firstName, body.lastName].filter(Boolean).join(' ').trim();
        if (display) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(display, me.id);
      }
      return send(res, 200, { ok: true });
    }
  }

  /* ---- dashboard ---- */
  if (head === 'stats' && method === 'GET') {
    const months = [];
    const values = [];
    const counts = {};
    q.ordersByMonth.all().forEach(function (r) { counts[r.ym] = r.n; });
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      months.push(d.toLocaleString('en-US', { month: 'short' }));
      values.push(counts[ym] || 0);
    }
    return send(res, 200, {
      totalAgents: q.countRole.get('Agent').n,
      totalCustomers: q.countRole.get('Customer').n,
      pendingCustomers: q.countPending.get().n,
      totalRevenue: store.revenue(),
      pendingOrders: q.countOrderStatus.get('Pending').n,
      pendingRecharges: q.countRechargeStatus.get('Pending').n,
      ordersOverview: { labels: months, values: values }
    });
  }

  /* ---- users ---- */
  if (head === 'users') {
    if (id && method === 'GET') {
      const user = q.userById.get(id);
      if (!user) return send(res, 404, { error: 'User not found' });

      const orders = db
        .prepare('SELECT * FROM orders WHERE lower(user) = lower(?) ORDER BY date DESC, id DESC LIMIT 10')
        .all(user.name)
        .map(RESOURCES.orders.map);

      const transactions = []
        .concat(
          q.rechargesFor.all(user.name).map(function (r) {
            return { id: 'r' + r.id, type: 'Recharge', flow: 'in', amount: r.amount, status: r.status, date: r.date };
          })
        )
        .concat(
          q.withdrawsFor.all(user.name).map(function (w) {
            return { id: 'w' + w.id, type: 'Withdrawal', flow: 'out', amount: w.amount, status: w.status, date: w.date };
          })
        )
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; })
        .slice(0, 10);

      const agent = user.agent ? q.userByName.get(user.agent) : null;

      return send(res, 200, Object.assign(mapUser(user), {
        orders: orders,
        transactions: transactions,
        withdrawals: q.withdrawsFor.all(user.name).map(function (w) {
          return { id: w.id, amount: w.amount, note: w.note || '', status: w.status, date: w.date };
        }),
        agentInfo: agent ? { name: agent.name, email: agent.email } : { name: user.agent || 'Admin', email: '' },
        referrals: q.invitedBy.all(user.name).map(function (u) {
          return {
            id: u.id,
            name: u.name,
            reference: u.code || '',
            balance: u.balance,
            approved: !!u.approved,
            status: u.status
          };
        })
      }));
    }

    if (method === 'GET') {
      const role = url.searchParams.get('role') || 'Customer';
      return send(res, 200, q.activeUsers.all(role).map(mapUser));
    }
    if (method === 'POST') {
      const agent = body.agent ? q.userByName.get(body.agent) : null;
      if (body.inviteCode && q.userByInvite.get(String(body.inviteCode).toUpperCase())) {
        return send(res, 409, { error: 'That invite code is already in use' });
      }
      const info = db
        .prepare(
          `INSERT INTO users (name, email, password, role, agent, agent_email, referrals, balance, status, joined)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          String(body.name || '').trim(),
          String(body.email || '').trim(),
          store.hashPassword(body.password || 'password'),
          body.role === 'Agent' ? 'Agent' : 'Customer',
          body.agent || 'Admin',
          agent ? agent.email : body.agent === 'Admin' ? 'admin@gmail.com' : '',
          Number(body.referrals || 0),
          Number(body.balance || 0),
          body.status || 'Active',
          today()
        );

      const newId = Number(info.lastInsertRowid);
      if (body.phone) db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(String(body.phone), newId);
      if (body.inviteCode) {
        db.prepare('UPDATE users SET invite_code = ? WHERE id = ?').run(String(body.inviteCode).toUpperCase(), newId);
      }
      if (body.withdrawPassword) {
        db.prepare('UPDATE users SET withdraw_password = ? WHERE id = ?').run(store.hashPassword(body.withdrawPassword), newId);
      }
      db.prepare('UPDATE users SET code = ? WHERE id = ? AND (code IS NULL OR code = \'\')').run(
        String(10000 + ((newId * 7919) % 89999)),
        newId
      );
      return send(res, 201, mapUser(q.userById.get(newId)));
    }
    if (id && method === 'PUT') {
      const user = q.userById.get(id);
      if (!user) return send(res, 404, { error: 'User not found' });
      const agent = body.agent ? q.userByName.get(body.agent) : null;

      /* optional blocks the details page updates one card at a time */
      if (body.password) db.prepare('UPDATE users SET password = ? WHERE id = ?').run(store.hashPassword(body.password), id);
      if (body.withdrawPassword) {
        db.prepare('UPDATE users SET withdraw_password = ? WHERE id = ?').run(store.hashPassword(body.withdrawPassword), id);
      }
      if (body.phone !== undefined) db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(String(body.phone), id);
      if (body.approved !== undefined) {
        db.prepare('UPDATE users SET approved = ? WHERE id = ?').run(body.approved ? 1 : 0, id);
      }
      if (body.creditScore !== undefined) {
        db.prepare('UPDATE users SET credit_score = ? WHERE id = ?').run(Number(body.creditScore), id);
      }
      if (body.freeze !== undefined) db.prepare('UPDATE users SET freeze = ? WHERE id = ?').run(Number(body.freeze), id);
      if (body.inviteCode) db.prepare('UPDATE users SET invite_code = ? WHERE id = ?').run(String(body.inviteCode), id);
      if (body.membership !== undefined) {
        db.prepare('UPDATE users SET membership = ? WHERE id = ?').run(String(body.membership || 'Free'), id);
      }
      if (body.specialOrder) {
        db.prepare('UPDATE users SET so_order_no = ?, so_amount = ?, so_commission = ?, so_limit = ? WHERE id = ?').run(
          Number(body.specialOrder.orderNo || 0),
          Number(body.specialOrder.amount || 0),
          Number(body.specialOrder.commission || 0),
          Number(body.specialOrder.limit || 0),
          id
        );
      }
      if (body.bank) {
        db.prepare(
          'UPDATE users SET bank_method = ?, bank_name = ?, bank_account = ?, bank_ifsc = ?, crypto = ?, crypto_address = ? WHERE id = ?'
        ).run(
          String(body.bank.method || ''), String(body.bank.bank || ''), String(body.bank.account || ''),
          String(body.bank.ifsc || ''), String(body.bank.crypto || ''), String(body.bank.cryptoAddress || ''),
          id
        );
      }
      db.prepare(
        `UPDATE users SET name = ?, email = ?, role = ?, agent = ?, agent_email = ?,
         referrals = ?, balance = ?, status = ? WHERE id = ?`
      ).run(
        body.name != null ? body.name : user.name,
        body.email != null ? body.email : user.email,
        body.role || user.role,
        body.agent != null ? body.agent : user.agent,
        agent ? agent.email : body.agent === 'Admin' ? 'admin@gmail.com' : user.agent_email,
        body.referrals != null ? Number(body.referrals) : user.referrals,
        body.balance != null ? Number(body.balance) : user.balance,
        body.status || user.status,
        id
      );
      return send(res, 200, mapUser(q.userById.get(id)));
    }
    if (id && sub === 'toggle' && method === 'POST') {
      const user = q.userById.get(id);
      if (!user) return send(res, 404, { error: 'User not found' });
      const next = user.status === 'Active' ? 'Inactive' : 'Active';
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(next, id);
      return send(res, 200, mapUser(q.userById.get(id)));
    }
    if (id && method === 'DELETE') {
      /* soft delete — the record moves to Archived Users */
      const user = q.userById.get(id);
      if (!user) return send(res, 404, { error: 'User not found' });
      db.prepare('UPDATE users SET deleted_at = ? WHERE id = ?').run(today(), id);
      return send(res, 200, { ok: true, archived: mapArchived(q.userById.get(id)) });
    }
  }

  /* ---- archived users ---- */
  if (head === 'archived-users') {
    if (method === 'GET') return send(res, 200, q.archivedUsers.all().map(mapArchived));
    if (id && sub === 'restore' && method === 'POST') {
      const user = q.userById.get(id);
      if (!user || !user.deleted_at) return send(res, 404, { error: 'Archived user not found' });
      db.prepare('UPDATE users SET deleted_at = NULL, status = ? WHERE id = ?').run('Active', id);
      return send(res, 200, mapUser(q.userById.get(id)));
    }
    if (id && method === 'DELETE') {
      db.prepare('DELETE FROM users WHERE id = ? AND deleted_at IS NOT NULL').run(id);
      return send(res, 200, { ok: true });
    }
  }

  /* ---- image uploads (data URL in, file on disk out) ---- */
  if (head === 'uploads' && method === 'POST') {
    const match = /^data:(image\/(png|jpe?g|webp|gif));base64,(.+)$/i.exec(String(body.data || ''));
    if (!match) return send(res, 400, { error: 'Send a JPG, JPEG, PNG, WEBP or GIF image' });

    const bytes = Buffer.from(match[3], 'base64');
    if (bytes.length > 2 * 1024 * 1024) return send(res, 400, { error: 'Maximum size is 2.00MB' });

    const ext = match[2].toLowerCase() === 'jpeg' ? 'jpg' : match[2].toLowerCase();
    const name = crypto.randomBytes(8).toString('hex') + '.' + ext;
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, name), bytes);
    return send(res, 201, { url: '/uploads/' + name, bytes: bytes.length });
  }

  /* ---- seller order tasks, seen from the panel ---- */
  if (head === 'seller-orders') {
    if (method === 'GET') {
      const rows = db
        .prepare(
          `SELECT o.*, u.name AS seller FROM seller_orders o
           JOIN users u ON u.id = o.seller_id
           ORDER BY CASE WHEN o.status = 'Pending' THEN 0 WHEN o.status = 'Freezing' THEN 1 ELSE 2 END,
                    datetime(o.created_at) DESC, o.id DESC`
        )
        .all();
      return send(res, 200, rows.map(function (o) {
        return {
          id: o.id,
          seller: o.seller,
          code: o.code,
          product: o.product,
          image: o.image,
          price: o.price,
          qty: o.qty,
          total: o.total,
          commission: o.commission,
          rate: o.rate,
          status: o.status,
          frozenReason: o.frozen_reason || '',
          createdAt: o.created_at
        };
      }));
    }
    if (id && method === 'PUT') {
      const order = db.prepare('SELECT * FROM seller_orders WHERE id = ?').get(id);
      if (!order) return send(res, 404, { error: 'Not found' });
      const status = body.status || order.status;
      /* releasing a frozen task is an explicit admin decision */
      db.prepare('UPDATE seller_orders SET status = ?, frozen_reason = ? WHERE id = ?').run(
        status,
        status === 'Freezing' ? order.frozen_reason || 'Held by an administrator' : null,
        id
      );
      if (order.status !== 'Completed' && status === 'Completed') {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.commission, order.seller_id);
      }
      return send(res, 200, { ok: true });
    }
    if (id && method === 'DELETE') {
      db.prepare('DELETE FROM seller_orders WHERE id = ?').run(id);
      return send(res, 200, { ok: true });
    }
  }

  /* ---- VIP tiers ---- */
  if (head === 'vip-levels') {
    if (method === 'GET') {
      return send(res, 200, q.vipLevels.all().map(function (l) {
        return {
          id: l.id,
          name: l.name,
          minBalance: l.min_balance,
          rate: l.rate,
          dailyOrders: l.daily_orders,
          color: l.color,
          sellers: db
            .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'Seller' AND deleted_at IS NULL AND balance >= ?")
            .get(l.min_balance).n
        };
      }));
    }
    if (id && method === 'PUT') {
      const level = db.prepare('SELECT * FROM vip_levels WHERE id = ?').get(id);
      if (!level) return send(res, 404, { error: 'Not found' });
      db.prepare('UPDATE vip_levels SET name = ?, min_balance = ?, rate = ?, daily_orders = ? WHERE id = ?').run(
        body.name != null ? body.name : level.name,
        body.minBalance != null ? Number(body.minBalance) : level.min_balance,
        body.rate != null ? Number(body.rate) : level.rate,
        body.dailyOrders != null ? Number(body.dailyOrders) : level.daily_orders,
        id
      );
      return send(res, 200, { ok: true });
    }
  }

  /* ---- the simple collections ---- */
  if (RESOURCES[head]) {
    if (method === 'GET' && id) {
      const row = readRow(head, id);
      if (!row) return send(res, 404, { error: 'Not found' });
      if (head === 'withdraws' || head === 'recharges') return send(res, 200, withRequester(row));
      return send(res, 200, row);
    }
    if (method === 'GET') return send(res, 200, listRows(head));
    if (method === 'POST' && !id) return send(res, 201, insertRow(head, body));
    if (id && sub === 'toggle' && method === 'POST') {
      const table = RESOURCES[head].table;
      const row = db.prepare('SELECT * FROM ' + table + ' WHERE id = ?').get(id);
      if (!row) return send(res, 404, { error: 'Not found' });
      const next = row.status === 'Active' ? 'Inactive' : 'Active';
      db.prepare('UPDATE ' + table + ' SET status = ? WHERE id = ?').run(next, id);
      return send(res, 200, db.prepare('SELECT * FROM ' + table + ' WHERE id = ?').get(id));
    }
    if (id && method === 'PUT') {
      const row = updateRow(head, id, body);
      return row ? send(res, 200, row) : send(res, 404, { error: 'Not found' });
    }
    if (id && method === 'DELETE') {
      db.prepare('DELETE FROM ' + RESOURCES[head].table + ' WHERE id = ?').run(id);
      return send(res, 200, { ok: true });
    }
  }

  return send(res, 404, { error: 'Unknown endpoint' });
}


/* ---------------------------------------------------------
   Seller app API — every route is scoped to the signed-in
   seller, so one seller can never see another's orders.
   --------------------------------------------------------- */
const SEED = store.readSeed();
const RULES = SEED.seller.freezing;
const TEAM_RATES = SEED.seller.teamRates;
/* the linked account opens after more than this many completed tasks */
const LINKED_MIN_TASKS = 2;

function stamp(d) {
  const p = function (n) { return String(n).padStart(2, '0'); };
  return (
    d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
    p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
  );
}

function money(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** A unique UB-code; two orders in the same second must not collide. */
function orderCode(when) {
  const prefix = 'UB' + stamp(when).replace(/[-: ]/g, '').slice(2);
  const exists = db.prepare('SELECT 1 FROM seller_orders WHERE code = ?');
  for (let i = 0; i < 20; i++) {
    const code = prefix + String(crypto.randomInt(100000, 999999));
    if (!exists.get(code)) return code;
  }
  return prefix + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/** The VIP tier a balance qualifies for, and the one above it. */
function vipFor(balance) {
  const levels = q.vipLevels.all();
  let current = levels[0];
  levels.forEach(function (l) { if (balance >= l.min_balance) current = l; });
  const next = levels.filter(function (l) { return l.min_balance > current.min_balance; })[0] || null;
  return { current: current, next: next, levels: levels };
}

function mapSellerOrder(o) {
  return {
    id: o.id,
    code: o.code,
    product: o.product,
    image: o.image,
    price: o.price,
    qty: o.qty,
    total: o.total,
    commission: o.commission,
    rate: o.rate,
    status: o.status,
    frozenReason: o.frozen_reason || '',
    /* an order is scored three times, so the app knows where it is up to */
    ratings: [o.rating || 0, o.rating2 || 0, o.rating3 || 0].filter(function (n) { return n > 0; }),
    rating: o.rating || 0,
    ratingsLeft: [o.rating, o.rating2, o.rating3].filter(function (n) { return !n; }).length,
    createdAt: o.created_at,
    submittedAt: o.submitted_at
  };
}

/**
 * Housekeeping run before anything is read or written:
 * pending orders left too long freeze, and frozen orders
 * come back to life once the balance covers them again.
 */
function maintain(sellerId) {
  const seller = q.userById.get(sellerId);
  const cutoff = new Date(Date.now() - RULES.staleHours * 3600 * 1000);

  q.sellerStalePending.all(sellerId, stamp(cutoff)).forEach(function (o) {
    db.prepare("UPDATE seller_orders SET status = 'Freezing', frozen_reason = ? WHERE id = ?").run(
      'Not submitted within ' + RULES.staleHours + ' hours',
      o.id
    );
  });

  q.sellerFrozen.all(sellerId).forEach(function (o) {
    if (seller.balance >= o.total) {
      db.prepare("UPDATE seller_orders SET status = 'Pending', frozen_reason = NULL WHERE id = ?").run(o.id);
    }
  });
}

/* The gap a seller has to close before an order can go through: what they
   hold, what the order asks for, and the difference between the two. Every
   place that turns a seller away for money answers in these terms. */
function gapOf(balance, required) {
  const gap = money(required - balance);
  return {
    balance: money(balance),
    required: money(required),
    gap: gap > 0 ? gap : 0,
    error:
      'Sir your balance is $' + money(balance).toFixed(2) +
      ' but required amount is $' + money(required).toFixed(2) +
      '. Your gap is $' + gap.toFixed(2) +
      ' — add $' + gap.toFixed(2) + ' and complete the gap first.'
  };
}

/* Money only leaves the platform to an account the seller has already put on
   file, so the withdrawal screen asks this first. It answers in the two steps
   the seller has to take: pick a payment method, then fill it in. */
function payoutOf(seller) {
  const method = String(seller.bank_method || '').trim();
  const ready = function () {
    return {
      ready: true, step: '', method: method,
      title: '', error: '', hint: ''
    };
  };

  if (!method) {
    return {
      ready: false,
      step: 'method',
      method: '',
      title: 'Add a bank account first',
      error: 'Add a bank account first. You have not added any account to be paid into yet.',
      hint: 'Open Wallet address, select your payment method and add it.'
    };
  }

  if (/bank/i.test(method)) {
    const missing = [];
    if (!String(seller.bank_beneficiary || '').trim()) missing.push('beneficiary name');
    if (!String(seller.bank_account || '').trim()) missing.push('bank account number');
    if (!String(seller.bank_ifsc || '').trim()) missing.push('IFSC');
    if (missing.length) {
      return {
        ready: false,
        step: 'details',
        method: method,
        title: 'Finish your bank account',
        error: 'Your ' + method + ' account still needs the ' + missing.join(', ') + '.',
        hint: 'Open Wallet address, select ' + method + ' and add it.'
      };
    }
    return ready();
  }

  if (!String(seller.wallet || '').trim()) {
    return {
      ready: false,
      step: 'details',
      method: method,
      title: 'Add your ' + method + ' address',
      error: 'You chose ' + method + ' but no address is saved against it.',
      hint: 'Open Wallet address, select ' + method + ' and add it.'
    };
  }
  return ready();
}

function sellerSummary(me) {
  const fresh = q.userById.get(me.id);
  const vip = vipFor(fresh.balance);
  const frozen = q.sellerFrozen.all(me.id);
  const shortfall = frozen.reduce(function (max, o) {
    return Math.max(max, money(o.total - fresh.balance));
  }, 0);

  return {
    name: fresh.name,
    phone: fresh.phone,
    balance: fresh.balance,
    rate: vip.current.rate,
    level: { name: vip.current.name, rate: vip.current.rate, dailyOrders: vip.current.daily_orders, color: vip.current.color },
    nextLevel: vip.next
      ? { name: vip.next.name, rate: vip.next.rate, minBalance: vip.next.min_balance, needed: money(vip.next.min_balance - fresh.balance) }
      : null,
    dailyUsed: q.sellerOrdersToday.get(me.id, today()).n,
    dailyLimit: vip.current.daily_orders,
    todayCommission: q.sellerCommissionOn.get(me.id, today()).total,
    totalCommission: q.sellerCommission.get(me.id).total,
    completed: q.sellerCount.get(me.id, 'Completed').n,
    pending: q.sellerCount.get(me.id, 'Pending').n,
    frozen: frozen.length,
    frozenShortfall: shortfall > 0 ? shortfall : 0,
    /* what the wallet has to make up before the frozen order can go through */
    gap: frozen.length ? gapOf(fresh.balance, Math.max.apply(null, frozen.map(function (o) { return o.total; }))) : null
  };
}

/** Everyone this seller invited, three levels deep. */
function teamOf(seller) {
  const rates = [TEAM_RATES.level1, TEAM_RATES.level2, TEAM_RATES.level3];
  const members = [];
  let frontier = [seller.name];

  for (let depth = 0; depth < 3 && frontier.length; depth++) {
    let next = [];
    frontier.forEach(function (name) {
      q.invitedBy.all(name).forEach(function (u) {
        const earned = q.commissionFor.get(u.id);
        members.push({
          id: u.id,
          name: u.name,
          level: depth + 1,
          role: u.role,
          joined: u.joined,
          orders: earned.orders,
          commission: earned.total,
          /* what this member earns the inviter */
          share: money((earned.total * rates[depth]) / 100)
        });
        next.push(u.name);
      });
    });
    frontier = next;
  }

  const byLevel = [1, 2, 3].map(function (l) {
    const rows = members.filter(function (m) { return m.level === l; });
    return {
      level: l,
      rate: rates[l - 1],
      members: rows.length,
      commission: money(rows.reduce(function (a, m) { return a + m.share; }, 0))
    };
  });

  return {
    link: '/seller/login.html?tab=register&invite=' + encodeURIComponent(seller.invite_code || seller.name),
    inviteCode: seller.invite_code || seller.name,
    rates: TEAM_RATES,
    totals: {
      members: members.length,
      commission: money(byLevel.reduce(function (a, l) { return a + l.commission; }, 0))
    },
    levels: byLevel,
    members: members
  };
}

function sellerApi(req, res, me, parts, method, body) {
  const head = parts[0] || '';
  const id = parts[1] ? Number(parts[1]) : null;
  const sub = parts[2] || '';

  maintain(me.id);

  if (head === 'summary' && method === 'GET') return send(res, 200, sellerSummary(me));

  if (head === 'profile' && method === 'GET') {
    const fresh = q.userById.get(me.id);
    return send(res, 200, Object.assign(sellerSummary(me), {
      email: fresh.email,
      joined: fresh.joined,
      inviter: fresh.agent,
      appName: SEED.seller.appName,
      /* the number they signed up with is the one they know themselves by;
         the padded row id is only the fallback for a seeded account */
      accountNumber: fresh.phone || String(fresh.id).padStart(10, '0'),
      inviteCode: fresh.invite_code,
      creditScore: fresh.credit_score,
      membership: fresh.membership,
      wallet: fresh.wallet || '',
      /* whether there is an account to be paid into, and what is missing */
      payout: payoutOf(fresh),
      /* money held by withdrawal requests waiting for approval */
      frozenAmount: q.heldFor.get(fresh.name).total
    }));
  }

  /* ---- money in and out, newest first ---- */
  if (head === 'funds' && method === 'GET') {
    const seller = q.userById.get(me.id);
    const rows = [];

    q.rechargesFor.all(seller.name).forEach(function (r) {
      rows.push({
        id: 'r' + r.id,
        kind: 'Recharge',
        amount: r.amount,
        sign: r.status === 'Completed' ? 1 : 0,
        status: r.status,
        detail: r.method,
        date: r.date
      });
    });

    q.withdrawsFor.all(seller.name).forEach(function (w) {
      rows.push({
        id: 'w' + w.id,
        kind: 'Withdrawal',
        amount: w.amount,
        sign: w.status === 'Rejected' ? 0 : -1,
        status: w.status,
        detail: w.method + ' · ' + w.account,
        date: w.date
      });
    });

    q.sellerOrdersByStatus.all(me.id, 'Completed').forEach(function (o) {
      rows.push({
        id: 'c' + o.id,
        kind: 'Commission',
        amount: o.commission,
        sign: 1,
        status: 'Completed',
        detail: o.code,
        date: String(o.submitted_at || o.created_at).slice(0, 10)
      });
    });

    rows.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    return send(res, 200, rows);
  }

  if (head === 'withdrawals' && method === 'GET') {
    const seller = q.userById.get(me.id);
    return send(res, 200, q.withdrawsFor.all(seller.name).map(function (w) {
      return {
        id: w.id,
        amount: w.amount,
        method: w.method,
        account: w.account,
        status: w.status,
        date: w.date,
        note: w.note || ''
      };
    }));
  }

  /* ---- USDT wallet address ---- */
  if (head === 'wallet') {
    const seller = q.userById.get(me.id);
    if (method === 'GET') {
      /* the screen shows either the address or the bank card, depending on
         the method, so it gets both in one call */
      return send(res, 200, {
        wallet: seller.wallet || '',
        method: seller.bank_method || '',
        methods: SEED.seller.withdrawMethods,
        bank: seller.bank_name || '',
        beneficiary: seller.bank_beneficiary || '',
        account: seller.bank_account || '',
        ifsc: seller.bank_ifsc || '',
        banks: SEED.seller.banks
      });
    }
    if (method === 'PUT') {
      const address = String(body.wallet || '').trim();
      if (body.password !== undefined && !store.verifyPassword(body.password || '', seller.password)) {
        return send(res, 400, { error: 'Your login password is not right' });
      }
      if (address && address.length < 12) return send(res, 400, { error: 'That does not look like a wallet address' });
      db.prepare('UPDATE users SET wallet = ?, bank_method = ? WHERE id = ?').run(
        address,
        body.method !== undefined ? String(body.method) : seller.bank_method,
        me.id
      );
      return send(res, 200, { wallet: address });
    }
  }

  /* ---- the linked account: one per member, and only once it is unlocked ---- */
  if (head === 'linked') {
    const seller = q.userById.get(me.id);
    const bound = q.linkedFor.all(me.id)[0] || null;
    /* the panel opens the feature to paid tiers once a couple of tasks are done */
    const done = q.sellerOrdersByStatus.all(me.id, 'Completed').length;
    const premium = String(seller.membership || 'Free').toLowerCase() !== 'free';
    const unlocked = premium && done > LINKED_MIN_TASKS;

    if (method === 'GET') {
      return send(res, 200, {
        mainAccount: String(seller.id).padStart(10, '0'),
        membership: seller.membership,
        premium: premium,
        completed: done,
        required: LINKED_MIN_TASKS,
        unlocked: unlocked,
        linked: bound
          ? { id: bound.id, kind: bound.kind, holder: bound.holder, account: bound.account, createdAt: bound.created_at }
          : null
      });
    }

    if (method === 'POST') {
      if (bound) return send(res, 400, { error: 'Each member can only bind one linked account' });
      if (!premium) return send(res, 403, { error: 'The linked account function is only available to premium members (VIP)' });
      if (done <= LINKED_MIN_TASKS) {
        return send(res, 403, {
          error: 'Complete more than ' + LINKED_MIN_TASKS + ' tasks to unlock the linked account'
        });
      }
      const account = String(body.account || '').trim();
      if (!account) return send(res, 400, { error: 'Enter the account number or address' });
      if (String(seller.id).padStart(10, '0') === account) {
        return send(res, 400, { error: 'You cannot link your own main account' });
      }
      db.prepare(
        'INSERT INTO linked_accounts (user_id, kind, holder, account, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(me.id, String(body.kind || 'USDT (TRC20)'), String(body.holder || ''), account, 1, today());
      return send(res, 201, { ok: true });
    }

    if (id && method === 'DELETE') {
      db.prepare('DELETE FROM linked_accounts WHERE id = ? AND user_id = ?').run(id, me.id);
      return send(res, 200, { ok: true });
    }
  }

  /* ---- password ---- */
  if (head === 'password' && method === 'POST') {
    const seller = q.userById.get(me.id);
    const withdrawal = String(body.type || 'login') === 'withdraw';
    const stored = withdrawal ? seller.withdraw_password : seller.password;

    if (!store.verifyPassword(body.current || '', stored)) {
      return send(res, 400, { error: 'Your old password is not right' });
    }
    const next = String(body.next || '');
    if (next.length < 6) return send(res, 400, { error: 'Use at least six characters' });

    if (withdrawal) {
      db.prepare('UPDATE users SET withdraw_password = ? WHERE id = ?').run(store.hashPassword(next), me.id);
    } else {
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(store.hashPassword(next), me.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(me.id, cookies(req)[COOKIE] || '');
    }
    return send(res, 200, { ok: true });
  }

  if (head === 'vip' && method === 'GET') {
    const fresh = q.userById.get(me.id);
    const vip = vipFor(fresh.balance);
    return send(res, 200, {
      balance: fresh.balance,
      current: vip.current.name,
      levels: vip.levels.map(function (l) {
        return {
          name: l.name,
          minBalance: l.min_balance,
          rate: l.rate,
          dailyOrders: l.daily_orders,
          color: l.color,
          unlocked: fresh.balance >= l.min_balance,
          needed: money(Math.max(0, l.min_balance - fresh.balance))
        };
      })
    });
  }

  if (head === 'team' && method === 'GET') return send(res, 200, teamOf(q.userById.get(me.id)));

  if (head === 'home' && method === 'GET') {
    return send(res, 200, {
      appName: SEED.seller.appName,
      feed: q.feed.all(),
      partners: SEED.partners,
      service: SEED.seller.service,
      rechargeNotes: SEED.seller.rechargeNotes
    });
  }

  if (head === 'products' && method === 'GET') {
    const fresh = q.userById.get(me.id);
    const rate = vipFor(fresh.balance).current.rate;
    return send(res, 200, SEED.sellerItems.map(function (it, i) {
      return { id: i + 1, name: it[0], price: it[1], image: it[2], rate: rate };
    }));
  }

  if (head === 'orders' && method === 'GET') {
    const status = (new URL(req.url, 'http://x').searchParams.get('status') || 'all').toLowerCase();
    const rows = status === 'all' ? q.sellerOrders.all(me.id) : q.sellerOrdersByStatus.all(me.id, status);
    return send(res, 200, rows.map(mapSellerOrder));
  }

  if (head === 'grab' && method === 'POST') {
    const blocking = q.sellerBlocking.all(me.id)[0];
    if (blocking) {
      if (blocking.status === 'Freezing') {
        const held = q.userById.get(me.id);
        return send(res, 409, Object.assign(gapOf(held.balance, blocking.total), {
          order: mapSellerOrder(blocking)
        }));
      }
      return send(res, 409, {
        error: 'Please submit your pending order before grabbing a new one',
        order: mapSellerOrder(blocking)
      });
    }

    const seller = q.userById.get(me.id);
    const vip = vipFor(seller.balance).current;

    const usedToday = q.sellerOrdersToday.get(me.id, today()).n;
    if (usedToday >= vip.daily_orders) {
      return send(res, 429, {
        error: 'Daily limit reached — ' + vip.name + ' allows ' + vip.daily_orders + ' orders a day.'
      });
    }

    /* only match products this seller can actually take on */
    const affordable = SEED.sellerItems.filter(function (it) { return it[1] <= seller.balance; });
    if (!affordable.length) {
      const cheapest = SEED.sellerItems.reduce(function (low, it) { return Math.min(low, it[1]); }, Infinity);
      return send(res, 400, gapOf(seller.balance, cheapest));
    }
    const item = affordable[Math.floor(Math.random() * affordable.length)];
    const price = item[1];

    /* every few orders the platform matches a premium task worth more
       than the balance — it is created frozen until the seller tops up */
    const done = q.sellerCount.get(me.id, 'Completed').n;
    const premium = (done + 1) % RULES.premiumEvery === 0;
    /* a premium task must stay fundable: never ask for more than one
       full recharge on top of the balance the seller already holds */
    const reachable = seller.balance + SEED.seller.paymentMethod.max * 0.9;
    const budget = premium
      ? Math.min(seller.balance * RULES.premiumMultiplier, reachable)
      : seller.balance * (0.5 + Math.random() * 0.35);

    /* round down so a premium order never drifts past what one recharge covers */
    const qty = Math.max(1, premium ? Math.floor(budget / price) : Math.round(budget / price));
    const total = money(price * qty);
    const commission = money((total * vip.rate) / 100);
    const now = new Date();
    const code = orderCode(now);
    const frozen = total > seller.balance;

    const info = db
      .prepare(
        `INSERT INTO seller_orders (seller_id, code, product, image, price, qty, total, commission, rate, status, created_at, frozen_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        me.id, code, item[0], item[2], price, qty, total, commission, vip.rate,
        frozen ? 'Freezing' : 'Pending', stamp(now),
        frozen ? 'Order value is above your balance' : null
      );

    const row = db.prepare('SELECT * FROM seller_orders WHERE id = ?').get(Number(info.lastInsertRowid));
    return send(res, 201, Object.assign(mapSellerOrder(row), {
      shortfall: frozen ? money(total - seller.balance) : 0,
      gap: frozen ? gapOf(seller.balance, total) : null
    }));
  }

  /* ---- the five stars a seller leaves on the product they matched ---- */
  if (head === 'orders' && id && sub === 'rate' && method === 'POST') {
    const order = q.sellerOrderById.get(id, me.id);
    if (!order) return send(res, 404, { error: 'Order not found' });

    const stars = Math.round(Number(body.rating || 0));
    if (!(stars >= 1 && stars <= 5)) return send(res, 400, { error: 'Give the product 1 to 5 stars' });

    /* three scores are asked for; this one goes in the next empty slot */
    const slot = ['rating', 'rating2', 'rating3'].filter(function (c) { return !order[c]; })[0];
    if (!slot) return send(res, 400, { error: 'This order already has all three ratings' });

    db.prepare('UPDATE seller_orders SET ' + slot + ' = ? WHERE id = ?').run(stars, id);
    return send(res, 200, { order: mapSellerOrder(q.sellerOrderById.get(id, me.id)) });
  }

  if (head === 'orders' && id && sub === 'submit' && method === 'POST') {
    const order = q.sellerOrderById.get(id, me.id);
    if (!order) return send(res, 404, { error: 'Order not found' });
    if (order.status === 'Freezing') {
      const seller = q.userById.get(me.id);
      return send(res, 400, Object.assign(gapOf(seller.balance, order.total), {
        shortfall: money(order.total - seller.balance)
      }));
    }
    if (order.status !== 'Pending') return send(res, 400, { error: 'This order has already been submitted' });

    db.prepare("UPDATE seller_orders SET status = 'Completed', submitted_at = ? WHERE id = ?").run(stamp(new Date()), id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.commission, me.id);
    store.addRevenue(order.total);

    return send(res, 200, {
      order: mapSellerOrder(q.sellerOrderById.get(id, me.id)),
      summary: sellerSummary(me)
    });
  }

  /* ---- account details: every movement, newest first ---- */
  if (head === 'ledger' && method === 'GET') {
    const seller = q.userById.get(me.id);
    const rows = [];

    q.sellerOrdersByStatus.all(me.id, 'Completed').forEach(function (o) {
      rows.push({ at: o.submitted_at || o.created_at, tag: '', amount: o.commission, sign: 1 });
    });

    /* what the downline earned this seller */
    const team = teamOf(seller);
    const rates = [TEAM_RATES.level1, TEAM_RATES.level2, TEAM_RATES.level3];
    team.members.forEach(function (m) {
      q.sellerOrdersByStatus.all(m.id, 'Completed').forEach(function (o) {
        rows.push({
          at: o.submitted_at || o.created_at,
          tag: 'subordinate rebate',
          amount: money((o.commission * rates[m.level - 1]) / 100),
          sign: 1
        });
      });
    });

    q.rechargesFor.all(seller.name).forEach(function (r) {
      if (r.status !== 'Completed') return;
      rows.push({ at: r.date + ' ' + (r.time || '00:00:00'), tag: 'recharge', amount: r.amount, sign: 1 });
    });

    q.withdrawsFor.all(seller.name).forEach(function (w) {
      if (w.status === 'Rejected') return;
      rows.push({ at: w.date + ' ' + (w.time || '00:00:00'), tag: 'withdrawal', amount: w.amount, sign: -1 });
    });

    rows.sort(function (a, b) { return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
    return send(res, 200, rows);
  }

  /* ---- recharge and withdrawal records, with their running totals ---- */
  if (head === 'records' && method === 'GET') {
    const seller = q.userById.get(me.id);
    const kind = parts[1];

    if (kind === 'recharge') {
      const list = q.rechargesFor.all(seller.name);
      return send(res, 200, {
        cumulative: money(list.reduce(function (a, r) { return a + (r.status === 'Completed' ? r.amount : 0); }, 0)),
        rows: list.map(function (r) {
          return { id: r.id, amount: r.amount, method: r.method, status: r.status, date: r.date, time: r.time || '' };
        })
      });
    }

    if (kind === 'withdraw') {
      const list = q.withdrawsFor.all(seller.name);
      return send(res, 200, {
        cumulative: money(list.reduce(function (a, w) { return a + (w.status === 'Approved' ? w.amount : 0); }, 0)),
        rows: list.map(function (w) {
          return {
            id: w.id, amount: w.amount, method: w.method, account: w.account,
            status: w.status, date: w.date, time: w.time || '', note: w.note || ''
          };
        })
      });
    }
  }

  /* ---- bank card on file ---- */
  if (head === 'bank') {
    const seller = q.userById.get(me.id);
    if (method === 'GET') {
      return send(res, 200, {
        bank: seller.bank_name || '',
        beneficiary: seller.bank_beneficiary || '',
        account: seller.bank_account || '',
        ifsc: seller.bank_ifsc || '',
        banks: SEED.seller.banks
      });
    }
    if (method === 'PUT') {
      if (!store.verifyPassword(body.password || '', seller.password)) {
        return send(res, 400, { error: 'Your login password is not right' });
      }
      if (!String(body.beneficiary || '').trim()) return send(res, 400, { error: 'Beneficiary name is required' });
      if (!String(body.account || '').trim()) return send(res, 400, { error: 'Bank account number is required' });
      if (!String(body.ifsc || '').trim()) return send(res, 400, { error: 'IFSC is required' });

      db.prepare(
        "UPDATE users SET bank_method = 'Bank Transfer', bank_name = ?, bank_beneficiary = ?, bank_account = ?, bank_ifsc = ? WHERE id = ?"
      ).run(
        String(body.bank || ''), String(body.beneficiary).trim(),
        String(body.account).trim(), String(body.ifsc).trim(), me.id
      );
      return send(res, 200, { ok: true });
    }
  }

  if (head === 'recharge' && method === 'POST') {
    const amount = Number(body.amount || 0);
    const limits = SEED.seller.paymentMethod;
    if (!(amount >= limits.min && amount <= limits.max)) {
      return send(res, 400, { error: 'Amount must be between ' + limits.min + ' and ' + limits.max });
    }
    const txn = crypto.randomBytes(5).toString('hex');
    const seller = q.userById.get(me.id);
    db.prepare(
      "INSERT INTO recharges (user, email, amount, method, txn, status, date) VALUES (?, ?, ?, ?, ?, 'Pending', ?)"
    ).run(seller.name, seller.email, amount, limits.label, txn, today());
    return send(res, 201, { ok: true, amount: amount, txn: txn, method: limits.label });
  }

  if (head === 'withdraw' && method === 'POST') {
    const amount = Number(body.amount || 0);
    const seller = q.userById.get(me.id);

    /* nothing goes out until there is an account to send it to */
    const payout = payoutOf(seller);
    if (!payout.ready) return send(res, 400, { error: payout.error, payout: payout });

    if (body.password !== undefined && !store.verifyPassword(body.password || '', seller.password)) {
      return send(res, 400, { error: 'Your login password is not right' });
    }
    if (amount < 10) return send(res, 400, { error: 'Minimum withdrawal is 10.00' });
    if (amount > seller.balance) return send(res, 400, { error: 'Amount is more than your balance' });
    if (q.sellerBlocking.all(me.id).length) {
      return send(res, 400, { error: 'Complete your pending orders and then apply for withdraw' });
    }

    const onFile = /bank/i.test(payout.method) ? seller.bank_account : seller.wallet;
    const account = String(body.account || onFile || seller.phone || seller.email);
    db.prepare(
      "INSERT INTO withdraws (user, email, amount, method, account, status, date, note) VALUES (?, ?, ?, ?, ?, 'Pending', ?, '')"
    ).run(seller.name, seller.email, amount, String(body.method || payout.method || 'USDT (TRC20)'), account, today());
    /* the amount is held until an administrator approves the request */
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, me.id);
    return send(res, 201, { ok: true, amount: amount, summary: sellerSummary(me) });
  }

  return send(res, 404, { error: 'Unknown seller endpoint' });
}

/* ---------------------------------------------------------
   Static files
   --------------------------------------------------------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/login.html';

  /* uploaded product images live beside the database, not in the web root */
  if (rel.startsWith('/uploads/')) {
    const name = path.basename(rel);
    return fs.readFile(path.join(UPLOAD_DIR, name), function (err, data) {
      if (err) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(name)] || 'application/octet-stream' });
      res.end(data);
    });
  }

  const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));

  /* never serve the database or the server sources themselves */
  if (!file.startsWith(ROOT) || file.startsWith(path.join(ROOT, 'server'))) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(file, function (err, data) {
    if (err) {
      fs.readFile(path.join(ROOT, '404.html'), function (e2, page) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(e2 ? 'Not found' : page);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ---------------------------------------------------------
   Server
   --------------------------------------------------------- */
const server = http.createServer(function (req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  if (url.pathname.startsWith('/api')) {
    api(req, res, url).catch(function (err) {
      console.error(req.method, url.pathname, '->', err.message);
      send(res, 400, { error: err.message || 'Bad request' });
    });
    return;
  }
  serveStatic(req, res, url);
});

if (require.main === module) {
  server.listen(PORT, function () {
    console.log('Club Elite 21 running on http://localhost:' + PORT);
    console.log('Sign in with admin@club21mall.com / password');
  });
}

module.exports = server;
