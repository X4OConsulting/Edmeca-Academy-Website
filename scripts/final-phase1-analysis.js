#!/usr/bin/env node

/**
 * FINAL PHASE 1 COMPLETENESS ANALYSIS
 * Comprehensive verification of all columns and data accuracy
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

class Phase1CompletionAnalyzer {
  constructor() {
    this.apiToken = apiToken;
    this.sheetId = sheetId;
    this.requiredColumns = [
      'Task ID',
      'Task Name', 
      'Phase',
      'Status',
      'Priority',
      'Assigned To',
      'Due Date',
      'Progress %',
      'Acceptance Criteria',
      'Comments/Notes',
      'Dependencies',
      'Deliverable'
    ];
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

  async analyzePhase1Completeness() {
    console.log('🔍 FINAL PHASE 1 COMPLETENESS ANALYSIS');
    console.log('='.repeat(80));
    
    try {
      // Get sheet data
      const sheet = await this.request('GET', `/sheets/${this.sheetId}`);
      
      // Find column mappings
      const columnMap = {};
      sheet.columns.forEach(col => {
        columnMap[col.title] = col.id;
      });

      console.log('📋 COLUMN VERIFICATION:');
      console.log('─'.repeat(30));
      
      let missingColumns = [];
      this.requiredColumns.forEach(colName => {
        if (columnMap[colName]) {
          console.log(`✅ ${colName}`);
        } else {
          console.log(`❌ ${colName} - MISSING`);
          missingColumns.push(colName);
        }
      });

      if (missingColumns.length > 0) {
        console.log(`\n⚠️  MISSING COLUMNS: ${missingColumns.join(', ')}`);
        return;
      }

      // Find Phase 1 tasks (Task ID between 1.1 and 1.11)
      const phase1Tasks = sheet.rows.filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        const taskId = taskIdCell?.value;
        return taskId && taskId >= 1.1 && taskId <= 1.11;
      }).sort((a, b) => {
        const aTaskId = a.cells.find(cell => cell.columnId === columnMap['Task ID'])?.value || 0;
        const bTaskId = b.cells.find(cell => cell.columnId === columnMap['Task ID'])?.value || 0;
        return aTaskId - bTaskId;
      });

      console.log(`\n📊 FOUND ${phase1Tasks.length} PHASE 1 TASKS`);
      console.log('='.repeat(80));

      // Analyze each task for completeness
      let completeScore = 0;
      let totalPossible = phase1Tasks.length * this.requiredColumns.length;
      let issueCount = 0;
      const detailedResults = [];

      for (const row of phase1Tasks) {
        const taskData = {};
        let taskCompleteness = 0;
        const taskIssues = [];

        // Extract all column values
        this.requiredColumns.forEach(colName => {
          const cell = row.cells.find(cell => cell.columnId === columnMap[colName]);
          const value = cell?.value || cell?.displayValue;
          taskData[colName] = value;

          // Check completeness
          if (value && value !== '' && value !== null && value !== undefined) {
            taskCompleteness++;
            completeScore++;
          } else {
            taskIssues.push(`Missing ${colName}`);
            issueCount++;
          }
        });

        const taskId = taskData['Task ID'] || 'N/A';
        const taskName = (taskData['Task Name'] || 'Unknown').substring(0, 40);
        const completenessPercent = Math.round((taskCompleteness / this.requiredColumns.length) * 100);

        console.log(`${completenessPercent === 100 ? '✅' : '⚠️ '} Task ${taskId}: ${taskName}... (${completenessPercent}%)`);
        
        // Show detailed data for verification
        console.log(`   📋 Status: ${taskData['Status'] || 'Missing'}`);
        console.log(`   🎯 Priority: ${taskData['Priority'] || 'Missing'} | Progress: ${taskData['Progress %'] || 'Missing'}%`);
        console.log(`   👤 Assigned: ${taskData['Assigned To'] || 'Missing'} | Due: ${taskData['Due Date'] || 'Missing'}`);
        console.log(`   ✅ Criteria: ${taskData['Acceptance Criteria'] ? 'Present' : 'Missing'}`);
        console.log(`   💭 Comments: ${taskData['Comments/Notes'] ? 'Present' : 'Missing'}`);
        console.log(`   📄 Deliverable: ${taskData['Deliverable'] || 'Missing'}`);
        console.log(`   🔗 Dependencies: ${taskData['Dependencies'] || 'None'}`);

        if (taskIssues.length > 0) {
          console.log(`   ❌ Issues: ${taskIssues.join(', ')}`);
        }
        console.log('');

        detailedResults.push({
          taskId,
          taskName,
          completeness: completenessPercent,
          issues: taskIssues,
          data: taskData
        });
      }

      // Overall analysis
      const overallCompleteness = Math.round((completeScore / totalPossible) * 100);
      
      console.log('📊 FINAL COMPLETENESS ANALYSIS:');
      console.log('='.repeat(50));
      console.log(`📈 Overall Completeness: ${overallCompleteness}% (${completeScore}/${totalPossible} fields)`);
      console.log(`📋 Tasks Analyzed: ${phase1Tasks.length}`);
      console.log(`✅ Complete Tasks: ${detailedResults.filter(t => t.completeness === 100).length}`);
      console.log(`⚠️  Partial Tasks: ${detailedResults.filter(t => t.completeness < 100 && t.completeness > 0).length}`);
      console.log(`❌ Empty Tasks: ${detailedResults.filter(t => t.completeness === 0).length}`);
      console.log(`🔧 Total Issues Found: ${issueCount}`);

      // Data quality verification
      console.log('\n🔍 DATA QUALITY VERIFICATION:');
      console.log('─'.repeat(35));
      
      // Check for expected task sequence
      const taskIds = detailedResults.map(t => t.taskId).filter(id => !isNaN(id));
      const expectedIds = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11];
      const missingIds = expectedIds.filter(id => !taskIds.includes(id));
      const extraIds = taskIds.filter(id => !expectedIds.includes(id));

      if (missingIds.length === 0 && extraIds.length === 0) {
        console.log('✅ Task ID Sequence: Perfect (1.1 - 1.11)');
      } else {
        console.log('❌ Task ID Issues:');
        if (missingIds.length > 0) console.log(`   Missing IDs: ${missingIds.join(', ')}`);
        if (extraIds.length > 0) console.log(`   Extra IDs: ${extraIds.join(', ')}`);
      }

      // Check status consistency
      const statuses = detailedResults.map(t => t.data['Status']).filter(Boolean);
      const uniqueStatuses = [...new Set(statuses)];
      console.log(`📊 Status Values: ${uniqueStatuses.join(', ')}`);

      // Check progress consistency
      const progresses = detailedResults.map(t => t.data['Progress %']).filter(p => p !== null && p !== undefined);
      const avgProgress = progresses.length > 0 ? Math.round(progresses.reduce((a,b) => a+b, 0) / progresses.length) : 0;
      console.log(`📈 Average Progress: ${avgProgress}%`);

      // Phase alignment check
      const phases = detailedResults.map(t => t.data['Phase']).filter(Boolean);
      const phase1Count = phases.filter(p => p && p.toString().toLowerCase().includes('phase 1')).length;
      console.log(`🎯 Phase 1 Alignment: ${phase1Count}/${phase1Tasks.length} tasks properly labeled`);

      // Priority distribution
      const priorities = detailedResults.map(t => t.data['Priority']).filter(Boolean);
      const priorityCount = {};
      priorities.forEach(p => priorityCount[p] = (priorityCount[p] || 0) + 1);
      console.log(`⚡ Priority Distribution:`, priorityCount);

      // Final recommendation
      console.log('\n🎯 FINAL ASSESSMENT:');
      console.log('='.repeat(25));
      
      if (overallCompleteness >= 95) {
        console.log('🎉 EXCELLENT! Phase 1 is comprehensively complete.');
        console.log('✅ All critical data points are populated');
        console.log('✅ Task sequence is proper');
        console.log('✅ Ready for Phase 2 implementation');
      } else if (overallCompleteness >= 80) {
        console.log('👍 GOOD! Phase 1 is mostly complete with minor gaps.');
        console.log('⚠️  Some non-critical fields may need attention');
      } else {
        console.log('⚠️  NEEDS ATTENTION! Significant completeness issues found.');
        console.log('🔧 Recommend addressing missing data before proceeding');
      }

      // List any critical missing items
      const criticalIssues = detailedResults.filter(t => 
        t.issues.includes('Missing Task Name') || 
        t.issues.includes('Missing Status') ||
        t.issues.includes('Missing Task ID')
      );

      if (criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
        criticalIssues.forEach(issue => {
          console.log(`❌ Task ${issue.taskId}: ${issue.issues.join(', ')}`);
        });
      }

      return {
        overallCompleteness,
        taskResults: detailedResults,
        issues: issueCount,
        recommendations: overallCompleteness >= 95 ? 'Ready to proceed' : 'Address gaps before Phase 2'
      };

    } catch (error) {
      console.error('❌ Error analyzing Phase 1 completeness:');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      return null;
    }
  }
}

// Execute analysis
async function main() {
  const analyzer = new Phase1CompletionAnalyzer();
  await analyzer.analyzePhase1Completeness();
}

main();