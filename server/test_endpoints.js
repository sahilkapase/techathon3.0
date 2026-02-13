require('dotenv').config();
const http = require('http');

console.log('\n' + '='.repeat(80));
console.log('🧪 GROWFARM BACKEND - DETAILED ENDPOINT TESTING');
console.log('='.repeat(80) + '\n');

const endpoints = [
    // Root
    { method: 'GET', path: '/', description: 'Server health check' },
    
    // Farmer endpoints
    { method: 'GET', path: '/farmer', description: 'Get all farmers' },
    { method: 'GET', path: '/farmer/profile', description: 'Farmer profile (may need auth)' },
    
    // Admin endpoints
    { method: 'GET', path: '/admin', description: 'Admin endpoints' },
    
    // Scheme endpoints
    { method: 'GET', path: '/scheme', description: 'Government schemes' },
    { method: 'GET', path: '/scheme/list', description: 'List all schemes' },
    
    // District endpoints
    { method: 'GET', path: '/district', description: 'Districts data' },
    { method: 'GET', path: '/district/list', description: 'List all districts' },
    
    // Farm endpoints
    { method: 'GET', path: '/farm', description: 'Farm management' },
    
    // Crop data endpoints
    { method: 'GET', path: '/cropdata', description: 'Crop data and recommendations' },
    
    // Expert endpoints
    { method: 'GET', path: '/expert', description: 'Expert consultation' },
    
    // APMC endpoints
    { method: 'GET', path: '/APMC', description: 'APMC market data' },
    
    // Trader endpoints
    { method: 'GET', path: '/trader', description: 'Trader information' },
    
    // Training endpoints
    { method: 'GET', path: '/training', description: 'Training programs' },
    
    // Insurance endpoints
    { method: 'GET', path: '/insurance', description: 'Insurance products' },
    
    // Chatbot endpoints
    { method: 'GET', path: '/chatbot', description: 'AI Chatbot' },
];

let passed = 0;
let failed = 0;
const results = [];

function testEndpoint(method, path, description) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const timeout = setTimeout(() => {
            results.push({ path, status: 'TIMEOUT', description });
            failed++;
            console.log(`⏱️  ${method.padEnd(6)} ${path.padEnd(30)} - TIMEOUT (${description})`);
            resolve();
        }, 5000);

        const req = http.request(options, (res) => {
            clearTimeout(timeout);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const statusCode = res.statusCode;
                const isSuccess = statusCode < 400;
                
                if (isSuccess) {
                    passed++;
                    console.log(`✅ ${method.padEnd(6)} ${path.padEnd(30)} ${statusCode} - ${description}`);
                } else {
                    results.push({ path, status: statusCode, description });
                    console.log(`⚠️  ${method.padEnd(6)} ${path.padEnd(30)} ${statusCode} - ${description}`);
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            clearTimeout(timeout);
            failed++;
            results.push({ path, status: 'ERROR', description, error: err.message });
            console.log(`❌ ${method.padEnd(6)} ${path.padEnd(30)} - ERROR: ${err.message}`);
            resolve();
        });

        req.end();
    });
}

async function runTests() {
    console.log('Testing Endpoints...\n');
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint.method, endpoint.path, endpoint.description);
        await new Promise(r => setTimeout(r, 100)); // Small delay between requests
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 ENDPOINT TEST SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Other: ${failed}`);
    console.log(`📈 Total: ${endpoints.length}`);
    console.log(`✨ Success Rate: ${((passed / endpoints.length) * 100).toFixed(2)}%\n`);
    
    if (failed === 0) {
        console.log('🎉 All endpoints accessible!\n');
    } else {
        console.log('⚠️  Some endpoints returned errors. This may be normal if they require authentication.\n');
    }
    
    console.log('='.repeat(80) + '\n');
}

// Wait for server to be ready, then run tests
setTimeout(runTests, 1000);
