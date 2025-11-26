/**
 * E-Commerce Application - Main Integration Module
 * 
 * This module integrates all the e-commerce components:
 * - Product Catalog
 * - Shopping Cart
 * - Order Processing
 * - User Management
 * - Inventory Management
 * - Discount Management
 * 
 * @module ECommerceApp
 */

const { Product, ProductCatalog } = require('./product');
const { CartItem, ShoppingCart, CartManager } = require('./cart');
const { Order, OrderItem, OrderManager, OrderStatus, PaymentStatus, PaymentMethod } = require('./order');
const { User, UserManager, UserRole, AccountStatus } = require('./user');
const { InventoryItem, InventoryManager, StockMovement, StockAlert, MovementType, AlertType } = require('./inventory');
const { Coupon, Promotion, DiscountManager, DiscountType, CouponStatus } = require('./discount');

/**
 * Main E-Commerce Application class
 * Provides a unified interface for e-commerce operations
 */
class ECommerceApp {
    constructor() {
        this.productCatalog = new ProductCatalog();
        this.cartManager = new CartManager();
        this.orderManager = new OrderManager();
        this.userManager = new UserManager();
        this.inventoryManager = new InventoryManager();
        this.discountManager = new DiscountManager();
        
        // Default configuration
        this.taxRate = 8.25;
        this.shippingOptions = {
            baseRate: 5.99,
            freeShippingThreshold: 50,
            perItemRate: 0
        };
    }

    /**
     * Initializes the application with sample data
     * @returns {boolean} True if initialization was successful
     */
    initialize() {
        try {
            this._createSampleProducts();
            this._createSampleCoupons();
            this._createSamplePromotions();
            return true;
        } catch (error) {
            console.error('Initialization error:', error);
            return false;
        }
    }

    /**
     * Creates sample products for demonstration
     * @private
     */
    _createSampleProducts() {
        const products = [
            { id: 'PROD001', name: 'Wireless Bluetooth Headphones', price: 79.99, category: 'Electronics', stock: 150, description: 'Premium wireless headphones with active noise cancellation', tags: ['wireless', 'audio', 'featured'] },
            { id: 'PROD002', name: 'USB-C Fast Charging Cable', price: 19.99, category: 'Electronics', stock: 500, description: 'High-speed USB-C charging cable with braided nylon cover', tags: ['charging', 'cable', 'essentials'] },
            { id: 'PROD003', name: 'Smart Watch Pro', price: 199.99, category: 'Electronics', stock: 75, description: 'Advanced smart watch with health monitoring features', tags: ['smartwatch', 'fitness', 'featured'] },
            { id: 'PROD004', name: 'Premium Cotton T-Shirt', price: 29.99, category: 'Clothing', stock: 200, description: '100% organic cotton t-shirt in multiple colors', tags: ['clothing', 'cotton', 'casual'] },
            { id: 'PROD005', name: 'Classic Denim Jeans', price: 49.99, category: 'Clothing', stock: 180, description: 'Classic fit denim jeans with comfortable stretch', tags: ['jeans', 'denim', 'casual'] },
            { id: 'PROD006', name: 'Running Shoes Pro', price: 89.99, category: 'Shoes', stock: 120, description: 'Professional running shoes with advanced cushioning', tags: ['shoes', 'running', 'sports'] },
            { id: 'PROD007', name: 'Leather Wallet', price: 39.99, category: 'Accessories', stock: 100, description: 'Genuine leather wallet with RFID protection', tags: ['wallet', 'leather', 'accessories'] },
            { id: 'PROD008', name: 'Stainless Steel Water Bottle', price: 24.99, category: 'Accessories', stock: 250, description: 'Insulated water bottle keeps drinks cold for 24 hours', tags: ['bottle', 'hydration', 'essentials'] },
            { id: 'PROD009', name: 'Wireless Earbuds', price: 59.99, category: 'Electronics', stock: 180, description: 'True wireless earbuds with 30 hour battery life', tags: ['wireless', 'audio', 'earbuds'] },
            { id: 'PROD010', name: 'Backpack Pro', price: 69.99, category: 'Accessories', stock: 90, description: 'Durable backpack with laptop compartment', tags: ['backpack', 'travel', 'laptop'] }
        ];

        for (const data of products) {
            const product = new Product(data.id, data.name, data.price, data.category, data.stock, data.description);
            product.addTags(data.tags);
            this.productCatalog.addProduct(product);
            this.inventoryManager.addInventoryItem(data.id, data.stock);
        }
    }

    /**
     * Creates sample coupons for demonstration
     * @private
     */
    _createSampleCoupons() {
        const coupon1 = this.discountManager.createCoupon('SAVE10', DiscountType.PERCENTAGE, 10);
        if (coupon1.success) {
            coupon1.coupon.setMinPurchase(25);
            coupon1.coupon.description = '10% off orders over $25';
        }

        const coupon2 = this.discountManager.createCoupon('FLAT5', DiscountType.FIXED_AMOUNT, 5);
        if (coupon2.success) {
            coupon2.coupon.description = '$5 off any order';
        }

        const coupon3 = this.discountManager.createCoupon('FREESHIP', DiscountType.FREE_SHIPPING, 0);
        if (coupon3.success) {
            coupon3.coupon.setMinPurchase(30);
            coupon3.coupon.description = 'Free shipping on orders over $30';
        }

        const coupon4 = this.discountManager.createCoupon('PREMIUM20', DiscountType.PERCENTAGE, 20);
        if (coupon4.success) {
            coupon4.coupon.setMinPurchase(100);
            coupon4.coupon.applicableCategories = ['Electronics'];
            coupon4.coupon.description = '20% off electronics orders over $100';
        }
    }

    /**
     * Creates sample promotions for demonstration
     * @private
     */
    _createSamplePromotions() {
        const promo1 = this.discountManager.createPromotion('PROMO001', 'Electronics Sale', DiscountType.PERCENTAGE, 15);
        if (promo1.success) {
            promo1.promotion.applicableCategories = ['Electronics'];
            promo1.promotion.priority = 10;
            promo1.promotion.description = '15% off all electronics';
        }

        const promo2 = this.discountManager.createPromotion('PROMO002', 'Summer Clearance', DiscountType.PERCENTAGE, 10);
        if (promo2.success) {
            promo2.promotion.applicableCategories = ['Clothing', 'Shoes'];
            promo2.promotion.priority = 5;
            promo2.promotion.description = '10% off clothing and shoes';
        }
    }

    /**
     * Registers a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} firstName - First name
     * @param {string} lastName - Last name
     * @returns {Object} Result with user or error
     */
    registerUser(email, password, firstName, lastName) {
        return this.userManager.register(email, password, firstName, lastName);
    }

    /**
     * Authenticates a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Result with session or error
     */
    login(email, password) {
        return this.userManager.authenticate(email, password);
    }

    /**
     * Logs out a user
     * @param {string} sessionId - Session ID
     * @returns {boolean} True if logged out
     */
    logout(sessionId) {
        return this.userManager.logout(sessionId);
    }

    /**
     * Gets or creates a shopping cart for a user
     * @param {string} userId - User ID
     * @returns {ShoppingCart} Shopping cart
     */
    getCart(userId) {
        return this.cartManager.getOrCreateCart(userId);
    }

    /**
     * Adds a product to a user's cart
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @returns {Object} Result with success flag
     */
    addToCart(userId, productId, quantity = 1) {
        const product = this.productCatalog.getProduct(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        const inventory = this.inventoryManager.getInventoryItem(productId);
        if (!inventory || inventory.getAvailableStock() < quantity) {
            return { success: false, message: 'Insufficient stock' };
        }

        const cart = this.getCart(userId);
        const result = cart.addItem(product, quantity);

        if (result.success) {
            // Reserve stock
            this.inventoryManager.reserveStock(productId, quantity);
        }

        return result;
    }

    /**
     * Removes a product from a user's cart
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @returns {boolean} True if removed
     */
    removeFromCart(userId, productId) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return false;
        }

        const item = cart.getItem(productId);
        if (!item) {
            return false;
        }

        const quantity = item.quantity;
        const removed = cart.removeItem(productId);

        if (removed) {
            // Release reserved stock
            this.inventoryManager.releaseReservedStock(productId, quantity);
        }

        return removed;
    }

    /**
     * Updates cart item quantity
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {number} quantity - New quantity
     * @returns {Object} Result with success flag
     */
    updateCartQuantity(userId, productId, quantity) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return { success: false, message: 'Cart not found' };
        }

        const item = cart.getItem(productId);
        if (!item) {
            return { success: false, message: 'Item not in cart' };
        }

        const currentQuantity = item.quantity;
        const product = this.productCatalog.getProduct(productId);
        const inventory = this.inventoryManager.getInventoryItem(productId);

        if (quantity > currentQuantity) {
            const additionalNeeded = quantity - currentQuantity;
            if (!inventory || inventory.getAvailableStock() < additionalNeeded) {
                return { success: false, message: 'Insufficient stock' };
            }
        }

        const result = cart.updateItemQuantity(productId, quantity, product);

        if (result.success) {
            const difference = quantity - currentQuantity;
            if (difference > 0) {
                this.inventoryManager.reserveStock(productId, difference);
            } else if (difference < 0) {
                this.inventoryManager.releaseReservedStock(productId, Math.abs(difference));
            }
        }

        return result;
    }

    /**
     * Applies a coupon to a cart
     * @param {string} userId - User ID
     * @param {string} couponCode - Coupon code
     * @returns {Object} Result with success flag
     */
    applyCoupon(userId, couponCode) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return { success: false, message: 'Cart not found' };
        }

        const couponDatabase = this.discountManager.getCouponDatabase();
        return cart.applyCoupon(couponCode, couponDatabase);
    }

    /**
     * Processes checkout
     * @param {string} userId - User ID
     * @param {Object} paymentDetails - Payment details
     * @returns {Object} Result with order or error
     */
    checkout(userId, paymentDetails) {
        const cart = this.cartManager.getActiveCartForUser(userId);
        if (!cart) {
            return { success: false, message: 'Cart not found' };
        }

        // Create order
        const orderResult = this.orderManager.createOrder(
            cart,
            this.productCatalog,
            this.taxRate,
            this.shippingOptions
        );

        if (!orderResult.success) {
            return orderResult;
        }

        const order = orderResult.order;

        // Process payment
        if (paymentDetails.method) {
            order.setPaymentMethod(paymentDetails.method);
        }

        const paymentResult = order.processPayment(paymentDetails);

        if (paymentResult.success) {
            // Update inventory (convert reserved to sold)
            for (const item of order.items) {
                const inventory = this.inventoryManager.getInventoryItem(item.productId);
                if (inventory) {
                    inventory.confirmSale(item.quantity);
                }
                // Update product stock
                const product = this.productCatalog.getProduct(item.productId);
                if (product) {
                    product.updateStock(-item.quantity);
                }
            }

            // Record coupon usage
            if (cart.couponCode) {
                this.discountManager.recordCouponUsage(cart.couponCode, userId);
            }

            return { success: true, order: order };
        } else {
            // Release reserved stock on payment failure
            for (const item of order.items) {
                this.inventoryManager.releaseReservedStock(item.productId, item.quantity);
            }
            return { success: false, message: paymentResult.message };
        }
    }

    /**
     * Gets an order by ID
     * @param {string} orderId - Order ID
     * @returns {Order|null} Order or null
     */
    getOrder(orderId) {
        return this.orderManager.getOrder(orderId);
    }

    /**
     * Gets all orders for a user
     * @param {string} userId - User ID
     * @returns {Order[]} Array of orders
     */
    getUserOrders(userId) {
        return this.orderManager.getOrdersForUser(userId);
    }

    /**
     * Cancels an order
     * @param {string} orderId - Order ID
     * @param {string} reason - Cancellation reason
     * @returns {Object} Result with success flag
     */
    cancelOrder(orderId, reason = '') {
        const order = this.orderManager.getOrder(orderId);
        if (!order) {
            return { success: false, message: 'Order not found' };
        }

        const result = order.cancel(reason);

        if (result.success) {
            // Return items to inventory
            for (const item of order.items) {
                this.inventoryManager.processReturn(item.productId, item.quantity, orderId);
                const product = this.productCatalog.getProduct(item.productId);
                if (product) {
                    product.updateStock(item.quantity);
                }
            }
        }

        return result;
    }

    /**
     * Gets product details with pricing info
     * @param {string} productId - Product ID
     * @returns {Object|null} Product details or null
     */
    getProductDetails(productId) {
        const product = this.productCatalog.getProduct(productId);
        if (!product) {
            return null;
        }

        const inventory = this.inventoryManager.getInventoryItem(productId);
        const pricing = this.discountManager.calculateBestPrice(product);

        return {
            ...product.toJSON(),
            pricing: pricing,
            availableStock: inventory ? inventory.getAvailableStock() : 0,
            inStock: inventory ? !inventory.isOutOfStock() : false
        };
    }

    /**
     * Searches for products
     * @param {string} query - Search query
     * @returns {Object[]} Array of product details
     */
    searchProducts(query) {
        const products = this.productCatalog.searchProducts(query);
        return products.map(p => {
            const inventory = this.inventoryManager.getInventoryItem(p.id);
            const pricing = this.discountManager.calculateBestPrice(p);
            return {
                ...p.toJSON(),
                pricing: pricing,
                availableStock: inventory ? inventory.getAvailableStock() : 0,
                inStock: inventory ? !inventory.isOutOfStock() : false
            };
        });
    }

    /**
     * Gets products by category
     * @param {string} category - Category name
     * @returns {Object[]} Array of product details
     */
    getProductsByCategory(category) {
        const products = this.productCatalog.getProductsByCategory(category);
        return products.map(p => {
            const inventory = this.inventoryManager.getInventoryItem(p.id);
            const pricing = this.discountManager.calculateBestPrice(p);
            return {
                ...p.toJSON(),
                pricing: pricing,
                availableStock: inventory ? inventory.getAvailableStock() : 0,
                inStock: inventory ? !inventory.isOutOfStock() : false
            };
        });
    }

    /**
     * Gets dashboard statistics
     * @returns {Object} Statistics object
     */
    getDashboardStats() {
        return {
            products: {
                total: this.productCatalog.getProductCount(),
                active: this.productCatalog.getProductCount(true),
                categories: this.productCatalog.getAllCategories()
            },
            inventory: this.inventoryManager.getStatistics(),
            orders: this.orderManager.getStatistics(),
            users: this.userManager.getStatistics(),
            carts: this.cartManager.getStatistics(),
            discounts: this.discountManager.getStatistics()
        };
    }

    /**
     * Processes a return for a delivered order
     * @param {string} orderId - Order ID
     * @param {string} productId - Product ID to return
     * @param {number} quantity - Quantity to return
     * @returns {Object} Result with refund details
     */
    processReturn(orderId, productId, quantity) {
        const order = this.orderManager.getOrder(orderId);
        if (!order) {
            return { success: false, message: 'Order not found' };
        }

        if (order.status !== OrderStatus.DELIVERED) {
            return { success: false, message: 'Can only return delivered orders' };
        }

        const orderItem = order.items.find(i => i.productId === productId);
        if (!orderItem) {
            return { success: false, message: 'Product not found in order' };
        }

        if (quantity > orderItem.quantity) {
            return { success: false, message: 'Return quantity exceeds ordered quantity' };
        }

        // Return to inventory
        this.inventoryManager.processReturn(productId, quantity, orderId);
        const product = this.productCatalog.getProduct(productId);
        if (product) {
            product.updateStock(quantity);
        }

        // Calculate refund
        const refundAmount = orderItem.discountedPrice * quantity;

        return {
            success: true,
            productId: productId,
            quantity: quantity,
            refundAmount: Math.round(refundAmount * 100) / 100
        };
    }

    /**
     * Gets low stock alerts
     * @returns {Object[]} Array of alerts with product info
     */
    getLowStockAlerts() {
        const alerts = this.inventoryManager.getActiveAlerts();
        return alerts.map(alert => {
            const product = this.productCatalog.getProduct(alert.productId);
            return {
                ...alert.toJSON(),
                productName: product ? product.name : 'Unknown Product',
                productCategory: product ? product.category : 'Unknown'
            };
        });
    }

    /**
     * Restocks a product
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @param {string} purchaseOrder - PO reference
     * @returns {Object} Result with success flag
     */
    restockProduct(productId, quantity, purchaseOrder = '') {
        const product = this.productCatalog.getProduct(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        const result = this.inventoryManager.restock(productId, quantity, purchaseOrder);
        if (result.success) {
            product.updateStock(quantity);
        }
        return result;
    }
}

// Export all modules
module.exports = {
    ECommerceApp,
    Product,
    ProductCatalog,
    CartItem,
    ShoppingCart,
    CartManager,
    Order,
    OrderItem,
    OrderManager,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    User,
    UserManager,
    UserRole,
    AccountStatus,
    InventoryItem,
    InventoryManager,
    StockMovement,
    StockAlert,
    MovementType,
    AlertType,
    Coupon,
    Promotion,
    DiscountManager,
    DiscountType,
    CouponStatus
};
