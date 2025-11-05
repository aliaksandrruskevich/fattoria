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

        console.log("Fetching XML...");
        
        const req = https.request(options, (res) => {
            let data = "";
            console.log("Status: " + res.statusCode);

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                console.log("XML fetched");
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
        // Расшифровка типов домов
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
    return price.toLocaleString("ru-RU") + " USD";
}

function formatPriceBYN(price) {
    if (price === "договорная") return "договорная";
    const bynPrice = price * 3.2;
    return bynPrice.toLocaleString("ru-RU", {minimumFractionDigits: 2}) + " руб.";
}

function formatPricePerM2(priceM2) {
    if (!priceM2 || typeof priceM2 !== "object") return "";
    
    // price_m2 может быть объектом с _ полем
    const priceValue = priceM2["_"] || priceM2;
    if (!priceValue || priceValue === "null") return "";
    
    const num = parseFloat(priceValue);
    return !isNaN(num) ? num.toLocaleString("ru-RU") + " USD/м²" : "";
}

function parseProperties(parsedData) {
    console.log("Parsing properties...");

    try {
        const records = parsedData?.uedb?.records?.record;
        if (!records) {
            console.log("No records found");
            return [];
        }

        const recordsArray = Array.isArray(records) ? records : [records];
        console.log("Processing " + recordsArray.length + " records");

        const properties = recordsArray.slice(0, 10).map((record, index) => {
            try {
                const rawPrice = cleanPrice(record.price);
                
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
                    rooms: record.rooms || "",
                    area_total: record.area_total || "",
                    town_name: record.town_name || "",
                    street_name: record.street_name || "",
                    house_number: record.house_number || "",
                    building_year: record.building_year || "",
                    storey: record.storey || "",
                    storeys: record.storeys || "",
                    house_type: record.house_type || "",
                    terms: record.terms || "",
                    description: record.description || ""
                };
                return property;
            } catch (error) {
                console.log("Error with record " + index + ":", error.message);
                return null;
            }
        }).filter(p => p !== null);

        console.log("Successfully parsed " + properties.length + " properties");
        return properties;

    } catch (error) {
        console.error("Parse error:", error);
        return [];
    }
}

async function test() {
    try {
        const xmlText = await fetchXML();
        console.log("XML length: " + xmlText.length);
        
        const parser = new XMLParser();
        const parsedData = await parser.parse(xmlText);
        
        const properties = parseProperties(parsedData);
        
        console.log("\n=== SAMPLE PROPERTIES ===");
        properties.slice(0, 5).forEach((prop, i) => {
            console.log("\n--- Property " + (i + 1) + " ---");
            console.log("Title: " + prop.title);
            console.log("Address: " + prop.address);
            console.log("District: " + prop.district);
            console.log("Area: " + prop.area);
            console.log("Details: " + prop.details);
            console.log("Price BYN: " + prop.priceBYN);
            console.log("Price USD: " + prop.priceUSD);
            console.log("Price m2: " + prop.pricePerM2);
            console.log("Rooms: " + prop.rooms);
        });

        fs.writeFileSync("debug_properties.json", JSON.stringify(properties, null, 2));
        console.log("\nAll properties saved to debug_properties.json");
        console.log("Test completed!");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
