const https = require('https');

const API_KEY = "b247e4798b8ab387454e0362cef479d7"; // The key currently in use
const CITY = "Pune";

const endpoints = [
    { name: "Current Weather", url: `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric` },
    { name: "5-Day Forecast", url: `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric` }
];

console.log(`\n🔍 Testing API Key: ${API_KEY}`);

endpoints.forEach(endpoint => {
    https.get(endpoint.url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`\n--- ${endpoint.name} ---`);
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                const json = JSON.parse(data);
                console.log("✅ Data Received!");
                console.log("Sample:", JSON.stringify(json).substring(0, 150) + "...");
            } else {
                console.log("❌ Error!");
                console.log("Response:", data);
            }
        });
    }).on('error', err => {
        console.error(`❌ Network Error for ${endpoint.name}:`, err.message);
    });
});
