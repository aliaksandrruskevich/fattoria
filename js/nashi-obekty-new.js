// JavaScript для страницы "Наши объекты"
console.log('🔄 nashi-obekty.js loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM Content Loaded - initializing properties page...');

  // Функция для безопасного получения URL фото
  function getSafePhotoUrl(photos) {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPs6VzrzOu866zrXOr86/z4IgPC90ZXh0Pjwvc3ZnPg==';
    }
    const firstPhoto = photos[0];
    if (typeof firstPhoto === 'string') return firstPhoto;
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

  // Основные переменные
  const propertiesContainer = document.getElementById('propertiesContainer');
  
  function loadProperties() {
    console.log('📥 Loading properties...');
    // Базовая реализация
  }

  loadProperties();
});
