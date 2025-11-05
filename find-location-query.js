// find-location-query.js
const fs = require('fs');
const path = require('path');

console.log('🔍 SEARCHING FOR "location" IN CODE...');

// Ищем во всех JS файлах
function searchInFiles(dir, pattern) {
  const results = [];

  function scanDirectory(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes('node_modules')) {
        scanDirectory(filePath);
      } else if (file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(pattern)) {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.includes(pattern)) {
                results.push({
                  file: filePath,
                  line: index + 1,
                  content: line.trim()
                });
              }
            });
          }
        } catch (error) {
          // Пропускаем ошибки чтения
        }
      }
    });
  }

  scanDirectory(dir);
  return results;
}

const locationResults = searchInFiles('.', 'location');
console.log(`📋 Found ${locationResults.length} occurrences of "location":`);

locationResults.forEach((result, index) => {
  console.log(`\n${index + 1}. File: ${result.file}`);
  console.log(`   Line ${result.line}: ${result.content}`);
});
