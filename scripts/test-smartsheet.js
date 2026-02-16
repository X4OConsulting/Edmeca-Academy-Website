#!/usr/bin/env node

/**
 * Simple Smartsheet API Test
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

console.log('🧪 Testing Smartsheet API Connection...');
console.log(`📋 Sheet ID: ${sheetId}`);
console.log(`🔑 Token: ${apiToken?.substring(0, 10)}...`);

if (!apiToken || !sheetId) {
  console.error('❌ Missing credentials in .env.local');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔄 Making API request...');
    
    const response = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Connection successful!');
    console.log(`📊 Sheet Name: ${response.data.name}`);
    console.log(`📝 Total Rows: ${response.data.totalRowCount}`);
    console.log(`📋 Columns: ${response.data.columns.length}`);
    
    // Show first few column names
    const columnNames = response.data.columns.slice(0, 5).map(c => c.title);
    console.log(`📌 First columns: ${columnNames.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.response?.data?.message || error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.response?.status === 403) {
      console.error('   🔒 This might be a permissions issue - check your API token');
    }
    if (error.response?.status === 404) {
      console.error('   📋 Sheet not found - check your Sheet ID');
    }
  }
}

testConnection();