// import-json-to-db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function importJSONToDatabase() {
  console.log('🚀 STARTING JSON TO DATABASE IMPORT...');

  try {
    // 1. Читаем JSON файл
    const jsonPath = path.join(__dirname, 'data', 'properties.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found: ${jsonPath}`);
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📁 Loaded ${jsonData.length} properties from JSON`);

    // 2. Подключаемся к базе
    const db = new sqlite3.Database('./properties.db');

    // 3. Очищаем таблицу перед импортом
    db.run('DELETE FROM properties', (err) => {
      if (err) {
        console.error('Error clearing table:', err);
        db.close();
        return;
      }

      console.log('✅ Table cleared');

      // 4. Импортируем данные
      let imported = 0;
      let errors = 0;

      jsonData.forEach((property, index) => {
        const sql = `
          INSERT INTO properties
          (unid, title, code, agency_name, rooms, area_total, price, price_m2,
           town_name, street_name, house_number, building_year, description, photos,
           state_region_name, town_district_name, contact_phone_1, contact_name,
           terms, house_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          property.unid,
          property.title || `${property.rooms || ''}-комн., ${property.town_name || ''}`,
          property.code,
          property.agency_name,
          property.rooms,
          property.area_total,
          property.price,
          property.price_m2,
          property.town_name,
          property.street_name,
          property.house_number,
          property.building_year,
          property.description,
          typeof property.photos === 'string' ? property.photos : JSON.stringify(property.photos || []),
          property.state_region_name,
          property.town_district_name,
          property.contact_phone_1,
          property.contact_name,
          property.terms,
          property.house_type,
          property.created_at || new Date().toISOString(),
          property.updated_at || new Date().toISOString()
        ];

        db.run(sql, params, function(err) {
          if (err) {
            console.error(`❌ Error importing ${property.unid}:`, err.message);
            errors++;
          } else {
            imported++;
            if (imported % 50 === 0) {
              console.log(`📦 Imported ${imported} properties...`);
            }
          }

          // Когда все завершено
          if (imported + errors === jsonData.length) {
            console.log(`\n🎉 IMPORT COMPLETE:`);
            console.log(`- ✅ Successfully imported: ${imported} properties`);
            console.log(`- ❌ Errors: ${errors}`);

            // Проверяем итоговое количество
            db.get('SELECT COUNT(*) as count FROM properties', (err, row) => {
              if (err) {
                console.error('Error counting:', err);
              } else {
                console.log(`- 📊 Total in database: ${row.count} properties`);
              }

              db.close();
              console.log('💾 Database is now ready!');
            });
          }
        });
      });
    });

  } catch (error) {
    console.error('💥 Import failed:', error);
  }
}

importJSONToDatabase();
