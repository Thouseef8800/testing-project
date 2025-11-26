# E-Commerce Mutation Testing Project

## Project Overview

This project implements **Mutation Testing** for an E-Commerce Shopping Cart System using **Stryker Mutator**. The project also includes **Fuzz Testing** using **fast-check** for property-based testing.

**Current Mutation Score: 77.09%**

## Project Structure

```
├── src/                    # Source code modules (~5,000+ LOC)
│   ├── product.js          # Product management
│   ├── cart.js             # Shopping cart operations
│   ├── order.js            # Order processing
│   ├── user.js             # User authentication
│   ├── inventory.js        # Inventory management
│   ├── discount.js         # Discounts and promotions
│   └── index.js            # Main integration module
├── tests/                  # Test suites (~6,000+ LOC)
│   ├── product.test.js     # Product unit tests
│   ├── cart.test.js        # Cart unit tests
│   ├── order.test.js       # Order unit tests
│   ├── user.test.js        # User unit tests
│   ├── inventory.test.js   # Inventory unit tests
│   ├── discount.test.js    # Discount unit tests
│   ├── boundary.test.js    # Boundary condition tests
│   ├── index.test.js       # Integration tests
│   └── fuzz.test.js        # Fuzz testing suite
├── package.json            # Project dependencies
├── stryker.config.js       # Stryker configuration
├── demo.js                 # Demonstration script
└── README.md               # This file
```

## Technology Stack

- **Runtime**: Node.js
- **Testing Framework**: Mocha + Chai
- **Mutation Testing**: Stryker Mutator v9.4.0
- **Fuzz Testing**: fast-check (Property-based testing)
- **Language**: JavaScript (ES6+)

## Source Code Description (~5,000+ lines)

The source code implements a complete e-commerce system with the following modules:

### 1. Product Module (`src/product.js`)
- Product class with validation, pricing, ratings
- ProductCatalog for managing product collections
- Search, filtering, and bulk operations

### 2. Cart Module (`src/cart.js`)
- CartItem class for individual items
- ShoppingCart with coupon support, tax calculation, shipping
- CartManager for multi-user cart management

### 3. Order Module (`src/order.js`)
- Order lifecycle management (PENDING → DELIVERED)
- Payment processing with card validation (Luhn algorithm)
- Support for multiple payment methods

### 4. User Module (`src/user.js`)
- User registration and authentication
- Password hashing and validation
- Session management and account locking

### 5. Inventory Module (`src/inventory.js`)
- Stock tracking with reservations
- Automatic alert generation for low/out-of-stock
- Movement history and audit trail

### 6. Discount Module (`src/discount.js`)
- Coupon codes with various discount types
- Promotional campaigns with targeting
- Price calculation optimization

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ecommerce-mutation-testing

# Install dependencies
npm install
```

## Running Tests

```bash
# Run all tests (unit + integration + fuzz)
npm test

# Run only unit tests
npm run test:unit

# Run only fuzz tests
npm run test:fuzz

# Run tests with verbose output
npm test -- --reporter spec
```

## Running Mutation Testing

```bash
# Run Stryker mutation testing
npm run stryker

# Dry run (check configuration without mutations)
npm run stryker:dry-run
```

## Running the Demo

```bash
# Run the demonstration script
npm run demo
```

---

## Fuzz Testing with fast-check

### What is Fuzz Testing?

Fuzz testing is an automated testing technique that generates random inputs to discover bugs, edge cases, and unexpected behaviors that might not be caught by traditional unit tests.

### Fuzz Testing Techniques Used

1. **Random Input Generation** - Generate random valid and invalid inputs
2. **Boundary Value Fuzzing** - Test at boundaries of valid input ranges
3. **Format String Fuzzing** - Test string inputs with special characters
4. **Type Confusion Fuzzing** - Test with unexpected types
5. **Combinatorial Fuzzing** - Test combinations of inputs
6. **Property-Based Testing** - Verify invariants hold for all inputs

### Fuzz Test Categories

#### Product Fuzzing
- Price validation with random positive/negative numbers
- Product name with special characters and unicode
- Rating calculations with random rating arrays

#### Cart Fuzzing
- Quantity validation with boundary values
- Total calculation with random items and quantities
- Coupon code handling with random strings

#### Order Fuzzing
- Credit card validation using Luhn algorithm fuzzing
- Order amount handling with various number ranges
- Payment processing with random payment data

#### User Fuzzing
- Email format validation with generated emails
- Password strength validation with random passwords
- Username handling with various character sets

#### Inventory Fuzzing
- Stock level management with extreme values
- Low stock threshold detection
- Stock adjustment operations

#### Discount Fuzzing
- Percentage discount calculations (0-100%)
- Fixed discount with minimum order requirements
- Coupon validation with random codes

### Example Fuzz Test

```javascript
import fc from 'fast-check';

it('should handle any positive number as price', () => {
    fc.assert(
        fc.property(
            fc.float({ min: 0.01, max: 1000000, noNaN: true }),
            (price) => {
                const product = new Product('P1', 'Test', price, 'Desc', 'Cat');
                expect(product.price).to.be.at.least(0);
            }
        ),
        { numRuns: 100 }
    );
});

it('should reject ratings outside valid range', () => {
    fc.assert(
        fc.property(
            fc.oneof(
                fc.integer({ min: -100, max: 0 }),
                fc.integer({ min: 6, max: 100 })
            ),
            (rating) => {
                const product = new Product('P1', 'Test', 10, 'Desc', 'Cat');
                expect(() => product.addRating(rating)).to.throw();
            }
        ),
        { numRuns: 100 }
    );
});
```

---

## Mutation Operators Used

### Unit Level Operators (3+)

1. **ConditionalExpression**
   - Mutates conditional operators (`&&` → `||`, etc.)
   - Example: `if (a && b)` → `if (a || b)`

2. **EqualityOperator**
   - Mutates equality comparisons
   - Example: `if (x === 5)` → `if (x !== 5)`

3. **ArithmeticOperator**
   - Mutates arithmetic operations
   - Example: `total = price + tax` → `total = price - tax`

4. **BooleanLiteral**
   - Mutates boolean values
   - Example: `return true` → `return false`

### Integration Level Operators (3+)

1. **MethodExpression**
   - Mutates method calls on objects
   - Example: `array.filter()` → `array.some()`

2. **ObjectLiteral**
   - Mutates object property values
   - Example: `{ isValid: true }` → `{ isValid: false }`

3. **ArrayDeclaration**
   - Mutates array literals
   - Example: `[1, 2, 3]` → `[]`

## Test Case Design

### Unit Testing Strategy
- Each module has dedicated test file
- Tests cover:
  - Constructor behavior
  - Method functionality
  - Edge cases and boundary conditions
  - Error handling

### Integration Testing Strategy
- End-to-end shopping flow tests
- Cross-module interaction testing
- State management verification

## How Mutants are Killed

The test suite is designed to **strongly kill** mutants by:

1. **Assertion Coverage**: Every public method has tests asserting expected behavior
2. **Boundary Testing**: Tests check edge cases where mutations would be detectable
3. **State Verification**: Tests verify object state changes after operations
4. **Error Path Testing**: Tests ensure error conditions are properly handled

### Example Mutation Kill

```javascript
// Original Code
if (this.stock >= requiredQuantity && this.isActive) {
    return true;
}

// Mutation (ConditionalExpression): && → ||
if (this.stock >= requiredQuantity || this.isActive) {
    return true; // Would return true even if stock is 0 but product is active
}

// Test that kills this mutant:
it('should return false when not enough stock', function() {
    const product = new Product('P001', 'Test', 10, 'Cat', 10);
    expect(product.isInStock(25)).to.be.false; // Kills mutant
});
```

## Mutation Testing Results

After running mutation testing with `npm run stryker`:

| File | Mutation Score | Killed | Survived |
|------|----------------|--------|----------|
| discount.js | 86.56% | 496 | 75 |
| product.js | 82.51% | 434 | 85 |
| cart.js | 78.43% | 440 | 103 |
| user.js | 77.59% | 501 | 121 |
| inventory.js | 75.86% | 399 | 93 |
| order.js | 67.73% | 381 | 120 |
| index.js | 64.15% | 170 | 89 |
| **Total** | **77.09%** | **2821** | **686** |

## Stryker Configuration

The `stryker.config.js` file configures:
- Source files to mutate (`src/**/*.js`)
- Test runner (Mocha)
- Mutation operators (all JavaScript mutators)
- Reporting (HTML, JSON, clear-text)
- Thresholds for mutation score

## AI/LLM Tools Acknowledgment

GitHub Copilot was used to assist with:
- Code scaffolding and boilerplate generation
- Test case suggestions
- Documentation writing

All code was reviewed, modified, and validated by the team members.

## Screenshots

After running `npm run stryker`, check:
- `mutation-report.html` - Interactive HTML report
- `mutation-report.json` - Detailed JSON data

## References

1. Stryker Mutator: https://stryker-mutator.io/
2. fast-check (Property-based testing): https://github.com/dubzzz/fast-check
3. Mocha Testing Framework: https://mochajs.org/
4. Chai Assertion Library: https://www.chaijs.com/

---

## Commands Summary

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run fuzz tests only
npm run test:fuzz

# Run mutation testing
npm run stryker

# Run demo
npm run demo
```

## License

MIT License - For educational purposes only.
