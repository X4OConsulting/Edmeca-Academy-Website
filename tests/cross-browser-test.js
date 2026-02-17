/**
 * Cross-Browser Migration Tests for edmeca.co.za
 * Tests Chrome, Firefox, and WebKit (Safari)
 * 
 * Run: node tests/cross-browser-test.js
 */

import { chromium, firefox, webkit } from 'playwright';

const SITE_URL = 'https://edmeca.co.za';
const NETLIFY_URL = 'https://edmecaacademy.netlify.app';

// Test configuration
const BROWSERS = [
  { name: 'Chromium', launcher: chromium },
  { name: 'Firefox', launcher: firefox },
  { name: 'WebKit', launcher: webkit }
];

const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/solutions', name: 'Solutions' },
  { path: '/frameworks', name: 'Frameworks' },
  { path: '/engagement', name: 'Engagement' },
  { path: '/contact', name: 'Contact' }
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test a single page
 */
async function testPage(page, url, pageName) {
  const errors = [];
  
  try {
    // Navigate to page
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Check HTTP status
    if (!response.ok()) {
      errors.push(`❌ HTTP ${response.status()} - ${url}`);
    } else {
      console.log(`  ✅ ${pageName}: HTTP ${response.status()}`);
    }
    
    // Check HTTPS
    if (!url.startsWith('https://')) {
      errors.push(`❌ Not using HTTPS - ${url}`);
    }
    
    // Check for "Not found" text
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Not found') || bodyText.includes('404')) {
      errors.push(`❌ "Not found" detected on ${pageName}`);
    }
    
    // Check page title
    const title = await page.title();
    if (!title || title === '') {
      errors.push(`❌ Empty page title - ${pageName}`);
    } else {
      console.log(`  ✅ Page title: "${title.substring(0, 50)}..."`);
    }
    
    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      errors.push(`⚠️  ${consoleErrors.length} console errors on ${pageName}`);
      consoleErrors.slice(0, 3).forEach(err => {
        console.log(`     └─ ${err.substring(0, 100)}`);
      });
    }
    
  } catch (error) {
    errors.push(`❌ Failed to load ${pageName}: ${error.message}`);
  }
  
  return errors;
}

/**
 * Test contact form functionality
 */
async function testContactForm(page) {
  const errors = [];
  
  try {
    await page.goto(`${SITE_URL}/contact`, { waitUntil: 'networkidle' });
    
    // Check if form exists
    const formExists = await page.locator('form').count() > 0;
    if (!formExists) {
      errors.push('❌ Contact form not found');
      return errors;
    }
    
    console.log('  ✅ Contact form found');
    
    // Check for required fields (adjust selectors as needed)
    const hasNameField = await page.locator('input[name="name"], input[type="text"]').count() > 0;
    const hasEmailField = await page.locator('input[name="email"], input[type="email"]').count() > 0;
    const hasMessageField = await page.locator('textarea, input[name="message"]').count() > 0;
    
    if (!hasNameField) errors.push('⚠️  Name field not found');
    if (!hasEmailField) errors.push('⚠️  Email field not found');
    if (!hasMessageField) errors.push('⚠️  Message field not found');
    
    if (hasNameField && hasEmailField && hasMessageField) {
      console.log('  ✅ All form fields present');
    }
    
  } catch (error) {
    errors.push(`❌ Contact form test failed: ${error.message}`);
  }
  
  return errors;
}

/**
 * Run all tests for a single browser
 */
async function testBrowser(browserConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🌐 Testing ${browserConfig.name}`);
  console.log('='.repeat(60));
  
  const browser = await browserConfig.launcher.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: false
  });
  const page = await context.newPage();
  
  const browserErrors = [];
  
  // Test custom domain
  console.log(`\n📍 Testing custom domain: ${SITE_URL}`);
  for (const pageConfig of PAGES_TO_TEST) {
    const url = `${SITE_URL}${pageConfig.path}`;
    const errors = await testPage(page, url, pageConfig.name);
    browserErrors.push(...errors);
  }
  
  // Test contact form
  console.log(`\n📋 Testing contact form...`);
  const formErrors = await testContactForm(page);
  browserErrors.push(...formErrors);
  
  // Test Netlify URL (should match custom domain)
  console.log(`\n📍 Testing Netlify URL: ${NETLIFY_URL}`);
  const netlifyErrors = await testPage(page, NETLIFY_URL, 'Netlify URL');
  browserErrors.push(...netlifyErrors);
  
  await browser.close();
  
  // Report results for this browser
  if (browserErrors.length === 0) {
    console.log(`\n✅ ${browserConfig.name}: ALL TESTS PASSED`);
    results.passed++;
  } else {
    console.log(`\n❌ ${browserConfig.name}: ${browserErrors.length} ISSUES FOUND`);
    browserErrors.forEach(err => console.log(`   ${err}`));
    results.failed++;
    results.errors.push({ browser: browserConfig.name, errors: browserErrors });
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EDMECA.CO.ZA - CROSS-BROWSER MIGRATION TESTS');
  console.log('='.repeat(60));
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Netlify URL: ${NETLIFY_URL}`);
  console.log(`Testing ${BROWSERS.length} browsers × ${PAGES_TO_TEST.length} pages`);
  
  const startTime = Date.now();
  
  // Run tests for each browser sequentially
  for (const browserConfig of BROWSERS) {
    try {
      await testBrowser(browserConfig);
    } catch (error) {
      console.error(`\n❌ ${browserConfig.name} test suite failed:`, error.message);
      results.failed++;
      results.errors.push({ 
        browser: browserConfig.name, 
        errors: [`Test suite crashed: ${error.message}`] 
      });
    }
  }
  
  // Final report
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}/${BROWSERS.length} browsers`);
  console.log(`❌ Failed: ${results.failed}/${BROWSERS.length} browsers`);
  console.log(`⏱️  Duration: ${duration}s`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS BY BROWSER:');
    results.errors.forEach(({ browser, errors }) => {
      console.log(`\n${browser}:`);
      errors.forEach(err => console.log(`  ${err}`));
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test runner crashed:', error);
  process.exit(1);
});
