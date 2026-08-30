# Club21 Mall — Admin Dashboard

Two apps on one backend:

- **Club21 Mall admin panel** — dashboard analytics, orders, withdraw / recharge
  requests, products and user management.
- **Club21 Mall seller app** — the phone-sized app sellers sign in to: grab
  order tasks, submit them for commission, invite a team, climb the VIP tiers,
  recharge and withdraw.

Two halves, no build step and no npm dependencies:

- **Frontend** — plain HTML, CSS and vanilla JavaScript. No framework, no CDN
  (the charts are hand-rolled SVG).
- **Backend** — Node's built-in `http` server on top of `node:sqlite`, serving a
  JSON API and the pages themselves.

Run `npm start` for the full application, or open `index.html` straight from
disk to browse the same panel against seed data held in the browser.

## Pages

| File | Screen |
| --- | --- |
| `index.html` | Dashboard — pending alerts, stat cards, orders overview + customer status charts |
| `orders.html` | Orders table |
| `withdraw-requests.html` | Withdraw requests |
| `recharge-requests.html` | Recharge requests |
| `products.html` | Products catalogue |
| `product-edit.html` | Add / edit a product, with image upload |
| `order-details.html` | One order: breakdown, ratings, customer and product |
| `withdraw-details.html` | Withdraw, transaction, notes, user and payment method |
| `recharge-details.html` | Recharge, user and payment method |
| `customer-edit.html` | Add / edit a customer |
| `customer-details.html` | Wallet, special order, credit score, bank, orders, transactions |
| `agent-edit.html` | Add / edit an agent |
| `agent-details.html` | Agent profile and referral list |
| `profile.html` | The administrator's own profile and security tab |
| `seller-orders.html` | Every order task sellers grabbed, with its status |
| `vip-levels.html` | VIP tiers — edit the rate, balance and daily cap |
| `agents.html` | Agents — referrals, created at, status |
| `sellers.html` | Sellers — VIP tier, balance, orders, team size |
| `customers.html` | Customers — owning agent, balance, status |
| `archived-users.html` | Soft-deleted accounts, with restore |
| `login.html` | Sign-in screen — the one door into both apps, by email or mobile |
| `register.html` | Sign-up screen — creates a seller, prefills the inviter from `?inviter=` |
| `404.html` | Not-found page |

### Seller app (`seller/`)

| File | Screen |
| --- | --- |
| `seller/welcome.html` | The shop window a visitor sees before signing in |
| `seller/login.html` | Sign in or register with a mobile number |
| `seller/mall.html` | MALL — online customer service hours |
| `seller/index.html` | Home — rolling banner, quick actions, a withdrawal ticker that keeps scrolling, partners |
| `seller/recharge.html` | Recharge amount, presets and payment method |
| `seller/start.html` | Balance / commission summary and *start grabbing orders* |
| `seller/orders.html` | Orders with ALL / PENDING / COMPLETED / FREEZING tabs |
| `seller/my.html` | Account header, wallet card and the eight account tiles |
| `seller/account.html` | Account details — the money ledger, rebates tagged |
| `seller/recharge-record.html` | Recharge record with its cumulative total |
| `seller/bank.html` | Bank card on file (the same form the wallet screen shows for a bank payout) |
| `seller/password.html` | Password hub — login or withdrawal password |
| `seller/funds.html` | Fund details — recharges, withdrawals and commissions |
| `seller/withdraw-records.html` | Withdrawal record with its cumulative total |
| `seller/wallet.html` | Wallet management — the payout method decides whether it asks for a crypto address or a bank card |
| `seller/usdt.html` | USDT network details and limits |
| `seller/password.html` | Change password |
| `seller/linked.html` | Linked Account — benefits, unlock conditions and the binding |
| `seller/language.html` | Select language — the list behind the header's EN chip |
| `seller/withdraw.html` | Withdrawal request |
| `seller/products.html` | The catalogue this seller grabs from |
| `seller/team.html` | Invite link, three team levels and their members |
| `seller/vip.html` | VIP tiers, what each unlocks and what is still needed |
| `seller/about.html` | About us |

## Features

- Collapsible sidebar with active-route highlight, pending-count badges and an
  expandable **Users** group; slides in as an off-canvas drawer on mobile.
- Top bar with the referral link + one-click copy, a live clock, a light/dark
  theme switch (remembered in `localStorage`) and a profile menu.
- Reusable datatable on every list screen: page-size selector, instant search,
  column sorting, pagination, "showing x to y of z entries", and export to
  CSV / Excel / clipboard / print.
- Row actions — view details, edit (inline modal form) and delete with a
  confirmation dialog. Completed records are view-only, matching the panel's
  behaviour.
- Add records straight from the Products and Users screens using the same
  modal form as edit.
- Every change (add / edit / delete / toggle / archive / restore) goes through
  the API into SQLite; with no server running it falls back to `localStorage`
  and *Settings → Reset demo data* restores the seed records.
- Deleting an agent or customer archives them; Archived Users can restore an
  account or delete it for good.
- Auth screens matching the panel: password show/hide, remember-me, and a
  register page that reads the inviter out of the referral link's query string.
- One front door: the panel's login takes an email or a mobile number and sends
  the account to its own side, sign-up there creates a seller, and a visitor who
  is already signed in is handed back rather than shown the form again.
- The seller home carries five promotion images that roll on their own every
  four seconds and wrap at the end (tap a dot to jump), plus a withdrawal
  ticker that scrolls without stopping — two copies of the list, so the loop
  has no seam. Both stand still when the tab is hidden or the reader asks for
  reduced motion.
- One look across both sides: the seller app is painted in the panel's palette
  and draws every symbol the panel already has from the same icon set, so the
  two apps read as one product.
- **The gap.** Whenever a seller's balance falls short — grabbing a task,
  submitting a frozen one, or trying to grab past it — the app answers with the
  same three numbers: what they hold, what the order needs, and the difference
  between them. It arrives as a dialog with a way straight to Recharge, and the
  wallet card carries the same figure until it is closed.
- Responsive down to phone widths: the sidebar becomes an off-canvas drawer,
  the datatable chrome stacks, tables scroll sideways with their action column
  pinned to the right edge, forms and dialogs go to one column, and icon-only
  buttons grow a 40px hit area on touch screens.
- Fully theme-aware in dark mode.

## Running it on localhost

You need **Node 22.5 or newer** — nothing else. There is no `npm install` step
because the project has no dependencies.

```bash
node --version     # must print v22.5.0 or higher
npm start          # then open http://localhost:3000
```

### Sign in

`http://localhost:3000` is the one door into both apps. Sign in there and the
account's role decides which side opens.

| Who | Credentials | Lands on |
| --- | --- | --- |
| Administrator | `admin@club21mall.com` / `password` | the panel |
| Seller | mobile `0000000080` / `password` | the seller app |

Signing up on that page creates a **seller**, which is why it asks for a mobile
number, and drops the new account straight into the seller app.

Each side keeps its own screen as well — `/seller/login.html` is the phone-shaped
one — and both accept either role, sending each account where it belongs. A
signed-in visitor who opens a login screen is handed back to their own side
rather than being asked to sign in twice.

### A five-minute tour

1. Sign in as the administrator. The dashboard shows the pending alerts, the
   four stat cards and both charts.
2. Open **Recharge Requests**, click ✏️ on a pending row and set it to
   *Completed* — that credits the seller's balance for real.
3. Open the seller app in a second tab (or a phone browser on the same
   network), sign in, and press **start grabbing orders** on the Start tab.
4. Submit the order from the **Order** tab; the commission lands in the
   balance, and the same task appears under **Seller Tasks** in the panel.
5. Grab a few more. Every fifth one is a premium task that freezes until the
   balance covers it — recharge, approve it in the panel, and it thaws.

### Seeing it on a phone

Both sides are responsive. The quickest check is the browser's device toolbar
(F12, then the phone icon) at 390px — the panel's sidebar becomes a drawer
behind the burger, the tables scroll sideways inside their card, and the forms
drop to one column. The seller app is phone-shaped at every width: it stays a
500px column centred on the page.

To use a real phone, find your machine's LAN address and open it from the phone
on the same Wi-Fi:

```bash
hostname -I                       # e.g. 192.168.1.20
# then browse to http://192.168.1.20:3000/seller/
```

### The database

The SQLite file is created at `server/data/club21.db` on first start and seeded
from `assets/js/data.js`.

```bash
npm run reset      # delete the database; the next start re-seeds it
PORT=4000 npm start        # serve on another port
CLUB21_DB=/tmp/x.db npm start   # keep the database somewhere else
```

Each account only reaches its own side: a seller opening the admin panel is sent
back to the seller app, and the admin API answers a seller with 403.

Without the server the admin pages still open from disk against the seed data,
keeping changes in `localStorage`. The seller app moves real balances, so it
needs the server running.

## API

Every endpoint below needs a session cookie from `POST /api/auth/login`, and
all except the auth routes require the signed-in user to be an administrator.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | sign in, sets the session cookie |
| POST | `/api/auth/register` | create a customer; credits the inviter's referrals |
| POST | `/api/auth/logout` | drop the session |
| GET | `/api/auth/me` | current user, or `null` |
| GET | `/api/stats` | dashboard counters and the six-month order chart |
| GET/POST | `/api/orders` `/api/withdraws` `/api/recharges` `/api/products` | list / create |
| PUT/DELETE | `/api/<collection>/:id` | update / delete |
| POST | `/api/products/:id/toggle` | flip Active / Inactive |
| GET | `/api/users?role=Agent\|Customer` | list agents or customers |
| POST/PUT/DELETE | `/api/users` `/api/users/:id` | create, update, archive (soft delete) |
| POST | `/api/users/:id/toggle` | flip Active / Inactive |
| GET/PUT | `/api/profile` | the signed-in administrator's profile |
| POST | `/api/profile/password` | change the administrator's password |
| POST | `/api/uploads` | store an image (2MB) and return its URL |
| GET | `/api/users/:id` | one account with its orders, transactions and referrals |
| GET | `/api/seller-orders` | every seller's order tasks |
| PUT/DELETE | `/api/seller-orders/:id` | change a task's status, or remove it |
| GET | `/api/vip-levels` | the tier ladder with seller counts |
| PUT | `/api/vip-levels/:id` | edit a tier |
| GET | `/api/archived-users` | soft-deleted accounts |
| POST | `/api/archived-users/:id/restore` | put an account back |
| DELETE | `/api/archived-users/:id` | delete permanently |

Seller routes need a signed-in **seller**; every one is scoped to that seller, so
no seller can read another's orders.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/seller/summary` | balance, today's and total commission, order counts |
| GET | `/api/seller/profile` | the *My* screen |
| GET | `/api/seller/home` | withdrawal ticker and partner list |
| GET | `/api/seller/products` | the catalogue this seller grabs from |
| GET | `/api/seller/orders?status=all\|pending\|completed\|freezing` | own orders |
| POST | `/api/seller/grab` | match a new order task (409 while one is pending) |
| POST | `/api/seller/orders/:id/submit` | complete it and credit the commission |
| POST | `/api/seller/recharge` | raise a recharge request for the admin queue |
| POST | `/api/seller/withdraw` | request a payout; the amount is held |
| GET | `/api/seller/vip` | the tier ladder and where this seller stands |
| GET | `/api/seller/team` | invite link, level totals and member list |
| GET | `/api/seller/funds` | the ledger behind Fund details |
| GET | `/api/seller/withdrawals` | this seller's withdrawal records |
| GET/PUT | `/api/seller/wallet` | payout method, crypto address and the bank card behind it |
| GET/POST/DELETE | `/api/seller/linked` | the linked account: state, binding and unbinding |
| POST | `/api/seller/password` | change the login or withdrawal password |
| GET | `/api/seller/ledger` | every movement behind Account Details |
| GET | `/api/seller/records/recharge\|withdraw` | records with their cumulative totals |
| GET/PUT | `/api/seller/bank` | the bank card, saved with the login password |
| GET | `/api/landing` | the public shop window (no session needed) |

**VIP levels.** A seller's balance decides their tier, and the tier decides both
the commission rate and how many orders they may grab in a day:

| Level | Balance from | Commission | Orders / day |
| --- | --- | --- | --- |
| VIP1 | 50 | 20% | 10 |
| VIP2 | 500 | 25% | 20 |
| VIP3 | 1,500 | 30% | 30 |
| VIP4 | 3,000 | 34% | 40 |
| VIP5 | 10,000 | 40% | 60 |

**Team commission.** Every account carries a six-letter invite code, and the
seller's link (`register?inviter=CODE`) puts whoever signs up into their team,
three levels deep, paying the inviter 8% / 3% / 1% of what those members earn.
Registration accepts either the code or the inviter's username.

**Order freezing.** Every fifth order is a premium task worth more than the
balance, so it is created *frozen*; a pending order left for 24 hours freezes
too. A frozen order cannot be submitted and blocks new grabs until the balance
covers it — recharge, and it thaws by itself on the next request. Withdrawals
are refused while an order is open.

Administrators close the loop: approving a recharge credits the seller's
balance, rejecting a withdrawal returns the amount that was held, and marking a
seller task Completed from the panel pays that seller their commission. Editing
a tier on **VIP Levels** changes what every seller on it earns.

Passwords are stored as scrypt hashes with a per-user salt; sessions live in the
`sessions` table and the cookie is `HttpOnly`. Completing an order adds its value
to the running revenue figure the dashboard shows.

## Project layout

```
assets/
  css/style.css     design system: layout, cards, tables, badges, dark theme
  js/icons.js       inline SVG icon set
  js/data.js        all demo data (swap this out for a real API)
  js/layout.js      sidebar / navbar / footer shell, theme, clock, helpers
  js/table.js       datatable: search, sort, paging, export, row actions
  js/charts.js      SVG area + donut charts
  js/app.js         per-page controllers
  js/auth.js        login / register screens
  js/store.js       API client with an offline fallback
  js/seller.js      the seller app: shell, screens and its API calls
  css/seller.css    seller app styles (mobile, same palette as the panel)
  img/favicon.svg   brand mark
  img/ads/          the promotion images the seller home rolls through
seller/             the seller app's 25 pages, one file per screen
server/
  index.js          http server: JSON API + static files
  db.js             SQLite schema, seeding, password hashing
  reset.js          drops the database so it re-seeds
  data/             the SQLite file and uploaded images (created at runtime)
*.html              the panel's 23 pages, one file per screen
```

Every page is a thin shell: it names itself with `data-page` and loads the
shared scripts. `app.js` (panel) and `seller.js` (seller app) look that name up
and render the screen, so a new screen means one small HTML file plus one entry
in the matching map.

`assets/js/data.js` is the single seed for both apps: the browser reads it when
there is no server, and `server/db.js` replays the same file into SQLite on first
start. The admin panel still works from disk against that seed; the seller app is
transactional (balances, grabbing, submitting) and needs the server running.
