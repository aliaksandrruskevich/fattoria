// migrate-data.js
const sqlite3 = require('sqlite3').verbose();

function migrateData() {
  console.log('🔄 MIGRATING AND ENHANCING DATA...');

  const db = new sqlite3.Database('./properties.db');

  // Обновляем заголовки и цены
  db.all("SELECT id, unid, rooms, town_name, street_name, house_number, price FROM properties", (err, rows) => {
    if (err) {
      console.error('Error reading data:', err);
      db.close();
      return;
    }

    console.log(`📝 Updating ${rows.length} properties...`);

    let updated = 0;
    rows.forEach(row => {
      // Генерируем красивый заголовок
      const parts = [];
      if (row.rooms) parts.push(`${row.rooms}-комн. квартира`);
      if (row.town_name) parts.push(row.town_name);
      if (row.street_name) parts.push(`ул. ${row.street_name}`);
      if (row.house_number) parts.push(`д. ${row.house_number}`);

      const newTitle = parts.length > 0 ? parts.join(', ') : 'Объект недвижимости';

      // Форматируем цену
      let newPrice = row.price;
      if (row.price && typeof row.price === 'string' && !row.price.includes('$')) {
        newPrice = `${parseInt(row.price).toLocaleString('ru-RU')}$`;
      }

      db.run(
        "UPDATE properties SET title = ?, price = ? WHERE id = ?",
        [newTitle, newPrice, row.id],
        (err) => {
          if (err) {
            console.error(`Error updating ${row.unid}:`, err);
          } else {
            updated++;
          }

          if (updated === rows.length) {
            console.log(`✅ Updated ${updated} properties`);
            db.close();
          }
        }
      );
    });
  });
}

migrateData();
