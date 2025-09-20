#!/usr/bin/env node

/**
 * NFL Bozo Bets - Test Data Setup Script
 * 
 * This script sets up test data for the NFL Bozo Bets application.
 * It creates users, teams, and sample bets for testing purposes.
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testData = {
  users: [
    {
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com'
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com'
    },
    {
      name: 'Tom Brown',
      email: 'tom.brown@example.com'
    }
  ],
  teams: [
    {
      name: 'The Bozos',
      description: 'The original bozo betting team',
      color: '#ff0000'
    },
    {
      name: 'The Favorites',
      description: 'Safe bet enthusiasts',
      color: '#00ff00'
    },
    {
      name: 'The Wildcards',
      description: 'High risk, high reward',
      color: '#0000ff'
    }
  ],
  bets: [
    {
      week: 1,
      season: 2025,
      prop: 'Josh Allen over 250.5 passing yards',
      odds: 150,
      betType: 'BOZO'
    },
    {
      week: 1,
      season: 2025,
      prop: 'Eagles ML vs Cowboys',
      odds: -110,
      betType: 'FAVORITE'
    },
    {
      week: 1,
      season: 2025,
      prop: 'Travis Kelce over 6.5 receptions',
      odds: 200,
      betType: 'BOZO'
    },
    {
      week: 1,
      season: 2025,
      prop: 'Chiefs -3.5 vs Bills',
      odds: -120,
      betType: 'FAVORITE'
    },
    {
      week: 2,
      season: 2025,
      prop: 'Lamar Jackson over 75.5 rushing yards',
      odds: 180,
      betType: 'BOZO'
    },
    {
      week: 2,
      season: 2025,
      prop: 'Ravens ML vs Steelers',
      odds: -105,
      betType: 'FAVORITE'
    }
  ]
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
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

async function createUsers() {
  log('Creating test users...');
  const createdUsers = [];
  
  for (const userData of testData.users) {
    const { response, data } = await makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response && response.ok) {
      createdUsers.push(data);
      log(`Created user: ${userData.name}`, 'success');
    } else {
      log(`Failed to create user: ${userData.name}`, 'error');
    }
  }
  
  return createdUsers;
}

async function createTeams() {
  log('Creating test teams...');
  const createdTeams = [];
  
  for (const teamData of testData.teams) {
    const { response, data } = await makeRequest('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
    
    if (response && response.ok) {
      createdTeams.push(data);
      log(`Created team: ${teamData.name}`, 'success');
    } else {
      log(`Failed to create team: ${teamData.name}`, 'error');
    }
  }
  
  return createdTeams;
}

async function assignUsersToTeams(users, teams) {
  log('Assigning users to teams...');
  
  // Assign users to teams in a round-robin fashion
  users.forEach((user, index) => {
    const teamIndex = index % teams.length;
    const team = teams[teamIndex];
    
    makeRequest(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ teamId: team.id })
    }).then(({ response }) => {
      if (response && response.ok) {
        log(`Assigned ${user.name} to ${team.name}`, 'success');
      } else {
        log(`Failed to assign ${user.name} to ${team.name}`, 'error');
      }
    });
  });
}

async function createBets(users) {
  log('Creating test bets...');
  
  for (const betData of testData.bets) {
    // Assign bet to a random user
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    const betPayload = {
      ...betData,
      userId: randomUser.id
    };
    
    const { response, data } = await makeRequest('/weekly-bets', {
      method: 'POST',
      body: JSON.stringify(betPayload)
    });
    
    if (response && response.ok) {
      log(`Created bet: ${betData.prop} (${betData.betType})`, 'success');
    } else {
      log(`Failed to create bet: ${betData.prop}`, 'error');
    }
  }
}

async function createPayments(users) {
  log('Creating test payments...');
  
  // Get all bets
  const { response: betsResponse, data: betsData } = await makeRequest('/weekly-bets?week=1&season=2025');
  
  if (betsResponse && betsResponse.ok && betsData) {
    for (const bet of betsData) {
      // Randomly mark some payments as paid
      const isPaid = Math.random() > 0.5;
      
      const { response } = await makeRequest('/payments/mark', {
        method: 'POST',
        body: JSON.stringify({
          betId: bet.id,
          status: isPaid ? 'PAID' : 'UNPAID'
        })
      });
      
      if (response && response.ok) {
        log(`Created payment for bet ${bet.id}: ${isPaid ? 'PAID' : 'UNPAID'}`, 'success');
      } else {
        log(`Failed to create payment for bet ${bet.id}`, 'error');
      }
    }
  }
}

async function setupTestData() {
  log('Starting test data setup...');
  log(`Using API base: ${API_BASE}`);
  
  try {
    // Check if application is running
    const healthResponse = await fetch(BASE_URL);
    if (!healthResponse.ok) {
      throw new Error('Application is not running. Please start the development server first.');
    }
    
    // Create users
    const users = await createUsers();
    if (users.length === 0) {
      throw new Error('No users were created. Check the API endpoint.');
    }
    
    // Create teams
    const teams = await createTeams();
    if (teams.length === 0) {
      throw new Error('No teams were created. Check the API endpoint.');
    }
    
    // Assign users to teams
    await assignUsersToTeams(users, teams);
    
    // Wait a bit for team assignments to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create bets
    await createBets(users);
    
    // Wait a bit for bets to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create payments
    await createPayments(users);
    
    log('Test data setup completed successfully!', 'success');
    log(`Created ${users.length} users, ${teams.length} teams, and ${testData.bets.length} bets`);
    
  } catch (error) {
    log(`Test data setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

async function cleanupTestData() {
  log('Cleaning up test data...');
  
  try {
    // Get all users
    const { response: usersResponse, data: usersData } = await makeRequest('/users');
    if (usersResponse && usersResponse.ok && usersData) {
      for (const user of usersData) {
        await makeRequest(`/users/${user.id}`, { method: 'DELETE' });
        log(`Deleted user: ${user.name}`, 'success');
      }
    }
    
    // Get all teams
    const { response: teamsResponse, data: teamsData } = await makeRequest('/teams');
    if (teamsResponse && teamsResponse.ok && teamsData) {
      for (const team of teamsData) {
        await makeRequest(`/teams/${team.id}`, { method: 'DELETE' });
        log(`Deleted team: ${team.name}`, 'success');
      }
    }
    
    log('Test data cleanup completed!', 'success');
    
  } catch (error) {
    log(`Test data cleanup failed: ${error.message}`, 'error');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    await cleanupTestData();
  } else {
    await setupTestData();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  setupTestData,
  cleanupTestData,
  testData
};
