# Workflows Management API Integration Tests

This directory contains integration tests for the workflows_management plugin server API routes.

## What are Integration Tests?

These tests differ from unit tests in that they:

- Run against a **real Kibana server instance** with Elasticsearch
- Test the full HTTP request/response cycle
- Validate cross-plugin integration
- Use actual network requests via the request helper

## Running the Tests

To run the integration tests:

```bash
# Run all integration tests for workflows_management
yarn test:jest_integration src/platform/plugins/shared/workflows_management/server/integration_tests

# Run a specific test file
yarn test:jest_integration src/platform/plugins/shared/workflows_management/server/integration_tests/routes/get_workflow_by_id.integration.test.ts

# Watch mode
yarn test:jest_integration --watch src/platform/plugins/shared/workflows_management/server/integration_tests
```

## Test Structure

### File Organization

```
server/integration_tests/
├── lib/
│   ├── setup_integration_environment.ts  # Test environment setup utilities
│   └── index.ts                          # Exports
├── routes/
│   └── get_workflow_by_id.integration.test.ts  # Route-specific tests
└── README.md                             # This file
```

### Test Utilities

The `setupIntegrationEnvironment()` function in `lib/setup_integration_environment.ts`:

- Starts a local Elasticsearch instance
- Creates a Kibana root with all plugins loaded
- Provides cleanup utilities for test data
- Returns a test harness with access to:
  - `root` - The Kibana root instance
  - `request` - HTTP request helpers
  - `esClient` - Elasticsearch client
  - `cleanupAfterEach` - Clean up test data between tests
  - `cleanupAfterAll` - Shut down servers after all tests

### Writing New Integration Tests

Here's a template for creating new integration tests:

```typescript
import { setupIntegrationEnvironment, type TestEnvironmentUtils } from '../lib';

describe('Your API Endpoint - Integration Tests', () => {
  let testHarness: TestEnvironmentUtils;
  let root: TestEnvironmentUtils['root'];
  let request: TestEnvironmentUtils['request'];

  beforeAll(async () => {
    testHarness = await setupIntegrationEnvironment();
    ({ root, request } = testHarness);
  });

  afterAll(async () => {
    await testHarness.cleanupAfterAll();
  });

  beforeEach(async () => {
    await testHarness.cleanupAfterEach();
  });

  it('should test the endpoint behavior', async () => {
    const response = await request
      .get(root, '/api/workflows/test-id')
      .set('x-elastic-internal-origin', 'workflows-test')
      .expect(404);

    expect(response.body).toHaveProperty('message');
  });
});
```

## Configuration

Integration tests use the `jest.integration.config.js` configuration which:

- Extends `@kbn/test/jest_integration` preset
- Sets the root directory to the workspace root
- Includes all `.integration.test.ts` files in the plugin

## Differences from Unit Tests

| Aspect      | Unit Tests               | Integration Tests           |
| ----------- | ------------------------ | --------------------------- |
| Location    | Same directory as source | `server/integration_tests/` |
| File suffix | `.test.ts`               | `.integration.test.ts`      |
| Server      | Mocked                   | Real Kibana + ES            |
| HTTP        | Mock responses           | Real HTTP requests          |
| Speed       | Fast                     | Slower                      |
| Coverage    | Logic isolation          | Full stack                  |

## Best Practices

1. **Keep tests focused** - Test one endpoint at a time
2. **Clean up data** - Use `cleanupAfterEach` to avoid test pollution
3. **Use meaningful names** - File names should indicate what they test
4. **Test error cases** - Include both success and failure scenarios
5. **Mock dependencies carefully** - Only mock external services, not Kibana internals

## Troubleshooting

### Tests fail with "cannot find module"

Make sure you're running tests from the repository root with the `yarn test:jest_integration` command.

### Tests timeout

Integration tests can be slow. Increase timeout in individual tests if needed:

```typescript
beforeAll(async () => {
  // ... setup code
}, 60000); // 60 second timeout
```

### Elasticsearch connection errors

Ensure port conflicts aren't occurring. Check that no other ES instances are running.

### Plugin not loaded

The plugin should auto-load when using `{ oss: false }` in the root creation. Verify the plugin is in `src/platform/plugins/shared/workflows_management`.
