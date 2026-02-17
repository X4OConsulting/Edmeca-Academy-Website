#!/usr/bin/env node

/**
 * DEFINITIVE PHASE 1 COMPLETION ANALYSIS
 * Final comprehensive check and summary of Phase 1 status
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

class DefinitivePhase1Analysis {
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

  async performDefinitiveAnalysis() {
    console.log('🎯 DEFINITIVE PHASE 1 COMPLETION ANALYSIS');
    console.log('='.repeat(80));
    
    try {
      // Get complete sheet data
      const sheet = await this.request('GET', `/sheets/${this.sheetId}`);
      
      // Find column mappings
      const columnMap = {};
      sheet.columns.forEach(col => {
        columnMap[col.title] = col.id;
      });

      console.log('📊 SHEET OVERVIEW:');
      console.log(`   Total Rows: ${sheet.rows.length}`);
      console.log(`   Total Columns: ${sheet.columns.length}`);
      console.log('');

      // Find EXACTLY what planning tasks exist in rows 1-15 (typical Phase 1 location)
      console.log('🔍 EXAMINING FIRST 15 ROWS (PHASE 1 SECTION):');
      console.log('─'.repeat(60));

      const phase1Section = sheet.rows.slice(0, 15);
      const planningTasks = [];

      phase1Section.forEach((row, index) => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        const taskNameCell = row.cells.find(cell => cell.columnId === columnMap['Task Name']);
        const phaseCell = row.cells.find(cell => cell.columnId === columnMap['SDLC Phase']);
        const statusCell = row.cells.find(cell => cell.columnId === columnMap['Status']);
        const criteriaCell = row.cells.find(cell => cell.columnId === columnMap['Acceptance Criteria']);
        const commentsCell = row.cells.find(cell => cell.columnId === columnMap['Comments / Notes']);
        const deliverableCell = row.cells.find(cell => cell.columnId === columnMap['Deliverable']);
        const categoryCell = row.cells.find(cell => cell.columnId === columnMap['Category']);
        
        const taskId = taskIdCell?.value;
        const taskName = taskNameCell?.value || taskNameCell?.displayValue;
        const phase = phaseCell?.value || phaseCell?.displayValue;
        const status = statusCell?.value || statusCell?.displayValue;
        const hasCriteria = criteriaCell?.value ? true : false;
        const hasComments = commentsCell?.value ? true : false;
        const hasDeliverable = deliverableCell?.value ? true : false;
        const category = categoryCell?.value || categoryCell?.displayValue;

        if (taskName && (taskId || phase)) {
          const isPlanning = phase && phase.toString().includes('1') || phase && phase.toString().toLowerCase().includes('planning');
          
          planningTasks.push({
            rowIndex: index + 1,
            taskId,
            taskName,
            phase,
            status,
            category,
            hasCriteria,
            hasComments,
            hasDeliverable,
            isPlanning
          });

          const completenessFields = [hasCriteria, hasComments, hasDeliverable].filter(Boolean).length;
          const planningMarker = isPlanning ? '📋' : '📄';
          
          console.log(`${planningMarker} Row ${index + 1}: Task ${taskId} - "${taskName}"`);
          console.log(`   Phase: ${phase} | Status: ${status} | Category: ${category}`);
          console.log(`   Completeness: ${completenessFields}/3 (Criteria: ${hasCriteria ? '✅' : '❌'}, Comments: ${hasComments ? '✅' : '❌'}, Deliverable: ${hasDeliverable ? '✅' : '❌'})`);
          console.log('');
        }
      });

      // Analyze planning tasks specifically
      const actualPlanningTasks = planningTasks.filter(task => task.isPlanning);
      
      console.log('📋 PHASE 1 PLANNING TASKS ANALYSIS:');
      console.log('='.repeat(50));
      console.log(`📊 Planning Tasks Found: ${actualPlanningTasks.length}`);
      
      if (actualPlanningTasks.length > 0) {
        let completeCount = 0;
        let criteriaMet = 0;
        let commentsProvided = 0;
        let deliverablesPresent = 0;
        
        actualPlanningTasks.forEach(task => {
          if (task.status === 'Complete') completeCount++;
          if (task.hasCriteria) criteriaMet++;
          if (task.hasComments) commentsProvided++;
          if (task.hasDeliverable) deliverablesPresent++;
          
          console.log(`✅ Task ${task.taskId}: ${task.taskName.substring(0, 50)}...`);
          console.log(`   Status: ${task.status} | Category: ${task.category}`);
        });
        
        console.log('─'.repeat(50));
        console.log('📊 COMPLETENESS METRICS:');
        console.log(`   ✅ Complete Status: ${completeCount}/${actualPlanningTasks.length} (${Math.round(completeCount/actualPlanningTasks.length*100)}%)`);
        console.log(`   📝 Acceptance Criteria: ${criteriaMet}/${actualPlanningTasks.length} (${Math.round(criteriaMet/actualPlanningTasks.length*100)}%)`);
        console.log(`   💭 Comments/Notes: ${commentsProvided}/${actualPlanningTasks.length} (${Math.round(commentsProvided/actualPlanningTasks.length*100)}%)`);
        console.log(`   📄 Deliverables: ${deliverablesPresent}/${actualPlanningTasks.length} (${Math.round(deliverablesPresent/actualPlanningTasks.length*100)}%)`);
        
        // Check for expected Phase 1 task types
        console.log('\n🎯 EXPECTED PHASE 1 TASK COVERAGE:');
        console.log('─'.repeat(35));
        
        const expectedTaskTypes = [
          'Tech Stack',
          'Database',
          'Authentication', 
          'Architecture',
          'UI Component',
          'Content',
          'Workflow',
          'Project Tracker',
          'API Integration',
          'Performance',
          'Security'
        ];
        
        const coveredTypes = [];
        const missingTypes = [];
        
        expectedTaskTypes.forEach(type => {
          const found = actualPlanningTasks.some(task => 
            task.taskName.toLowerCase().includes(type.toLowerCase()) ||
            (type === 'Workflow' && task.taskName.toLowerCase().includes('git')) ||
            (type === 'Project Tracker' && task.taskName.toLowerCase().includes('tracker'))
          );
          
          if (found) {
            coveredTypes.push(type);
            console.log(`✅ ${type}: Covered`);
          } else {
            missingTypes.push(type);
            console.log(`❌ ${type}: Missing`);
          }
        });
        
        const coveragePercent = Math.round((coveredTypes.length / expectedTaskTypes.length) * 100);
        
        console.log('\n📊 OVERALL ASSESSMENT:');
        console.log('='.repeat(30));
        console.log(`🎯 Task Type Coverage: ${coveragePercent}% (${coveredTypes.length}/${expectedTaskTypes.length})`);
        console.log(`📋 Planning Tasks Present: ${actualPlanningTasks.length}`);
        console.log(`✅ Tasks Complete: ${Math.round(completeCount/actualPlanningTasks.length*100)}%`);
        console.log(`📝 Documentation Complete: ${Math.round((criteriaMet+commentsProvided+deliverablesPresent)/(actualPlanningTasks.length*3)*100)}%`);
        
        // Final determination
        console.log('\n🏆 FINAL PHASE 1 STATUS:');
        console.log('─'.repeat(25));
        
        const isExcellent = coveragePercent >= 90 && completeCount >= actualPlanningTasks.length * 0.9;
        const isGood = coveragePercent >= 70 && completeCount >= actualPlanningTasks.length * 0.7;
        const isAcceptable = coveragePercent >= 50 && completeCount >= actualPlanningTasks.length * 0.5;
        
        if (isExcellent) {
          console.log('🎉 EXCELLENT! Phase 1 is comprehensive and complete.');
          console.log('✅ All major planning areas covered');
          console.log('✅ High completion rate achieved');
          console.log('✅ Ready for Phase 2 implementation');
          console.log('🚀 Proceed with confidence!');
        } else if (isGood) {
          console.log('👍 GOOD! Phase 1 has solid coverage with minor gaps.');
          console.log('✅ Most planning areas covered');
          console.log('⚡ Ready for Phase 2 with some attention to gaps');
        } else if (isAcceptable) {
          console.log('⚠️  ACCEPTABLE! Phase 1 has basic coverage.');
          console.log('💡 Consider strengthening before Phase 2');
        } else {
          console.log('❌ NEEDS IMPROVEMENT! Significant Phase 1 gaps.');
          console.log('🔧 Recommend completion before proceeding');
        }
        
        // Show deliverables summary
        console.log('\n📄 DELIVERABLES VERIFICATION:');
        console.log('─'.repeat(30));
        
        const deliverableInfo = actualPlanningTasks.filter(task => task.hasDeliverable);
        if (deliverableInfo.length > 0) {
          console.log(`✅ ${deliverableInfo.length} tasks have deliverable documentation`);
          console.log('🎯 Professional deliverable documents created and available');
        }
        
        return {
          planningTasksFound: actualPlanningTasks.length,
          completionRate: Math.round(completeCount/actualPlanningTasks.length*100),
          coverageRate: coveragePercent,
          documentationRate: Math.round((criteriaMet+commentsProvided+deliverablesPresent)/(actualPlanningTasks.length*3)*100),
          overallQuality: isExcellent ? 'Excellent' : isGood ? 'Good' : isAcceptable ? 'Acceptable' : 'Needs Improvement',
          readyForPhase2: isExcellent || isGood
        };
        
      } else {
        console.log('❌ No Phase 1 planning tasks found in expected location');
        return {
          planningTasksFound: 0,
          overallQuality: 'Missing',
          readyForPhase2: false
        };
      }

    } catch (error) {
      console.error('❌ Error in definitive analysis:');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      return null;
    }
  }
}

// Execute definitive analysis
async function main() {
  const analyzer = new DefinitivePhase1Analysis();
  const result = await analyzer.performDefinitiveAnalysis();
  
  if (result) {
    console.log('\n🎊 ANALYSIS COMPLETE!');
    console.log(`Phase 1 Quality: ${result.overallQuality}`);
    console.log(`Ready for Phase 2: ${result.readyForPhase2 ? 'YES' : 'NO'}`);
  }
}

main();