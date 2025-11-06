const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./properties.db');
db.run('UPDATE properties SET contact_phone_1="+375 (29) 190-00-88" WHERE contact_phone_1 IS NULL', function(err) {
    if (err) console.error(err);
    console.log('Updated:', this.changes);
    db.close();
});