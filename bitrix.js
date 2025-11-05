const axios = require('axios');

// Настройки Bitrix24
const BITRIX_CONFIG = {
    // Замените на ваш webhook URL из Bitrix24
    // Формат: https://yourdomain.bitrix24.ru/rest/1/your_webhook_code/
    webhookUrl: process.env.BITRIX_WEBHOOK_URL || 'https://b24-7f121e.bitrix24.by/rest/1/i9js4wq3krz8ek24/',

    // ID пользователей для назначения задач
    responsibleUserId: process.env.BITRIX_RESPONSIBLE_USER_ID || 1,

    // ID источника лидов
    sourceId: process.env.BITRIX_SOURCE_ID || 'WEB',

    // Статус лида по умолчанию
    defaultStatus: 'NEW'
};

// Функция для создания лида в Bitrix24
async function createLead(leadData) {
    try {
        const leadFields = {
            TITLE: `Заявка с сайта: ${leadData.subject || 'Контактная форма'}`,
            NAME: leadData.name || '',
            PHONE: [{ VALUE: leadData.phone || '', VALUE_TYPE: 'WORK' }],
            EMAIL: leadData.email ? [{ VALUE: leadData.email, VALUE_TYPE: 'WORK' }] : [],
            COMMENTS: leadData.message || leadData.comment || '',
            SOURCE_ID: BITRIX_CONFIG.sourceId,
            ASSIGNED_BY_ID: BITRIX_CONFIG.responsibleUserId,
            STATUS_ID: BITRIX_CONFIG.defaultStatus,
            UF_CRM_123456789: leadData.propertyUnid || '', // Кастомное поле для ID объекта
            UF_CRM_987654321: leadData.source || 'website' // Кастомное поле для источника
        };

        // Добавляем дополнительные поля если они есть
        if (leadData.propertyTitle) {
            leadFields.TITLE += ` - ${leadData.propertyTitle}`;
        }

        if (leadData.budget) {
            leadFields.OPPORTUNITY = parseFloat(leadData.budget);
            leadFields.CURRENCY_ID = leadData.currency || 'USD';
        }

        const response = await axios.post(`${BITRIX_CONFIG.webhookUrl}crm.lead.add`, {
            fields: leadFields
        });

        if (response.data.result) {
            console.log('Лид успешно создан в Bitrix24:', response.data.result);
            return { success: true, leadId: response.data.result };
        } else {
            throw new Error('Ошибка создания лида: ' + JSON.stringify(response.data.error));
        }
    } catch (error) {
        console.error('Ошибка при создании лида в Bitrix24:', error.message);
        return { success: false, error: error.message };
    }
}

// Функция для создания контакта в Bitrix24
async function createContact(contactData) {
    try {
        const contactFields = {
            NAME: contactData.name || '',
            PHONE: contactData.phone ? [{ VALUE: contactData.phone, VALUE_TYPE: 'WORK' }] : [],
            EMAIL: contactData.email ? [{ VALUE: contactData.email, VALUE_TYPE: 'WORK' }] : [],
            COMMENTS: contactData.message || '',
            ASSIGNED_BY_ID: BITRIX_CONFIG.responsibleUserId
        };

        const response = await axios.post(`${BITRIX_CONFIG.webhookUrl}crm.contact.add`, {
            fields: contactFields
        });

        if (response.data.result) {
            console.log('Контакт успешно создан в Bitrix24:', response.data.result);
            return { success: true, contactId: response.data.result };
        } else {
            throw new Error('Ошибка создания контакта: ' + JSON.stringify(response.data.error));
        }
    } catch (error) {
        console.error('Ошибка при создании контакта в Bitrix24:', error.message);
        return { success: false, error: error.message };
    }
}

// Функция для создания сделки в Bitrix24
async function createDeal(dealData) {
    try {
        const dealFields = {
            TITLE: `Сделка: ${dealData.title || 'Недвижимость'}`,
            CONTACT_ID: dealData.contactId || null,
            ASSIGNED_BY_ID: BITRIX_CONFIG.responsibleUserId,
            OPPORTUNITY: dealData.price || 0,
            CURRENCY_ID: dealData.currency || 'USD',
            COMMENTS: dealData.description || '',
            STAGE_ID: 'NEW', // Стадия сделки
            CATEGORY_ID: 0 // Направление продаж
        };

        const response = await axios.post(`${BITRIX_CONFIG.webhookUrl}crm.deal.add`, {
            fields: dealFields
        });

        if (response.data.result) {
            console.log('Сделка успешно создана в Bitrix24:', response.data.result);
            return { success: true, dealId: response.data.result };
        } else {
            throw new Error('Ошибка создания сделки: ' + JSON.stringify(response.data.error));
        }
    } catch (error) {
        console.error('Ошибка при создании сделки в Bitrix24:', error.message);
        return { success: false, error: error.message };
    }
}

// Функция для создания задачи в Bitrix24
async function createTask(taskData) {
    try {
        const taskFields = {
            TITLE: taskData.title || 'Новая задача',
            DESCRIPTION: taskData.description || '',
            RESPONSIBLE_ID: BITRIX_CONFIG.responsibleUserId,
            CREATED_BY: BITRIX_CONFIG.responsibleUserId,
            PRIORITY: taskData.priority || '2', // 1 - низкий, 2 - средний, 3 - высокий
            DEADLINE: taskData.deadline || null
        };

        const response = await axios.post(`${BITRIX_CONFIG.webhookUrl}tasks.task.add`, {
            fields: taskFields
        });

        if (response.data.result) {
            console.log('Задача успешно создана в Bitrix24:', response.data.result);
            return { success: true, taskId: response.data.result };
        } else {
            throw new Error('Ошибка создания задачи: ' + JSON.stringify(response.data.error));
        }
    } catch (error) {
        console.error('Ошибка при создании задачи в Bitrix24:', error.message);
        return { success: false, error: error.message };
    }
}

// Универсальная функция для обработки форм
async function handleFormSubmission(formType, formData) {
    try {
        let result;

        switch (formType) {
            case 'contact':
                result = await createContact(formData);
                break;
            case 'lead':
                result = await createLead(formData);
                break;
            case 'deal':
                result = await createDeal(formData);
                break;
            case 'task':
                result = await createTask(formData);
                break;
            default:
                result = await createLead(formData); // По умолчанию создаем лид
        }

        return result;
    } catch (error) {
        console.error('Ошибка обработки формы:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    createLead,
    createContact,
    createDeal,
    createTask,
    handleFormSubmission,
    BITRIX_CONFIG
};
