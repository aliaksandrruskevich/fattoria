// update-db-schema.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function updateTableSchema() {
  const dbPath = path.join(__dirname, 'properties.db');
  const db = new sqlite3.Database(dbPath);

  // Делаем поле title nullable
  db.run("ALTER TABLE properties RENAME TO properties_old", (err) => {
    if (err) {
      console.error('Error renaming table:', err);
      db.close();
      return;
    }

    // Создаем новую таблицу с nullable title
    const createTableSQL = `
      CREATE TABLE properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unid TEXT UNIQUE NOT NULL,
        title TEXT,
        code TEXT,
        agency_name TEXT,
        rooms TEXT,
        area_total TEXT,
        price TEXT,
        price_m2 TEXT,
        town_name TEXT,
        street_name TEXT,
        house_number TEXT,
        building_year TEXT,
        description TEXT,
        photos TEXT,
        state_region_name TEXT,
        town_district_name TEXT,
        contact_phone_1 TEXT,
        contact_name TEXT,
        terms TEXT,
        house_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('Error creating new table:', err);
        db.close();
        return;
      }

      // Копируем данные из старой таблицы
      db.run(`
        INSERT INTO properties (unid, title, code, agency_name, rooms, area_total, price, price_m2, town_name, street_name, house_number, building_year, description, photos, state_region_name, town_district_name, contact_phone_1, contact_name, terms, house_type)
        SELECT unid,
               CASE WHEN title IS NULL THEN
                 COALESCE(rooms || '-комн., ' || town_name || ', ул. ' || street_name || ', д. ' || house_number,
                         'Недвижимость #' || code)
               ELSE title END as title,
               code, agency_name, rooms, area_total, price, price_m2, town_name, street_name, house_number, building_year, description, photos, state_region_name, town_district_name, contact_phone_1, contact_name, terms, house_type
        FROM properties_old
      `, (err) => {
        if (err) {
          console.error('Error copying data:', err);
        } else {
          console.log('✅ Database schema updated successfully!');
        }

        db.close();
      });
    });
  });
}

updateTableSchema();
