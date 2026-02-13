#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m'
};

console.log(`\n${colors.bold}${colors.blue}${'='.repeat(80)}${colors.reset}`);
console.log(`${colors.bold}${colors.blue}🚀 GROWFARM BACKEND - QUICK START & TEST${colors.reset}`);
console.log(`${colors.bold}${colors.blue}${'='.repeat(80)}${colors.reset}\n`);

const args = process.argv.slice(2);
const command = args[0] || 'status';

const commands = {
    'status': 'Check backend status',
    'test': 'Run comprehensive tests',
    'diagnose': 'Run full diagnostics',
    'endpoints': 'Test all endpoints',
    'start': 'Start the backend server',
    'install': 'Install missing packages',
    'help': 'Show this help message'
};

async function runCommand(cmd, args = []) {
    return new Promise((resolve) => {
        const proc = spawn('node', [cmd, ...args], {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true
        });

        proc.on('close', (code) => {
            resolve(code);
        });
    });
}

async function main() {
    switch(command) {
        case 'status':
            console.log(`${colors.bold}Checking Backend Status...${colors.reset}\n`);
            await runCommand('diagnose_backend.js');
            break;

        case 'test':
            console.log(`${colors.bold}Running Comprehensive Tests...${colors.reset}\n`);
            await runCommand('comprehensive_test.js');
            break;

        case 'diagnose':
            console.log(`${colors.bold}Running Full Diagnostics...${colors.reset}\n`);
            await runCommand('diagnose_backend.js');
            await new Promise(r => setTimeout(r, 1000));
            await runCommand('comprehensive_test.js');
            break;

        case 'endpoints':
            console.log(`${colors.bold}Testing All Endpoints...${colors.reset}\n`);
            await runCommand('test_endpoints.js');
            break;

        case 'start':
            console.log(`${colors.bold}Starting Backend Server...${colors.reset}\n`);
            console.log(`${colors.green}Server will start on port 8000${colors.reset}`);
            console.log(`${colors.green}Socket.io will start on port 7000${colors.reset}\n`);
            await runCommand('../index.js');
            break;

        case 'install':
            console.log(`${colors.bold}Installing Dependencies...${colors.reset}\n`);
            const npmProc = spawn('npm', ['install'], {
                cwd: __dirname,
                stdio: 'inherit'
            });
            await new Promise(resolve => npmProc.on('close', resolve));
            break;

        case 'help':
        case '--help':
        case '-h':
            console.log(`${colors.bold}Available Commands:${colors.reset}\n`);
            Object.entries(commands).forEach(([cmd, desc]) => {
                console.log(`  ${colors.blue}${cmd.padEnd(15)}${colors.reset} - ${desc}`);
            });
            console.log(`\n${colors.bold}Usage:${colors.reset}`);
            console.log(`  node server.js [command]\n`);
            console.log(`${colors.bold}Examples:${colors.reset}`);
            console.log(`  node server.js status       # Check backend status`);
            console.log(`  node server.js test         # Run all tests`);
            console.log(`  node server.js diagnose     # Full diagnostics`);
            console.log(`  node server.js start        # Start the server\n`);
            break;

        default:
            console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
            console.log(`${colors.yellow}Run 'node server.js help' for available commands\n${colors.reset}`);
            process.exit(1);
    }
}

main().catch(err => {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
});
