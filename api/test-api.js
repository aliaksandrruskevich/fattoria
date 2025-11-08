const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/properties',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    
    console.log('Status Code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const properties = JSON.parse(data);
            if (properties.properties && properties.properties.length > 0) {
                console.log('First property description sample:');
                console.log(properties.properties[0].description.substring(0, 200));
            }
        } catch (e) {
            console.log('Response:', data.substring(0, 500));
        }
    });
});

req.on('error', (err) => {
    console.error('Error:', err);
});

req.end();
