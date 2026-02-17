#!/usr/bin/env node

/**
 * VERIFY PHASE 2 DELIVERABLES IN SMARTSHEET
 * Checks that all deliverables are attached to their tasks
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

async function request(method, endpoint) {
  const response = await axios({
    method,
    url: `${apiBase}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

async function verifyDeliverables() {
  console.log('🔍 VERIFYING PHASE 2 DELIVERABLES IN SMARTSHEET');
  console.log('='.repeat(70));
  
  try {
    const sheet = await request('GET', `/sheets/${sheetId}`);
    
    const columnMap = {};
    sheet.columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    const phase2Tasks = sheet.rows.filter(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      const taskId = taskIdCell?.value;
      return taskId && taskId >= 2.1 && taskId <= 2.8;
    });

    console.log(`\n📋 Found ${phase2Tasks.length} Phase 2 tasks\n`);

    let totalAttachments = 0;

    for (const row of phase2Tasks) {
      const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
      const taskNameCell = row.cells.find(cell => cell.columnId === columnMap['Task Name']);
      const taskId = taskIdCell?.value;
      const taskName = taskNameCell?.value;

      // Get attachments for this row
      const attachments = await request('GET', `/sheets/${sheetId}/rows/${row.id}/attachments`);
      
      const attachmentCount = attachments.data?.length || 0;
      totalAttachments += attachmentCount;

      console.log(`📎 Task ${taskId}: ${taskName}`);
      console.log(`   Attachments: ${attachmentCount}`);
      
      if (attachments.data && attachments.data.length > 0) {
        attachments.data.forEach(att => {
          const sizeKB = (att.sizeInKb || 0).toFixed(2);
          console.log(`   ✅ ${att.name} (${sizeKB} KB)`);
        });
      } else {
        console.log(`   ⚠️  No attachments found`);
      }
      console.log('');

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('='.repeat(70));
    console.log(`📊 TOTAL ATTACHMENTS: ${totalAttachments}`);
    console.log('='.repeat(70));

    if (totalAttachments === 8) {
      console.log('🎉 ALL 8 PHASE 2 DELIVERABLES CONFIRMED IN SMARTSHEET!');
    } else {
      console.log(`⚠️  Expected 8 attachments, found ${totalAttachments}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

verifyDeliverables();
