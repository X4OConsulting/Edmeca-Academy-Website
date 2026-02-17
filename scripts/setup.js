#!/usr/bin/env node
/**
 * Local Development Setup for EDMECA Academy
 * Quick setup script for new developers
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    
    success: '\x1b[32m', 
    error: '\x1b[31m',   
    warn: '\x1b[33m'     
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}[Setup]${reset} ${message}`);
}

function runCommand(command, description) {
  log(`${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'error');
    return false;
  }
}

async function main() {
  log('🎯 EDMECA Academy - Local Development Setup');
  log('===========================================');

  // Check if .env.local exists
  if (!existsSync('.env.local')) {
    log('❌ .env.local not found!', 'error');
    log('Please create .env.local with your Supabase credentials:', 'warn');
    log('VITE_SUPABASE_URL=https://your-project.supabase.co');
    log('VITE_SUPABASE_ANON_KEY=your-anon-key');
    process.exit(1);
  }

  // Install dependencies
  log('📦 Installing dependencies...');
  if (!runCommand('npm install', 'NPM install')) return;

  // Setup Supabase
  log('🔗 Setting up Supabase...');
  if (!runCommand('npx supabase login', 'Supabase login')) {
    log('⚠️  Manual login required. Please run: npx supabase login', 'warn');
  }

  // Run database setup
  log('🗄️  Setting up database...');
  runCommand('npm run db:pipeline init', 'Database initialization');

  // Build the application
  log('🏗️  Building application...');
  runCommand('npm run build', 'Application build');

  log('🎉 Setup completed!', 'success');
  log('');
  log('Next steps:');
  log('1. Run: npm run dev');
  log('2. Open: http://localhost:5173');
  log('3. Test the contact form and authentication');
  log('');
  log('Available commands:');
  log('  npm run dev              - Start development server');
  log('  npm run db:pipeline init - Initialize database');
  log('  npm run migration:new    - Create new migration');
}

main().catch(error => {
  log(`💥 Setup failed: ${error.message}`, 'error');
  process.exit(1);
});