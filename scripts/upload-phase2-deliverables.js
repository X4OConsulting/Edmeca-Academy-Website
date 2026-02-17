#!/usr/bin/env node

/**
 * UPLOAD PHASE 2 DELIVERABLES TO SMARTSHEET
 * Attaches DOCX deliverables to their corresponding Smartsheet tasks
 */

import axios from 'axios';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

const deliverablesDir = path.join(process.cwd(), 'deliverables', 'Phase-2-Design');

// Mapping of deliverables to task IDs
const deliverableMapping = {
  2.1: 'Design-System-Brand-Guidelines.docx',
  2.2: 'Landing-Page-Wireframes.docx',
  2.3: 'Portal-Dashboard-Design.docx',
  2.4: 'Learning-Tools-Interface-Design.docx',
  2.5: 'Mobile-Responsive-Design.docx',
  2.6: 'Accessibility-Design-Guidelines.docx',
  2.7: 'User-Flow-Navigation-Design.docx',
  2.8: 'Interactive-Prototype.docx'
};

async function request(method, endpoint, data = null) {
  const config = {
    method,
    url: `${apiBase}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) config.data = data;
  const response = await axios(config);
  return response.data;
}

async function uploadAttachment(rowId, filePath, fileName) {
  const formData = new FormData();
  const fileStream = fs.createReadStream(filePath);
  formData.append('file', fileStream, fileName);

  try {
    const response = await axios.post(
      `${apiBase}/sheets/${sheetId}/rows/${rowId}/attachments`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      return { message: 'File already attached (skipped)' };
    }
    throw error;
  }
}

async function uploadDeliverablestoSmartsheet() {
  console.log('📤 UPLOADING PHASE 2 DELIVERABLES TO SMARTSHEET');
  console.log('='.repeat(70));
  console.log(`📁 Source: ${deliverablesDir}`);
  console.log('='.repeat(70));
  console.log('');

  try {
    // Get sheet data
    console.log('📊 Fetching Smartsheet data...');
    const sheet = await request('GET', `/sheets/${sheetId}`);
    
    // Find column mappings
    const columnMap = {};
    sheet.columns.forEach(col => {
      columnMap[col.title] = col.id;
    });

    let uploadCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Upload each deliverable
    for (const [taskId, fileName] of Object.entries(deliverableMapping)) {
      console.log(`\n📄 Task ${taskId}: ${fileName}`);
      console.log('─'.repeat(60));

      // Find the row for this task
      const taskRow = sheet.rows.find(row => {
        const taskIdCell = row.cells.find(cell => cell.columnId === columnMap['Task ID']);
        return taskIdCell?.value === parseFloat(taskId);
      });

      if (!taskRow) {
        console.log(`❌ Task ${taskId} not found in Smartsheet`);
        errorCount++;
        continue;
      }

      const taskNameCell = taskRow.cells.find(cell => cell.columnId === columnMap['Task Name']);
      const taskName = taskNameCell?.value || 'Unknown Task';
      console.log(`   Task Name: ${taskName}`);
      console.log(`   Row ID: ${taskRow.id}`);

      // Check if file exists
      const filePath = path.join(deliverablesDir, fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found: ${fileName}`);
        errorCount++;
        continue;
      }

      const fileSizeKB = (fs.statSync(filePath).size / 1024).toFixed(2);
      console.log(`   File Size: ${fileSizeKB} KB`);

      // Upload attachment
      console.log(`   📤 Uploading...`);
      try {
        const result = await uploadAttachment(taskRow.id, filePath, fileName);
        
        if (result.message?.includes('already exists')) {
          console.log(`   ⏭️  Already attached (skipped)`);
          skipCount++;
        } else {
          console.log(`   ✅ Uploaded successfully!`);
          uploadCount++;
        }
      } catch (error) {
        console.log(`   ❌ Upload failed: ${error.message}`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 UPLOAD SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successfully Uploaded: ${uploadCount}`);
    console.log(`⏭️  Already Attached: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total Deliverables: ${Object.keys(deliverableMapping).length}`);
    
    if (uploadCount + skipCount === Object.keys(deliverableMapping).length) {
      console.log('\n🎉 ALL PHASE 2 DELIVERABLES ARE NOW IN SMARTSHEET!');
    }

    console.log('\n💡 TIP: Open Smartsheet to view attachments on each task row');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

uploadDeliverablestoSmartsheet();
