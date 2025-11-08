const https = require('https');
const iconv = require('iconv-lite');

const options = {
    hostname: "realt.by",
    path: "/bff/proxy/export/api/export/token/e68b296c864d8a9",
    method: "GET",
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    timeout: 30000
};

console.log("📥 Testing XML encoding...");

const req = https.request(options, (res) => {
    const chunks = [];
    console.log("Status: " + res.statusCode);

    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        
        // робуем разные кодировки
        console.log("=== Testing different encodings ===");
        console.log("win1251:", iconv.decode(buffer, 'win1251').substring(0, 100));
        console.log("cp1251:", iconv.decode(buffer, 'cp1251').substring(0, 100));
        console.log("koi8-r:", iconv.decode(buffer, 'koi8-r').substring(0, 100));
        console.log("utf8:", buffer.toString('utf8').substring(0, 100));
        
        process.exit(0);
    });
});

req.on("error", (err) => {
    console.error("Error:", err);
    process.exit(1);
});

req.end();
