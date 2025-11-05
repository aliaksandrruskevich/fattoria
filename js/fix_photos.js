// Функция для безопасного получения URL фото
function getSafePhotoUrl(photos) {
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPs6VzrzOu866zrXOr86/z4IgPC90ZXh0Pjwvc3ZnPg==';
    }
    
    const firstPhoto = photos[0];
    if (typeof firstPhoto === 'string' && firstPhoto.startsWith('http')) {
        return firstPhoto;
    }
    
    // Если это объект, попробуем извлечь URL
    if (typeof firstPhoto === 'object' && firstPhoto !== null) {
        if (firstPhoto.url && typeof firstPhoto.url === 'string') {
            return firstPhoto.url;
        }
        if (firstPhoto.photo_url && typeof firstPhoto.photo_url === 'string') {
            return firstPhoto.photo_url;
        }
        if (firstPhoto.link && typeof firstPhoto.link === 'string') {
            return firstPhoto.link;
        }
    }
    
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPs6VzrzOu866zrXOr86/z4IgPC90ZXh0Pjwvc3ZnPg==';
}
