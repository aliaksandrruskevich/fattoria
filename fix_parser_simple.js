const fs = require('fs');

// Читаем текущий парсер
let parserCode = fs.readFileSync('./testParser.js', 'utf8');

// Добавляем функцию для извлечения фото
const photoFunction = `
function extractPhotos(record) {
    const photos = [];
    
    // Фото находятся в record.photos.photo как массив объектов с атрибутом picture
    if (record.photos && record.photos.photo) {
        const photoArray = Array.isArray(record.photos.photo) ? record.photos.photo : [record.photos.photo];
        photoArray.forEach(photo => {
            if (photo && photo['\$'] && photo['\$'].picture) {
                photos.push(photo['\$'].picture);
            }
        });
    }
    console.log(\`Extracted \${photos.length} photos\`);
    return photos.slice(0, 10);
}
`;

// Вставляем функцию перед parseProperties
const parsePropsIndex = parserCode.indexOf('function parseProperties(parsedData) {');
if (parsePropsIndex !== -1) {
    parserCode = parserCode.slice(0, parsePropsIndex) + photoFunction + '\n\n' + parserCode.slice(parsePropsIndex);
}

// Обновляем функцию parseProperties чтобы добавляла фото
parserCode = parserCode.replace(
    'const property = {', 
    'const photos = extractPhotos(record);\n                const property = {'
);

// Добавляем поля фото в объект property
parserCode = parserCode.replace(
    'description: record.description || ""', 
    'description: record.description || "",\n                    photos: photos,\n                    photoCount: photos.length,\n                    mainPhoto: photos.length > 0 ? photos[0] : null'
);

// Сохраняем исправленный парсер
fs.writeFileSync('./testParser_fixed.js', parserCode);
console.log('✅ Fixed parser created! Photos will be extracted.');

