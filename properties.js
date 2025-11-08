const https = require("https");
const xml2js = require("xml2js");
const sqlite3 = require("sqlite3").verbose();
const iconv = require('iconv-lite');
const db = require("../db");

// ункци€ дл€ безопасного декодировани€ текста
function safeDecode(text) {
    if (!text || text === "null") return "";
    if (typeof text !== 'string') return text;
    
    // сли текст уже содержит русские буквы, возвращаем как есть
    if (/[а-€-я]/.test(text)) {
        return text;
    }
    
    // сли текст содержит кракоз€бры, пробуем конвертировать из win1251
    if (/[?]/.test(text) || text.includes('?')) {
        try {
            return iconv.decode(Buffer.from(text, 'binary'), 'win1251');
        } catch (e) {
            console.log("Decoding failed");
        }
    }
    
    return text;
}

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

        console.log("?? Fetching XML from Realt.by...");      

        const req = https.request(options, (res) => {
            const chunks = [];
            console.log("Status: " + res.statusCode);

            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                console.log("? XML fetched successfully");    
                const buffer = Buffer.concat(chunks);
                const xmlText = buffer.toString('utf8');
                resolve(xmlText);
            });
        });

        req.on("error", (err) => {
            console.error("? Error fetching XML:", err);
            reject(err);
        });

        req.end();
    });
}

function formatPhone(phone) {
    if (!phone || phone === "null") return "";
    return "+375 (29) " + phone;
}

function extractContactInfo(record) {
    const phoneFields = ['contact_phone_1', 'contact_phone', 'phone', 'telephone', 'mobile_phone'];
    const nameFields = ['contact_name', 'agent_name', 'name', 'contact_person', 'agency_name'];
    const emailFields = ['email', 'contact_email'];
    
    let phone = "";
    let name = "аттори€";
    let email = "";
    
    for (const field of phoneFields) {
        if (record[field] && record[field] !== "null" && record[field] !== "") {
            phone = formatPhone(record[field]);
            break;
        }
    }
    
    for (const field of nameFields) {
        if (record[field] && record[field] !== "null" && record[field] !== "") {
            name = safeDecode(record[field]);
            break;
        }
    }
    
    for (const field of emailFields) {
        if (record[field] && record[field] !== "null" && record[field] !== "") {
            email = record[field];
            break;
        }
    }
    
    return { phone, name, email };
}

function cleanPrice(priceData) {
    if (!priceData || !priceData["_"]) return "договорна€";
    const priceValue = priceData["_"];
    if (priceValue === "null" || priceValue === "undefined") return "договорна€";
    const num = parseFloat(priceValue);
    return !isNaN(num) && num > 0 ? num : "договорна€";
}

function generatePropertyTitle(record) {
    const town = safeDecode(record.town_name) || "";
    const street = safeDecode(record.street_name) || "";
    const house = record.house_number || "";
    const terms = record.terms || "";
    
    let type = "едвижимость";
    if (terms.includes("д")) type = "ом";
    else if (terms.includes("к")) type = "оммерческа€";
    else if (terms.includes("у")) type = "часток";
    
    const parts = [type];
    if (town) parts.push(town);
    if (street) parts.push(street);
    if (house) parts.push(house);
    
    return parts.join(", ");
}

function createAddress(record) {
    const parts = [];
    if (record.town_name && record.town_name !== "null") {
        parts.push(safeDecode(record.town_name));
    }
    if (record.street_name && record.street_name !== "null") {
        let street = safeDecode(record.street_name) + " ул.";
        if (record.house_number && record.house_number !== "null") {
            street += ", " + record.house_number;
        }
        parts.push(street);
    }
    return parts.length > 0 ? parts.join(", ") : "дрес не указан";
}

function createArea(record) {
    const parts = [];
    if (record.area_total && record.area_total !== "null") parts.push(record.area_total);
    if (record.area_living && record.area_living !== "null") parts.push(record.area_living);
    if (record.area_kitchen && record.area_kitchen !== "null") parts.push(record.area_kitchen);
    return parts.length > 0 ? parts.join(" / ") + " м?" : "е указана";
}

function createDetails(record) {
    const parts = [];
    if (record.storey && record.storeys) parts.push(record.storey + "/" + record.storeys);
    if (record.house_type && record.house_type !== "null") {
        const houseTypeMap = {
            "п": "анельный", "к": "ирпичный", "м": "онолитный", 
            "б": "лочный", "д": "ерев€нный"
        };
        parts.push(houseTypeMap[record.house_type] || record.house_type);
    }
    if (record.building_year && record.building_year !== "null") parts.push(record.building_year + " г.п.");
    return parts.length > 0 ? parts.join(", ") : "етали не указаны";
}

function formatPriceUSD(price) {
    if (price === "договорна€") return "договорна€";
    if (typeof price === "number") {
        return price.toLocaleString("ru-RU") + " USD";
    }
    return price + " USD";
}

function formatPriceBYN(price) {
    if (price === "договорна€") return "договорна€";
    if (typeof price === "number") {
        const bynPrice = price * 3.2;
        return bynPrice.toLocaleString("ru-RU", {minimumFractionDigits: 2}) + " руб.";
    }
    return price + " руб.";
}

function cleanDescription(description) {
    if (!description || description === "null") return "писание отсутствует";
    
    try {
        let cleaned = safeDecode(description);
        
        cleaned = cleaned
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
            
        cleaned = cleaned.replace(/\n\s*\n/g, "\n").trim();
        
        return cleaned || "писание отсутствует";
    } catch (error) {
        console.error("Error cleaning description:", error);
        return "писание отсутствует";
    }
}

function categorizeProperty(record) {
    const terms = record.terms || "";
    const description = (record.description || "").toLowerCase();
    const title = (record.title || "").toLowerCase();
    const areaTotal = parseFloat(record.area_total) || 0;
    
    if (terms.includes("к") || 
        description.includes('офис') || description.includes('магазин') || 
        description.includes('склад') || description.includes('помещен') ||
        description.includes('коммерч') || description.includes('бизнес') ||
        description.includes('торгов') || description.includes('производств') ||
        title.includes('офис') || title.includes('магазин') || title.includes('склад')) {
        return "оммерческа€ недвижимость";
    }
    
    if (terms.includes("д") || terms.includes("у") ||
        description.includes('дом') || description.includes('коттедж') ||
        description.includes('дача') || description.includes('участок') ||
        description.includes('загород') || description.includes('деревен') ||
        title.includes('дом') || title.includes('коттедж') || title.includes('дача') ||
        areaTotal > 150) {
        return "агородна€ недвижимость";
    }
    
    return "аши квартиры";
}

function parseProperties(parsedData) {
    console.log("?? Starting to parse properties from XML data...");

    try {
        const records = parsedData?.uedb?.records?.record;
        if (!records) {
            console.error("? No records found in parsed data structure");
            return [];
        }

        const recordsArray = Array.isArray(records) ? records : [records];
        console.log(`?? Processing ${recordsArray.length} records`);

        const properties = recordsArray.map((record, index) => {
            try {
                const rawPrice = cleanPrice(record.price);
                const photos = parsePhotos(record.photos);
                const contactInfo = extractContactInfo(record);

                const property = {
                    unid: record["$"]?.unid || "unknown_" + index,
                    title: generatePropertyTitle(record),
                    address: createAddress(record),
                    district: safeDecode(record.town_district_name) || "е указан",
                    area: createArea(record),
                    details: createDetails(record),
                    priceBYN: formatPriceBYN(rawPrice),
                    priceUSD: formatPriceUSD(rawPrice),
                    type: record.terms?.includes("д") ? "ом" : 
                          record.terms?.includes("к") ? "оммерческа€" : "вартира",
                    category: categorizeProperty(record),
                    code: record.code || "",
                    agency_name: safeDecode(record.agency_name) || "",
                    rooms: record.rooms || "",
                    area_total: record.area_total || "",
                    area_living: record.area_living || "",
                    area_kitchen: record.area_kitchen || "",
                    price: rawPrice,
                    town_name: safeDecode(record.town_name) || "",
                    street_name: safeDecode(record.street_name) || "",
                    house_number: record.house_number || "",
                    building_year: record.building_year || "",
                    storey: record.storey || "",
                    storeys: record.storeys || "",
                    description: cleanDescription(record.description),
                    photos: photos,
                    state_region_name: safeDecode(record.state_region_name) || "",
                    town_district_name: safeDecode(record.town_district_name) || "",
                    contact_phone_1: contactInfo.phone,
                    contact_name: contactInfo.name,
                    contact_email: contactInfo.email,
                    terms: record.terms || "",
                    house_type: record.house_type || "",
                    last_updated: new Date().toISOString()
                };

                console.log(`Property ${index}: ${photos.length} photos, category: ${property.category}`);
                return property;

            } catch (recordError) {
                console.error(`? Error processing record ${index}:`, recordError);
                return null;
            }
        }).filter(property => property !== null);

        const categoryStats = properties.reduce((stats, prop) => {
            stats[prop.category] = (stats[prop.category] || 0) + 1;
            return stats;
        }, {});
        
        console.log("?? Category statistics:", categoryStats);
        console.log(`? Successfully parsed ${properties.length} properties`);
        return properties;

    } catch (error) {
        console.error("?? Error in parseProperties:", error);
        return [];
    }
}

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

async function fetchAndSyncProperties() {
    console.log("?? Starting data sync...");
    try {
        const xmlText = await fetchXML();
        console.log("Received XML data, length:", xmlText.length, "characters");
        const parser = new XMLParser();
        const parsedData = await parser.parse(xmlText);
        console.log("XML parsed successfully");
        const properties = parseProperties(parsedData);
        if (properties.length === 0) {
            console.log("?? No properties to sync");
            return;
        }
        console.log(`?? Saving ${properties.length} properties to database...`);
        await syncProperties(properties);
        console.log("? Sync completed successfully!");
    } catch (error) {
        console.error("? Sync failed:", error);
    }
}

function parsePhotos(photosData) {
    if (!photosData) return [];
    try {
        let photos = [];
        if (Array.isArray(photosData)) {
            photos = photosData.map(photo => {
                return photo["@_picture"] || photo["@_url"] || photo["_"] || photo["$"]?.picture || photo;
            }).filter(url => url && url !== "null" && !url.startsWith("@"));
        } else if (photosData.photo) {
            const photoArray = Array.isArray(photosData.photo) ? photosData.photo : [photosData.photo];
            photos = photoArray.map(photo => {
                return photo["@_picture"] || photo["@_url"] || photo["_"] || photo["$"]?.picture || photo;
            }).filter(url => url && url !== "null" && !url.startsWith("@"));
        } else if (typeof photosData === "string" && photosData !== "null") {
            try {
                const parsed = JSON.parse(photosData);        
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return photosData.startsWith("@") ? [] : [photosData];
            }
        }
        return photos.filter(photo => photo && photo !== "null" && !photo.startsWith("@") && typeof photo === "string");    
    } catch (error) {
        console.error("Error parsing photos:", error);        
        return [];
    }
}

function getProperties(filters = {}, limit = 12, offset = 0) {
    return new Promise((resolve, reject) => {
        const dbConn = new sqlite3.Database("../properties.db");
        let whereConditions = ["archive != 1"];
        let params = [];
        
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
        
        dbConn.get(countQuery, countParams, (countErr, countRow) => {
            if (countErr) console.error("Count query error:", countErr);
            const totalCount = countRow ? countRow.total : 0;
            
            dbConn.all(query, params, (err, rows) => {
                if (err) {
                    console.error("Database error:", err);
                    reject(err);
                } else {
                    const properties = rows.map(row => ({
                        id: row.id,
                        unid: row.unid,
                        title: row.title,
                        address: row.address,
                        district: row.district,
                        area: row.area,
                        details: row.details,
                        priceBYN: row.priceBYN,
                        priceUSD: row.priceUSD,
                        type: row.type,
                        category: row.category,
                        photos: parsePhotos(row.photos),
                        contact_phone: row.contact_phone_1,
                        contact_name: row.contact_name,
                        contact_email: row.contact_email,
                        agency_name: row.agency_name,
                        rooms: row.rooms,
                        area_total: row.area_total,
                        building_year: row.building_year,
                        description: row.description
                    }));
                    
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

module.exports = {
    fetchAndSyncProperties,
    getProperties,
    parsePhotos
};

if (require.main === module) {
    console.log("?? Starting automatic sync...");
    fetchAndSyncProperties().then(() => {
        console.log("?? Sync completed!");
        process.exit(0);
    }).catch(error => {
        console.error("? Sync failed:", error);
        process.exit(1);
    });
}
