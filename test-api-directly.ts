#!/usr/bin/env npx tsx

/**
 * Direct API testing script to understand TargetProcess parameter handling
 * Tests various orderBy and where clause formats to see what works
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const domain = process.env.TP_DOMAIN;
const username = process.env.TP_USERNAME;
const password = process.env.TP_PASSWORD;

if (!domain || !username || !password) {
  console.error('Missing required environment variables: TP_DOMAIN, TP_USERNAME, TP_PASSWORD');
  process.exit(1);
}

const baseUrl = `https://${domain}/api/v1`;
const auth = Buffer.from(`${username}:${password}`).toString('base64');

interface TestCase {
  name: string;
  endpoint: string;
  params: Record<string, string>;
}

const testCases: TestCase[] = [
  // Test 1: Single orderBy field
  {
    name: 'Single orderBy field',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderBy: 'CreateDate'
    }
  },
  
  // Test 2: Multiple orderBy fields with comma
  {
    name: 'Multiple orderBy with comma (no encoding)',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderBy: 'CreateDate,ModifyDate'
    }
  },
  
  // Test 3: Multiple orderBy fields with space
  {
    name: 'Multiple orderBy with space',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderBy: 'CreateDate ModifyDate'
    }
  },
  
  // Test 4: OrderBy with direction
  {
    name: 'OrderBy with desc keyword',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderBy: 'CreateDate desc'
    }
  },
  
  // Test 5: Where clause with high priority
  {
    name: 'Where clause - high priority',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: "Priority.Name eq 'High'"
    }
  },
  
  // Test 6: Where clause with null check
  {
    name: 'Where clause - unassigned',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: 'AssignedUser is null'
    }
  },
  
  // Test 7: Complex where with orderBy
  {
    name: 'High priority unassigned with orderBy',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: "Priority.Name eq 'High' and AssignedUser is null",
      orderBy: 'CreateDate'
    }
  },
  
  // Test 8: Date filter with @Today
  {
    name: 'Date filter - created today (gt)',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: 'CreateDate gt @Today'
    }
  },
  
  // Test 9: Date filter with gte
  {
    name: 'Date filter - created today (gte)',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: 'CreateDate gte @Today'
    }
  },
  
  // Test 10: Include with orderBy
  {
    name: 'Include with multiple orderBy',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      include: '[Project,AssignedUser,EntityState,Priority]',
      orderBy: 'CreateDate,ModifyDate'
    }
  }
];

async function testApi(testCase: TestCase): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Build URL with parameters
    const url = new URL(`${baseUrl}/${testCase.endpoint}`);
    
    // Two approaches to test parameter encoding
    
    // Approach 1: Using URLSearchParams (standard encoding)
    console.log('\nApproach 1: URLSearchParams (standard encoding)');
    const params1 = new URLSearchParams(testCase.params);
    const url1 = `${baseUrl}/${testCase.endpoint}?${params1.toString()}`;
    console.log(`URL: ${url1}`);
    
    const response1 = await fetch(url1, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (response1.ok) {
      const data = await response1.json();
      console.log(`✅ SUCCESS - Returned ${data.Items?.length || 0} items`);
    } else {
      const errorText = await response1.text();
      console.log(`❌ FAILED - Status ${response1.status}: ${errorText.substring(0, 200)}`);
    }
    
    // Approach 2: Manual URL construction (no encoding on commas)
    console.log('\nApproach 2: Manual construction (no comma encoding)');
    const paramStrings = Object.entries(testCase.params).map(([key, value]) => {
      // Don't encode commas in orderBy
      if (key === 'orderBy') {
        return `${key}=${value}`;
      }
      return `${key}=${encodeURIComponent(value)}`;
    });
    const url2 = `${baseUrl}/${testCase.endpoint}?${paramStrings.join('&')}`;
    console.log(`URL: ${url2}`);
    
    const response2 = await fetch(url2, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (response2.ok) {
      const data = await response2.json();
      console.log(`✅ SUCCESS - Returned ${data.Items?.length || 0} items`);
    } else {
      const errorText = await response2.text();
      console.log(`❌ FAILED - Status ${response2.status}: ${errorText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runTests(): Promise<void> {
  console.log('Testing TargetProcess API parameter handling...');
  console.log(`Domain: ${domain}`);
  console.log(`Auth: Basic (${username})`);
  
  for (const testCase of testCases) {
    await testApi(testCase);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Testing complete!');
}

// Run the tests
runTests().catch(console.error);