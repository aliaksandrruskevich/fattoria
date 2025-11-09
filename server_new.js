const express = require("express");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const { getProperties, getPropertyByUnid } = require("./db");
const { handleFormSubmission } = require("./bitrix");
const { fetchAndSyncProperties } = require("./api/properties");
const app = express();
const PORT = process.env.PORT || 3000;

// Функция для исправления двойной кодировки
// Функция для исправления двойной кодировки
function decodeDoubleEncoding(text) {
    if (!text || typeof text !== 'string') return text;
    
    try {
        // Если текст содержит escape-последовательности Unicode, декодируем их
        if (text.includes('\\u')) {
            return text.replace(/\\u[\dA-F]{4}/gi, 
                match => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));
        }
        
        return text;
    } catch (error) {
        console.error('Error decoding text:', error);
        return text;
    }
} 

// Безопасность - Helmet для автоматических заголовков
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://api-maps.yandex.ru", "https://www.googletagmanager.com", "https://yastatic.net", "https://unpkg.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://api-maps.yandex.ru", "https://www.google-analytics.com", "https://cdn.jsdelivr.net"],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
}));

// Middleware для парсинга JSON с увеличенным лимитом
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Middleware для CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
    } else {
        next();
    }
});

// HTTP кэширование для статических файлов
app.use((req, res, next) => {
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 год
    }
    next();
});

// Обслуживаем статические файлы из папки public
app.use(express.static("public"));

// Маршруты без .html
app.get('/object', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "object.html"));
});

app.get('/properties', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "properties.html"));
});

app.get('/new-buildings', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "new-buildings.html"));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get('/services-buyers', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "services-buyers.html"));
});

app.get('/services-sellers', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "services-sellers.html"));
});

app.get('/information', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "information.html"));
});

app.get('/founders', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "founders.html"));
});

app.get('/staff', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "staff.html"));
});

app.get('/api/employees', (req, res) => {
    const { getEmployees } = require('./api/employees');
    getEmployees(req, res);
});

app.get('/tariff-grid', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "tariff-grid.html"));
});

app.get('/article', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "article.html"));
});

app.get('/category', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "category.html"));
});

/// Маршруты для жилых комплексов (латинские URL)
app.get('/jk/verhina', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-вершина.html"));
});

app.get('/jk/depo', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-депо.html"));
});

app.get('/jk/dubravinsky', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-дубравинский.html"));
});

app.get('/jk/zelenaya-gavan', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-зеленая-гавань.html"));
});

app.get('/jk/komfort-park', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-комфорт-парк.html"));
});

app.get('/jk/levada', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-левада.html"));
});

app.get('/jk/mayak-minska', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-маяк-минска.html"));
});

app.get('/jk/minsk-mir', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-минск-мир.html"));
});

app.get('/jk/novaya-borovaya', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-новая-боровая.html"));
});

app.get('/jk/park-chelyuskincev', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-парк-челюскинцев.html"));
});

app.get('/jk/farforovy', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-фарфоровый.html"));
});
app.get('/jk/levada', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-левада.html"));
});

app.get('/jk/minsk-mir', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-минск-мир.html"));
});

app.get('/jk/novaya-borovaya', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-новая-боровая.html"));
});

app.get('/jk/park-chelyuskincev', (req, res) => {
    res.sendFile(path.join(__dirname, "новостройки", "жк-парк-челюскинцев.html"));
});
// Если нет папки public, обслуживаем из корня
app.use(express.static("."));

// Маршрут для страниц объектов
app.get("/object/:unid", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "object.html"));
});

// Главная страница
app.get("/", (req, res) => {
    // Сначала ищем index.html в public, потом в корне
    if (fs.existsSync(path.join(__dirname, "public", "index.html"))) {
        res.sendFile(path.join(__dirname, "public", "index.html"));
    } else {
        res.sendFile(path.join(__dirname, "index.html"));
    }
});

// API маршрут для свойств
app.get("/api/properties", async (req, res) => {
    try {
        // Пагинация - исправлено для поддержки page/limit параметров
        let limit = parseInt(req.query.limit) || 12;
        let offset = parseInt(req.query.offset) || 0;

        // Поддержка page параметра для пагинации
        if (req.query.page) {
            const page = parseInt(req.query.page) || 1;
            offset = (page - 1) * limit;
        }

        // Фильтры
        const filters = {};
        if (req.query.type) {
            filters.type = req.query.type;
        }
        if (req.query.price_max) {
            filters.price_max = parseInt(req.query.price_max);
        }
        if (req.query.area_min) {
            filters.area_min = parseFloat(req.query.area_min);
        }
        if (req.query.area_max) {
            filters.area_max = parseFloat(req.query.area_max);
        }
        if (req.query.rooms) {
            filters.rooms = req.query.rooms;
        }

        console.log("API call: /api/properties with limit:", limit, "offset:", offset, "page:", req.query.page, "filters:", filters);

        const result = await getProperties(filters, limit, offset);

        let properties = [];
        if (Array.isArray(result)) {
            properties = result;
        } else if (result && Array.isArray(result.properties)) {
            properties = result.properties;
        } else {
            console.error("getProperties returned invalid result:", result);
            return res.status(500).json({ error: "Invalid data from database" });
        }

        // 🔥 ИСПРАВЛЕНИЕ КОДИРОВКИ
        const fixedProperties = properties.map(property => ({
            ...property,
            contact_name: decodeDoubleEncoding(property.contact_name),
            extra_info: decodeDoubleEncoding(property.extra_info),
            description: decodeDoubleEncoding(property.description)
        }));

        res.json(fixedProperties);
    } catch (error) {
        console.error("Ошибка получения свойств:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API маршрут для одного свойства
app.get("/api/property/:unid", async (req, res) => {
    try {
        const property = await getPropertyByUnid(req.params.unid);

        if (property) {
            // 🔥 ИСПРАВЛЕНИЕ КОДИРОВКИ
            const fixedProperty = {
                ...property,
                contact_name: decodeDoubleEncoding(property.contact_name),
                extra_info: decodeDoubleEncoding(property.extra_info),
                description: decodeDoubleEncoding(property.description)
            };
            res.json(fixedProperty);
        } else {
            res.status(404).json({ error: "Property not found" });
        }
    } catch (error) {
        console.error("Ошибка получения свойства:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API маршрут для отправки форм в Bitrix24
app.post("/api/submit-form", async (req, res) => {
    try {
        const { name, contact, email, message, subject, propertyUnid, propertyTitle, source } = req.body;

        const formData = {
            name: name || "",
            phone: contact || "",
            email: email || "",
            message: message || "",
            subject: subject || "Заявка с сайта",
            propertyUnid: propertyUnid || "",
            propertyTitle: propertyTitle || "",
            source: source || "website"
        };

        const result = await handleFormSubmission("lead", formData);

        if (result.success) {
            res.json({
                success: true,
                message: "Заявка успешно отправлена!",
                leadId: result.leadId
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Ошибка отправки заявки: " + result.error
            });
        }
    } catch (error) {
        console.error("Ошибка обработки формы:", error);
        res.status(500).json({
            success: false,
            message: "Внутренняя ошибка сервера"
        });
    }
});

// Запуск сервера
app.listen(PORT, async () => {
    console.log("Server running on http://localhost:" + PORT);
    console.log("Project directory:", __dirname);

    // Добавляем недостающие столбцы и только потом начинаем миграцию
    const sqlite3 = require("sqlite3").verbose();
    const db = new sqlite3.Database("./properties.db");

    // Добавляем все недостающие столбцы
    const columnsToAdd = ["location", "lat", "lng", "contact_name", "contact_phone", "features", "archive", "last_update"];

    let columnsAdded = 0;
    columnsToAdd.forEach((column, index) => {
        db.run(`ALTER TABLE properties ADD COLUMN ${column} ${column === "archive" ? "INTEGER DEFAULT 0" : "TEXT"}`, (err) => {
            if (err) {
                console.log(`Столбец ${column} уже существует`);
            } else {
                console.log(`✅ Столбец ${column} добавлен`);
            }

            columnsAdded++;
            if (columnsAdded === columnsToAdd.length) {
                // Начинаем миграцию только после добавления всех столбцов
                console.log("Начинаем миграцию данных из JSON...");
                startMigration();
            }
        });
    });

    async function startMigration() {
        // Синхронизация данных при запуске
        try {
            await fetchAndSyncProperties();
            console.log("Initial data sync completed");
        } catch (err) {
            console.error("Error during initial data sync:", err);
            console.log("Using existing database data");
            // Не прерываем работу приложения
        }

        // Запускаем периодическую синхронизацию каждый час
        setInterval(async () => {
            try {
                console.log("🔄 Starting scheduled data sync...");
                await fetchAndSyncProperties();
                console.log("✅ Scheduled sync completed");
            } catch (err) {
                console.error("❌ Scheduled sync failed:", err);
            }
        }, 60 * 60 * 1000); // Каждый час
    }
});

// Новый API endpoint с исправленными фото
app.get('/api/properties-with-photos', (req, res) => {
    try {
        const properties = require('./debug_properties_full.json');
        
        // Преобразуем структуру фото
        const propertiesWithFixedPhotos = properties.map(property => {
            // Если фото уже в правильном формате, оставляем как есть
            if (Array.isArray(property.photos) && property.photos.length > 0 && typeof property.photos[0] === 'string') {
                return property;
            }
            
            // Если фото в формате объектов, преобразуем в массив URL
            if (Array.isArray(property.photos) && property.photos.length > 0 && property.photos[0].$ && property.photos[0].$.picture) {
                return {
                    ...property,
                    photos: property.photos.map(photo => photo.$.picture),
                    photoCount: property.photos.length,
                    mainPhoto: property.photos[0]?.$.picture || null
                };
            }
            
            return property;
        });
        
        res.json(propertiesWithFixedPhotos);
    } catch (error) {
        console.error('Error serving properties with photos:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint для подсчета объектов
app.get('/api/properties/count', async (req, res) => {
    try {
        const db = require('./db');
        const count = await db.getPropertiesCount();
        res.json({ count: count });
    } catch (error) {
        console.error('Error getting properties count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
