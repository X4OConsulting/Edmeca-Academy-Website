#!/usr/bin/env node

/**
 * Analyze Phase 1: Planning section (rows 2-12)
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function analyzePhase1() {
  console.log('🔍 Analyzing Phase 1: Planning (rows 2-12)...');

  try {
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
    console.log(`📝 Total rows: ${sheet.rows.length}`);
    
    // Get key column mappings
    const columnMap = {};
    sheet.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('task id')) columnMap.taskId = { id: col.id, title: col.title };
      if (title.includes('task name')) columnMap.taskName = { id: col.id, title: col.title };
      if (title.includes('sdlc phase')) columnMap.phase = { id: col.id, title: col.title };
      if (title.includes('priority')) columnMap.priority = { id: col.id, title: col.title };
      if (title.includes('status')) columnMap.status = { id: col.id, title: col.title };
      if (title.includes('% complete')) columnMap.percentComplete = { id: col.id, title: col.title };
      if (title.includes('description')) columnMap.description = { id: col.id, title: col.title };
    });

    console.log('\n📋 PHASE 1 ANALYSIS (Rows 2-12):');
    console.log('='.repeat(80));

    // Analyze rows 2-12 (rowNumber 2-12)
    const phase1Rows = sheet.rows.filter(row => row.rowNumber >= 2 && row.rowNumber <= 12);
    
    console.log(`📊 Found ${phase1Rows.length} rows in range 2-12`);
    console.log('\n📋 ROW BY ROW ANALYSIS:');

    let populatedRows = 0;
    let emptyRows = 0;
    let phase1Tasks = [];

    phase1Rows.forEach(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId?.id);
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap.taskName?.id);
      const statusCell = row.cells.find(cell => cell.columnId === columnMap.status?.id);
      const phaseCell = row.cells.find(cell => cell.columnId === columnMap.phase?.id);
      
      const hasTaskId = taskIdCell && (taskIdCell.value !== null && taskIdCell.value !== undefined);
      const hasTaskName = taskNameCell && (taskNameCell.value !== null && taskNameCell.value !== undefined && taskNameCell.value !== '');
      const hasContent = hasTaskId || hasTaskName;
      
      console.log(`\n📍 Row ${row.rowNumber} (ID: ${row.id}):`);
      console.log(`   Task ID: ${hasTaskId ? taskIdCell.displayValue || taskIdCell.value : 'EMPTY'}`);
      console.log(`   Task Name: ${hasTaskName ? `"${taskNameCell.displayValue || taskNameCell.value}"` : 'EMPTY'}`);
      console.log(`   Phase: ${phaseCell?.displayValue || phaseCell?.value || 'EMPTY'}`);
      console.log(`   Status: ${statusCell?.displayValue || statusCell?.value || 'EMPTY'}`);
      console.log(`   Content Status: ${hasContent ? '✅ POPULATED' : '❌ EMPTY'}`);

      if (hasContent) {
        populatedRows++;
        if (hasTaskId) {
          phase1Tasks.push({
            id: taskIdCell.value,
            name: taskNameCell?.value || 'No name',
            status: statusCell?.value || 'No status',
            rowNumber: row.rowNumber,
            rowId: row.id
          });
        }
      } else {
        emptyRows++;
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('📈 PHASE 1 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`📊 Total rows analyzed: ${phase1Rows.length}`);
    console.log(`✅ Populated rows: ${populatedRows}`);
    console.log(`❌ Empty rows: ${emptyRows}`);
    console.log(`🎯 Phase 1 tasks found: ${phase1Tasks.length}`);

    console.log('\n🎯 PHASE 1 TASK LIST:');
    phase1Tasks.sort((a, b) => a.id - b.id).forEach(task => {
      console.log(`   ${task.id}: ${task.name} (${task.status}) - Row ${task.rowNumber}`);
    });

    // Check for gaps in task sequence
    console.log('\n🔍 TASK SEQUENCE ANALYSIS:');
    if (phase1Tasks.length > 0) {
      const taskNumbers = phase1Tasks.map(t => parseFloat(t.id)).sort((a, b) => a - b);
      console.log(`   Task range: ${taskNumbers[0]} to ${taskNumbers[taskNumbers.length - 1]}`);
      
      // Check for missing tasks
      const expectedTasks = [];
      if (taskNumbers.length > 0) {
        const maxTask = Math.floor(taskNumbers[taskNumbers.length - 1] * 10) / 10; // Get max like 1.8
        for (let i = 1.1; i <= maxTask; i = Math.round((i + 0.1) * 10) / 10) {
          expectedTasks.push(i);
        }
      }
      
      const missingTasks = expectedTasks.filter(expected => 
        !taskNumbers.some(actual => Math.abs(actual - expected) < 0.01)
      );
      
      if (missingTasks.length > 0) {
        console.log(`   ⚠️  Missing task IDs: ${missingTasks.join(', ')}`);
      } else {
        console.log(`   ✅ Task sequence complete (no gaps)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS:');
    console.log('='.repeat(80));

    if (emptyRows > 0) {
      console.log(`📝 ${emptyRows} empty rows available (rows 10-12)`);
      console.log('   Recommendation: UPDATE existing empty rows rather than adding new ones');
      console.log('   Benefits: Maintains sheet structure, avoids row bloat');
      
      // Show which rows are empty
      const emptyRowDetails = phase1Rows.filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId?.id);
        const taskNameCell = row.cells.find(cell => cell.columnId === columnMap.taskName?.id);
        return !(taskIdCell?.value || taskNameCell?.value);
      });

      console.log('\n   🎯 Available empty rows for new tasks:');
      emptyRowDetails.forEach(row => {
        console.log(`     Row ${row.rowNumber} (ID: ${row.id}) - Ready for population`);
      });
      
      // Suggest next task IDs
      if (phase1Tasks.length > 0) {
        const maxTaskNum = Math.max(...phase1Tasks.map(t => {
          const parts = t.id.toString().split('.');
          return parts.length > 1 ? parseInt(parts[1]) : 0;
        }));
        
        console.log(`\n   📋 Suggested next task IDs:`);
        for (let i = 1; i <= emptyRows; i++) {
          console.log(`     1.${maxTaskNum + i} - Available for new task`);
        }
      }
    } else {
      console.log('📝 No empty rows in Phase 1 section');
      console.log('   Recommendation: ADD new rows at the end of Phase 1');
    }

    // Check if Phase 1 is complete based on typical planning tasks
    console.log('\n🎯 PHASE 1 COMPLETENESS CHECK:');
    const commonPlanningTasks = [
      'Tech Stack Analysis',
      'Database Architecture',
      'Authentication Strategy', 
      'Site Architecture',
      'UI Component System',
      'Content Management Strategy',
      'Git Workflow',
      'SDLC Project Tracker'
    ];

    const foundTasks = phase1Tasks.map(t => t.name.toLowerCase());
    const missingPlanningTasks = commonPlanningTasks.filter(common => 
      !foundTasks.some(found => found.includes(common.toLowerCase().split(' ')[0]))
    );

    if (missingPlanningTasks.length === 0) {
      console.log('   ✅ Phase 1 appears complete - all major planning areas covered');
    } else {
      console.log('   📋 Potential additional tasks to consider:');
      missingPlanningTasks.forEach(task => {
        console.log(`     - ${task}`);
      });
    }

  } catch (error) {
    console.error('❌ Error analyzing Phase 1:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

analyzePhase1();