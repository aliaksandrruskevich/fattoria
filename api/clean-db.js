const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("../properties.db");

// даляем все записи с неправильной кодировкой
db.run("DELETE FROM properties WHERE category IN ('??? ????????', '????????? ????????????')", function(err) {
    if (err) {
        console.error("Error deleting records:", err);
    } else {
        console.log(`Deleted ${this.changes} records with wrong encoding`);
    }
    
    // роверяем оставшиеся записи
    db.all("SELECT category, COUNT(*) as count FROM properties GROUP BY category", (err, rows) => {
        if (err) {
            console.error("Error:", err);
        } else {
            console.log("\nRemaining categories:");
            rows.forEach(row => {
                console.log(`Category: "${row.category}", Count: ${row.count}`);
            });
        }
        db.close();
    });
});
