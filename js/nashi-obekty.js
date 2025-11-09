// Пагинация для страницы "Наши объекты" - РАБОЧАЯ ВЕРСИЯ
console.log('✅ nashi-obekty.js loaded - PAGINATION FIXED');

// Глобальные переменные для пагинации
window.currentPage = 1;
window.totalPages = 1;
const itemsPerPage = 6;

// Добавляем CSS исправления
const style = document.createElement('style');
style.textContent = `
    .properties-slider-container {
        overflow: visible !important;
    }
    
    .properties-container {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 20px !important;
        transform: none !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 20px 0 !important;
    }
    
    .property-card {
        width: 100% !important;
        margin: 0 !important;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        overflow: hidden;
        background: white;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        cursor: pointer;
    }
    
    .property-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    /* Адаптивность */
    @media (max-width: 1200px) {
        .properties-container {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }
    
    @media (max-width: 768px) {
        .properties-container {
            grid-template-columns: 1fr !important;
        }
    }
    
    .slider-navigation {
        margin-top: 30px;
        text-align: center;
    }
`;
document.head.appendChild(style);

// Функция для открытия деталей объекта
function showPropertyDetails(property) {
    console.log('🔍 Открываем объект:', property.id);
    
    // Переходим на страницу объекта
    const propertyId = property.unid || property.id;
    window.location.href = `/object/${propertyId}`;
}

// Основная функция загрузки
async function loadProperties(page = 1) {
    try {
        console.log(`🔄 Загружаем страницу ${page}...`);
        window.currentPage = page;
        
        const container = document.getElementById('propertiesContainer');
        if (container) {
            container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-warning"></div><p class="mt-2">Загрузка...</p></div>';
        }
        
        // Загружаем данные
        const response = await fetch(`/api/properties?page=${page}&limit=${itemsPerPage}`);
        const properties = await response.json();
        
        // Загружаем количество
        const countResponse = await fetch('/api/properties/count');
        const countData = await countResponse.json();
        window.totalPages = Math.ceil(countData.count / itemsPerPage);
        document.getElementById('totalPages').textContent = window.totalPages;

        console.log(`✅ СТРАНИЦА ${page}: ${properties.length} объектов, всего: ${window.totalPages} страниц`);
        
        // Отображаем
        displayProperties(properties);
        updatePagination();
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

// Функция отображения
function displayProperties(properties) {
    const container = document.getElementById('propertiesContainer');
    if (!container) {
        console.error('❌ Контейнер не найден!');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    properties.forEach(property => {
        const firstPhoto = property.photos && property.photos.length > 0 ? property.photos[0] : '/images/placeholder-loading.svg';
        const address = [property.town_name, property.street_name, property.house_number].filter(Boolean).join(', ') || 'Адрес не указан';
        
        const card = document.createElement('div');
        card.className = 'property-card';
        
        card.innerHTML = `
            <div style="height: 200px; overflow: hidden; position: relative; background: #f8f9fa;">
                <img src="${firstPhoto}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.src='/images/placeholder-loading.svg'">
                <div style="position: absolute; bottom: 10px; left: 10px; background: #ffc107; color: #000; padding: 8px 12px; border-radius: 6px; font-weight: bold;">
                    ${property.price ? `$${property.price.toLocaleString()}` : 'Цена по запросу'}
                </div>
                ${property.rooms ? `<div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${property.rooms}-комн.
                </div>` : ''}
            </div>
            <div style="padding: 15px;">
                <h5 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${property.title}</h5>
                <div style="color: #666; margin-bottom: 10px; font-size: 14px;">
                    <i class="fas fa-map-marker-alt text-danger"></i> ${address}
                </div>
                ${property.area_total ? `<div style="margin-bottom: 8px;"><small><strong>Площадь:</strong> ${property.area_total} м²</small></div>` : ''}
                <button class="btn btn-warning btn-sm" style="width: 100%;">
                    <i class="fas fa-eye"></i> Подробнее
                </button>
            </div>
        `;
        
        // Делаем карточку кликабельной
        card.onclick = function() {
            showPropertyDetails(property);
        };
        
        // Делаем кнопку кликабельной
        const button = card.querySelector('button');
        button.onclick = function(e) {
            e.stopPropagation();
            showPropertyDetails(property);
        };
        
        container.appendChild(card);
    });
}

// Обновление пагинации
function updatePagination() {
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (currentPageEl) currentPageEl.textContent = window.currentPage;
    if (totalPagesEl) totalPagesEl.textContent = window.totalPages;
    if (prevBtn) {
        prevBtn.disabled = window.currentPage === 1;
        prevBtn.onclick = () => window.currentPage > 1 && loadProperties(window.currentPage - 1);
    }
    if (nextBtn) {
        nextBtn.disabled = window.currentPage === window.totalPages;
        nextBtn.onclick = () => window.currentPage < window.totalPages && loadProperties(window.currentPage + 1);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Инициализация пагинации...');
    loadProperties(1);
});