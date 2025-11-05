const fs = require('fs');

const properties = require('./debug_properties.json');

// Формат для Bitrix24
const bitrixData = properties.map(prop => ({
    ID: prop.unid,
    NAME: prop.title,
    ADDRESS: prop.address,
    PRICE: prop.priceUSD,
    PRICE_M2: prop.pricePerM2,
    ROOMS: prop.rooms,
    AREA: prop.area,
    DISTRICT: prop.district,
    DETAILS: prop.details,
    PHOTOS: prop.photos || [],
    PHOTO_COUNT: prop.photos?.length || 0,
    CONTACT: prop.contact_name || 'Павел',
    PHONE: prop.contact_phone || '8-029-190-00-88'
}));

// Сохраняем для Bitrix24
fs.writeFileSync('bitrix_properties.json', JSON.stringify(bitrixData, null, 2));
console.log('✅ Данные для Bitrix24 сохранены: bitrix_properties.json');
console.log(`📊 Объектов: ${bitrixData.length}`);
console.log('📸 Пример объекта:');
console.log(JSON.stringify(bitrixData[0], null, 2));
