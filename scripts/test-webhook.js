#!/usr/bin/env node

/**
 * Test script for webhook endpoints
 * 
 * Usage:
 *   node scripts/test-webhook.js <type> <userId> <endpointId>
 * 
 * Examples:
 *   node scripts/test-webhook.js classic 507f1f77bcf86cd799439011 507f191e810c19729de860ea
 *   node scripts/test-webhook.js nextgen 507f1f77bcf86cd799439011 507f191e810c19729de860ea
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

const args = process.argv.slice(2);
const [type, userId, endpointId] = args;

if (!type || !userId || !endpointId) {
  console.error('Usage: node test-webhook.js <type> <userId> <endpointId>');
  console.error('  type: classic or nextgen');
  process.exit(1);
}

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const url = `${baseUrl}/api/webhooks/${type}/${userId}/${endpointId}`;

console.log(`\n🔔 Testing ${type} webhook endpoint:`);
console.log(`   ${url}\n`);

if (type === 'classic') {
  testClassicWebhook(url);
} else if (type === 'nextgen') {
  testNextgenWebhook(url);
} else {
  console.error('Invalid type. Use "classic" or "nextgen"');
  process.exit(1);
}

function testClassicWebhook(url) {
  const payload = JSON.stringify({ id: 'tr_test123456789' });
  
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'User-Agent': 'Mollie-Webhook-Test/1.0',
    },
  };

  console.log('📦 Payload:', payload);
  console.log('');

  const protocol = urlObj.protocol === 'https:' ? https : http;
  
  const req = protocol.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📬 Response:', data);
      console.log('');
      
      if (res.statusCode === 200) {
        console.log('✅ Webhook received successfully!');
      } else {
        console.log('❌ Webhook failed');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  req.write(payload);
  req.end();
}

function testNextgenWebhook(url) {
  const payload = {
    event: 'payment.paid',
    type: 'payment',
    data: {
      id: 'tr_test123456789',
      amount: {
        value: '10.00',
        currency: 'EUR',
      },
      status: 'paid',
    },
  };
  
  const payloadString = JSON.stringify(payload);
  
  // For testing, we don't have the actual shared secret
  // This will result in a signature verification failure, which is expected
  const testSecret = 'test-secret-key';
  const signature = crypto
    .createHmac('sha256', testSecret)
    .update(payloadString)
    .digest('hex');
  
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString),
      'X-Mollie-Signature': signature,
      'User-Agent': 'Mollie-Webhook-Test/1.0',
    },
  };

  console.log('📦 Payload:', payloadString);
  console.log('🔐 Signature:', signature);
  console.log('⚠️  Note: Signature will likely fail as we don\'t have the real shared secret');
  console.log('');

  const protocol = urlObj.protocol === 'https:' ? https : http;
  
  const req = protocol.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📬 Response:', data);
      console.log('');
      
      if (res.statusCode === 401) {
        console.log('⚠️  Signature verification failed (expected for test)');
      } else if (res.statusCode === 200) {
        console.log('✅ Webhook received successfully!');
      } else {
        console.log('❌ Webhook failed');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  req.write(payloadString);
  req.end();
}
