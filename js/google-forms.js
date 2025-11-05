// Google Forms Integration
class GoogleFormsHandler {
  constructor() {
    // Замените на ваш Google Form URL
    this.GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse';
    this.CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

    // Маппинг полей формы
    this.FIELD_MAPPINGS = {
      name: 'entry.YOUR_NAME_FIELD_ID',
      phone: 'entry.YOUR_PHONE_FIELD_ID',
      email: 'entry.YOUR_EMAIL_FIELD_ID',
      message: 'entry.YOUR_MESSAGE_FIELD_ID',
      project: 'entry.YOUR_PROJECT_FIELD_ID',
      timestamp: 'entry.YOUR_TIMESTAMP_FIELD_ID',
      source: 'entry.YOUR_SOURCE_FIELD_ID'
    };
  }

  // Отправка данных в Google Forms
  async submitToGoogleForms(formData) {
    try {
      // Подготавливаем данные для отправки
      const googleFormData = new FormData();

      // Маппим поля на Google Form поля
      Object.keys(this.FIELD_MAPPINGS).forEach(key => {
        const googleField = this.FIELD_MAPPINGS[key];
        const value = formData[key] || '';

        if (googleField && value) {
          googleFormData.append(googleField, value);
        }
      });

      // Добавляем дополнительные поля
      googleFormData.append('entry.YOUR_NAME_FIELD_ID', formData.name || '');
      googleFormData.append('entry.YOUR_PHONE_FIELD_ID', formData.phone || '');
      googleFormData.append('entry.YOUR_EMAIL_FIELD_ID', formData.email || '');
      googleFormData.append('entry.YOUR_PROJECT_FIELD_ID', formData.project || '');
      googleFormData.append('entry.YOUR_MESSAGE_FIELD_ID', formData.message || '');
      googleFormData.append('entry.YOUR_TIMESTAMP_FIELD_ID', formData.timestamp || '');
      googleFormData.append('entry.YOUR_SOURCE_FIELD_ID', formData.source || '');

      // Используем CORS proxy для отправки
      const response = await fetch(this.CORS_PROXY + this.GOOGLE_FORM_URL, {
        method: 'POST',
        body: googleFormData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.ok) {
        console.log('Form submitted to Google Forms successfully');
        return true;
      } else {
        throw new Error('Google Forms submission failed');
      }
    } catch (error) {
      console.error('Error submitting to Google Forms:', error);
      return false;
    }
  }

  // Альтернативный метод с прямой отправкой (если CORS proxy не работает)
  async submitToGoogleFormsDirect(formData) {
    try {
      const params = new URLSearchParams();

      // Маппим поля
      params.append('entry.YOUR_NAME_FIELD_ID', formData.name || '');
      params.append('entry.YOUR_PHONE_FIELD_ID', formData.phone || '');
      params.append('entry.YOUR_EMAIL_FIELD_ID', formData.email || '');
      params.append('entry.YOUR_PROJECT_FIELD_ID', formData.project || '');
      params.append('entry.YOUR_MESSAGE_FIELD_ID', formData.message || '');
      params.append('entry.YOUR_TIMESTAMP_FIELD_ID', formData.timestamp || '');
      params.append('entry.YOUR_SOURCE_FIELD_ID', formData.source || '');

      const response = await fetch(`${this.GOOGLE_FORM_URL}?${params.toString()}`, {
        method: 'GET', // Google Forms может принимать GET запросы
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.ok) {
        console.log('Form submitted to Google Forms successfully (direct method)');
        return true;
      } else {
        throw new Error('Google Forms submission failed');
      }
    } catch (error) {
      console.error('Error submitting to Google Forms (direct):', error);
      return false;
    }
  }

  // Метод для отправки через Google Apps Script (рекомендуемый)
  async submitToGoogleAppsScript(formData) {
    try {
      // Замените на ваш Google Apps Script URL
      const appsScriptUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // TODO: Замените YOUR_SCRIPT_ID на реальный ID Google Apps Script

      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Form submitted to Google Apps Script successfully:', result);
        return true;
      } else {
        throw new Error('Google Apps Script submission failed');
      }
    } catch (error) {
      console.error('Error submitting to Google Apps Script:', error);
      return false;
    }
  }

  // Основной метод отправки с fallback
  async submitForm(formData) {
    console.log('Submitting form to Google Forms:', formData);

    // Пробуем разные методы отправки
    let success = false;

    // Метод 1: Google Apps Script (рекомендуемый)
    try {
      success = await this.submitToGoogleAppsScript(formData);
      if (success) return true;
    } catch (error) {
      console.log('Google Apps Script failed, trying direct method...');
    }

    // Метод 2: Прямой метод
    try {
      success = await this.submitToGoogleFormsDirect(formData);
      if (success) return true;
    } catch (error) {
      console.log('Direct method failed, trying CORS proxy...');
    }

    // Метод 3: CORS proxy
    try {
      success = await this.submitToGoogleForms(formData);
      if (success) return true;
    } catch (error) {
      console.log('CORS proxy method failed');
    }

    return success;
  }
}

// Создаем экземпляр обработчика
const googleFormsHandler = new GoogleFormsHandler();

// Экспортируем для использования в других файлах
window.GoogleFormsHandler = GoogleFormsHandler;
window.googleFormsHandler = googleFormsHandler;
