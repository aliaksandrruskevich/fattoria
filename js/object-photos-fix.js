// object-photos-fix.js - РАБОЧАЯ версия
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ object-photos-fix.js loaded');
    
    // Перехватываем загрузку property details
    const originalLoadPropertyDetails = window.loadPropertyDetails;
    
    window.loadPropertyDetails = async function(unid) {
        try {
            const response = await fetch(`/api/property/${unid}`);
            const property = await response.json();
            
            if (property) {
                // Исправляем фото перед отображением
                property.photos = fixPhotosArray(property.photos);
                displayPropertyDetails(property);
                initPropertyMap(property);
            }
        } catch (error) {
            console.error('Error loading property:', error);
            showError('Ошибка загрузки объекта');
        }
    };
    
    function fixPhotosArray(photos) {
        if (!photos || !Array.isArray(photos)) return [];
        
        return photos.map(photo => {
            if (typeof photo === 'string') return photo;
            if (photo && photo.url) return photo.url;
            if (photo && photo.image) return photo.image;
            return '/images/placeholder.jpg';
        });
    }
});
