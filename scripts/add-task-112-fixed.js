#!/usr/bin/env node
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const SMARTSHEET_API_TOKEN = process.env.SMARTSHEET_API_TOKEN;
const SHEET_ID = process.env.SMARTSHEET_SHEET_ID;

async function addTask112Fixed() {
  try {
    console.log('🚀 Adding task 1.12 with correct column names and formats...\n');

    // Get sheet structure
    const sheetResponse = await axios.get(
      `https://api.smartsheet.com/2.0/sheets/${SHEET_ID}`,
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sheet = sheetResponse.data;
    const columns = sheet.columns;

    // Map column names to IDs
    const columnMap = {};
    columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    // Find row 12 (task 1.11)
    const row12 = sheet.rows.find(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      return taskIdCell && taskIdCell.displayValue === '1.11';
    });

    console.log(`📍 Inserting after row 12 (Row ID: ${row12.id})\n`);

    // Create row data with correct column names and formats
    const rowData = {
      rows: [{
        siblingId: row12.id,
        cells: [
          {
            columnId: columnMap['Task ID'],
            value: 1.12
          },
          {
            columnId: columnMap['Task Name'],
            value: 'CI/CD Automation Pipeline Setup'
          },
          {
            columnId: columnMap['SDLC Phase'],  // Was "Phase"
            value: '1 - Planning'
          },
          {
            columnId: columnMap['Category'],
            value: 'DevOps'
          },
          {
            columnId: columnMap['Priority'],
            value: 'Critical'
          },
          {
            columnId: columnMap['Status'],
            value: 'Complete'
          },
          {
            columnId: columnMap['% Complete'],  // Was "Progress (%)"
            value: '100%'  // String format, not number!
          },
          {
            columnId: columnMap['Assigned To'],
            value: 'khusselmann@x4o.co.za'
          },
          {
            columnId: columnMap['Start Date'],
            value: '2026-02-16T08:00:00'
          },
          {
            columnId: columnMap['End Date'],
            value: '2026-02-16T23:59:59'
          },
          {
            columnId: columnMap['Duration'],
            value: '1d'
          },
          {
            columnId: columnMap['Predecessor'],
            value: '1.7'
          },
          {
            columnId: columnMap['Description'],
            value: 'Built comprehensive GitHub Actions CI/CD automation: PR auto-review with TypeScript/build checks, auto-approval on success, auto-merge to staging branch, intelligent labeling, PR description generation, code quality analysis, security scanning, and error detection testing. Includes 40+ automation scripts and 9 documentation files.'
          },
          {
            columnId: columnMap['Acceptance Criteria'],
            value: 'CI/CD pipeline automatically reviews, approves, and merges PRs when all checks pass'
          },
          {
            columnId: columnMap['Criteria Met'],
            value: true
          },
          {
            columnId: columnMap['Deliverable'],
            value: 'GitHub Actions workflows, automation scripts, CI/CD docs'
          },
          {
            columnId: columnMap['Submitted'],
            value: true
          },
          {
            columnId: columnMap['Comments / Notes'],
            value: 'Full automation from PR creation to staging merge with 100% test coverage'
          },
          {
            columnId: columnMap['Risk Level'],
            value: 'Low'
          }
        ]
      }]
    };

    console.log('📤 Adding row with corrected data...\n');

    // Add the row
    const addResponse = await axios.post(
      `https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows`,
      rowData,
      {
        headers: {
          Authorization: `Bearer ${SMARTSHEET_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', JSON.stringify(addResponse.data, null, 2));

    if (addResponse.data.message === 'SUCCESS') {
      console.log('\n✅ Task 1.12 added successfully!');
      console.log('💡 Refresh your Smartsheet to see the change');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

addTask112Fixed();
