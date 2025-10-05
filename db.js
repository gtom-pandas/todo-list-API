const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Erreur ouverture BD:', err);
  } else {
    console.log('Base SQLite connectée');
  }
});

module.exports = db;
