const { BitrixAPI } = require('../bitrix');

async function getEmployees(req, res) {
    try {
        const bitrix = new BitrixAPI('https://b24-7f121e.bitrix24.by/rest/1/p1a3njih5vb5x0oj/');
        const employees = await bitrix.getEmployees();

        if (employees && employees.length > 0) {
            res.json(employees);
        } else {
            // Return empty array if no employees found
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
}

module.exports = { getEmployees };
