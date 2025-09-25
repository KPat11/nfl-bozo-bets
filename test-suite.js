#!/usr/bin/env node

/**
 * NFL Bozo Bets - Automated Test Suite
 * 
 * This script provides automated testing capabilities for the NFL Bozo Bets application.
 * It includes smoke tests, API tests, and database validation tests.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    log(`FAIL: ${message}`, 'error');
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    return { response: null, data: null, error };
  }
}

// Generate unique test data to avoid conflicts
const timestamp = Date.now()
const testData = {
  user: {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`
  },
  team: {
    name: `Test Team ${timestamp}`,
    description: 'Test team description',
    color: '#ff0000'
  },
  bet: {
    userId: '',
    week: 1,
    season: 2025,
    prop: `Test prop bet ${timestamp}`,
    odds: 150,
    betType: 'BOZO'
  }
};

// Test suites
class SmokeTests {
  static async run() {
    log('Running Smoke Tests...');
    
    // Test 1: Application health check
    try {
      const response = await fetch(BASE_URL);
      assert(response.ok, 'Application loads without errors');
    } catch (error) {
      assert(false, `Application health check failed: ${error.message}`);
    }
    
    // Test 2: API endpoints accessible
    const { response: usersResponse } = await makeRequest('/users');
    assert(usersResponse && usersResponse.ok, 'Users API endpoint accessible');
    
    const { response: teamsResponse } = await makeRequest('/teams');
    assert(teamsResponse && teamsResponse.ok, 'Teams API endpoint accessible');
    
    const { response: betsResponse } = await makeRequest('/weekly-bets?week=1&season=2025');
    assert(betsResponse && betsResponse.ok, 'Weekly bets API endpoint accessible');
  }
}

class APITests {
  static async run() {
    log('Running API Tests...');
    
    // Test 1: Create user
    const { response: createUserResponse, data: userData } = await makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(testData.user)
    });
    
    assert(createUserResponse && createUserResponse.ok, 'User creation successful');
    if (userData && userData.id) {
      testData.bet.userId = userData.id;
      testData.createdUserId = userData.id; // Store for cleanup
    }
    
    // Test 2: Get users
    const { response: getUsersResponse, data: usersData } = await makeRequest('/users');
    assert(getUsersResponse && getUsersResponse.ok, 'Get users successful');
    assert(Array.isArray(usersData), 'Users data is an array');
    
    // Test 3: Create team
    const { response: createTeamResponse, data: teamData } = await makeRequest('/teams', {
      method: 'POST',
      body: JSON.stringify(testData.team)
    });
    
    assert(createTeamResponse && createTeamResponse.ok, 'Team creation successful');
    if (teamData && teamData.id) {
      testData.createdTeamId = teamData.id; // Store for cleanup
    }
    
    // Test 4: Get teams
    const { response: getTeamsResponse, data: teamsData } = await makeRequest('/teams');
    assert(getTeamsResponse && getTeamsResponse.ok, 'Get teams successful');
    assert(Array.isArray(teamsData), 'Teams data is an array');
    
    // Test 5: Create weekly bet
    if (testData.bet.userId) {
      const { response: createBetResponse, data: betData } = await makeRequest('/weekly-bets', {
        method: 'POST',
        body: JSON.stringify(testData.bet)
      });
      
      assert(createBetResponse && createBetResponse.ok, 'Weekly bet creation successful');
      
      // Test 6: Get weekly bets
      const { response: getBetsResponse, data: betsData } = await makeRequest('/weekly-bets?week=1&season=2025');
      assert(getBetsResponse && getBetsResponse.ok, 'Get weekly bets successful');
      assert(Array.isArray(betsData), 'Weekly bets data is an array');
    }
    
    // Test 7: Test duplicate bet prevention
    if (testData.bet.userId) {
      const { response: duplicateBetResponse } = await makeRequest('/weekly-bets', {
        method: 'POST',
        body: JSON.stringify(testData.bet)
      });
      
      assert(duplicateBetResponse && duplicateBetResponse.status === 409, 'Duplicate bet prevention works');
    }
  }
}

class DatabaseTests {
  static async run() {
    log('Running Database Tests...');
    
    // Test 1: Check if users endpoint works with Prisma/PostgreSQL
    const { response: usersResponse, data: usersData } = await makeRequest('/users');
    assert(usersResponse && usersResponse.ok, 'Users endpoint is accessible');
    
    if (usersData && usersData.length > 0) {
      const user = usersData[0];
      assert(user.hasOwnProperty('id'), 'User has id field');
      assert(user.hasOwnProperty('name'), 'User has name field');
      assert(user.hasOwnProperty('email'), 'User has email field');
      assert(user.hasOwnProperty('totalBozos'), 'User has totalBozos field');
      assert(user.hasOwnProperty('totalHits'), 'User has totalHits field');
      assert(user.hasOwnProperty('isAdmin'), 'User has isAdmin field');
      assert(user.hasOwnProperty('createdAt'), 'User has createdAt field');
      assert(user.hasOwnProperty('updatedAt'), 'User has updatedAt field');
    }
    
    // Test 2: Check if teams endpoint works with Prisma/PostgreSQL
    const { response: teamsResponse, data: teamsData } = await makeRequest('/teams');
    assert(teamsResponse && teamsResponse.ok, 'Teams endpoint is accessible');
    
    if (teamsData && teamsData.length > 0) {
      const team = teamsData[0];
      assert(team.hasOwnProperty('id'), 'Team has id field');
      assert(team.hasOwnProperty('name'), 'Team has name field');
      assert(team.hasOwnProperty('isLocked'), 'Team has isLocked field');
      assert(team.hasOwnProperty('lowestOdds'), 'Team has lowestOdds field');
      assert(team.hasOwnProperty('highestOdds'), 'Team has highestOdds field');
      assert(team.hasOwnProperty('createdAt'), 'Team has createdAt field');
      assert(team.hasOwnProperty('updatedAt'), 'Team has updatedAt field');
    }
    
    // Test 3: Check if weekly bets endpoint works with Prisma/PostgreSQL
    const { response: betsResponse, data: betsData } = await makeRequest('/weekly-bets?week=1&season=2025');
    assert(betsResponse && betsResponse.ok, 'Weekly bets endpoint is accessible');
    
    if (betsData && betsData.length > 0) {
      const bet = betsData[0];
      assert(bet.hasOwnProperty('id'), 'Weekly bet has id field');
      assert(bet.hasOwnProperty('userId'), 'Weekly bet has userId field');
      assert(bet.hasOwnProperty('week'), 'Weekly bet has week field');
      assert(bet.hasOwnProperty('season'), 'Weekly bet has season field');
      assert(bet.hasOwnProperty('prop'), 'Weekly bet has prop field');
      assert(bet.hasOwnProperty('betType'), 'Weekly bet has betType field');
      assert(bet.hasOwnProperty('status'), 'Weekly bet has status field');
    }
    
    // Test 4: Test database CRUD operations
    await this.testDatabaseCRUD();
  }
  
  static async testDatabaseCRUD() {
    log('Testing Database CRUD operations...');
    
    // Test user creation
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    };
    
    const { response: createUserResponse, data: createdUser } = await makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    
    assert(createUserResponse && createUserResponse.ok, 'User creation works with Prisma/PostgreSQL');
    assert(createdUser && createdUser.id, 'Created user has ID');
    
    // Test team creation
    const testTeam = {
      name: 'Test Team',
      description: 'Test team description',
      color: '#ff0000',
      lowestOdds: -120,
      highestOdds: 130
    };
    
    const { response: createTeamResponse, data: createdTeam } = await makeRequest('/teams', {
      method: 'POST',
      body: JSON.stringify(testTeam)
    });
    
    assert(createTeamResponse && createTeamResponse.ok, 'Team creation works with Prisma/PostgreSQL');
    assert(createdTeam && createdTeam.id, 'Created team has ID');
    
    // Test bet creation
    const testBet = {
      userId: createdUser.id,
      week: 1,
      season: 2025,
      prop: 'Test prop bet',
      odds: 150,
      betType: 'BOZO'
    };
    
    const { response: createBetResponse, data: createdBet } = await makeRequest('/weekly-bets', {
      method: 'POST',
      body: JSON.stringify(testBet)
    });
    
    assert(createBetResponse && createBetResponse.ok, 'Bet creation works with Prisma/PostgreSQL');
    assert(createdBet && createdBet.id, 'Created bet has ID');
    
    // Test data retrieval
    const { response: usersResponse, data: usersData } = await makeRequest('/users');
    const testUserExists = usersData.find(user => user.id === createdUser.id);
    assert(testUserExists, 'Created user can be retrieved from Prisma/PostgreSQL');
    
    const { response: teamsResponse, data: teamsData } = await makeRequest('/teams');
    const testTeamExists = teamsData.find(team => team.id === createdTeam.id);
    assert(testTeamExists, 'Created team can be retrieved from Prisma/PostgreSQL');
    
    const { response: betsResponse, data: betsData } = await makeRequest('/weekly-bets');
    const testBetExists = betsData.find(bet => bet.id === createdBet.id);
    assert(testBetExists, 'Created bet can be retrieved from Prisma/PostgreSQL');
    
    // Cleanup - delete test data
    await makeRequest(`/users/${createdUser.id}`, { method: 'DELETE' });
    await makeRequest(`/teams/${createdTeam.id}`, { method: 'DELETE' });
    await makeRequest(`/weekly-bets/${createdBet.id}`, { method: 'DELETE' });
    
    log('Database CRUD operations completed successfully');
  }
}

class ValidationTests {
  static async run() {
    log('Running Validation Tests...');
    
    // Test 1: Invalid user creation
    const { response: invalidUserResponse } = await makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify({}) // Missing required fields
    });
    
    assert(invalidUserResponse && invalidUserResponse.status === 400, 'Invalid user creation returns 400');
    
    // Test 2: Invalid team creation
    const { response: invalidTeamResponse } = await makeRequest('/teams', {
      method: 'POST',
      body: JSON.stringify({}) // Missing required fields
    });
    
    assert(invalidTeamResponse && invalidTeamResponse.status === 400, 'Invalid team creation returns 400');
    
    // Test 3: Invalid bet creation
    const { response: invalidBetResponse } = await makeRequest('/weekly-bets', {
      method: 'POST',
      body: JSON.stringify({}) // Missing required fields
    });
    
    assert(invalidBetResponse && invalidBetResponse.status === 400, 'Invalid bet creation returns 400');
  }
}

class PerformanceTests {
  static async run() {
    log('Running Performance Tests...');
    
    // Test 1: Response time for users endpoint
    const startTime = Date.now();
    const { response: usersResponse } = await makeRequest('/users');
    const responseTime = Date.now() - startTime;
    
    assert(usersResponse && usersResponse.ok, 'Users endpoint responds successfully');
    assert(responseTime < 1000, `Users endpoint responds within 1 second (${responseTime}ms)`);
    
    // Test 2: Response time for teams endpoint
    const startTime2 = Date.now();
    const { response: teamsResponse } = await makeRequest('/teams');
    const responseTime2 = Date.now() - startTime2;
    
    assert(teamsResponse && teamsResponse.ok, 'Teams endpoint responds successfully');
    assert(responseTime2 < 1000, `Teams endpoint responds within 1 second (${responseTime2}ms)`);
    
    // Test 3: Response time for weekly bets endpoint
    const startTime3 = Date.now();
    const { response: betsResponse } = await makeRequest('/weekly-bets?week=1&season=2025');
    const responseTime3 = Date.now() - startTime3;
    
    assert(betsResponse && betsResponse.ok, 'Weekly bets endpoint responds successfully');
    assert(responseTime3 < 1000, `Weekly bets endpoint responds within 1 second (${responseTime3}ms)`);
  }
}

// Cleanup function to remove test data
async function cleanupTestData() {
  try {
    // Clean up created test data
    if (testData.createdUserId) {
      await makeRequest(`/users/${testData.createdUserId}`, { method: 'DELETE' });
      log('Cleaned up test user');
    }
    if (testData.createdTeamId) {
      await makeRequest(`/teams/${testData.createdTeamId}`, { method: 'DELETE' });
      log('Cleaned up test team');
    }
  } catch (error) {
    log(`Cleanup warning: ${error.message}`, 'warn');
  }
}

// Main test runner
async function runTests() {
  log('Starting NFL Bozo Bets Test Suite...');
  log(`Testing against: ${BASE_URL}`);
  
  try {
    await SmokeTests.run();
    await APITests.run();
    await DatabaseTests.run();
    await ValidationTests.run();
    await PerformanceTests.run();
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
  }
  
  // Print results
  log('\n=== TEST RESULTS ===');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.errors.length > 0) {
    log('\n=== FAILED TESTS ===');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`\nSuccess Rate: ${successRate}%`);
  
  // Cleanup test data
  await cleanupTestData();
  
  if (testResults.failed > 0) {
    process.exit(1);
  } else {
    log('All tests passed! 🎉', 'success');
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  SmokeTests,
  APITests,
  DatabaseTests,
  ValidationTests,
  PerformanceTests,
  runTests
};
