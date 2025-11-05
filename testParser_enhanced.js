const https = require("https");
const xml2js = require("xml2js");
const fs = require("fs");

class XMLParser {
    constructor() {
        this.parser = new xml2js.Parser({
            explicitArray: false,
            ignoreAttrs: false,
            trim: true,
            normalize: true
        });
    }

    async parse(xmlData) {
        return new Promise((resolve, reject) => {
            this.parser.parseString(xmlData, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

function fetchXML() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "realt.by",
            path: "/bff/proxy/export/api/export/token/e68b296c864d8a9",
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            timeout: 30000
        };

        console.log("🔄 Fetching XML from Realt.by...");

        const req = https.request(options, (res) => {
            let data = "";
            console.log("📡 Status: " + res.statusCode);

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                console.log("✅ XML fetched successfully");
                resolve(data);
            });
        });

        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Timeout"));
        });

        req.end();
    });
}

// Улучшенная функция извлечения фото
function extractPhotos(record) {
    if (!record) return [];
    
    const photos = [];
    console.log("🔍 Extracting photos from record...");
    
    // Вариант 1: photos -> photo массив с атрибутом picture
    if (record.photos && record.photos.photo) {
        console.log("📸 Found photos structure");
        const photoArray = Array.isArray(record.photos.photo) ? record.photos.photo : [record.photos.photo];
        
        photoArray.forEach((photo, index) => {
            if (photo && photo["$"] && photo["$"].picture) {
                photos.push(photo["$"].picture);
                console.log(`   ✅ Photo ${index + 1}: ${photo["$"].picture}`);
            }
        });
    }
    
    // Вариант 2: другие возможные структуры фото
    if (record.photo && photos.length === 0) {
        console.log("📸 Trying alternative photo structure");
        const photoArray = Array.isArray(record.photo) ? record.photo : [record.photo];
        photoArray.forEach(photo => {
            if (photo && photo["_"]) {
                photos.push(photo["_"]);
            }
        });
    }
    
    console.log(`📊 Extracted ${photos.length} photos`);
    return photos.slice(0, 15); // Максимум 15 фото
}

// Функция очистки цены
function cleanPrice(priceData) {
    if (!priceData || !priceData["_"]) return "договорная";
    const priceValue = priceData["_"];
    if (priceValue === "null" || priceValue === "undefined") return "договорная";
    const num = parseFloat(priceValue);
    return !isNaN(num) && num > 0 ? num : "договорная";
}

// Генерация заголовка
function generatePropertyTitle(record) {
    const terms = record.terms || "";
    const rooms = record.rooms || "";
    const town = record.town_name || "";

    let titleParts = [];

    if (terms.includes("ч")) {
        if (rooms && rooms !== "0" && rooms !== "null") {
            const roomsNum = parseInt(rooms);
            if (roomsNum === 1) titleParts.push("1-комнатная квартира");
            else if (roomsNum === 2) titleParts.push("2-комнатная квартира");
            else if (roomsNum === 3) titleParts.push("3-комнатная квартира");
            else if (roomsNum === 4) titleParts.push("4-комнатная квартира");
            else titleParts.push(rooms + "-комнатная квартира");
        } else {
            titleParts.push("Квартира");
        }
    } else if (terms.includes("д")) {
        titleParts.push("Дом");
    } else if (terms.includes("к")) {
        titleParts.push("Коммерческая недвижимость");
    } else {
        titleParts.push("Недвижимость");
    }

    if (town && town !== "null") {
        titleParts.push("в " + town);
    }

    return titleParts.join(" ");
}

// Создание адреса
function createAddress(record) {
    const parts = [];
    if (record.town_name && record.town_name !== "null") parts.push(record.town_name);
    if (record.street_name && record.street_name !== "null") {
        let street = record.street_name;
        if (record.house_number && record.house_number !== "null") {
            street += ", " + record.house_number;
        }
        parts.push(street);
    }
    return parts.length > 0 ? parts.join(", ") : "Адрес не указан";
}

// Создание информации о площади
function createArea(record) {
    const parts = [];
    if (record.area_total && record.area_total !== "null") parts.push(record.area_total + " м²");
    if (record.area_living && record.area_living !== "null") parts.push("жилая: " + record.area_living + " м²");
    if (record.area_kitchen && record.area_kitchen !== "null") parts.push("кухня: " + record.area_kitchen + " м²");
    return parts.length > 0 ? parts.join(", ") : "Площадь не указана";
}

// Создание деталей
function createDetails(record) {
    const parts = [];
    if (record.storey && record.storeys) parts.push("Этаж: " + record.storey + "/" + record.storeys);
    if (record.house_type && record.house_type !== "null") {
        const houseTypeMap = {
            "п": "Панельный",
            "к": "Кирпичный",
            "м": "Монолитный",
            "б": "Блочный",
            "д": "Деревянный"
        };
        parts.push(houseTypeMap[record.house_type] || record.house_type);
    }
    if (record.building_year && record.building_year !== "null") parts.push(record.building_year + " г.п.");
    return parts.length > 0 ? parts.join(", ") : "Детали не указаны";
}

// Форматирование цены
function formatPriceUSD(price) {
    if (price === "договорная") return "договорная";
    return new Intl.NumberFormat('ru-RU').format(price) + " USD";
}

function formatPriceBYN(price) {
    if (price === "договорная") return "договорная";
    const bynPrice = price * 3.2;
    return new Intl.NumberFormat('ru-RU', {minimumFractionDigits: 2}).format(bynPrice) + " руб.";
}

function formatPricePerM2(priceM2) {
    if (!priceM2 || typeof priceM2 !== "object") return "";
    const priceValue = priceM2["_"] || priceM2;
    if (!priceValue || priceValue === "null") return "";
    const num = parseFloat(priceValue);
    return !isNaN(num) ? new Intl.NumberFormat('ru-RU').format(num) + " USD/м²" : "";
}

// Основная функция парсинга
function parseProperties(parsedData) {
    console.log("🔄 Parsing properties data...");

    try {
        const records = parsedData?.uedb?.records?.record;
        if (!records) {
            console.log("❌ No records found in XML");
            return [];
        }

        const recordsArray = Array.isArray(records) ? records : [records];
        console.log(`📊 Processing ${recordsArray.length} records`);

        const properties = recordsArray.map((record, index) => {
            try {
                console.log(`\n--- Processing record ${index + 1} ---`);
                
                const rawPrice = cleanPrice(record.price);
                const photos = extractPhotos(record);

                // Собираем все доступные данные
                const property = {
                    // ID и базовая информация
                    unid: record["$"]?.unid || "unknown_" + index,
                    code: record.code?.[0] || "",
                    
                    // Агентство
                    agency_name: record.agency_name?.[0] || "АН Фаттория",
                    agency_id: record.agency_id?.[0] || "",
                    
                    // Даты
                    date_reception: record.date_reception?.[0] || "",
                    date_revision: record.date_revision?.[0] || "",
                    last_modification: record.last_modification?.[0] || "",
                    
                    // Основная информация
                    title: generatePropertyTitle(record),
                    address: createAddress(record),
                    district: record.town_district_name?.[0] || "Не указан",
                    area: createArea(record),
                    details: createDetails(record),
                    
                    // Цены
                    priceBYN: formatPriceBYN(rawPrice),
                    priceUSD: formatPriceUSD(rawPrice),
                    pricePerM2: formatPricePerM2(record.price_m2),
                    rawPrice: rawPrice,
                    
                    // Характеристики
                    rooms: record.rooms?.[0] || "",
                    area_total: record.area_total?.[0] || "",
                    area_living: record.area_living?.[0] || "",
                    area_kitchen: record.area_kitchen?.[0] || "",
                    
                    // Местоположение
                    town_name: record.town_name?.[0] || "",
                    street_name: record.street_name?.[0] || "",
                    house_number: record.house_number?.[0] || "",
                    town_district_name: record.town_district_name?.[0] || "",
                    town_subdistrict_name: record.town_subdistrict_name?.[0] || "",
                    
                    // Детали здания
                    building_year: record.building_year?.[0] || "",
                    storey: record.storey?.[0] || "",
                    storeys: record.storeys?.[0] || "",
                    house_type: record.house_type?.[0] || "",
                    terms: record.terms?.[0] || "",
                    
                    // Контакты
                    contact_name: record.contact_name?.[0] || "Павел",
                    contact_phone: record.contact_phone?.[0] || "8-029-190-00-88",
                    contact_phone_code: record.contact_phone_code_1?.[0] || "8-029",
                    
                    // Описание
                    description: record.description?.[0] || "",
                    
                    // Фотографии
                    photos: photos,
                    photoCount: photos.length,
                    mainPhoto: photos.length > 0 ? photos[0] : null
                };
                
                console.log(`✅ Property ${index + 1}: ${property.title}`);
                console.log(`   📍 ${property.address}`);
                console.log(`   📸 ${property.photoCount} photos`);
                console.log(`   💰 ${property.priceUSD}`);
                
                return property;
                
            } catch (error) {
                console.log(`❌ Error with record ${index + 1}:`, error.message);
                return null;
            }
        }).filter(p => p !== null);

        console.log(`\n🎉 Successfully parsed ${properties.length} properties`);
        return properties;

    } catch (error) {
        console.error("❌ Parse error:", error);
        return [];
    }
}

// Тестируем парсер
async function test() {
    try {
        const xmlText = await fetchXML();
        console.log("📄 XML length: " + xmlText.length);

        const parser = new XMLParser();
        const parsedData = await parser.parse(xmlText);

        const properties = parseProperties(parsedData);

        // Сохраняем полные данные
        fs.writeFileSync("debug_properties_full.json", JSON.stringify(properties, null, 2));
        console.log("💾 Full properties saved to debug_properties_full.json");

        // Показываем примеры
        console.log("\n=== SAMPLE PROPERTIES ===");
        properties.slice(0, 3).forEach((prop, i) => {
            console.log(`\n--- Property ${i + 1} ---`);
            console.log("Title: " + prop.title);
            console.log("Address: " + prop.address);
            console.log("Price: " + prop.priceUSD);
            console.log("Photos: " + prop.photoCount);
            console.log("Rooms: " + prop.rooms);
            console.log("Area: " + prop.area);
            if (prop.photos && prop.photos.length > 0) {
                console.log("First photo: " + prop.photos[0]);
            }
        });

        console.log("\n✅ Test completed!");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Запускаем тест
test();
