const https = require('https');

const apiKey = "b247e4798b8ab387454e0362cef479d7";
const city = "Pune";

function testEndpoint(name, url) {
    console.log(`\nTesting ${name} endpoint...`);
    console.log(`URL: ${url.replace(apiKey, "HIDDEN_KEY")}`);

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (res.statusCode === 200) {
                    console.log(`✅ ${name} Success! Status: ${res.statusCode}`);
                    console.log(`   Sample Data: Temp=${json.main?.temp || 'N/A'}, City=${json.name || json.city?.name}`);
                } else {
                    console.error(`❌ ${name} Failed! Status: ${res.statusCode}`);
                    console.error(`   Message: ${json.message}`);
                }
            } catch (e) {
                console.error(`❌ ${name} Error parsing JSON:`, e.message);
                console.log(data);
            }
        });
    }).on('error', (err) => {
        console.error(`❌ ${name} Network Error:`, err.message);
    });
}

// Test 1: Current Weather
testEndpoint("Current Weather", `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);

// Test 2: Forecast (5 day / 3 hour) - Free Tier Standard
testEndpoint("Forecast", `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);

// Test 3: OneCall (Paid/Subscription usually) - Checking if this key supports it
testEndpoint("OneCall", `https://api.openweathermap.org/data/2.5/onecall?lat=18.5204&lon=73.8567&appid=${apiKey}&units=metric`);
