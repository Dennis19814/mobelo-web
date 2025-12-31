#!/usr/bin/env node

/**
 * Socket.io Connection Test Script
 *
 * Tests Socket.io connection to production worker service
 * Usage: node scripts/test-socket.js [worker-url] [userId]
 *
 * Examples:
 *   node scripts/test-socket.js
 *   node scripts/test-socket.js https://worker.mobelo.dev 1
 *   node scripts/test-socket.js http://localhost:3004 1
 */

const io = require('socket.io-client');

// Configuration
const TEST_CONFIG = {
  workerUrl: process.argv[2] || 'https://worker.mobelo.dev',
  userId: process.argv[3] || '1',
  timeout: 10000,
  reconnectionAttempts: 3
};

console.log('\n==============================================');
console.log('Socket.io Connection Test');
console.log('==============================================');
console.log(`Worker URL: ${TEST_CONFIG.workerUrl}`);
console.log(`User ID: ${TEST_CONFIG.userId}`);
console.log(`Timeout: ${TEST_CONFIG.timeout}ms`);
console.log('==============================================\n');

console.log(`[${new Date().toISOString()}] Attempting to connect...`);

// Create Socket.io client
const socket = io(TEST_CONFIG.workerUrl, {
  query: { userId: TEST_CONFIG.userId },
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: TEST_CONFIG.reconnectionAttempts,
  reconnectionDelay: 1000,
  timeout: TEST_CONFIG.timeout
});

// Connection success
socket.on('connect', () => {
  console.log(`\n[${new Date().toISOString()}] ✅ SUCCESS: Connected to Socket.io server`);
  console.log(`Socket ID: ${socket.id}`);
  console.log(`Transport: ${socket.io.engine.transport.name}`);
  console.log('\n==============================================');
  console.log('Connection Test: PASSED');
  console.log('==============================================\n');

  // Clean disconnect and exit
  socket.disconnect();
  process.exit(0);
});

// Connection error
socket.on('connect_error', (error) => {
  console.error(`\n[${new Date().toISOString()}] ❌ FAILED: Connection error`);
  console.error(`Error Message: ${error.message}`);
  console.error(`Error Type: ${error.type || 'N/A'}`);
  console.error(`Error Description: ${error.description || 'N/A'}`);
  console.error('\n==============================================');
  console.error('Connection Test: FAILED');
  console.error('==============================================\n');

  console.error('Troubleshooting Tips:');
  console.error('1. Check if worker service is running (pm2 list | grep worker)');
  console.error('2. Verify DNS resolution (nslookup worker.mobelo.dev)');
  console.error('3. Check firewall/security groups allow port 3004');
  console.error('4. Verify Nginx configuration for worker.mobelo.dev');
  console.error('5. Check worker logs (pm2 logs app-builder-worker)\n');

  process.exit(1);
});

// Reconnection attempts
socket.io.on('reconnect_attempt', (attemptNumber) => {
  console.log(`[${new Date().toISOString()}] Reconnection attempt ${attemptNumber}...`);
});

// Reconnection failed
socket.io.on('reconnect_failed', () => {
  console.error(`\n[${new Date().toISOString()}] ❌ FAILED: All reconnection attempts exhausted`);
  console.error('\n==============================================');
  console.error('Connection Test: FAILED');
  console.error('==============================================\n');
  process.exit(1);
});

// Timeout handler
setTimeout(() => {
  if (!socket.connected) {
    console.error(`\n[${new Date().toISOString()}] ❌ TIMEOUT: Failed to connect within ${TEST_CONFIG.timeout}ms`);
    console.error('\n==============================================');
    console.error('Connection Test: TIMEOUT');
    console.error('==============================================\n');

    console.error('The connection attempt timed out. This could indicate:');
    console.error('- Worker service is not running');
    console.error('- Firewall blocking the connection');
    console.error('- Incorrect URL or port configuration');
    console.error('- Network connectivity issues\n');

    socket.disconnect();
    process.exit(1);
  }
}, TEST_CONFIG.timeout);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nTest interrupted by user. Exiting...\n');
  socket.disconnect();
  process.exit(130);
});
