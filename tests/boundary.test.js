/**
 * Enhanced Boundary Tests for Mutation Testing
 * These tests target specific boundary conditions to kill more mutants
 */

const { expect } = require('chai');
const { Product, ProductCatalog } = require('../src/product');
const { CartItem, ShoppingCart, CartManager } = require('../src/cart');
const { Order, OrderItem, OrderManager, OrderStatus, PaymentStatus, PaymentMethod } = require('../src/order');
const { User, UserManager, UserRole, AccountStatus } = require('../src/user');
const { InventoryItem, InventoryManager, StockMovement, MovementType, AlertType } = require('../src/inventory');
const { Coupon, Promotion, DiscountManager, DiscountType, CouponStatus } = require('../src/discount');

describe('Enhanced Boundary Tests', function() {
    // Product boundary tests
    describe('Product Boundaries', function() {
        it('should handle price exactly at 1000000', function() {
            const product = new Product('P001', 'Expensive Item', 1000000, 'Luxury', 1);
            const result = product.validate();
            expect(result.isValid).to.be.true;
        });

        it('should handle price just over 1000000', function() {
            const product = new Product('P001', 'Too Expensive', 1000000.01, 'Luxury', 1);
            const result = product.validate();
            expect(result.isValid).to.be.false;
        });

        it('should handle name exactly 2 characters', function() {
            const product = new Product('P001', 'AB', 10, 'Cat', 5);
            const result = product.validate();
            expect(result.isValid).to.be.true;
        });

        it('should handle name exactly 200 characters', function() {
            const product = new Product('P001', 'A'.repeat(200), 10, 'Cat', 5);
            const result = product.validate();
            expect(result.isValid).to.be.true;
        });

        it('should handle discount exactly at 0', function() {
            const product = new Product('P001', 'Test', 100, 'Cat', 5);
            product.discount = 0;
            expect(product.getDiscountedPrice()).to.equal(100);
        });

        it('should handle discount exactly at 100', function() {
            const product = new Product('P001', 'Test', 100, 'Cat', 5);
            product.discount = 100;
            expect(product.getDiscountedPrice()).to.equal(0);
        });

        it('should handle discount at 50%', function() {
            const product = new Product('P001', 'Test', 100, 'Cat', 5);
            product.discount = 50;
            expect(product.getDiscountedPrice()).to.equal(50);
        });

        it('should handle rating exactly at 1', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(1, 'user1')).to.be.true;
        });

        it('should handle rating exactly at 5', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(5, 'user1')).to.be.true;
        });

        it('should reject rating at 0', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(0, 'user1')).to.be.false;
        });

        it('should reject rating at 6', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            expect(product.addRating(6, 'user1')).to.be.false;
        });

        it('should correctly calculate average with multiple ratings', function() {
            const product = new Product('P001', 'Test', 10, 'Cat');
            product.addRating(4, 'user1');
            product.addRating(5, 'user2');
            product.addRating(3, 'user3');
            expect(product.getAverageRating()).to.equal(4);
        });

        it('should update stock correctly with positive values', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            product.updateStock(10);
            expect(product.stock).to.equal(60);
        });

        it('should update stock correctly with negative values', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            product.updateStock(-20);
            expect(product.stock).to.equal(30);
        });

        it('should not allow stock to go below zero', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 50);
            product.updateStock(-60);
            expect(product.stock).to.equal(0);
        });

        it('should correctly check if in stock with positive stock', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 1);
            expect(product.isInStock()).to.be.true;
        });

        it('should correctly check if in stock with zero stock', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 0);
            expect(product.isInStock()).to.be.false;
        });

        it('should handle multiple tags', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 5);
            product.addTags(['tag1', 'tag2', 'tag3']);
            expect(product.tags).to.have.length(3);
            expect(product.hasTag('tag2')).to.be.true;
            expect(product.hasTag('tag4')).to.be.false;
        });

        it('should not add duplicate tags', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 5);
            product.addTags(['tag1', 'tag1', 'tag2']);
            expect(product.tags).to.have.length(2);
        });

        it('should activate and deactivate product', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 5);
            expect(product.isActive).to.be.true;
            product.deactivate();
            expect(product.isActive).to.be.false;
            product.activate();
            expect(product.isActive).to.be.true;
        });

        it('should update price and record history', function() {
            const product = new Product('P001', 'Test', 100, 'Cat', 5);
            product.updatePrice(120);
            expect(product.price).to.equal(120);
            expect(product.priceHistory).to.have.length(1);
            expect(product.priceHistory[0].oldPrice).to.equal(100);
            expect(product.priceHistory[0].newPrice).to.equal(120);
        });
    });

    // Cart boundary tests
    describe('Cart Boundaries', function() {
        let cart;

        beforeEach(function() {
            cart = new ShoppingCart('user123');
        });

        it('should handle adding item with quantity 1', function() {
            const product = new Product('P001', 'Test', 50, 'Cat', 100);
            const result = cart.addItem(product, 1);
            expect(result.success).to.be.true;
            expect(cart.getItemCount()).to.equal(1);
        });

        it('should handle adding item with quantity 0', function() {
            const product = new Product('P001', 'Test', 50, 'Cat', 100);
            const result = cart.addItem(product, 0);
            expect(result.success).to.be.false;
        });

        it('should handle adding item with negative quantity', function() {
            const product = new Product('P001', 'Test', 50, 'Cat', 100);
            const result = cart.addItem(product, -1);
            expect(result.success).to.be.false;
        });

        it('should calculate correct subtotal with multiple items', function() {
            const product1 = new Product('P001', 'Test1', 25.50, 'Cat', 100);
            const product2 = new Product('P002', 'Test2', 15.75, 'Cat', 100);
            cart.addItem(product1, 2);
            cart.addItem(product2, 3);
            // 25.50 * 2 + 15.75 * 3 = 51 + 47.25 = 98.25
            expect(cart.getSubtotal()).to.be.closeTo(98.25, 0.01);
        });

        it('should handle MAX_ITEMS_PER_PRODUCT limit', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 1000);
            const result = cart.addItem(product, 100);
            expect(result.success).to.be.true;
            // Try adding more than max
            const result2 = cart.addItem(product, 100);
            expect(result2.success).to.be.false;
        });

        it('should correctly update item quantity', function() {
            const product = new Product('P001', 'Test', 50, 'Cat', 100);
            cart.addItem(product, 2);
            const result = cart.updateItemQuantity('P001', 5, product);
            expect(result.success).to.be.true;
            expect(cart.getItem('P001').quantity).to.equal(5);
        });

        it('should remove item when quantity set to 0', function() {
            const product = new Product('P001', 'Test', 50, 'Cat', 100);
            cart.addItem(product, 2);
            cart.updateItemQuantity('P001', 0, product);
            expect(cart.getItem('P001')).to.be.undefined;
        });

        it('should apply percentage coupon correctly', function() {
            const product = new Product('P001', 'Test', 100, 'Cat', 50);
            cart.addItem(product, 1);
            
            const couponDb = new Map();
            const coupon = new Coupon('TEST10', DiscountType.PERCENTAGE, 10);
            coupon.setMinPurchase(50);
            couponDb.set('TEST10', coupon);
            
            const result = cart.applyCoupon('TEST10', couponDb);
            expect(result.success).to.be.true;
            expect(cart.getCouponDiscount()).to.equal(10);
        });

        it('should reject coupon when minimum not met', function() {
            const product = new Product('P001', 'Test', 30, 'Cat', 50);
            cart.addItem(product, 1);
            
            const couponDb = new Map();
            const coupon = new Coupon('TEST10', DiscountType.PERCENTAGE, 10);
            coupon.setMinPurchase(50);
            couponDb.set('TEST10', coupon);
            
            const result = cart.applyCoupon('TEST10', couponDb);
            expect(result.success).to.be.false;
        });

        it('should calculate tax correctly', function() {
            const product = new Product('P001', 'Test', 100, 'Cat', 50);
            cart.addItem(product, 1);
            const tax = cart.calculateTax(8.25);
            expect(tax).to.equal(8.25);
        });

        it('should provide free shipping when threshold met', function() {
            const product = new Product('P001', 'Test', 60, 'Cat', 50);
            cart.addItem(product, 1);
            const shipping = cart.calculateShipping({ baseRate: 5.99, freeShippingThreshold: 50 });
            expect(shipping).to.equal(0);
        });

        it('should charge shipping when threshold not met', function() {
            const product = new Product('P001', 'Test', 40, 'Cat', 50);
            cart.addItem(product, 1);
            const shipping = cart.calculateShipping({ baseRate: 5.99, freeShippingThreshold: 50 });
            expect(shipping).to.equal(5.99);
        });

        it('should calculate total correctly', function() {
            const product = new Product('P001', 'Test', 100, 'Cat', 50);
            cart.addItem(product, 1);
            const total = cart.calculateTotal(8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            // 100 + 8.25 + 0 (free shipping) = 108.25
            expect(total).to.be.closeTo(108.25, 0.01);
        });
    });

    // Order boundary tests  
    describe('Order Boundaries', function() {
        let cart;
        let orderManager;
        let productCatalog;

        beforeEach(function() {
            cart = new ShoppingCart('user123');
            orderManager = new OrderManager();
            productCatalog = new ProductCatalog();
            
            const product = new Product('P001', 'Test Product', 50, 'Cat', 100);
            productCatalog.addProduct(product);
            cart.addItem(product, 2);
            cart.setShippingAddress({
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                country: 'USA'
            });
        });

        it('should create order with correct totals', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            expect(result.success).to.be.true;
            expect(result.order.subtotal).to.equal(100);
        });

        it('should handle order status transitions correctly', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            
            expect(order.status).to.equal(OrderStatus.PENDING);
            
            order.confirm();
            expect(order.status).to.equal(OrderStatus.CONFIRMED);
            
            order.updateStatus(OrderStatus.PROCESSING);
            expect(order.status).to.equal(OrderStatus.PROCESSING);
            
            order.updateStatus(OrderStatus.SHIPPED);
            expect(order.status).to.equal(OrderStatus.SHIPPED);
            
            order.updateStatus(OrderStatus.DELIVERED);
            expect(order.status).to.equal(OrderStatus.DELIVERED);
        });

        it('should reject invalid status transitions', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            
            // Cannot go from PENDING to DELIVERED directly
            order.updateStatus(OrderStatus.DELIVERED);
            expect(order.status).to.equal(OrderStatus.PENDING);
        });

        it('should validate credit card with Luhn algorithm', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            order.confirm();
            
            // Valid card number (passes Luhn)
            const paymentResult = order.processPayment({
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'Test User'
            });
            expect(paymentResult.success).to.be.true;
        });

        it('should reject invalid credit card number', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            order.confirm();
            
            // Invalid card number (fails Luhn)
            const paymentResult = order.processPayment({
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '1234567890123456',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'Test User'
            });
            expect(paymentResult.success).to.be.false;
        });

        it('should reject expired card', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            order.confirm();
            
            const paymentResult = order.processPayment({
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '4532015112830366',
                expiryMonth: '01',
                expiryYear: '2020',
                cvv: '123',
                cardholderName: 'Test User'
            });
            expect(paymentResult.success).to.be.false;
        });

        it('should handle order cancellation', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            
            const cancelResult = order.cancel('Customer request');
            expect(cancelResult.success).to.be.true;
            expect(order.status).to.equal(OrderStatus.CANCELLED);
        });

        it('should not cancel delivered order', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            
            order.confirm();
            order.processPayment({
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'Test User'
            });
            order.updateStatus(OrderStatus.PROCESSING);
            order.updateStatus(OrderStatus.SHIPPED);
            order.updateStatus(OrderStatus.DELIVERED);
            
            const cancelResult = order.cancel('Customer request');
            expect(cancelResult.success).to.be.false;
        });

        it('should set tracking info correctly', function() {
            const result = orderManager.createOrder(cart, productCatalog, 8.25, { baseRate: 5.99, freeShippingThreshold: 50 });
            const order = result.order;
            order.confirm();
            order.processPayment({
                method: PaymentMethod.CREDIT_CARD,
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'Test User'
            });
            order.updateStatus(OrderStatus.PROCESSING);
            order.updateStatus(OrderStatus.SHIPPED);
            
            order.setTrackingInfo('TRACK123', 'FedEx', new Date());
            expect(order.trackingNumber).to.equal('TRACK123');
            expect(order.carrier).to.equal('FedEx');
        });
    });

    // User boundary tests
    describe('User Boundaries', function() {
        let userManager;

        beforeEach(function() {
            userManager = new UserManager();
        });

        it('should accept password exactly 8 characters', function() {
            const result = userManager.register('test@email.com', 'Pass123!', 'John', 'Doe');
            expect(result.success).to.be.true;
        });

        it('should reject password less than 8 characters', function() {
            const result = userManager.register('test@email.com', 'Pass12', 'John', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should reject password without uppercase', function() {
            const result = userManager.register('test@email.com', 'password123', 'John', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should reject password without lowercase', function() {
            const result = userManager.register('test@email.com', 'PASSWORD123', 'John', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should reject password without number', function() {
            const result = userManager.register('test@email.com', 'Passwordd', 'John', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should lock account after max failed attempts', function() {
            const regResult = userManager.register('test@email.com', 'ValidPass123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            
            // Make 5 failed login attempts (default max)
            for (let i = 0; i < 5; i++) {
                userManager.authenticate('test@email.com', 'WrongPass123');
            }
            
            const user = userManager.getUserByEmail('test@email.com');
            expect(user.status).to.equal(AccountStatus.LOCKED);
        });

        it('should reset failed attempts on successful login', function() {
            const regResult = userManager.register('test@email.com', 'ValidPass123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            
            // Make 3 failed attempts
            for (let i = 0; i < 3; i++) {
                userManager.authenticate('test@email.com', 'WrongPass123');
            }
            
            const user = userManager.getUserByEmail('test@email.com');
            expect(user.failedLoginAttempts).to.equal(3);
            
            // Successful login
            userManager.authenticate('test@email.com', 'ValidPass123');
            expect(user.failedLoginAttempts).to.equal(0);
        });

        it('should not authenticate unverified user', function() {
            userManager.register('test@email.com', 'ValidPass123', 'John', 'Doe');
            const result = userManager.authenticate('test@email.com', 'ValidPass123');
            expect(result.success).to.be.false;
        });

        it('should validate email format', function() {
            const result1 = userManager.register('invalid-email', 'ValidPass123', 'John', 'Doe');
            expect(result1.success).to.be.false;
            
            const result2 = userManager.register('test@', 'ValidPass123', 'John', 'Doe');
            expect(result2.success).to.be.false;
            
            const result3 = userManager.register('@example.com', 'ValidPass123', 'John', 'Doe');
            expect(result3.success).to.be.false;
        });

        it('should prevent duplicate registration', function() {
            userManager.register('test@email.com', 'ValidPass123', 'John', 'Doe');
            const result = userManager.register('test@email.com', 'OtherPass123', 'Jane', 'Doe');
            expect(result.success).to.be.false;
        });

        it('should handle session expiration', function() {
            const regResult = userManager.register('test@email.com', 'ValidPass123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            
            const authResult = userManager.authenticate('test@email.com', 'ValidPass123');
            expect(authResult.success).to.be.true;
            
            // Expire the session
            authResult.session.expiresAt = new Date(Date.now() - 1000);
            expect(authResult.session.isValid()).to.be.false;
        });

        it('should validate session correctly', function() {
            const regResult = userManager.register('test@email.com', 'ValidPass123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            
            const authResult = userManager.authenticate('test@email.com', 'ValidPass123');
            const validation = userManager.validateSession(authResult.session.sessionId);
            expect(validation.valid).to.be.true;
        });

        it('should invalidate session on logout', function() {
            const regResult = userManager.register('test@email.com', 'ValidPass123', 'John', 'Doe');
            regResult.user.verifyAccount(regResult.verificationToken);
            
            const authResult = userManager.authenticate('test@email.com', 'ValidPass123');
            userManager.logout(authResult.session.sessionId);
            
            const validation = userManager.validateSession(authResult.session.sessionId);
            expect(validation.valid).to.be.false;
        });
    });

    // Inventory boundary tests
    describe('Inventory Boundaries', function() {
        let inventoryManager;

        beforeEach(function() {
            inventoryManager = new InventoryManager();
        });

        it('should add inventory item with initial stock', function() {
            const item = inventoryManager.addInventoryItem('P001', 100);
            expect(item.currentStock).to.equal(100);
            expect(item.getAvailableStock()).to.equal(100);
        });

        it('should reserve stock correctly', function() {
            inventoryManager.addInventoryItem('P001', 100);
            const result = inventoryManager.reserveStock('P001', 30);
            expect(result.success).to.be.true;
            
            const item = inventoryManager.getInventoryItem('P001');
            expect(item.reservedStock).to.equal(30);
            expect(item.getAvailableStock()).to.equal(70);
        });

        it('should not reserve more than available stock', function() {
            inventoryManager.addInventoryItem('P001', 100);
            const result = inventoryManager.reserveStock('P001', 150);
            expect(result.success).to.be.false;
        });

        it('should release reserved stock correctly', function() {
            inventoryManager.addInventoryItem('P001', 100);
            inventoryManager.reserveStock('P001', 30);
            
            const result = inventoryManager.releaseReservedStock('P001', 10);
            expect(result.success).to.be.true;
            
            const item = inventoryManager.getInventoryItem('P001');
            expect(item.reservedStock).to.equal(20);
            expect(item.getAvailableStock()).to.equal(80);
        });

        it('should confirm sale and reduce stock', function() {
            inventoryManager.addInventoryItem('P001', 100);
            inventoryManager.reserveStock('P001', 30);
            
            const item = inventoryManager.getInventoryItem('P001');
            item.confirmSale(30);
            
            expect(item.currentStock).to.equal(70);
            expect(item.reservedStock).to.equal(0);
            expect(item.getAvailableStock()).to.equal(70);
        });

        it('should create low stock alert at reorder point', function() {
            inventoryManager.addInventoryItem('P001', 15);
            const item = inventoryManager.getInventoryItem('P001');
            item.reorderPoint = 10;
            
            // Reduce stock to exactly reorder point
            item.reduceStock(5);
            
            expect(item.needsReorder()).to.be.true;
            expect(item.currentStock).to.equal(10);
        });

        it('should handle restock correctly', function() {
            inventoryManager.addInventoryItem('P001', 5);
            const result = inventoryManager.restock('P001', 50, 'PO-001');
            
            expect(result.success).to.be.true;
            expect(result.newStock).to.equal(55);
        });

        it('should detect out of stock items', function() {
            inventoryManager.addInventoryItem('P001', 0);
            const item = inventoryManager.getInventoryItem('P001');
            expect(item.isOutOfStock()).to.be.true;
        });

        it('should not exceed max stock on restock', function() {
            inventoryManager.addInventoryItem('P001', 900);
            const item = inventoryManager.getInventoryItem('P001');
            item.maxStock = 1000;
            
            // Try to restock over max
            const result = inventoryManager.restock('P001', 200, 'PO-001');
            // Should cap at max
            expect(item.currentStock).to.be.at.most(1000);
        });

        it('should process return and increase stock', function() {
            inventoryManager.addInventoryItem('P001', 50);
            inventoryManager.processReturn('P001', 5, 'ORD-001');
            
            const item = inventoryManager.getInventoryItem('P001');
            expect(item.currentStock).to.equal(55);
        });

        it('should get items needing reorder', function() {
            inventoryManager.addInventoryItem('P001', 5);
            inventoryManager.addInventoryItem('P002', 50);
            
            const item1 = inventoryManager.getInventoryItem('P001');
            item1.reorderPoint = 10;
            
            const item2 = inventoryManager.getInventoryItem('P002');
            item2.reorderPoint = 10;
            
            const needingReorder = inventoryManager.getItemsNeedingReorder();
            expect(needingReorder).to.have.length(1);
            expect(needingReorder[0].productId).to.equal('P001');
        });
    });

    // Discount boundary tests
    describe('Discount Boundaries', function() {
        let discountManager;

        beforeEach(function() {
            discountManager = new DiscountManager();
        });

        it('should create percentage coupon', function() {
            const result = discountManager.createCoupon('TEST10', DiscountType.PERCENTAGE, 10);
            expect(result.success).to.be.true;
            expect(result.coupon.type).to.equal(DiscountType.PERCENTAGE);
            expect(result.coupon.value).to.equal(10);
        });

        it('should create fixed amount coupon', function() {
            const result = discountManager.createCoupon('TEST5', DiscountType.FIXED_AMOUNT, 5);
            expect(result.success).to.be.true;
            expect(result.coupon.type).to.equal(DiscountType.FIXED_AMOUNT);
        });

        it('should reject percentage over 100', function() {
            const result = discountManager.createCoupon('TEST101', DiscountType.PERCENTAGE, 101);
            expect(result.success).to.be.false;
        });

        it('should reject negative discount value', function() {
            const result = discountManager.createCoupon('TESTNEG', DiscountType.PERCENTAGE, -10);
            expect(result.success).to.be.false;
        });

        it('should handle coupon with max uses', function() {
            const result = discountManager.createCoupon('LIMITED', DiscountType.PERCENTAGE, 10);
            result.coupon.setMaxUses(2);
            
            expect(result.coupon.isActive()).to.be.true;
            
            // Use coupon twice
            discountManager.recordCouponUsage('LIMITED', 'user1');
            discountManager.recordCouponUsage('LIMITED', 'user2');
            
            expect(result.coupon.usageCount).to.equal(2);
            expect(result.coupon.isActive()).to.be.false;
        });

        it('should handle coupon with category restrictions', function() {
            const result = discountManager.createCoupon('ELECTRONICS', DiscountType.PERCENTAGE, 15);
            result.coupon.applicableCategories = ['Electronics'];
            
            const product1 = new Product('P001', 'Phone', 100, 'Electronics');
            const product2 = new Product('P002', 'Shirt', 50, 'Clothing');
            
            expect(result.coupon.isApplicableToCategory('Electronics')).to.be.true;
            expect(result.coupon.isApplicableToCategory('Clothing')).to.be.false;
        });

        it('should handle coupon expiration', function() {
            const result = discountManager.createCoupon('EXPIRE', DiscountType.PERCENTAGE, 10);
            result.coupon.expiresAt = new Date(Date.now() - 1000); // Expired
            
            expect(result.coupon.isActive()).to.be.false;
        });

        it('should calculate best price with promotion', function() {
            const promoResult = discountManager.createPromotion('SALE', 'Summer Sale', DiscountType.PERCENTAGE, 20);
            promoResult.promotion.applicableCategories = ['Electronics'];
            
            const product = new Product('P001', 'Phone', 100, 'Electronics');
            const pricing = discountManager.calculateBestPrice(product);
            
            expect(pricing.finalPrice).to.equal(80);
            expect(pricing.appliedPromotion).to.not.be.null;
        });

        it('should handle multiple promotions and pick best', function() {
            const promo1 = discountManager.createPromotion('SALE10', 'Sale 10%', DiscountType.PERCENTAGE, 10);
            promo1.promotion.applicableCategories = ['Electronics'];
            promo1.promotion.priority = 1;
            
            const promo2 = discountManager.createPromotion('SALE20', 'Sale 20%', DiscountType.PERCENTAGE, 20);
            promo2.promotion.applicableCategories = ['Electronics'];
            promo2.promotion.priority = 2;
            
            const product = new Product('P001', 'Phone', 100, 'Electronics');
            const pricing = discountManager.calculateBestPrice(product);
            
            // Should pick the higher priority promotion
            expect(pricing.finalPrice).to.equal(80); // 20% off
        });

        it('should validate coupon with validateAndApplyCoupon', function() {
            const result = discountManager.createCoupon('VALID', DiscountType.PERCENTAGE, 10);
            result.coupon.setMinPurchase(50);
            
            const validation1 = discountManager.validateAndApplyCoupon('VALID', 'user1', { subtotal: 100, items: [] });
            expect(validation1.success).to.be.true;
            
            const validation2 = discountManager.validateAndApplyCoupon('VALID', 'user1', { subtotal: 30, items: [] });
            expect(validation2.success).to.be.false;
        });

        it('should get statistics correctly', function() {
            discountManager.createCoupon('C1', DiscountType.PERCENTAGE, 10);
            discountManager.createCoupon('C2', DiscountType.FIXED_AMOUNT, 5);
            discountManager.createPromotion('P1', 'Promo 1', DiscountType.PERCENTAGE, 15);
            
            const stats = discountManager.getStatistics();
            expect(stats.activeCoupons).to.be.at.least(2);
            expect(stats.activePromotions).to.be.at.least(1);
        });
    });

    // ProductCatalog boundary tests
    describe('ProductCatalog Boundaries', function() {
        let catalog;

        beforeEach(function() {
            catalog = new ProductCatalog();
        });

        it('should add product successfully', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 5);
            const result = catalog.addProduct(product);
            expect(result.success).to.be.true;
            expect(catalog.getProductCount()).to.equal(1);
        });

        it('should not add duplicate product', function() {
            const product1 = new Product('P001', 'Test', 10, 'Cat', 5);
            const product2 = new Product('P001', 'Test2', 20, 'Cat2', 10);
            
            catalog.addProduct(product1);
            const result = catalog.addProduct(product2);
            
            expect(result.success).to.be.false;
            expect(catalog.getProductCount()).to.equal(1);
        });

        it('should remove product successfully', function() {
            const product = new Product('P001', 'Test', 10, 'Cat', 5);
            catalog.addProduct(product);
            
            const removed = catalog.removeProduct('P001');
            expect(removed).to.be.true;
            expect(catalog.getProductCount()).to.equal(0);
        });

        it('should get products by category', function() {
            catalog.addProduct(new Product('P001', 'Phone', 100, 'Electronics', 5));
            catalog.addProduct(new Product('P002', 'Laptop', 500, 'Electronics', 3));
            catalog.addProduct(new Product('P003', 'Shirt', 30, 'Clothing', 10));
            
            const electronics = catalog.getProductsByCategory('Electronics');
            expect(electronics).to.have.length(2);
        });

        it('should search products by name', function() {
            catalog.addProduct(new Product('P001', 'Wireless Headphones', 50, 'Electronics', 5));
            catalog.addProduct(new Product('P002', 'Wireless Mouse', 25, 'Electronics', 10));
            catalog.addProduct(new Product('P003', 'USB Cable', 10, 'Electronics', 20));
            
            const results = catalog.searchProducts('wireless');
            expect(results).to.have.length(2);
        });

        it('should search products by tags', function() {
            const product1 = new Product('P001', 'Phone', 100, 'Electronics', 5);
            product1.addTags(['smartphone', 'mobile']);
            
            const product2 = new Product('P002', 'Tablet', 300, 'Electronics', 3);
            product2.addTags(['tablet', 'mobile']);
            
            catalog.addProduct(product1);
            catalog.addProduct(product2);
            
            const results = catalog.searchProducts('mobile');
            expect(results).to.have.length(2);
        });

        it('should get all categories', function() {
            catalog.addProduct(new Product('P001', 'Phone', 100, 'Electronics', 5));
            catalog.addProduct(new Product('P002', 'Shirt', 30, 'Clothing', 10));
            catalog.addProduct(new Product('P003', 'Shoes', 60, 'Footwear', 8));
            
            const categories = catalog.getAllCategories();
            expect(categories).to.have.length(3);
            expect(categories).to.include('Electronics');
            expect(categories).to.include('Clothing');
            expect(categories).to.include('Footwear');
        });

        it('should get only active products', function() {
            const product1 = new Product('P001', 'Active', 10, 'Cat', 5);
            const product2 = new Product('P002', 'Inactive', 20, 'Cat', 10);
            product2.deactivate();
            
            catalog.addProduct(product1);
            catalog.addProduct(product2);
            
            const activeCount = catalog.getProductCount(true);
            expect(activeCount).to.equal(1);
        });

        it('should get featured products through search', function() {
            const product1 = new Product('P001', 'Featured Product', 10, 'Cat', 5);
            product1.addTags(['featured']);
            
            const product2 = new Product('P002', 'Normal Product', 20, 'Cat', 10);
            
            catalog.addProduct(product1);
            catalog.addProduct(product2);
            
            const featured = catalog.searchProducts('featured');
            expect(featured).to.have.length(1);
            expect(featured[0].id).to.equal('P001');
        });

        it('should get all products', function() {
            catalog.addProduct(new Product('P001', 'Product 1', 10, 'Cat', 5));
            catalog.addProduct(new Product('P002', 'Product 2', 50, 'Cat', 10));
            catalog.addProduct(new Product('P003', 'Product 3', 100, 'Cat', 3));
            
            const allProducts = catalog.getAllProducts();
            expect(allProducts).to.have.length(3);
        });
    });

    // CartManager tests
    describe('CartManager Boundaries', function() {
        let cartManager;

        beforeEach(function() {
            cartManager = new CartManager();
        });

        it('should create cart for user', function() {
            const cart = cartManager.getOrCreateCart('user1');
            expect(cart).to.not.be.null;
            expect(cart.userId).to.equal('user1');
        });

        it('should return same cart for same user', function() {
            const cart1 = cartManager.getOrCreateCart('user1');
            const cart2 = cartManager.getOrCreateCart('user1');
            expect(cart1).to.equal(cart2);
        });

        it('should remove cart', function() {
            const cart = cartManager.getOrCreateCart('user1');
            const product = new Product('P001', 'Test', 10, 'Cat', 5);
            cart.addItem(product, 1);
            
            const removed = cartManager.removeCart(cart.cartId);
            expect(removed).to.be.true;
            
            const activeCart = cartManager.getActiveCartForUser('user1');
            expect(activeCart).to.be.null;
        });

        it('should get statistics correctly', function() {
            const cart1 = cartManager.getOrCreateCart('user1');
            const cart2 = cartManager.getOrCreateCart('user2');
            
            const product = new Product('P001', 'Test', 50, 'Cat', 100);
            cart1.addItem(product, 2);
            
            const stats = cartManager.getStatistics();
            expect(stats.activeCarts).to.equal(2);
            expect(stats.totalValue).to.equal(100);
        });
    });
});
