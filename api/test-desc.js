const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("../properties.db");

db.get("SELECT description FROM properties LIMIT 1", (err, row) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Raw description from DB:");
        console.log(row.description);
        console.log("Length:", row.description.length);
    }
    db.close();
});
