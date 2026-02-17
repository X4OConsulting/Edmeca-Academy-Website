#!/usr/bin/env node

/**
 * Check if GitHub labels exist (read-only)
 * This uses the public GitHub API to check labels without needing special permissions
 */

import https from 'https';

const REPO_OWNER = 'X4OConsulting';
const REPO_NAME = 'Edmeca-Academy-Website';

const requiredLabels = [
  'auto-approved',
  'ready-to-merge',
  'needs-work',
  'failing-checks',
  'auto-generated-description',
  'critical-files-changed'
];

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'EDMECA-CI-CD-Setup',
        'Accept': 'application/vnd.github+json'
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
    req.end();
  });
}

async function checkLabels() {
  console.log('🔍 Checking existing labels in repository...\n');
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}\n`);

  try {
    // Get all labels from the repository
    const labels = await makeRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/labels?per_page=100`);
    
    const labelNames = labels.map(l => l.name);
    
    console.log('📋 Found labels in repository:\n');
    labels.forEach(label => {
      const isRequired = requiredLabels.includes(label.name);
      const marker = isRequired ? '✅' : '  ';
      console.log(`${marker} ${label.name} (#${label.color})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Required labels status:\n');

    let allExist = true;
    requiredLabels.forEach(required => {
      if (labelNames.includes(required)) {
        console.log(`✅ ${required} - EXISTS`);
      } else {
        console.log(`❌ ${required} - MISSING`);
        allExist = false;
      }
    });

    console.log('\n' + '='.repeat(60));

    if (allExist) {
      console.log('🎉 All required labels exist!');
      console.log('\n✅ You can skip label creation and proceed to the next step:');
      console.log('   Create a test PR to verify CI/CD automation\n');
      return true;
    } else {
      console.log('⚠️  Some required labels are missing.');
      console.log('\nYou need to either:');
      console.log('1. Create them manually on GitHub');
      console.log('2. Get a token with "Issues: Read and write" permission');
      console.log('\nSee: CI-CD-ACTIVATION-STEPS.md for instructions\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Error checking labels:', error.body?.message || error.message);
    console.log('\nThe repository might be private or not accessible.');
    console.log('Please check manually at:');
    console.log(`https://github.com/${REPO_OWNER}/${REPO_NAME}/labels\n`);
    return false;
  }
}

checkLabels().catch(console.error);
