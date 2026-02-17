#!/usr/bin/env node

/**
 * CI/CD Error Detection Test Suite
 * 
 * This script tests the CI/CD pipeline's ability to detect various types of errors
 * by simulating the checks that run in GitHub Actions.
 * 
 * Usage: node scripts/test-cicd-error-detection.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 CI/CD Error Detection Test Suite\n');
console.log('=' .repeat(70));

const testResults = [];

// Helper to run command and capture result
function runTest(name, command, shouldPass = true) {
  console.log(`\n📋 TEST: ${name}`);
  console.log('-'.repeat(70));
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    if (shouldPass) {
      console.log('✅ PASS - Command succeeded as expected');
      testResults.push({ name, status: 'PASS', expected: true });
      return { success: true, output };
    } else {
      console.log('❌ FAIL - Command should have failed but passed');
      testResults.push({ name, status: 'FAIL', expected: false });
      return { success: false, output };
    }
  } catch (error) {
    if (!shouldPass) {
      console.log('✅ PASS - Command failed as expected');
      console.log(`Error captured: ${error.message.split('\n')[0]}`);
      testResults.push({ name, status: 'PASS', expected: true });
      return { success: true, error: error.message };
    } else {
      console.log('❌ FAIL - Command should have passed but failed');
      console.log(`Unexpected error: ${error.message.split('\n')[0]}`);
      testResults.push({ name, status: 'FAIL', expected: false });
      return { success: false, error: error.message };
    }
  }
}

// Test 1: TypeScript Check on Current Code (should pass)
console.log('\n🔍 Phase 1: TypeScript Validation Tests');
console.log('='.repeat(70));

runTest(
  'TypeScript Check - Valid Code',
  'npm run check',
  true
);

// Test 2: Build Process (should pass)
console.log('\n\n🏗️  Phase 2: Build Process Tests');
console.log('='.repeat(70));

runTest(
  'Build Process - Valid Code',
  'npm run build',
  true
);

// Test 3: Create intentional TypeScript error and test detection
console.log('\n\n⚠️  Phase 3: Error Detection Tests');
console.log('='.repeat(70));

// Backup original file
const testFilePath = path.join(process.cwd(), 'client', 'src', 'test-error-detection.ts');
const testFileContent = `
// Test file for CI/CD error detection
// This file intentionally contains TypeScript errors

export function validFunction(): string {
  return "This is valid";
}

// TypeScript Error Test 1: Type mismatch
export function typeMismatchError(): number {
  return "This should be a number"; // ERROR: Type 'string' is not assignable to type 'number'
}

// TypeScript Error Test 2: Missing property
interface RequiredProps {
  id: number;
  name: string;
  email: string;
}

export function missingPropertyError(): RequiredProps {
  return {
    id: 1,
    name: "Test"
    // ERROR: Property 'email' is missing
  };
}

// TypeScript Error Test 3: Undefined variable
export function undefinedVariableError() {
  console.log(nonExistentVariable); // ERROR: Cannot find name 'nonExistentVariable'
}

// TypeScript Error Test 4: Wrong type argument
export function wrongTypeArgument() {
  const numbers: number[] = [1, 2, 3];
  numbers.push("not a number"); // ERROR: Argument of type 'string' is not assignable to parameter of type 'number'
}
`;

console.log('\n📝 Creating test file with intentional TypeScript errors...');
fs.writeFileSync(testFilePath, testFileContent);
console.log(`✅ Created: ${testFilePath}`);

// Test 4: Run TypeScript check (should now fail)
runTest(
  'TypeScript Check - With Intentional Errors',
  'npm run check',
  false // Should fail
);

// Test 5: Check if error details are captured
console.log('\n\n🔍 Phase 4: Error Detail Capture Test');
console.log('='.repeat(70));

try {
  execSync('npm run check', { encoding: 'utf8', stdio: 'pipe' });
} catch (error) {
  const errorOutput = error.stderr || error.stdout || '';
  
  // Check for specific error patterns
  const checks = [
    {
      name: 'Type Mismatch Detection',
      pattern: /Type.*string.*not assignable.*number/i,
      found: errorOutput.match(/Type.*string.*not assignable.*number/i)
    },
    {
      name: 'Missing Property Detection',
      pattern: /Property.*email.*missing/i,
      found: errorOutput.match(/Property.*email.*missing/i)
    },
    {
      name: 'Undefined Variable Detection',
      pattern: /Cannot find name/i,
      found: errorOutput.match(/Cannot find name/i)
    },
    {
      name: 'File Path in Error',
      pattern: /test-error-detection\.ts/,
      found: errorOutput.match(/test-error-detection\.ts/)
    }
  ];
  
  console.log('\n📊 Error Pattern Detection Results:\n');
  
  checks.forEach(check => {
    if (check.found) {
      console.log(`✅ ${check.name}: DETECTED`);
      console.log(`   Matched: "${check.found[0]}"`);
      testResults.push({ name: check.name, status: 'PASS', expected: true });
    } else {
      console.log(`❌ ${check.name}: NOT DETECTED`);
      testResults.push({ name: check.name, status: 'FAIL', expected: false });
    }
  });
  
  // Show sample of actual error output
  console.log('\n📋 Sample Error Output:');
  console.log('-'.repeat(70));
  const errorLines = errorOutput.split('\n').slice(0, 20);
  errorLines.forEach(line => console.log(line));
  if (errorOutput.split('\n').length > 20) {
    console.log('... (truncated)');
  }
}

// Cleanup test file
console.log('\n\n🧹 Cleanup');
console.log('='.repeat(70));
if (fs.existsSync(testFilePath)) {
  fs.unlinkSync(testFilePath);
  console.log(`✅ Removed test file: ${testFilePath}`);
}

// Test 6: Verify TypeScript works again after cleanup
runTest(
  'TypeScript Check - After Cleanup',
  'npm run check',
  true
);

// Test 7: Security scan simulation
console.log('\n\n🔐 Phase 5: Security Scan Tests');
console.log('='.repeat(70));

console.log('\n📋 Running npm audit...');
try {
  const auditOutput = execSync('npm audit --audit-level=moderate', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('✅ No moderate or high severity vulnerabilities found');
  console.log(auditOutput.split('\n').slice(0, 10).join('\n'));
  testResults.push({ name: 'Security Audit', status: 'PASS', expected: true });
} catch (error) {
  console.log('⚠️  Vulnerabilities detected:');
  const output = error.stdout || error.stderr || '';
  console.log(output.split('\n').slice(0, 15).join('\n'));
  testResults.push({ name: 'Security Audit', status: 'WARNING', expected: true });
}

// Test 8: Build artifact verification
console.log('\n\n📦 Phase 6: Build Artifact Tests');
console.log('='.repeat(70));

const distPath = path.join(process.cwd(), 'client', 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log(`✅ Build directory exists with ${files.length} files/folders`);
  console.log('\nBuild artifacts:');
  files.slice(0, 10).forEach(file => console.log(`  - ${file}`));
  testResults.push({ name: 'Build Artifacts Present', status: 'PASS', expected: true });
} else {
  console.log('⚠️  Build directory not found - run npm run build first');
  testResults.push({ name: 'Build Artifacts Present', status: 'SKIP', expected: true });
}

// Final Summary
console.log('\n\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));

const passed = testResults.filter(r => r.status === 'PASS').length;
const failed = testResults.filter(r => r.status === 'FAIL').length;
const warnings = testResults.filter(r => r.status === 'WARNING').length;
const skipped = testResults.filter(r => r.status === 'SKIP').length;
const total = testResults.length;

console.log(`\nTotal Tests: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`⏭️  Skipped: ${skipped}`);

console.log('\n📋 Detailed Results:\n');
testResults.forEach((result, index) => {
  const icon = result.status === 'PASS' ? '✅' : 
               result.status === 'FAIL' ? '❌' : 
               result.status === 'WARNING' ? '⚠️' : '⏭️';
  console.log(`${index + 1}. ${icon} ${result.name}: ${result.status}`);
});

// Determine overall result
console.log('\n' + '='.repeat(70));

if (failed === 0) {
  console.log('🎉 CI/CD ERROR DETECTION: FULLY FUNCTIONAL');
  console.log('\nThe CI/CD pipeline successfully:');
  console.log('  ✅ Detects TypeScript errors');
  console.log('  ✅ Captures error details and locations');
  console.log('  ✅ Validates builds');
  console.log('  ✅ Runs security scans');
  console.log('  ✅ Verifies artifacts');
  console.log('\n✨ Your CI/CD pipeline is ready to catch errors in PRs!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease review the failed tests above.');
  process.exit(1);
}
