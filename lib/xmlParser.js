// lib/xmlParser.js
const { XMLParser } = require('fast-xml-parser');

class RealtByXMLParser {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: true,        // ВКЛЮЧАЕМ парсинг значений
      parseAttributeValue: true,  // ВКЛЮЧАЕМ парсинг атрибутов
      trimValues: true,
      allowBooleanAttributes: true,
      processEntities: true,
      htmlEntities: true,
      alwaysCreateTextNode: false,
      // КРИТИЧЕСКИ ВАЖНЫЕ НАСТРОЙКИ:
      ignoreDeclaration: true,    // ИГНОРИРУЕМ XML declaration
      ignorePiTags: true,         // ИГНОРИРУЕМ PI tags
      removeNSPrefix: true,       // Удаляем namespace префиксы
      isArray: (name, jpath) => {
        // Явно указываем какие теги должны быть массивами
        if (name === "record") return true;
        if (name === "photo" && jpath.includes("photos")) return true;
        return false;
      }
    });
  }

  parse(xmlData) {
    console.log('🔄 Parsing XML with fixed parser...');

    try {
      const result = this.parser.parse(xmlData);

      // Валидация результата
      if (!result.uedb) {
        throw new Error('No uedb element found in XML');
      }

      if (!result.uedb.records) {
        throw new Error('No records element found in XML');
      }

      const records = result.uedb.records.record;
      const recordCount = Array.isArray(records) ? records.length : (records ? 1 : 0);

      console.log(`✅ PARSING SUCCESS! Found ${recordCount} records`);
      console.log('Sample record:', records ? records[0]?.unid : 'none');

      return result;

    } catch (error) {
      console.error('❌ PARSING FAILED:', error.message);
      throw error;
    }
  }
}

module.exports = { RealtByXMLParser };
