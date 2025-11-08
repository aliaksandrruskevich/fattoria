const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/properties?limit=1',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Full response:');
        console.log(data);
        
        try {
            const result = JSON.parse(data);
            console.log('\nParsed JSON keys:', Object.keys(result));
            
            if (result.properties) {
                console.log('Properties array length:', result.properties.length);
                if (result.properties[0]) {
                    console.log('First property keys:', Object.keys(result.properties[0]));
                    console.log('Description sample:', result.properties[0].description.substring(0, 200));
                }
            }
        } catch (e) {
            console.log('JSON parse error:', e.message);
        }
    });
});

req.on('error', (err) => {
    console.error('Error:', err);
});

req.end();
