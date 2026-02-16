#!/usr/bin/env node

/**
 * Advanced diagnostic to find our created task by Row ID
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

// The Row ID returned from our successful creation
const targetRowId = 6502083164049284;

async function findTargetRow() {
  console.log(`🔍 Advanced search for Row ID: ${targetRowId}...`);

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // Get the sheet with all possible data
    console.log('📊 Fetching complete sheet data with all includes...');
    
    const sheetResponse = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}?include=attachments,discussions,format,filters,objectValue,ownerInfo,source,rowPermalinks`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sheet = sheetResponse.data;
    console.log(`✅ Retrieved sheet: ${sheet.name}`);
    console.log(`📝 Total rows: ${sheet.rows.length}`);
    console.log(`📅 Last modified: ${sheet.modifiedAt}`);
    console.log(`🔢 Version: ${sheet.version}`);
    
    // Look for our specific row ID
    const targetRow = sheet.rows.find(row => row.id === targetRowId);
    
    if (targetRow) {
      console.log('🎉 FOUND THE TARGET ROW!');
      console.log(`   Row ID: ${targetRow.id}`);
      console.log(`   Row Number: ${targetRow.rowNumber}`);
      console.log(`   Created: ${targetRow.createdAt}`);
      console.log(`   Modified: ${targetRow.modifiedAt}`);
      console.log(`   Expanded: ${targetRow.expanded}`);
      console.log(`   Locked: ${targetRow.locked}`);
      
      // Show all cell values
      console.log('\n📝 All Cell Values:');
      targetRow.cells.forEach(cell => {
        const column = sheet.columns.find(col => col.id === cell.columnId);
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          console.log(`   ${column?.title}: ${cell.displayValue || cell.value}`);
        } else if (cell.displayValue) {
          console.log(`   ${column?.title}: ${cell.displayValue} (display only)`);
        }
      });
      
      // Check if row is hidden or filtered
      if (targetRow.filteredOut) {
        console.log('⚠️  WARNING: Row is filtered out!');
      }
      
    } else {
      console.log('❌ Target row NOT found by Row ID');
      
      // Look for the last few rows created
      console.log('\n🔍 Recent rows (last 5):');
      const recentRows = sheet.rows
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      recentRows.forEach(row => {
        console.log(`   Row ${row.rowNumber} (ID: ${row.id}) - Created: ${row.createdAt}`);
        
        // Show task ID if exists
        const taskIdColumn = sheet.columns.find(col => col.title.toLowerCase().includes('task id'));
        if (taskIdColumn) {
          const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
          if (taskIdCell && taskIdCell.value) {
            console.log(`     Task ID: ${taskIdCell.value}`);
          }
        }
      });
    }

    // Check if sheet has filters
    if (sheet.filters && sheet.filters.length > 0) {
      console.log('\n⚠️  ACTIVE FILTERS DETECTED:');
      sheet.filters.forEach((filter, index) => {
        console.log(`   Filter ${index + 1}:`);
        console.log(`     Type: ${filter.filterType}`);
        console.log(`     Column ID: ${filter.columnId}`);
        if (filter.criteria) {
          console.log(`     Criteria: ${JSON.stringify(filter.criteria)}`);
        }
      });
      console.log('\n💡 Filters might be hiding the row!');
    }

    // Also try to get the specific row by ID directly
    console.log(`\n🎯 Attempting direct row retrieval...`);
    try {
      const rowResponse = await axios.get(
        `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows/${targetRowId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Direct row retrieval successful!');
      console.log(JSON.stringify(rowResponse.data, null, 2));
      
    } catch (directRowError) {
      console.log('❌ Direct row retrieval failed:');
      console.log(`   Status: ${directRowError.response?.status}`);
      console.log(`   Message: ${directRowError.response?.data?.message || directRowError.message}`);
    }

  } catch (error) {
    console.error('❌ Error in diagnostic:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

findTargetRow();