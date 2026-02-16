#!/usr/bin/env node

/**
 * CI/CD Pipeline Setup Script
 * 
 * This script helps setup the complete CI/CD automation for EDMECA Academy
 * 
 * Usage: node scripts/setup-cicd.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 EDMECA Academy CI/CD Setup\n');
console.log('=' .repeat(60));

// Check if running in git repository
function checkGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    console.log('✅ Git repository detected');
    return true;
  } catch {
    console.log('❌ Not a git repository');
    return false;
  }
}

// Check if GitHub remote exists
function checkGitHub() {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    if (remote.includes('github.com')) {
      console.log('✅ GitHub remote configured');
      console.log(`   ${remote}`);
      return true;
    }
    console.log('⚠️  Remote exists but not GitHub');
    return false;
  } catch {
    console.log('⚠️  No remote configured');
    return false;
  }
}

// Check workflow files
function checkWorkflows() {
  const workflowDir = path.join(process.cwd(), '.github', 'workflows');
  const requiredWorkflows = [
    'pr-automation.yml',
    'pr-description.yml',
    'code-quality.yml',
    'deploy.yml'
  ];
  
  console.log('\n📁 Checking workflow files:');
  let allPresent = true;
  
  for (const workflow of requiredWorkflows) {
    const filePath = path.join(workflowDir, workflow);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${workflow}`);
    } else {
      console.log(`   ❌ ${workflow} - MISSING`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Check documentation
function checkDocs() {
  const docs = [
    '.github/workflows/README.md',
    '.github/PR-AUTOMATION-GUIDE.md',
    '.github/CI-CD-DASHBOARD.md'
  ];
  
  console.log('\n📚 Checking documentation:');
  let allPresent = true;
  
  for (const doc of docs) {
    const filePath = path.join(process.cwd(), doc);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${doc}`);
    } else {
      console.log(`   ❌ ${doc} - MISSING`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Check for required secrets
function checkSecrets() {
  console.log('\n🔐 Required GitHub Secrets:');
  console.log('   These must be configured in GitHub:');
  console.log('   Settings → Secrets and variables → Actions\n');
  
  const secrets = [
    { name: 'VITE_SUPABASE_URL', required: true, purpose: 'Supabase API URL' },
    { name: 'VITE_SUPABASE_ANON_KEY', required: true, purpose: 'Supabase anonymous key' },
    { name: 'SUPABASE_PROJECT_ID', required: false, purpose: 'For DB migrations' },
    { name: 'SUPABASE_ACCESS_TOKEN', required: false, purpose: 'For DB migrations' },
    { name: 'NETLIFY_AUTH_TOKEN', required: false, purpose: 'For deployment' },
    { name: 'NETLIFY_SITE_ID', required: false, purpose: 'For deployment' }
  ];
  
  for (const secret of secrets) {
    const status = secret.required ? '🔴 Required' : '🟡 Optional';
    console.log(`   ${status} ${secret.name}`);
    console.log(`      Purpose: ${secret.purpose}`);
  }
  
  return true;
}

// Setup GitHub labels
async function setupLabels() {
  console.log('\n🏷️  Setting up GitHub labels...');
  
  try {
    execSync('node scripts/setup-github-labels.js', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.log('   ⚠️  Label setup failed or already complete');
    return false;
  }
}

// Generate setup report
function generateReport(checks) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Setup Report\n');
  
  const allPassed = Object.values(checks).every(v => v === true);
  
  if (allPassed) {
    console.log('🎉 All checks passed! Your CI/CD is ready.\n');
    console.log('Next steps:');
    console.log('1. Configure secrets in GitHub (see list above)');
    console.log('2. Enable Actions in your repository');
    console.log('3. Create a test PR to verify automation');
    console.log('4. Review .github/PR-AUTOMATION-GUIDE.md');
  } else {
    console.log('⚠️  Some checks failed. Please review above.\n');
    console.log('Missing components:');
    for (const [check, passed] of Object.entries(checks)) {
      if (!passed) {
        console.log(`   ❌ ${check}`);
      }
    }
  }
  
  console.log('\n📖 Documentation:');
  console.log('   • Workflow Guide: .github/workflows/README.md');
  console.log('   • Quick Reference: .github/PR-AUTOMATION-GUIDE.md');
  console.log('   • Dashboard: .github/CI-CD-DASHBOARD.md');
  
  console.log('\n🔗 Useful Commands:');
  console.log('   • Test locally: npm run check && npm run build');
  console.log('   • View workflows: gh workflow list');
  console.log('   • View runs: gh run list');
  console.log('   • Setup labels: node scripts/setup-github-labels.js');
  
  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  const checks = {
    'Git Repository': checkGitRepo(),
    'GitHub Remote': checkGitHub(),
    'Workflow Files': checkWorkflows(),
    'Documentation': checkDocs(),
    'Secrets Info': checkSecrets()
  };
  
  // Try to setup labels if GitHub CLI is available
  try {
    checks['GitHub Labels'] = await setupLabels();
  } catch {
    checks['GitHub Labels'] = false;
  }
  
  generateReport(checks);
}

// Run
main().catch(console.error);
