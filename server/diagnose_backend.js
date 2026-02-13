require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🔧 GROWFARM BACKEND - FULL DIAGNOSTICS & SETUP VALIDATION');
console.log('='.repeat(80) + '\n');

const diagnostics = {
    section: [],
    issues: [],
    warnings: [],
    info: []
};

// 1. Check Project Structure
console.log('📁 Checking Project Structure...\n');

const requiredDirs = [
    'controllers',
    'models',
    'routes',
    'config',
    'node_modules'
];

const requiredFiles = [
    'index.js',
    '.env',
    'package.json'
];

let structureOk = true;

requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ - MISSING`);
        diagnostics.issues.push(`Missing directory: ${dir}`);
        structureOk = false;
    }
});

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        diagnostics.issues.push(`Missing file: ${file}`);
        structureOk = false;
    }
});

// 2. Check Controllers
console.log('\n📋 Checking Controllers...\n');

const controllerDir = path.join(__dirname, 'controllers');
if (fs.existsSync(controllerDir)) {
    const controllers = fs.readdirSync(controllerDir).filter(f => f.endsWith('.js'));
    console.log(`Found ${controllers.length} controllers:`);
    controllers.forEach(ctrl => console.log(`  ✅ ${ctrl}`));
}

// 3. Check Routes
console.log('\n🛣️  Checking Routes...\n');

const routesDir = path.join(__dirname, 'routes');
if (fs.existsSync(routesDir)) {
    const routeFolders = fs.readdirSync(routesDir).filter(f => {
        return fs.statSync(path.join(routesDir, f)).isDirectory();
    });
    console.log(`Found ${routeFolders.length} route modules:`);
    routeFolders.forEach(route => console.log(`  ✅ ${route}/`));
}

// 4. Check Environment Variables
console.log('\n🔐 Checking Environment Variables...\n');

const envVars = {
    required: [
        'MONGODB_URI',
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'GEMINI_API_KEY',
        'OPENWEATHER_API_KEY',
        'PORT'
    ],
    optional: [
        'JWT_SECRET',
        'CLIENT_URL',
        'NODE_ENV',
        'SOCKET_PORT'
    ]
};

console.log('Required Variables:');
envVars.required.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        const masked = value.length > 15 ? value.substring(0, 10) + '...' : value;
        console.log(`  ✅ ${varName} = ${masked}`);
    } else {
        console.log(`  ❌ ${varName} - MISSING`);
        diagnostics.issues.push(`Missing required env var: ${varName}`);
    }
});

console.log('\nOptional Variables:');
envVars.optional.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`  ✅ ${varName}`);
    } else {
        console.log(`  ⚠️  ${varName} - not set`);
    }
});

// 5. Check npm packages
console.log('\n📦 Checking Critical npm Packages...\n');

const requiredPackages = [
    'express',
    'mongoose',
    'dotenv',
    'cors',
    'twilio',
    '@google/generative-ai',
    'axios',
    'socket.io'
];

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

requiredPackages.forEach(pkg => {
    if (packageJson.dependencies[pkg] || packageJson.devDependencies?.[pkg]) {
        const version = packageJson.dependencies[pkg] || packageJson.devDependencies[pkg];
        console.log(`  ✅ ${pkg}@${version}`);
    } else {
        console.log(`  ❌ ${pkg} - NOT INSTALLED`);
        diagnostics.warnings.push(`Package not found: ${pkg}`);
    }
});

// 6. Check for common issues
console.log('\n🐛 Checking for Common Issues...\n');

// Check if node_modules is in gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignore.includes('node_modules') && gitignore.includes('.env')) {
        console.log('  ✅ .gitignore configured correctly');
    } else {
        console.log('  ⚠️  .gitignore may be incomplete');
        if (!gitignore.includes('node_modules')) diagnostics.warnings.push('.gitignore missing node_modules');
        if (!gitignore.includes('.env')) diagnostics.warnings.push('.gitignore missing .env');
    }
}

// Check index.js for basic structure
const indexPath = path.join(__dirname, 'index.js');
if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (indexContent.includes('express()')) console.log('  ✅ Express app initialized');
    if (indexContent.includes('app.listen')) console.log('  ✅ Server listening setup found');
    if (indexContent.includes('mongoose.connect') || indexContent.includes("require('./config/mongoose')")) {
        console.log('  ✅ Database connection configured');
    } else {
        diagnostics.warnings.push('Database connection not found in index.js');
    }
}

// 7. Summary
console.log('\n' + '='.repeat(80));
console.log('📊 DIAGNOSTIC SUMMARY');
console.log('='.repeat(80) + '\n');

if (diagnostics.issues.length > 0) {
    console.log('❌ CRITICAL ISSUES:');
    diagnostics.issues.forEach(issue => console.log(`   • ${issue}`));
    console.log();
}

if (diagnostics.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    diagnostics.warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log();
}

// Final Status
const hasIssues = diagnostics.issues.length > 0;
const hasWarnings = diagnostics.warnings.length > 0;

if (!hasIssues && !hasWarnings) {
    console.log('✅ Backend Setup: HEALTHY');
    console.log('🚀 Ready to start server with: npm start\n');
} else if (!hasIssues && hasWarnings) {
    console.log('✅ Backend Setup: READY (with minor warnings)');
    console.log('🚀 Ready to start server with: npm start\n');
} else {
    console.log('❌ Backend Setup: NEEDS FIXES');
    console.log('⚠️  Please address the critical issues above before starting the server\n');
}

console.log('='.repeat(80) + '\n');

// Exit with appropriate code
process.exit(hasIssues ? 1 : 0);
