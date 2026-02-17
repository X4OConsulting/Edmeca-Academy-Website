#!/usr/bin/env node

/**
 * Update Acceptance Criteria and Comments/Notes for Phase 1 tasks
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

class Phase1DetailUpdater {
  constructor() {
    this.apiToken = apiToken;
    this.sheetId = sheetId;
    this.apiBase = 'https://api.smartsheet.com/2.0';
  }

  async request(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.apiBase}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  }

  async getSheet() {
    return await this.request('GET', `/sheets/${this.sheetId}`);
  }

  getTaskDetails() {
    return {
      1.1: {
        acceptanceCriteria: "✅ Technology stack documented and approved\n✅ Frontend framework selected (React 18)\n✅ Backend technology chosen (Supabase)\n✅ Database solution defined (PostgreSQL)\n✅ Hosting platform selected (Netlify)\n✅ Development tools identified\n✅ Performance requirements established",
        comments: "Selected modern stack: React 18 + TypeScript + Vite frontend, Supabase PostgreSQL backend, Netlify deployment. Migrated from Express.js for better scalability and modern architecture."
      },
      1.2: {
        acceptanceCriteria: "✅ Database schema designed and reviewed\n✅ Entity relationships defined\n✅ Data models documented\n✅ Migration strategy planned\n✅ Backup and recovery procedures defined\n✅ Performance optimization considered\n✅ Security measures integrated",
        comments: "Supabase PostgreSQL database with Row Level Security (RLS) implemented. User authentication, profiles, and content tables designed with proper relationships and constraints."
      },
      1.3: {
        acceptanceCriteria: "✅ Authentication method selected (OAuth + JWT)\n✅ User registration/login flows defined\n✅ Password policies established\n✅ Session management strategy planned\n✅ Security protocols documented\n✅ Multi-factor authentication considered\n✅ Social login integration planned",
        comments: "Implemented Supabase Auth with Google/GitHub OAuth providers. JWT tokens for session management, secure password policies, and protected route system established."
      },
      1.4: {
        acceptanceCriteria: "✅ Site map and user flows created\n✅ Routing strategy defined (client-side)\n✅ Navigation structure planned\n✅ URL structure standardized\n✅ SEO considerations documented\n✅ Mobile responsiveness planned\n✅ Performance optimization strategies defined",
        comments: "Wouter routing library implemented for client-side routing. Clean URL structure with protected routes for authenticated areas. Mobile-first responsive design approach."
      },
      1.5: {
        acceptanceCriteria: "✅ UI component library selected (shadcn/ui)\n✅ Design system documented\n✅ Component architecture planned\n✅ Styling approach defined (Tailwind CSS)\n✅ Accessibility standards established\n✅ Theme system planned\n✅ Responsive design principles documented",
        comments: "shadcn/ui component library with Tailwind CSS for consistent, accessible design. Dark/light theme toggle implemented. Modular component architecture for reusability."
      },
      1.6: {
        acceptanceCriteria: "✅ Content structure defined\n✅ Content management approach planned\n✅ Editorial workflow established\n✅ Content versioning strategy defined\n✅ Media management planned\n✅ SEO content guidelines created\n✅ Content security measures planned",
        comments: "Structured content management with clear information architecture. Marketing pages, user portal sections, and educational content areas properly organized and secured."
      },
      1.7: {
        acceptanceCriteria: "✅ Git branching strategy defined (main/staging/dev)\n✅ CI/CD pipeline planned (GitHub Actions)\n✅ Code quality gates established\n✅ Automated testing strategy planned\n✅ Deployment procedures documented\n✅ Environment management defined\n✅ Rollback procedures established",
        comments: "Three-branch workflow (main/staging/development) with GitHub Actions CI/CD. Automated testing, linting, and deployment to Netlify. Professional development workflow established."
      },
      1.8: {
        acceptanceCriteria: "✅ Project management tool selected (Smartsheet)\n✅ Task tracking system implemented\n✅ Progress monitoring established\n✅ Team collaboration tools configured\n✅ Reporting mechanisms defined\n✅ Integration with development tools planned\n✅ Documentation standards established",
        comments: "Comprehensive Smartsheet project tracker with real-time API integration. Automated sync between development work and project management. SDLC phases properly structured."
      },
      1.9: {
        acceptanceCriteria: "✅ API integration architecture defined\n✅ Real-time sync mechanisms implemented\n✅ Authentication tokens configured\n✅ Error handling and retry logic established\n✅ Data synchronization tested\n✅ Performance monitoring implemented\n✅ Security measures verified",
        comments: "Successfully implemented real-time Smartsheet API integration with file watchers, git hooks, and CLI tools. Automatic task updates when code changes occur. Full CRUD operations working."
      },
      1.10: {
        acceptanceCriteria: "✅ Performance benchmarks defined\n✅ Optimization strategies documented\n✅ Monitoring tools selected\n✅ Caching strategy planned\n✅ Bundle optimization configured\n✅ Database query optimization planned\n✅ CDN strategy established",
        comments: "Vite build optimization with code splitting and lazy loading. Supabase query optimization and caching strategies. Performance monitoring and alerting systems planned."
      },
      1.11: {
        acceptanceCriteria: "✅ Security audit framework established\n✅ Data protection measures defined\n✅ Compliance requirements documented\n✅ Authentication security verified\n✅ Input validation standards established\n✅ HTTPS and SSL configured\n✅ Security testing procedures planned",
        comments: "Comprehensive security framework with Supabase Row Level Security (RLS), input validation, HTTPS everywhere, secure authentication flows, and regular security audits planned."
      },
      1.12: {
        acceptanceCriteria: "✅ Testing strategy comprehensive (unit/integration/E2E)\n✅ Quality gates defined for CI/CD pipeline\n✅ Code coverage targets established (80%+)\n✅ Testing tools and frameworks selected\n✅ Automated testing workflows configured\n✅ Bug tracking and resolution process defined\n✅ User acceptance testing criteria established",
        comments: "Multi-layer testing approach with Jest for unit tests, React Testing Library for component tests, and E2E testing planned. Quality gates integrated into CI/CD pipeline with automated reporting."
      },
      1.13: {
        acceptanceCriteria: "✅ Deployment pipeline automated (GitHub Actions)\n✅ Environment promotion strategy defined\n✅ Infrastructure as Code implemented\n✅ Monitoring and alerting configured\n✅ Backup and disaster recovery planned\n✅ Performance monitoring established\n✅ Rollback procedures automated",
        comments: "Fully automated CI/CD pipeline with GitHub Actions deploying to Netlify. Environment-specific configurations, automated testing gates, and monitoring dashboards implemented."
      }
    };
  }

  async updateTaskDetails() {
    console.log('📝 Updating Acceptance Criteria and Comments for Phase 1 tasks...');
    
    const sheet = await this.getSheet();
    
    // Get column mappings
    const columnMap = {};
    sheet.columns.forEach(col => {
      const title = col.title.toLowerCase();
      if (title.includes('task id')) columnMap.taskId = col.id;
      if (title.includes('acceptance criteria')) columnMap.acceptanceCriteria = col.id;
      if (title.includes('comments') || title.includes('notes')) columnMap.comments = col.id;
    });

    console.log('📋 Found columns:');
    console.log(`   Task ID: ${columnMap.taskId || 'Not found'}`);
    console.log(`   Acceptance Criteria: ${columnMap.acceptanceCriteria || 'Not found'}`);
    console.log(`   Comments/Notes: ${columnMap.comments || 'Not found'}`);

    if (!columnMap.acceptanceCriteria && !columnMap.comments) {
      console.error('❌ Neither Acceptance Criteria nor Comments/Notes columns found');
      return;
    }

    const taskDetails = this.getTaskDetails();
    const updates = [];

    // Find all Phase 1 tasks and prepare updates
    for (const [taskIdStr, details] of Object.entries(taskDetails)) {
      const taskId = parseFloat(taskIdStr);
      
      const taskRow = sheet.rows.find(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap.taskId);
        return taskIdCell && taskIdCell.value === taskId;
      });

      if (taskRow) {
        const cells = [];
        
        if (columnMap.acceptanceCriteria) {
          cells.push({
            columnId: columnMap.acceptanceCriteria,
            value: details.acceptanceCriteria
          });
        }
        
        if (columnMap.comments) {
          cells.push({
            columnId: columnMap.comments,
            value: details.comments
          });
        }

        if (cells.length > 0) {
          updates.push({
            id: taskRow.id,
            cells: cells
          });
          
          console.log(`✅ Prepared update for Task ${taskIdStr}`);
        }
      } else {
        console.log(`⚠️  Task ${taskIdStr} not found in sheet`);
      }
    }

    // Execute updates in batches
    if (updates.length > 0) {
      console.log(`\n📤 Updating ${updates.length} tasks...`);
      
      // Update in smaller batches to avoid API limits
      const batchSize = 5;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        try {
          await this.request('PUT', `/sheets/${this.sheetId}/rows`, batch);
          console.log(`✅ Updated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)}`);
          
          // Small delay between batches to respect API rate limits
          if (i + batchSize < updates.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Error updating batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Phase 1 task details update completed!');
  }

  async showSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 PHASE 1 DETAILED SUMMARY');
    console.log('='.repeat(80));

    const sheet = await this.getSheet();
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    const taskNameColumn = sheet.columns.find(col => col.title === 'Task Name');
    const acceptanceCriteriaColumn = sheet.columns.find(col => col.title.toLowerCase().includes('acceptance criteria'));
    const commentsColumn = sheet.columns.find(col => col.title.toLowerCase().includes('comments') || col.title.toLowerCase().includes('notes'));

    // Get all Phase 1 tasks
    const phase1Tasks = sheet.rows
      .filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
        return taskIdCell && taskIdCell.value && taskIdCell.value.toString().startsWith('1.');
      })
      .map(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
        const taskNameCell = row.cells.find(cell => cell.columnId === taskNameColumn.id);
        const acceptanceCriteriaCell = acceptanceCriteriaColumn ? 
          row.cells.find(cell => cell.columnId === acceptanceCriteriaColumn.id) : null;
        const commentsCell = commentsColumn ?
          row.cells.find(cell => cell.columnId === commentsColumn.id) : null;
        
        return {
          id: taskIdCell.value,
          name: taskNameCell?.value || 'No name',
          hasAcceptanceCriteria: !!(acceptanceCriteriaCell?.value),
          hasComments: !!(commentsCell?.value),
          rowNumber: row.rowNumber
        };
      })
      .sort((a, b) => a.id - b.id);

    phase1Tasks.forEach(task => {
      const criteriaIcon = task.hasAcceptanceCriteria ? '✅' : '❌';
      const commentsIcon = task.hasComments ? '✅' : '❌';
      console.log(`   ${task.id}: ${task.name}`);
      console.log(`      Acceptance Criteria: ${criteriaIcon} | Comments: ${commentsIcon}`);
    });

    const tasksWithCriteria = phase1Tasks.filter(t => t.hasAcceptanceCriteria).length;
    const tasksWithComments = phase1Tasks.filter(t => t.hasComments).length;

    console.log(`\n📊 Summary:`);
    console.log(`   Total Phase 1 tasks: ${phase1Tasks.length}`);
    console.log(`   Tasks with Acceptance Criteria: ${tasksWithCriteria}/${phase1Tasks.length}`);
    console.log(`   Tasks with Comments/Notes: ${tasksWithComments}/${phase1Tasks.length}`);
    
    if (acceptanceCriteriaColumn && commentsColumn) {
      const completeness = Math.round((tasksWithCriteria + tasksWithComments) / (phase1Tasks.length * 2) * 100);
      console.log(`   Overall Detail Completeness: ${completeness}%`);
    }
  }
}

// Execute the update
async function main() {
  const updater = new Phase1DetailUpdater();
  
  try {
    await updater.updateTaskDetails();
    await updater.showSummary();
  } catch (error) {
    console.error('❌ Error updating task details:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main();