// Загрузчик компонентов header
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем header из includes/header.html
    fetch('/includes/header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось загрузить header');
            }
            return response.text();
        })
        .then(html => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = html;
                console.log('Header загружен успешно');
            } else {
                console.warn('Элемент header-placeholder не найден');
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки header:', error);
        });
});
