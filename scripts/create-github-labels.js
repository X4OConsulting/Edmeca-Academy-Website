#!/usr/bin/env node

/**
 * GitHub Labels Creator - API Version
 * 
 * This script creates required labels using GitHub REST API directly.
 * 
 * Usage:
 *   1. Create a GitHub Personal Access Token:
 *      - Go to: https://github.com/settings/tokens
 *      - Click "Generate new token (classic)"
 *      - Give it a name: "CI/CD Labels"
 *      - Select scopes: 'repo' (all) or at minimum 'public_repo'
 *      - Click "Generate token"
 *      - Copy the token
 *   
 *   2. Run this script:
 *      $env:GITHUB_TOKEN="your_token_here"
 *      node scripts/create-github-labels.js
 * 
 *      OR provide token as argument:
 *      node scripts/create-github-labels.js YOUR_TOKEN_HERE
 */

import https from 'https';

const REPO_OWNER = 'X4OConsulting';
const REPO_NAME = 'Edmeca-Academy-Website';

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

// Get token from environment or command line
const token = process.env.GITHUB_TOKEN || process.argv[2];

if (!token) {
  console.log('❌ GitHub token not provided!\n');
  console.log('📋 How to get a GitHub token:\n');
  console.log('1. Go to: https://github.com/settings/tokens');
  console.log('2. Click "Generate new token (classic)"');
  console.log('3. Give it a name: "CI/CD Labels"');
  console.log('4. Select scope: "repo" (Full control of private repositories)');
  console.log('5. Click "Generate token"');
  console.log('6. Copy the token\n');
  console.log('📝 Usage:\n');
  console.log('   PowerShell:');
  console.log('   $env:GITHUB_TOKEN="your_token_here"');
  console.log('   node scripts/create-github-labels.js\n');
  console.log('   OR\n');
  console.log('   node scripts/create-github-labels.js YOUR_TOKEN_HERE\n');
  process.exit(1);
}

console.log('🏷️  Creating GitHub Labels via API\n');
console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}\n`);

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'EDMECA-CI-CD-Setup',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject({ statusCode: res.statusCode, body: response });
          }
        } catch (e) {
          reject({ statusCode: res.statusCode, body, error: e });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function createLabel(label) {
  try {
    await makeRequest('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/labels`, label);
    console.log(`✅ Created: ${label.name} (${label.description})`);
    return true;
  } catch (error) {
    if (error.statusCode === 422 && error.body.errors?.[0]?.code === 'already_exists') {
      console.log(`⚠️  Already exists: ${label.name}`);
      return false;
    } else if (error.statusCode === 404) {
      console.log(`❌ Repository not found or no access: ${REPO_OWNER}/${REPO_NAME}`);
      console.log('   Make sure your token has "repo" scope');
      return false;
    } else if (error.statusCode === 401) {
      console.log(`❌ Authentication failed for: ${label.name}`);
      console.log('   Your token may be invalid or expired');
      return false;
    } else {
      console.log(`❌ Failed to create: ${label.name}`);
      console.log(`   Error: ${JSON.stringify(error.body || error)}`);
      return false;
    }
  }
}

async function main() {
  let created = 0;
  let existing = 0;
  let failed = 0;

  for (const label of labels) {
    const result = await createLabel(label);
    if (result === true) created++;
    else if (result === false) existing++;
    else failed++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:\n');
  console.log(`✅ Created:        ${created}`);
  console.log(`⚠️  Already exists: ${existing}`);
  console.log(`❌ Failed:         ${failed}`);
  console.log(`📝 Total:          ${labels.length}`);

  if (created + existing === labels.length) {
    console.log('\n🎉 All labels are now set up!');
    console.log('\nVerify at:');
    console.log(`https://github.com/${REPO_OWNER}/${REPO_NAME}/labels`);
    process.exit(0);
  } else {
    console.log('\n⚠️  Some labels could not be created.');
    console.log('Please check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
