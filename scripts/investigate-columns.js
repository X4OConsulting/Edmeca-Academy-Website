#!/usr/bin/env node

/**
 * Investigate column properties and constraints
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function investigateColumns() {
  console.log('🔍 Investigating column properties and constraints...');

  if (!apiToken || !sheetId) {
    console.error('❌ Missing credentials');
    process.exit(1);
  }

  try {
    // Get sheet with all column details
    const sheetResponse = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sheet = sheetResponse.data;
    
    console.log(`📊 Sheet: ${sheet.name}`);
    console.log(`🔒 Access Level: ${sheet.accessLevel}`);
    console.log(`📝 Read Only: ${sheet.readOnly || false}`);
    console.log('\n📋 COLUMN ANALYSIS:');
    console.log('='.repeat(80));

    // Focus on the columns we tried to populate
    const targetColumns = [
      'Task ID',
      'Task Name', 
      'SDLC Phase',
      'Category',
      'Priority',
      'Status',
      '% Complete',
      'Description'
    ];

    targetColumns.forEach(colName => {
      const column = sheet.columns.find(col => col.title === colName);
      if (column) {
        console.log(`\n📌 ${colName} (ID: ${column.id})`);
        console.log(`   Type: ${column.type}`);
        console.log(`   Primary: ${column.primary || false}`);
        console.log(`   Locked: ${column.locked || false}`);
        console.log(`   Locked for User: ${column.lockedForUser || false}`);
        console.log(`   System Column: ${column.systemColumnType || 'None'}`);
        console.log(`   Hidden: ${column.hidden || false}`);
        console.log(`   Index: ${column.index}`);
        
        // Check for validation or options
        if (column.validation) {
          console.log(`   🔐 Validation: ${JSON.stringify(column.validation)}`);
        }
        
        if (column.options) {
          console.log(`   📝 Options: ${JSON.stringify(column.options)}`);
        }
        
        if (column.format) {
          console.log(`   🎨 Format: ${JSON.stringify(column.format)}`);
        }

        if (column.formula) {
          console.log(`   🧮 Formula: ${column.formula}`);
        }

        if (column.width) {
          console.log(`   📏 Width: ${column.width}`);
        }

      } else {
        console.log(`\n❌ Column "${colName}" NOT FOUND`);
      }
    });

    // Also show what the existing Phase 1 tasks look like
    console.log('\n' + '='.repeat(80));
    console.log('📋 EXISTING TASK DATA ANALYSIS:');
    console.log('='.repeat(80));

    // Get task ID column
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    const taskNameColumn = sheet.columns.find(col => col.title === 'Task Name');
    const statusColumn = sheet.columns.find(col => col.title === 'Status');

    if (taskIdColumn) {
      const phase1Row = sheet.rows.find(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
        return taskIdCell && taskIdCell.value === '1.1';
      });

      if (phase1Row) {
        console.log('\n🔍 Example: Task 1.1 cell structure:');
        phase1Row.cells.forEach(cell => {
          const column = sheet.columns.find(col => col.id === cell.columnId);
          if (cell.value || cell.displayValue) {
            console.log(`   ${column?.title}: {`);
            console.log(`     value: ${JSON.stringify(cell.value)}`);
            console.log(`     displayValue: ${JSON.stringify(cell.displayValue)}`);
            console.log(`     formula: ${JSON.stringify(cell.formula)}`);
            console.log(`   }`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Error investigating columns:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

investigateColumns();