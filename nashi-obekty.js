// nashi-obekty.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
console.log('🔄 nashi-obekty.js loaded - version: 2025-11-03T05:23:54.045Z');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - initializing properties page...');
    initializePropertiesPage();
});

function initializePropertiesPage() {
    loadProperties(1, {});
    setupEventListeners();
}

function setupEventListeners() {
    // Фильтры и пагинация
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('page-link')) {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            loadProperties(page, getCurrentFilters());
        }
        
        if (e.target.classList.contains('filter-btn')) {
            const filter = e.target.dataset.filter;
            applyFilter(filter);
        }
    });
}

function getCurrentFilters() {
    return {};
}

function applyFilter(filter) {
    console.log('Applying filter:', filter);
    loadProperties(1, getCurrentFilters());
}

async function loadProperties(page, filters) {
    console.log(`📥 Loading properties page ${page} with filters:`, filters);
    
    try {
        const response = await fetch(`/api/properties?page=${page}`);
        const properties = await response.json();
        
        console.log('✅ API Data received:', properties);
        displayProperties(properties);
        
    } catch (error) {
        console.error('❌ Error loading properties:', error);
        showError('Ошибка загрузки объектов');
    }
}

function displayProperties(properties) {
    console.log('🎨 Displaying properties:', properties.length);
    
    const container = document.getElementById('propertiesContainer');
    if (!container) {
        console.log('❌ propertiesContainer not found');
        return;
    }
    
    container.innerHTML = '';
    
    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
    
    updatePagination();
}

// 🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ - правильное создание карточек
function createPropertyCard(property) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4';
    
    // Безопасное получение URL фото
    const photoUrl = getSafePhotoUrl(property.photos);
    
    col.innerHTML = `
        <div class="property-card h-100">
            <div class="property-image">
                <img src="${photoUrl}" alt="${property.title || 'Объект недвижимости'}" 
                     class="property-img" onerror="this.src='/images/placeholder.jpg'">
                <div class="property-badge">${property.type || 'Продажа'}</div>
            </div>
            <div class="property-body">
                <h5 class="property-title">${property.title || 'Без названия'}</h5>
                <p class="property-location">
                    <i class="fas fa-map-marker-alt"></i> 
                    ${property.location || 'Адрес не указан'}
                </p>
                <div class="property-price">${formatPrice(property.price, property.currency)}</div>
                <div class="property-features">
                    ${getPropertyFeatures(property).join('')}
                </div>
                <a href="/object.html?id=${property.id || property.unid}" class="btn btn-primary w-100">
                    Подробнее
                </a>
            </div>
        </div>
    `;
    
    return col;
}

// 🔥 Функция безопасного получения фото
function getSafePhotoUrl(photos) {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return '/images/placeholder.jpg';
    }
    
    const firstPhoto = photos[0];
    
    // Если фото - строка
    if (typeof firstPhoto === 'string') {
        return firstPhoto.startsWith('http') ? firstPhoto : '/images/placeholder.jpg';
    }
    
    // Если фото - объект
    if (typeof firstPhoto === 'object' && firstPhoto !== null) {
        if (firstPhoto.url) return firstPhoto.url;
        if (firstPhoto.image) return firstPhoto.image;
        if (firstPhoto.src) return firstPhoto.src;
    }
    
    return '/images/placeholder.jpg';
}

function getPropertyFeatures(property) {
    const features = [];
    if (property.rooms) features.push(`<span>${property.rooms} комн.</span>`);
    if (property.area) features.push(`<span>${property.area} м²</span>`);
    if (property.floor) features.push(`<span>${property.floor} этаж</span>`);
    return features;
}

function formatPrice(price, currency = 'USD') {
    if (!price || price === '0') return 'Цена по запросу';
    
    const currencySymbols = {
        'USD': '$', 'EUR': '€', 'BYN': 'руб', 'RUB': '₽'
    };
    
    const symbol = currencySymbols[currency] || '$';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ' + symbol;
}

function updatePagination() {
    // Логика пагинации
}

function showError(message) {
    const container = document.getElementById('propertiesContainer');
    if (container) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">
                    <h4>Ошибка</h4>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Обновить страницу</button>
                </div>
            </div>
        `;
    }
}

// Автоматическое обновление каждые 30 секунд
setInterval(() => {
    loadProperties(1, getCurrentFilters());
}, 30000);
