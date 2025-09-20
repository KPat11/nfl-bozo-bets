# NFL Bozo Bets - Testing Documentation

## Table of Contents
1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Smoke Tests](#smoke-tests)
4. [User Acceptance Tests (UAT)](#user-acceptance-tests-uat)
5. [Database Validation Tests](#database-validation-tests)
6. [API Endpoint Tests](#api-endpoint-tests)
7. [UI/UX Tests](#uiux-tests)
8. [Performance Tests](#performance-tests)
9. [Security Tests](#security-tests)
10. [Integration Tests](#integration-tests)
11. [Regression Tests](#regression-tests)
12. [Test Data Setup](#test-data-setup)
13. [Test Execution Checklist](#test-execution-checklist)

## Overview

This document outlines comprehensive testing procedures for the NFL Bozo Bets application, covering all aspects from basic functionality to advanced system integration.

### Test Categories
- **Smoke Tests**: Basic functionality verification
- **UAT**: User workflow validation
- **Database Tests**: Data integrity and schema validation
- **API Tests**: Backend endpoint functionality
- **UI/UX Tests**: Frontend interaction and responsiveness
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and data protection
- **Integration Tests**: Cross-component functionality

## Test Environment Setup

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

### Test Data Requirements
- At least 3 test users
- 2 test teams
- Sample weekly bets for different weeks
- Mock FanDuel props data
- Payment records

## Smoke Tests

### 1. Application Startup
- [ ] Application loads without errors
- [ ] Database connection established
- [ ] All API endpoints accessible
- [ ] No console errors on page load

### 2. Basic Navigation
- [ ] All tabs load correctly (Bets, Teams, Bozos, Leaderboard, Management)
- [ ] Week navigation works (previous/next)
- [ ] Modal dialogs open and close properly

### 3. Core Components
- [ ] AddMemberModal opens and closes
- [ ] SubmitBetModal opens and closes
- [ ] TeamsSection displays correctly
- [ ] BozoLeaderboard renders

## User Acceptance Tests (UAT)

### 1. User Management Workflow

#### Test Case: Add New Member
**Preconditions**: User is on the main dashboard
**Steps**:
1. Click "Add Member" button
2. Fill in member name
3. Select a team
4. Click "Add Member"
**Expected Results**:
- Member is added to database
- Member appears in user list
- Success message displayed
- Modal closes automatically

#### Test Case: Edit Member
**Preconditions**: Member exists in system
**Steps**:
1. Navigate to Management tab
2. Click edit button on a member
3. Modify member details
4. Save changes
**Expected Results**:
- Changes saved to database
- UI updates reflect changes
- Success message displayed

### 2. Team Management Workflow

#### Test Case: Create Team
**Preconditions**: User is on Teams tab
**Steps**:
1. Click "Create Team" button
2. Enter team name and description
3. Select team color
4. Click "Create Team"
**Expected Results**:
- Team created in database
- Team appears in teams list
- Success message displayed
- Modal closes

#### Test Case: Add Member to Team
**Preconditions**: Team and member exist
**Steps**:
1. Navigate to Management tab
2. Select a member
3. Assign to a team
4. Save changes
**Expected Results**:
- Member's teamId updated in database
- Member appears in team member list
- UI reflects team assignment

### 3. Bet Submission Workflow

#### Test Case: Submit Bozo Bet
**Preconditions**: User is logged in and has team assignment
**Steps**:
1. Click "Submit Bet" button
2. Select "Bozo Bet" type
3. Select team member
4. Enter prop bet description
5. Set odds (optional)
6. Click "Submit Bet"
**Expected Results**:
- Bet saved to database with correct betType
- Bet appears in Bozo Bets section
- Form resets and modal closes
- Success message displayed

#### Test Case: Submit Favorite Pick
**Preconditions**: User is logged in and has team assignment
**Steps**:
1. Click "Submit Bet" button
2. Select "Favorite Pick" type
3. Select team member
4. Enter prop bet description
5. Set odds (optional)
6. Click "Submit Bet"
**Expected Results**:
- Bet saved to database with betType 'FAVORITE'
- Bet appears in Favorite Picks section
- Form resets and modal closes
- Success message displayed

### 4. Bet Management Workflow

#### Test Case: Edit Bet
**Preconditions**: Bet exists in system
**Steps**:
1. Click edit button on a bet
2. Modify bet details
3. Save changes
**Expected Results**:
- Bet updated in database
- UI reflects changes
- Success message displayed

#### Test Case: Delete Bet
**Preconditions**: Bet exists in system
**Steps**:
1. Click delete button on a bet
2. Confirm deletion
**Expected Results**:
- Bet removed from database
- Associated payments removed
- Bet disappears from UI
- Success message displayed

### 5. Payment Management Workflow

#### Test Case: Mark Payment as Paid
**Preconditions**: Bet exists with unpaid status
**Steps**:
1. Click payment toggle button
2. Confirm payment status change
**Expected Results**:
- Payment status updated in database
- UI reflects paid status
- Success message displayed

### 6. Leaderboard Workflow

#### Test Case: View Bozo Leaderboard
**Preconditions**: Users have bet history
**Steps**:
1. Navigate to Leaderboard tab
2. View bozo statistics
3. Check record calculations
**Expected Results**:
- Leaderboard displays correctly
- Records calculated accurately
- Medals/emojis display properly

## Database Validation Tests

### 1. Schema Validation

#### Test Case: User Table
**Preconditions**: Database is set up
**Steps**:
1. Check user table structure
2. Verify required fields exist
3. Check data types and constraints
**Expected Results**:
- All required fields present
- Data types match schema
- Constraints enforced properly

#### Test Case: WeeklyBet Table
**Preconditions**: Database is set up
**Steps**:
1. Check weekly_bets table structure
2. Verify betType field exists
3. Check unique constraints
**Expected Results**:
- betType field present with correct enum values
- Unique constraint on (userId, week, season, betType)
- Foreign key relationships intact

#### Test Case: Team Table
**Preconditions**: Database is set up
**Steps**:
1. Check team table structure
2. Verify teamId field in users table
3. Check relationships
**Expected Results**:
- Team table exists with correct structure
- teamId field in users table
- Relationships work properly

### 2. Data Integrity Tests

#### Test Case: User Creation
**Preconditions**: Database is clean
**Steps**:
1. Create user with valid data
2. Create user with invalid data
3. Check database state
**Expected Results**:
- Valid user created successfully
- Invalid user creation fails with proper error
- Database remains consistent

#### Test Case: Bet Creation
**Preconditions**: User exists
**Steps**:
1. Create bet with valid data
2. Create duplicate bet (same user, week, season, betType)
3. Check database state
**Expected Results**:
- Valid bet created successfully
- Duplicate bet creation fails with proper error
- Database remains consistent

### 3. Data Relationships

#### Test Case: User-Team Relationship
**Preconditions**: User and team exist
**Steps**:
1. Assign user to team
2. Check user.teamId field
3. Verify team.users relationship
**Expected Results**:
- user.teamId updated correctly
- team.users includes the user
- Relationships work bidirectionally

#### Test Case: User-Bet Relationship
**Preconditions**: User exists
**Steps**:
1. Create bet for user
2. Check bet.userId field
3. Verify user.weeklyBets relationship
**Expected Results**:
- bet.userId set correctly
- user.weeklyBets includes the bet
- Relationships work bidirectionally

## API Endpoint Tests

### 1. User API Tests

#### Test Case: GET /api/users
**Preconditions**: Users exist in database
**Steps**:
1. Send GET request to /api/users
2. Check response status and data
**Expected Results**:
- Status 200
- Returns array of users
- Includes all required fields

#### Test Case: POST /api/users
**Preconditions**: Database is clean
**Steps**:
1. Send POST request with valid user data
2. Check response and database state
**Expected Results**:
- Status 201
- User created in database
- Returns created user data

#### Test Case: POST /api/users (Invalid Data)
**Preconditions**: Database is clean
**Steps**:
1. Send POST request with invalid data
2. Check response
**Expected Results**:
- Status 400
- Returns validation error
- No user created in database

### 2. Team API Tests

#### Test Case: GET /api/teams
**Preconditions**: Teams exist in database
**Steps**:
1. Send GET request to /api/teams
2. Check response status and data
**Expected Results**:
- Status 200
- Returns array of teams
- Includes user relationships

#### Test Case: POST /api/teams
**Preconditions**: Database is clean
**Steps**:
1. Send POST request with valid team data
2. Check response and database state
**Expected Results**:
- Status 201
- Team created in database
- Returns created team data

### 3. Weekly Bet API Tests

#### Test Case: POST /api/weekly-bets
**Preconditions**: User exists
**Steps**:
1. Send POST request with valid bet data
2. Check response and database state
**Expected Results**:
- Status 201
- Bet created in database
- Returns created bet data

#### Test Case: POST /api/weekly-bets (Duplicate)
**Preconditions**: Bet exists for user/week/season/betType
**Steps**:
1. Send POST request with duplicate bet data
2. Check response
**Expected Results**:
- Status 409
- Returns conflict error
- No duplicate bet created

### 4. Payment API Tests

#### Test Case: POST /api/payments/mark
**Preconditions**: Bet exists
**Steps**:
1. Send POST request to mark payment
2. Check response and database state
**Expected Results**:
- Status 200
- Payment status updated
- Returns updated payment data

## UI/UX Tests

### 1. Responsive Design Tests

#### Test Case: Mobile View
**Preconditions**: Application is running
**Steps**:
1. Resize browser to mobile dimensions
2. Test all major components
3. Check navigation and interactions
**Expected Results**:
- All components display properly
- Navigation works on mobile
- Touch interactions work correctly

#### Test Case: Tablet View
**Preconditions**: Application is running
**Steps**:
1. Resize browser to tablet dimensions
2. Test layout and interactions
**Expected Results**:
- Layout adapts to tablet size
- All functionality works
- No horizontal scrolling

### 2. Form Validation Tests

#### Test Case: SubmitBetModal Validation
**Preconditions**: Modal is open
**Steps**:
1. Try to submit without required fields
2. Try to submit with invalid data
3. Check error messages
**Expected Results**:
- Validation errors displayed
- Form submission blocked
- Clear error messages shown

#### Test Case: AddMemberModal Validation
**Preconditions**: Modal is open
**Steps**:
1. Try to submit without required fields
2. Try to submit with invalid data
3. Check error messages
**Expected Results**:
- Validation errors displayed
- Form submission blocked
- Clear error messages shown

### 3. User Experience Tests

#### Test Case: Loading States
**Preconditions**: Application is running
**Steps**:
1. Perform actions that trigger loading
2. Check loading indicators
3. Verify smooth transitions
**Expected Results**:
- Loading indicators shown
- No jarring transitions
- User feedback provided

#### Test Case: Error Handling
**Preconditions**: Application is running
**Steps**:
1. Trigger various error conditions
2. Check error messages
3. Verify recovery options
**Expected Results**:
- Clear error messages
- Graceful error handling
- Recovery options available

## Performance Tests

### 1. Load Testing

#### Test Case: Multiple Users
**Preconditions**: Application is running
**Steps**:
1. Simulate multiple concurrent users
2. Monitor response times
3. Check resource usage
**Expected Results**:
- Response times remain acceptable
- No memory leaks
- Database performance stable

#### Test Case: Large Dataset
**Preconditions**: Large amount of data in database
**Steps**:
1. Load application with large dataset
2. Test all major operations
3. Monitor performance
**Expected Results**:
- Application loads within acceptable time
- Operations complete successfully
- No performance degradation

### 2. Stress Testing

#### Test Case: Rapid Operations
**Preconditions**: Application is running
**Steps**:
1. Perform rapid operations (create, edit, delete)
2. Monitor system stability
3. Check for errors
**Expected Results**:
- System remains stable
- No data corruption
- Error handling works properly

## Security Tests

### 1. Input Validation

#### Test Case: SQL Injection
**Preconditions**: Application is running
**Steps**:
1. Attempt SQL injection in form fields
2. Check database state
3. Verify error handling
**Expected Results**:
- SQL injection attempts blocked
- No database corruption
- Proper error messages

#### Test Case: XSS Prevention
**Preconditions**: Application is running
**Steps**:
1. Attempt XSS in form fields
2. Check rendered output
3. Verify sanitization
**Expected Results**:
- XSS attempts blocked
- Output properly sanitized
- No script execution

### 2. Data Protection

#### Test Case: Sensitive Data
**Preconditions**: Application is running
**Steps**:
1. Check data transmission
2. Verify data storage
3. Test data access controls
**Expected Results**:
- Data transmitted securely
- Sensitive data properly protected
- Access controls enforced

## Integration Tests

### 1. Database Integration

#### Test Case: Prisma Client
**Preconditions**: Database is set up
**Steps**:
1. Test all Prisma operations
2. Check connection handling
3. Verify transaction support
**Expected Results**:
- All operations work correctly
- Connection handling robust
- Transactions work properly

### 2. API Integration

#### Test Case: Frontend-Backend Communication
**Preconditions**: Application is running
**Steps**:
1. Test all API calls from frontend
2. Check error handling
3. Verify data flow
**Expected Results**:
- All API calls work correctly
- Error handling works
- Data flows properly

### 3. External Service Integration

#### Test Case: FanDuel API Mock
**Preconditions**: Application is running
**Steps**:
1. Test prop search functionality
2. Check odds fetching
3. Verify data processing
**Expected Results**:
- Prop search works correctly
- Odds fetched properly
- Data processed correctly

## Regression Tests

### 1. Core Functionality

#### Test Case: User Management
**Preconditions**: Previous version working
**Steps**:
1. Test all user management features
2. Compare with previous version
3. Check for regressions
**Expected Results**:
- All features work as before
- No functionality lost
- Performance maintained or improved

#### Test Case: Bet Management
**Preconditions**: Previous version working
**Steps**:
1. Test all bet management features
2. Compare with previous version
3. Check for regressions
**Expected Results**:
- All features work as before
- No functionality lost
- Performance maintained or improved

## Test Data Setup

### 1. Test Users
```javascript
const testUsers = [
  {
    name: "Test User 1",
    email: "test1@example.com",
    teamId: "team1"
  },
  {
    name: "Test User 2", 
    email: "test2@example.com",
    teamId: "team1"
  },
  {
    name: "Test User 3",
    email: "test3@example.com",
    teamId: "team2"
  }
]
```

### 2. Test Teams
```javascript
const testTeams = [
  {
    name: "Test Team 1",
    description: "First test team",
    color: "#ff0000"
  },
  {
    name: "Test Team 2",
    description: "Second test team", 
    color: "#0000ff"
  }
]
```

### 3. Test Bets
```javascript
const testBets = [
  {
    userId: "user1",
    week: 1,
    season: 2025,
    prop: "Test prop bet 1",
    odds: 150,
    betType: "BOZO"
  },
  {
    userId: "user2",
    week: 1,
    season: 2025,
    prop: "Test prop bet 2",
    odds: -110,
    betType: "FAVORITE"
  }
]
```

## Test Execution Checklist

### Pre-Test Setup
- [ ] Environment variables configured
- [ ] Database schema up to date
- [ ] Test data loaded
- [ ] Application running
- [ ] Browser cleared of cache

### Test Execution
- [ ] Run smoke tests
- [ ] Execute UAT scenarios
- [ ] Perform database validation
- [ ] Test API endpoints
- [ ] Verify UI/UX functionality
- [ ] Run performance tests
- [ ] Execute security tests
- [ ] Perform integration tests
- [ ] Run regression tests

### Post-Test Cleanup
- [ ] Clean up test data
- [ ] Reset database state
- [ ] Clear browser cache
- [ ] Document test results
- [ ] Report any issues found

### Test Results Documentation
- [ ] Record test execution time
- [ ] Document any failures
- [ ] Note performance metrics
- [ ] List any issues found
- [ ] Provide recommendations

## Test Automation

### Automated Test Scripts
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run database tests
npm run test:db

# Run performance tests
npm run test:performance
```

### Continuous Integration
- [ ] Tests run on every commit
- [ ] Tests run on pull requests
- [ ] Tests run on deployment
- [ ] Test results reported
- [ ] Failed tests block deployment

## Conclusion

This comprehensive testing documentation ensures that the NFL Bozo Bets application is thoroughly tested across all dimensions. Regular execution of these tests will help maintain application quality and catch issues early in the development cycle.

For questions or updates to this testing documentation, please refer to the project repository or contact the development team.
