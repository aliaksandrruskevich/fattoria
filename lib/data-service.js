// lib/data-service.js
const Database = require('./db.js');

class DataService {
  constructor() {
    this.db = new Database();
  }

  async getProperties() {
    return new Promise((resolve, reject) => {
      this.db.getAllProperties((err, properties) => {
        if (err) reject(err);
        else resolve(properties);
      });
    });
  }

  async getPropertyByUnid(unid) {
    return new Promise((resolve, reject) => {
      this.db.getPropertyByUnid(unid, (err, property) => {
        if (err) reject(err);
        else resolve(property);
      });
    });
  }
}

module.exports = new DataService();
