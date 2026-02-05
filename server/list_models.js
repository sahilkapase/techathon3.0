const https = require('https');
const fs = require('fs');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            fs.writeFileSync('models.json', JSON.stringify(json, null, 2));
            console.log('Models saved to models.json');
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
