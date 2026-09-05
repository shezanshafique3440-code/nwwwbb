/* =========================================================
   SQLite storage layer.

   Uses Node's built-in node:sqlite, so the backend runs with
   zero npm dependencies: `npm start` and it works.

   The database is seeded from assets/js/data.js — the same
   file the static demo reads — so the seed lives in one place.
   ========================================================= */
'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = process.env.CLUB21_DB || path.join(DATA_DIR, 'club21.db');

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

/* ---------------------------------------------------------
   Schema
   --------------------------------------------------------- */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT,
    password    TEXT,
    role        TEXT NOT NULL DEFAULT 'Customer',
    agent       TEXT DEFAULT 'Admin',
    agent_email TEXT DEFAULT '',
    referrals   INTEGER NOT NULL DEFAULT 0,
    balance     REAL NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'Active',
    joined      TEXT NOT NULL,
    phone       TEXT DEFAULT '',
    rate        REAL NOT NULL DEFAULT 0,
    membership   TEXT NOT NULL DEFAULT 'Free',
    code             TEXT DEFAULT '',
    username         TEXT DEFAULT '',
    bank_beneficiary TEXT DEFAULT '',
    bank_type        TEXT DEFAULT '',
    bank_branch      TEXT DEFAULT '',
    withdraw_password TEXT DEFAULT '',
    approved         INTEGER NOT NULL DEFAULT 1,
    freeze           REAL NOT NULL DEFAULT 0,
    so_order_no      INTEGER NOT NULL DEFAULT 0,
    so_amount        REAL NOT NULL DEFAULT 0,
    so_commission    REAL NOT NULL DEFAULT 0,
    so_limit         INTEGER NOT NULL DEFAULT 0,
    bank_method      TEXT DEFAULT '',
    bank_name        TEXT DEFAULT '',
    bank_account     TEXT DEFAULT '',
    bank_ifsc        TEXT DEFAULT '',
    crypto           TEXT DEFAULT '',
    crypto_address   TEXT DEFAULT '',
    invite_code  TEXT,
    credit_score INTEGER NOT NULL DEFAULT 100,
    wallet       TEXT DEFAULT '',
    avatar       TEXT DEFAULT '',
    profile      TEXT DEFAULT '{}',
    deleted_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT DEFAULT '',
    sku         TEXT NOT NULL UNIQUE,
    price       REAL NOT NULL DEFAULT 0,
    image       TEXT DEFAULT '',
    image_url   TEXT DEFAULT '',
    category    TEXT DEFAULT '',
    description TEXT DEFAULT '',
    reviews     INTEGER NOT NULL DEFAULT 0,
    rating      REAL NOT NULL DEFAULT 5,
    popular     INTEGER NOT NULL DEFAULT 0,
    rate        REAL NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY,
    code          TEXT,
    user          TEXT,
    customer_code TEXT DEFAULT '',
    product       TEXT NOT NULL,
    sku           TEXT DEFAULT '',
    image         TEXT DEFAULT '',
    price         REAL NOT NULL DEFAULT 0,
    qty           INTEGER NOT NULL DEFAULT 1,
    total         REAL NOT NULL DEFAULT 0,
    shipping      REAL NOT NULL DEFAULT 0,
    discount      REAL NOT NULL DEFAULT 0,
    commission    REAL NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'Pending',
    date          TEXT NOT NULL,
    time          TEXT DEFAULT '',
    rate_desc      INTEGER NOT NULL DEFAULT 0,
    rate_logistics INTEGER NOT NULL DEFAULT 0,
    rate_service   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS withdraws (
    id          INTEGER PRIMARY KEY,
    user        TEXT NOT NULL,
    email       TEXT DEFAULT '',
    amount      REAL NOT NULL DEFAULT 0,
    method      TEXT DEFAULT '',
    account     TEXT DEFAULT '',
    wallet      TEXT DEFAULT '',
    txn         TEXT DEFAULT '',
    tx_status   TEXT DEFAULT '',
    flow        TEXT DEFAULT 'Out',
    description TEXT DEFAULT 'Withdrawal Request',
    status      TEXT NOT NULL DEFAULT 'Pending',
    date        TEXT NOT NULL,
    time        TEXT DEFAULT '',
    updated_at  TEXT DEFAULT '',
    note        TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS recharges (
    id          INTEGER PRIMARY KEY,
    user        TEXT NOT NULL,
    email       TEXT DEFAULT '',
    amount      REAL NOT NULL DEFAULT 0,
    method      TEXT DEFAULT '',
    txn         TEXT DEFAULT '',
    tx_status   TEXT DEFAULT '',
    flow        TEXT DEFAULT '',
    description TEXT DEFAULT 'Wallet Recharge',
    status      TEXT NOT NULL DEFAULT 'Pending',
    date        TEXT NOT NULL,
    time        TEXT DEFAULT '',
    updated_at  TEXT DEFAULT '',
    note        TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS seller_orders (
    id           INTEGER PRIMARY KEY,
    seller_id    INTEGER NOT NULL,
    code         TEXT NOT NULL UNIQUE,
    product      TEXT NOT NULL,
    image        TEXT DEFAULT '',
    price        REAL NOT NULL DEFAULT 0,
    qty          INTEGER NOT NULL DEFAULT 1,
    total        REAL NOT NULL DEFAULT 0,
    commission   REAL NOT NULL DEFAULT 0,
    rate         REAL NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'Pending',
    created_at   TEXT NOT NULL,
    submitted_at TEXT,
    frozen_reason TEXT,
    rating       INTEGER NOT NULL DEFAULT 0,
    rating2      INTEGER NOT NULL DEFAULT 0,
    rating3      INTEGER NOT NULL DEFAULT 0,
    seeded       INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS linked_accounts (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    kind       TEXT NOT NULL DEFAULT 'USDT (TRC20)',
    holder     TEXT DEFAULT '',
    account    TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vip_levels (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    min_balance  REAL NOT NULL,
    rate         REAL NOT NULL,
    daily_orders INTEGER NOT NULL,
    color        TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS withdraw_feed (
    id      INTEGER PRIMARY KEY,
    account TEXT NOT NULL,
    amount  REAL NOT NULL,
    date    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`);

/* Older database files predate the seller columns — add them in place. */
(function migrate() {
  const columns = db.prepare('PRAGMA table_info(users)').all().map(function (c) { return c.name; });
  if (columns.indexOf('phone') === -1) db.exec("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''");
  if (columns.indexOf('rate') === -1) db.exec('ALTER TABLE users ADD COLUMN rate REAL NOT NULL DEFAULT 0');

  const wCols = db.prepare('PRAGMA table_info(withdraws)').all().map(function (c) { return c.name; });
  [
    ['wallet', "ALTER TABLE withdraws ADD COLUMN wallet TEXT DEFAULT ''"],
    ['txn', "ALTER TABLE withdraws ADD COLUMN txn TEXT DEFAULT ''"],
    ['tx_status', "ALTER TABLE withdraws ADD COLUMN tx_status TEXT DEFAULT ''"],
    ['flow', "ALTER TABLE withdraws ADD COLUMN flow TEXT DEFAULT 'Out'"],
    ['description', "ALTER TABLE withdraws ADD COLUMN description TEXT DEFAULT 'Withdrawal Request'"],
    ['time', "ALTER TABLE withdraws ADD COLUMN time TEXT DEFAULT ''"],
    ['updated_at', "ALTER TABLE withdraws ADD COLUMN updated_at TEXT DEFAULT ''"]
  ].forEach(function (pair) {
    if (wCols.length && wCols.indexOf(pair[0]) === -1) db.exec(pair[1]);
  });

  const rCols = db.prepare('PRAGMA table_info(recharges)').all().map(function (c) { return c.name; });
  [
    ['tx_status', "ALTER TABLE recharges ADD COLUMN tx_status TEXT DEFAULT ''"],
    ['flow', "ALTER TABLE recharges ADD COLUMN flow TEXT DEFAULT ''"],
    ['description', "ALTER TABLE recharges ADD COLUMN description TEXT DEFAULT 'Wallet Recharge'"],
    ['time', "ALTER TABLE recharges ADD COLUMN time TEXT DEFAULT ''"],
    ['updated_at', "ALTER TABLE recharges ADD COLUMN updated_at TEXT DEFAULT ''"],
    ['note', "ALTER TABLE recharges ADD COLUMN note TEXT DEFAULT ''"]
  ].forEach(function (pair) {
    if (rCols.length && rCols.indexOf(pair[0]) === -1) db.exec(pair[1]);
  });

  const oCols = db.prepare('PRAGMA table_info(orders)').all().map(function (c) { return c.name; });
  [
    ['code', 'ALTER TABLE orders ADD COLUMN code TEXT'],
    ['customer_code', "ALTER TABLE orders ADD COLUMN customer_code TEXT DEFAULT ''"],
    ['sku', "ALTER TABLE orders ADD COLUMN sku TEXT DEFAULT ''"],
    ['image', "ALTER TABLE orders ADD COLUMN image TEXT DEFAULT ''"],
    ['price', 'ALTER TABLE orders ADD COLUMN price REAL NOT NULL DEFAULT 0'],
    ['qty', 'ALTER TABLE orders ADD COLUMN qty INTEGER NOT NULL DEFAULT 1'],
    ['shipping', 'ALTER TABLE orders ADD COLUMN shipping REAL NOT NULL DEFAULT 0'],
    ['discount', 'ALTER TABLE orders ADD COLUMN discount REAL NOT NULL DEFAULT 0'],
    ['time', "ALTER TABLE orders ADD COLUMN time TEXT DEFAULT ''"],
    ['rate_desc', 'ALTER TABLE orders ADD COLUMN rate_desc INTEGER NOT NULL DEFAULT 0'],
    ['rate_logistics', 'ALTER TABLE orders ADD COLUMN rate_logistics INTEGER NOT NULL DEFAULT 0'],
    ['rate_service', 'ALTER TABLE orders ADD COLUMN rate_service INTEGER NOT NULL DEFAULT 0']
  ].forEach(function (pair) {
    if (oCols.length && oCols.indexOf(pair[0]) === -1) db.exec(pair[1]);
  });

  const pCols = db.prepare('PRAGMA table_info(products)').all().map(function (c) { return c.name; });
  [
    ['slug', "ALTER TABLE products ADD COLUMN slug TEXT DEFAULT ''"],
    ['image_url', "ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT ''"],
    ['description', "ALTER TABLE products ADD COLUMN description TEXT DEFAULT ''"],
    ['reviews', 'ALTER TABLE products ADD COLUMN reviews INTEGER NOT NULL DEFAULT 0'],
    ['rating', 'ALTER TABLE products ADD COLUMN rating REAL NOT NULL DEFAULT 5'],
    ['popular', 'ALTER TABLE products ADD COLUMN popular INTEGER NOT NULL DEFAULT 0']
  ].forEach(function (pair) {
    if (pCols.length && pCols.indexOf(pair[0]) === -1) db.exec(pair[1]);
  });

  const soCols = db.prepare('PRAGMA table_info(seller_orders)').all().map(function (c) { return c.name; });
  if (soCols.length && soCols.indexOf('frozen_reason') === -1) {
    db.exec('ALTER TABLE seller_orders ADD COLUMN frozen_reason TEXT');
  }
  if (soCols.length && soCols.indexOf('seeded') === -1) {
    db.exec('ALTER TABLE seller_orders ADD COLUMN seeded INTEGER NOT NULL DEFAULT 0');
  }
  ['rating', 'rating2', 'rating3'].forEach(function (c) {
    if (soCols.length && soCols.indexOf(c) === -1) {
      db.exec('ALTER TABLE seller_orders ADD COLUMN ' + c + ' INTEGER NOT NULL DEFAULT 0');
    }
  });
  [
    ['code', "ALTER TABLE users ADD COLUMN code TEXT DEFAULT ''"],
    ['username', "ALTER TABLE users ADD COLUMN username TEXT DEFAULT ''"],
    ['bank_beneficiary', "ALTER TABLE users ADD COLUMN bank_beneficiary TEXT DEFAULT ''"],
    ['bank_type', "ALTER TABLE users ADD COLUMN bank_type TEXT DEFAULT ''"],
    ['bank_branch', "ALTER TABLE users ADD COLUMN bank_branch TEXT DEFAULT ''"],
    ['withdraw_password', "ALTER TABLE users ADD COLUMN withdraw_password TEXT DEFAULT ''"],
    ['approved', 'ALTER TABLE users ADD COLUMN approved INTEGER NOT NULL DEFAULT 1'],
    ['freeze', 'ALTER TABLE users ADD COLUMN freeze REAL NOT NULL DEFAULT 0'],
    ['so_order_no', 'ALTER TABLE users ADD COLUMN so_order_no INTEGER NOT NULL DEFAULT 0'],
    ['so_amount', 'ALTER TABLE users ADD COLUMN so_amount REAL NOT NULL DEFAULT 0'],
    ['so_commission', 'ALTER TABLE users ADD COLUMN so_commission REAL NOT NULL DEFAULT 0'],
    ['so_limit', 'ALTER TABLE users ADD COLUMN so_limit INTEGER NOT NULL DEFAULT 0'],
    ['bank_method', "ALTER TABLE users ADD COLUMN bank_method TEXT DEFAULT ''"],
    ['bank_name', "ALTER TABLE users ADD COLUMN bank_name TEXT DEFAULT ''"],
    ['bank_account', "ALTER TABLE users ADD COLUMN bank_account TEXT DEFAULT ''"],
    ['bank_ifsc', "ALTER TABLE users ADD COLUMN bank_ifsc TEXT DEFAULT ''"],
    ['crypto', "ALTER TABLE users ADD COLUMN crypto TEXT DEFAULT ''"],
    ['crypto_address', "ALTER TABLE users ADD COLUMN crypto_address TEXT DEFAULT ''"],
    ["membership", "ALTER TABLE users ADD COLUMN membership TEXT NOT NULL DEFAULT 'Free'"],
    ['invite_code', 'ALTER TABLE users ADD COLUMN invite_code TEXT'],
    ['credit_score', 'ALTER TABLE users ADD COLUMN credit_score INTEGER NOT NULL DEFAULT 100'],
    ['wallet', "ALTER TABLE users ADD COLUMN wallet TEXT DEFAULT ''"],
    ['avatar', "ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''"],
    ['profile', "ALTER TABLE users ADD COLUMN profile TEXT DEFAULT '{}'"]
  ].forEach(function (pair) {
    if (columns.indexOf(pair[0]) === -1) db.exec(pair[1]);
  });
})();

/** Six uppercase letters, the code a seller shares to invite others. */
function inviteCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 6; i++) out += letters[crypto.randomInt(letters.length)];
  return out;
}

/** Short public handle shown as @code on the details pages. */
function backfillCodes() {
  const rows = db.prepare("SELECT id FROM users WHERE code IS NULL OR code = ''").all();
  const update = db.prepare('UPDATE users SET code = ? WHERE id = ?');
  rows.forEach(function (r) {
    update.run(String(10000 + ((r.id * 7919) % 89999)), r.id);
  });
}

/** Give any account that still lacks one a unique invite code. */
function backfillInviteCodes() {
  const rows = db.prepare("SELECT id FROM users WHERE invite_code IS NULL OR invite_code = ''").all();
  const taken = db
    .prepare("SELECT invite_code AS c FROM users WHERE invite_code IS NOT NULL AND invite_code != ''")
    .all()
    .map(function (r) { return r.c; });
  const update = db.prepare('UPDATE users SET invite_code = ? WHERE id = ?');
  rows.forEach(function (r) {
    let code = inviteCode();
    while (taken.indexOf(code) > -1) code = inviteCode();
    taken.push(code);
    update.run(code, r.id);
  });
}

/* ---------------------------------------------------------
   Passwords — scrypt with a per-user salt
   --------------------------------------------------------- */
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 32).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(plain, stored) {
  if (!stored || stored.indexOf(':') === -1) return false;
  const parts = stored.split(':');
  const hash = crypto.scryptSync(String(plain), parts[0], 32);
  const known = Buffer.from(parts[1], 'hex');
  return hash.length === known.length && crypto.timingSafeEqual(hash, known);
}

/* ---------------------------------------------------------
   Seed — read the browser seed file and replay it into SQLite
   --------------------------------------------------------- */
function readSeed() {
  const src = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'data.js'), 'utf8');
  const sandbox = { window: {} };
  /* data.js assigns window.DB; localStorage is absent here and the
     file already guards those calls with try/catch. */
  new Function('window', src)(sandbox.window);
  return sandbox.window.DB;
}

function isEmpty() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0;
}

function seed() {
  const S = readSeed();
  const defaultPassword = hashPassword('password');

  const insUser = db.prepare(
    `INSERT INTO users (id, name, email, password, role, agent, agent_email, referrals, balance, status, joined, phone, rate, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insProduct = db.prepare(
    `INSERT INTO products (id, name, slug, sku, price, image, image_url, category, description, reviews, rating, popular, rate, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insOrder = db.prepare(
    `INSERT INTO orders (id, code, user, customer_code, product, sku, image, price, qty, total,
       shipping, discount, commission, status, date, time, rate_desc, rate_logistics, rate_service)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insWithdraw = db.prepare(
    `INSERT INTO withdraws (id, user, email, amount, method, account, wallet, txn, tx_status, flow,
       description, status, date, time, updated_at, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insRecharge = db.prepare(
    `INSERT INTO recharges (id, user, email, amount, method, txn, tx_status, flow, description,
       status, date, time, updated_at, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  /* the administrator that owns the panel — signed in by phone like everyone else */
  insUser.run(1000, S.admin.name, S.admin.email, defaultPassword, 'Admin', '', '', 0, 0, 'Active', '2026-03-01',
    S.admin.phone || '', 0, null);
  db.prepare('UPDATE users SET username = ? WHERE id = 1000').run(S.admin.phone || S.admin.name);

  const setExtras = db.prepare(
    `UPDATE users SET username = ?, code = COALESCE(NULLIF(?, ''), code), phone = ?,
       bank_method = ?, bank_name = ?, bank_beneficiary = ?, bank_account = ?, bank_type = ?,
       bank_ifsc = ?, bank_branch = ? WHERE id = ?`
  );

  S.users.forEach(function (u) {
    insUser.run(
      u.id, u.name, u.email || '', defaultPassword, u.role,
      u.agent || 'Admin', u.agentEmail || '', u.referrals || 0, u.balance || 0,
      u.status, u.joined, u.phone || '', 0, null
    );
    const bank = u.bank || {};
    setExtras.run(
      u.username || '', u.code || '', u.phone || '',
      bank.method || '', bank.bank || '', bank.beneficiary || '', bank.account || '',
      bank.type || '', bank.ifsc || '', bank.branch || '', u.id
    );
  });

  S.archived.forEach(function (a) {
    insUser.run(a.id, a.name, a.email || '', defaultPassword, a.role, 'Admin', '', 0, 0, a.status, a.deletedAt, '', 0, a.deletedAt);
  });

  /* sellers sign in to the mobile app with the same accounts table */
  const sellerWithdrawPassword = hashPassword('withdraw');
  S.sellers.forEach(function (u) {
    insUser.run(
      u.id, u.name, u.email, defaultPassword, 'Seller',
      u.inviter || 'Admin', '', 0, u.balance, u.status, u.joined, u.phone || '', u.rate || 0, null
    );
    db.prepare('UPDATE users SET withdraw_password = ?, username = ? WHERE id = ?').run(
      sellerWithdrawPassword,
      String(u.phone || u.name).replace(/\D/g, '') || u.name,
      u.id
    );
    /* the payout account a seeded member has already put on file */
    const sb = u.bank || {};
    db.prepare(
      `UPDATE users SET bank_method = ?, bank_name = ?, bank_beneficiary = ?,
         bank_account = ?, bank_ifsc = ? WHERE id = ?`
    ).run(
      sb.method || '', sb.bank || '', sb.beneficiary || '',
      sb.account || '', sb.ifsc || '', u.id
    );
  });

  const insSellerOrder = db.prepare(
    `INSERT INTO seller_orders (id, seller_id, code, product, image, price, qty, total, commission, rate, status, created_at, submitted_at, seeded)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  );
  /* every task a member takes shows on the administrator's Orders, open ones
     as well as completed, so the seeded ones are mirrored the same way a
     grabbed one is */
  const mirrorOrder = db.prepare(
    `INSERT INTO orders (code, user, customer_code, product, sku, image, price, qty, total,
       shipping, discount, commission, status, date, time, rate_desc, rate_logistics, rate_service)
     VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 0, 0, 0)`
  );
  const sellerById = {};
  S.sellers.forEach(function (u) { sellerById[u.id] = u; });

  S.sellerOrders.forEach(function (o) {
    insSellerOrder.run(
      o.id, o.sellerId, o.code, o.product, o.image, o.price, o.qty, o.total,
      o.commission, o.rate, o.status, o.createdAt, o.status === 'Completed' ? o.createdAt : null
    );
    const owner = sellerById[o.sellerId] || {};
    const at = String(o.createdAt || '').split(' ');
    mirrorOrder.run(
      o.code, owner.name || '', owner.phone || '', o.product, o.image,
      o.price, o.qty, o.total, o.commission, o.status, at[0] || '', at[1] || ''
    );
  });

  const insVip = db.prepare(
    'INSERT INTO vip_levels (id, name, min_balance, rate, daily_orders, color) VALUES (?, ?, ?, ?, ?, ?)'
  );
  S.vipLevels.forEach(function (v) {
    insVip.run(v.id, v.name, v.minBalance, v.rate, v.dailyOrders, v.color);
  });

  const insFeed = db.prepare('INSERT INTO withdraw_feed (id, account, amount, date) VALUES (?, ?, ?, ?)');
  S.withdrawFeed.forEach(function (f) { insFeed.run(f.id, f.account, f.amount, f.date); });

  S.products.forEach(function (p) {
    insProduct.run(
      p.id, p.name, p.slug, p.sku, p.price, p.image, p.imageUrl || '', p.category,
      p.description || '', p.reviews || 0, p.rating || 5, p.popular || 0, p.rate, p.status
    );
  });
  S.orders.forEach(function (o) {
    insOrder.run(
      o.id, o.code, o.user, o.customerCode || '', o.product, o.sku || '', o.image || '',
      o.price || 0, o.qty || 1, o.total, o.shipping || 0, o.discount || 0, o.commission,
      o.status, o.date, o.time || '',
      o.ratings ? o.ratings.description : 0, o.ratings ? o.ratings.logistics : 0, o.ratings ? o.ratings.service : 0
    );
  });
  S.withdraws.forEach(function (w) {
    insWithdraw.run(
      w.id, w.user, w.email, w.amount, w.method, w.account, w.wallet || '', w.txn || '',
      w.txStatus || '', w.flow || 'Out', w.description || 'Withdrawal Request',
      w.status, w.date, w.time || '', w.updatedAt || '', w.note || ''
    );
  });
  S.recharges.forEach(function (r) {
    insRecharge.run(
      r.id, r.user, r.email, r.amount, r.method, r.txn, r.txStatus || '', r.flow || '',
      r.description || 'Wallet Recharge', r.status, r.date, r.time || '', r.updatedAt || '', r.note || ''
    );
  });

  /* Lifetime revenue is a running figure the panel keeps: the seed value
     is the balance carried over, and completing an order adds to it. */
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('total_revenue', String(S.stats.totalRevenue));

  return S;
}

if (isEmpty()) seed();
backfillInviteCodes();
backfillCodes();

/* ---------------------------------------------------------
   Queries used by the API
   --------------------------------------------------------- */
const q = {
  activeUsers: db.prepare('SELECT * FROM users WHERE deleted_at IS NULL AND role = ? ORDER BY id DESC'),
  archivedUsers: db.prepare('SELECT * FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC, id DESC'),
  userById: db.prepare('SELECT * FROM users WHERE id = ?'),
  userByEmail: db.prepare('SELECT * FROM users WHERE lower(email) = lower(?) AND deleted_at IS NULL'),
  userByName: db.prepare('SELECT * FROM users WHERE lower(name) = lower(?) AND deleted_at IS NULL'),
  userByPhone: db.prepare('SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL'),
  userByUsername: db.prepare('SELECT * FROM users WHERE lower(username) = lower(?) AND deleted_at IS NULL'),
  countRole: db.prepare("SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL AND role = ?"),
  countPending: db.prepare("SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL AND role = 'Customer' AND status != 'Active'"),
  revenue: db.prepare("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status = 'Completed'"),
  countOrderStatus: db.prepare('SELECT COUNT(*) AS n FROM orders WHERE status = ?'),
  countRechargeStatus: db.prepare('SELECT COUNT(*) AS n FROM recharges WHERE status = ?'),
  ordersByMonth: db.prepare("SELECT substr(date, 1, 7) AS ym, COUNT(*) AS n FROM orders GROUP BY ym"),
  sellerOrders: db.prepare(
    "SELECT * FROM seller_orders WHERE seller_id = ? " +
    "ORDER BY CASE WHEN status = 'Pending' THEN 0 ELSE 1 END, datetime(created_at) DESC, id DESC"
  ),
  sellerOrdersByStatus: db.prepare(
    'SELECT * FROM seller_orders WHERE seller_id = ? AND lower(status) = lower(?) ORDER BY datetime(created_at) DESC, id DESC'
  ),
  sellerOrderById: db.prepare('SELECT * FROM seller_orders WHERE id = ? AND seller_id = ?'),
  sellerPending: db.prepare("SELECT * FROM seller_orders WHERE seller_id = ? AND status = 'Pending' ORDER BY id DESC"),
  sellerCount: db.prepare('SELECT COUNT(*) AS n FROM seller_orders WHERE seller_id = ? AND lower(status) = lower(?)'),
  sellerCommission: db.prepare(
    "SELECT COALESCE(SUM(commission), 0) AS total FROM seller_orders WHERE seller_id = ? AND status = 'Completed'"
  ),
  sellerCommissionOn: db.prepare(
    "SELECT COALESCE(SUM(commission), 0) AS total FROM seller_orders WHERE seller_id = ? AND status = 'Completed' AND substr(COALESCE(submitted_at, created_at), 1, 10) = ?"
  ),
  feed: db.prepare('SELECT * FROM withdraw_feed ORDER BY date DESC, id ASC'),
  userByInvite: db.prepare("SELECT * FROM users WHERE invite_code = ? AND deleted_at IS NULL"),
  withdrawsFor: db.prepare('SELECT * FROM withdraws WHERE lower(user) = lower(?) ORDER BY date DESC, id DESC'),
  rechargesFor: db.prepare('SELECT * FROM recharges WHERE lower(user) = lower(?) ORDER BY date DESC, id DESC'),
  heldFor: db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM withdraws WHERE lower(user) = lower(?) AND status = 'Pending'"),
  linkedFor: db.prepare('SELECT * FROM linked_accounts WHERE user_id = ? ORDER BY is_default DESC, id DESC'),
  vipLevels: db.prepare('SELECT * FROM vip_levels ORDER BY min_balance ASC'),
  sellerBlocking: db.prepare(
    "SELECT * FROM seller_orders WHERE seller_id = ? AND status IN ('Pending', 'Freezing') ORDER BY id DESC"
  ),
  sellerOrdersToday: db.prepare(
    'SELECT COUNT(*) AS n FROM seller_orders WHERE seller_id = ? AND substr(created_at, 1, 10) = ?'
  ),
  sellerFrozen: db.prepare("SELECT * FROM seller_orders WHERE seller_id = ? AND status = 'Freezing'"),
  sellerStalePending: db.prepare(
    "SELECT * FROM seller_orders WHERE seller_id = ? AND status = 'Pending' AND seeded = 0 " +
    'AND datetime(created_at) < datetime(?)'
  ),
  invitedBy: db.prepare("SELECT * FROM users WHERE deleted_at IS NULL AND lower(agent) = lower(?) ORDER BY joined DESC"),
  commissionFor: db.prepare(
    "SELECT COALESCE(SUM(commission), 0) AS total, COUNT(*) AS orders FROM seller_orders WHERE seller_id = ? AND status = 'Completed'"
  ),
  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  setSetting: db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
};

/** Lifetime revenue, kept as a running total in the settings table. */
function revenue() {
  const row = q.getSetting.get('total_revenue');
  return row ? Number(row.value) : 0;
}

/** Add a completed order's value to lifetime revenue. */
function addRevenue(amount) {
  q.setSetting.run('total_revenue', String(revenue() + Number(amount || 0)));
}

module.exports = { db, q, hashPassword, verifyPassword, revenue, addRevenue, inviteCode, DB_FILE, readSeed };
