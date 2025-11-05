/// JavaScript для страницы "Наши объекты" - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
console.log('🔄 nashi-obekty.js loaded - version: ' + new Date().toISOString());

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM Content Loaded - initializing properties page...');

  // Функция для безопасного получения URL фото
  function getSafePhotoUrl(photos) {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPs6VzrzOu866zrXOr86/z4IgPC90ZXh0Pjwvc3ZnPg==';
    }
    const firstPhoto = photos[0];
    if (typeof firstPhoto === 'string') {
      return firstPhoto;
    }
    if (typeof firstPhoto === 'object' && firstPhoto !== null && firstPhoto.$ && firstPhoto.$.picture) {
      return firstPhoto.$.picture;
    }
    if (typeof firstPhoto === 'object' && firstPhoto !== null) {
      if (firstPhoto.url) return firstPhoto.url;
      if (firstPhoto.photo_url) return firstPhoto.photo_url;
    }
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI5MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+0KTRg9C90LrQvtC8INC00L7RgdGC0Yw8L3RleHQ+PC9zdmc+';
  }

  // Инициализация AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true
    });
  }

  // Переменные для управления объектами
  const propertiesContainer = document.getElementById('propertiesContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const currentPageSpan = document.getElementById('currentPage');
  const totalPagesSpan = document.getElementById('totalPages');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');

  let currentPage = 1;
  let totalPages = 1;
  let currentProperties = [];
  let currentFilters = {};

  // Загрузка свойств
  function loadProperties(page = 1, filters = {}) {
    console.log(`📥 Loading properties page ${page} with filters:`, filters);
    
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';

    let url = `/api/properties?limit=6&offset=${(page - 1) * 6}`;
    
    // Добавляем фильтры в URL
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        url += `&${key}=${encodeURIComponent(filters[key])}`;
      }
    });

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('✅ API Data received:', data);
        
        if (Array.isArray(data)) {
          currentProperties = data;
        } else if (data.properties && Array.isArray(data.properties)) {
          currentProperties = data.properties;
        } else if (data.data && Array.isArray(data.data)) {
          currentProperties = data.data;
        } else {
          console.warn('⚠️ Unknown data format, using empty array');
          currentProperties = [];
        }
        
        displayProperties();
        updatePagination();
      })
      .catch(error => {
        console.error('❌ Error loading properties:', error);
        if (errorMessage) {
          errorMessage.textContent = 'Ошибка загрузки объектов. Попробуйте обновить страницу.';
          errorMessage.style.display = 'block';
        }
      })
      .finally(() => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
      });
  }

  // Отображение свойств
  function displayProperties() {
    console.log('🎨 Displaying properties:', currentProperties.length);
    console.log('🔍 First property:', currentProperties[0]);
    propertiesContainer.innerHTML = '';

    if (currentProperties.length === 0) {
      propertiesContainer.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-home fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">Объекты не найдены</h5>
          <p class="text-muted">Попробуйте изменить параметры поиска</p>
        </div>
      `;
      return;
    }

    // Создаем контейнер для карточек
    const container = document.createElement('div');
    container.className = 'row';

    currentProperties.forEach((property, index) => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-6 col-xl-4 mb-4';
      col.setAttribute('data-aos', 'fade-up');
      col.setAttribute('data-aos-delay', (index * 100).toString());

      const propertyCard = createPropertyCard(property);
      col.appendChild(propertyCard);
      container.appendChild(col);
    });

    propertiesContainer.appendChild(container);
  }

  function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card h-100';
 // ← ДОБАВЬ ЭТУ СТРОКУ

    // Безопасная загрузка изображения
    const imageUrl = getSafePhotoUrl(property.photos);

    const cleanTitle = property.title || 'Объект недвижимости';
    const address = property.location || property.address || 'Адрес не указан';
    const priceBYN = property.price ? property.price.toLocaleString() + ' BYN' : 'договорная';
    const priceUSD = property.priceUSD || '';
    const pricePerM2 = property.pricePerM2 || '';
    const area = property.area_total || property.area || '';
    const details = property.description || property.details || '';
    const rooms = property.rooms || '';
    const district = property.district || '';
    const contact_name = property.contact_name || '';
    const contact_phone = property.contact_phone || '';

    // Новые поля из API
    const storey = property.storey || '';
    const storeys = property.storeys || '';
    const repairState = property.repair_state || '';
    const heating = property.heating || '';
    const buildingYear = property.building_year || '';
    const houseType = property.house_type || '';
    const additionalParams = property.additional_params || [];

    card.innerHTML = `
      <div class="property-image position-relative">
        <img src="${imageUrl}"
             alt="${cleanTitle}"
             class="property-img w-100"
             style="height: 200px; object-fit: cover;"
             loading="lazy">

        <!-- Бейдж количества фото -->
        ${property.photos && property.photos.length > 0 ? `
          <div class="photo-badge bg-dark text-white px-2 py-1 rounded position-absolute top-0 end-0 m-2 small">
            <i class="fas fa-camera me-1"></i>${property.photos.length}
          </div>
        ` : ''}
      </div>

      <div class="property-content p-3">
        <h6 class="property-title mb-2" style="font-weight: 600; font-size: 1.1rem; line-height: 1.3; min-height: 2.6em;">
          ${cleanTitle}
        </h6>

        <p class="property-address text-muted small mb-2">
          <i class="fas fa-map-marker-alt me-1"></i>${address}
        </p>

        ${district ? `
          <p class="property-district text-muted small mb-2">
            <i class="fas fa-compass me-1"></i>${district}
          </p>
        ` : ''}

        <div class="property-price mb-2">
          <strong class="text-primary" style="font-size: 1.2rem;">${priceBYN}</strong>
          ${priceUSD ? `<br><span class="text-muted small">${priceUSD}</span>` : ''}
        </div>

        ${pricePerM2 ? `
          <p class="property-price-m2 text-muted small mb-2">
            ${pricePerM2} за м²
          </p>
        ` : ''}

        <div class="property-details text-muted small mb-3">
          ${area ? `<div><i class="fas fa-ruler-combined me-1"></i>${area} м²</div>` : ''}
          ${rooms ? `<div><i class="fas fa-door-open me-1"></i>${rooms} комн.</div>` : ''}
          ${storey && storeys ? `<div><i class="fas fa-building me-1"></i>${storey}/${storeys} эт.</div>` : ''}
          ${repairState ? `<div><i class="fas fa-tools me-1"></i>${repairState}</div>` : ''}
          ${heating ? `<div><i class="fas fa-fire me-1"></i>${heating}</div>` : ''}
          ${buildingYear ? `<div><i class="fas fa-calendar me-1"></i>${buildingYear} г.</div>` : ''}
          ${houseType ? `<div><i class="fas fa-home me-1"></i>${houseType}</div>` : ''}
        </div>

        ${additionalParams.length > 0 ? `
          <div class="property-additional-params mb-3">
            <div class="d-flex flex-wrap gap-1">
              ${additionalParams.map(param => `<span class="badge bg-light text-dark small">${param}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${details && details.length > 100 ? `
          <p class="property-description text-muted small mb-3" style="font-size: 0.85rem; line-height: 1.4;">
            ${details.substring(0, 100)}...
          </p>
        ` : details ? `
          <p class="property-description text-muted small mb-3" style="font-size: 0.85rem; line-height: 1.4;">
            ${details}
          </p>
        ` : ''}

        <button class="btn btn-warning btn-sm w-100 view-details-btn"
                data-property-id="${property.unid || property.id}">
          <i class="fas fa-eye me-1"></i>Подробнее
        </button>
      </div>
    `;

    // Обработчик кнопки "Подробнее"
    const viewBtn = card.querySelector('.view-details-btn');
   viewBtn.addEventListener('click', function() {
    // Используем маршрут с параметром в пути
    window.location.href = `/object/${property.unid}`;
});

    return card;
  }

  function showPropertyDetails(propertyId) {
    console.log('🔍 Showing details for property:', propertyId);
    
    const property = currentProperties.find(p => 
      p.unid === propertyId || p.id === propertyId || p.id?.toString() === propertyId
    );

    if (!property) {
      console.error('❌ Property not found:', propertyId);
      return;
    }

    const modalElement = document.getElementById('propertyModal');
    if (!modalElement) {
      console.error('❌ propertyModal element not found');
      return;
    }

    const modal = new bootstrap.Modal(modalElement);
    const modalTitle = modalElement.querySelector('.modal-title');
    const modalContent = modalElement.querySelector('.modal-body');

    modalTitle.textContent = property.title || 'Объект недвижимости';

    const mainPhoto = getSafePhotoUrl(property.photos);

    modalContent.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <img src="${mainPhoto}"
               class="img-fluid rounded mb-3"
               alt="${property.title}"
               style="height: 300px; object-fit: cover; width: 100%;">

          ${property.photos && property.photos.length > 1 ? `
            <div class="text-center text-muted small">
              <i class="fas fa-camera me-1"></i>
              Еще ${property.photos.length - 1} фото доступно
            </div>
          ` : ''}
        </div>
        
        <div class="col-md-6">
          <h6 class="mb-3">Информация об объекте</h6>

          ${property.location || property.address ? `
            <p><strong>Адрес:</strong> ${property.location || property.address}</p>
          ` : ''}

          ${property.district ? `
            <p><strong>Район:</strong> ${property.district}</p>
          ` : ''}

          ${property.area_total || property.area ? `
            <p><strong>Площадь:</strong> ${property.area_total || property.area} м²</p>
          ` : ''}

          ${property.rooms ? `
            <p><strong>Комнат:</strong> ${property.rooms}</p>
          ` : ''}

          ${property.storey && property.storeys ? `
            <p><strong>Этаж:</strong> ${property.storey}/${property.storeys}</p>
          ` : ''}

          ${property.repair_state ? `
            <p><strong>Ремонт:</strong> ${property.repair_state}</p>
          ` : ''}

          ${property.heating ? `
            <p><strong>Отопление:</strong> ${property.heating}</p>
          ` : ''}

          ${property.building_year ? `
            <p><strong>Год постройки:</strong> ${property.building_year}</p>
          ` : ''}

          ${property.house_type ? `
            <p><strong>Тип дома:</strong> ${property.house_type}</p>
          ` : ''}

          ${property.price ? `
            <p><strong>Цена:</strong> ${property.price.toLocaleString()} BYN</p>
          ` : ''}

          ${property.priceUSD ? `
            <p><strong>Цена (USD):</strong> ${property.priceUSD}</p>
          ` : ''}

          ${property.pricePerM2 ? `
            <p><strong>Цена за м²:</strong> ${property.pricePerM2}</p>
          ` : ''}

          ${property.additional_params && property.additional_params.length > 0 ? `
            <p><strong>Дополнительно:</strong> ${property.additional_params.join(', ')}</p>
          ` : ''}

          ${property.description || property.details ? `
            <p><strong>Описание:</strong> ${property.description || property.details}</p>
          ` : ''}

          ${property.contact_name || property.contact_phone ? `
            <div class="mt-4 p-3 bg-light rounded">
              <h6 class="mb-2">Контактная информация</h6>
              ${property.contact_name ? `<p class="mb-1"><strong>Контактное лицо:</strong> ${property.contact_name}</p>` : ''}
              ${property.contact_phone ? `<p class="mb-0"><strong>Телефон:</strong> ${property.contact_phone}</p>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    modal.show();
  }

  // Обновление пагинации
  function updatePagination() {
    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }

  // Обработчики кнопок пагинации
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadProperties(currentPage, currentFilters);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadProperties(currentPage, currentFilters);
      }
    });
  }

  // Инициализация
  loadProperties();
});
// === ДОБАВЛЕНО: Функции для работы с фото из Realt.by ===

// Новая функция создания карточки с фото
function createPropertyCardWithPhotos(property) {
    const hasPhotos = property.photos && property.photos.length > 0;
    const mainPhoto = hasPhotos ? property.photos[0] : '/images/no-photo.jpg';
    const photoCount = hasPhotos ? property.photos.length : 0;
    
    return `
    <div class="col-md-6 col-lg-4 mb-4">
        <div class="property-card h-100" data-id="${property.id || property.unid}">
            <div class="property-image">
                <img src="${mainPhoto}" 
                     alt="${property.title || 'Объект недвижимости'}" 
                     class="property-img"
                     onerror="this.src='/images/no-photo.jpg'">
                
                ${photoCount > 0 ? `
                <div class="photo-badge">
                    <i class="fas fa-camera"></i> ${photoCount} фото
                </div>
                ` : ''}
                
                <div class="property-price-badge">
                    ${property.priceUSD || property.price || 'договорная'}
                </div>
                
                <div class="property-type-badge">
                    ${property.rooms ? property.rooms + ' комн.' : 'Недвижимость'}
                </div>
            </div>
            
            <div class="card-body">
                <h5 class="card-title">${property.title || 'Объект недвижимости'}</h5>
                <p class="card-text text-muted">
                    <i class="fas fa-map-marker-alt"></i> 
                    ${property.address || 'Адрес не указан'}
                </p>
                
                <div class="property-features">
                    ${property.area ? `<span><i class="fas fa-ruler-combined"></i> ${property.area}</span>` : ''}
                    ${property.district ? `<span><i class="fas fa-building"></i> ${property.district}</span>` : ''}
                    ${property.details ? `<span><i class="fas fa-info-circle"></i> ${property.details}</span>` : ''}
                </div>
                
                <div class="property-actions mt-3">
                    <button class="btn btn-primary btn-sm view-details" 
                            data-property='${JSON.stringify(property).replace(/'/g, "&#39;")}'>
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                    <button class="btn btn-outline-secondary btn-sm favorite-btn">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

// Функция загрузки данных с фото
async function loadPropertiesWithPhotos() {
    try {
        console.log('🔄 Загружаем объекты с фото...');
        
        // Пробуем загрузить из нашего API
        const response = await fetch('/api/properties');
        if (response.ok) {
            const properties = await response.json();
            return properties;
        }
        
        // Fallback: используем данные из парсера
        const localResponse = await fetch('/data/properties.json');
        if (localResponse.ok) {
            const properties = await localResponse.json();
            return properties;
        }
        
        throw new Error('Нет данных для отображения');
        
    } catch (error) {
        console.error('Ошибка загрузки объектов:', error);
        return []; // Возвращаем пустой массив чтобы не ломать страницу
    }
}

// Обновляем существующую функцию отображения
function displayPropertiesWithPhotos(properties) {
    const propertiesGrid = document.getElementById('propertiesGrid');
    if (!propertiesGrid) return;
    
    // Создаем карточки с фото
    propertiesGrid.innerHTML = properties.map(property => 
        createPropertyCardWithPhotos(property)
    ).join('');
    
    // Добавляем обработчики событий (используем существующие функции)
    addCardEventListeners();
}

// Инициализация с фото (добавляем в существующую инициализацию)
document.addEventListener('DOMContentLoaded', function() {
    // Существующий код инициализации...
    
    // Дополнительно загружаем объекты с фото
    loadPropertiesWithPhotos().then(properties => {
        if (properties.length > 0) {
            displayPropertiesWithPhotos(properties);
        }
        // Если не удалось загрузить с фото, остаётся существующий функционал
    });
});
