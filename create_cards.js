const fs = require('fs');

// Простой шаблон карточки без сложных условий
function generatePropertyCard(property) {
    const mainPhoto = property.mainPhoto || property.photos?.[0] || '';
    const photoCount = property.photoCount || property.photos?.length || 0;
    
    return `
<div class="property-card" style="border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; margin: 15px 0; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Блок с фото -->
    <div style="position: relative;">
        ${mainPhoto ? 
            `<img src="${mainPhoto}" alt="${property.title}" style="width: 100%; height: 200px; object-fit: cover; border-bottom: 1px solid #e0e0e0;">` :
            `<div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
                📷 Фото не доступно
            </div>`
        }
        
        <!-- Бейдж количества фото -->
        ${photoCount > 0 ? 
            `<div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                📸 ${photoCount} фото
            </div>` : ''
        }
        
        <!-- Бейдж статуса -->
        <div style="position: absolute; top: 10px; left: 10px; background: #4caf50; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
            Функом дость
        </div>
    </div>
    
    <!-- Контент -->
    <div style="padding: 15px;">
        <!-- Заголовок и цена -->
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #2c5aa0; font-size: 18px; flex: 1;">${property.title || 'Название не указано'}</h3>
            <div style="font-size: 20px; font-weight: bold; color: #d63384; text-align: right;">
                ${property.priceUSD || 'договорная'}
            </div>
        </div>
        
        <!-- Адрес -->
        <div style="color: #666; margin-bottom: 8px; font-size: 14px;">
            📍 ${property.address || 'Адрес не указан'}
        </div>
        
        <!-- Детали в grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 14px;">
            ${property.rooms ? `<div><strong>🏠 Комнат:</strong> ${property.rooms}</div>` : ''}
            ${property.area ? `<div><strong>📐 Площадь:</strong> ${property.area}</div>` : ''}
            ${property.district ? `<div><strong>🏙️ Район:</strong> ${property.district}</div>` : ''}
            ${property.details ? `<div><strong>📋 Детали:</strong> ${property.details}</div>` : ''}
        </div>
        
        <!-- Цена за м² -->
        ${property.pricePerM2 ? 
            `<div style="background: #e7f3ff; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px; font-size: 13px;">
                <strong>💰 Цена за м²:</strong> ${property.pricePerM2}
            </div>` : ''
        }
        
        <!-- Контакты -->
        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 4px solid #2c5aa0;">
            <strong>👤 Контакт:</strong> ${property.contact_name || 'Павел'} | 📞 ${property.contact_phone || '8-029-190-00-88'}
        </div>
    </div>
</div>
`;
}

// Основная функция
function main() {
    try {
        console.log('📖 Читаем данные свойств...');
        const properties = require('./debug_properties.json');
        console.log(`✅ Найдено свойств: ${properties.length}`);
        
        // Генерируем карточки
        console.log('🎨 Генерируем карточки...');
        const cardsHTML = properties.map(prop => generatePropertyCard(prop)).join('\n');
        
        // Создаем полный HTML документ
        const fullHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fattoria.by - Объекты недвижимости</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .container {
            display: grid;
            gap: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #2c5aa0;
            margin: 0;
        }
        .stats {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏠 Fattoria.by</h1>
        <p>Объекты недвижимости с фотографиями</p>
        <div class="stats">
            Всего объектов: ${properties.length} | 
            С фото: ${properties.filter(p => p.photos && p.photos.length > 0).length}
        </div>
    </div>
    <div class="container">
        ${cardsHTML}
    </div>
</body>
</html>`;
        
        // Сохраняем файл
        fs.writeFileSync('property_cards.html', fullHTML);
        console.log('✅ HTML файл создан: property_cards.html');
        console.log('📊 Статистика:');
        console.log(`   - Всего объектов: ${properties.length}`);
        console.log(`   - С фотографиями: ${properties.filter(p => p.photos && p.photos.length > 0).length}`);
        console.log(`   - Без фото: ${properties.filter(p => !p.photos || p.photos.length === 0).length}`);
        
        // Показываем пример первой карточки
        if (properties.length > 0) {
            console.log('\n📸 Пример первой карточки:');
            console.log(`   - Название: ${properties[0].title}`);
            console.log(`   - Фото: ${properties[0].photos?.length || 0} шт`);
            console.log(`   - Адрес: ${properties[0].address}`);
            console.log(`   - Цена: ${properties[0].priceUSD}`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

// Запускаем
main();
