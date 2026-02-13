/**
 * AS-4 API Testing Script
 * 
 * Tests all AS-4 endpoints
 * Run: node test_as4.js
 */

const http = require('http');

const BASE_URL = 'localhost:8000';

const testCases = [
    {
        name: 'Get Demo',
        method: 'GET',
        path: '/financial/demo',
        body: null
    },
    {
        name: 'Get Eligible Schemes',
        method: 'POST',
        path: '/financial/eligible-schemes',
        body: {
            cropType: 'Rice',
            landSize: 5,
            district: 'Pune',
            season: 'Kharif'
        }
    },
    {
        name: 'Get Insurance Options',
        method: 'POST',
        path: '/financial/insurance-options',
        body: {
            cropType: 'Rice',
            landSize: 5
        }
    },
    {
        name: 'Get Financial Support',
        method: 'POST',
        path: '/financial/support',
        body: {
            cropType: 'Rice',
            landSize: 5,
            district: 'Pune',
            season: 'Kharif'
        }
    },
    {
        name: 'Compare Schemes',
        method: 'POST',
        path: '/financial/compare-schemes',
        body: {
            schemeIds: ['SCHEME_ID_1', 'SCHEME_ID_2']
        }
    }
];

console.log('\n' + '='.repeat(70));
console.log('AS-4: Farmer Financial Support - API Testing');
console.log('='.repeat(70) + '\n');

async function runTest(testCase) {
    return new Promise((resolve) => {
        const options = {
            hostname: BASE_URL.split(':')[0],
            port: BASE_URL.split(':')[1],
            path: testCase.path,
            method: testCase.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ ${testCase.name}`);
                console.log(`   Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    console.log(`   Response: ${json.status}`);
                    if (json.count) console.log(`   Count: ${json.count}`);
                    if (json.endpoints) console.log(`   Endpoints: ${Object.keys(json.endpoints).length}`);
                } catch (e) {
                    console.log(`   Response length: ${data.length} bytes`);
                }
                console.log();
                resolve();
            });
        });

        req.on('error', (err) => {
            console.log(`❌ ${testCase.name}`);
            console.log(`   Error: ${err.message}`);
            console.log();
            resolve();
        });

        if (testCase.body) {
            req.write(JSON.stringify(testCase.body));
        }

        req.end();
    });
}

async function runAllTests() {
    console.log('Running AS-4 API Tests...\n');
    
    for (const testCase of testCases) {
        await runTest(testCase);
        await new Promise(r => setTimeout(r, 500)); // Delay between requests
    }

    console.log('='.repeat(70));
    console.log('Testing Complete!');
    console.log('='.repeat(70) + '\n');
}

runAllTests();
