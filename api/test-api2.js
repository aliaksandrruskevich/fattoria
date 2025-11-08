const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/properties?limit=1',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response length:', data.length);
        if (data.length > 0) {
            try {
                const result = JSON.parse(data);
                console.log('First property description (first 300 chars):');
                if (result.properties && result.properties[0]) {
                    console.log(result.properties[0].description.substring(0, 300));
                } else {
                    console.log('No properties in response');
                }
            } catch (e) {
                console.log('Raw response (first 500 chars):', data.substring(0, 500));
            }
        } else {
            console.log('Empty response');
        }
    });
});

req.on('error', (err) => {
    console.error('Error:', err);
});

req.end();
