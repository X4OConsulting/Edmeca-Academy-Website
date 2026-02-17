#!/usr/bin/env node

/**
 * Verify Deliverables Upload Status
 * Checks Smartsheet to confirm all deliverable files are properly attached
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;
const apiBase = 'https://api.smartsheet.com/2.0';

async function verifyDeliverableUploads() {
  console.log('🔍 VERIFYING DELIVERABLE UPLOAD STATUS');
  console.log('='.repeat(60));
  
  try {
    // Get sheet with attachments
    const response = await axios.get(`${apiBase}/sheets/${sheetId}?include=attachments`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    
    const sheet = response.data;
    
    // Find Phase 1 tasks (rows 2-12)
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    const taskNameColumn = sheet.columns.find(col => col.title === 'Task Name');
    const phase1Tasks = sheet.rows.filter(row => {
      const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
      return taskIdCell && taskIdCell.value >= 1.1 && taskIdCell.value <= 1.11;
    }).sort((a, b) => {
      const aTaskId = a.cells.find(cell => cell.columnId === taskIdColumn.id)?.value || 0;
      const bTaskId = b.cells.find(cell => cell.columnId === taskIdColumn.id)?.value || 0;
      return aTaskId - bTaskId;
    });

    console.log('📋 PHASE 1 DELIVERABLE STATUS:');
    console.log('─'.repeat(60));
    
    let totalTasks = 0;
    let tasksWithDeliverables = 0;
    let totalDeliverables = 0;
    
    for (const row of phase1Tasks) {
      totalTasks++;
      const taskIdCell = row.cells.find(cell => cell.columnId === taskIdColumn.id);
      const taskNameCell = row.cells.find(cell => cell.columnId === taskNameColumn.id);
      
      const taskId = taskIdCell?.value || 'N/A';
      const taskName = taskNameCell?.value || 'Unknown Task';
      
      // Check for attachments on this row
      const attachments = sheet.attachments?.filter(att => att.parentId === row.id) || [];
      const docxAttachments = attachments.filter(att => att.name?.endsWith('.docx'));
      
      totalDeliverables += docxAttachments.length;
      if (docxAttachments.length > 0) tasksWithDeliverables++;
      
      const status = docxAttachments.length > 0 ? '✅' : '❌';
      const deliverableInfo = docxAttachments.length > 0 
        ? `(${docxAttachments[0].name})` 
        : '(No deliverable)';
      
      console.log(`${status} Task ${taskId}: ${taskName.substring(0, 40)}... ${deliverableInfo}`);
    }
    
    console.log('─'.repeat(60));
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Phase 1 Tasks: ${totalTasks}`);
    console.log(`   Tasks with Deliverables: ${tasksWithDeliverables}`);
    console.log(`   Success Rate: ${Math.round((tasksWithDeliverables/totalTasks)*100)}%`);
    console.log(`   Total DOCX Files Uploaded: ${totalDeliverables}`);
    
    // Check local deliverables directory
    const deliverableDir = path.join(process.cwd(), 'deliverables');
    const localFiles = fs.readdirSync(deliverableDir).filter(f => f.endsWith('.docx'));
    
    console.log(`\n📁 LOCAL FILES CREATED: ${localFiles.length}`);
    console.log('─'.repeat(30));
    localFiles.forEach(file => {
      const size = (fs.statSync(path.join(deliverableDir, file)).size / 1024).toFixed(1);
      console.log(`   📄 ${file} (${size} KB)`);
    });
    
    if (tasksWithDeliverables === totalTasks) {
      console.log('\n🎉 SUCCESS! All Phase 1 tasks have professional deliverable documents!');
      console.log('🚀 Ready to proceed with Phase 2: Implementation!');
    } else {
      console.log('\n⚠️  Some tasks are missing deliverables. Upload may have been partial.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying uploads:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
  }
}

verifyDeliverableUploads();