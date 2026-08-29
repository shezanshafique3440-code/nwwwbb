/* Drops the SQLite file so the next start re-seeds from assets/js/data.js. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = process.env.CLUB21_DB || path.join(__dirname, 'data', 'club21.db');
['', '-wal', '-shm'].forEach(function (suffix) {
  const target = file + suffix;
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    console.log('removed ' + path.relative(process.cwd(), target));
  }
});
console.log('Database cleared — it will be re-seeded on the next start.');
