/* =========================================================
   Hand-rolled SVG charts (no chart library, no CDN).
   Both charts re-render when the colour theme changes.
   ========================================================= */
(function () {
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* Monotone cubic interpolation — curves nicely without
     overshooting below the data (a plain spline dips under zero). */
  function smoothPath(pts) {
    const n = pts.length;
    if (n < 2) return '';
    const dx = [];
    const dy = [];
    const slope = [];
    for (let i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1][0] - pts[i][0];
      dy[i] = pts[i + 1][1] - pts[i][1];
      slope[i] = dy[i] / dx[i];
    }
    const m = [slope[0]];
    for (let i = 1; i < n - 1; i++) {
      if (slope[i - 1] * slope[i] <= 0) m[i] = 0;
      else {
        const w1 = 2 * dx[i] + dx[i - 1];
        const w2 = dx[i] + 2 * dx[i - 1];
        m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
      }
    }
    m[n - 1] = slope[n - 2];

    let d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (let i = 0; i < n - 1; i++) {
      const c1x = pts[i][0] + dx[i] / 3;
      const c1y = pts[i][1] + (m[i] * dx[i]) / 3;
      const c2x = pts[i + 1][0] - dx[i] / 3;
      const c2y = pts[i + 1][1] - (m[i + 1] * dx[i]) / 3;
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + pts[i + 1][0] + ',' + pts[i + 1][1];
    }
    return d;
  }

  function niceMax(v) {
    if (v <= 5) return 5;
    const step = Math.pow(10, Math.floor(Math.log10(v))) / 2;
    return Math.ceil(v / step) * step;
  }

  /**
   * Area/line chart.
   * @param {HTMLElement} el mount node
   * @param {{labels:string[], values:number[], color?:string}} data
   */
  function areaChart(el, data) {
    function draw() {
      /* a phone gets a squarer canvas, so the axis text does not shrink away
         when the wide desktop viewBox is scaled down to 350-odd pixels */
      const narrow = el.clientWidth > 0 && el.clientWidth < 520;
      const W = narrow ? 460 : 760;
      const H = narrow ? 300 : 330;
      const padL = narrow ? 34 : 44;
      const padR = 12;
      const padT = 14;
      const padB = 34;
      const grid = cssVar('--border-soft', '#eceaf0');
      const muted = cssVar('--muted', '#a5a3ae');
      const color = data.color || cssVar('--primary', '#16b3ae');

      const max = niceMax(Math.max.apply(null, data.values.concat([1])));
      const ticks = 6;
      const innerW = W - padL - padR;
      const innerH = H - padT - padB;
      const x = function (i) { return padL + (innerW * i) / Math.max(1, data.labels.length - 1); };
      const y = function (v) { return padT + innerH - (innerH * v) / max; };

      let g = '';
      for (let t = 0; t <= ticks; t++) {
        const val = (max / ticks) * t;
        const yy = y(val);
        g +=
          '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy +
          '" stroke="' + grid + '" stroke-width="1"/>' +
          '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="' +
          (narrow ? 15 : 13) + '" fill="' + muted + '">' + Math.round(val) + '</text>';
      }
      for (let i = 0; i < data.labels.length; i++) {
        g +=
          '<line x1="' + x(i) + '" y1="' + padT + '" x2="' + x(i) + '" y2="' + y(0) +
          '" stroke="' + grid + '" stroke-width="1"/>';
      }

      const pts = data.values.map(function (v, i) { return [x(i), y(v)]; });
      const line = smoothPath(pts);
      const area = line + ' L' + x(data.values.length - 1) + ',' + y(0) + ' L' + x(0) + ',' + y(0) + ' Z';

      let labels = '';
      let dots = '';
      data.labels.forEach(function (l, i) {
        labels +=
          '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="' +
          (narrow ? 15 : 13) + '" fill="' + muted + '">' + l + '</text>';
        dots +=
          '<circle cx="' + x(i) + '" cy="' + y(data.values[i]) + '" r="4.5" fill="' + cssVar('--card-bg', '#fff') +
          '" stroke="' + color + '" stroke-width="2.4"><title>' + l + ': ' + data.values[i] + ' orders</title></circle>';
      });

      el.innerHTML =
        '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Orders overview">' +
        '<defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.32"/>' +
        '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/></linearGradient></defs>' +
        g +
        '<path d="' + area + '" fill="url(#areaFill)"/>' +
        '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round"/>' +
        dots +
        labels +
        '</svg>';
    }

    draw();
    document.addEventListener('themechange', draw);
    /* the canvas shape follows the width, so redraw when that changes */
    if (typeof ResizeObserver === 'function') {
      let last = el.clientWidth < 520;
      new ResizeObserver(function () {
        const now = el.clientWidth < 520;
        if (now !== last) { last = now; draw(); }
      }).observe(el);
    }
    return { redraw: draw };
  }

  /**
   * Donut chart.
   * @param {HTMLElement} el mount node
   * @param {{label:string, value:number, color:string}[]} slices
   */
  function donutChart(el, slices) {
    function draw() {
      const size = 300;
      const c = size / 2;
      const r = 104;
      const sw = 70;
      const circ = 2 * Math.PI * r;
      const total = slices.reduce(function (a, s) { return a + s.value; }, 0);
      const track = cssVar('--border-soft', '#eceaf0');
      const gap = 4; /* small visual separator between slices */

      let arcs = '';
      if (!total) {
        arcs =
          '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + track +
          '" stroke-width="' + sw + '"/>';
      } else {
        let offset = 0;
        const visible = slices.filter(function (s) { return s.value > 0; });
        visible.forEach(function (s) {
          const len = (s.value / total) * circ;
          const dash = Math.max(0, len - gap);
          arcs +=
            '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + s.color +
            '" stroke-width="' + sw + '" stroke-dasharray="' + dash + ' ' + (circ - dash) +
            '" stroke-dashoffset="' + -offset + '" transform="rotate(-90 ' + c + ' ' + c + ')">' +
            '<title>' + s.label + ': ' + s.value + ' (' + Math.round((s.value / total) * 100) + '%)</title></circle>';
          offset += len;
        });
      }

      el.innerHTML =
        '<svg viewBox="0 0 ' + size + ' ' + size + '" style="max-width:300px" role="img" aria-label="Customer status">' +
        arcs +
        '</svg>';
    }

    draw();
    document.addEventListener('themechange', draw);
    return { redraw: draw };
  }

  window.Charts = { area: areaChart, donut: donutChart };
})();
