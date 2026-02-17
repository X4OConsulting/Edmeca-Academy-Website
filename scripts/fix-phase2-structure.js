#!/usr/bin/env node

/**
 * FIX PHASE 2 STRUCTURE
 * 1. Clean parent row (Task 2) - remove detailed criteria
 * 2. Find and relocate tasks 2.7 and 2.8 to correct position
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

async function request(method, endpoint, data = null) {
  const config = {
    method,
    url: `${apiBase}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) config.data = data;
  const response = await axios(config);
  return response.data;
}

async function fixPhase2Structure() {
  console.log('🔧 FIXING PHASE 2 STRUCTURE');
  console.log('='.repeat(70));
  
  try {
    // Get sheet data
    const sheet = await request('GET', `/sheets/${sheetId}`);
    
    // Find column mappings
    const columnMap = {};
    sheet.columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    // STEP 1: Fix parent row (Task 2) - Row 13
    console.log('\n📝 STEP 1: Cleaning parent row (Task 2 - Row 13)...');
    console.log('─'.repeat(40));
    
    const parentRow = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      return taskIdCell?.value === 2;
    });

    if (parentRow) {
      const cleanParent = [{
        id: parentRow.id,
        cells: [
          { columnId: columnMap['Task Name'], value: 'PHASE 2: DESIGN & PROTOTYPING' },
          { columnId: columnMap['Status'], value: 'In Progress' },
          { columnId: columnMap['Category'], value: 'Design' },
          { columnId: columnMap['Priority'], value: 'High' },
          { columnId: columnMap['% Complete'], value: '15%' },
          { columnId: columnMap['Description'], value: 'Design and prototyping phase for EDMECA Academy Website' },
          { columnId: columnMap['Acceptance Criteria'], value: '' }, // CLEAR THIS
          { columnId: columnMap['Comments / Notes'], value: '' }, // CLEAR THIS
          { columnId: columnMap['Deliverable'], value: '' } // CLEAR THIS
        ]
      }];

      await request('PUT', `/sheets/${sheetId}/rows`, cleanParent);
      console.log('✅ Cleaned parent row - removed detailed criteria/comments/deliverable');
    }

    // STEP 2: Find tasks 2.7 and 2.8
    console.log('\n📝 STEP 2: Locating tasks 2.7 and 2.8...');
    console.log('─'.repeat(40));
    
    const task27 = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      return taskIdCell?.value === 2.7;
    });
    
    const task28 = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      return taskIdCell?.value === 2.8;
    });

    if (task27) {
      const task27Name = task27.cells.find(c => c.columnId === columnMap['Task Name'])?.value;
      console.log(`✅ Found Task 2.7 (Row ID: ${task27.id}): ${task27Name}`);
    } else {
      console.log('❌ Task 2.7 not found!');
    }

    if (task28) {
      const task28Name = task28.cells.find(c => c.columnId === columnMap['Task Name'])?.value;
      console.log(`✅ Found Task 2.8 (Row ID: ${task28.id}): ${task28Name}`);
    } else {
      console.log('❌ Task 2.8 not found!');
    }

    // STEP 3: Move tasks to correct position (after 2.6, before task 3)
    if (task27 && task28) {
      console.log('\n📝 STEP 3: Moving tasks to correct position...');
      console.log('─'.repeat(40));
      
      // Find task 2.6 (we want to insert after it)
      const task26 = sheet.rows.find(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        return taskIdCell?.value === 2.6;
      });

      if (task26) {
        console.log(`📍 Will move tasks after Task 2.6 (Row ID: ${task26.id})`);
        
        // Move task 2.7 first
        await request('PUT', `/sheets/${sheetId}/rows`, [{
          id: task27.id,
          siblingId: task26.id,
          below: true
        }]);
        console.log('✅ Moved Task 2.7 to correct position');
        
        // Then move task 2.8 (after 2.7)
        await request('PUT', `/sheets/${sheetId}/rows`, [{
          id: task28.id,
          siblingId: task27.id,
          below: true
        }]);
        console.log('✅ Moved Task 2.8 to correct position');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ PHASE 2 STRUCTURE FIX COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log('  ✅ Parent row cleaned (Row 13)');
    console.log('  ✅ Tasks 2.7 and 2.8 relocated to Phase 2 section');
    console.log('  ✅ Phase 2 now has proper structure');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixPhase2Structure();
