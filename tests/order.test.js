/**
 * Order Processing Module Tests
 * Comprehensive test suite for mutation testing
 */

const { expect } = require('chai');
const { Order, OrderItem, OrderManager, OrderStatus, PaymentStatus, PaymentMethod } = require('../src/order');
const { ShoppingCart } = require('../src/cart');
const { Product } = require('../src/product');

describe('OrderItem', function() {
    it('should create from cart item', function() {
        const product = new Product('P001', 'Test', 29.99, 'Cat', 100);
        const cart = new ShoppingCart('user1');
        cart.addItem(product, 2);
        const cartItem = cart.getItem('P001');
        
        const orderItem = new OrderItem(cartItem);
        expect(orderItem.productId).to.equal('P001');
        expect(orderItem.productName).to.equal('Test');
        expect(orderItem.quantity).to.equal(2);
        expect(orderItem.subtotal).to.be.closeTo(59.98, 0.01);
    });

    it('should convert to JSON', function() {
        const product = new Product('P001', 'Test', 29.99, 'Cat', 100);
        const cart = new ShoppingCart('user1');
        cart.addItem(product, 2);
        const orderItem = new OrderItem(cart.getItem('P001'));
        
        const json = orderItem.toJSON();
        expect(json.productId).to.equal('P001');
        expect(json.quantity).to.equal(2);
    });
});

describe('Order', function() {
    let cart;
    let product;
    const validAddress = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
    };

    beforeEach(function() {
        cart = new ShoppingCart('user123');
        product = new Product('P001', 'Test Product', 50, 'Electronics', 100);
        cart.addItem(product, 2);
        cart.setShippingAddress(validAddress);
        cart.setBillingAddress(validAddress);
    });

    describe('Constructor', function() {
        it('should create order from cart', function() {
            const order = new Order(cart, 8.25, { baseRate: 5 });
            expect(order.orderId).to.be.a('string');
            expect(order.userId).to.equal('user123');
            expect(order.items.length).to.equal(1);
            expect(order.subtotal).to.equal(100);
            expect(order.status).to.equal(OrderStatus.PENDING);
        });

        it('should calculate tax correctly', function() {
            const order = new Order(cart, 10);
            expect(order.tax).to.equal(10);
        });

        it('should include status history', function() {
            const order = new Order(cart);
            expect(order.statusHistory.length).to.equal(1);
            expect(order.statusHistory[0].status).to.equal(OrderStatus.PENDING);
        });
    });

    describe('getItemCount()', function() {
        it('should return total quantity', function() {
            const order = new Order(cart);
            expect(order.getItemCount()).to.equal(2);
        });
    });

    describe('updateStatus()', function() {
        let order;

        beforeEach(function() {
            order = new Order(cart);
        });

        it('should update valid status transition', function() {
            const result = order.updateStatus(OrderStatus.CONFIRMED, 'Payment received');
            expect(result.success).to.be.true;
            expect(order.status).to.equal(OrderStatus.CONFIRMED);
            expect(order.statusHistory.length).to.equal(2);
        });

        it('should reject invalid status', function() {
            const result = order.updateStatus('invalid_status');
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Invalid status');
        });

        it('should reject invalid transition', function() {
            const result = order.updateStatus(OrderStatus.DELIVERED);
            expect(result.success).to.be.false;
            expect(result.message).to.include('Cannot transition');
        });

        it('should allow PENDING to CANCELLED', function() {
            const result = order.updateStatus(OrderStatus.CANCELLED);
            expect(result.success).to.be.true;
        });

        it('should not allow transition from CANCELLED', function() {
            order.updateStatus(OrderStatus.CANCELLED);
            const result = order.updateStatus(OrderStatus.CONFIRMED);
            expect(result.success).to.be.false;
        });

        it('should follow full lifecycle', function() {
            expect(order.updateStatus(OrderStatus.CONFIRMED).success).to.be.true;
            expect(order.updateStatus(OrderStatus.PROCESSING).success).to.be.true;
            expect(order.updateStatus(OrderStatus.SHIPPED).success).to.be.true;
            expect(order.updateStatus(OrderStatus.DELIVERED).success).to.be.true;
            expect(order.status).to.equal(OrderStatus.DELIVERED);
        });
    });

    describe('setPaymentMethod()', function() {
        it('should set valid payment method', function() {
            const order = new Order(cart);
            expect(order.setPaymentMethod(PaymentMethod.CREDIT_CARD)).to.be.true;
            expect(order.paymentMethod).to.equal(PaymentMethod.CREDIT_CARD);
        });

        it('should reject invalid payment method', function() {
            const order = new Order(cart);
            expect(order.setPaymentMethod('bitcoin')).to.be.false;
        });
    });

    describe('processPayment()', function() {
        let order;

        beforeEach(function() {
            order = new Order(cart);
        });

        it('should reject without payment method', function() {
            const result = order.processPayment({});
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Payment method not set');
        });

        it('should process valid credit card payment', function() {
            order.setPaymentMethod(PaymentMethod.CREDIT_CARD);
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.true;
            expect(order.paymentStatus).to.equal(PaymentStatus.COMPLETED);
            expect(order.status).to.equal(OrderStatus.CONFIRMED);
        });

        it('should reject invalid card number', function() {
            order.setPaymentMethod(PaymentMethod.CREDIT_CARD);
            const result = order.processPayment({
                cardNumber: '1234567890123456',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
            expect(order.paymentStatus).to.equal(PaymentStatus.FAILED);
        });

        it('should reject expired card', function() {
            order.setPaymentMethod(PaymentMethod.CREDIT_CARD);
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: '01',
                expiryYear: '2020',
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
        });

        it('should process PayPal payment', function() {
            order.setPaymentMethod(PaymentMethod.PAYPAL);
            const result = order.processPayment({
                email: 'test@example.com'
            });
            expect(result.success).to.be.true;
        });

        it('should reject invalid PayPal email', function() {
            order.setPaymentMethod(PaymentMethod.PAYPAL);
            const result = order.processPayment({
                email: 'invalid-email'
            });
            expect(result.success).to.be.false;
        });

        it('should process bank transfer', function() {
            order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
            const result = order.processPayment({
                accountNumber: '12345678901234',
                routingNumber: '123456789'
            });
            expect(result.success).to.be.true;
        });

        it('should process cash on delivery', function() {
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            const result = order.processPayment({});
            expect(result.success).to.be.true;
        });

        it('should not process already completed payment', function() {
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            order.processPayment({});
            const result = order.processPayment({});
            expect(result.success).to.be.false;
            expect(result.message).to.equal('Payment already completed');
        });

        it('should not process payment for cancelled order', function() {
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            order.updateStatus(OrderStatus.CANCELLED);
            const result = order.processPayment({});
            expect(result.success).to.be.false;
        });

        it('should handle simulated failure', function() {
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            const result = order.processPayment({ simulateFail: true });
            expect(result.success).to.be.false;
        });
    });

    describe('setTrackingInfo()', function() {
        let order;

        beforeEach(function() {
            order = new Order(cart);
        });

        it('should set tracking info', function() {
            const result = order.setTrackingInfo('TRACK123', 'FedEx', new Date());
            expect(result.success).to.be.true;
            expect(order.trackingNumber).to.equal('TRACK123');
            expect(order.carrier).to.equal('FedEx');
        });

        it('should reject for cancelled order', function() {
            order.updateStatus(OrderStatus.CANCELLED);
            const result = order.setTrackingInfo('TRACK123', 'FedEx');
            expect(result.success).to.be.false;
        });

        it('should reject invalid tracking number', function() {
            const result = order.setTrackingInfo('', 'FedEx');
            expect(result.success).to.be.false;
        });

        it('should reject invalid carrier', function() {
            const result = order.setTrackingInfo('TRACK123', '');
            expect(result.success).to.be.false;
        });
    });

    describe('cancel()', function() {
        it('should cancel pending order', function() {
            const order = new Order(cart);
            const result = order.cancel('Changed my mind');
            expect(result.success).to.be.true;
            expect(order.status).to.equal(OrderStatus.CANCELLED);
        });

        it('should cancel confirmed order', function() {
            const order = new Order(cart);
            order.updateStatus(OrderStatus.CONFIRMED);
            const result = order.cancel();
            expect(result.success).to.be.true;
        });

        it('should refund payment when cancelling', function() {
            const order = new Order(cart);
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            order.processPayment({});
            order.cancel();
            expect(order.paymentStatus).to.equal(PaymentStatus.REFUNDED);
        });

        it('should not cancel shipped order', function() {
            const order = new Order(cart);
            order.updateStatus(OrderStatus.CONFIRMED);
            order.updateStatus(OrderStatus.PROCESSING);
            order.updateStatus(OrderStatus.SHIPPED);
            const result = order.cancel();
            expect(result.success).to.be.false;
        });
    });

    describe('refund()', function() {
        it('should refund delivered order', function() {
            const order = new Order(cart);
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            order.processPayment({});
            order.updateStatus(OrderStatus.PROCESSING);
            order.updateStatus(OrderStatus.SHIPPED);
            order.updateStatus(OrderStatus.DELIVERED);
            
            const result = order.refund('Defective product');
            expect(result.success).to.be.true;
            expect(result.amount).to.equal(order.total);
        });

        it('should not refund non-delivered order', function() {
            const order = new Order(cart);
            const result = order.refund();
            expect(result.success).to.be.false;
        });

        it('should not refund without payment', function() {
            const order = new Order(cart);
            order.status = OrderStatus.DELIVERED;
            const result = order.refund();
            expect(result.success).to.be.false;
        });
    });

    describe('canBeModified()', function() {
        it('should allow modification for pending order', function() {
            const order = new Order(cart);
            expect(order.canBeModified()).to.be.true;
        });

        it('should allow modification for confirmed order', function() {
            const order = new Order(cart);
            order.updateStatus(OrderStatus.CONFIRMED);
            expect(order.canBeModified()).to.be.true;
        });

        it('should not allow modification for processing order', function() {
            const order = new Order(cart);
            order.updateStatus(OrderStatus.CONFIRMED);
            order.updateStatus(OrderStatus.PROCESSING);
            expect(order.canBeModified()).to.be.false;
        });
    });

    describe('toJSON()', function() {
        it('should return complete order data', function() {
            const order = new Order(cart, 10, { baseRate: 5 });
            const json = order.toJSON();
            
            expect(json.orderId).to.equal(order.orderId);
            expect(json.userId).to.equal('user123');
            expect(json.items.length).to.equal(1);
            expect(json.subtotal).to.equal(100);
            expect(json.status).to.equal(OrderStatus.PENDING);
        });
    });
});

describe('OrderManager', function() {
    let manager;
    let cart;
    let product;
    const validAddress = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
    };

    beforeEach(function() {
        manager = new OrderManager();
        cart = new ShoppingCart('user123');
        product = new Product('P001', 'Test Product', 50, 'Electronics', 100);
        cart.addItem(product, 2);
        cart.setShippingAddress(validAddress);
        cart.setBillingAddress(validAddress);
    });

    describe('createOrder()', function() {
        it('should create order from valid cart', function() {
            const result = manager.createOrder(cart, null, 8.25);
            expect(result.success).to.be.true;
            expect(result.order).to.not.be.null;
            expect(cart.status).to.equal('checked_out');
        });

        it('should reject invalid cart', function() {
            const result = manager.createOrder({}, null);
            expect(result.success).to.be.false;
        });

        it('should reject cart that fails validation', function() {
            const emptyCart = new ShoppingCart('user1');
            emptyCart.setShippingAddress(validAddress);
            emptyCart.setBillingAddress(validAddress);
            const result = manager.createOrder(emptyCart);
            expect(result.success).to.be.false;
        });
    });

    describe('getOrder()', function() {
        it('should return order by ID', function() {
            const result = manager.createOrder(cart, null);
            const order = manager.getOrder(result.order.orderId);
            expect(order).to.equal(result.order);
        });

        it('should return null for non-existent order', function() {
            expect(manager.getOrder('NONEXISTENT')).to.be.null;
        });
    });

    describe('getOrdersForUser()', function() {
        it('should return all user orders', function() {
            manager.createOrder(cart, null);
            
            const cart2 = new ShoppingCart('user123');
            cart2.addItem(product, 1);
            cart2.setShippingAddress(validAddress);
            cart2.setBillingAddress(validAddress);
            manager.createOrder(cart2, null);

            const orders = manager.getOrdersForUser('user123');
            expect(orders.length).to.equal(2);
        });

        it('should return empty array for user without orders', function() {
            expect(manager.getOrdersForUser('noone')).to.be.an('array').that.is.empty;
        });
    });

    describe('getOrdersByStatus()', function() {
        it('should return orders by status', function() {
            const result = manager.createOrder(cart, null);
            const orders = manager.getOrdersByStatus(OrderStatus.PENDING);
            expect(orders.length).to.equal(1);
        });

        it('should return empty for non-matching status', function() {
            manager.createOrder(cart, null);
            const orders = manager.getOrdersByStatus(OrderStatus.DELIVERED);
            expect(orders).to.be.an('array').that.is.empty;
        });
    });

    describe('getOrdersInDateRange()', function() {
        it('should return orders in range', function() {
            manager.createOrder(cart, null);
            const now = new Date();
            const yesterday = new Date(now - 86400000);
            const tomorrow = new Date(now.getTime() + 86400000);
            
            const orders = manager.getOrdersInDateRange(yesterday, tomorrow);
            expect(orders.length).to.equal(1);
        });

        it('should return empty for invalid dates', function() {
            expect(manager.getOrdersInDateRange('invalid', 'dates')).to.be.an('array').that.is.empty;
        });
    });

    describe('getRecentOrders()', function() {
        it('should return recent orders', function() {
            manager.createOrder(cart, null);
            const recent = manager.getRecentOrders(5);
            expect(recent.length).to.equal(1);
        });

        it('should use default count', function() {
            manager.createOrder(cart, null);
            const recent = manager.getRecentOrders();
            expect(recent).to.be.an('array');
        });

        it('should handle invalid count', function() {
            manager.createOrder(cart, null);
            const recent = manager.getRecentOrders(-1);
            expect(recent).to.be.an('array');
        });
    });

    describe('getStatistics()', function() {
        it('should return correct statistics', function() {
            const result = manager.createOrder(cart, null);
            result.order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            result.order.processPayment({});

            const stats = manager.getStatistics();
            expect(stats.totalOrders).to.equal(1);
            expect(stats.pendingOrders).to.equal(1);
            expect(stats.totalRevenue).to.be.greaterThan(0);
        });
    });

    describe('searchOrders()', function() {
        beforeEach(function() {
            manager.createOrder(cart, null);
        });

        it('should search by userId', function() {
            const results = manager.searchOrders({ userId: 'user123' });
            expect(results.length).to.equal(1);
        });

        it('should search by status', function() {
            const results = manager.searchOrders({ status: OrderStatus.PENDING });
            expect(results.length).to.equal(1);
        });

        it('should search by minTotal', function() {
            const results = manager.searchOrders({ minTotal: 50 });
            expect(results.length).to.equal(1);
        });

        it('should search by maxTotal', function() {
            const results = manager.searchOrders({ maxTotal: 200 });
            expect(results.length).to.equal(1);
        });

        it('should return empty for invalid criteria', function() {
            expect(manager.searchOrders(null)).to.be.an('array').that.is.empty;
            expect(manager.searchOrders('invalid')).to.be.an('array').that.is.empty;
        });
    });
});

// Additional payment validation tests
describe('Payment Validation Edge Cases', function() {
    let cart;
    let order;
    const validAddress = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
    };

    beforeEach(function() {
        cart = new ShoppingCart('user123');
        const product = new Product('P001', 'Test Product', 50, 'Electronics', 100);
        cart.addItem(product, 2);
        cart.setShippingAddress(validAddress);
        cart.setBillingAddress(validAddress);
        order = new Order(cart);
    });

    describe('Credit Card Validation', function() {
        beforeEach(function() {
            order.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        });

        it('should reject card number with wrong length', function() {
            const result = order.processPayment({
                cardNumber: '123456789',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
        });

        it('should reject invalid expiry month (>12)', function() {
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: '13',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
        });

        it('should reject invalid expiry month (0)', function() {
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: '0',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
        });

        it('should reject missing expiry data', function() {
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
        });

        it('should reject invalid CVV', function() {
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '12',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
        });

        it('should reject short cardholder name', function() {
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'A'
            });
            expect(result.success).to.be.false;
        });

        it('should accept card number with spaces', function() {
            const result = order.processPayment({
                cardNumber: '4532 0151 1283 0366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.true;
        });

        it('should accept card number with dashes', function() {
            const result = order.processPayment({
                cardNumber: '4532-0151-1283-0366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.true;
        });

        it('should reject expired card in current month', function() {
            const now = new Date();
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: (now.getMonth()).toString().padStart(2, '0'),
                expiryYear: now.getFullYear().toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            // If current month is January (0), previous month check won't fail
            if (now.getMonth() > 0) {
                expect(result.success).to.be.false;
            }
        });

        it('should reject non-string card number', function() {
            const result = order.processPayment({
                cardNumber: 4532015112830366,
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.false;
        });
    });

    describe('Bank Transfer Validation', function() {
        beforeEach(function() {
            order.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        });

        it('should reject short account number', function() {
            const result = order.processPayment({
                accountNumber: '1234567',
                routingNumber: '123456789'
            });
            expect(result.success).to.be.false;
        });

        it('should reject short routing number', function() {
            const result = order.processPayment({
                accountNumber: '12345678901234',
                routingNumber: '1234567'
            });
            expect(result.success).to.be.false;
        });

        it('should reject missing account number', function() {
            const result = order.processPayment({
                routingNumber: '123456789'
            });
            expect(result.success).to.be.false;
        });

        it('should reject missing routing number', function() {
            const result = order.processPayment({
                accountNumber: '12345678901234'
            });
            expect(result.success).to.be.false;
        });

        it('should reject non-string account number', function() {
            const result = order.processPayment({
                accountNumber: 12345678901234,
                routingNumber: '123456789'
            });
            expect(result.success).to.be.false;
        });
    });

    describe('PayPal Validation', function() {
        beforeEach(function() {
            order.setPaymentMethod(PaymentMethod.PAYPAL);
        });

        it('should reject non-string email', function() {
            const result = order.processPayment({
                email: 123
            });
            expect(result.success).to.be.false;
        });

        it('should reject missing email', function() {
            const result = order.processPayment({});
            expect(result.success).to.be.false;
        });
    });

    describe('Payment Details Validation', function() {
        it('should reject null payment details', function() {
            order.setPaymentMethod(PaymentMethod.CREDIT_CARD);
            const result = order.processPayment(null);
            expect(result.success).to.be.false;
        });

        it('should handle payment method set from details', function() {
            const result = order.processPayment({
                method: PaymentMethod.CASH_ON_DELIVERY
            });
            expect(result.success).to.be.true;
        });

        it('should process debit card payment', function() {
            order.setPaymentMethod(PaymentMethod.DEBIT_CARD);
            const result = order.processPayment({
                cardNumber: '4532015112830366',
                expiryMonth: '12',
                expiryYear: (new Date().getFullYear() + 1).toString(),
                cvv: '123',
                cardholderName: 'John Doe'
            });
            expect(result.success).to.be.true;
        });
    });

    describe('Order Tracking', function() {
        it('should set tracking with estimated delivery', function() {
            const estimatedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const result = order.setTrackingInfo('TRACK123', 'FedEx', estimatedDate);
            expect(result.success).to.be.true;
            expect(order.estimatedDelivery).to.equal(estimatedDate);
        });

        it('should reject tracking for refunded order', function() {
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            order.processPayment({});
            order.updateStatus(OrderStatus.PROCESSING);
            order.updateStatus(OrderStatus.SHIPPED);
            order.updateStatus(OrderStatus.DELIVERED);
            order.refund();
            
            const result = order.setTrackingInfo('TRACK123', 'FedEx');
            expect(result.success).to.be.false;
        });

        it('should not set estimated delivery if not a Date', function() {
            const result = order.setTrackingInfo('TRACK123', 'FedEx', 'invalid');
            expect(result.success).to.be.true;
            expect(order.estimatedDelivery).to.be.null;
        });
    });

    describe('Order Confirm convenience method', function() {
        it('should confirm order using convenience method', function() {
            const result = order.confirm();
            expect(result.success).to.be.true;
            expect(order.status).to.equal(OrderStatus.CONFIRMED);
        });
    });
});
