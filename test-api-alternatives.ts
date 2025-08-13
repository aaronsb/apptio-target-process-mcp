#!/usr/bin/env npx tsx

/**
 * Test alternative approaches for problematic parameters
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
  note?: string;
}

// Get today's date in ISO format
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayISO = today.toISOString().split('T')[0];

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowISO = tomorrow.toISOString().split('T')[0];

const testCases: TestCase[] = [
  // Date filtering alternatives
  {
    name: 'Date filter - explicit ISO date (gt)',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: `CreateDate gt '${todayISO}'`
    },
    note: `Using explicit date: ${todayISO}`
  },
  
  {
    name: 'Date filter - explicit ISO date (gte)',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: `CreateDate gte '${todayISO}'`
    },
    note: `Using explicit date: ${todayISO}`
  },
  
  {
    name: 'Date filter - date range for today',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      where: `CreateDate gte '${todayISO}' and CreateDate lt '${tomorrowISO}'`
    },
    note: `Range: ${todayISO} to ${tomorrowISO}`
  },
  
  // OrderBy alternatives
  {
    name: 'OrderBy - test with hyphen separator',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderBy: 'CreateDate-ModifyDate'
    }
  },
  
  {
    name: 'OrderBy - test with pipe separator',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderBy: 'CreateDate|ModifyDate'
    }
  },
  
  {
    name: 'OrderBy - test with semicolon separator',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderBy: 'CreateDate;ModifyDate'
    }
  },
  
  // Try APIv2 style
  {
    name: 'OrderBy - multiple parameters (like arrays)',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      'orderBy[0]': 'CreateDate',
      'orderBy[1]': 'ModifyDate'
    }
  },
  
  // Test if we can use orderByDesc
  {
    name: 'OrderByDesc parameter',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      orderByDesc: 'CreateDate'
    }
  },
  
  // Test sorting in include
  {
    name: 'Try sorting via select/include',
    endpoint: 'Bugs',
    params: {
      format: 'json',
      take: '5',
      select: 'Id,Name,CreateDate,ModifyDate',
      orderBy: 'CreateDate'
    }
  },
  
  // Test complex scenario that should work
  {
    name: 'Working complex query',
    endpoint: 'Tasks',
    params: {
      format: 'json',
      take: '10',
      where: "EntityState.Name ne 'Done'",
      include: '[Project,AssignedUser,EntityState]',
      orderBy: 'ModifyDate'
    }
  }
];

async function testApi(testCase: TestCase): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${testCase.name}`);
  if (testCase.note) {
    console.log(`Note: ${testCase.note}`);
  }
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Build URL manually to have full control
    const paramStrings = Object.entries(testCase.params).map(([key, value]) => {
      return `${key}=${encodeURIComponent(value)}`;
    });
    const url = `${baseUrl}/${testCase.endpoint}?${paramStrings.join('&')}`;
    console.log(`URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS - Returned ${data.Items?.length || 0} items`);
      
      // Show first item if available
      if (data.Items?.length > 0) {
        const first = data.Items[0];
        console.log(`First item: ID=${first.Id}, Name="${first.Name || 'N/A'}", CreateDate=${first.CreateDate}`);
      }
    } else {
      const errorText = await response.text();
      let errorMsg = errorText.substring(0, 200);
      
      // Try to parse and show cleaner error
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.Message || errorMsg;
      } catch {}
      
      console.log(`❌ FAILED - Status ${response.status}: ${errorMsg}`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runTests(): Promise<void> {
  console.log('Testing alternative approaches for TargetProcess API...');
  console.log(`Domain: ${domain}`);
  console.log(`Today's date: ${todayISO}`);
  
  for (const testCase of testCases) {
    await testApi(testCase);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary of findings:');
  console.log('- OrderBy: Only accepts single field names');
  console.log('- Dates: Use explicit ISO dates instead of @Today macro');
  console.log('- Multiple sorts: Not supported in REST API v1');
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(console.error);