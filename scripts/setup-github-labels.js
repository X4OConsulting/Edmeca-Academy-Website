#!/usr/bin/env node

/**
 * Setup GitHub Labels for PR Automation
 * 
 * This script creates the required labels for the PR automation workflows.
 * 
 * Usage:
 *   node scripts/setup-github-labels.js
 * 
 * Requirements:
 *   - GitHub CLI (gh) installed and authenticated
 *   OR
 *   - GITHUB_TOKEN environment variable set
 */

import { execSync } from 'child_process';

const labels = [
  {
    name: 'auto-approved',
    color: '0e8a16',
    description: 'PR automatically approved by CI/CD automation'
  },
  {
    name: 'ready-to-merge',
    color: '0e8a16',
    description: 'All checks passed, ready to merge'
  },
  {
    name: 'needs-work',
    color: 'd73a4a',
    description: 'Changes requested by automated review'
  },
  {
    name: 'failing-checks',
    color: 'd73a4a',
    description: 'CI/CD checks failed'
  },
  {
    name: 'auto-generated-description',
    color: '1d76db',
    description: 'PR description was auto-generated'
  },
  {
    name: 'critical-files-changed',
    color: 'fbca04',
    description: 'Critical files modified (database, config, etc.)'
  }
];

function createLabelsWithGH() {
  console.log('🏷️  Creating GitHub labels using GitHub CLI...\n');
  
  for (const label of labels) {
    try {
      execSync(
        `gh label create "${label.name}" --description "${label.description}" --color "${label.color}"`,
        { stdio: 'inherit' }
      );
      console.log(`✅ Created: ${label.name}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Already exists: ${label.name}`);
      } else {
        console.error(`❌ Failed to create: ${label.name}`);
        console.error(error.message);
      }
    }
  }
  
  console.log('\n✨ Label setup complete!');
}

function createLabelsWithAPI() {
  console.log('🏷️  Creating GitHub labels using GitHub API...\n');
  console.log('📋 Required labels:\n');
  
  for (const label of labels) {
    console.log(`Name: ${label.name}`);
    console.log(`Color: #${label.color}`);
    console.log(`Description: ${label.description}`);
    console.log('---');
  }
  
  console.log('\n💡 Manual Setup Instructions:');
  console.log('1. Go to your repository on GitHub');
  console.log('2. Click "Issues" → "Labels"');
  console.log('3. Click "New label" for each label above');
  console.log('4. Copy the name, color, and description');
  console.log('\nOr install GitHub CLI: https://cli.github.com/');
}

// Check if gh CLI is available
try {
  execSync('gh --version', { stdio: 'ignore' });
  createLabelsWithGH();
} catch {
  console.log('⚠️  GitHub CLI not found. Showing manual instructions...\n');
  createLabelsWithAPI();
}
