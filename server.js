/**
 * E-Commerce Web Server
 * Provides REST API and serves static files for the web UI
 */

const express = require('express');
const path = require('path');
const { ECommerceApp, PaymentMethod, OrderStatus } = require('./src/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize e-commerce application
const ecommerceApp = new ECommerceApp();
ecommerceApp.initialize();

// Store for demo user session
let currentUser = null;
let currentSession = null;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== API ROUTES ====================

// --- Products ---
app.get('/api/products', (req, res) => {
    const { category, search } = req.query;
    let products;
    
    if (search) {
        products = ecommerceApp.searchProducts(search);
    } else if (category) {
        products = ecommerceApp.getProductsByCategory(category);
    } else {
        products = ecommerceApp.productCatalog.getAllProducts().map(p => {
            const inventory = ecommerceApp.inventoryManager.getInventoryItem(p.id);
            const pricing = ecommerceApp.discountManager.calculateBestPrice(p);
            return {
                ...p.toJSON(),
                pricing: pricing,
                availableStock: inventory ? inventory.getAvailableStock() : 0,
                inStock: inventory ? !inventory.isOutOfStock() : false
            };
        });
    }
    
    res.json({ success: true, products });
});

app.get('/api/products/:id', (req, res) => {
    const product = ecommerceApp.getProductDetails(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
});

app.post('/api/products', (req, res) => {
    const { id, name, price, category, stock, description, tags } = req.body;
    
    if (!id || !name || !price || !category) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const { Product } = require('./src/product');
    const product = new Product(id, name, price, category, stock || 0, description || '');
    if (tags && Array.isArray(tags)) {
        product.addTags(tags);
    }
    
    const added = ecommerceApp.productCatalog.addProduct(product);
    if (added) {
        ecommerceApp.inventoryManager.addInventoryItem(id, stock || 0);
        res.json({ success: true, product: ecommerceApp.getProductDetails(id) });
    } else {
        res.status(400).json({ success: false, message: 'Failed to add product (may already exist)' });
    }
});

app.put('/api/products/:id', (req, res) => {
    const product = ecommerceApp.productCatalog.getProduct(req.params.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const { name, price, description, tags, isActive } = req.body;
    
    if (name) product.name = name;
    if (price !== undefined) product.updatePrice(price);
    if (description !== undefined) product.description = description;
    if (tags && Array.isArray(tags)) {
        product.tags = [];
        product.addTags(tags);
    }
    if (isActive !== undefined) {
        if (isActive) product.activate();
        else product.deactivate();
    }
    
    res.json({ success: true, product: ecommerceApp.getProductDetails(req.params.id) });
});

app.delete('/api/products/:id', (req, res) => {
    const removed = ecommerceApp.productCatalog.removeProduct(req.params.id);
    res.json({ success: removed, message: removed ? 'Product removed' : 'Product not found' });
});

// --- Categories ---
app.get('/api/categories', (req, res) => {
    const categories = ecommerceApp.productCatalog.getAllCategories();
    res.json({ success: true, categories });
});

// --- User Authentication ---
app.post('/api/auth/register', (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const result = ecommerceApp.registerUser(email, password, firstName, lastName);
    if (result.success) {
        // Auto-verify for demo
        result.user.verifyAccount(result.verificationToken);
        res.json({ success: true, user: { id: result.user.id, email: result.user.email, firstName: result.user.firstName } });
    } else {
        res.status(400).json(result);
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    const result = ecommerceApp.login(email, password);
    if (result.success) {
        currentUser = result.user;
        currentSession = result.session;
        res.json({ 
            success: true, 
            user: { 
                id: result.user.id, 
                email: result.user.email, 
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                role: result.user.role
            },
            sessionId: result.session.sessionId
        });
    } else {
        res.status(401).json(result);
    }
});

app.post('/api/auth/logout', (req, res) => {
    if (currentSession) {
        ecommerceApp.logout(currentSession.sessionId);
        currentUser = null;
        currentSession = null;
    }
    res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
    if (currentUser) {
        res.json({ 
            success: true, 
            user: { 
                id: currentUser.id, 
                email: currentUser.email, 
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                role: currentUser.role
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Not logged in' });
    }
});

// --- Shopping Cart ---
app.get('/api/cart', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    
    const cart = ecommerceApp.getCart(currentUser.id);
    const items = cart.getItems().map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.getSubtotal()
    }));
    
    res.json({
        success: true,
        cart: {
            items,
            itemCount: cart.getItemCount(),
            subtotal: cart.getSubtotal(),
            subtotalAfterCoupon: cart.getSubtotalAfterCoupon(),
            couponCode: cart.couponCode,
            couponDiscount: cart.getCouponDiscount(),
            totalSavings: cart.getTotalSavings()
        }
    });
});

app.post('/api/cart/add', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    
    const { productId, quantity } = req.body;
    
    if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID required' });
    }
    
    const result = ecommerceApp.addToCart(currentUser.id, productId, quantity || 1);
    res.json(result);
});

app.put('/api/cart/update', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'Product ID and quantity required' });
    }
    
    const result = ecommerceApp.updateCartQuantity(currentUser.id, productId, quantity);
    res.json(result);
});

app.delete('/api/cart/remove/:productId', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    
    const removed = ecommerceApp.removeFromCart(currentUser.id, req.params.productId);
    res.json({ success: removed, message: removed ? 'Item removed' : 'Item not found' });
});

app.post('/api/cart/coupon', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    
    const { couponCode } = req.body;
    
    if (!couponCode) {
        return res.status(400).json({ success: false, message: 'Coupon code required' });
    }
    
    const result = ecommerceApp.applyCoupon(currentUser.id, couponCode);
    res.json(result);
});

// --- Checkout ---
app.post('/api/checkout', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    
    const { paymentMethod, cardNumber, expiryMonth, expiryYear, cvv, cardholderName, shippingAddress, billingAddress } = req.body;
    
    const cart = ecommerceApp.getCart(currentUser.id);
    
    // Set addresses
    if (shippingAddress) {
        cart.setShippingAddress(shippingAddress);
    }
    if (billingAddress) {
        cart.setBillingAddress(billingAddress);
    }
    
    // Process checkout
    const paymentDetails = {
        method: paymentMethod || PaymentMethod.CREDIT_CARD,
        cardNumber: cardNumber || '4532015112830366',
        expiryMonth: expiryMonth || '12',
        expiryYear: expiryYear || (new Date().getFullYear() + 1).toString(),
        cvv: cvv || '123',
        cardholderName: cardholderName || `${currentUser.firstName} ${currentUser.lastName}`
    };
    
    const result = ecommerceApp.checkout(currentUser.id, paymentDetails);
    
    if (result.success) {
        res.json({
            success: true,
            order: {
                orderId: result.order.orderId,
                status: result.order.status,
                paymentStatus: result.order.paymentStatus,
                subtotal: result.order.subtotal,
                tax: result.order.tax,
                shipping: result.order.shipping,
                total: result.order.total,
                items: result.order.items.map(item => ({
                    productId: item.productId,
                    name: item.productName,
                    quantity: item.quantity,
                    price: item.price
                }))
            }
        });
    } else {
        res.status(400).json(result);
    }
});

// --- Orders ---
app.get('/api/orders', (req, res) => {
    if (!currentUser) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    
    const orders = ecommerceApp.getUserOrders(currentUser.id);
    res.json({
        success: true,
        orders: orders.map(order => ({
            orderId: order.orderId,
            status: order.status,
            paymentStatus: order.paymentStatus,
            total: order.total,
            createdAt: order.createdAt,
            itemCount: order.items.length
        }))
    });
});

app.get('/api/orders/:orderId', (req, res) => {
    const order = ecommerceApp.getOrder(req.params.orderId);
    
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({
        success: true,
        order: {
            orderId: order.orderId,
            status: order.status,
            paymentStatus: order.paymentStatus,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
            createdAt: order.createdAt,
            trackingNumber: order.trackingNumber,
            carrier: order.carrier,
            items: order.items.map(item => ({
                productId: item.productId,
                name: item.productName,
                quantity: item.quantity,
                price: item.price,
                discountedPrice: item.discountedPrice
            })),
            statusHistory: order.statusHistory
        }
    });
});

app.post('/api/orders/:orderId/cancel', (req, res) => {
    const { reason } = req.body;
    const result = ecommerceApp.cancelOrder(req.params.orderId, reason || 'Customer requested cancellation');
    res.json(result);
});

// --- Inventory (Admin) ---
app.get('/api/inventory', (req, res) => {
    const stats = ecommerceApp.inventoryManager.getStatistics();
    const items = [];
    
    for (const product of ecommerceApp.productCatalog.getAllProducts()) {
        const inventory = ecommerceApp.inventoryManager.getInventoryItem(product.id);
        if (inventory) {
            items.push({
                productId: product.id,
                productName: product.name,
                currentStock: inventory.currentStock,
                reservedStock: inventory.reservedStock,
                availableStock: inventory.getAvailableStock(),
                reorderPoint: inventory.reorderPoint,
                needsReorder: inventory.needsReorder()
            });
        }
    }
    
    res.json({ success: true, statistics: stats, items });
});

app.post('/api/inventory/restock', (req, res) => {
    const { productId, quantity, purchaseOrder } = req.body;
    
    if (!productId || !quantity) {
        return res.status(400).json({ success: false, message: 'Product ID and quantity required' });
    }
    
    const result = ecommerceApp.restockProduct(productId, quantity, purchaseOrder || '');
    res.json(result);
});

app.get('/api/inventory/alerts', (req, res) => {
    const alerts = ecommerceApp.getLowStockAlerts();
    res.json({ success: true, alerts });
});

// --- Coupons ---
app.get('/api/coupons', (req, res) => {
    const coupons = Array.from(ecommerceApp.discountManager.getCouponDatabase().values()).map(c => ({
        code: c.code,
        type: c.type,
        value: c.value,
        description: c.description,
        minPurchase: c.minPurchase,
        isActive: c.isActive(),
        usageCount: c.usageCount
    }));
    res.json({ success: true, coupons });
});

// --- Dashboard Stats ---
app.get('/api/dashboard', (req, res) => {
    const stats = ecommerceApp.getDashboardStats();
    res.json({ success: true, stats });
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`E-Commerce Server Running`);
    console.log(`========================================`);
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`\nDemo Credentials:`);
    console.log(`  Email: demo@example.com`);
    console.log(`  Password: DemoPass123`);
    console.log(`\nAvailable Coupons:`);
    console.log(`  SAVE10 - 10% off orders over $25`);
    console.log(`  FLAT5 - $5 off any order`);
    console.log(`  FREESHIP - Free shipping on orders over $30`);
    console.log(`  PREMIUM20 - 20% off electronics over $100`);
    console.log(`========================================\n`);
});

module.exports = app;
