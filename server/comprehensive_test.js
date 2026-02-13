require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8000';
const BASE_URL = 'localhost:8000';

console.log('\n' + '='.repeat(70));
console.log('🚀 GROWFARM BACKEND - COMPREHENSIVE TEST SUITE');
console.log('='.repeat(70) + '\n');

// Test Results Tracker
const results = {
    tests: [],
    passed: 0,
    failed: 0
};

function addTest(name, passed, message = '') {
    results.tests.push({ name, passed, message });
    if (passed) {
        results.passed++;
        console.log(`✅ ${name}`);
    } else {
        results.failed++;
        console.log(`❌ ${name}: ${message}`);
    }
}

// 1. Test Environment Variables
console.log('\n📋 TEST 1: Environment Variables');
console.log('-'.repeat(70));

const requiredEnvVars = [
    'MONGODB_URI',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_WHATSAPP_NUMBER',
    'GEMINI_API_KEY',
    'OPENWEATHER_API_KEY',
    'PORT',
    'JWT_SECRET'
];

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        const masked = value.length > 10 ? value.substring(0, 10) + '...' : value;
        addTest(`Environment: ${varName}`, true);
    } else {
        addTest(`Environment: ${varName}`, false, 'Missing');
    }
});

// 2. Test MongoDB Connection
console.log('\n📋 TEST 2: Database Connection (MongoDB)');
console.log('-'.repeat(70));

async function testDatabase() {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            addTest('MongoDB Connection', false, 'Connection timeout (>5s)');
            resolve();
        }, 5000);

        try {
            const URI = process.env.MONGODB_URI;
            mongoose.connect(URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 3000,
            }).then(() => {
                clearTimeout(timeout);
                addTest('MongoDB Connection', true);
                mongoose.disconnect();
                resolve();
            }).catch((err) => {
                clearTimeout(timeout);
                addTest('MongoDB Connection', false, err.message.split('\n')[0]);
                resolve();
            });
        } catch (err) {
            clearTimeout(timeout);
            addTest('MongoDB Connection', false, err.message);
            resolve();
        }
    });
}

// 3. Test API Endpoints
function testAPIEndpoint(method, path, expectedStatus = 200) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            addTest(`API: ${method} ${path}`, false, 'Timeout');
            resolve();
        }, 5000);

        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            clearTimeout(timeout);
            const success = res.statusCode === expectedStatus || res.statusCode < 500;
            addTest(`API: ${method} ${path}`, success, `Status: ${res.statusCode}`);
            res.resume();
            resolve();
        });

        req.on('error', (err) => {
            clearTimeout(timeout);
            addTest(`API: ${method} ${path}`, false, err.message);
            resolve();
        });

        req.end();
    });
}

// 4. Test External APIs
function testExternalAPI(name, url) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            addTest(`External API: ${name}`, false, 'Timeout');
            resolve();
        }, 5000);

        http.get(url, (res) => {
            clearTimeout(timeout);
            const success = res.statusCode === 200;
            addTest(`External API: ${name}`, success, `Status: ${res.statusCode}`);
            res.resume();
            resolve();
        }).on('error', (err) => {
            clearTimeout(timeout);
            addTest(`External API: ${name}`, false, err.message);
            resolve();
        });
    });
}

// 5. Test Twilio Configuration
console.log('\n📋 TEST 3: Twilio Configuration');
console.log('-'.repeat(70));

async function testTwilio() {
    try {
        const twilio = require('twilio');
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        
        if (!accountSid || !authToken) {
            addTest('Twilio Credentials', false, 'Missing credentials');
            return;
        }
        
        const client = twilio(accountSid, authToken);
        
        // Try to fetch account info
        client.api.accounts(accountSid).fetch()
            .then(() => {
                addTest('Twilio Authentication', true);
            })
            .catch((err) => {
                addTest('Twilio Authentication', false, err.message.split('\n')[0]);
            });
    } catch (err) {
        addTest('Twilio Setup', false, err.message);
    }
}

// 6. Test Gemini API
console.log('\n📋 TEST 4: AI & External APIs');
console.log('-'.repeat(70));

async function testGemini() {
    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const key = process.env.GEMINI_API_KEY;
        
        if (!key) {
            addTest('Gemini API', false, 'Missing API key');
            return;
        }
        
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await model.generateContent("test");
        const response = await result.response;
        
        if (response.text()) {
            addTest('Gemini API', true);
        } else {
            addTest('Gemini API', false, 'No response');
        }
    } catch (err) {
        const errorMsg = err.message.split('\n')[0];
        if (errorMsg.includes('429') || errorMsg.includes('quota')) {
            addTest('Gemini API', false, 'Rate limit/Quota exceeded - check billing');
        } else {
            addTest('Gemini API', false, errorMsg);
        }
    }
}

// 7. Test Weather API
async function testWeatherAPI() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Pune&appid=${apiKey}&units=metric`;
    
    return new Promise((resolve) => {
        const https = require('https');
        const timeout = setTimeout(() => {
            addTest('OpenWeather API', false, 'Timeout');
            resolve();
        }, 5000);

        https.get(url, (res) => {
            clearTimeout(timeout);
            const success = res.statusCode === 200;
            addTest('OpenWeather API', success, `Status: ${res.statusCode}`);
            res.resume();
            resolve();
        }).on('error', (err) => {
            clearTimeout(timeout);
            addTest('OpenWeather API', false, err.message);
            resolve();
        });
    });
}

// Main Test Runner
async function runAllTests() {
    try {
        // Test Database
        await testDatabase();
        
        // Test Twilio
        await testTwilio();
        
        // Wait a bit for Twilio test
        await new Promise(r => setTimeout(r, 1000));
        
        // Test Gemini
        await testGemini();
        
        // Test Weather API
        await testWeatherAPI();
        
        // Test API Endpoints
        console.log('\n📋 TEST 5: API Endpoints');
        console.log('-'.repeat(70));
        
        await testAPIEndpoint('GET', '/');
        await testAPIEndpoint('GET', '/farmer');
        await testAPIEndpoint('GET', '/admin');
        await testAPIEndpoint('GET', '/scheme');
        await testAPIEndpoint('GET', '/district');
        await testAPIEndpoint('GET', '/farm');
        await testAPIEndpoint('GET', '/expert');
        await testAPIEndpoint('GET', '/trader');
        await testAPIEndpoint('GET', '/APMC');
        await testAPIEndpoint('GET', '/training');
        await testAPIEndpoint('GET', '/insurance');
        await testAPIEndpoint('GET', '/chatbot');
        
        // Final Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(70));
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📈 Total: ${results.tests.length}`);
        console.log(`📊 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(2)}%`);
        console.log('='.repeat(70) + '\n');
        
        if (results.failed === 0) {
            console.log('🎉 ALL TESTS PASSED! Backend is ready.\n');
        } else {
            console.log('⚠️  Some tests failed. Please review and fix the issues.\n');
        }
        
        process.exit(results.failed === 0 ? 0 : 1);
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

// Run tests after a short delay to ensure server is ready
setTimeout(runAllTests, 2000);
