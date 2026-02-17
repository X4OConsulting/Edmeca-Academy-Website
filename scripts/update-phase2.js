#!/usr/bin/env node

/**
 * PHASE 2 DESIGN - COMPREHENSIVE UPDATE
 * Updates Phase 2 tasks with complete documentation and adds missing tasks
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

class Phase2Updater {
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

  async updatePhase2() {
    console.log('🎨 PHASE 2: DESIGN - COMPREHENSIVE UPDATE');
    console.log('='.repeat(70));
    
    try {
      // Get sheet data
      const sheet = await this.request('GET', `/sheets/${this.sheetId}`);
      
      // Find column mappings
      const columnMap = {};
      sheet.columns.forEach(col => {
        columnMap[col.title] = col.id;
      });

      // Find existing Phase 2 tasks
      const phase2Tasks = sheet.rows.filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        const phaseCell = row.cells.find(cell => cell.columnId === columnMap['SDLC Phase']);
        const taskId = taskIdCell?.value;
        const phase = phaseCell?.value;
        
        return (taskId && taskId >= 2.0 && taskId <= 2.99) || 
               (phase && (phase.toString().includes('2') || phase.toString().toLowerCase().includes('design')));
      });

      console.log(`📊 Found ${phase2Tasks.length} existing Phase 2 tasks\n`);

      // STEP 1: Update phase header task (Task 2) with documentation
      console.log('📝 STEP 1: Updating Phase 2 header task...');
      console.log('─'.repeat(40));
      
      const headerTask = phase2Tasks.find(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        return taskIdCell?.value === 2;
      });

      if (headerTask) {
        const updateHeader = [{
          id: headerTask.id,
          cells: [
            { columnId: columnMap['Task Name'], value: 'PHASE 2: DESIGN & PROTOTYPING' },
            { columnId: columnMap['Status'], value: 'In Progress' },
            { columnId: columnMap['Category'], value: 'Design' },
            { columnId: columnMap['Priority'], value: 'High' },
            { columnId: columnMap['% Complete'], value: '40%' },
            { columnId: columnMap['Description'], value: 'Design and prototyping phase including UI/UX design, wireframes, mockups, and interactive prototypes for the EDMECA Academy Website.' },
            { columnId: columnMap['Acceptance Criteria'], value: '✅ All wireframes completed and approved\n✅ Design system established\n✅ Responsive designs for all breakpoints\n✅ Interactive prototype created\n✅ Accessibility guidelines followed\n✅ Stakeholder approval received' },
            { columnId: columnMap['Comments / Notes'], value: 'Phase 2 focuses on creating comprehensive design deliverables including design systems, wireframes, mockups, and prototypes. Emphasis on responsive design and accessibility compliance.' },
            { columnId: columnMap['Deliverable'], value: 'Design system, wireframes, mockups, prototypes' }
          ]
        }];

        await this.request('PUT', `/sheets/${this.sheetId}/rows`, updateHeader);
        console.log('✅ Updated Phase 2 header task with complete documentation\n');
      }

      // STEP 2: Add missing tasks (2.7 and 2.8)
      console.log('📝 STEP 2: Adding missing Phase 2 tasks...');
      console.log('─'.repeat(40));

      const missingTasks = [
        {
          id: 2.7,
          name: 'User Flow & Navigation Design',
          category: 'UX',
          description: 'Design comprehensive user flows and navigation patterns for optimal user experience across all pages and features.',
          criteria: '✅ User journey maps created for all key flows\n✅ Navigation patterns defined and documented\n✅ Information architecture established\n✅ User flow diagrams completed\n✅ Navigation testing completed',
          comments: 'Critical for ensuring intuitive user experience. Includes mapping all user journeys, defining clear navigation patterns, and establishing logical information architecture.',
          deliverable: 'User flow diagrams, navigation maps, IA documentation'
        },
        {
          id: 2.8,
          name: 'Interactive Prototype',
          category: 'UX',
          description: 'Create fully interactive prototype demonstrating key user flows, interactions, and transitions for stakeholder review and user testing.',
          criteria: '✅ High-fidelity prototype created in Figma/Adobe XD\n✅ All major user flows implemented\n✅ Interactive elements and transitions included\n✅ Responsive behavior demonstrated\n✅ Stakeholder review completed\n✅ User testing feedback incorporated',
          comments: 'Interactive prototype serves as final design validation before development. Enables early user testing and stakeholder feedback. Should demonstrate all critical user interactions and transitions.',
          deliverable: 'Interactive Figma/Adobe XD prototype with full clickthrough'
        }
      ];

      const newRows = missingTasks.map(task => ({
        toBottom: true, // Will be reordered later if needed
        cells: [
          { columnId: columnMap['Task ID'], value: task.id },
          { columnId: columnMap['Task Name'], value: task.name },
          { columnId: columnMap['SDLC Phase'], value: '2 - Design' },
          { columnId: columnMap['Category'], value: task.category },
          { columnId: columnMap['Priority'], value: 'High' },
          { columnId: columnMap['Status'], value: 'Not Started' },
          { columnId: columnMap['% Complete'], value: '0%' },
          // Note: Assigned To column is CONTACT type - skip for now, can be set manually
          { columnId: columnMap['Start Date'], value: '2026-02-17T08:00:00' },
          { columnId: columnMap['End Date'], value: '2026-02-28T16:59:59' },
          { columnId: columnMap['Duration'], value: '5d' },
          { columnId: columnMap['Risk Level'], value: 'Medium' },
          { columnId: columnMap['Criteria Met'], value: false },
          { columnId: columnMap['Description'], value: task.description },
          { columnId: columnMap['Acceptance Criteria'], value: task.criteria },
          { columnId: columnMap['Comments / Notes'], value: task.comments },
          { columnId: columnMap['Deliverable'], value: task.deliverable },
          { columnId: columnMap['Submitted'], value: false }
        ]
      }));

      await this.request('POST', `/sheets/${this.sheetId}/rows`, newRows);
      console.log(`✅ Added ${missingTasks.length} missing tasks (2.7, 2.8)\n`);

      // STEP 3: Enhance existing task documentation
      console.log('📝 STEP 3: Enhancing task documentation...');
      console.log('─'.repeat(40));

      const enhancedDetails = {
        2.1: {
          criteria: '✅ Brand color palette defined with accessibility ratios\n✅ Typography system established (headings, body, code)\n✅ Spacing and layout grid system defined\n✅ Component design tokens created\n✅ Design system documentation completed\n✅ Style guide created for developers',
          comments: 'Foundation of entire design system. Establishes visual identity, brand guidelines, and reusable design patterns. Critical for maintaining consistency across all pages and components.',
          deliverable: 'Brand guidelines document, design tokens, style guide'
        },
        2.2: {
          criteria: '✅ Desktop wireframe completed (1920x1080)\n✅ Tablet wireframe completed (768x1024)\n✅ Mobile wireframe completed (375x812)\n✅ Hero section design finalized\n✅ Content sections wireframed\n✅ Call-to-action placements defined',
          comments: 'Landing page is the primary entry point for visitors. Wireframes should demonstrate information hierarchy, content flow, and conversion optimization. Focus on compelling hero section and clear value propositions.',
          deliverable: 'Multi-breakpoint wireframes in Figma/Adobe XD'
        },
        2.3: {
          criteria: '✅ Solutions overview page wireframe\n✅ Solution detail page template\n✅ Feature showcase sections designed\n✅ Integration with learning tools visualized\n✅ Responsive layouts for all breakpoints\n✅ Content placeholder text provided',
          comments: 'Solution pages showcase EDMECA\'s educational offerings. Design should emphasize clarity, educational value, and ease of understanding. Include visual elements for engagement frameworks and methodologies.',
          deliverable: 'Solution page wireframes and mockups'
        },
        2.4: {
          criteria: '✅ Dashboard layout designed\n✅ Student progress visualization created\n✅ Course access interface designed\n✅ Resource library layout completed\n✅ User profile section designed\n✅ Navigation patterns established',
          comments: 'User portal is the authenticated user experience. Design should prioritize intuitive navigation, clear progress tracking, and easy access to learning resources. Consider student engagement and motivation in visual design.',
          deliverable: 'Portal dashboard and feature mockups'
        },
        2.5: {
          criteria: '✅ Mobile-first design approach implemented\n✅ Breakpoint designs (320px, 768px, 1024px, 1920px)\n✅ Touch-friendly interactive elements (44px min)\n✅ Responsive navigation patterns defined\n✅ Performance-optimized image specifications\n✅ Cross-device testing completed',
          comments: 'Critical for accessibility and user experience across all devices. Mobile-first approach ensures core functionality on smallest screens. All interactive elements must meet touch target size requirements.',
          deliverable: 'Responsive design specifications and mockups'
        },
        2.6: {
          criteria: '✅ WCAG 2.1 AA compliance checklist\n✅ Color contrast ratios verified (4.5:1 min)\n✅ Focus states designed for all interactive elements\n✅ Screen reader friendly content structure\n✅ Keyboard navigation patterns defined\n✅ Alternative text guidelines created',
          comments: 'Accessibility is not optional - it\'s a core requirement. All designs must meet WCAG 2.1 AA standards. Consider users with visual, motor, and cognitive disabilities in all design decisions.',
          deliverable: 'Accessibility guidelines document and audit checklist'
        }
      };

      const updateRows = [];
      
      for (const [taskId, details] of Object.entries(enhancedDetails)) {
        const task = phase2Tasks.find(row => {
          const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
          return taskIdCell?.value === parseFloat(taskId);
        });

        if (task) {
          updateRows.push({
            id: task.id,
            cells: [
              { columnId: columnMap['Acceptance Criteria'], value: details.criteria },
              { columnId: columnMap['Comments / Notes'], value: details.comments },
              { columnId: columnMap['Deliverable'], value: details.deliverable }
            ]
          });
        }
      }

      if (updateRows.length > 0) {
        await this.request('PUT', `/sheets/${this.sheetId}/rows`, updateRows);
        console.log(`✅ Enhanced documentation for ${updateRows.length} tasks\n`);
      }

      // Final verification
      console.log('📊 FINAL PHASE 2 STATUS:');
      console.log('─'.repeat(30));
      
      const updatedSheet = await this.request('GET', `/sheets/${this.sheetId}`);
      const finalPhase2Tasks = updatedSheet.rows.filter(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        const taskId = taskIdCell?.value;
        return taskId && taskId >= 2.0 && taskId <= 2.99;
      });

      const tasksWithCriteria = finalPhase2Tasks.filter(row => {
        const criteriaCell = row.cells.find(cell => cell.columnId === columnMap['Acceptance Criteria']);
        return criteriaCell?.value;
      }).length;

      const tasksWithComments = finalPhase2Tasks.filter(row => {
        const commentsCell = row.cells.find(cell => cell.columnId === columnMap['Comments / Notes']);
        return commentsCell?.value;
      }).length;

      console.log(`📋 Total Phase 2 Tasks: ${finalPhase2Tasks.length}`);
      console.log(`✅ Tasks with Acceptance Criteria: ${tasksWithCriteria}/${finalPhase2Tasks.length} (${Math.round(tasksWithCriteria/finalPhase2Tasks.length*100)}%)`);
      console.log(`💭 Tasks with Comments: ${tasksWithComments}/${finalPhase2Tasks.length} (${Math.round(tasksWithComments/finalPhase2Tasks.length*100)}%)`);
      console.log('');

      console.log('🎉 PHASE 2 UPDATE COMPLETE!');
      console.log('✅ All tasks documented');
      console.log('✅ Missing tasks added');
      console.log('✅ Ready for design implementation');

      return {
        totalTasks: finalPhase2Tasks.length,
        documentationComplete: tasksWithCriteria === finalPhase2Tasks.length && tasksWithComments === finalPhase2Tasks.length,
        tasksAdded: missingTasks.length,
        tasksUpdated: updateRows.length + 1
      };

    } catch (error) {
      console.error('❌ Error updating Phase 2:');
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.error('Details:', JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }
}

// Execute update
async function main() {
  const updater = new Phase2Updater();
  await updater.updatePhase2();
}

main();