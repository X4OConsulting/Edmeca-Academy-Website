#!/usr/bin/env node

/**
 * CHECK PHASE 2 ROWS - Verify row structure
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

async function checkPhase2Rows() {
  try {
    const response = await axios.get(`${apiBase}/sheets/${sheetId}`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    
    const sheet = response.data;
    const columnMap = {};
    sheet.columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    console.log('🔍 CHECKING PHASE 2 ROW STRUCTURE');
    console.log('='.repeat(70));
    
    // Get rows 13-25 (Phase 2 area)
    const phase2Area = sheet.rows.slice(12, 25); // 0-indexed, so 12 = row 13
    
    phase2Area.forEach((row, idx) => {
      const actualRowNum = idx + 13;
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap['Task Name']);
      const statusCell = row.cells.find(cell => cell.columnId === columnMap['Status']);
      const criteriaCell = row.cells.find(cell => cell.columnId === columnMap['Acceptance Criteria']);
      
      const taskId = taskIdCell?.value || 'N/A';
      const taskName = taskNameCell?.value || 'N/A';
      const status = statusCell?.value || 'N/A';
      const hasCriteria = criteriaCell?.value ? '✅ YES' : '❌ NO';
      
      console.log(`\nRow ${actualRowNum} (Smartsheet Row ID: ${row.id})`);
      console.log(`  Task ID: ${taskId}`);
      console.log(`  Name: ${taskName}`);
      console.log(`  Status: ${status}`);
      console.log(`  Has Criteria: ${hasCriteria}`);
      
      if (taskId === 2) {
        console.log(`  ⚠️  WARNING: This is the PARENT ROW - should NOT have detailed criteria!`);
      }
    });
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkPhase2Rows();
