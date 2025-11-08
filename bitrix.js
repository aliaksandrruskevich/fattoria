const axios = require('axios');

class BitrixAPI {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    async getDeals(batchSize = 50) {
        try {
            let allResults = [];
            let start = 0;
            let hasMore = true;

            while (hasMore) {
                const response = await axios.get(`${this.webhookUrl}/crm.deal.list`, {
                    params: {
                        start: start,
                        select: ["*", "UF_*"]
                    }
                });

                if (response.data && response.data.result) {
                    allResults = allResults.concat(response.data.result);
                    
                    if (response.data.result.length < batchSize) {
                        hasMore = false;
                    } else {
                        start += batchSize;
                    }
                } else {
                    hasMore = false;
                }
            }

            return allResults;
        } catch (error) {
            console.error('Error fetching deals:', error.message);
            return [];
        }
    }

    async getDealProducts(dealId) {
        try {
            const response = await axios.get(`${this.webhookUrl}/crm.deal.productrows.get`, {
                params: { id: dealId }
            });
            return response.data.result || [];
        } catch (error) {
            console.error(`Error fetching products for deal ${dealId}:`, error.message);
            return [];
        }
    }

    async getContact(contactId) {
        try {
            const response = await axios.get(`${this.webhookUrl}/crm.contact.get`, {
                params: { id: contactId }
            });
            return response.data.result;
        } catch (error) {
            console.error(`Error fetching contact ${contactId}:`, error.message);
            return null;
        }
    }

    async getCompany(companyId) {
        try {
            const response = await axios.get(`${this.webhookUrl}/crm.company.get`, {
                params: { id: companyId }
            });
            return response.data.result;
        } catch (error) {
            console.error(`Error fetching company ${companyId}:`, error.message);
            return null;
        }
    }

    async getEmployees() {
        try {
            const response = await axios.get(`${this.webhookUrl}/user.get`, {
                params: {
                    filter: { ACTIVE: 'Y' },
                    select: ['ID', 'NAME', 'LAST_NAME', 'PERSONAL_PHOTO', 'WORK_PHONE', 'PERSONAL_MOBILE', 'UF_DEPARTMENT']
                }
            });
            return response.data.result || [];
        } catch (error) {
            console.error('Error fetching employees:', error.message);
            return [];
        }
    }
}

async function handleFormSubmission(type, formData) {
    const webhookUrl = 'https://b24-7f121e.bitrix24.by/rest/1/p1a3njih5vb5x0oj/';

    try {
        let leadData = {
            TITLE: `Заявка с сайта: ${formData.source || 'Обратная связь'}`,
            NAME: formData.name || '',
            PHONE: formData.phone ? [{ VALUE: formData.phone, VALUE_TYPE: 'WORK' }] : [],
            EMAIL: formData.email ? [{ VALUE: formData.email, VALUE_TYPE: 'WORK' }] : [],
            COMMENTS: formData.message || formData.request || '',
            SOURCE_ID: 'WEB',
            ASSIGNED_BY_ID: 1,
            STATUS_ID: 'NEW'
        };

        // Add additional fields if available
        if (formData.propertyUnid) {
            leadData.UF_CRM_PROPERTY_UNID = formData.propertyUnid;
        }
        if (formData.propertyTitle) {
            leadData.TITLE += ` - ${formData.propertyTitle}`;
        }
        if (formData.budget) {
            leadData.OPPORTUNITY = parseFloat(formData.budget);
            leadData.CURRENCY_ID = 'USD';
        }

        const response = await axios.post(`${webhookUrl}crm.lead.add.json`, {
            fields: leadData
        });

        if (response.data && response.data.result) {
            return {
                success: true,
                leadId: response.data.result,
                message: 'Lead created successfully'
            };
        } else {
            return {
                success: false,
                error: response.data.error_description || 'Unknown error'
            };
        }
    } catch (error) {
        console.error('Error submitting form to Bitrix:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { BitrixAPI, handleFormSubmission };
