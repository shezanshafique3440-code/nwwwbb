/* Feather-style inline SVG icons (no external dependencies). */
window.ICONS = (function () {
  const P = {
    home: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    cart:
      '<circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>' +
      '<path d="M2 3h2.2l2.5 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H6"/>',
    withdraw:
      '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10"/><path d="M14.5 9.2A2.6 2.6 0 0 0 12.4 8h-.8a2.1 2.1 0 0 0-.4 4.1l1.6.3a2.1 2.1 0 0 1-.4 4.1h-.8a2.6 2.6 0 0 1-2.1-1.2"/>',
    recharge:
      '<rect x="2" y="6" width="16" height="12" rx="3"/><path d="M18 10h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3"/><path d="M6 12h5"/>',
    products:
      '<path d="M6 7V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1"/><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M3 12h18"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' +
      '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13A4 4 0 0 1 16 11"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userCheck:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
    userAlert:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v5"/><path d="M20 17h.01"/>',
    dollar: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    sun:
      '<circle cx="12" cy="12" r="4.2"/><path d="M12 1.6v2"/><path d="M12 20.4v2"/><path d="M4.2 4.2l1.4 1.4"/>' +
      '<path d="M18.4 18.4l1.4 1.4"/><path d="M1.6 12h2"/><path d="M20.4 12h2"/><path d="M4.2 19.8l1.4-1.4"/><path d="M18.4 5.6l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    circle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/>',
    chevronRight: '<polyline points="9 18 15 12 9 6"/>',
    chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"/>',
    arrowRight: '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.7" y2="16.7"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 9 12 4 17 9"/><line x1="12" y1="4" x2="12" y2="16"/>',
    trash:
      '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
      '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    edit: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><polyline points="22 4 12 14.1 9 11.1"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/>' +
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.5.66.86 1.2.95H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    fileText:
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' +
      '<line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    printer:
      '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>' +
      '<rect x="6" y="14" width="12" height="8"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    toggleOn: '<rect x="1" y="6" width="22" height="12" rx="6"/><circle cx="17" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
    toggleOff: '<rect x="1" y="6" width="22" height="12" rx="6"/><circle cx="7" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
    restore: '<polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/>',
    archive: '<rect x="2" y="4" width="20" height="5" rx="1.5"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><polyline points="21 15 16 10 5 21"/>',
    link: '<path d="M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.3 1.3"/>' +
      '<path d="M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3"/>',
    facebook: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M14.5 8.5h-1.2a1.6 1.6 0 0 0-1.6 1.6V12h2.6l-.4 2.6h-2.2V21"/><path d="M9.6 12h2.1"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.4 10.5V17"/><circle cx="7.4" cy="7.6" r="0.9"/>' +
      '<path d="M11 17v-3.6a2.4 2.4 0 0 1 4.8 0V17"/><path d="M11 10.6V17"/>',
    skype: '<circle cx="12" cy="12" r="9"/><path d="M15 9.4a3.2 3.2 0 0 0-2.7-1.2h-.6a2.1 2.1 0 0 0-.4 4.1l1.6.4a2.1 2.1 0 0 1-.4 4.1h-.6A3.2 3.2 0 0 1 9 15.6"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r="1"/>',
    github: '<path d="M9 19c-4 1.3-4-2.2-5.6-2.7M15 21v-3.4c0-1 .1-1.7-.5-2.3 2.4-.3 4.8-1.2 4.8-5.2a4 4 0 0 0-1.1-2.8 3.7 3.7 0 0 0-.1-2.8s-.9-.3-3 1.1a10.3 10.3 0 0 0-5.4 0C7.6 4.5 6.7 4.8 6.7 4.8a3.7 3.7 0 0 0-.1 2.8A4 4 0 0 0 5.5 10.4c0 4 2.4 4.9 4.7 5.2-.4.4-.5.9-.5 1.5V21"/>',
    star: '<path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z"/>',
    tasks: '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>' +
      '<polyline points="9 12 11 14 15 10"/>',
    crown: '<path d="M3 8l4.5 3.2L12 5l4.5 6.2L21 8l-1.7 10.2a1.5 1.5 0 0 1-1.5 1.3H6.2a1.5 1.5 0 0 1-1.5-1.3z"/>',
    sortAsc: '<polyline points="6 15 12 9 18 15"/>',
    sortDesc: '<polyline points="6 9 12 15 18 9"/>',
    sortNone: '<polyline points="8 10 12 6 16 10"/><polyline points="8 14 12 18 16 14"/>'
  };

  /**
   * Build an inline SVG string for a named icon.
   * @param {string} name key of the path table
   * @param {number} size pixel size, defaults to 20
   * @param {string} cls optional css class
   */
  function icon(name, size, cls) {
    const body = P[name] || '';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + (size || 20) + '" height="' + (size || 20) + '"' +
      ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"' +
      ' stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      body +
      '</svg>'
    );
  }

  icon.paths = P;
  return icon;
})();
