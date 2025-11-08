const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("../properties.db");

db.all("SELECT category, COUNT(*) as count FROM properties GROUP BY category", (err, rows) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Categories in database:");
        rows.forEach(row => {
            console.log(`Category: "${row.category}", Count: ${row.count}`);
        });
    }
    db.close();
});
