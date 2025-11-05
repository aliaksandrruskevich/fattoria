// update-titles.js
const sqlite3 = require('sqlite3').verbose();
const { generateTitle, formatPrice, cleanDescription } = require('./api/properties.js');

function updateTitlesInDatabase() {
  console.log('🔄 UPDATING TITLES AND PRICES IN DATABASE...');

  const db = new sqlite3.Database('./properties.db');

  // Получаем все свойства
  db.all("SELECT id, unid, title, rooms, town_name, street_name, house_number, price, description FROM properties", (err, rows) => {
    if (err) {
      console.error('Error reading properties:', err);
      db.close();
      return;
    }

    console.log(`📝 Updating ${rows.length} properties...`);

    let updated = 0;
    rows.forEach(row => {
      const newTitle = generateTitle(row);
      const newPrice = formatPrice(row.price);
      const newDescription = cleanDescription(row.description);

      db.run(
        "UPDATE properties SET title = ?, price = ?, description = ? WHERE id = ?",
        [newTitle, newPrice, newDescription, row.id],
        (err) => {
          if (err) {
            console.error(`Error updating ${row.unid}:`, err);
          } else {
            updated++;
            if (updated % 50 === 0) {
              console.log(`✅ Updated ${updated} properties...`);
            }
          }

          if (updated === rows.length) {
            console.log(`🎉 Finished updating ${updated} properties`);
            db.close();
          }
        }
      );
    });
  });
}

updateTitlesInDatabase();
