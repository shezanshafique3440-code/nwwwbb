/* =========================================================
   Page controllers — each page mounts its own content into
   #page based on the data-page attribute of .layout
   ========================================================= */
(function () {
  const icon = window.ICONS;
  const DB = window.DB;
  const U = window.U;
  const Store = window.Store;

  /* ---------------------------------------------------------
     Shared form modal
     fields: [{ name, label, type, step, options }]
     --------------------------------------------------------- */
  function formModal(title, fields, values, saveLabel, onSave) {
    const body = fields
      .map(function (f) {
        const v = values[f.name] == null ? '' : values[f.name];
        let input;
        if (f.type === 'select') {
          input =
            '<select class="form-select" data-f="' + f.name + '">' +
            f.options
              .map(function (o) { return '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + o + '</option>'; })
              .join('') +
            '</select>';
        } else {
          input =
            '<input class="form-input" data-f="' + f.name + '" type="' + (f.type || 'text') + '"' +
            (f.step ? ' step="' + f.step + '"' : '') +
            (f.placeholder ? ' placeholder="' + f.placeholder + '"' : '') +
            ' value="' + U.esc(v) + '">';
        }
        return '<div class="field"><label>' + f.label + '</label>' + input + '</div>';
      })
      .join('');

    const m = U.modal(
      title,
      body,
      '<button class="btn btn-secondary" data-close>Cancel</button>' +
        '<button class="btn btn-primary" data-save>' + saveLabel + '</button>'
    );

    m.querySelector('[data-save]').addEventListener('click', function () {
      const out = {};
      let invalid = null;
      fields.forEach(function (f) {
        const el = m.querySelector('[data-f="' + f.name + '"]');
        let val = el.value;
        if (f.type === 'number') val = Number(val || 0);
        if (f.required && String(val).trim() === '') invalid = invalid || el;
        out[f.name] = val;
      });
      if (invalid) {
        invalid.focus();
        invalid.style.borderColor = 'var(--danger)';
        return U.toast('Please fill in the required fields');
      }
      m.close();
      onSave(out);
    });
    return m;
  }

  const today = function () { return new Date().toISOString().slice(0, 10); };

  /* ---------------------------------------------------------
     Dashboard
     --------------------------------------------------------- */
  const PAGES = {};

  PAGES.dashboard = function (host) {
    const s = DB.stats;

    const alerts =
      (DB.pendingOrders
        ? '<div class="alert alert-info">' + icon('cart', 22) +
          '<span class="alert-text">' + DB.pendingOrders + ' order(s) pending.</span>' +
          '<a class="alert-link" href="orders.html">View &rarr;</a></div>'
        : '') +
      (DB.pendingRecharges
        ? '<div class="alert alert-primary">' + icon('recharge', 22) +
          '<span class="alert-text">' + DB.pendingRecharges + ' recharge request(s) pending.</span>' +
          '<a class="alert-link" href="recharge-requests.html">View &rarr;</a></div>'
        : '');

    function stat(cls, label, value, ic) {
      return (
        '<div class="stat-card ' + cls + '">' +
        '<div><div class="stat-label">' + label + '</div><div class="stat-value">' + value + '</div></div>' +
        '<span class="stat-icon">' + icon(ic, 46) + '</span></div>'
      );
    }

    host.innerHTML =
      '<div class="mb-24">' + alerts + '</div>' +
      '<div class="row cols-4 mb-24">' +
      stat('stat-purple', 'Total Agents', s.totalAgents, 'users') +
      stat('stat-green', 'Total Customers', s.totalCustomers, 'user') +
      stat('stat-orange', 'Pending Customers', s.pendingCustomers, 'userAlert') +
      stat('stat-gray', 'Total Revenue', U.money(s.totalRevenue), 'dollar') +
      '</div>' +
      '<div class="row cols-2-1">' +
      '<div class="card"><div class="card-head"><h5 class="card-title">Orders Overview</h5></div>' +
      '<div class="card-body"><div class="chart-box" id="ordersChart"></div></div></div>' +
      '<div class="card"><div class="card-head"><h5 class="card-title">Customer Status</h5></div>' +
      '<div class="card-body">' +
      '<div class="chart-legend">' +
      '<span class="lg"><i style="background:#28c76f"></i>Approved</span>' +
      '<span class="lg"><i style="background:#ff9f43"></i>Pending</span>' +
      '</div><div class="donut-wrap"><div class="chart-box" id="statusChart"></div></div>' +
      '</div></div></div>';

    window.Charts.area(document.getElementById('ordersChart'), {
      labels: DB.ordersOverview.labels,
      values: DB.ordersOverview.values
    });

    window.Charts.donut(document.getElementById('statusChart'), [
      { label: 'Approved', value: s.totalCustomers, color: '#28c76f' },
      { label: 'Pending', value: s.pendingCustomers, color: '#ff9f43' }
    ]);
  };

  /* ---------------------------------------------------------
     Orders
     --------------------------------------------------------- */
  const ORDER_FIELDS = [
    { name: 'user', label: 'Order by', required: false, placeholder: 'Leave empty for N/A' },
    { name: 'product', label: 'Product', required: true },
    { name: 'total', label: 'Total ($)', type: 'number', step: '0.01' },
    { name: 'commission', label: 'Commission ($)', type: 'number', step: '0.01' },
    { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed', 'Cancelled'] }
  ];

  PAGES.orders = function (host) {
    window.DataTable(host, {
      rows: DB.orders,
      exportName: 'orders',
      recordLabel: function (r) { return 'Order #' + r.id; },
      actions: function (r) { return r.status === 'Pending' ? ['delete', 'edit'] : ['delete', 'view']; },
      onDelete: function (r) { Store.remove('orders', r.id); },
      onChange: function (rows) { DB.orders = rows; },
      columns: [
        { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
        {
          label: 'Order By',
          key: 'user',
          text: function (r) { return r.user || 'N/A'; },
          render: function (r) { return U.userCell(r.user); }
        },
        { label: 'Product', key: 'product', render: function (r) { return '<span class="td-strong">' + U.esc(r.product) + '</span>'; } },
        { label: 'Total', key: 'total', sortValue: function (r) { return r.total; }, text: function (r) { return U.money(r.total); }, render: function (r) { return U.money(r.total); } },
        { label: 'Commission', key: 'commission', sortValue: function (r) { return r.commission; }, text: function (r) { return U.money(r.commission); }, render: function (r) { return U.money(r.commission); } },
        { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } },
        { label: 'Created At', key: 'date', className: 'nowrap', sortValue: function (r) { return r.date; }, text: function (r) { return U.date(r.date); }, render: function (r) { return U.date(r.date); } }
      ],
      onView: function (r) {
        window.location.href = 'order-details.html?id=' + r.id;
      },
      onEdit: function (r, refresh) {
        formModal('Edit order #' + r.id, ORDER_FIELDS, r, 'Save changes', function (vals) {
          vals.user = vals.user.trim() || null;
          Object.assign(r, vals);
          Store.update('orders', r);
          refresh();
          U.toast('Order updated');
        });
      }
    });
  };

  /* ---------------------------------------------------------
     Withdraw requests
     --------------------------------------------------------- */
  PAGES.withdraws = function (host) {
    window.DataTable(host, {
      rows: DB.withdraws,
      exportName: 'withdraw-requests',
      recordLabel: function (r) { return 'Withdraw #' + r.id; },
      actions: ['delete', 'view'],
      onDelete: function (r) { Store.remove('withdraws', r.id); },
      onChange: function (rows) { DB.withdraws = rows; },
      columns: [
        { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
        {
          label: 'Request By',
          key: 'user',
          text: function (r) { return r.user + (r.email ? ' ' + r.email : ''); },
          render: function (r) { return U.userCell(r.user, r.email); }
        },
        { label: 'Amount', key: 'amount', sortValue: function (r) { return r.amount; }, text: function (r) { return U.money(r.amount); }, render: function (r) { return '<span class="td-strong">' + U.money(r.amount) + '</span>'; } },
        { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } },
        { label: 'Created At', key: 'date', className: 'nowrap', sortValue: function (r) { return r.date; }, text: function (r) { return U.date(r.date); }, render: function (r) { return U.date(r.date); } }
      ],
      onView: function (r) { window.location.href = 'withdraw-details.html?id=' + r.id; }
    });
  };

  /* ---------------------------------------------------------
     Recharge requests
     --------------------------------------------------------- */
  PAGES.recharges = function (host) {
    window.DataTable(host, {
      rows: DB.recharges,
      exportName: 'recharge-requests',
      recordLabel: function (r) { return 'Recharge #' + r.id; },
      actions: function (r) { return r.status === 'Pending' ? ['delete', 'edit', 'view'] : ['delete', 'view']; },
      onDelete: function (r) { Store.remove('recharges', r.id); },
      onChange: function (rows) { DB.recharges = rows; },
      columns: [
        { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
        {
          label: 'Request By',
          key: 'user',
          text: function (r) { return r.user + (r.email ? ' ' + r.email : ''); },
          render: function (r) { return U.userCell(r.user, r.email); }
        },
        { label: 'Amount', key: 'amount', sortValue: function (r) { return r.amount; }, text: function (r) { return U.money(r.amount); }, render: function (r) { return '<span class="td-strong">' + U.money(r.amount) + '</span>'; } },
        { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } },
        { label: 'Created At', key: 'date', className: 'nowrap', sortValue: function (r) { return r.date; }, text: function (r) { return U.date(r.date); }, render: function (r) { return U.date(r.date); } }
      ],
      onView: function (r) { window.location.href = 'recharge-details.html?id=' + r.id; },
      onEdit: function (r, refresh) {
        editRechargeStatus(r, refresh);
      }
    });
  };

  /* ---------------------------------------------------------
     Products
     --------------------------------------------------------- */
  PAGES.products = function (host) {
    const table = window.DataTable(host, {
      rows: DB.products.slice(),
      exportName: 'products',
      recordLabel: function (r) { return r.name; },
      actions: ['delete', 'edit', 'toggle', 'view'],
      topBar: '<a class="btn btn-primary" href="product-edit.html">' + icon('plus', 18) + 'Add New Product</a>',
      onDelete: function (r) { Store.remove('products', r.id); },
      onChange: function (rows) { DB.products = rows; },
      onToggle: function (r) { Store.toggle('products', r.id); },
      columns: [
        { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
        { label: 'Name', key: 'name', render: function (r) { return '<span class="td-strong">' + U.esc(r.name) + '</span>'; } },
        {
          label: 'Image',
          key: 'image',
          sortable: false,
          text: function () { return ''; },
          render: function (r) {
            return r.imageUrl
              ? '<img class="thumb-img" src="' + U.esc(r.imageUrl) + '" alt="">'
              : '<span class="product-thumb">' + (r.image || '\u{1F4E6}') + '</span>';
          }
        },
        { label: 'SKU', key: 'sku', className: 'nowrap' },
        { label: 'Price', key: 'price', sortValue: function (r) { return r.price; }, text: function (r) { return U.money(r.price); }, render: function (r) { return U.money(r.price); } },
        { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } }
      ],
      onView: function (r) {
        U.modal(
          U.esc(r.name),
          (r.imageUrl ? '<img src="' + U.esc(r.imageUrl) + '" alt="" style="width:100%;border-radius:6px;margin-bottom:14px">' : '') +
          U.detailRows([
            ['SKU', U.esc(r.sku)],
            ['Slug', U.esc(r.slug)],
            ['Category', U.esc(r.category)],
            ['Price', U.money(r.price)],
            ['Commission rate', r.rate + '%'],
            ['Rating', r.rating + '/5 from ' + r.reviews + ' reviews'],
            ['Popular', r.popular ? 'Yes' : 'No'],
            ['Status', U.badge(r.status)],
            ['Description', U.esc(r.description || '—')]
          ])
        );
      },
      onEdit: function (r) {
        window.location.href = 'product-edit.html?id=' + r.id;
      }
    });

  };

  /* ---------------------------------------------------------
     Users — agents, customers and the archive share helpers
     --------------------------------------------------------- */
  function archive(user) {
    /* the backend soft-deletes and keeps the row id, so mirror that locally */
    const entry = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role === 'Agent' ? 'Agent' : 'User',
      deletedAt: today(),
      status: 'Active'
    };
    DB.archived.unshift(entry);
    DB.users = DB.users.filter(function (u) { return u !== user; });
    Store.remove('users', user.id).then(function (res) {
      if (res && res.archived) Object.assign(entry, res.archived);
    });
  }

  PAGES['users-agents'] = function (host) {
    const rows = DB.users.filter(function (u) { return u.role === 'Agent'; });

    const table = window.DataTable(host, {
      rows: rows,
      exportName: 'agents',
      recordLabel: function (r) { return r.name; },
      actions: ['delete', 'edit', 'toggle', 'view'],
      topBar: '<a class="btn btn-primary" href="agent-edit.html">' + icon('plus', 18) + 'Add New Agent</a>',
      deleteToast: 'Agent moved to archived users',
      onDelete: archive,
      onToggle: function (r) { Store.toggle('users', r.id); },
      columns: [
        { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
        {
          label: 'Agent',
          key: 'name',
          text: function (r) { return r.name + ' ' + r.email; },
          render: function (r) { return U.userCell(r.name, r.email); }
        },
        { label: 'Referrals', key: 'referrals', sortValue: function (r) { return r.referrals; }, render: function (r) { return r.referrals; } },
        { label: 'Created At', key: 'joined', className: 'nowrap', sortValue: function (r) { return r.joined; }, text: function (r) { return U.date(r.joined); }, render: function (r) { return U.date(r.joined); } },
        { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } }
      ],
      onView: function (r) { window.location.href = 'agent-details.html?id=' + r.id; },
      onEdit: function (r) { window.location.href = 'agent-edit.html?id=' + r.id; }
    });

  };

  PAGES['users-customers'] = function (host) {
    const rows = DB.users.filter(function (u) { return u.role === 'Customer'; });
    const agentNames = DB.users
      .filter(function (u) { return u.role === 'Agent'; })
      .map(function (u) { return u.name; });

    const table = window.DataTable(host, {
      rows: rows,
      exportName: 'customers',
      recordLabel: function (r) { return r.name; },
      actions: ['delete', 'edit', 'toggle', 'view'],
      topBar: '<a class="btn btn-primary" href="customer-edit.html">' + icon('plus', 18) + 'Add New Customer</a>',
      deleteToast: 'Customer moved to archived users',
      onDelete: archive,
      onToggle: function (r) { Store.toggle('users', r.id); },
      columns: [
        { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
        {
          label: 'Customer',
          key: 'name',
          /* a customer signs up with a phone and no email, so the number they
             joined with is what the search has to find them by */
          text: function (r) { return r.name + ' ' + (r.email || '') + ' ' + (r.phone || ''); },
          render: function (r) { return U.userCell(r.name, r.phone || r.email); }
        },
        {
          label: 'Agent',
          key: 'agent',
          text: function (r) { return r.agent + ' ' + (r.agentEmail || ''); },
          render: function (r) { return U.userCell(r.agent, r.agentEmail); }
        },
        { label: 'Balance', key: 'balance', sortValue: function (r) { return r.balance; }, text: function (r) { return U.money(r.balance); }, render: function (r) { return U.money(r.balance); } },
        { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } }
      ],
      onView: function (r) { window.location.href = 'customer-details.html?id=' + r.id; },
      onEdit: function (r) { window.location.href = 'customer-edit.html?id=' + r.id; }
    });

  };

  PAGES['users-archived'] = function (host) {
    window.DataTable(host, {
      rows: DB.archived,
      exportName: 'archived-users',
      recordLabel: function (r) { return r.name; },
      actions: ['delete', 'restore'],
      deleteToast: 'User permanently deleted',
      onDelete: function (r) { Store.remove('archived', r.id); },
      onChange: function (rows) { DB.archived = rows; },
      columns: [
        { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
        { label: 'Name', key: 'name', render: function (r) { return '<span class="td-strong">' + U.esc(r.name) + '</span>'; } },
        { label: 'Email', key: 'email', render: function (r) { return r.email ? U.esc(r.email) : ''; } },
        { label: 'Role', key: 'role' },
        { label: 'Deletion Date', key: 'deletedAt', className: 'nowrap' },
        { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } }
      ],
      onRestore: function (r, done) {
        Store.restore(r.id);
        DB.users.unshift({
          id: DB.nextId('users'),
          name: r.name,
          email: r.email,
          role: r.role === 'Agent' ? 'Agent' : 'Customer',
          agent: 'Admin',
          agentEmail: 'admin@gmail.com',
          referrals: 0,
          balance: 0,
          status: 'Active',
          joined: today()
        });
        DB.archived = DB.archived.filter(function (a) { return a !== r; });
        done();
        U.toast(r.name + ' restored');
      }
    });
  };

  /* ---------------------------------------------------------
     Order details
     --------------------------------------------------------- */
  function stars(n) {
    return '<span class="stars">' + '\u2B50'.repeat(Math.max(0, Math.min(5, n))) + '</span> ' + n + '/5';
  }

  function crumbs(parts) {
    const host = document.getElementById('breadcrumb');
    if (!host) return;
    host.innerHTML = parts
      .map(function (p, i) {
        const node = p[1] ? '<a href="' + p[1] + '">' + p[0] + '</a>' : '<span>' + p[0] + '</span>';
        return (i ? '<span class="sep">' + icon('chevronRight', 16) + '</span>' : '') + node;
      })
      .join('');
  }

  PAGES['order-details'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    crumbs([['Dashboard', 'index.html'], ['Orders', 'orders.html'], ['Details', null]]);

    withServer(host, '/api/orders/' + id, function (o) {
      host.innerHTML =
        '<div class="row cols-2-1"><div>' +

        '<div class="detail-card">' +
        '<h3>' + icon('fileText', 20) + 'Order Information</h3>' +
        '<div class="pair-grid">' +
        '<div><div class="k">Order No:</div><div class="v">' + U.esc(o.code) + '</div></div>' +
        '<div><div class="k">Status:</div><div class="v">' + U.badge(o.status) + '</div></div>' +
        '<div><div class="k">Quantity:</div><div class="v">' + o.qty + '</div></div>' +
        '<div><div class="k">Order Date:</div><div class="v">' + U.date(o.date) + (o.time ? ', ' + U.esc(o.time) : '') + '</div></div>' +
        '</div>' +
        '<hr class="detail-sep">' +
        '<p class="detail-sub">Payment Breakdown</p>' +
        '<div class="pair-grid">' +
        '<div class="row-line between"><span class="v">Subtotal:</span><span class="v">' + U.money(o.price * o.qty) + '</span></div>' +
        '<div class="row-line between"><span class="v">Shipping:</span><span class="v">' + U.money(o.shipping) + '</span></div>' +
        '<div class="row-line between"><span class="v">Discount:</span><span class="v money-danger">-' + U.money(o.discount) + '</span></div>' +
        '<div class="row-line between"><span class="v">Commission:</span><span class="v money-teal">' + U.money(o.commission) + '</span></div>' +
        '</div>' +
        '<hr class="detail-sep">' +
        '<div class="total-line"><span>Total:</span><span class="amount">' + U.money(o.total) + '</span></div>' +
        '</div>' +

        '<div class="detail-card">' +
        '<h3>' + icon('star', 20) + 'Ratings</h3>' +
        '<div class="pair-grid">' +
        '<div class="row-line"><span class="k">Description:</span><span class="v">' + stars(o.ratings.description) + '</span></div>' +
        '<div class="row-line"><span class="k">Logistics:</span><span class="v">' + stars(o.ratings.logistics) + '</span></div>' +
        '<div class="row-line"><span class="k">Service:</span><span class="v">' + stars(o.ratings.service) + '</span></div>' +
        '</div></div>' +

        '<div class="detail-card">' +
        '<h3>' + icon('user', 20) + 'Customer Info</h3>' +
        (o.user
          ? '<div class="person-block"><div class="avatar-big">' + icon('user', 22) + '</div>' +
            '<div class="name">' + U.esc(o.user) + '</div>' +
            '<div class="sub">' + U.esc(o.customerCode || '') + '</div></div>'
          : '<div class="mini-empty">No customer on this order</div>') +
        '</div>' +

        '<div class="detail-card">' +
        '<h3>' + icon('products', 20) + 'Product Info</h3>' +
        '<div class="product-block">' +
        '<div class="shot">' + (o.image || '\u{1F4E6}') + '</div>' +
        '<div class="name">' + U.esc(o.product) + '</div>' +
        '<div class="sub">SKU: ' + U.esc(o.sku || '—') + '</div>' +
        '<div class="price">' + U.money(o.price) + '</div>' +
        '</div></div>' +

        '</div><div>' +
        '<div class="detail-card"><h3>' + icon('settings', 20) + 'Actions</h3>' +
        '<div class="form-actions" style="flex-direction:column;align-items:stretch;gap:10px">' +
        (o.status === 'Pending'
          ? '<button class="btn btn-primary" data-complete>Mark as completed</button>'
          : '') +
        '<a class="btn btn-secondary" href="orders.html">Back to orders</a>' +
        '</div></div></div></div>';

      const done = host.querySelector('[data-complete]');
      if (done) {
        done.addEventListener('click', function () {
          done.disabled = true;
          Store.request('PUT', '/api/orders/' + id, { status: 'Completed' }).then(function () {
            U.toast('Order completed');
            window.location.reload();
          });
        });
      }
    });
  };

  /* ---------------------------------------------------------
     Add / edit a product — a page of its own, like the panel
     --------------------------------------------------------- */
  const CATEGORIES = [
    'Electronics', 'Fashion', 'Home', 'Kitchen', 'Bags', 'Beauty', 'Health',
    'Fitness', 'Sports', 'Toys', 'Pets', 'Tools', 'Watches', 'Safety', 'Furniture'
  ];

  function slugify(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  PAGES['product-edit'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    const editing = !!id;

    const draw = function (p) {
      document.getElementById('breadcrumb').innerHTML =
        '<a href="index.html">Dashboard</a><span class="sep">' + icon('chevronRight', 16) + '</span>' +
        '<a href="products.html">Products</a><span class="sep">' + icon('chevronRight', 16) + '</span>' +
        '<span>' + (editing ? 'Edit' : 'Add') + '</span>';

      host.innerHTML =
        '<div class="form-card">' +
        '<h2>' + (editing ? 'Edit Product' : 'Add New Product') + '</h2>' +
        '<div class="form-grid">' +
        field('Name', 'name', p.name, true) +
        field('Slug', 'slug', p.slug, true) +
        field('Category', 'category', p.category, true, 'select', CATEGORIES) +
        field('SKU', 'sku', p.sku, true) +
        '<div class="field full"><label>Description<span class="req">*</span></label>' +
        '<textarea class="form-input" data-f="description">' + U.esc(p.description) + '</textarea></div>' +

        '<div class="field"><label>Main Image</label>' +
        '<div class="file-row"><input type="file" accept="image/png,image/jpeg,image/webp" data-file></div>' +
        '<div class="img-preview" data-preview>' +
        (p.imageUrl ? '<img src="' + U.esc(p.imageUrl) + '" alt="">' : p.image || '\u{1F4E6}') +
        '</div></div>' +

        field('Price', 'price', p.price, true, 'number') +
        field('Reviews Count', 'reviews', p.reviews, true, 'number') +
        field('Rating (between 1 to 5)', 'rating', p.rating, true, 'number') +
        field('Commission (%)', 'rate', p.rate, false, 'number') +
        field('Status', 'status', p.status, false, 'select', ['Active', 'Inactive']) +
        '</div>' +

        '<div class="check-row"><input type="checkbox" id="popular"' + (p.popular ? ' checked' : '') + '>' +
        '<label for="popular">Popular Product?</label></div>' +

        '<div class="form-actions">' +
        '<button class="btn btn-primary" data-save>' + (editing ? 'Edit Product' : 'Add Product') + '</button>' +
        '<a class="btn btn-secondary" href="products.html">Cancel</a>' +
        '</div></div>';

      /* the slug follows the name until it is edited by hand */
      const nameInput = host.querySelector('[data-f="name"]');
      const slugInput = host.querySelector('[data-f="slug"]');
      let slugTouched = editing;
      slugInput.addEventListener('input', function () { slugTouched = true; });
      nameInput.addEventListener('input', function () {
        if (!slugTouched) slugInput.value = slugify(nameInput.value);
      });

      let uploaded = p.imageUrl;
      host.querySelector('[data-file]').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return U.toast('Maximum size is 2.00MB');
        const reader = new FileReader();
        reader.onload = function () {
          Store.request('POST', '/api/uploads', { data: reader.result })
            .then(function (r) {
              uploaded = r.url;
              host.querySelector('[data-preview]').innerHTML = '<img src="' + r.url + '" alt="">';
              U.toast('Image uploaded');
            })
            .catch(function (err) { U.toast(err.message); });
        };
        reader.readAsDataURL(file);
      });

      host.querySelector('[data-save]').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        const vals = {
          name: nameInput.value.trim(),
          slug: slugInput.value.trim() || slugify(nameInput.value),
          category: host.querySelector('[data-f="category"]').value,
          sku: host.querySelector('[data-f="sku"]').value.trim(),
          description: host.querySelector('[data-f="description"]').value.trim(),
          price: Number(host.querySelector('[data-f="price"]').value || 0),
          reviews: Number(host.querySelector('[data-f="reviews"]').value || 0),
          rating: Number(host.querySelector('[data-f="rating"]').value || 5),
          rate: Number(host.querySelector('[data-f="rate"]').value || 0),
          status: host.querySelector('[data-f="status"]').value,
          popular: host.querySelector('#popular').checked,
          imageUrl: uploaded,
          image: p.image || '\u{1F4E6}'
        };

        if (!vals.name || !vals.sku || !vals.description) return U.toast('Name, SKU and description are required');
        if (vals.rating < 1 || vals.rating > 5) return U.toast('Rating must be between 1 and 5');

        btn.disabled = true;
        const done = function () { window.location.href = 'products.html'; };
        const fail = function (err) { U.toast(err.message || 'Could not save'); btn.disabled = false; };

        if (editing) Store.request('PUT', '/api/products/' + id, vals).then(done, fail);
        else Store.request('POST', '/api/products', vals).then(done, fail);
      });
    };

    if (!Store.online) {
      host.innerHTML =
        '<div class="form-card"><p style="margin:0">Editing products needs the server. Start it with ' +
        '<b>npm start</b> and open the panel from that address.</p></div>';
      return;
    }

    if (editing) Store.request('GET', '/api/products/' + id).then(draw, function (err) { host.innerHTML = loadFailed(err); });
    else {
      draw({
        name: '', slug: '', sku: '', category: 'Electronics', description: '',
        price: 0, reviews: 0, rating: 5, rate: 2, status: 'Active', popular: false,
        image: '\u{1F4E6}', imageUrl: ''
      });
    }
  };

  function field(label, name, value, required, type, options) {
    const input =
      type === 'select'
        ? '<select class="form-select" data-f="' + name + '">' +
          options.map(function (o) {
            return '<option' + (String(o) === String(value) ? ' selected' : '') + '>' + o + '</option>';
          }).join('') +
          '</select>'
        : '<input class="form-input" data-f="' + name + '" type="' + (type || 'text') + '"' +
          (type === 'number' ? ' step="0.01"' : '') + ' value="' + U.esc(value) + '">';

    return (
      '<div class="field"><label>' + label + (required ? '<span class="req">*</span>' : '') + '</label>' +
      input + '</div>'
    );
  }

  /* ---------------------------------------------------------
     The administrator's own profile
     --------------------------------------------------------- */
  const COUNTRIES = ['', 'Pakistan', 'India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Malaysia'];
  const LANGUAGES = ['', 'English', 'Urdu', 'Hindi', 'Arabic', 'Chinese'];
  const GENDERS = ['', 'Male', 'Female', 'Other'];
  const MARITAL = ['', 'Single', 'Married'];
  const SOCIALS = [
    ['facebook', 'https://facebook.com/'],
    ['linkedin', 'https://linkedin.com/'],
    ['skype', 'https://skype.com/'],
    ['instagram', 'https://instagram.com/'],
    ['github', 'https://github.com/']
  ];

  PAGES.profile = function (host) {
    const tab = (new URL(window.location.href).searchParams.get('tab') || 'profile').toLowerCase();
    crumbs([['Dashboard', 'index.html'], ['Profile', null]]);

    withServer(host, '/api/profile', function (me) {
      const shot = me.avatar
        ? '<img src="' + U.esc(me.avatar) + '" alt="">'
        : icon('user', 42);

      const cover =
        '<div class="profile-cover"><div class="banner"></div>' +
        '<div class="who"><div class="shot">' + shot + '</div>' +
        '<div class="meta"><h2>' + U.esc(me.name) + '</h2>' +
        '<div class="joined">' + icon('records', 16) + 'Joined ' +
        new Date(me.joined).toLocaleString('en-US', { month: 'long', year: 'numeric' }) + '</div>' +
        '</div></div></div>' +
        '<div class="tab-row">' +
        '<a class="' + (tab === 'profile' ? 'active' : '') + '" href="profile.html">' + icon('user', 18) + 'Profile</a>' +
        '<a class="' + (tab === 'security' ? 'active' : '') + '" href="profile.html?tab=security">' + icon('lock', 18) + 'Security</a>' +
        '</div>';

      if (tab === 'security') {
        host.innerHTML =
          cover +
          '<div class="form-card" style="max-width:560px">' +
          '<h2>Change Password</h2>' +
          '<div class="field"><label>Current password</label><input class="form-input" type="password" data-f="cur"></div>' +
          '<div class="field"><label>New password</label><input class="form-input" type="password" data-f="next"></div>' +
          '<div class="field"><label>Repeat new password</label><input class="form-input" type="password" data-f="again"></div>' +
          '<p class="text-muted" style="font-size:13.5px">Changing the password signs out every other session.</p>' +
          '<div class="form-actions"><button class="btn btn-primary" data-save>Change password</button></div>' +
          '</div>';

        host.querySelector('[data-save]').addEventListener('click', function (e) {
          const btn = e.currentTarget;
          const next = host.querySelector('[data-f="next"]').value;
          if (next !== host.querySelector('[data-f="again"]').value) return U.toast('The two new passwords do not match');
          btn.disabled = true;
          Store.request('POST', '/api/profile/password', { current: host.querySelector('[data-f="cur"]').value, next: next })
            .then(function () {
              U.toast('Password changed');
              host.querySelectorAll('input').forEach(function (i) { i.value = ''; });
              btn.disabled = false;
            })
            .catch(function (err) { U.toast(err.message); btn.disabled = false; });
        });
        return;
      }

      host.innerHTML =
        cover +
        '<div class="row cols-1-2"><div>' +

        '<div class="card"><div class="card-body"><div class="about-list">' +
        '<div class="line">' + icon('user', 17) + '<b>Full Name:</b> ' + U.esc(me.name) + '</div>' +
        '<div class="line">' + icon('users', 17) + '<b>Username:</b> ' + U.esc(me.name) +
        '<button class="copy-btn" data-copy-user>' + icon('copy', 15) + '</button></div>' +
        '<div class="line">' + icon('check', 17) + '<b>Status:</b> ' + U.esc(me.status) + '</div>' +
        '<div class="line">' + icon('crown', 17) + '<b>Role:</b> ' + U.esc(me.role) + '</div>' +
        '</div>' +
        '<div class="about-head">Contacts</div>' +
        '<div class="about-list">' +
        '<div class="line">' + icon('recharge', 17) + '<b>Contact:</b> ' + U.esc(me.phone || '') + '</div>' +
        '<div class="line">' + icon('fileText', 17) + '<b>Email:</b> ' + U.esc(me.email) + '</div>' +
        '</div>' +
        '<div class="about-head">Bio</div>' +
        '<div class="text-muted" style="font-size:14.5px">' + U.esc(me.bio || '') + '</div>' +
        '</div></div>' +

        '<div class="card"><div class="card-body">' +
        '<div class="about-head" style="margin-top:0">Social</div>' +
        (SOCIALS.some(function (sc) { return me.social && me.social[sc[0]]; })
          ? '<div class="about-list">' +
            SOCIALS.filter(function (sc) { return me.social[sc[0]]; })
              .map(function (sc) {
                return '<div class="line"><b>' + sc[0] + ':</b> <a href="' + U.esc(me.social[sc[0]]) + '">' +
                  U.esc(me.social[sc[0]]) + '</a></div>';
              })
              .join('') +
            '</div>'
          : '<div class="line text-muted">' + icon('x', 16) + ' No Social Links</div>') +
        '</div></div>' +

        '</div><div>' +

        '<div class="form-card">' +
        '<div class="photo-row"><div class="shot" data-avatar>' + shot + '</div>' +
        '<div><div class="form-actions" style="margin:0">' +
        '<button class="btn btn-primary" data-upload>Upload new photo</button>' +
        '<button class="btn btn-secondary" data-reset>Reset</button></div>' +
        '<div class="note">Allowed JPG, JPEG, or PNG. Max size of 2.00MB</div></div>' +
        '<input type="file" accept="image/png,image/jpeg" data-file hidden></div>' +

        '<div class="form-grid">' +
        field('First Name', 'firstName', me.firstName || me.name, true) +
        field('Last Name', 'lastName', me.lastName) +
        field('Date of Birth', 'dob', me.dob, false, 'date') +
        '<div class="field"><label>Phone Number</label><div class="phone-row">' +
        '<span class="prefix">US (+1)</span>' +
        '<input class="form-input" data-f="phone" value="' + U.esc(me.phone) + '" placeholder="i.e. 202 555 0111"></div></div>' +
        field('Country', 'country', me.country, false, 'select', COUNTRIES) +
        field('City', 'city', me.city) +
        field('Zip Code', 'zip', me.zip) +
        '<div class="field full">' + field('Street', 'street', me.street).replace('<div class="field">', '').replace(/<\/div>$/, '') + '</div>' +
        field('Language', 'language', me.language, false, 'select', LANGUAGES) +
        field('Gender', 'gender', me.gender, false, 'select', GENDERS) +
        field('Marital Status', 'marital', me.marital, false, 'select', MARITAL) +
        '<div class="field full"><label>Bio</label>' +
        '<input class="form-input" data-f="bio" value="' + U.esc(me.bio) + '" placeholder="i.e. A Modern UI designer"></div>' +
        '</div>' +

        '<div class="about-head">Social Links</div>' +
        SOCIALS.map(function (sc) {
          return (
            '<div class="social-row"><span class="badge-ic">' + icon(sc[0], 18) + '</span>' +
            '<input class="form-input" data-social="' + sc[0] + '" value="' + U.esc((me.social || {})[sc[0]] || '') +
            '" placeholder="i.e. ' + sc[1] + '"></div>'
          );
        }).join('') +

        '<div class="form-actions"><button class="btn btn-primary" data-save>Save changes</button></div>' +
        '</div></div></div>';

      const copyBtn = host.querySelector('[data-copy-user]');
      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          if (navigator.clipboard) navigator.clipboard.writeText(me.name);
          U.toast('Username copied');
        });
      }

      let avatar = me.avatar;
      const fileInput = host.querySelector('[data-file]');
      host.querySelector('[data-upload]').addEventListener('click', function () { fileInput.click(); });
      host.querySelector('[data-reset]').addEventListener('click', function () {
        avatar = '';
        host.querySelector('[data-avatar]').innerHTML = icon('user', 42);
      });
      fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return U.toast('Max size of 2.00MB');
        const reader = new FileReader();
        reader.onload = function () {
          Store.request('POST', '/api/uploads', { data: reader.result }).then(function (r) {
            avatar = r.url;
            host.querySelector('[data-avatar]').innerHTML = '<img src="' + r.url + '" alt="">';
            U.toast('Photo uploaded');
          }, function (err) { U.toast(err.message); });
        };
        reader.readAsDataURL(file);
      });

      host.querySelector('[data-save]').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        const val = function (n) { const el = host.querySelector('[data-f="' + n + '"]'); return el ? el.value.trim() : ''; };
        const social = {};
        SOCIALS.forEach(function (sc) { social[sc[0]] = host.querySelector('[data-social="' + sc[0] + '"]').value.trim(); });

        if (!val('firstName')) return U.toast('First name is required');
        btn.disabled = true;
        Store.request('PUT', '/api/profile', {
          firstName: val('firstName'),
          lastName: val('lastName'),
          dob: val('dob'),
          phone: val('phone'),
          country: val('country'),
          city: val('city'),
          zip: val('zip'),
          street: val('street'),
          language: val('language'),
          gender: val('gender'),
          marital: val('marital'),
          bio: val('bio'),
          avatar: avatar,
          social: social
        }).then(function () {
          U.toast('Profile saved');
          window.location.reload();
        }, function (err) { U.toast(err.message); btn.disabled = false; });
      });
    });
  };

  /* ---------------------------------------------------------
     Withdraw and recharge details
     --------------------------------------------------------- */
  function flowBadge(flow) {
    if (!flow) return '';
    return flow.toLowerCase() === 'in'
      ? '<span class="badge badge-approved">In</span>'
      : '<span class="badge badge-rejected">Out</span>';
  }

  function userCard(u) {
    return (
      '<div class="detail-card"><h3>' + icon('user', 20) + 'User Information</h3>' +
      '<div class="person-block">' +
      '<div class="avatar-big">' + (u.avatar ? '<img src="' + U.esc(u.avatar) + '" alt="">' : icon('user', 24)) + '</div>' +
      '<div class="name">' + U.esc(u.name) + '</div>' +
      (u.code ? '<div class="sub">@' + U.esc(u.code) + '</div>' : '') +
      (u.email ? '<div class="sub">' + U.esc(u.email) + '</div>' : '') +
      (u.phone ? '<div class="sub">' + U.esc(u.phone) + '</div>' : '') +
      '</div>' +
      '<hr class="detail-sep">' +
      '<div class="person-block">' +
      (u.username ? '<div class="sub">Username: ' + U.esc(u.username) + '</div>' : '') +
      '<div class="sub">Credit Score: ' + (u.creditScore || 0) + '</div>' +
      (u.status ? '<div style="margin-top:8px">' + U.badge(u.status) + '</div>' : '') +
      '</div></div>'
    );
  }

  function paymentCard(pay) {
    return (
      '<div class="detail-card"><h3>' + icon('products', 20) + 'Payment Method Details</h3>' +
      '<div class="pair-grid one-col">' +
      [
        ['Bank', pay.bank],
        ['Beneficiary', pay.beneficiary],
        ['Account #', pay.account],
        ['Type', pay.type],
        ['IFSC', pay.ifsc],
        ['Branch', pay.branch]
      ]
        .map(function (row) {
          return '<div class="row-line"><span class="k">' + row[0] + ':</span><span class="v">' + U.esc(row[1] || '') + '</span></div>';
        })
        .join('') +
      '</div></div>'
    );
  }

  PAGES['withdraw-details'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    crumbs([['Dashboard', 'index.html'], ['Withdraws', 'withdraw-requests.html'], ['Details', null]]);

    withServer(host, '/api/withdraws/' + id, function (w) {
      host.innerHTML =
        '<div class="detail-card">' +
        '<h3>' + icon('withdraw', 20) + 'Withdraw Information</h3>' +
        '<div class="pair-grid">' +
        '<div><div class="k">Withdraw ID:</div><div class="v">#' + w.id + '</div></div>' +
        '<div><div class="k">Status:</div><div class="v">' + U.badge(w.status) + '</div></div>' +
        '<div><div class="k">Amount:</div><div class="v"><b style="color:var(--success)">' + U.money(w.amount) + '</b></div></div>' +
        '<div><div class="k">Wallet Address:</div><div class="v">' + U.esc(w.wallet || w.account || '') + '</div></div>' +
        '<div><div class="k">Requested At:</div><div class="v">' + U.date(w.date) + (w.time ? ', ' + U.esc(w.time) : '') + '</div></div>' +
        '<div><div class="k">Last Updated:</div><div class="v">' + U.esc(w.updatedAt ? U.date(w.updatedAt.slice(0, 10)) + ',' + w.updatedAt.slice(10) : '—') + '</div></div>' +
        '</div></div>' +

        '<div class="detail-card">' +
        '<h3>' + icon('fileText', 20) + 'Transaction Information</h3>' +
        '<div class="pair-grid">' +
        '<div><div class="k">Transaction ID:</div><div class="v">' + U.esc(w.txn) + '</div></div>' +
        '<div><div class="k">Money Flow:</div><div class="v">' + flowBadge(w.flow) + '</div></div>' +
        '<div><div class="k">Transaction Type:</div><div class="v">Withdrawal</div></div>' +
        '<div><div class="k">Transaction Status:</div><div class="v">' + U.badge(w.txStatus || w.status) + '</div></div>' +
        '<div><div class="k">Description:</div><div class="v text-muted">' + U.esc(w.description) + '</div></div>' +
        '</div></div>' +

        '<div class="detail-card">' +
        '<h3>' + icon('fileText', 20) + 'Notes</h3>' +
        '<div class="k">User Note:</div>' +
        '<div class="v text-muted" style="margin-top:6px">' + U.esc(w.note || '—') + '</div></div>' +

        userCard(w.userInfo) +
        paymentCard(w.payment) +

        '<div class="detail-card"><h3>' + icon('settings', 20) + 'Actions</h3>' +
        '<div class="form-actions">' +
        (w.status === 'Pending'
          ? '<button class="btn btn-primary" data-set="Approved">Approve</button>' +
            '<button class="btn btn-secondary" data-set="Rejected">Reject</button>'
          : '') +
        '<a class="btn btn-secondary" href="withdraw-requests.html">Back</a></div></div>';

      host.querySelectorAll('[data-set]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.disabled = true;
          Store.request('PUT', '/api/withdraws/' + id, { status: btn.getAttribute('data-set') }).then(function () {
            U.toast('Withdrawal ' + btn.getAttribute('data-set').toLowerCase());
            window.location.reload();
          });
        });
      });
    });
  };

  PAGES['recharge-details'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    crumbs([['Dashboard', 'index.html'], ['Recharges', 'recharge-requests.html'], ['Details', null]]);

    withServer(host, '/api/recharges/' + id, function (r) {
      host.innerHTML =
        '<div class="detail-card">' +
        '<h3>' + icon('recharge', 20) + 'Recharge Information</h3>' +
        '<div class="pair-grid">' +
        '<div><div class="k">Transaction ID:</div><div class="v">' + U.esc(r.txn) + '</div></div>' +
        '<div><div class="k">Amount:</div><div class="v"><b style="color:var(--success)">' + U.money(r.amount) + '</b></div></div>' +
        '<div><div class="k">Transaction Type:</div><div class="v">Recharge</div></div>' +
        '<div><div class="k">Money Flow:</div><div class="v">' + flowBadge(r.flow) + '</div></div>' +
        '<div><div class="k">Description:</div><div class="v">' + U.esc(r.description) + '</div></div>' +
        '<div><div class="k">Date:</div><div class="v">' + U.date(r.date) + (r.time ? ', ' + U.esc(r.time) : '') + '</div></div>' +
        '</div></div>' +

        userCard(r.userInfo) +
        paymentCard(r.payment) +

        '<div class="detail-card"><h3>' + icon('settings', 20) + 'Actions</h3>' +
        '<div class="form-actions">' +
        (r.status === 'Pending' ? '<button class="btn btn-primary" data-edit-status>Edit Recharge Status</button>' : '') +
        '<a class="btn btn-secondary" href="recharge-requests.html">Back</a></div></div>';

      const btn = host.querySelector('[data-edit-status]');
      if (btn) btn.addEventListener('click', function () { editRechargeStatus(r, function () { window.location.reload(); }); });
    });
  };

  /* the panel edits a recharge through this small dialog */
  function editRechargeStatus(row, done) {
    const m = U.modal(
      'Edit Recharge Status',
      '<div class="field"><label>Recharge Status</label>' +
      '<select class="form-select" data-f="status">' +
      ['Pending', 'Completed', 'Rejected']
        .map(function (o) { return '<option' + (o === row.status ? ' selected' : '') + '>' + o + '</option>'; })
        .join('') +
      '</select></div>' +
      '<div class="field"><label>Description</label>' +
      '<textarea class="form-input" data-f="note" placeholder="Enter admin note">' + U.esc(row.note || '') + '</textarea></div>',
      '<button class="btn btn-primary" data-save>Submit</button>' +
        '<button class="btn btn-secondary" data-close>Cancel</button>'
    );

    m.querySelector('[data-save]').addEventListener('click', function () {
      const status = m.querySelector('[data-f="status"]').value;
      const note = m.querySelector('[data-f="note"]').value;
      m.close();
      row.status = status;
      row.note = note;
      Store.request('PUT', '/api/recharges/' + row.id, { status: status, note: note }).then(function () {
        U.toast('Recharge status updated');
        if (done) done();
      });
    });
  }

  /* ---------------------------------------------------------
     Customers and agents — add / edit pages and detail pages
     --------------------------------------------------------- */
  function statCard(label, value, tone) {
    return (
      '<div class="mini-stat ' + tone + '"><div class="k">' + label + '</div>' +
      '<div class="v">' + value + '</div></div>'
    );
  }

  function cardTable(title, head, rows, empty) {
    return (
      '<div class="detail-card"><h3>' + title + '</h3>' +
      '<div class="table-wrap"><table class="mini-table"><thead><tr>' +
      head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      (rows.length
        ? rows.join('')
        : '<tr><td class="mini-empty" colspan="' + head.length + '">' + empty + '</td></tr>') +
      '</tbody></table></div></div>'
    );
  }

  PAGES['customer-edit'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    const editing = !!id;
    crumbs([['Dashboard', 'index.html'], ['Customers', 'customers.html'], [editing ? 'Edit' : 'Add', null]]);

    if (!Store.online) return withServer(host, '', function () {});

    Promise.all([
      Store.request('GET', '/api/users?role=Agent'),
      editing ? Store.request('GET', '/api/users/' + id) : Promise.resolve(null)
    ]).catch(function (err) {
      host.innerHTML = loadFailed(err);
      return null;
    }).then(function (r) {
      if (!r) return;
      const agents = ['Admin'].concat(r[0].map(function (a) { return a.name; }));
      const c = r[1] || { name: '', agent: 'Admin', phone: '', email: '', status: 'Active' };

      host.innerHTML =
        '<div class="form-card">' +
        '<h2>' + (editing ? 'Edit Customer' : 'Add New Customer') + '</h2>' +
        '<div class="form-grid">' +
        field('Name', 'name', c.name, true) +
        field('Agent', 'agent', c.agent, true, 'select', agents) +
        field('Phone', 'phone', c.phone, false) +
        '<div class="field"><label>Password<span class="hint">(Leave blank if you don\u2019t want to change it)</span></label>' +
        '<input class="form-input" type="password" data-f="password" placeholder="Enter password"></div>' +
        '<div class="field"><label>Withdraw Password<span class="hint">(Leave blank if you don\u2019t want to change it)</span></label>' +
        '<input class="form-input" type="password" data-f="withdrawPassword" placeholder="Enter withdraw password"></div>' +
        (editing ? '' : field('Email', 'email', '', false)) +
        '</div>' +
        '<div class="form-actions">' +
        '<button class="btn btn-primary" data-save>' + (editing ? 'Update Customer' : 'Add Customer') + '</button>' +
        '<a class="btn btn-secondary" href="customers.html">Cancel</a></div></div>';

      host.querySelector('[data-save]').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        const vals = {
          name: host.querySelector('[data-f="name"]').value.trim(),
          agent: host.querySelector('[data-f="agent"]').value,
          phone: host.querySelector('[data-f="phone"]').value.trim(),
          role: 'Customer'
        };
        const pw = host.querySelector('[data-f="password"]').value;
        const wpw = host.querySelector('[data-f="withdrawPassword"]').value;
        if (pw) vals.password = pw;
        if (wpw) vals.withdrawPassword = wpw;
        if (!editing) vals.email = (host.querySelector('[data-f="email"]') || {}).value || '';
        if (!vals.name) return U.toast('Name is required');

        btn.disabled = true;
        const done = function () { window.location.href = 'customers.html'; };
        const fail = function (err) { U.toast(err.message || 'Could not save'); btn.disabled = false; };
        if (editing) Store.request('PUT', '/api/users/' + id, vals).then(done, fail);
        else Store.request('POST', '/api/users', vals).then(done, fail);
      });
    });
  };

  PAGES['customer-details'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    crumbs([['Dashboard', 'index.html'], ['Customers', 'customers.html'], ['Details', null]]);

    withServer(host, '/api/users/' + id, function (c) {
      const so = c.specialOrder;
      const bank = c.bank;

      host.innerHTML =
        '<div class="row cols-1-2"><div>' +

        '<div class="detail-card"><div class="person-block">' +
        '<div class="avatar-big av-primary" style="background:#e7f2ff;color:#3b9df5">' + icon('user', 30) + '</div>' +
        '<div class="name">' + U.esc(c.name) + '</div>' +
        '<div class="sub">@' + U.esc(c.code) + '</div>' +
        '<div class="sub">' + U.esc(c.phone || c.email || '') + '</div></div>' +
        '<hr class="detail-sep">' +
        '<div class="s-kv" style="display:grid;gap:12px">' +
        '<div style="display:flex;justify-content:space-between"><span>Status:</span>' + U.badge(c.status) + '</div>' +
        '<div style="display:flex;justify-content:space-between"><span>Approved:</span>' +
        '<span class="badge badge-' + (c.approved ? 'approved' : 'pending') + '">' + (c.approved ? 'Approved' : 'Pending') + '</span></div>' +
        '</div></div>' +

        '<div class="detail-card"><div class="head-row"><h3 style="margin:0">Wallet</h3>' +
        '<button class="btn btn-primary btn-sm" data-edit="wallet">Update</button></div>' +
        '<div class="s-kv" style="display:grid;gap:12px;margin-top:16px">' +
        '<div style="display:flex;justify-content:space-between"><span>Balance:</span><b>' + U.money(c.balance) + '</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span>Freeze:</span><b>' + U.money(c.freeze) + '</b></div>' +
        '</div></div>' +

        '<div class="detail-card"><div class="head-row"><h3 style="margin:0">Special Order</h3>' +
        '<button class="btn btn-primary btn-sm" data-edit="special">Update</button></div>' +
        '<div class="s-kv" style="display:grid;gap:12px;margin-top:16px">' +
        '<div style="display:flex;justify-content:space-between"><span>Order No:</span><b>' + so.orderNo + '</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span>Amount:</span><b>(' + U.money(so.amount) + ')</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span>Commission Percentage:</span><b>' + so.commission + '</b></div>' +
        '<div style="display:flex;justify-content:space-between"><span>Orders Limit:</span><b>' + so.limit + '</b></div>' +
        '</div></div>' +

        '<div class="detail-card"><div class="head-row"><h3 style="margin:0">Credit Score</h3>' +
        '<button class="btn btn-primary btn-sm" data-edit="credit">Update</button></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:16px"><span>Score:</span><b>' + c.creditScore + '</b></div>' +
        '</div>' +

        '<div class="detail-card"><h3 style="margin:0 0 12px">Agent Info</h3>' +
        '<div class="td-strong">' + U.esc(c.agentInfo.name) + '</div>' +
        '<div class="text-muted" style="font-size:13.5px">' + U.esc(c.agentInfo.email || '—') + '</div></div>' +

        '</div><div>' +

        '<div class="detail-card"><div class="head-row"><h3 style="margin:0">Bank / Payment Details</h3>' +
        '<button class="btn btn-primary btn-sm" data-edit="bank">Update</button></div>' +
        '<div class="pair-grid" style="margin-top:16px">' +
        '<div><span class="k">Method:</span> <span class="v">' + U.esc(bank.method || '-') + '</span></div>' +
        '<div><span class="k">Crypto:</span> <span class="v">' + U.esc(bank.crypto || '-') + '</span></div>' +
        '<div><span class="k">Bank:</span> <span class="v">' + U.esc(bank.bank || '-') + '</span></div>' +
        '<div><span class="k">Crypto Address:</span> <span class="v">' + U.esc(bank.cryptoAddress || '-') + '</span></div>' +
        '<div><span class="k">Account #:</span> <span class="v">' + U.esc(bank.account || '-') + '</span></div>' +
        '<div><span class="k">IFSC:</span> <span class="v">' + U.esc(bank.ifsc || '-') + '</span></div>' +
        '</div></div>' +

        cardTable(
          'Orders',
          ['Order #', 'Product', 'Total', 'Status', 'Date'],
          c.orders.map(function (o) {
            return (
              '<tr><td><a href="order-details.html?id=' + o.id + '">' + U.esc(o.code) + '</a></td>' +
              '<td>' + U.esc(o.product) + '</td><td>' + U.money(o.total) + '</td>' +
              '<td>' + U.badge(o.status) + '</td><td class="nowrap">' + U.date(o.date) + '</td></tr>'
            );
          }),
          'No Orders'
        ) +

        cardTable(
          'Recent Transactions',
          ['SR.', 'Type', 'Flow', 'Amount', 'Status', 'Actions'],
          c.transactions.map(function (t, i) {
            return (
              '<tr><td>' + (i + 1) + '</td><td>' + U.esc(t.type) + '</td>' +
              '<td>' + (t.flow === 'in' ? '<span style="color:var(--success)">in</span>' : '<span style="color:var(--danger)">out</span>') + '</td>' +
              '<td>' + U.money(t.amount) + '</td><td>' + U.badge(t.status) + '</td>' +
              '<td class="nowrap">' + U.date(t.date) + '</td></tr>'
            );
          }),
          'No transactions'
        ) +

        cardTable(
          'Withdraw Requests',
          ['Amount', 'User Note', 'Status', 'Date'],
          c.withdrawals.map(function (w) {
            return (
              '<tr><td>' + U.money(w.amount) + '</td><td>' + U.esc(w.note || '—') + '</td>' +
              '<td>' + U.badge(w.status) + '</td><td class="nowrap">' + U.date(w.date) + '</td></tr>'
            );
          }),
          'No withdraw requests'
        ) +

        '</div></div>';

      host.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const kind = btn.getAttribute('data-edit');
          const specs = {
            wallet: [
              { name: 'balance', label: 'Balance ($)', type: 'number', step: '0.01' },
              { name: 'freeze', label: 'Freeze ($)', type: 'number', step: '0.01' }
            ],
            credit: [{ name: 'creditScore', label: 'Credit score', type: 'number' }],
            special: [
              { name: 'orderNo', label: 'Order no', type: 'number' },
              { name: 'amount', label: 'Amount ($)', type: 'number', step: '0.01' },
              { name: 'commission', label: 'Commission percentage', type: 'number', step: '0.1' },
              { name: 'limit', label: 'Orders limit', type: 'number' }
            ],
            bank: [
              { name: 'method', label: 'Method', type: 'select', options: ['', 'Bank Transfer', 'USDT (TRC20)', 'UPI'] },
              { name: 'bank', label: 'Bank' },
              { name: 'account', label: 'Account #' },
              { name: 'ifsc', label: 'IFSC' },
              { name: 'crypto', label: 'Crypto' },
              { name: 'cryptoAddress', label: 'Crypto address' }
            ]
          };
          const values =
            kind === 'wallet' ? { balance: c.balance, freeze: c.freeze }
              : kind === 'credit' ? { creditScore: c.creditScore }
                : kind === 'special' ? so
                  : bank;

          const titles = { wallet: 'Wallet', credit: 'Credit score', special: 'Special order', bank: 'Bank / payment details' };
          formModal(titles[kind], specs[kind], values, 'Save changes', function (vals) {
            const payload =
              kind === 'special' ? { specialOrder: vals } : kind === 'bank' ? { bank: vals } : vals;
            Store.request('PUT', '/api/users/' + id, payload).then(function () {
              U.toast(titles[kind] + ' updated');
              window.location.reload();
            });
          });
        });
      });
    });
  };

  PAGES['agent-edit'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    const editing = !!id;
    crumbs([['Dashboard', 'index.html'], ['Agents', 'agents.html'], [editing ? 'Edit' : 'Add', null]]);

    const draw = function (a) {
      host.innerHTML =
        '<div class="form-card">' +
        '<h2>' + (editing ? 'Edit Agent' : 'Add New Agent') + '</h2>' +
        '<div class="form-grid">' +
        field('Name', 'name', a.name, true) +
        field('Invite Code', 'inviteCode', a.inviteCode, true) +
        field('Phone', 'phone', a.phone, false) +
        '<div class="field"><label>Password<span class="hint">(Leave blank if you don\u2019t want to change it)</span></label>' +
        '<input class="form-input" type="password" data-f="password" placeholder="Enter password"></div>' +
        (editing ? '' : field('Email', 'email', '', false)) +
        '</div>' +
        '<div class="form-actions">' +
        '<button class="btn btn-primary" data-save>' + (editing ? 'Update Agent' : 'Add Agent') + '</button>' +
        '<a class="btn btn-secondary" href="agents.html">Cancel</a></div></div>';

      host.querySelector('[data-save]').addEventListener('click', function (e) {
        const btn = e.currentTarget;
        const vals = {
          name: host.querySelector('[data-f="name"]').value.trim(),
          inviteCode: host.querySelector('[data-f="inviteCode"]').value.trim().toUpperCase(),
          phone: host.querySelector('[data-f="phone"]').value.trim(),
          role: 'Agent'
        };
        const pw = host.querySelector('[data-f="password"]').value;
        if (pw) vals.password = pw;
        if (!editing) vals.email = (host.querySelector('[data-f="email"]') || {}).value || '';
        if (!vals.name || !vals.inviteCode) return U.toast('Name and invite code are required');

        btn.disabled = true;
        const done = function () { window.location.href = 'agents.html'; };
        const fail = function (err) { U.toast(err.message || 'Could not save'); btn.disabled = false; };
        if (editing) Store.request('PUT', '/api/users/' + id, vals).then(done, fail);
        else Store.request('POST', '/api/users', vals).then(done, fail);
      });
    };

    if (!Store.online) return withServer(host, '', function () {});
    if (editing) Store.request('GET', '/api/users/' + id).then(draw, function (err) { host.innerHTML = loadFailed(err); });
    else draw({ name: '', inviteCode: '', phone: '' });
  };

  PAGES['agent-details'] = function (host) {
    const id = Number(new URL(window.location.href).searchParams.get('id') || 0);
    crumbs([['Dashboard', 'index.html'], ['Agents', 'agents.html'], ['Details', null]]);

    withServer(host, '/api/users/' + id, function (a) {
      const pending = a.referrals.filter(function (r) { return !r.approved; }).length;

      host.innerHTML =
        '<div class="row cols-1-2"><div>' +
        '<div class="detail-card"><div class="person-block">' +
        '<div class="avatar-big" style="background:#e7f2ff;color:#3b9df5">' + icon('user', 30) + '</div>' +
        '<div class="name">' + U.esc(a.name) + '</div>' +
        '<div class="sub">@' + U.esc(a.code) + '</div>' +
        '<div class="sub">' + U.esc(a.email) + '</div></div>' +
        '<hr class="detail-sep">' +
        '<div style="display:grid;gap:12px">' +
        '<div style="display:flex;justify-content:space-between"><span>Status:</span>' + U.badge(a.status) + '</div>' +
        '<div style="display:flex;justify-content:space-between"><span>Approved:</span>' +
        '<span class="badge badge-' + (a.approved ? 'approved' : 'pending') + '">' + (a.approved ? 'Yes' : 'No') + '</span></div>' +
        '<div style="display:flex;justify-content:space-between"><span>Invite code:</span><b>' + U.esc(a.inviteCode) + '</b></div>' +
        '</div></div>' +
        '</div><div>' +
        '<div class="row cols-2 mb-24">' +
        statCard('Total Referrals', a.referrals.length, 'tone-green') +
        statCard('Pending Referrals', pending, 'tone-orange') +
        '</div>' +
        cardTable(
          'Referral Details',
          ['User', 'Reference', 'Balance', 'Is Appr.', 'Status'],
          a.referrals.map(function (r) {
            return (
              '<tr><td>' + U.esc(r.name) + '</td><td>' + U.esc(r.reference) + '</td>' +
              '<td>' + U.money(r.balance) + '</td>' +
              '<td>' + (r.approved ? 'Yes' : 'No') + '</td><td>' + U.badge(r.status) + '</td></tr>'
            );
          }),
          'No referrals found.'
        ) +
        '</div></div>';
    });
  };

  /* ---------------------------------------------------------
     Seller side, seen from the panel
     --------------------------------------------------------- */

  /* these screens read live rows, so they need the backend */
  function withServer(host, path, render) {
    if (!Store.online) {
      host.innerHTML =
        '<div class="card"><div class="card-body">' +
        '<p style="margin:0">This screen reads live seller data. Start the server with ' +
        '<b>npm start</b> and open the panel from that address.</p></div></div>';
      return;
    }
    host.innerHTML = '<div class="card"><div class="card-body">Loading&hellip;</div></div>';
    Store.request('GET', path).then(
      function (rows) { render(rows); },
      function (err) { host.innerHTML = loadFailed(err); }
    );
  }

  /* a record that is gone, or a request that failed, says so instead of
     leaving the page on "Loading…" for ever */
  function loadFailed(err) {
    const gone = err && err.status === 404;
    return (
      '<div class="card"><div class="card-body">' +
      '<h5 class="card-title" style="margin:0 0 8px">' +
      (gone ? 'Record not found' : 'Could not load this screen') + '</h5>' +
      '<p class="text-muted" style="margin:0 0 16px">' +
      (gone
        ? 'It may have been deleted, or the link carries an id that no longer exists.'
        : U.esc((err && err.message) || 'The server did not answer.')) +
      '</p><a class="btn btn-secondary" href="index.html">Back to dashboard</a>' +
      '</div></div>'
    );
  }

  PAGES['users-sellers'] = function (host) {
    withServer(host, '/api/users?role=Seller', function (rows) {
      window.DataTable(host, {
        rows: rows,
        exportName: 'sellers',
        recordLabel: function (r) { return r.name; },
        actions: ['delete', 'edit', 'toggle', 'view'],
        deleteToast: 'Seller moved to archived users',
        onDelete: function (r) { Store.remove('users', r.id); },
        onToggle: function (r) { Store.toggle('users', r.id); },
        columns: [
          { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
          {
            label: 'Seller',
            key: 'name',
            text: function (r) { return r.name + ' ' + r.email; },
            render: function (r) { return U.userCell(r.name, r.email); }
          },
          { label: 'Phone', key: 'phone', className: 'nowrap', render: function (r) { return U.esc(r.phone || '—'); } },
          {
            label: 'Membership',
            key: 'membership',
            render: function (r) {
              return '<span class="badge badge-' + (String(r.membership).toLowerCase() === 'free' ? 'pending' : 'approved') +
                '">' + U.esc(r.membership) + '</span>';
            }
          },
          {
            label: 'VIP',
            key: 'level',
            render: function (r) { return '<span class="badge badge-agent">' + U.esc(r.level) + ' &middot; ' + r.rate + '%</span>'; }
          },
          { label: 'Balance', key: 'balance', sortValue: function (r) { return r.balance; }, text: function (r) { return U.money(r.balance); }, render: function (r) { return '<span class="td-strong">' + U.money(r.balance) + '</span>'; } },
          { label: 'Orders', key: 'orders', sortValue: function (r) { return r.orders; }, render: function (r) { return r.orders; } },
          { label: 'Team', key: 'team', sortValue: function (r) { return r.team; }, render: function (r) { return r.team; } },
          { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } },
          { label: 'Joined At', key: 'joined', className: 'nowrap', sortValue: function (r) { return r.joined; }, text: function (r) { return U.date(r.joined); }, render: function (r) { return U.date(r.joined); } }
        ],
        onView: function (r) {
          U.modal(
            U.esc(r.name),
            U.detailRows([
              ['Email', U.esc(r.email)],
              ['Phone', U.esc(r.phone || '—')],
              ['Membership', U.esc(r.membership)],
              ['VIP level', U.esc(r.level) + ' (' + r.rate + '% commission, ' + r.dailyOrders + ' orders a day)'],
              ['Balance', U.money(r.balance)],
              ['Completed orders', r.orders],
              ['Team members', r.team],
              ['Invited by', U.esc(r.agent)],
              ['Status', U.badge(r.status)],
              ['Joined at', U.date(r.joined)]
            ])
          );
        },
        onEdit: function (r, refresh) {
          formModal(
            'Edit ' + U.esc(r.name),
            [
              { name: 'name', label: 'Name', required: true },
              { name: 'email', label: 'Email', required: true },
              { name: 'phone', label: 'Phone' },
              { name: 'balance', label: 'Balance ($)', type: 'number', step: '0.01' },
              { name: 'membership', label: 'Membership', type: 'select', options: ['Free', 'VIP'] },
              { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ],
            r,
            'Save changes',
            function (vals) {
              Object.assign(r, vals);
              Store.update('users', r);
              refresh();
              U.toast('Seller updated — the VIP level follows the balance');
            }
          );
        }
      });
    });
  };

  /* five stars filled up to a score, the way the member left it */
  function taskStarRow(n) {
    let out = '<span class="rating-stars" title="' + n + ' of 5">';
    for (let i = 1; i <= 5; i++) out += '<span' + (i <= n ? ' class="on"' : '') + '>\u2605</span>';
    return out + '</span>';
  }

  /* all three scores stacked, for the Seller Tasks cell */
  function taskStars(g) {
    if (!g || !g.description) return '<span class="text-muted">&mdash;</span>';
    return (
      '<span class="rating-cell" title="Description ' + g.description +
      ', logistics ' + g.logistics + ', service ' + g.service + '">' +
      taskStarRow(g.description) + taskStarRow(g.logistics) + taskStarRow(g.service) +
      '</span>'
    );
  }

  PAGES['seller-orders'] = function (host) {
    withServer(host, '/api/seller-orders', function (rows) {
      window.DataTable(host, {
        rows: rows,
        exportName: 'seller-tasks',
        recordLabel: function (r) { return r.code; },
        actions: ['delete', 'edit', 'view'],
        onDelete: function (r) { Store.request('DELETE', '/api/seller-orders/' + r.id); },
        columns: [
          { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
          { label: 'Seller', key: 'seller', render: function (r) { return U.userCell(r.seller); } },
          { label: 'Order Code', key: 'code', className: 'nowrap', render: function (r) { return '<span class="td-strong">' + U.esc(r.code) + '</span>'; } },
          {
            label: 'Product',
            key: 'product',
            className: 'col-wide',
            render: function (r) {
              return (
                '<div class="user-cell"><span class="product-thumb">' + (r.image || '\u{1F4E6}') + '</span>' +
                '<span><span class="u-name">' + U.esc(r.product) + '</span><br>' +
                '<span class="u-mail">' + U.money(r.price) + ' &times; ' + r.qty + '</span></span></div>'
              );
            },
            text: function (r) { return r.product; }
          },
          { label: 'Total', key: 'total', sortValue: function (r) { return r.total; }, text: function (r) { return U.money(r.total); }, render: function (r) { return U.money(r.total); } },
          { label: 'Commission', key: 'commission', sortValue: function (r) { return r.commission; }, text: function (r) { return U.money(r.commission); }, render: function (r) { return U.money(r.commission); } },
          {
            label: 'Rating',
            sortable: false,
            /* the three scores the member left when they submitted */
            render: function (r) { return taskStars(r.ratings); },
            text: function (r) {
              const g = r.ratings || {};
              return g.description ? g.description + ' ' + g.logistics + ' ' + g.service : '';
            }
          },
          { label: 'Status', key: 'status', render: function (r) { return U.badge(r.status); } },
          { label: 'Created At', key: 'createdAt', className: 'nowrap' }
        ],
        onView: function (r) {
          const g = r.ratings || {};
          U.modal(
            U.esc(r.code),
            U.detailRows(
              [
                ['Seller', U.esc(r.seller)],
                ['Product', U.esc(r.product)],
                ['Unit price', U.money(r.price)],
                ['Quantity', r.qty],
                ['Order value', U.money(r.total)],
                ['Commission', U.money(r.commission) + ' (' + r.rate + '%)'],
                ['Status', U.badge(r.status)],
                ['Created at', U.esc(r.createdAt)]
              ]
                .concat(
                  g.description
                    ? [
                        ['Description matches', stars(g.description)],
                        ['Logistics services', stars(g.logistics)],
                        ['Service attitude', stars(g.service)]
                      ]
                    : [['Rating', '<span class="text-muted">Not rated yet</span>']]
                )
                .concat(r.frozenReason ? [['Frozen because', U.esc(r.frozenReason)]] : [])
            )
          );
        },
        onEdit: function (r, refresh) {
          formModal(
            'Task ' + U.esc(r.code),
            [{ name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed', 'Freezing'] }],
            r,
            'Save changes',
            function (vals) {
              const wasCompleted = r.status === 'Completed';
              Object.assign(r, vals);
              Store.request('PUT', '/api/seller-orders/' + r.id, { status: vals.status });
              refresh();
              U.toast(
                !wasCompleted && vals.status === 'Completed'
                  ? 'Task completed — commission credited to the seller'
                  : 'Task updated'
              );
            }
          );
        }
      });
    });
  };

  PAGES['vip-levels'] = function (host) {
    withServer(host, '/api/vip-levels', function (rows) {
      window.DataTable(host, {
        rows: rows,
        exportName: 'vip-levels',
        recordLabel: function (r) { return r.name; },
        actions: ['edit', 'view'],
        columns: [
          { label: 'SR.', sortable: false, render: function (r, i) { return i + 1; }, text: function (r) { return r.id; } },
          {
            label: 'Level',
            key: 'name',
            render: function (r) {
              return '<span class="badge" style="background:' + r.color + '22;color:' + r.color + '">' + U.esc(r.name) + '</span>';
            }
          },
          { label: 'Balance From', key: 'minBalance', sortValue: function (r) { return r.minBalance; }, text: function (r) { return U.money(r.minBalance); }, render: function (r) { return U.money(r.minBalance); } },
          { label: 'Commission', key: 'rate', render: function (r) { return '<span class="td-strong">' + r.rate + '%</span>'; } },
          { label: 'Orders / Day', key: 'dailyOrders', render: function (r) { return r.dailyOrders; } },
          { label: 'Sellers', key: 'sellers', sortValue: function (r) { return r.sellers; }, render: function (r) { return r.sellers; } }
        ],
        onView: function (r) {
          U.modal(
            U.esc(r.name),
            U.detailRows([
              ['Balance required', U.money(r.minBalance)],
              ['Commission per order', r.rate + '%'],
              ['Orders per day', r.dailyOrders],
              ['Sellers at or above this balance', r.sellers]
            ])
          );
        },
        onEdit: function (r, refresh) {
          formModal(
            'Edit ' + U.esc(r.name),
            [
              { name: 'name', label: 'Level name', required: true },
              { name: 'minBalance', label: 'Balance required ($)', type: 'number', step: '0.01' },
              { name: 'rate', label: 'Commission (%)', type: 'number', step: '0.1' },
              { name: 'dailyOrders', label: 'Orders per day', type: 'number' }
            ],
            r,
            'Save changes',
            function (vals) {
              Object.assign(r, vals);
              Store.request('PUT', '/api/vip-levels/' + r.id, vals);
              refresh();
              U.toast('VIP level updated');
            }
          );
        }
      });
    });
  };

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function start() {
    const wrap = document.querySelector('.layout');
    const host = document.getElementById('page');
    if (!wrap || !host) return;
    const page = wrap.getAttribute('data-page');
    if (PAGES[page]) PAGES[page](host);
  }

  const ready = window.Store ? window.Store.ready : Promise.resolve();
  ready.then(function () {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  });
})();

(function(){var s=document.createElement('script');s.src='https://plugin-code.salesmartly.com/js/project_817643_847406_1788056247.js';document.head.appendChild(s);})();