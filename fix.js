// fix.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./properties.db");

console.log("🗑️ Dropping old table...");
db.run("DROP TABLE IF EXISTS properties", () => {
    console.log("✅ Old table dropped");
    
    console.log("🔄 Creating new table with ALL columns...");
    db.exec(`
        CREATE TABLE properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unid TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            address TEXT, district TEXT, area TEXT, details TEXT,
            priceBYN TEXT, priceUSD TEXT, type TEXT, code TEXT,
            agency_name TEXT, rooms TEXT, area_total TEXT, area_living TEXT, area_kitchen TEXT,
            price REAL, town_name TEXT, street_name TEXT, house_number TEXT,
            building_year TEXT, storey TEXT, storeys TEXT, description TEXT,
            photos TEXT, state_region_name TEXT, town_district_name TEXT,
            contact_phone_1 TEXT, contact_name TEXT, contact_email TEXT,
            terms TEXT, house_type TEXT, category TEXT DEFAULT "аши квартиры",
            additional_params TEXT, last_updated TEXT, archive INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_unid ON properties(unid);
        CREATE INDEX idx_category ON properties(category);
        CREATE INDEX idx_type ON properties(type);
    `, (err) => {
        if (err) {
            console.error("❌ Error creating table:", err.message);
        } else {
            console.log("✅ Table created successfully with ALL columns!");
        }
        db.close(() => {
            console.log("🎉 Database ready! Now run: cd api && node properties.js");
        });
    });
});
