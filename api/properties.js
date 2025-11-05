const https = require("https");
const xml2js = require("xml2js");
const sqlite3 = require("sqlite3").verbose();
const db = require("../db");

// Класс XMLParser
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

// Функция для загрузки XML
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

        console.log("📥 Fetching XML from Realt.by...");
        
        const req = https.request(options, (res) => {
            let data = "";
            console.log("Status: " + res.statusCode);

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                console.log("✅ XML fetched successfully");
                resolve(data);
            });
        });

        req.on("error", (err) => {
            console.error("❌ Fetch error:", err);
            reject(err);
        });

        req.on("timeout", () => {
            console.error("❌ Request timeout");
            req.destroy();
            reject(new Error("Request timeout"));
        });

        req.end();
    });
}

function cleanPrice(priceData) {
    if (!priceData || !priceData["_"]) return "договорная";
    
    const priceValue = priceData["_"];
    if (priceValue === "null" || priceValue === "undefined") return "договорная";

    const num = parseFloat(priceValue);
    return !isNaN(num) && num > 0 ? num : "договорная";
}

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

function createAddress(record) {
    const parts = [];
    if (record.town_name && record.town_name !== "null") parts.push(record.town_name);
    if (record.street_name && record.street_name !== "null") {
        let street = record.street_name + " ул.";
        if (record.house_number && record.house_number !== "null") {
            street += ", " + record.house_number;
        }
        parts.push(street);
    }
    return parts.length > 0 ? parts.join(", ") : "Адрес не указан";
}

function createArea(record) {
    const parts = [];
    if (record.area_total && record.area_total !== "null") parts.push(record.area_total);
    if (record.area_living && record.area_living !== "null") parts.push(record.area_living);
    if (record.area_kitchen && record.area_kitchen !== "null") parts.push(record.area_kitchen);
    return parts.length > 0 ? parts.join(" / ") + " м²" : "Не указана";
}

function createDetails(record) {
    const parts = [];
    if (record.storey && record.storeys) parts.push(record.storey + "/" + record.storeys);
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

function formatPriceUSD(price) {
    if (price === "договорная") return "договорная";
    if (typeof price === "number") {
        return price.toLocaleString("ru-RU") + " USD";
    }
    return price + " USD";
}

function formatPriceBYN(price) {
    if (price === "договорная") return "договорная";
    if (typeof price === "number") {
        const bynPrice = price * 3.2;
        return bynPrice.toLocaleString("ru-RU", {minimumFractionDigits: 2}) + " руб.";
    }
    return price + " руб.";
}

function formatPricePerM2(priceM2) {
    if (!priceM2) return "";
    
    let priceValue;
    if (typeof priceM2 === "object" && priceM2["_"]) {
        priceValue = priceM2["_"];
    } else if (typeof priceM2 === "string") {
        priceValue = priceM2;
    } else {
        return "";
    }
    
    if (!priceValue || priceValue === "null") return "";
    
    const num = parseFloat(priceValue);
    return !isNaN(num) ? num.toLocaleString("ru-RU") + " USD/м²" : "";
}

function cleanDescription(description) {
    if (!description || description === "null") return "Описание отсутствует";
    
    let cleaned = description
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<p>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&laquo;/g, "«")
        .replace(/&raquo;/g, "»")
        .replace(/&mdash;/g, "—")
        .replace(/&quot;/g, "\"")
        .replace(/\s+/g, " ")
        .trim();

    cleaned = cleaned.replace(/\n\s*\n/g, "\n").trim();
    return cleaned || "Описание отсутствует";
}

// Улучшенная функция обработки фото
function parsePhotos(photosData) {
    if (!photosData) return [];
    
    try {
        let photos = [];
        
        // Если photosData - массив объектов с атрибутами
        if (Array.isArray(photosData)) {
            photos = photosData.map(photo => {
                // Пробуем разные варианты получения URL
                return photo["@_picture"] || photo["@_url"] || photo["_"] || photo["$"]?.picture || photo;
            }).filter(url => url && url !== "null" && !url.startsWith("@"));
        } 
        // Если photosData - объект с photo внутри
        else if (photosData.photo) {
            const photoArray = Array.isArray(photosData.photo) ? photosData.photo : [photosData.photo];
            photos = photoArray.map(photo => {
                return photo["@_picture"] || photo["@_url"] || photo["_"] || photo["$"]?.picture || photo;
            }).filter(url => url && url !== "null" && !url.startsWith("@"));
        }
        // Если строка
        else if (typeof photosData === "string" && photosData !== "null") {
            try {
                const parsed = JSON.parse(photosData);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return photosData.startsWith("@") ? [] : [photosData];
            }
        }
        
        return photos.filter(photo => 
            photo && 
            photo !== "null" && 
            !photo.startsWith("@") &&
            typeof photo === "string"
        );
    } catch (error) {
        console.error("Error parsing photos:", error);
        return [];
    }
}
// Функция форматирования телефона
function formatPhone(phone) {
    if (!phone || phone === "null") return "";
    
    const cleaned = phone.replace(/\D/g, "");
    
    if (cleaned.length === 9) {
        return "+375 " + cleaned.substring(0, 2) + " " + cleaned.substring(2, 5) + " " + cleaned.substring(5, 7) + " " + cleaned.substring(7);
    } else if (cleaned.length === 12) {
        return "+" + cleaned.substring(0, 3) + " " + cleaned.substring(3, 5) + " " + cleaned.substring(5, 8) + " " + cleaned.substring(8, 10) + " " + cleaned.substring(10);
    }
    
    return phone;
}

// Основная функция парсинга свойств
function parseProperties(parsedData) {
    console.log("🔄 Starting to parse properties from XML data...");

    try {
        const records = parsedData?.uedb?.records?.record;
        if (!records) {
            console.error("❌ No records found in parsed data structure");
            return [];
        }

        const recordsArray = Array.isArray(records) ? records : [records];
        console.log(`📊 Processing ${recordsArray.length} records`);

        const properties = recordsArray.map((record, index) => {
            try {
                const rawPrice = cleanPrice(record.price);
                const photos = parsePhotos(record.photos);
                const contactPhone = formatPhone(record.contact_phone_1);

                const property = {
                    unid: record["$"]?.unid || "unknown_" + index,
                    title: generatePropertyTitle(record),
                    address: createAddress(record),
                    district: record.town_district_name || "Не указан",
                    area: createArea(record),
                    details: createDetails(record),
                    priceBYN: formatPriceBYN(rawPrice),
                    priceUSD: formatPriceUSD(rawPrice),
                    pricePerM2: formatPricePerM2(record.price_m2),
                    type: record.terms?.includes("д") ? "Дом" : 
                          record.terms?.includes("к") ? "Коммерческая" : "Квартира",
                    code: record.code || "",
                    agency_name: record.agency_name || "",
                    rooms: record.rooms || "",
                    area_total: record.area_total || "",
                    area_living: record.area_living || "",
                    area_kitchen: record.area_kitchen || "",
                    price: rawPrice,
                    price_m2: record.price_m2 ? (typeof record.price_m2 === "object" ? record.price_m2["_"] : record.price_m2) : "",
                    town_name: record.town_name || "",
                    street_name: record.street_name || "",
                    house_number: record.house_number || "",
                    building_year: record.building_year || "",
                    storey: record.storey || "",
                    storeys: record.storeys || "",
                    description: cleanDescription(record.description),
                    photos: photos,
                    state_region_name: record.state_region_name || "",
                    town_district_name: record.town_district_name || "",
                    contact_phone_1: contactPhone,
                    contact_name: record.contact_name || "",
                    terms: record.terms || "",
                    house_type: record.house_type || ""
                };

                console.log(`Property ${index}: ${photos.length} photos, phone: ${contactPhone ? "yes" : "no"}`);
                return property;

            } catch (recordError) {
                console.error(`❌ Error processing record ${index}:`, recordError);
                return null;
            }
        }).filter(property => property !== null);

        console.log(`✅ Successfully parsed ${properties.length} properties`);
        return properties;

    } catch (error) {
        console.error("💥 Error in parseProperties:", error);
        return [];
    }
}

// Функция синхронизации
async function syncProperties(parsedProperties) {
    const currentUnids = parsedProperties.map(p => p.unid);

    for (const property of parsedProperties) {
        try {
            await db.insertProperty(property);
        } catch (err) {
            console.error("Error inserting property:", err);
        }
    }

    try {
        const archivedCount = await db.archiveMissingProperties(currentUnids);
        console.log(`Archived ${archivedCount} properties`);
    } catch (err) {
        console.error("Error archiving properties:", err);
    }
}

// Основная функция синхронизации
async function fetchAndSyncProperties() {
    console.log("🚀 Starting data sync...");

    try {
        const xmlText = await fetchXML();
        console.log("Received XML data, length:", xmlText.length, "characters");

        const parser = new XMLParser();
        const parsedData = await parser.parse(xmlText);
        console.log("XML parsed successfully");

        const properties = parseProperties(parsedData);

        if (properties.length === 0) {
            console.log("⚠️ No properties to sync");
            return;
        }

        console.log(`💾 Saving ${properties.length} properties to database...`);
        await syncProperties(properties);
        console.log("✅ Sync completed successfully!");

    } catch (error) {
        console.error("❌ Sync failed:", error);
    }
}

// Функция получения свойств для API
function getProperties(filters = {}, limit = 12, offset = 0) {
    return new Promise((resolve, reject) => {
        const dbConn = new sqlite3.Database("./properties.db");

        let whereConditions = ["archive != 1"];
        let params = [];

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

        dbConn.get(countQuery, countParams, (countErr, countRow) => {
            if (countErr) console.error("Count query error:", countErr);

            const totalCount = countRow ? countRow.total : 0;

            dbConn.all(query, params, (err, rows) => {
                if (err) {
                    console.error("Database error:", err);
                    reject(err);
                } else {
                    const properties = rows.map(row => {
                        return {
                            id: row.id,
                            unid: row.unid,
                            title: row.title,
                            address: row.address,
                            district: row.district,
                            area: row.area,
                            details: row.details,
                            priceBYN: row.priceBYN,
                            priceUSD: row.priceUSD,
                            pricePerM2: row.pricePerM2,
                            type: row.type,
                            photos: parsePhotos(row.photos),
                            contact_phone: row.contact_phone_1,
                            contact_name: row.contact_name,
                            agency_name: row.agency_name,
                            rooms: row.rooms,
                            area_total: row.area_total,
                            building_year: row.building_year,
                            description: row.description
                        };
                    });

                    resolve({
                        properties: properties,
                        totalCount: totalCount,
                        hasMore: (offset + limit) < totalCount
                    });
                }

                dbConn.close();
            });
        });
    });
}

// Mock data fallback
function getMockData() {
    return [
        {
            title: "Квартира в центре Минска",
            location: "Минск, Центр",
            price: 120000,
            type: "Квартира",
            description: "Уютная квартира с современным ремонтом.",
            features: ["3 комнаты", "Балкон", "Ремонт"],
            photos: ["/images/placeholder-loading.svg"]
        }
    ];
}

module.exports = { 
    fetchProperties: getProperties, 
    fetchAndSyncProperties, 
    getMockData, 
    getProperties 
};
