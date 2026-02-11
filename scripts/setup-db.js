#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script:
 * 1. Validates environment variables
 * 2. Tests MongoDB connection
 * 3. Creates database indexes
 * 4. Optionally creates a test user
 */

require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Validate environment variables
function validateEnv() {
  logInfo('Validating environment variables...');
  
  const required = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'ENCRYPTION_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    logInfo('Please check your .env.local file');
    return false;
  }

  // Validate ENCRYPTION_KEY length (should be 64 hex chars = 32 bytes)
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    logWarning('ENCRYPTION_KEY should be 64 hex characters (32 bytes)');
    logInfo('Generate with: openssl rand -hex 32');
  }

  logSuccess('All environment variables are set');
  return true;
}

// Test MongoDB connection
async function testConnection() {
  logInfo('Testing MongoDB connection...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    logSuccess(`Connected to MongoDB: ${mongoose.connection.db.databaseName}`);
    return true;
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error.message}`);
    logInfo('Please check your MONGODB_URI in .env.local');
    return false;
  }
}

// Create database indexes
async function createIndexes() {
  logInfo('Creating database indexes...');

  try {
    const db = mongoose.connection.db;

    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    logSuccess('Created index: users.email (unique)');

    // MollieApiKeys collection indexes
    await db.collection('mollieapikeys').createIndex({ userId: 1 });
    logSuccess('Created index: mollieapikeys.userId');

    // WebhookEndpoints collection indexes
    await db.collection('webhookendpoints').createIndex({ userId: 1 });
    logSuccess('Created index: webhookendpoints.userId');

    // WebhookLogs collection indexes
    await db.collection('webhooklogs').createIndex({ userId: 1, receivedAt: -1 });
    await db.collection('webhooklogs').createIndex({ endpointId: 1, receivedAt: -1 });
    logSuccess('Created indexes: webhooklogs.userId, webhooklogs.endpointId');

    return true;
  } catch (error) {
    logWarning(`Index creation warning: ${error.message}`);
    // Don't fail on index errors (they might already exist)
    return true;
  }
}

// Create test user
async function createTestUser() {
  logInfo('Do you want to create a test user? (y/n)');

  // Simple prompt using readline
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question('', async (answer) => {
      readline.close();

      if (answer.toLowerCase() !== 'y') {
        logInfo('Skipping test user creation');
        resolve(true);
        return;
      }

      try {
        const db = mongoose.connection.db;
        const existingUser = await db.collection('users').findOne({ 
          email: 'test@example.com' 
        });

        if (existingUser) {
          logWarning('Test user (test@example.com) already exists');
          resolve(true);
          return;
        }

        const passwordHash = await bcrypt.hash('Test1234', 10);
        
        await db.collection('users').insertOne({
          email: 'test@example.com',
          passwordHash,
          settings: {
            defaultRetentionDays: 7,
            timezone: 'UTC',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        logSuccess('Created test user:');
        log('  Email: test@example.com', colors.green);
        log('  Password: Test1234', colors.green);
        
        resolve(true);
      } catch (error) {
        logError(`Failed to create test user: ${error.message}`);
        resolve(false);
      }
    });
  });
}

// Main setup function
async function setup() {
  console.log('');
  log('═══════════════════════════════════════', colors.blue);
  log('  Webhook Analyzer - Database Setup', colors.blue);
  log('═══════════════════════════════════════', colors.blue);
  console.log('');

  // Step 1: Validate environment
  if (!validateEnv()) {
    process.exit(1);
  }
  console.log('');

  // Step 2: Test connection
  if (!await testConnection()) {
    process.exit(1);
  }
  console.log('');

  // Step 3: Create indexes
  await createIndexes();
  console.log('');

  // Step 4: Create test user
  await createTestUser();
  console.log('');

  log('═══════════════════════════════════════', colors.green);
  log('  Setup Complete! ✓', colors.green);
  log('═══════════════════════════════════════', colors.green);
  console.log('');
  logInfo('You can now start the development server:');
  log('  npm run dev', colors.blue);
  console.log('');
  logInfo('Or test the application at:');
  log('  http://localhost:3000', colors.blue);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

// Run setup
setup().catch((error) => {
  console.error('');
  logError(`Setup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
