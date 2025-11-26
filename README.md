# E-Commerce Mutation Testing Project

## IIIT Bangalore - CSE 731: Software Testing
### Term I 2025-26: Project Work

---

## Project Overview

This project implements **Mutation Testing** for an E-Commerce Shopping Cart System using the **Stryker Mutator** framework. The project demonstrates the application of various mutation operators at both unit and integration levels to validate the effectiveness of the test suite.

## Team Members

| Name | Roll Number | Contribution |
|------|-------------|--------------|
| [Team Member 1] | [Roll Number 1] | Source code implementation, Unit testing |
| [Team Member 2] | [Roll Number 2] | Integration testing, Mutation testing configuration |

## Project Structure

```
ecommerce-mutation-testing/
├── src/                    # Source code modules
│   ├── product.js          # Product management
│   ├── cart.js             # Shopping cart operations
│   ├── order.js            # Order processing
│   ├── user.js             # User authentication
│   ├── inventory.js        # Inventory management
│   ├── discount.js         # Discounts and promotions
│   └── index.js            # Main integration module
├── tests/                  # Test suites
│   ├── product.test.js
│   ├── cart.test.js
│   ├── order.test.js
│   ├── user.test.js
│   ├── inventory.test.js
│   ├── discount.test.js
│   └── index.test.js       # Integration tests
├── package.json            # Project dependencies
├── stryker.config.js       # Stryker configuration
├── demo.js                 # Demonstration script
└── README.md               # This file
```

## Technology Stack

- **Runtime**: Node.js
- **Testing Framework**: Mocha + Chai
- **Mutation Testing**: Stryker Mutator v9.4.0
- **Language**: JavaScript (ES6+)

## Source Code Description (~1000+ lines)

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
# Run all unit and integration tests
npm test

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
node demo.js
```

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

## Expected Results

After running mutation testing, expect:
- **Mutation Score**: 70-90%
- **Killed Mutants**: Majority killed by assertion tests
- **Surviving Mutants**: Some equivalent mutants may survive

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
2. Mocha Testing Framework: https://mochajs.org/
3. Chai Assertion Library: https://www.chaijs.com/
4. Course Materials: IIIT Bangalore CSE 731

---

## Commands Summary

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run mutation testing
npm run stryker

# Run demo
node demo.js
```

## License

MIT License - For educational purposes only.
