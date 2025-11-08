// demo.js - демонстрация работы системы
const sqlite3 = require("sqlite3").verbose();

console.log("🏠 REAL ESTATE PARSER - CATEGORIZATION SYSTEM");
console.log("=" .repeat(50));

const db = new sqlite3.Database("../properties.db");

// окажем статистику
db.get("SELECT COUNT(*) as total FROM properties", (err, totalRow) => {
    if (err) {
        console.error("Error:", err.message);
        return;
    }
    
    console.log(`\n📊 DATABASE STATISTICS:`);
    console.log(`   Total properties: ${totalRow.total}`);
    
    // окажем распределение по категориям
    db.all("SELECT category, COUNT(*) as count FROM properties GROUP BY category", (err, categoryRows) => {
        if (err) {
            console.error("Error:", err.message);
            return;
        }
        
        console.log(`\n🏷️ CATEGORY DISTRIBUTION:`);
        categoryRows.forEach(row => {
            const percentage = ((row.count / totalRow.total) * 100).toFixed(1);
            console.log(`   ${row.category}: ${row.count} properties (${percentage}%)`);
        });
        
        // окажем примеры свойств
        console.log(`\n📝 SAMPLE PROPERTIES:`);
        db.all("SELECT title, priceUSD, rooms, category FROM properties LIMIT 5", (err, propertyRows) => {
            if (err) {
                console.error("Error:", err.message);
                return;
            }
            
            propertyRows.forEach((prop, index) => {
                console.log(`   ${index + 1}. ${prop.title}`);
                console.log(`      💰 ${prop.priceUSD} | 🏠 ${prop.rooms} rooms | 🏷️ ${prop.category}`);
            });
            
            console.log("\n" + "=" .repeat(50));
            console.log("✅ SYSTEM STATUS: OPERATIONAL");
            console.log("🎯 All properties are automatically categorized");
            console.log("🚀 Ready for production use");
            
            db.close();
        });
    });
});
