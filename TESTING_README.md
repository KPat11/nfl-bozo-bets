# NFL Bozo Bets - Testing Guide

This guide explains how to run and manage tests for the NFL Bozo Bets application.

## Quick Start

### 1. Setup Test Environment
```bash
# Install dependencies
npm install

# Start the application
npm run dev

# In another terminal, setup test data
npm run test:setup
```

### 2. Run Tests
```bash
# Run all tests
npm run test:run:all

# Run specific test suite
npm run test:run:smoke
npm run test:run:api
npm run test:run:db
```

## Test Types

### Smoke Tests
Basic functionality verification to ensure the application is working.
```bash
npm run test:smoke
```

### API Tests
Backend endpoint functionality testing.
```bash
npm run test:api
```

### Database Tests
Data integrity and schema validation.
```bash
npm run test:db
```

### Validation Tests
Input validation and error handling.
```bash
npm run test:validation
```

### Performance Tests
Load and response time testing.
```bash
npm run test:performance
```

## Test Data Management

### Setup Test Data
Creates sample users, teams, and bets for testing.
```bash
npm run test:setup
```

### Cleanup Test Data
Removes all test data from the database.
```bash
npm run test:cleanup
```

## Test Reports

### Generate Report
Runs all tests and generates a comprehensive report.
```bash
npm run test:report
```

Reports are saved in the `test-results/` directory with timestamps.

## Manual Testing

### 1. User Management
- [ ] Add new member
- [ ] Edit member details
- [ ] Assign member to team
- [ ] Delete member

### 2. Team Management
- [ ] Create team
- [ ] Edit team details
- [ ] Add/remove team members
- [ ] Delete team

### 3. Bet Submission
- [ ] Submit bozo bet
- [ ] Submit favorite pick
- [ ] Edit existing bet
- [ ] Delete bet
- [ ] Mark payment status

### 4. Leaderboard
- [ ] View bozo leaderboard
- [ ] Check record calculations
- [ ] Verify medal/emoji display

### 5. UI/UX
- [ ] Mobile responsiveness
- [ ] Form validation
- [ ] Error handling
- [ ] Loading states

## Test Configuration

Edit `test-config.json` to customize test settings:

```json
{
  "testSuites": {
    "smoke": {
      "timeout": 30000,
      "retries": 2
    }
  },
  "environments": {
    "development": {
      "baseUrl": "http://localhost:3000"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Application not running**
   ```bash
   npm run dev
   ```

2. **Database connection issues**
   ```bash
   npm run db:push
   ```

3. **Test data conflicts**
   ```bash
   npm run test:cleanup
   npm run test:setup
   ```

4. **Permission issues**
   ```bash
   chmod +x test-suite.js
   chmod +x test-data-setup.js
   chmod +x run-tests.js
   ```

### Debug Mode

Run tests with verbose output:
```bash
DEBUG=true npm run test:run:all
```

### Test Logs

Check test results in:
- `test-results/` - Individual test results
- `test-results/test-report-*.md` - Comprehensive reports

## Continuous Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run db:push
      - run: npm run test:setup
      - run: npm run test:run:all
```

### Pre-commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
echo "npm run test:run:smoke" > .husky/pre-commit
chmod +x .husky/pre-commit
```

## Best Practices

1. **Run smoke tests before commits**
2. **Clean up test data after testing**
3. **Check test reports for failures**
4. **Update tests when adding features**
5. **Use descriptive test names**
6. **Keep tests independent**
7. **Mock external services**

## Test Coverage

Current test coverage includes:
- ✅ User management (CRUD)
- ✅ Team management (CRUD)
- ✅ Bet submission and management
- ✅ Payment tracking
- ✅ API endpoints
- ✅ Database schema validation
- ✅ Form validation
- ✅ Error handling
- ✅ Performance testing

## Contributing

When adding new features:
1. Add corresponding tests
2. Update test data if needed
3. Run full test suite
4. Update documentation

## Support

For testing issues:
1. Check the troubleshooting section
2. Review test logs
3. Verify application is running
4. Check database connectivity
