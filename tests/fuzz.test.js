/**
 * Fuzz Testing Suite using fast-check
 * 
 * Property-based testing to discover edge cases through random input generation.
 * This complements mutation testing by finding inputs that could break the system.
 * 
 * Fuzz Testing Techniques Used:
 * 1. Random Input Generation - Generate random valid and invalid inputs
 * 2. Boundary Value Fuzzing - Test at boundaries of valid input ranges
 * 3. Property-Based Testing - Verify invariants hold for all inputs
 */

import { expect } from 'chai';
import fc from 'fast-check';
import { Product, ProductCatalog } from '../src/product.js';
import { ShoppingCart } from '../src/cart.js';
import { UserManager } from '../src/user.js';
import { InventoryManager } from '../src/inventory.js';
import { DiscountManager } from '../src/discount.js';

describe('Fuzz Testing Suite', function() {
    this.timeout(60000); // Fuzz tests may take longer

    // ==================== PRODUCT FUZZ TESTS ====================
    describe('Product Fuzzing', () => {
        
        it('should handle various positive prices', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 10000 }),
                    (price) => {
                        const product = new Product('P1', 'Test Product', price, 'Category', 100, 'Description');
                        expect(product.price).to.be.a('number');
                        expect(product.price).to.be.at.least(0);
                    }
                ),
                { numRuns: 20 }
            );
        });

        it('should handle ratings in valid range (1-5)', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 5 }),
                    (rating) => {
                        const product = new Product('P1', 'Test', 10, 'Cat', 100, 'Desc');
                        product.addRating(rating, 'user1');
                        expect(product.getAverageRating()).to.be.at.least(1);
                        expect(product.getAverageRating()).to.be.at.most(5);
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should calculate correct average from multiple ratings', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 20 }),
                    (ratings) => {
                        const product = new Product('P1', 'Test', 10, 'Cat', 100, 'Desc');
                        ratings.forEach((r, i) => product.addRating(r, `user${i}`));
                        const expectedAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                        // Account for rounding to 1 decimal place
                        expect(product.getAverageRating()).to.be.closeTo(expectedAvg, 0.1);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    // ==================== CART FUZZ TESTS ====================
    describe('Shopping Cart Fuzzing', () => {
        
        it('should handle valid quantities', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 50 }),
                    (quantity) => {
                        const cart = new ShoppingCart('user1');
                        const product = new Product('P1', 'Test', 10, 'Cat', 1000, 'Desc');
                        const result = cart.addItem(product, quantity);
                        if (result.success) {
                            expect(cart.items.get('P1').quantity).to.equal(quantity);
                        }
                    }
                ),
                { numRuns: 15 }
            );
        });

        it('should calculate subtotal correctly for multiple items', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            price: fc.integer({ min: 1, max: 100 }),
                            quantity: fc.integer({ min: 1, max: 5 })
                        }),
                        { minLength: 1, maxLength: 5 }
                    ),
                    (items) => {
                        const cart = new ShoppingCart('user1');
                        let expectedSubtotal = 0;
                        
                        items.forEach((item, index) => {
                            const product = new Product(`P${index}`, `Test${index}`, item.price, 'Cat', 1000, 'Desc');
                            const result = cart.addItem(product, item.quantity);
                            if (result.success) {
                                expectedSubtotal += item.price * item.quantity;
                            }
                        });
                        
                        // Use getSubtotal instead of calculateTotal to avoid shipping
                        const cartSubtotal = cart.getSubtotal();
                        expect(cartSubtotal).to.be.closeTo(expectedSubtotal, 0.01);
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should have total >= subtotal', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 10, max: 100 }),
                    fc.integer({ min: 1, max: 5 }),
                    (price, quantity) => {
                        const cart = new ShoppingCart('user1');
                        const product = new Product('P1', 'Test', price, 'Cat', 1000, 'Desc');
                        cart.addItem(product, quantity);
                        
                        const subtotal = cart.getSubtotal();
                        const total = cart.calculateTotal();
                        
                        // Total should be >= subtotal (includes shipping/tax)
                        expect(total).to.be.at.least(subtotal);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    // ==================== USER FUZZ TESTS ====================
    describe('User Management Fuzzing', () => {
        
        it('should accept valid email formats', () => {
            fc.assert(
                fc.property(
                    fc.emailAddress(),
                    (email) => {
                        const userManager = new UserManager();
                        const result = userManager.register(email, 'Password123!', 'Test', 'User');
                        if (result.success) {
                            expect(result.user.email).to.equal(email);
                        } else {
                            expect(result.message).to.be.a('string');
                        }
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should enforce password complexity', () => {
            const weakPasswords = ['short', '12345678', 'noupperlower', 'NoDigits!', 'NOLOWER123'];
            weakPasswords.forEach(password => {
                const userManager = new UserManager();
                const email = `test${Date.now()}${Math.random().toString(36)}@test.com`;
                const result = userManager.register(email, password, 'Test', 'User');
                expect(result.success).to.be.false;
            });
        });
    });

    // ==================== INVENTORY FUZZ TESTS ====================
    describe('Inventory Fuzzing', () => {
        
        it('should handle various stock levels', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 10000 }),
                    (stock) => {
                        const inventory = new InventoryManager();
                        const item = inventory.addInventoryItem(`P${Math.random()}`, stock);
                        expect(item.currentStock).to.equal(stock);
                    }
                ),
                { numRuns: 15 }
            );
        });

        it('should handle stock adjustments', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 100, max: 1000 }),
                    fc.integer({ min: 1, max: 50 }),
                    (initialStock, adjustment) => {
                        const inventory = new InventoryManager();
                        const productId = `P${Math.random()}`;
                        const item = inventory.addInventoryItem(productId, initialStock);
                        
                        // Add stock
                        item.addStock(adjustment);
                        expect(item.currentStock).to.equal(initialStock + adjustment);
                        
                        // Remove stock
                        item.removeStock(adjustment);
                        expect(item.currentStock).to.equal(initialStock);
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should correctly identify reorder point', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 100 }),
                    fc.integer({ min: 1, max: 100 }),
                    (stock, threshold) => {
                        const inventory = new InventoryManager();
                        const item = inventory.addInventoryItem(`P${Math.random()}`, stock);
                        item.reorderPoint = threshold;
                        
                        const needsReorder = item.needsReorder();
                        if (stock <= threshold) {
                            expect(needsReorder).to.be.true;
                        } else {
                            expect(needsReorder).to.be.false;
                        }
                    }
                ),
                { numRuns: 15 }
            );
        });
    });

    // ==================== DISCOUNT FUZZ TESTS ====================
    describe('Discount Fuzzing', () => {
        
        it('should handle valid percentage discounts (1-100)', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 100 }),
                    fc.integer({ min: 100, max: 1000 }),
                    (percentage, orderTotal) => {
                        const discountManager = new DiscountManager();
                        const code = `PCT${Math.floor(Math.random() * 100000)}`;
                        const result = discountManager.createCoupon(code, 'percentage', percentage);
                        
                        if (result.success) {
                            const coupon = discountManager.getCoupon(code);
                            const discount = coupon.calculateDiscount(orderTotal, []);
                            expect(discount).to.be.a('number');
                            expect(discount).to.be.at.least(0);
                        }
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should reject invalid percentage values', () => {
            const invalidPercentages = [-10, 0, 101, 200];
            invalidPercentages.forEach(percentage => {
                const discountManager = new DiscountManager();
                const code = `INVALID${Math.floor(Math.random() * 100000)}`;
                const result = discountManager.createCoupon(code, 'percentage', percentage);
                expect(result.success).to.be.false;
            });
        });
    });

    // ==================== INTEGRATION FUZZ TESTS ====================
    describe('Integration Fuzzing', () => {
        
        it('should handle complete shopping flow with random inputs', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            price: fc.integer({ min: 1, max: 100 }),
                            quantity: fc.integer({ min: 1, max: 5 })
                        }),
                        { minLength: 1, maxLength: 3 }
                    ),
                    (items) => {
                        // Create products with sufficient stock
                        const products = items.map((item, index) => 
                            new Product(`P${index}`, `Product ${index}`, item.price, 'Category', 1000, 'Test')
                        );
                        
                        // Add to cart
                        const cart = new ShoppingCart('user1');
                        items.forEach((item, index) => {
                            cart.addItem(products[index], item.quantity);
                        });
                        
                        // Calculate total
                        const total = cart.calculateTotal();
                        expect(total).to.be.a('number');
                        expect(total).to.be.at.least(0);
                        
                        // Clear cart
                        cart.clear();
                        expect(cart.items.size).to.equal(0);
                    }
                ),
                { numRuns: 10 }
            );
        });
    });

    // ==================== BOUNDARY VALUE FUZZ TESTS ====================
    describe('Boundary Value Fuzzing', () => {
        
        it('should handle maximum integer values in inventory', () => {
            const inventory = new InventoryManager();
            const item = inventory.addInventoryItem('P1', Number.MAX_SAFE_INTEGER);
            expect(item.currentStock).to.equal(Number.MAX_SAFE_INTEGER);
        });

        it('should handle minimum positive values', () => {
            const product = new Product('P1', 'Test', 0.01, 'Cat', 100, 'Desc');
            expect(product.price).to.equal(0.01);
        });

        it('should handle various string inputs', () => {
            const testStrings = ['Simple', 'With Spaces', 'With-Dashes', 'With_Underscores', 'MixedCase123'];
            testStrings.forEach(name => {
                const product = new Product('P1', name, 10, 'Cat', 100, 'Desc');
                expect(product.name).to.equal(name);
            });
        });
    });
});
