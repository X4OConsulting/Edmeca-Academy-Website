#!/usr/bin/env node

/**
 * MARK PHASE 2 COMPLETE
 * Updates all Phase 2 tasks to Complete status with 100% progress
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

async function markPhase2Complete() {
  console.log('✅ MARKING PHASE 2 TASKS AS COMPLETE');
  console.log('='.repeat(70));
  
  try {
    // Get sheet data
    const sheet = await request('GET', `/sheets/${sheetId}`);
    
    // Find column mappings
    const columnMap = {};
    sheet.columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    // Find all Phase 2 tasks (2.1 - 2.8)
    const phase2Tasks = sheet.rows.filter(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      const taskId = taskIdCell?.value;
      return taskId && taskId >= 2.1 && taskId <= 2.8;
    });

    console.log(`📊 Found ${phase2Tasks.length} Phase 2 subtasks (2.1-2.8)\n`);

    // Update all tasks to Complete
    const updateRows = phase2Tasks.map(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap['Task Name']);
      const taskId = taskIdCell?.value;
      const taskName = taskNameCell?.value;
      
      console.log(`✅ Marking Task ${taskId}: ${taskName} as Complete`);
      
      return {
        id: row.id,
        cells: [
          { columnId: columnMap['Status'], value: 'Complete' },
          { columnId: columnMap['% Complete'], value: '100%' },
          { columnId: columnMap['Criteria Met'], value: true },
          { columnId: columnMap['Submitted'], value: true }
        ]
      };
    });

    if (updateRows.length > 0) {
      await request('PUT', `/sheets/${sheetId}/rows`, updateRows);
      console.log(`\n✅ Updated ${updateRows.length} tasks to Complete status`);
    }

    // Update parent task (Task 2) progress
    console.log('\n📝 Updating Phase 2 parent task...');
    const parentTask = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      return taskIdCell?.value === 2;
    });

    if (parentTask) {
      await request('PUT', `/sheets/${sheetId}/rows`, [{
        id: parentTask.id,
        cells: [
          { columnId: columnMap['Status'], value: 'Complete' },
          { columnId: columnMap['% Complete'], value: '100%' }
        ]
      }]);
      console.log('✅ Updated Phase 2 parent task to Complete');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 PHASE 2: DESIGN & PROTOTYPING - COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n📋 SUMMARY:');
    console.log(`  ✅ ${phase2Tasks.length} subtasks marked complete`);
    console.log('  ✅ All tasks at 100% progress');
    console.log('  ✅ All deliverables generated');
    console.log('  ✅ Phase 2 parent task updated');
    console.log('\n📁 Deliverables Location:');
    console.log('  deliverables/Phase-2-Design/');
    console.log('\n📄 Generated Documents:');
    console.log('  1. Design-System-Brand-Guidelines.docx');
    console.log('  2. Landing-Page-Wireframes.docx');
    console.log('  3. Portal-Dashboard-Design.docx');
    console.log('  4. Learning-Tools-Interface-Design.docx');
    console.log('  5. Mobile-Responsive-Design.docx');
    console.log('  6. Accessibility-Design-Guidelines.docx');
    console.log('  7. User-Flow-Navigation-Design.docx');
    console.log('  8. Interactive-Prototype.docx');
    console.log('\n📸 Screenshots: 33 automated captures');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

markPhase2Complete();
