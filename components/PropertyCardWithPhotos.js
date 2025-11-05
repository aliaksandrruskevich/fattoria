import React from 'react';
import './PropertyCardWithPhotos.css';

const PropertyCardWithPhotos = ({ property }) => {
    const {
        title,
        address,
        district,
        area,
        details,
        priceUSD,
        pricePerM2,
        rooms,
        photos = [],
        contact_name = 'Павел',
        contact_phone = '8-029-190-00-88'
    } = property;

    const mainPhoto = photos[0] || '';
    const photoCount = photos.length;

    return (
        <div className="property-card">
            {/* Блок с фото */}
            <div className="property-card__image-container">
                {mainPhoto ? (
                    <img 
                        src={mainPhoto} 
                        alt={title}
                        className="property-card__image"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                
                <div className={`property-card__image-placeholder ${mainPhoto ? 'property-card__image-placeholder--hidden' : ''}`}>
                    📷 Фото не доступно
                </div>
                
                {/* Бейдж количества фото */}
                {photoCount > 0 && (
                    <div className="property-card__photo-badge">
                        📸 {photoCount} фото
                    </div>
                )}
                
                {/* Бейдж статуса */}
                <div className="property-card__status-badge">
                    Функом дость
                </div>
            </div>
            
            {/* Контент */}
            <div className="property-card__content">
                {/* Заголовок и цена */}
                <div className="property-card__header">
                    <h3 className="property-card__title">{title || 'Название не указано'}</h3>
                    <div className="property-card__price">
                        {priceUSD || 'договорная'}
                    </div>
                </div>
                
                {/* Адрес */}
                <div className="property-card__address">
                    📍 {address || 'Адрес не указан'}
                </div>
                
                {/* Детали в grid */}
                <div className="property-card__details-grid">
                    {rooms && <div className="property-card__detail"><strong>🏠 Комнат:</strong> {rooms}</div>}
                    {area && <div className="property-card__detail"><strong>📐 Площадь:</strong> {area}</div>}
                    {district && <div className="property-card__detail"><strong>🏙️ Район:</strong> {district}</div>}
                    {details && <div className="property-card__detail"><strong>📋 Детали:</strong> {details}</div>}
                </div>
                
                {/* Цена за м² */}
                {pricePerM2 && (
                    <div className="property-card__price-per-m2">
                        <strong>💰 Цена за м²:</strong> {pricePerM2}
                    </div>
                )}
                
                {/* Контакты */}
                <div className="property-card__contacts">
                    <strong>👤 Контакт:</strong> {contact_name} | 📞 {contact_phone}
                </div>
            </div>
        </div>
    );
};

export default PropertyCardWithPhotos;
