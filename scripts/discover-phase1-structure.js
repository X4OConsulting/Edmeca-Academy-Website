#!/usr/bin/env node

/**
 * PHASE 1 COLUMN DISCOVERY & ANALYSIS
 * Discover actual columns and analyze Phase 1 completeness accurately
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

class ActualPhase1Analyzer {
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

  async analyzeActualStructure() {
    console.log('🔍 DISCOVERING ACTUAL SHEET STRUCTURE & ANALYZING PHASE 1');
    console.log('='.repeat(80));
    
    try {
      // Get sheet data
      const sheet = await this.request('GET', `/sheets/${this.sheetId}`);
      
      console.log('📋 ACTUAL COLUMNS FOUND:');
      console.log('─'.repeat(30));
      
      const columnMap = {};
      sheet.columns.forEach((col, index) => {
        columnMap[col.title] = col.id;
        console.log(`${index + 1}. ${col.title} (ID: ${col.id})`);
      });

      console.log(`\n📊 Total Columns: ${sheet.columns.length}`);

      // Find Phase 1 tasks (Task ID between 1.1 and 1.11)
      const taskIdColumn = columnMap['Task ID'];
      const phase1Tasks = sheet.rows.filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn);
        const taskId = taskIdCell?.value;
        return taskId && taskId >= 1.1 && taskId <= 1.11;
      }).sort((a, b) => {
        const aTaskId = a.cells.find(cell => cell.columnId === taskIdColumn)?.value || 0;
        const bTaskId = b.cells.find(cell => cell.columnId === taskIdColumn)?.value || 0;
        return aTaskId - bTaskId;
      });

      console.log(`\n📊 FOUND ${phase1Tasks.length} PHASE 1 TASKS`);
      console.log('='.repeat(80));

      // Analyze each task with actual columns
      let totalCells = 0;
      let populatedCells = 0;
      const analysisResults = [];

      for (const row of phase1Tasks) {
        const taskAnalysis = {
          cells: {},
          populated: 0,
          total: 0,
          issues: []
        };

        console.log(`\n📋 TASK ANALYSIS:`);
        console.log('─'.repeat(20));

        // Analyze each column for this task
        sheet.columns.forEach(column => {
          const cell = row.cells.find(cell => cell.columnId === column.id);
          const value = cell?.value || cell?.displayValue;
          const hasValue = value && value !== '' && value !== null && value !== undefined;
          
          taskAnalysis.cells[column.title] = value;
          taskAnalysis.total++;
          totalCells++;

          if (hasValue) {
            taskAnalysis.populated++;
            populatedCells++;
          }

          // Display the data
          const status = hasValue ? '✅' : '❌';
          const displayValue = hasValue ? 
            (typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value) : 
            'Empty';
          
          console.log(`${status} ${column.title}: ${displayValue}`);

          // Track critical missing items
          if (!hasValue && ['Task ID', 'Task Name', 'Status'].includes(column.title)) {
            taskAnalysis.issues.push(`Critical: Missing ${column.title}`);
          }
        });

        const completeness = Math.round((taskAnalysis.populated / taskAnalysis.total) * 100);
        console.log(`\n📊 Task Completeness: ${completeness}% (${taskAnalysis.populated}/${taskAnalysis.total} fields)`);
        
        if (taskAnalysis.issues.length > 0) {
          console.log(`🚨 Critical Issues: ${taskAnalysis.issues.join(', ')}`);
        }

        analysisResults.push(taskAnalysis);
      }

      // Overall summary
      const overallCompleteness = Math.round((populatedCells / totalCells) * 100);
      
      console.log('\n📊 FINAL PHASE 1 COMPLETENESS REPORT:');
      console.log('='.repeat(50));
      console.log(`📈 Overall Data Population: ${overallCompleteness}% (${populatedCells}/${totalCells} cells)`);
      console.log(`📋 Total Tasks Analyzed: ${phase1Tasks.length}`);
      console.log(`📅 Expected Tasks (1.1-1.11): 11`);
      
      // Check for task sequence
      const actualTaskIds = phase1Tasks.map(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn);
        return taskIdCell?.value;
      }).filter(Boolean).sort((a, b) => a - b);
      
      console.log(`🔢 Found Task IDs: ${actualTaskIds.join(', ')}`);
      
      const missingTasks = [];
      for (let i = 1.1; i <= 1.11; i = Math.round((i + 0.1) * 10) / 10) {
        if (!actualTaskIds.includes(i)) {
          missingTasks.push(i);
        }
      }

      if (missingTasks.length === 0) {
        console.log('✅ Task Sequence: Complete (1.1 - 1.11)');
      } else {
        console.log(`❌ Missing Tasks: ${missingTasks.join(', ')}`);
      }

      // Critical field analysis
      const criticalColumns = ['Task ID', 'Task Name', 'Status'];
      console.log('\n🚨 CRITICAL FIELD VERIFICATION:');
      console.log('─'.repeat(35));
      
      criticalColumns.forEach(colName => {
        if (columnMap[colName]) {
          const emptyCount = phase1Tasks.filter(row => {
            const cell = row.cells.find(cell => cell.columnId === columnMap[colName]);
            const value = cell?.value || cell?.displayValue;
            return !value || value === '' || value === null || value === undefined;
          }).length;
          
          const status = emptyCount === 0 ? '✅' : '❌';
          console.log(`${status} ${colName}: ${phase1Tasks.length - emptyCount}/${phase1Tasks.length} populated`);
        } else {
          console.log(`❌ ${colName}: Column not found`);
        }
      });

      // Recommendations
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('─'.repeat(20));
      
      if (overallCompleteness >= 90) {
        console.log('🎉 EXCELLENT! Phase 1 data is highly complete');
        console.log('✅ Ready to proceed with confidence');
      } else if (overallCompleteness >= 70) {
        console.log('👍 GOOD! Phase 1 has solid data coverage');
        console.log('💡 Consider filling remaining gaps for completeness');
      } else {
        console.log('⚠️  NEEDS IMPROVEMENT! Significant data gaps exist');
        console.log('🔧 Recommend data completion before Phase 2');
      }

      // Show which columns need attention
      console.log('\n📋 COLUMN UTILIZATION SUMMARY:');
      console.log('─'.repeat(35));
      
      const columnStats = {};
      sheet.columns.forEach(column => {
        const populatedCount = phase1Tasks.filter(row => {
          const cell = row.cells.find(cell => cell.columnId === column.id);
          const value = cell?.value || cell?.displayValue;
          return value && value !== '' && value !== null && value !== undefined;
        }).length;
        
        const utilization = Math.round((populatedCount / phase1Tasks.length) * 100);
        columnStats[column.title] = { populated: populatedCount, utilization };
        
        const status = utilization === 100 ? '✅' : utilization >= 80 ? '⚠️ ' : '❌';
        console.log(`${status} ${column.title}: ${utilization}% (${populatedCount}/${phase1Tasks.length})`);
      });

      return {
        overallCompleteness,
        tasksFound: phase1Tasks.length,
        totalColumns: sheet.columns.length,
        columnStats,
        missingTasks
      };

    } catch (error) {
      console.error('❌ Error analyzing sheet structure:');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      return null;
    }
  }
}

// Execute analysis
async function main() {
  const analyzer = new ActualPhase1Analyzer();  
  await analyzer.analyzeActualStructure();
}

main();