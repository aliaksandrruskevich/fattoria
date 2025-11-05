// fix-database-schema.js
const sqlite3 = require('sqlite3').verbose();

function fixDatabaseSchema() {
  console.log('🔧 FIXING DATABASE SCHEMA...');

  const db = new sqlite3.Database('./properties.db');

  // Добавляем отсутствующие поля
  const alterQueries = [
    "ALTER TABLE properties ADD COLUMN type TEXT DEFAULT 'apartment'",
    "ALTER TABLE properties ADD COLUMN archive INTEGER DEFAULT 0"
  ];

  let completed = 0;

  alterQueries.forEach((query, index) => {
    db.run(query, (err) => {
      if (err) {
        // Игнорируем ошибку если колонка уже существует
        if (!err.message.includes('duplicate column name')) {
          console.error(`Error adding column ${index + 1}:`, err.message);
        }
      } else {
        console.log(`✅ Added column for query: ${query.split('ADD COLUMN ')[1]}`);
      }

      completed++;
      if (completed === alterQueries.length) {
        console.log('🎉 Database schema fixed!');

        // Проверим структуру
        db.all("PRAGMA table_info(properties)", (err, rows) => {
          if (!err) {
            console.log('\n📊 UPDATED TABLE STRUCTURE:');
            rows.forEach(row => {
              console.log(`- ${row.name} (${row.type})`);
            });
          }
          db.close();
        });
      }
    });
  });
}

fixDatabaseSchema();
