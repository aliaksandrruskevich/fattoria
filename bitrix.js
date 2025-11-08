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
}

module.exports = BitrixAPI;