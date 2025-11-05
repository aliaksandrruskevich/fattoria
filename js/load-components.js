// Динамическая подгрузка навигации и других компонентов
document.addEventListener('DOMContentLoaded', () => {
  // Подгрузка навигации из includes/header.html
  fetch('/includes/header.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка загрузки навигации');
      }
      return response.text();
    })
    .then(html => {
      // Вставляем навигацию в элемент с id="header-placeholder"
      const headerPlaceholder = document.getElementById('header-placeholder');
      if (headerPlaceholder) {
        headerPlaceholder.innerHTML = html;
        // Инициализируем обработчики форм после загрузки хедера
        initializeFormHandlers();

      }
    })
    .catch(error => {
      console.error('Ошибка при загрузке навигации:', error);
    });

  // Подгрузка футера из includes/footer.html
  fetch('/includes/footer.html')
    .then(response => {
      if (!response.ok) {
        throw new Error('Ошибка загрузки футера');
      }
      return response.text();
    })
    .then(html => {
      // Вставляем футер в элемент с id="footer-placeholder"
      const footerPlaceholder = document.getElementById('footer-placeholder');
      if (footerPlaceholder) {
        footerPlaceholder.innerHTML = html;
        // Инициализируем AOS после загрузки футера
        if (typeof AOS !== 'undefined') {
          AOS.init({ duration: 1000, once: true });
        }
        // Инициализируем обработчики форм после загрузки футера
        // Формы уже инициализированы в initializeFormHandlers()
        // Инициализируем обработчики модальных окон
        initializeModalHandlers();
      }
    })
    .catch(error => {
      console.error('Ошибка при загрузке футера:', error);
    });
});

// Функция для инициализации обработчиков форм
function initializeFormHandlers() {
  // Инициализируем формы в хедере
  const testDriveForm = document.getElementById('testDriveForm');
  const trustCallbackForm = document.getElementById('trustCallbackForm');

  if (testDriveForm) {
    testDriveForm.addEventListener('submit', handleFormSubmission);
  }

  if (trustCallbackForm) {
    trustCallbackForm.addEventListener('submit', handleFormSubmission);
  }

  // Инициализируем формы в футере
  const feedbackFormBottom = document.getElementById('feedbackFormBottom');
  if (feedbackFormBottom) {
    feedbackFormBottom.addEventListener('submit', handleFormSubmission);
  }

  // Форма contactForm теперь обрабатывается в forms.js
}

// Функция для обработки отправки форм
function handleFormSubmission(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Собираем данные формы
  const data = {
    name: form.querySelector('input[name="name"]')?.value || '',
    phone: form.querySelector('input[name="phone"]')?.value || '',
    email: form.querySelector('input[name="email"]')?.value || '',
    message: form.querySelector('input[name="message"]')?.value || '',
    address: form.querySelector('input[name="address"]')?.value || '',
    request: form.querySelector('input[name="request"]')?.value || '',
    project: getProjectName(),
    timestamp: new Date().toISOString(),
    source: window.location.pathname
  };

  // Показываем индикатор загрузки
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Отправляем...';

  // Отправляем форму
  submitFormData(data)
    .then(success => {
      if (success) {
        showNotification('Спасибо! Мы получили вашу заявку и свяжемся с вами в ближайшее время.', 'success');
        form.reset();
      } else {
        showNotification('Произошла ошибка при отправке. Попробуйте еще раз.', 'error');
      }
    })
    .catch(error => {
      console.error('Form submission error:', error);
      showNotification('Произошла ошибка при отправке. Попробуйте еще раз.', 'error');
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// Функция для получения названия проекта
function getProjectName() {
  const titleElement = document.querySelector('h1');
  if (titleElement) {
    const title = titleElement.textContent.trim();
    if (title && title !== 'Новостройки') {
      return title;
    }
  }

  const path = window.location.pathname;
  const pathParts = path.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart && lastPart !== 'новостройки.html') {
    return lastPart.replace('.html', '').replace(/-/g, ' ');
  }

  return 'Главная страница';
}

// Функция для отправки данных формы
async function submitFormData(data) {
  try {
    // Отправляем данные на Google Apps Script
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }

    const response = await fetch(window.scriptURL || "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", { // TODO: Замените YOUR_SCRIPT_ID на реальный ID Google Apps Script
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      return true;
    }

    return false;
  } catch (error) {
    console.log('Form submission failed:', error);
    return false;
  }
}

// Функция для сохранения в localStorage
function saveToLocalStorage(data) {
  try {
    const existingForms = JSON.parse(localStorage.getItem('pendingForms') || '[]');
    existingForms.push(data);
    localStorage.setItem('pendingForms', JSON.stringify(existingForms));
  } catch (error) {
    console.error('localStorage save failed:', error);
  }
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
  // Удаляем существующие уведомления
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  // Создаем элемент уведомления
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;

  // Добавляем стили
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    min-width: 300px;
    max-width: 500px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  const content = notification.querySelector('.notification-content');
  content.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  `;

  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  document.body.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Обработчик закрытия
  closeBtn.addEventListener('click', () => {
    closeNotification(notification);
  });

  // Автоматическое закрытие через 5 секунд
  setTimeout(() => {
    if (document.body.contains(notification)) {
      closeNotification(notification);
    }
  }, 5000);
}

function closeNotification(notification) {
  notification.style.transform = 'translateX(100%)';
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Функция для инициализации обработчиков модальных окон
function initializeModalHandlers() {
    // Добавляем обработчики событий для ссылок в футере после его загрузки
    const privacyLink = document.querySelector('a[onclick="showPrivacyModal()"]');
    const termsLink = document.querySelector('a[onclick="showTermsModal()"]');

    if (privacyLink) {
        privacyLink.addEventListener('click', function(e) {
            e.preventDefault();
            showPrivacyModal();
        });
    }

    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showTermsModal();
        });
    }
}

// Функция для инициализации обработчиков навигации
function initializeNavigationHandlers() {
  // Добавляем обработчики для всех ссылок навигации
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href');
      // Проверяем, является ли ссылка навигационной (не внешней, не якорной)
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
        // Не предотвращаем стандартное поведение для нормальной навигации
        // e.preventDefault();
        // Переходим на страницу
        // window.location.href = href;
      }
    }
  });
}

// Глобальные функции для модальных окон политики конфиденциальности и пользовательского соглашения
function showPrivacyModal() {
    // Создаем модальное окно политики конфиденциальности
    const modalHtml = `
        <div class="modal fade" id="privacyModal" tabindex="-1" aria-labelledby="privacyModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="privacyModalLabel">Политика конфиденциальности</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <h6>1. Общие положения</h6>
                        <p>Настоящая политика конфиденциальности определяет порядок обработки и защиты информации о физических и юридических лицах, использующих сервисы агентства недвижимости "Fattoria.by".</p>

                        <h6>2. Сбор информации</h6>
                        <p>Мы собираем следующие виды информации:</p>
                        <ul>
                            <li>Личную информацию (имя, телефон, email), предоставляемую пользователями при заполнении форм</li>
                            <li>Техническую информацию (IP-адрес, тип браузера, время посещения)</li>
                            <li>Информацию о предпочтениях пользователей при поиске недвижимости</li>
                        </ul>

                        <h6>3. Использование информации</h6>
                        <p>Собираемая информация используется для:</p>
                        <ul>
                            <li>Предоставления консультаций по недвижимости</li>
                            <li>Отправки информационных материалов и предложений</li>
                            <li>Улучшения качества обслуживания</li>
                            <li>Анализа посещаемости сайта</li>
                        </ul>

                        <h6>4. Защита информации</h6>
                        <p>Мы принимаем все необходимые меры для защиты вашей информации от несанкционированного доступа, изменения, раскрытия или уничтожения.</p>

                        <h6>5. Ваши права</h6>
                        <p>Вы имеете право:</p>
                        <ul>
                            <li>Получать информацию о обработке ваших данных</li>
                            <li>Требовать исправления неточных данных</li>
                            <li>Требовать удаления ваших данных</li>
                            <li>Отозвать согласие на обработку данных</li>
                        </ul>

                        <h6>6. Контактная информация</h6>
                        <p>По вопросам обработки данных обращайтесь:</p>
                        <ul>
                            <li>Телефон: +375 (44) 702-52-67</li>
                            <li>Email: ruskevichegor@gmail.com</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Добавляем модальное окно в DOM, если оно еще не существует
    if (!document.getElementById('privacyModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('privacyModal'));
    modal.show();
}

function showTermsModal() {
    // Создаем модальное окно пользовательского соглашения
    const modalHtml = `
        <div class="modal fade" id="termsModal" tabindex="-1" aria-labelledby="termsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="termsModalLabel">Пользовательское соглашение</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <h6>1. Общие положения</h6>
                        <p>Настоящее пользовательское соглашение регулирует отношения между агентством недвижимости "АН Фаттория" и пользователями сайта.</p>

                        <h6>2. Предмет соглашения</h6>
                        <p>Агентство предоставляет пользователям доступ к информационным материалам о недвижимости и услугам по подбору объектов.</p>

                        <h6>3. Права и обязанности сторон</h6>
                        <p><strong>Пользователь имеет право:</strong></p>
                        <ul>
                            <li>Получать информацию о доступных объектах недвижимости</li>
                            <li>Пользоваться формами обратной связи</li>
                            <li>Подписываться на информационные рассылки</li>
                        </ul>

                        <p><strong>Пользователь обязуется:</strong></p>
                        <ul>
                            <li>Предоставлять достоверную информацию</li>
                            <li>Не нарушать законодательство Республики Беларусь</li>
                            <li>Уважать права третьих лиц</li>
                        </ul>

                        <h6>4. Ответственность</h6>
                        <p>Агентство не несет ответственности за неточности в информации, предоставленной третьими лицами, а также за технические сбои в работе сайта.</p>

                        <h6>5. Изменение условий</h6>
                        <p>Агентство оставляет за собой право вносить изменения в настоящее соглашение без предварительного уведомления пользователей.</p>

                        <h6>6. Контактная информация</h6>
                        <p>По вопросам использования сайта обращайтесь:</p>
                        <ul>
                            <li>Телефон: +375 (44) 702-52-67</li>
                            <li>Email: ruskevichegor@gmail.com</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Добавляем модальное окно в DOM, если оно еще не существует
    if (!document.getElementById('termsModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('termsModal'));
    modal.show();
}
