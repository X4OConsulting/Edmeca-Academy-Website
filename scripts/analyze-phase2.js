#!/usr/bin/env node

/**
 * PHASE 2 DESIGN - SMARTSHEET ANALYSIS & UPDATE
 * Comprehensive analysis and update of Phase 2: Design tasks
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

class Phase2Analyzer {
  constructor() {
    this.apiToken = apiToken;
    this.sheetId = sheetId;
  }

  async request(method, endpoint, data = null) {
    const config = {
      method,
      url: `${apiBase}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  }

  async analyzePhase2() {
    console.log('🎨 PHASE 2: DESIGN - COMPREHENSIVE ANALYSIS');
    console.log('='.repeat(70));
    
    try {
      // Get sheet data
      const sheet = await this.request('GET', `/sheets/${this.sheetId}`);
      
      // Find column mappings
      const columnMap = {};
      sheet.columns.forEach(col => {
        columnMap[col.title] = col.id;
      });

      // Find Phase 2 tasks (Task ID between 2.0 and 2.99)
      const phase2Tasks = sheet.rows.filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        const phaseCell = row.cells.find(cell => cell.columnId === columnMap['SDLC Phase']);
        const taskId = taskIdCell?.value;
        const phase = phaseCell?.value;
        
        return (taskId && taskId >= 2.0 && taskId <= 2.99) || 
               (phase && (phase.toString().includes('2') || phase.toString().toLowerCase().includes('design')));
      }).sort((a, b) => {
        const aTaskId = a.cells.find(cell => cell.columnId === columnMap['Task ID'])?.value || 0;
        const bTaskId = b.cells.find(cell => cell.columnId === columnMap['Task ID'])?.value || 0;
        return aTaskId - bTaskId;
      });

      console.log(`📊 Found ${phase2Tasks.length} Phase 2 tasks\n`);
      console.log('─'.repeat(70));

      // Expected Phase 2 tasks based on typical design phase
      const expectedPhase2Tasks = [
        { id: 2.1, name: 'Design System & Brand Guidelines', category: 'UI/UX' },
        { id: 2.2, name: 'Landing Page Wireframes', category: 'UI/UX' },
        { id: 2.3, name: 'Solution Pages Design', category: 'UI/UX' },
        { id: 2.4, name: 'User Portal Design', category: 'UI/UX' },
        { id: 2.5, name: 'Responsive Design Mockups', category: 'UI/UX' },
        { id: 2.6, name: 'Component Library Design', category: 'UI/UX' },
        { id: 2.7, name: 'User Flow & Navigation Design', category: 'UX' },
        { id: 2.8, name: 'Interactive Prototype', category: 'UX' }
      ];

      // Analyze each existing task
      let completeCount = 0;
      let inProgressCount = 0;
      let notStartedCount = 0;
      let hasCriteriaCount = 0;
      let hasCommentsCount = 0;
      let hasDeliverablesCount = 0;

      const taskDetails = [];

      phase2Tasks.forEach(row => {
        const taskId = row.cells.find(cell => cell.columnId === columnMap['Task ID'])?.value;
        const taskName = row.cells.find(cell => cell.columnId === columnMap['Task Name'])?.value;
        const status = row.cells.find(cell => cell.columnId === columnMap['Status'])?.value;
        const category = row.cells.find(cell => cell.columnId === columnMap['Category'])?.value;
        const priority = row.cells.find(cell => cell.columnId === columnMap['Priority'])?.value;
        const progress = row.cells.find(cell => cell.columnId === columnMap['% Complete'])?.value;
        const criteria = row.cells.find(cell => cell.columnId === columnMap['Acceptance Criteria'])?.value;
        const comments = row.cells.find(cell => cell.columnId === columnMap['Comments / Notes'])?.value;
        const deliverable = row.cells.find(cell => cell.columnId === columnMap['Deliverable'])?.value;
        const assigned = row.cells.find(cell => cell.columnId === columnMap['Assigned To'])?.value;

        if (status === 'Complete') completeCount++;
        else if (status === 'In Progress') inProgressCount++;
        else if (status === 'Not Started') notStartedCount++;

        if (criteria) hasCriteriaCount++;
        if (comments) hasCommentsCount++;
        if (deliverable) hasDeliverablesCount++;

        taskDetails.push({
          rowId: row.id,
          taskId,
          taskName,
          status,
          category,
          priority,
          progress,
          hasCriteria: !!criteria,
          hasComments: !!comments,
          hasDeliverable: !!deliverable,
          assigned
        });

        const statusEmoji = status === 'Complete' ? '✅' : 
                           status === 'In Progress' ? '🔄' : 
                           status === 'Not Started' ? '⏸️' : '❓';
        
        console.log(`${statusEmoji} Task ${taskId}: ${taskName}`);
        console.log(`   Status: ${status} | Progress: ${progress || 0}% | Priority: ${priority || 'None'}`);
        console.log(`   Category: ${category || 'Not set'} | Assigned: ${assigned || 'Unassigned'}`);
        console.log(`   Documentation: ${criteria ? '✅' : '❌'} Criteria | ${comments ? '✅' : '❌'} Comments | ${deliverable ? '✅' : '❌'} Deliverable`);
        console.log('');
      });

      // Summary
      console.log('─'.repeat(70));
      console.log('📊 PHASE 2 SUMMARY:');
      console.log('─'.repeat(35));
      console.log(`📋 Total Tasks: ${phase2Tasks.length}`);
      console.log(`✅ Complete: ${completeCount} (${Math.round(completeCount/phase2Tasks.length*100)}%)`);
      console.log(`🔄 In Progress: ${inProgressCount} (${Math.round(inProgressCount/phase2Tasks.length*100)}%)`);
      console.log(`⏸️  Not Started: ${notStartedCount} (${Math.round(notStartedCount/phase2Tasks.length*100)}%)`);
      console.log('');
      console.log('📝 DOCUMENTATION:');
      console.log(`   Acceptance Criteria: ${hasCriteriaCount}/${phase2Tasks.length} (${Math.round(hasCriteriaCount/phase2Tasks.length*100)}%)`);
      console.log(`   Comments/Notes: ${hasCommentsCount}/${phase2Tasks.length} (${Math.round(hasCommentsCount/phase2Tasks.length*100)}%)`);
      console.log(`   Deliverables: ${hasDeliverablesCount}/${phase2Tasks.length} (${Math.round(hasDeliverablesCount/phase2Tasks.length*100)}%)`);
      console.log('');

      // Check for expected vs actual tasks
      console.log('🎯 EXPECTED PHASE 2 TASK COVERAGE:');
      console.log('─'.repeat(40));
      
      const coverageResults = [];
      expectedPhase2Tasks.forEach(expected => {
        const found = taskDetails.find(task => 
          task.taskId === expected.id || 
          (task.taskName && task.taskName.toLowerCase().includes(expected.name.toLowerCase().split(' ')[0].toLowerCase()))
        );
        
        if (found) {
          console.log(`✅ ${expected.name} (Task ${expected.id})`);
          coverageResults.push({ expected, found: true, task: found });
        } else {
          console.log(`❌ ${expected.name} (Task ${expected.id}) - MISSING`);
          coverageResults.push({ expected, found: false });
        }
      });

      const coveragePercent = Math.round((coverageResults.filter(r => r.found).length / expectedPhase2Tasks.length) * 100);
      
      console.log('');
      console.log(`📈 Task Coverage: ${coveragePercent}% (${coverageResults.filter(r => r.found).length}/${expectedPhase2Tasks.length})`);
      console.log('');

      // Recommendations
      console.log('💡 RECOMMENDATIONS:');
      console.log('─'.repeat(20));
      
      const incompleteCount = phase2Tasks.length - completeCount;
      const missingDocs = phase2Tasks.length - Math.min(hasCriteriaCount, hasCommentsCount);
      const missingTasks = expectedPhase2Tasks.length - coverageResults.filter(r => r.found).length;

      if (completeCount === phase2Tasks.length && hasCriteriaCount === phase2Tasks.length) {
        console.log('🎉 EXCELLENT! Phase 2 is complete with full documentation');
      } else {
        if (incompleteCount > 0) {
          console.log(`🔧 ${incompleteCount} tasks need completion or status update`);
        }
        if (missingDocs > 0) {
          console.log(`📝 ${missingDocs} tasks need acceptance criteria and/or comments`);
        }
        if (missingTasks > 0) {
          console.log(`➕ ${missingTasks} expected tasks are missing and should be added`);
        }
      }

      console.log('');
      console.log('🚀 NEXT STEPS:');
      console.log('   1. Update incomplete tasks with proper documentation');
      console.log('   2. Add missing expected tasks');
      console.log('   3. Ensure all tasks have acceptance criteria');
      console.log('   4. Update task status to reflect actual progress');
      console.log('   5. Create Phase 2 deliverables when tasks complete');

      return {
        totalTasks: phase2Tasks.length,
        completeCount,
        inProgressCount,
        notStartedCount,
        documentationRate: Math.round((hasCriteriaCount + hasCommentsCount) / (phase2Tasks.length * 2) * 100),
        coveragePercent,
        taskDetails,
        missingTasks: coverageResults.filter(r => !r.found).map(r => r.expected)
      };

    } catch (error) {
      console.error('❌ Error analyzing Phase 2:');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      return null;
    }
  }
}

// Execute analysis
async function main() {
  const analyzer = new Phase2Analyzer();
  const result = await analyzer.analyzePhase2();
  
  if (result) {
    console.log('\n✨ PHASE 2 ANALYSIS COMPLETE!');
    console.log(`Ready to update ${result.totalTasks} tasks with ${result.missingTasks.length} tasks to add`);
  }
}

main();