// full-clean-sync.js
const { fetchAndSyncProperties } = require('./api/properties.js');
const sqlite3 = require('sqlite3').verbose();

async function fullCleanSync() {
  console.log('🧹 ПОЛНАЯ ОЧИСТКА И СИНХРОНИЗАЦИЯ...');

  const db = new sqlite3.Database('./properties.db');

  try {
    // 1. Очищаем таблицу
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM properties', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Таблица очищена');

    // 2. Запускаем синхронизацию
    await fetchAndSyncProperties();
    console.log('✅ Синхронизация завершена');

    // 3. Проверяем результат
    const properties = await new Promise((resolve, reject) => {
      db.all('SELECT COUNT(*) as count FROM properties', (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0].count);
      });
    });
    console.log(`📊 В базе: ${properties} свойств`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    db.close();
  }
}

fullCleanSync();
