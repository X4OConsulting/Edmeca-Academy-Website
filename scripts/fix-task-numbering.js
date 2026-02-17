#!/usr/bin/env node

/**
 * Fix Task ID numbering issue in row 11
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const apiToken = process.env.SMARTSHEET_API_TOKEN;
const sheetId = process.env.SMARTSHEET_SHEET_ID;

async function fixTaskNumbering() {
  console.log('🔧 Fixing Task ID numbering in row 11...');

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
    const taskIdColumn = sheet.columns.find(col => col.title === 'Task ID');
    
    // Find row 11 
    const row11 = sheet.rows.find(row => row.rowNumber === 11);
    
    if (row11) {
      const updatePayload = [
        {
          id: row11.id,
          cells: [
            {
              columnId: taskIdColumn.id,
              value: 1.10  // Fix to 1.10
            }
          ]
        }
      ];

      await axios.put(
        `https://api.smartsheet.com/2.0/sheets/${sheetId}/rows`,
        updatePayload,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Fixed Task ID in row 11: 1.1 → 1.10');
    }

  } catch (error) {
    console.error('❌ Error fixing task numbering:', error.message);
  }
}

fixTaskNumbering();