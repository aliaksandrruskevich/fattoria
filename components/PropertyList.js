import React, { useState, useEffect } from 'react';
import PropertyCardWithPhotos from './PropertyCardWithPhotos';
import './PropertyList.css';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        try {
            setLoading(true);
            // Загружаем данные из API или файла
            const response = await fetch('/api/properties');
            const data = await response.json();
            setProperties(data);
        } catch (err) {
            console.error('Error loading properties:', err);
            setError('Не удалось загрузить объекты недвижимости');
            // Fallback: загружаем из локального файла
            try {
                const localData = await import('../debug_properties.json');
                setProperties(localData.default || localData);
            } catch (localErr) {
                setError('Нет данных для отображения');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="property-list-loading">
                <div className="loading-spinner"></div>
                <p>Загружаем объекты недвижимости...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="property-list-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={loadProperties} className="retry-button">
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="property-list">
            <div className="property-list-header">
                <h1>🏠 Fattoria.by</h1>
                <p>Объекты недвижимости с фотографиями</p>
                <div className="property-list-stats">
                    Всего объектов: {properties.length} | 
                    С фото: {properties.filter(p => p.photos && p.photos.length > 0).length}
                </div>
            </div>
            
            <div className="property-list-grid">
                {properties.map(property => (
                    <PropertyCardWithPhotos 
                        key={property.unid} 
                        property={property} 
                    />
                ))}
            </div>
            
            {properties.length === 0 && (
                <div className="property-list-empty">
                    <div className="empty-icon">🏠</div>
                    <p>Нет объектов недвижимости для отображения</p>
                </div>
            )}
        </div>
    );
};

export default PropertyList;
