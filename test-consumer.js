#!/usr/bin/env node

/**
 * Test script to verify the Kafka consumer is working
 * This script will start the consumer and monitor for events
 */

const { spawn } = require('child_process');
const axios = require('axios');

// Configuration
const PRODUCER_URL = 'http://localhost:3000';
const CONSUMER_PORT = 3001;

console.log('🧪 SalesHQ Affiliate Consumer Test Script');
console.log('==========================================\n');

// Test data
const testEvents = [
  {
    event_type: 'page_viewed',
    session_id: 'test-session-001',
    user_id: 'test-user-001',
    page_url: 'https://test-shop.myshopify.com/products/test-product-1',
    timestamp: new Date().toISOString(),
    shop_domain: 'test-shop.myshopify.com'
  },
  {
    event_type: 'product_viewed',
    session_id: 'test-session-002',
    user_id: 'test-user-002',
    product_id: 'test-product-123',
    product_title: 'Test Product',
    price: 29.99,
    timestamp: new Date().toISOString(),
    shop_domain: 'test-shop.myshopify.com'
  },
  {
    event_type: 'cart_viewed',
    session_id: 'test-session-003',
    user_id: 'test-user-003',
    cart_value: 59.98,
    item_count: 2,
    timestamp: new Date().toISOString(),
    shop_domain: 'test-shop.myshopify.com'
  }
];

async function waitForService(url, serviceName, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await axios.get(url);
      console.log(`✅ ${serviceName} is ready`);
      return true;
    } catch (error) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n❌ ${serviceName} failed to start within ${timeout/1000}s`);
  return false;
}

async function sendTestEvent(event, index) {
  try {
    const response = await axios.post(`${PRODUCER_URL}/custom-pixel`, event, {
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': event.shop_domain,
        'x-shopify-webhook-id': `test-webhook-${index}`,
        'x-shopify-api-version': '2025-01'
      }
    });
    
    console.log(`✅ Event ${index + 1} sent successfully:`, {
      eventType: event.event_type,
      shop: event.shop_domain,
      status: response.status
    });
    
    return true;
  } catch (error) {
    console.log(`❌ Failed to send event ${index + 1}:`, {
      eventType: event.event_type,
      error: error.message
    });
    return false;
  }
}

async function runTest() {
  console.log('1. Starting consumer service...');
  
  // Start the consumer
  const consumerProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });
  
  // Handle consumer output
  consumerProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Consumed analytics event')) {
      console.log('📨 Consumer received event:', output.trim());
    }
  });
  
  consumerProcess.stderr.on('data', (data) => {
    console.error('Consumer error:', data.toString());
  });
  
  // Wait for consumer to start
  console.log('2. Waiting for consumer to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('3. Checking if producer is running...');
  const producerReady = await waitForService(`${PRODUCER_URL}/health`, 'Producer');
  
  if (!producerReady) {
    console.log('❌ Producer is not running. Please start the producer first:');
    console.log('   cd /Users/shubamagrawal/Documents/saleshq-affiliate-producer');
    console.log('   npm run dev');
    consumerProcess.kill();
    process.exit(1);
  }
  
  console.log('4. Sending test events...');
  
  let successCount = 0;
  for (let i = 0; i < testEvents.length; i++) {
    const success = await sendTestEvent(testEvents[i], i);
    if (success) successCount++;
    
    // Wait between events
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`   Events sent: ${testEvents.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${testEvents.length - successCount}`);
  
  console.log('\n5. Waiting for consumer to process events...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('\n✅ Test completed! Check the consumer logs above for processed events.');
  console.log('\nTo stop the consumer, press Ctrl+C');
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping consumer...');
    consumerProcess.kill();
    process.exit(0);
  });
}

// Run the test
runTest().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
