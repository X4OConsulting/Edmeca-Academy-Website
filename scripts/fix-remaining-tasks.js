#!/usr/bin/env node

/**
 * Fix remaining task issues and complete the details update
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function fixRemainingTasks() {
  console.log('🔧 Fixing remaining Phase 1 task issues...');

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
    
    // Get column mappings
    const columnMap = {};
    sheet.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('task id')) columnMap.taskId = col.id;
      if (title.includes('task name')) columnMap.taskName = col.id;
      if (title.includes('acceptance criteria')) columnMap.acceptanceCriteria = col.id;
      if (title.includes('comments') || title.includes('notes')) columnMap.comments = col.id;
    });

    const updates = [];

    // Find the Performance & Optimization Strategy task (wrongly numbered as 1.1)
    const perfTask = sheet.rows.find(row => {
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap.taskName);
      return taskNameCell && taskNameCell.value && taskNameCell.value.includes('Performance & Optimization');
    });

    if (perfTask) {
      updates.push({
        id: perfTask.id,
        cells: [
          {
            columnId: columnMap.taskId,
            value: 1.10  // Fix to correct number
          },
          {
            columnId: columnMap.acceptanceCriteria,
            value: "✅ Performance benchmarks defined\n✅ Optimization strategies documented\n✅ Monitoring tools selected\n✅ Caching strategy planned\n✅ Bundle optimization configured\n✅ Database query optimization planned\n✅ CDN strategy established"
          },
          {
            columnId: columnMap.comments,
            value: "Vite build optimization with code splitting and lazy loading. Supabase query optimization and caching strategies. Performance monitoring and alerting systems planned."
          }
        ]
      });
      console.log('✅ Prepared fix for Performance & Optimization Strategy task');
    }

    // Find Task 1.12 and 1.13 (looking for QA and DevOps tasks)
    const qaTask = sheet.rows.find(row => {
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap.taskName);
      return taskNameCell && taskNameCell.value && taskNameCell.value.includes('Quality Assurance');
    });

    if (qaTask) {
      updates.push({
        id: qaTask.id,
        cells: [
          {
            columnId: columnMap.acceptanceCriteria,
            value: "✅ Testing strategy comprehensive (unit/integration/E2E)\n✅ Quality gates defined for CI/CD pipeline\n✅ Code coverage targets established (80%+)\n✅ Testing tools and frameworks selected\n✅ Automated testing workflows configured\n✅ Bug tracking and resolution process defined\n✅ User acceptance testing criteria established"
          },
          {
            columnId: columnMap.comments,
            value: "Multi-layer testing approach with Jest for unit tests, React Testing Library for component tests, and E2E testing planned. Quality gates integrated into CI/CD pipeline with automated reporting."
          }
        ]
      });
      console.log('✅ Prepared update for Quality Assurance & Testing Strategy');
    }

    const devopsTask = sheet.rows.find(row => {
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap.taskName);
      return taskNameCell && taskNameCell.value && taskNameCell.value.includes('Deployment & DevOps');
    });

    if (devopsTask) {
      updates.push({
        id: devopsTask.id,
        cells: [
          {
            columnId: columnMap.acceptanceCriteria,
            value: "✅ Deployment pipeline automated (GitHub Actions)\n✅ Environment promotion strategy defined\n✅ Infrastructure as Code implemented\n✅ Monitoring and alerting configured\n✅ Backup and disaster recovery planned\n✅ Performance monitoring established\n✅ Rollback procedures automated"
          },
          {
            columnId: columnMap.comments,
            value: "Fully automated CI/CD pipeline with GitHub Actions deploying to Netlify. Environment-specific configurations, automated testing gates, and monitoring dashboards implemented."
          }
        ]
      });
      console.log('✅ Prepared update for Deployment & DevOps Pipeline Planning');
    }

    // Execute updates
    if (updates.length > 0) {
      console.log(`\n📤 Applying ${updates.length} fixes...`);
      
      await axios.put(
        `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ All fixes applied successfully!');
    }

    // Show final Phase 1 status
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL PHASE 1 STATUS WITH DETAILS');
    console.log('='.repeat(80));

    // Re-fetch to get updated data
    const updatedSheet = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${sheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const taskIdColumn = updatedSheet.data.columns.find(col => col.title === 'Task ID');
    const taskNameColumn = updatedSheet.data.columns.find(col => col.title === 'Task Name');
    const statusColumn = updatedSheet.data.columns.find(col => col.title === 'Status');
    const acceptanceCriteriaColumn = updatedSheet.data.columns.find(col => col.title.toLowerCase().includes('acceptance criteria'));
    const commentsColumn = updatedSheet.data.columns.find(col => col.title.toLowerCase().includes('comments'));

    const phase1Tasks = updatedSheet.data.rows
      .filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
        return taskIdCell && taskIdCell.value && taskIdCell.value.toString().startsWith('1.');
      })
      .map(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
        const taskNameCell = row.cells.find(cell => cell.columnId === taskNameColumn.id);
        const statusCell = row.cells.find(cell => cell.columnId === statusColumn.id);
        const acceptanceCriteriaCell = acceptanceCriteriaColumn ? 
          row.cells.find(cell => cell.columnId === acceptanceCriteriaColumn.id) : null;
        const commentsCell = commentsColumn ?
          row.cells.find(cell => cell.columnId === commentsColumn.id) : null;
        
        return {
          id: taskIdCell.value,
          name: taskNameCell?.value || 'No name',
          status: statusCell?.value || 'No status',
          hasAcceptanceCriteria: !!(acceptanceCriteriaCell?.value),
          hasComments: !!(commentsCell?.value)
        };
      })
      .sort((a, b) => a.id - b.id);

    phase1Tasks.forEach(task => {
      const statusIcon = task.status === 'Complete' ? '✅' : '🔄';
      const criteriaIcon = task.hasAcceptanceCriteria ? '✅' : '❌';
      const commentsIcon = task.hasComments ? '✅' : '❌';
      
      console.log(`   ${statusIcon} ${task.id}: ${task.name}`);
      console.log(`      Status: ${task.status} | Criteria: ${criteriaIcon} | Notes: ${commentsIcon}`);
    });

    const completeTasks = phase1Tasks.filter(t => t.status === 'Complete').length;
    const tasksWithCriteria = phase1Tasks.filter(t => t.hasAcceptanceCriteria).length;
    const tasksWithComments = phase1Tasks.filter(t => t.hasComments).length;

    console.log(`\n📊 PHASE 1 FINAL METRICS:`);
    console.log(`   📋 Total tasks: ${phase1Tasks.length}`);
    console.log(`   ✅ Complete: ${completeTasks}/${phase1Tasks.length} (${Math.round(completeTasks/phase1Tasks.length*100)}%)`);
    console.log(`   📝 With Acceptance Criteria: ${tasksWithCriteria}/${phase1Tasks.length} (${Math.round(tasksWithCriteria/phase1Tasks.length*100)}%)`);
    console.log(`   💬 With Comments/Notes: ${tasksWithComments}/${phase1Tasks.length} (${Math.round(tasksWithComments/phase1Tasks.length*100)}%)`);
    
    const overallCompleteness = Math.round(((completeTasks + tasksWithCriteria + tasksWithComments) / (phase1Tasks.length * 3)) * 100);
    console.log(`   🎯 Overall Phase 1 Detail Completeness: ${overallCompleteness}%`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixRemainingTasks();