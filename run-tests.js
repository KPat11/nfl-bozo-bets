#!/usr/bin/env node

/**
 * NFL Bozo Bets - Test Runner
 * 
 * This script provides a comprehensive test runner for the NFL Bozo Bets application.
 * It can run different types of tests and generate reports.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_RESULTS_DIR = './test-results';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Test configuration
const testSuites = {
  smoke: {
    name: 'Smoke Tests',
    description: 'Basic functionality verification',
    command: 'npm run test:smoke',
    timeout: 30000
  },
  api: {
    name: 'API Tests',
    description: 'Backend endpoint functionality',
    command: 'npm run test:api',
    timeout: 60000
  },
  database: {
    name: 'Database Tests',
    description: 'Data integrity and schema validation',
    command: 'npm run test:db',
    timeout: 45000
  },
  validation: {
    name: 'Validation Tests',
    description: 'Input validation and error handling',
    command: 'npm run test:validation',
    timeout: 30000
  },
  performance: {
    name: 'Performance Tests',
    description: 'Load and response time testing',
    command: 'npm run test:performance',
    timeout: 60000
  },
  all: {
    name: 'All Tests',
    description: 'Complete test suite',
    command: 'npm run test',
    timeout: 120000
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function createTestResultsDir() {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
    log(`Created test results directory: ${TEST_RESULTS_DIR}`, 'success');
  }
}

function runTestSuite(suiteName, config) {
  log(`Running ${config.name}...`);
  log(`Description: ${config.description}`);
  log(`Command: ${config.command}`);
  
  const startTime = Date.now();
  const resultFile = path.join(TEST_RESULTS_DIR, `${suiteName}-${TIMESTAMP}.txt`);
  
  try {
    const output = execSync(config.command, {
      encoding: 'utf8',
      timeout: config.timeout,
      stdio: 'pipe'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Save results to file
    const resultContent = `Test Suite: ${config.name}
Description: ${config.description}
Start Time: ${new Date(startTime).toISOString()}
End Time: ${new Date(endTime).toISOString()}
Duration: ${duration}ms
Command: ${config.command}

Output:
${output}`;
    
    fs.writeFileSync(resultFile, resultContent);
    
    log(`${config.name} completed successfully in ${duration}ms`, 'success');
    log(`Results saved to: ${resultFile}`, 'info');
    
    return {
      success: true,
      duration,
      output,
      resultFile
    };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Save error results to file
    const errorContent = `Test Suite: ${config.name}
Description: ${config.description}
Start Time: ${new Date(startTime).toISOString()}
End Time: ${new Date(endTime).toISOString()}
Duration: ${duration}ms
Command: ${config.command}
Status: FAILED

Error:
${error.message}

Output:
${error.stdout || ''}

Error Output:
${error.stderr || ''}`;
    
    fs.writeFileSync(resultFile, errorContent);
    
    log(`${config.name} failed after ${duration}ms`, 'error');
    log(`Error details saved to: ${resultFile}`, 'info');
    
    return {
      success: false,
      duration,
      error: error.message,
      resultFile
    };
  }
}

function generateTestReport(results) {
  const reportFile = path.join(TEST_RESULTS_DIR, `test-report-${TIMESTAMP}.md`);
  
  let report = `# NFL Bozo Bets - Test Report
Generated: ${new Date().toISOString()}

## Summary

| Test Suite | Status | Duration | Result File |
|------------|--------|----------|-------------|`;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = `${result.duration}ms`;
    const fileName = path.basename(result.resultFile);
    
    report += `\n| ${result.suiteName} | ${status} | ${duration} | ${fileName} |`;
  });

  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  report += `\n\n## Statistics
- **Total Test Suites**: ${totalTests}
- **Passed**: ${passedTests}
- **Failed**: ${failedTests}
- **Success Rate**: ${((passedTests / totalTests) * 100).toFixed(2)}%
- **Total Duration**: ${totalDuration}ms

## Detailed Results

`;

  results.forEach(result => {
    report += `### ${result.suiteName}\n`;
    report += `- **Status**: ${result.success ? 'PASS' : 'FAIL'}\n`;
    report += `- **Duration**: ${result.duration}ms\n`;
    report += `- **Result File**: ${path.basename(result.resultFile)}\n`;
    
    if (!result.success) {
      report += `- **Error**: ${result.error}\n`;
    }
    
    report += '\n';
  });

  report += `## Recommendations

`;

  if (failedTests > 0) {
    report += `- Review failed test suites and fix issues
- Check application logs for additional error details
- Verify database connectivity and schema
- Ensure all required services are running
`;
  } else {
    report += `- All tests passed successfully! 🎉
- Consider running performance tests under load
- Monitor application performance in production
`;
  }

  fs.writeFileSync(reportFile, report);
  log(`Test report generated: ${reportFile}`, 'success');
  
  return reportFile;
}

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check if Node.js is available
  try {
    execSync('node --version', { stdio: 'pipe' });
    log('Node.js is available', 'success');
  } catch (error) {
    log('Node.js is not available', 'error');
    return false;
  }
  
  // Check if npm is available
  try {
    execSync('npm --version', { stdio: 'pipe' });
    log('npm is available', 'success');
  } catch (error) {
    log('npm is not available', 'error');
    return false;
  }
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    log('package.json not found. Please run from project root.', 'error');
    return false;
  }
  
  // Check if test files exist
  if (!fs.existsSync('test-suite.js')) {
    log('test-suite.js not found', 'error');
    return false;
  }
  
  log('All prerequisites met', 'success');
  return true;
}

function waitForApplication() {
  log('Waiting for application to be ready...');
  
  const maxAttempts = 30;
  const delay = 2000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = require('http').get(BASE_URL, (res) => {
        if (res.statusCode === 200) {
          log('Application is ready', 'success');
          return true;
        }
      });
      
      response.on('error', () => {
        // Continue waiting
      });
      
      if (i === maxAttempts - 1) {
        log('Application did not become ready within timeout', 'warning');
        return false;
      }
      
      require('util').promisify(setTimeout)(delay);
    } catch (error) {
      if (i === maxAttempts - 1) {
        log('Application is not running. Please start the development server.', 'error');
        return false;
      }
      
      require('util').promisify(setTimeout)(delay);
    }
  }
  
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  
  log('NFL Bozo Bets Test Runner');
  log('========================');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // Create test results directory
  createTestResultsDir();
  
  // Determine which tests to run
  let testsToRun = [];
  
  if (args.length === 0 || args.includes('--all')) {
    testsToRun = ['all'];
  } else {
    testsToRun = args.filter(arg => testSuites[arg]);
  }
  
  if (testsToRun.length === 0) {
    log('Available test suites:', 'info');
    Object.keys(testSuites).forEach(suite => {
      log(`  - ${suite}: ${testSuites[suite].description}`, 'info');
    });
    log('Usage: node run-tests.js [suite1] [suite2] ... or --all', 'info');
    process.exit(1);
  }
  
  // Wait for application if needed
  if (args.includes('--wait')) {
    if (!waitForApplication()) {
      process.exit(1);
    }
  }
  
  // Run test suites
  const results = [];
  
  for (const suiteName of testsToRun) {
    const config = testSuites[suiteName];
    if (!config) {
      log(`Unknown test suite: ${suiteName}`, 'error');
      continue;
    }
    
    const result = runTestSuite(suiteName, config);
    results.push({
      suiteName,
      ...result
    });
  }
  
  // Generate report
  const reportFile = generateTestReport(results);
  
  // Print summary
  log('\n=== TEST EXECUTION SUMMARY ===');
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Test Suites: ${totalTests}`);
  log(`Passed: ${passedTests}`, 'success');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  log(`Report: ${reportFile}`);
  
  if (failedTests > 0) {
    process.exit(1);
  } else {
    log('All tests passed! 🎉', 'success');
    process.exit(0);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  generateTestReport,
  checkPrerequisites,
  waitForApplication
};
