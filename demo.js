/**
 * E-Commerce Application Demo
 * Demonstrates the functionality of the e-commerce system
 */

const { 
    ECommerceApp, 
    PaymentMethod, 
    OrderStatus 
} = require('./src/index');

// Create and initialize the application
console.log('========================================');
console.log('E-Commerce Application Demo');
console.log('========================================\n');

const app = new ECommerceApp();
app.initialize();
console.log('✓ Application initialized with sample data\n');

// Display dashboard statistics
console.log('--- Dashboard Statistics ---');
const stats = app.getDashboardStats();
console.log(`Total Products: ${stats.products.total}`);
console.log(`Categories: ${stats.products.categories.join(', ')}`);
console.log(`Total Inventory: ${stats.inventory.totalStock} units`);
console.log(`Active Coupons: ${stats.discounts.activeCoupons}`);
console.log('');

// Register a new user
console.log('--- User Registration ---');
const regResult = app.registerUser('demo@example.com', 'DemoPass123', 'Demo', 'User');
if (regResult.success) {
    console.log(`✓ User registered: ${regResult.user.email}`);
    // Verify the account
    regResult.user.verifyAccount(regResult.verificationToken);
    console.log('✓ Account verified');
} else {
    console.log(`✗ Registration failed: ${regResult.message}`);
}
console.log('');

// Login
console.log('--- User Login ---');
const loginResult = app.login('demo@example.com', 'DemoPass123');
if (loginResult.success) {
    console.log(`✓ Logged in successfully`);
    console.log(`  Session ID: ${loginResult.session.sessionId.substring(0, 20)}...`);
}
const userId = regResult.user.id;
console.log('');

// Browse products
console.log('--- Product Catalog ---');
const electronics = app.getProductsByCategory('Electronics');
console.log(`Electronics (${electronics.length} products):`);
electronics.forEach(product => {
    console.log(`  - ${product.name}: $${product.price} (${product.availableStock} in stock)`);
    if (product.pricing.appliedPromotion) {
        console.log(`    Promotional Price: $${product.pricing.finalPrice} (Save ${product.pricing.savingsPercent}%)`);
    }
});
console.log('');

// Search for products
console.log('--- Product Search ---');
const searchResults = app.searchProducts('wireless');
console.log(`Search for "wireless" found ${searchResults.length} products:`);
searchResults.forEach(p => console.log(`  - ${p.name}`));
console.log('');

// Add items to cart
console.log('--- Shopping Cart ---');
app.addToCart(userId, 'PROD001', 2);
console.log('✓ Added Wireless Bluetooth Headphones x2');
app.addToCart(userId, 'PROD002', 1);
console.log('✓ Added USB-C Fast Charging Cable x1');

const cart = app.getCart(userId);
console.log(`\nCart Summary:`);
console.log(`  Items: ${cart.getItemCount()}`);
console.log(`  Subtotal: $${cart.getSubtotal().toFixed(2)}`);
console.log('');

// Apply coupon
console.log('--- Apply Coupon ---');
const couponResult = app.applyCoupon(userId, 'SAVE10');
if (couponResult.success) {
    console.log(`✓ Coupon SAVE10 applied: 10% off`);
    console.log(`  Subtotal after coupon: $${cart.getSubtotalAfterCoupon().toFixed(2)}`);
    console.log(`  Total savings: $${cart.getTotalSavings().toFixed(2)}`);
} else {
    console.log(`✗ Coupon failed: ${couponResult.message}`);
}
console.log('');

// Set addresses
const address = {
    street: '123 Demo Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA'
};
cart.setShippingAddress(address);
cart.setBillingAddress(address);
console.log('✓ Shipping and billing addresses set\n');

// Checkout
console.log('--- Checkout ---');
const checkoutResult = app.checkout(userId, {
    method: PaymentMethod.CREDIT_CARD,
    cardNumber: '4532015112830366',
    expiryMonth: '12',
    expiryYear: (new Date().getFullYear() + 1).toString(),
    cvv: '123',
    cardholderName: 'Demo User'
});

if (checkoutResult.success) {
    const order = checkoutResult.order;
    console.log('✓ Order placed successfully!');
    console.log(`  Order ID: ${order.orderId}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Payment Status: ${order.paymentStatus}`);
    console.log(`  Subtotal: $${order.subtotal.toFixed(2)}`);
    console.log(`  Tax (${order.taxRate}%): $${order.tax.toFixed(2)}`);
    console.log(`  Shipping: $${order.shipping.toFixed(2)}`);
    console.log(`  Total: $${order.total.toFixed(2)}`);
} else {
    console.log(`✗ Checkout failed: ${checkoutResult.message}`);
}
console.log('');

// View orders
console.log('--- Order History ---');
const orders = app.getUserOrders(userId);
console.log(`Total orders: ${orders.length}`);
orders.forEach(order => {
    console.log(`  Order ${order.orderId}: ${order.status} - $${order.total.toFixed(2)}`);
});
console.log('');

// Simulate order processing
if (checkoutResult.success) {
    console.log('--- Order Processing Simulation ---');
    const order = checkoutResult.order;
    
    // Processing
    order.updateStatus(OrderStatus.PROCESSING, 'Order picked up for packing');
    console.log(`✓ Order status: ${order.status}`);
    
    // Shipped
    order.updateStatus(OrderStatus.SHIPPED);
    order.setTrackingInfo('TRACK123456789', 'FedEx', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    console.log(`✓ Order shipped with tracking: ${order.trackingNumber}`);
    
    // Delivered
    order.updateStatus(OrderStatus.DELIVERED);
    console.log(`✓ Order delivered!`);
}
console.log('');

// Inventory check
console.log('--- Inventory Status ---');
const lowStock = app.inventoryManager.getItemsNeedingReorder();
if (lowStock.length > 0) {
    console.log('Products needing reorder:');
    lowStock.forEach(item => {
        console.log(`  - ${item.productId}: ${item.currentStock} units (reorder at ${item.reorderPoint})`);
    });
} else {
    console.log('All products adequately stocked');
}
console.log('');

// Restock a product
console.log('--- Restocking ---');
const restockResult = app.restockProduct('PROD001', 50, 'PO-2024-001');
if (restockResult.success) {
    console.log(`✓ Restocked PROD001: ${restockResult.newStock} units now available`);
}
console.log('');

// Logout
console.log('--- Logout ---');
app.logout(loginResult.session.sessionId);
console.log('✓ User logged out\n');

// Final statistics
console.log('========================================');
console.log('Final Statistics');
console.log('========================================');
const finalStats = app.getDashboardStats();
console.log(`Orders: ${finalStats.orders.totalOrders} (Revenue: $${finalStats.orders.totalRevenue.toFixed(2)})`);
console.log(`Inventory: ${finalStats.inventory.availableStock} units available`);
console.log(`Users: ${finalStats.users.totalUsers} registered`);
console.log('');
console.log('Demo completed successfully!');
