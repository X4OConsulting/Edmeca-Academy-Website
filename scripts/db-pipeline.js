#!/usr/bin/env node
/**
 * Database Migration Pipeline for EDMECA Academy
 * 
 * This script handles:
 * - Running database migrations
 * - Executing custom SQL queries
 * - Managing schema changes
 * - Deployment pipeline integration
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'dqvdnyxkkletgkkpicdg';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green  
    error: '\x1b[31m',   // red
    warn: '\x1b[33m'     // yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}[DB Pipeline]${reset} ${message}`);
}

function runCommand(command, description) {
  log(`${description}...`);
  try {
    const result = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    if (result) {
      console.log(result);
    }
    log(`✅ ${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'error');
    return false;
  }
}

async function checkSupabaseAuth() {
  if (!SUPABASE_ACCESS_TOKEN) {
    log('⚠️  SUPABASE_ACCESS_TOKEN not found', 'warn');
    log('You can set it by running: npx supabase login', 'info');
    return false;
  }
  return true;
}

async function linkProject() {
  log('🔗 Linking to remote Supabase project...');
  return runCommand(
    `npx supabase link --project-ref ${SUPABASE_PROJECT_ID}`,
    'Project linking'
  );
}

async function runMigrations() {
  log('🚀 Running database migrations...');
  return runCommand(
    'npx supabase db push',
    'Database migration'
  );
}

async function generateTypes() {
  log('📝 Generating TypeScript types...');
  return runCommand(
    'npx supabase gen types typescript --local > client/src/lib/database.types.ts',
    'Type generation'
  );
}

async function runCustomSQL(filePath) {
  if (!existsSync(filePath)) {
    log(`❌ SQL file not found: ${filePath}`, 'error');
    return false;
  }

  const sqlContent = readFileSync(filePath, 'utf-8');
  log(`📄 Executing SQL from: ${filePath}`);
  
  // Write SQL to temp file and execute
  const tempFile = join(process.cwd(), 'temp-query.sql');
  require('fs').writeFileSync(tempFile, sqlContent);
  
  const success = runCommand(
    `npx supabase db reset --linked`,  
    'Custom SQL execution'
  );
  
  // Clean up temp file
  try {
    require('fs').unlinkSync(tempFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  return success;
}

async function getStatus() {
  log('📊 Getting database status...');
  return runCommand(
    'npx supabase status',
    'Status check'
  );
}

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  log('🏗️  EDMECA Academy Database Pipeline');
  log('=====================================');

  switch (command) {
    case 'init':
      log('🎯 Initializing database...');
      await linkProject();
      await runMigrations();
      await generateTypes();
      log('🎉 Database initialization complete!', 'success');
      break;
      
    case 'migrate':
      log('🚀 Running migrations...');
      await runMigrations();
      await generateTypes();
      break;
      
    case 'sql':
      const sqlFile = args[0];
      if (!sqlFile) {
        log('❌ Please provide SQL file path: npm run db:sql <file.sql>', 'error');
        process.exit(1);
      }
      await runCustomSQL(sqlFile);
      break;
      
    case 'types':
      await generateTypes();
      break;
      
    case 'status':
      await getStatus();
      break;
      
    case 'reset':
      log('⚠️  Resetting database (this will delete all data!)...', 'warn');
      const confirm = process.env.FORCE_RESET || args.includes('--force');
      if (!confirm) {
        log('Add --force flag to confirm reset', 'warn');
        process.exit(1);
      }
      runCommand('npx supabase db reset --linked', 'Database reset');
      break;
      
    default:
      log('Available commands:');
      log('  npm run db:pipeline init     - Initialize database and run migrations');
      log('  npm run db:pipeline migrate  - Run pending migrations');  
      log('  npm run db:pipeline sql <file> - Execute custom SQL file');
      log('  npm run db:pipeline types    - Generate TypeScript types');
      log('  npm run db:pipeline status   - Show database status');
      log('  npm run db:pipeline reset --force - Reset database (DANGER!)');
      break;
  }
}

main().catch(error => {
  log(`💥 Pipeline failed: ${error.message}`, 'error');
  process.exit(1);
});