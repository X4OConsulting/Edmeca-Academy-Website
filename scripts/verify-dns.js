#!/usr/bin/env node

/**
 * DNS Verification Tool for edmeca.co.za
 * Checks DNS records to verify migration status
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DOMAIN = 'edmeca.co.za';
const WWW_DOMAIN = 'www.edmeca.co.za';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDNS(domain, type) {
  try {
    const { stdout } = await execAsync(`nslookup -type=${type} ${domain}`);
    return stdout;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function verifyDNS() {
  console.log('\n🔍 DNS Verification Tool for edmeca.co.za\n');
  console.log('='.repeat(60));

  // Check A Record (apex domain)
  log('\n📌 Checking A Record (edmeca.co.za)...', 'cyan');
  const aRecord = await checkDNS(DOMAIN, 'A');
  console.log(aRecord);
  
  if (aRecord.includes('netlify') || aRecord.includes('75.2.60.5')) {
    log('✅ A record appears to point to Netlify', 'green');
  } else if (aRecord.includes('replit')) {
    log('⚠️  A record still points to Replit - needs update', 'yellow');
  } else {
    log('❓ Unable to determine hosting from A record', 'yellow');
  }

  // Check CNAME (www subdomain)
  log('\n📌 Checking CNAME Record (www.edmeca.co.za)...', 'cyan');
  const cnameRecord = await checkDNS(WWW_DOMAIN, 'CNAME');
  console.log(cnameRecord);
  
  if (cnameRecord.includes('netlify.app')) {
    log('✅ CNAME points to Netlify', 'green');
  } else if (cnameRecord.includes('replit')) {
    log('⚠️  CNAME still points to Replit - needs update', 'yellow');
  } else {
    log('❓ Unable to determine CNAME target', 'yellow');
  }

  // Check MX Records (email)
  log('\n📌 Checking MX Records (Email)...', 'cyan');
  const mxRecords = await checkDNS(DOMAIN, 'MX');
  console.log(mxRecords);
  
  if (mxRecords.includes('google.com')) {
    log('✅ MX records point to Google Workspace - Email config correct', 'green');
  } else {
    log('❌ MX records not pointing to Google - EMAIL WILL NOT WORK!', 'red');
  }

  // Check TXT Records (SPF, DKIM, DMARC)
  log('\n📌 Checking TXT Records (SPF, DKIM, DMARC)...', 'cyan');
  const txtRecords = await checkDNS(DOMAIN, 'TXT');
  console.log(txtRecords);
  
  if (txtRecords.includes('spf1') && txtRecords.includes('google')) {
    log('✅ SPF record found with Google', 'green');
  } else {
    log('⚠️  SPF record may be missing or incorrect', 'yellow');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('\n📊 SUMMARY', 'blue');
  console.log('='.repeat(60));
  
  console.log('\n✅ Checklist:');
  console.log('   [ ] A record points to Netlify');
  console.log('   [ ] CNAME for www points to Netlify');
  console.log('   [ ] MX records point to Google (email)');
  console.log('   [ ] SPF record includes Google');
  console.log('   [ ] Website loads at https://edmeca.co.za');
  console.log('   [ ] HTTPS certificate is valid (green padlock)');
  console.log('   [ ] Email sending works');
  console.log('   [ ] Email receiving works');

  console.log('\n💡 Next Steps:');
  console.log('   1. If DNS shows Netlify: Wait for propagation (15 min - 24 hrs)');
  console.log('   2. Check propagation: https://dnschecker.org');
  console.log('   3. Test website: https://edmeca.co.za');
  console.log('   4. Test email: Send/receive to confirm');
  console.log('   5. Verify HTTPS certificate in browser\n');

  console.log('='.repeat(60) + '\n');
}

// Run verification
verifyDNS().catch(error => {
  log(`\n❌ Error running DNS verification: ${error.message}`, 'red');
  console.log('\n💡 This script requires nslookup to be available.');
  console.log('   Alternative: Check DNS manually at https://dnschecker.org\n');
});
