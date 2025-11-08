// test-db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./properties.db");

console.log("🔍 Checking database structure...");

// роверим какие таблицы есть в базе
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error("❌ Error:", err.message);
    } else {
        console.log("📋 Tables in database:");
        tables.forEach(table => {
            console.log("   -", table.name);
        });
        
        const propertiesTable = tables.find(t => t.name === 'properties');
        if (propertiesTable) {
            console.log("✅ Table 'properties' exists!");
            
            // осчитаем записи
            db.get("SELECT COUNT(*) as count FROM properties", (err, row) => {
                if (err) {
                    console.error("❌ Count error:", err.message);
                } else {
                    console.log(`📊 Properties in table: ${row.count}`);
                    
                    // окажем несколько записей
                    db.all("SELECT unid, title, category FROM properties LIMIT 3", (err, rows) => {
                        if (err) {
                            console.error("❌ Select error:", err.message);
                        } else {
                            console.log("📝 Sample properties:");
                            rows.forEach(row => {
                                console.log(`   - ${row.title} (${row.category})`);
                            });
                        }
                        db.close();
                    });
                }
            });
        } else {
            console.log("❌ Table 'properties' does NOT exist!");
            db.close();
        }
    }
});
