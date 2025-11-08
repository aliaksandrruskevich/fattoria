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
        // Создание таблицы properties с ВСЕМИ необходимыми полями
        db.run(`
            CREATE TABLE IF NOT EXISTS properties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unid TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                address TEXT,
                district TEXT,
                area TEXT,
                details TEXT,
                priceBYN TEXT,
                priceUSD TEXT,
                type TEXT,
                code TEXT,
                agency_name TEXT,
                rooms TEXT,
                area_total TEXT,
                area_living TEXT,
                area_kitchen TEXT,
                price REAL,
                town_name TEXT,
                street_name TEXT,
                house_number TEXT,
                building_year TEXT,
                storey TEXT,
                storeys TEXT,
                description TEXT,
                photos TEXT,
                state_region_name TEXT,
                town_district_name TEXT,
                contact_phone_1 TEXT,
                contact_name TEXT,
                contact_email TEXT,
                terms TEXT,
                house_type TEXT,
                category TEXT DEFAULT 'Наши квартиры',
                additional_params TEXT,
                last_updated TEXT,
                archive INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы:', err.message);
            } else {
                console.log('✅ Таблица properties создана или уже существует.');
            }
        });

        // Создание индексов для производительности
        db.run(`CREATE INDEX IF NOT EXISTS idx_unid ON properties(unid)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_type ON properties(type)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_price ON properties(price)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_category ON properties(category)`);
    });
}

// Функции для работы с данными
const databaseFunctions = {
    // Вставка или обновление свойства
    insertProperty: function(property) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO properties (
                    unid, title, address, district, area, details, priceBYN, priceUSD, 
                    type, code, agency_name, rooms, area_total, area_living, area_kitchen, 
                    price, town_name, street_name, house_number, building_year, storey, 
                    storeys, description, photos, state_region_name, town_district_name, 
                    contact_phone_1, contact_name, contact_email, terms, house_type,
                    category, additional_params, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                property.unid, 
                property.title, 
                property.address, 
                property.district, 
                property.area, 
                property.details, 
                property.priceBYN, 
                property.priceUSD,
                property.type, 
                property.code, 
                property.agency_name, 
                property.rooms,
                property.area_total, 
                property.area_living, 
                property.area_kitchen,
                property.price, 
                property.town_name, 
                property.street_name,
                property.house_number, 
                property.building_year, 
                property.storey,
                property.storeys, 
                property.description, 
                Array.isArray(property.photos) ? property.photos.join('|') : property.photos,
                property.state_region_name, 
                property.town_district_name,
                property.contact_phone_1, 
                property.contact_name, 
                property.contact_email || "",
                property.terms, 
                property.house_type,
                property.category || "Наши квартиры",
                property.additional_params || "{}",
                property.last_updated || new Date().toISOString()
            ];

            db.run(query, params, function(err) {
                if (err) {
                    console.error('❌ Database insert error:', err);
                    reject(err);
                } else {
                    console.log(`✅ Property ${property.unid} saved (category: ${property.category || "Наши квартиры"})`);
                    resolve(this.lastID);
                }
            });
        });
    },

    // Архивация отсутствующих свойств
    archiveMissingProperties: function(currentUnids) {
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
                    console.log(`📁 Archived ${this.changes} properties`);
                    resolve(this.changes);
                }
            });
        });
    },

    // Получение свойств с фильтрами и пагинацией
    getProperties: function(filters = {}, limit = 12, offset = 0) {
        return new Promise((resolve, reject) => {
            let whereConditions = ["archive != 1"];
            let params = [];

            // Фильтр по категории
            if (filters.category) {
                whereConditions.push("category = ?");
                params.push(filters.category);
            }
            
            if (filters.type) {
                whereConditions.push("type LIKE ?");
                params.push("%" + filters.type + "%");
            }

            if (filters.price_max) {
                whereConditions.push("CAST(price AS REAL) <= ?");
                params.push(filters.price_max);
            }

            if (filters.area_min) {
                whereConditions.push("CAST(area_total AS FLOAT) >= ?");
                params.push(filters.area_min);
            }

            if (filters.area_max) {
                whereConditions.push("CAST(area_total AS FLOAT) <= ?");
                params.push(filters.area_max);
            }

            if (filters.rooms) {
                whereConditions.push("rooms = ?");
                params.push(filters.rooms);
            }

            const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";
            params.push(limit, offset);
            
            const query = `
                SELECT * FROM properties
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;

            const countQuery = `
                SELECT COUNT(*) as total FROM properties
                ${whereClause}
            `;

            const countParams = params.slice(0, -2);

            db.get(countQuery, countParams, (countErr, countRow) => {
                if (countErr) {
                    console.error("Count query error:", countErr);
                    reject(countErr);
                    return;
                }

                const totalCount = countRow ? countRow.total : 0;

                db.all(query, params, (err, rows) => {
                    if (err) {
                        console.error("Database error:", err);
                        reject(err);
                    } else {
                        // Парсим photos из строки в массив
                        const properties = rows.map(row => ({
                            ...row,
                            photos: row.photos ? row.photos.split('|').filter(photo => photo) : []
                        }));

                        resolve({
                            properties: properties,
                            totalCount: totalCount,
                            hasMore: (offset + limit) < totalCount
                        });
                    }
                });
            });
        });
    },

    // Получение свойства по unid
    getPropertyByUnid: function(unid) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM properties WHERE unid = ?`, [unid], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    // Парсим photos из строки в массив
                    row.photos = row.photos ? row.photos.split('|').filter(photo => photo) : [];
                    resolve(row);
                } else {
                    resolve(null);
                }
            });
        });
    },

    // Получение статистики по категориям
    getCategoryStats: function() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT category, COUNT(*) as count 
                FROM properties 
                WHERE archive != 1 
                GROUP BY category
            `;
            
            db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const stats = {};
                    rows.forEach(row => {
                        stats[row.category] = row.count;
                    });
                    resolve(stats);
                }
            });
        });
    },

    // Получение активных свойств
    getActiveProperties: function(limit = 12, offset = 0, filters = {}) {
        return this.getProperties(filters, limit, offset);
    },

    // Получение общего количества объектов
    getPropertiesCount: function() {
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
};

module.exports = { db, ...databaseFunctions };