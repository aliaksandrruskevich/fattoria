// Функция для создания карточки объекта
function createEnhancedPropertyCard(property) {
    const mainPhoto = property.photos && property.photos.length > 0 ? property.photos[0] : '';
    const photoCount = property.photos ? property.photos.length : 0;
    
    return `
    <div class="enhanced-property-card">
        <div class="enhanced-property-card__image-container">
            ${mainPhoto ? 
                `<img src="${mainPhoto}" alt="${property.title || 'Объект недвижимости'}" 
                      class="enhanced-property-card__image"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                ''
            }
            <div class="enhanced-property-card__image-placeholder" ${mainPhoto ? 'style="display:none"' : ''}>
                📷 Фото не доступно
            </div>
            
            ${photoCount > 0 ? 
                `<div class="enhanced-property-card__photo-badge">📸 ${photoCount} фото</div>` : 
                ''
            }
            
            <div class="enhanced-property-card__status-badge">Функом дость</div>
        </div>
        
        <div class="enhanced-property-card__content">
            <div class="enhanced-property-card__header">
                <h3 class="enhanced-property-card__title">${property.title || 'Название не указано'}</h3>
                <div class="enhanced-property-card__price">${property.priceUSD || 'договорная'}</div>
            </div>
            
            <div class="enhanced-property-card__address">📍 ${property.address || 'Адрес не указан'}</div>
            
            <div class="enhanced-property-card__details-grid">
                ${property.rooms ? `<div class="enhanced-property-card__detail"><strong>🏠 Комнат:</strong> ${property.rooms}</div>` : ''}
                ${property.area ? `<div class="enhanced-property-card__detail"><strong>📐 Площадь:</strong> ${property.area}</div>` : ''}
                ${property.district ? `<div class="enhanced-property-card__detail"><strong>🏙️ Район:</strong> ${property.district}</div>` : ''}
                ${property.details ? `<div class="enhanced-property-card__detail"><strong>📋 Детали:</strong> ${property.details}</div>` : ''}
            </div>
            
            ${property.pricePerM2 ? 
                `<div class="enhanced-property-card__price-per-m2"><strong>💰 Цена за м²:</strong> ${property.pricePerM2}</div>` : 
                ''
            }
            
            <div class="enhanced-property-card__contacts">
                <strong>👤 Контакт:</strong> ${property.contact_name || 'Павел'} | 📞 ${property.contact_phone || '8-029-190-00-88'}
            </div>
        </div>
    </div>
    `;
}

// Функция для загрузки и отображения объектов
async function loadEnhancedProperties() {
    try {
        console.log('🔄 Загружаем объекты недвижимости...');
        
        // Пробуем загрузить из API
        const response = await fetch('/api/properties');
        if (!response.ok) throw new Error('API недоступен');
        
        const properties = await response.json();
        displayEnhancedProperties(properties);
        
    } catch (error) {
        console.log('API недоступен, пробуем локальный файл:', error);
        
        // Fallback: загружаем из локального файла
        try {
            const response = await fetch('/data/properties.json');
            const properties = await response.json();
            displayEnhancedProperties(properties);
        } catch (localError) {
            console.error('Не удалось загрузить объекты:', localError);
            showError('Не удалось загрузить объекты недвижимости');
        }
    }
}

// Функция для отображения объектов
function displayEnhancedProperties(properties) {
    const container = document.getElementById('enhanced-properties-container');
    const statsElement = document.getElementById('enhanced-properties-stats');
    
    if (!container) {
        console.error('Контейнер для объектов не найден');
        return;
    }
    
    // Обновляем статистику
    if (statsElement) {
        const withPhotos = properties.filter(p => p.photos && p.photos.length > 0).length;
        statsElement.textContent = `Всего объектов: ${properties.length} | С фото: ${withPhotos}`;
    }
    
    // Создаем карточки
    const cardsHTML = properties.map(property => createEnhancedPropertyCard(property)).join('');
    container.innerHTML = cardsHTML;
    
    console.log(`✅ Загружено ${properties.length} объектов`);
}

// Функция для показа ошибки
function showError(message) {
    const container = document.getElementById('enhanced-properties-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #d63384;">
                <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                <p>${message}</p>
                <button onclick="loadEnhancedProperties()" 
                        style="background: #2c5aa0; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 15px;">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

// Загружаем объекты при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadEnhancedProperties();
});
