# Vitest Testing Setup - Georgian Distribution System

This document provides comprehensive documentation for the Vitest testing framework setup in the Georgian Distribution System.

## Overview

The testing framework is built with **Vitest** as the main test runner, paired with **React Testing Library** for component testing, **Jest DOM** for DOM assertions, and **@testing-library/jest-dom** for extended matchers.

## 📦 Dependencies Added

### Core Testing Dependencies
```json
{
  "vitest": "^2.1.9",
  "@testing-library/react": "^16.1.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.5.2",
  "@vitest/coverage-v8": "^2.1.9",
  "happy-dom": "^15.11.1"
}
```

## 🏗️ Configuration Files

### 1. `vitest.config.ts`
- **Location**: `frontend/vitest.config.ts`
- **Purpose**: Main Vitest configuration for Next.js 15 compatibility
- **Features**: 
  - Next.js 15 transformer
  - Coverage reporting with v8
  - Setup file configuration
  - Test environment setup

### 2. `src/setupTests.ts`
- **Location**: `frontend/src/setupTests.ts`
- **Purpose**: Test environment setup and global mocks
- **Features**:
  - Georgian language test data utilities
  - Supabase client mocks
  - Next.js router mocks
  - React Query mocks
  - Georgian business validation functions

### 3. `src/test-utils.tsx`
- **Location**: `frontend/src/test-utils.tsx`
- **Purpose**: Testing utilities and custom render functions
- **Features**:
  - Custom render function with providers
  - Georgian-specific test helpers
  - Mock data generators
  - Georgian language testing utilities

## 🚀 Test Scripts

### Available Commands
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run",
  "test:coverage": "vitest --coverage",
  "test:config": "vitest --config"
}
```

### Usage Examples
```bash
# Run all tests
npm run test

# Run tests once (no watch mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run specific test file
npx vitest src/example.test.tsx

# Run tests in UI mode
npm run test:ui
```

## 📝 Writing Tests

### Basic Test Structure
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import { yourComponent } from '@/your-component';

describe('Component Name', () => {
  it('should render correctly', () => {
    render(<yourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Georgian Language Testing
```typescript
// Using built-in Georgian test utilities
import { generateGeorgianTestText, validateGeorgianAddress } from '@/test-utils';

it('supports Georgian text', () => {
  const georgianText = generateGeorgianTestText('medium');
  render(<Component>{georgianText}</Component>);
  expect(screen.getByText(georgianText)).toBeInTheDocument();
});

it('validates Georgian addresses', () => {
  const address = 'თბილისი, რუსთაველის გამზირი 12, 0108';
  const validation = validateGeorgianAddress(address);
  expect(validation.isValid).toBe(true);
});
```

### Mock Data Generation
```typescript
import { createGeorgianOrder, createMockProduct } from '@/test-utils';

it('handles Georgian orders', () => {
  const order = createGeorgianOrder('GDS-123456');
  expect(order.id).toBe('GDS-123456');
  expect(order.delivery_address).toContain('თბილისი');
});
```

### Testing with Authentication
```typescript
// Test with different user roles
const { rerender } = render(
  <ComponentUnderTest />,
  { user: 'admin', authState: 'authenticated' }
);

// Test with unauthenticated state
rerender(
  <ComponentUnderTest />,
  { user: 'none', authState: 'unauthenticated' }
);
```

## 🧪 Test Organization

### File Naming Convention
- **Test files**: `*.test.ts` or `*.test.tsx`
- **Component tests**: Co-located with components or in `__tests__` directories
- **Utility tests**: `src/utils/__tests__/`

### Directory Structure
```
frontend/src/
├── __tests__/
│   └── example.test.tsx          # Example tests
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── __tests__/
│   │       └── button.test.tsx
│   └── ...other components
├── test-utils.tsx                # Testing utilities
└── setupTests.ts                 # Test setup
```

## 🌍 Georgian Language Testing Features

### 1. Georgian Text Utilities
```typescript
// Generate random Georgian text
generateGeorgianTestText('short');   // "გამარჯობა"
generateGeorgianTestText('medium');  // "ტრადიციული ქართული სამზარეულო..."
generateGeorgianTestText('long');    // Long Georgian text
```

### 2. Georgian Business Data
```typescript
// Predefined Georgian data
const georgianData = createGeorgianBusinessData();
georgianData.cities[0].name;         // "თბილისი"
georgianData.cuisines[0];            // "ქართული"
```

### 3. Georgian Validation Functions
```typescript
// Phone number validation
validateGeorgianPhone('+995555123456'); // true
validateGeorgianPhone('+995123456789'); // false

// Address validation
const result = validateGeorgianAddress('თბილისი, რუსთაველის გამზირი 12, 0108');
result.isValid; // true
```

### 4. Georgian Test Selectors
```typescript
// Custom Georgian content queries
georgianQueries.getByGeorgianText(container, 'მოგესალმებით');
georgianQueries.findByGeorgianText(container, 'შეკვეთა');
```

## 📊 Coverage Configuration

### Coverage Settings
- **Provider**: v8
- **Minimum Coverage**: 80%
- **Excluded Files**: `node_modules`, `dist`, `*.d.ts`
- **Included Directories**: `src/`

### Coverage Commands
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

## 🔧 Mock Configuration

### Supabase Mock
- **Location**: `src/setupTests.ts`
- **Features**: Auth, database, storage, realtime mocking
- **Usage**: Automatic via test-utils render function

### Next.js Router Mock
- **Features**: useRouter, useSearchParams, usePathname, useParams
- **Usage**: Available in all component tests

### React Query Mock
- **Features**: QueryClient, useQuery, useMutation
- **Usage**: Available for testing data fetching

## 🎯 Best Practices

### 1. Test Structure
```typescript
describe('Component', () => {
  // Setup
  beforeEach(() => { /* setup */ });
  
  // Tests
  it('should render correctly', () => { /* test */ });
  
  // Cleanup
  afterEach(() => { /* cleanup */ });
});
```

### 2. Test Naming
```typescript
// Good
it('renders Georgian welcome message correctly');

// Bad
it('works');
```

### 3. Test Data
```typescript
// Use Georgian test data
const georgianProduct = createMockProduct({
  name: 'ხაჭაპური',
  description: 'ტრადიციული ქართული კერძი',
  price: 25.00
});
```

### 4. Mocking
```typescript
// Mock functions
const mockFunction = vi.fn();

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signIn: vi.fn() },
    from: vi.fn()
  }
}));
```

## 🚨 Troubleshooting

### Common Issues

1. **Module not found errors**
   - Check import paths
   - Verify tsconfig paths configuration
   - Ensure files exist

2. **Test environment issues**
   - Check vitest.config.ts setup
   - Verify setupTests.ts is loaded
   - Check happy-dom setup

3. **Coverage not generating**
   - Verify coverage configuration in vitest.config.ts
   - Check exclude patterns
   - Ensure source files are included

4. **React Testing Library issues**
   - Check @testing-library/react version compatibility
   - Verify DOM environment setup
   - Check for async/await usage

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM](https://github.com/testing-library/jest-dom)
- [Georgian Distribution System - Memory Bank](../.kilocode/rules/memory-bank/)

## 🔄 Integration

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run tests
  run: npm run test:coverage
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks
```bash
# Install husky for pre-commit hooks
npm install --save-dev husky

# Add to package.json
{
  "scripts": {
    "precommit": "npm run test:run"
  }
}
```

---

**Last Updated**: 2025-11-02  
**Version**: 1.0.0  
**Framework**: Vitest v2.1.9 + React Testing Library v16.1.0