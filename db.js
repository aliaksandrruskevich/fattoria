const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к файлу базы данных
const dbPath = path.join(__dirname, 'properties.db');

// Создание подключения к базе данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
        initDatabase();
    }
});

// Инициализация базы данных
function initDatabase() {
    db.serialize(() => {
        // Создание таблицы properties
        db.run(`
            CREATE TABLE IF NOT EXISTS properties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unid TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                price REAL,
                currency TEXT DEFAULT 'USD',
                location TEXT,
                type TEXT,
                photos TEXT, -- JSON string
                lat REAL,
                lng REAL,
                contact_name TEXT,
                contact_phone TEXT,
                features TEXT, -- JSON string
                archive INTEGER DEFAULT 0,
                last_update DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы:', err.message);
            } else {
                console.log('Таблица properties создана или уже существует.');
                // Миграция данных из JSON, если таблица пустая
                migrateDataFromJSON();
            }
        });

        // Создание индексов для производительности
        db.run(`CREATE INDEX IF NOT EXISTS idx_unid ON properties(unid)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_type ON properties(type)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_price ON properties(price)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_location ON properties(location)`);
    });
}

// Миграция данных из JSON файла
function migrateDataFromJSON() {
    const jsonPath = path.join(__dirname, 'data', 'properties.json');

    if (!fs.existsSync(jsonPath)) {
        console.log('JSON файл не найден, пропускаем миграцию.');
        return;
    }

    db.get("SELECT COUNT(*) as count FROM properties", (err, row) => {
        if (err) {
            console.error('Ошибка проверки данных:', err.message);
            return;
        }

        if (row.count > 0) {
            console.log('База данных уже содержит данные, миграция пропущена.');
            return;
        }

        console.log('Начинаем миграцию данных из JSON...');

        try {
            const data = fs.readFileSync(jsonPath, 'utf8');
            const properties = JSON.parse(data);

            const stmt = db.prepare(`
                INSERT INTO properties (
                    unid, title, description, price, currency, location, type,
                    photos, lat, lng, contact_name, contact_phone, features
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            let migrated = 0;
            properties.forEach(property => {
                stmt.run(
                    property.unid,
                    property.title,
                    property.description,
                    property.price,
                    property.currency || 'USD',
                    property.location,
                    property.type,
                    JSON.stringify(property.photos || []),
                    property.lat,
                    property.lng,
                    property.contact_name,
                    property.contact_phone,
                    JSON.stringify(property.features || [])
                );
                migrated++;
            });

            stmt.finalize();
            console.log(`Миграция завершена. Перенесено ${migrated} объектов.`);

        } catch (error) {
            console.error('Ошибка миграции данных:', error.message);
        }
    });
}

// Функции для работы с данными
const databaseFunctions = {
    // Получение всех свойств с фильтрами и пагинацией
    getProperties: (filters = {}, limit = 12, offset = 0) => {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM properties WHERE archive = 0`;
            let params = [];

            // Фильтры
            if (filters.type) {
                query += ` AND type LIKE ?`;
                params.push(`%${filters.type}%`);
            }

            if (filters.price_max) {
                query += ` AND price <= ?`;
                params.push(filters.price_max);
            }

            if (filters.area_min) {
                // Предполагаем, что area хранится в description или нужно добавить поле
                // Пока пропустим, можно расширить позже
            }

            if (filters.area_max) {
                // Аналогично
            }

            if (filters.rooms) {
                query += ` AND rooms = ?`;
                params.push(filters.rooms);
            }

            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            console.log('getProperties query:', query);
            console.log('getProperties params:', params);

            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Преобразование JSON строк обратно в объекты
                    rows.forEach(row => {
                        try {
                            row.photos = JSON.parse(row.photos || '[]');
                            row.features = JSON.parse(row.features || '[]');
                        } catch (e) {
                            row.photos = [];
                            row.features = [];
                        }
                    });

                    // Получаем общее количество для пагинации
                    const countQuery = `SELECT COUNT(*) as total FROM properties WHERE archive = 0`;
                    let countParams = [];

                    // Применяем те же фильтры для count, что и для основного запроса
                    if (filters.type) {
                        countQuery += ` AND type LIKE ?`;
                        countParams.push(`%${filters.type}%`);
                    }

                    if (filters.price_max) {
                        countQuery += ` AND price <= ?`;
                        countParams.push(filters.price_max);
                    }

                    if (filters.area_min) {
                        // Пока пропустим
                    }

                    if (filters.area_max) {
                        // Пока пропустим
                    }

                    if (filters.rooms) {
                        countQuery += ` AND rooms = ?`;
                        countParams.push(filters.rooms);
                    }

                    db.get(countQuery, countParams, (countErr, countRow) => {
                        if (countErr) {
                            console.error('Count query error:', countErr);
                            resolve({ properties: rows, totalCount: rows.length });
                        } else {
                            resolve({
                                properties: rows,
                                totalCount: countRow.total,
                                hasMore: (offset + limit) < countRow.total
                            });
                        }
                    });
                }
            });
        });
    },

    // Получение свойства по unid
    getPropertyByUnid: (unid) => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM properties WHERE unid = ?`, [unid], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    // Преобразование JSON строк
                    try {
                        row.photos = JSON.parse(row.photos || '[]');
                        row.features = JSON.parse(row.features || '[]');
                    } catch (e) {
                        row.photos = [];
                        row.features = [];
                    }
                    resolve(row);
                } else {
                    resolve(null);
                }
            });
        });
    },

    // Добавление нового свойства
    addProperty: (property) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO properties (
                    unid, title, description, price, currency, location, type,
                    photos, lat, lng, contact_name, contact_phone, features
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                property.unid,
                property.title,
                property.description,
                property.price,
                property.currency || 'USD',
                property.location,
                property.type,
                JSON.stringify(property.photos || []),
                property.lat,
                property.lng,
                property.contact_name,
                property.contact_phone,
                JSON.stringify(property.features || [])
            , function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, unid: property.unid });
                }
            });

            stmt.finalize();
        });
    },

    // Обновление свойства
    updateProperty: (unid, updates) => {
        return new Promise((resolve, reject) => {
            const fields = [];
            const params = [];

            Object.keys(updates).forEach(key => {
                if (['photos', 'features'].includes(key)) {
                    fields.push(`${key} = ?`);
                    params.push(JSON.stringify(updates[key] || []));
                } else {
                    fields.push(`${key} = ?`);
                    params.push(updates[key]);
                }
            });

            fields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(unid);

            const query = `UPDATE properties SET ${fields.join(', ')} WHERE unid = ?`;

            db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    },

    // Удаление свойства
    deleteProperty: (unid) => {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM properties WHERE unid = ?`, [unid], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    },

    // Архивация отсутствующих свойств
    archiveMissingProperties: (currentUnids) => {
        return new Promise((resolve, reject) => {
            if (!currentUnids || currentUnids.length === 0) {
                resolve(0);
                return;
            }

            const placeholders = currentUnids.map(() => '?').join(',');
            const query = `UPDATE properties SET archive = 1 WHERE unid NOT IN (${placeholders}) AND archive = 0`;

            db.run(query, currentUnids, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    },

    // Вставка или обновление свойства
    insertProperty: (property) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO properties (
                    unid, title, description, price, currency, location, type,
                    photos, lat, lng, contact_name, contact_phone, features, archive
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                property.unid,
                property.title,
                property.description,
                property.price,
                property.currency || 'USD',
                property.location,
                property.type,
                JSON.stringify(property.photos || []),
                property.lat,
                property.lng,
                property.contact_name,
                property.contact_phone,
                JSON.stringify(property.features || []),
                property.archive || 0
            , function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, unid: property.unid });
                }
            });

            stmt.finalize();
        });
    },

    // Получение активных свойств
    getActiveProperties: (limit = 12, offset = 0, filters = {}) => {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM properties WHERE archive = 0`;
            let params = [];

            // Фильтры
            if (filters.type) {
                query += ` AND type LIKE ?`;
                params.push(`%${filters.type}%`);
            }

            if (filters.price_max) {
                query += ` AND price <= ?`;
                params.push(filters.price_max);
            }

            if (filters.area_min) {
                // Предполагаем, что area хранится в description или нужно добавить поле
                // Пока пропустим, можно расширить позже
            }

            if (filters.area_max) {
                // Аналогично
            }

            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Преобразование JSON строк обратно в объекты
                    rows.forEach(row => {
                        try {
                            row.photos = JSON.parse(row.photos || '[]');
                            row.features = JSON.parse(row.features || '[]');
                        } catch (e) {
                            row.photos = [];
                            row.features = [];
                        }
                    });
                                       resolve(rows);
                }
            });
        });
    },  // ← запятая после getActiveProperties

    // Получение общего количества объектов
    getPropertiesCount: () => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count FROM properties WHERE archive = 0';
            db.get(query, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }
};  // ← закрывающая скобка объекта databaseFunctions

module.exports = { db, ...databaseFunctions };