const { XMLParser } = require('./api/properties'); // Или путь к вашему файлу
const fs = require('fs');

async function testParser() {
    console.log('🧪 Starting XML Parser Test...\n');

    try {
        // Тест 1: Загрузка реального XML с Realt.by
        console.log('📥 Test 1: Fetching XML from Realt.by...');
        const response = await fetch('https://realt.by/bff/proxy/export/api/export/token/e68b296c864d8a9');
        const xmlText = await response.text();
        
        console.log('✅ XML fetched successfully');
        console.log(`📊 XML length: ${xmlText.length} characters`);
        console.log(`🔍 First 200 chars: ${xmlText.substring(0, 200)}...\n`);

        // Сохраняем сырой XML для отладки
        fs.writeFileSync('./debug_raw.xml', xmlText);
        console.log('💾 Raw XML saved to debug_raw.xml\n');

        // Тест 2: Парсинг XML
        console.log('🔧 Test 2: Parsing XML...');
        const parser = new XMLParser();
        const parsedData = await parser.parse(xmlText);
        
        console.log('✅ XML parsed successfully');
        console.log(`📊 Root keys: ${Object.keys(parsedData || {})}`);
        
        if (parsedData.uedb) {
            console.log(`📊 UEDB keys: ${Object.keys(parsedData.uedb)}`);
            if (parsedData.uedb.records) {
                const records = parsedData.uedb.records.record;
                console.log(`📊 Records count: ${Array.isArray(records) ? records.length : 1}`);
            }
        }

        // Сохраняем распарсенные данные
        fs.writeFileSync('./debug_parsed.json', JSON.stringify(parsedData, null, 2));
        console.log('💾 Parsed data saved to debug_parsed.json\n');

        // Тест 3: Обработка свойств
        console.log('🏠 Test 3: Processing properties...');
        const properties = parseProperties(parsedData);
        
        console.log(`✅ Processed ${properties.length} properties\n`);

        // Тест 4: Показываем примеры свойств
        console.log('📋 Test 4: Sample properties:');
        properties.slice(0, 3).forEach((property, index) => {
            console.log(`\n--- Property ${index + 1} ---`);
            console.log(`Title: ${property.title}`);
            console.log(`Address: ${property.address}`);
            console.log(`District: ${property.district}`);
            console.log(`Area: ${property.area}`);
            console.log(`Details: ${property.details}`);
            console.log(`Price BYN: ${property.priceBYN}`);
            console.log(`Price USD: ${property.priceUSD}`);
            console.log(`Price per m²: ${property.pricePerM2}`);
            console.log(`Type: ${property.type}`);
            console.log(`Rooms: ${property.rooms}`);
            console.log(`Photos: ${property.photos?.length || 0}`);
            console.log(`Description length: ${property.description?.length || 0}`);
        });

        // Тест 5: Сохраняем все свойства
        fs.writeFileSync('./debug_properties.json', JSON.stringify(properties, null, 2));
        console.log('\n💾 All properties saved to debug_properties.json');

        // Тест 6: Анализ данных
        console.log('\n📊 Test 5: Data Analysis:');
        const types = {};
        const priceStats = { min: Infinity, max: 0, negotiable: 0 };
        const areaStats = { min: Infinity, max: 0 };
        
        properties.forEach(prop => {
            // Типы недвижимости
            types[prop.type] = (types[prop.type] || 0) + 1;
            
            // Статистика цен
            if (prop.priceUSD !== 'договорная' && typeof prop.priceUSD === 'number') {
                priceStats.min = Math.min(priceStats.min, prop.priceUSD);
                priceStats.max = Math.max(priceStats.max, prop.priceUSD);
            } else {
                priceStats.negotiable++;
            }
            
            // Статистика площадей
            if (prop.area_total && prop.area_total !== 'null') {
                const area = parseFloat(prop.area_total);
                if (!isNaN(area)) {
                    areaStats.min = Math.min(areaStats.min, area);
                    areaStats.max = Math.max(areaStats.max, area);
                }
            }
        });

        console.log('📈 Property types:', types);
        console.log('💰 Price stats:', {
            min: priceStats.min !== Infinity ? priceStats.min : 'N/A',
            max: priceStats.max !== 0 ? priceStats.max : 'N/A',
            negotiable: priceStats.negotiable
        });
        console.log('📏 Area stats:', {
            min: areaStats.min !== Infinity ? areaStats.min : 'N/A',
            max: areaStats.max !== 0 ? areaStats.max : 'N/A'
        });

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Добавляем необходимые функции для теста
function cleanPrice(priceData) {
    if (!priceData) return 'договорная';
    
    let priceValue;
    if (typeof priceData === 'number') {
        priceValue = priceData;
    } else if (typeof priceData === 'string') {
        priceValue = priceData;
    } else if (priceData['#text']) {
        priceValue = priceData['#text'];
    } else {
        return 'договорная';
    }

    if (priceValue === null || priceValue === 'null' || priceValue === 'undefined') {
        return 'договорная';
    }

    if (typeof priceValue === 'number') {
        return priceValue > 0 ? priceValue : 'договорная';
    }

    if (typeof priceValue === 'string') {
        const cleaned = priceValue.replace(/[^\d.]/g, '');
        const num = parseFloat(cleaned);
        
        if (!isNaN(num) && num > 0) {
            return num;
        }
        
        if (priceValue.toLowerCase().includes('договор') || priceValue.toLowerCase().includes('negotiable')) {
            return 'договорная';
        }
    }

    return 'договорная';
}

function formatPriceBYN(priceData) {
    const price = cleanPrice(priceData);
    if (price === 'договорная') return 'договорная';

    const priceNum = typeof price === 'number' ? price : parseFloat(price);
    if (!isNaN(priceNum)) {
        const bynPrice = priceNum * 3.2;
        return `${bynPrice.toLocaleString('ru-RU', {minimumFractionDigits: 2})} руб.`;
    }

    return 'Информация уточняется';
}

function formatPriceUSD(priceData) {
    const price = cleanPrice(priceData);
    if (price === 'договорная') return 'договорная';

    const priceNum = typeof price === 'number' ? price : parseFloat(price);
    if (!isNaN(priceNum)) {
        return `${priceNum.toLocaleString('ru-RU')} USD`;
    }

    return 'Информация уточняется';
}

function formatPricePerM2(record) {
    if (!record.price_m2 || record.price_m2 === 'null') return '';

    const priceM2 = parseFloat(record.price_m2);
    if (!isNaN(priceM2) && priceM2 > 0) {
        return `${priceM2.toLocaleString('ru-RU', {minimumFractionDigits: 2})} USD/м²`;
    }

    return '';
}

function generatePropertyTitle(record) {
    const type = record.terms || '';
    const rooms = record.rooms || '';
    const town = record.town_name || '';

    let titleParts = [];

    if (rooms && rooms !== '0' && rooms !== 'null') {
        const roomsNum = parseInt(rooms);
        if (roomsNum === 0) {
            titleParts.push('Студия');
        } else if (roomsNum === 1) {
            titleParts.push('1-комнатная квартира');
        } else if (roomsNum === 2) {
            titleParts.push('2-комнатная квартира');
        } else if (roomsNum === 3) {
            titleParts.push('3-комнатная квартира');
        } else if (roomsNum === 4) {
            titleParts.push('4-комнатная квартира');
        } else {
            titleParts.push(`${rooms}-комнатная квартира`);
        }
    } else {
        if (type.includes('коммерч') || type.includes('бизнес')) {
            titleParts.push('Коммерческая недвижимость');
        } else if (type.includes('дом') || type.includes('house')) {
            titleParts.push('Дом');
        } else if (type.includes('участок') || type.includes('земля')) {
            titleParts.push('Земельный участок');
        } else {
            titleParts.push('Квартира');
        }
    }

    if (town && town !== 'null') {
        titleParts.push(`в ${town}`);
    }

    return titleParts.join(' ');
}

function createAddress(record) {
    const parts = [];

    if (record.town_name && record.town_name !== 'null') {
        parts.push(record.town_name);
    }

    if (record.street_name && record.street_name !== 'null') {
        let streetPart = `${record.street_name} ул.`;
        if (record.house_number && record.house_number !== 'null') {
            streetPart += `, ${record.house_number}`;
        }
        parts.push(streetPart);
    }

    return parts.length > 0 ? parts.join(', ') : 'Адрес не указан';
}

function createArea(record) {
    const parts = [];

    if (record.area_total && record.area_total !== 'null') {
        parts.push(record.area_total);
    }

    if (record.area_living && record.area_living !== 'null') {
        parts.push(record.area_living);
    }

    if (record.area_kitchen && record.area_kitchen !== 'null') {
        parts.push(record.area_kitchen);
    }

    if (parts.length > 0) {
        return `${parts.join(' / ')} м²`;
    }

    return 'Площадь не указана';
}

function createDetails(record) {
    const parts = [];

    if (record.storey && record.storeys) {
        parts.push(`${record.storey}/${record.storeys}`);
    }

    if (record.house_type && record.house_type !== 'null') {
        parts.push(record.house_type);
    }

    if (record.building_year && record.building_year !== 'null') {
        parts.push(`${record.building_year} г.п.`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Детали не указаны';
}

function determinePropertyType(record) {
    const terms = (record.terms || '').toLowerCase();
    const houseType = (record.house_type || '').toLowerCase();

    if (terms.includes('коммерч') || terms.includes('бизнес') || terms.includes('магазин') || terms.includes('офис')) {
        return 'Коммерческая';
    } else if (terms.includes('дом') || houseType.includes('дом') || terms.includes('house')) {
        return 'Дом';
    } else if (terms.includes('участок') || terms.includes('земля') || terms.includes('land')) {
        return 'Участок';
    } else if (terms.includes('дача') || terms.includes('коттедж') || terms.includes('dacha')) {
        return 'Дача';
    } else {
        return 'Квартира';
    }
}

function parseProperties(parsedData) {
    console.log('🔄 Starting to parse properties from XML data...');

    try {
        const records = parsedData?.uedb?.records?.record;

        if (!records) {
            console.error('❌ No records found in parsed data structure');
            return [];
        }

        console.log(`📊 Processing ${Array.isArray(records) ? records.length : 1} records`);
        const recordsArray = Array.isArray(records) ? records : [records];

        const properties = recordsArray.map((record, index) => {
            try {
                let photos = [];
                if (record.photos && record.photos.photo) {
                    const photoData = record.photos.photo;
                    photos = Array.isArray(photoData)
                        ? photoData.map(p => p['@_picture'] || p.picture || p)
                        : [photoData['@_picture'] || photoData.picture || photoData];
                }

                const rawPrice = cleanPrice(record.price);
                const priceUSD = rawPrice;
                const priceBYN = formatPriceBYN(record.price);
                const pricePerM2 = formatPricePerM2(record);

                const property = {
                    unid: record.unid || `unknown_${index}`,
                    title: generatePropertyTitle(record),
                    address: createAddress(record),
                    district: record.town_district_name || 'Район не указан',
                    area: createArea(record),
                    details: createDetails(record),
                    priceBYN: priceBYN,
                    priceUSD: formatPriceUSD(rawPrice),
                    pricePerM2: pricePerM2,
                    type: determinePropertyType(record),
                    code: record.code || '',
                    agency_name: record.agency_name || '',
                    rooms: record.rooms || '',
                    area_total: record.area_total || '',
                    area_living: record.area_living || '',
                    area_kitchen: record.area_kitchen || '',
                    price: rawPrice,
                    price_m2: record.price_m2 || '',
                    town_name: record.town_name || '',
                    street_name: record.street_name || '',
                    house_number: record.house_number || '',
                    building_year: record.building_year || '',
                    storey: record.storey || '',
                    storeys: record.storeys || '',
                    description: record.description || '',
                    photos: photos,
                    state_region_name: record.state_region_name || '',
                    town_district_name: record.town_district_name || '',
                    contact_phone_1: record.contact_phone_1 || '',
                    contact_name: record.contact_name || '',
                    terms: record.terms || '',
                    house_type: record.house_type || ''
                };

                return property;

            } catch (recordError) {
                console.error(`❌ Error processing record ${index}:`, recordError);
                return null;
            }
        }).filter(property => property !== null);

        console.log(`✅ Successfully parsed ${properties.length} properties`);
        return properties;

    } catch (error) {
        console.error('💥 Error in parseProperties:', error);
        return [];
    }
}

// Запускаем тест
testParser();