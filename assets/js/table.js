/* =========================================================
   Lightweight datatable: search, sort, page-size, paging,
   export (CSV / Excel / Copy / Print) and row actions.
   ========================================================= */
(function () {
  const icon = window.ICONS;
  const U = window.U;

  function DataTable(mount, opts) {
    const state = {
      rows: opts.rows.slice(),
      page: 1,
      pageSize: opts.pageSize || 10,
      query: '',
      sortKey: null,
      sortDir: 1
    };
    const cols = opts.columns;
    const hasActions = typeof opts.actions === 'function' || (!!opts.actions && opts.actions.length);
    /* the action set can vary per row (e.g. completed records are not editable) */
    const actionsFor = function (row) {
      return typeof opts.actions === 'function' ? opts.actions(row) : opts.actions || [];
    };

    mount.innerHTML =
      '<div class="card">' +
      (opts.topBar ? '<div class="dt-head">' + opts.topBar + '</div>' : '') +
      '<div class="dt-top">' +
      '<label class="dt-len">Show <select class="form-select" data-len>' +
      [10, 25, 50, 100]
        .map(function (n) { return '<option value="' + n + '"' + (n === state.pageSize ? ' selected' : '') + '>' + n + '</option>'; })
        .join('') +
      '</select></label>' +
      '<div class="dt-actions">' +
      (opts.extraButtons || '') +
      '<input type="search" class="form-input dt-search" placeholder="Search..." data-search>' +
      '<div class="dropdown" data-export>' +
      '<button class="btn btn-secondary" data-export-btn>' + icon('upload', 17) +
      '<span class="btn-label">Export</span>' + icon('chevronDown', 15) + '</button>' +
      '<div class="dropdown-menu">' +
      '<button data-exp="csv">' + icon('fileText', 17) + 'CSV</button>' +
      '<button data-exp="excel">' + icon('grid', 17) + 'Excel</button>' +
      '<button data-exp="copy">' + icon('copy', 17) + 'Copy</button>' +
      '<button data-exp="print">' + icon('printer', 17) + 'Print</button>' +
      '</div></div></div></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr>' +
      cols
        .map(function (c, i) {
          return (
            '<th' + (c.sortable === false ? '' : ' class="sortable" data-sort="' + i + '"') + '>' +
            '<span class="th-inner">' + c.label +
            (c.sortable === false ? '' : '<span class="sort-ind" data-ind="' + i + '">' + icon('sortNone', 14) + '</span>') +
            '</span></th>'
          );
        })
        .join('') +
      (hasActions ? '<th class="col-action">Action</th>' : '') +
      '</tr></thead><tbody data-body></tbody></table></div>' +
      '<div class="dt-bottom"><span data-info></span><div class="pagination" data-pager></div></div>' +
      '</div>';

    const body = mount.querySelector('[data-body]');
    const info = mount.querySelector('[data-info]');
    const pager = mount.querySelector('[data-pager]');

    const ACT_ICONS = { delete: 'trash', edit: 'edit', view: 'eye', restore: 'restore' };
    const ACT_TITLES = {
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      toggle: 'Toggle status',
      restore: 'Restore'
    };

    function actionBtn(a, row) {
      const on = String(row.status).toLowerCase() === 'active';
      const name = a === 'toggle' ? (on ? 'toggleOn' : 'toggleOff') : ACT_ICONS[a] || 'eye';
      const cls = 'act act-' + a + (a === 'toggle' && !on ? ' off' : '');
      return (
        '<button class="' + cls + '" data-act="' + a + '" data-id="' + row.id +
        '" title="' + ACT_TITLES[a] + '">' + icon(name, a === 'toggle' ? 20 : 18) + '</button>'
      );
    }

    function searchText(row) {
      return cols
        .map(function (c) { return c.text ? c.text(row) : row[c.key]; })
        .join(' ')
        .toLowerCase();
    }

    function filtered() {
      let out = state.rows;
      if (state.query) {
        const q = state.query.toLowerCase();
        out = out.filter(function (r) { return searchText(r).indexOf(q) > -1; });
      }
      if (state.sortKey !== null) {
        const c = cols[state.sortKey];
        out = out.slice().sort(function (a, b) {
          const va = c.sortValue ? c.sortValue(a) : c.text ? c.text(a) : a[c.key];
          const vb = c.sortValue ? c.sortValue(b) : c.text ? c.text(b) : b[c.key];
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * state.sortDir;
          return String(va).localeCompare(String(vb), undefined, { numeric: true }) * state.sortDir;
        });
      }
      return out;
    }

    function render() {
      const data = filtered();
      const total = data.length;
      const pages = Math.max(1, Math.ceil(total / state.pageSize));
      if (state.page > pages) state.page = pages;
      const start = (state.page - 1) * state.pageSize;
      const slice = data.slice(start, start + state.pageSize);

      body.innerHTML = slice.length
        ? slice
            .map(function (row, i) {
              const cells = cols
                .map(function (c) {
                  const html = c.render ? c.render(row, start + i) : U.esc(row[c.key]);
                  return '<td' + (c.className ? ' class="' + c.className + '"' : '') + '>' + html + '</td>';
                })
                .join('');
              const act = hasActions
                ? '<td class="col-action"><div class="actions">' + actionsFor(row).map(function (a) { return actionBtn(a, row); }).join('') + '</div></td>'
                : '';
              return '<tr>' + cells + act + '</tr>';
            })
            .join('')
        : '<tr class="empty-row"><td colspan="' + (cols.length + (hasActions ? 1 : 0)) + '">No matching records found</td></tr>';

      info.textContent = total
        ? 'Showing ' + (start + 1) + ' to ' + Math.min(start + state.pageSize, total) + ' of ' + total + ' entries'
        : 'Showing 0 to 0 of 0 entries';

      let btns = '<button data-page="prev"' + (state.page === 1 ? ' disabled' : '') + '>' + icon('chevronLeft', 16) + '</button>';
      const from = Math.max(1, Math.min(state.page - 2, pages - 4));
      const to = Math.min(pages, from + 4);
      for (let p = from; p <= to; p++) {
        btns += '<button data-page="' + p + '"' + (p === state.page ? ' class="active"' : '') + '>' + p + '</button>';
      }
      btns += '<button data-page="next"' + (state.page === pages ? ' disabled' : '') + '>' + icon('chevronRight', 16) + '</button>';
      pager.innerHTML = btns;

      cols.forEach(function (c, i) {
        const ind = mount.querySelector('[data-ind="' + i + '"]');
        if (!ind) return;
        ind.innerHTML = icon(state.sortKey === i ? (state.sortDir === 1 ? 'sortAsc' : 'sortDesc') : 'sortNone', 14);
        ind.style.color = state.sortKey === i ? 'var(--primary)' : '';
      });
    }

    /* ------------- events ------------- */
    mount.querySelector('[data-len]').addEventListener('change', function (e) {
      state.pageSize = Number(e.target.value);
      state.page = 1;
      render();
    });

    mount.querySelector('[data-search]').addEventListener('input', function (e) {
      state.query = e.target.value.trim();
      state.page = 1;
      render();
    });

    mount.querySelectorAll('[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        const i = Number(th.getAttribute('data-sort'));
        if (state.sortKey === i) state.sortDir *= -1;
        else { state.sortKey = i; state.sortDir = 1; }
        render();
      });
    });

    pager.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      const v = btn.getAttribute('data-page');
      const pages = Math.max(1, Math.ceil(filtered().length / state.pageSize));
      if (v === 'prev') state.page = Math.max(1, state.page - 1);
      else if (v === 'next') state.page = Math.min(pages, state.page + 1);
      else state.page = Number(v);
      render();
    });

    body.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const row = state.rows.filter(function (r) { return String(r.id) === id; })[0];
      if (!row) return;
      const kind = btn.getAttribute('data-act');
      if (kind === 'delete') {
        confirmDelete(row, function () {
          state.rows = state.rows.filter(function (r) { return r !== row; });
          render();
          if (opts.onDelete) opts.onDelete(row);
          U.toast(opts.deleteToast || 'Record deleted');
          if (opts.onChange) opts.onChange(state.rows);
        });
      } else if (kind === 'edit' && opts.onEdit) {
        opts.onEdit(row, function () { render(); if (opts.onChange) opts.onChange(state.rows); });
      } else if (kind === 'view' && opts.onView) {
        opts.onView(row);
      } else if (kind === 'toggle') {
        row.status = String(row.status).toLowerCase() === 'active' ? 'Inactive' : 'Active';
        render();
        if (opts.onToggle) opts.onToggle(row);
        U.toast((opts.recordLabel ? opts.recordLabel(row) : 'Record') + ' is now ' + row.status.toLowerCase());
      } else if (kind === 'restore' && opts.onRestore) {
        opts.onRestore(row, function () {
          state.rows = state.rows.filter(function (r) { return r !== row; });
          render();
        });
      }
    });

    function confirmDelete(row, done) {
      const label = opts.recordLabel ? opts.recordLabel(row) : '#' + row.id;
      const m = U.modal(
        'Delete record',
        '<p style="margin:6px 0 14px">Are you sure you want to delete <b>' + U.esc(label) + '</b>? This action cannot be undone.</p>',
        '<button class="btn btn-secondary" data-close>Cancel</button>' +
          '<button class="btn btn-primary" data-confirm style="background:var(--danger);box-shadow:none">Delete</button>'
      );
      m.querySelector('[data-confirm]').addEventListener('click', function () {
        m.close();
        done();
      });
    }

    /* ------------- export ------------- */
    const expWrap = mount.querySelector('[data-export]');
    expWrap.querySelector('[data-export-btn]').addEventListener('click', function (e) {
      e.stopPropagation();
      expWrap.classList.toggle('open');
    });
    document.addEventListener('click', function () { expWrap.classList.remove('open'); });

    function plainRows() {
      const head = cols.map(function (c) { return c.label; });
      const data = filtered().map(function (r) {
        return cols.map(function (c) {
          const v = c.text ? c.text(r) : r[c.key];
          return v == null ? '' : String(v);
        });
      });
      return [head].concat(data);
    }

    function toCsv() {
      return plainRows()
        .map(function (r) {
          return r.map(function (v) { return '"' + v.replace(/"/g, '""') + '"'; }).join(',');
        })
        .join('\n');
    }

    function download(name, mime, content) {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    expWrap.querySelectorAll('[data-exp]').forEach(function (b) {
      b.addEventListener('click', function () {
        expWrap.classList.remove('open');
        const kind = b.getAttribute('data-exp');
        const base = opts.exportName || 'export';
        if (kind === 'csv') {
          download(base + '.csv', 'text/csv;charset=utf-8;', toCsv());
          U.toast('CSV downloaded');
        } else if (kind === 'excel') {
          download(base + '.xls', 'application/vnd.ms-excel', tableHtml());
          U.toast('Excel file downloaded');
        } else if (kind === 'copy') {
          const text = plainRows().map(function (r) { return r.join('\t'); }).join('\n');
          if (navigator.clipboard) navigator.clipboard.writeText(text);
          U.toast('Copied to clipboard');
        } else {
          const w = window.open('', '_blank');
          if (!w) return U.toast('Allow pop-ups to print');
          w.document.write(
            '<html><head><title>' + base + '</title><style>' +
            'body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#333}' +
            'h2{margin:0 0 16px}table{border-collapse:collapse;width:100%;font-size:13px}' +
            'th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f4f4f6}' +
            '</style></head><body><h2>' + base.replace(/-/g, ' ') + '</h2>' + tableHtml() + '</body></html>'
          );
          w.document.close();
          w.focus();
          w.print();
        }
      });
    });

    function tableHtml() {
      const rows = plainRows();
      return (
        '<table><thead><tr>' + rows[0].map(function (h) { return '<th>' + U.esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.slice(1).map(function (r) {
          return '<tr>' + r.map(function (v) { return '<td>' + U.esc(v) + '</td>'; }).join('') + '</tr>';
        }).join('') +
        '</tbody></table>'
      );
    }

    render();
    return { render: render, state: state };
  }

  window.DataTable = DataTable;
})();
