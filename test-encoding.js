const https = require("https");
const iconv = require("iconv-lite");

function testEncoding() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "realt.by",
            path: "/bff/proxy/export/api/export/token/e68b296c864d8a9",
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            timeout: 30000
        };

        console.log("?? Testing encoding...");

        const req = https.request(options, (res) => {
            const chunks = [];
            console.log("Status:", res.statusCode);

            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                const buffer = Buffer.concat(chunks);
                
                console.log("\n=== TESTING ENCODINGS ===");
                
                // UTF-8
                const utf8Text = buffer.toString('utf8');
                console.log("UTF-8 sample:", utf8Text.substring(0, 200));
                console.log("Has Russian UTF-8:", /[à-ÿ-ß]/.test(utf8Text));
                
                // Windows-1251
                const win1251Text = iconv.decode(buffer, 'win1251');
                console.log("\nWin1251 sample:", win1251Text.substring(0, 200));
                console.log("Has Russian Win1251:", /[à-ÿ-ß]/.test(win1251Text));
                
                resolve();
            });
        });

        req.on("error", (err) => {
            console.error("? Request failed:", err);
            reject(err);
        });

        req.end();
    });
}

// Run test
testEncoding().then(() => {
    console.log("\n?? Test completed");
    process.exit(0);
}).catch(err => {
    console.error("? Test failed:", err);
    process.exit(1);
});
