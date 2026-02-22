/**
 * WEVERSE Supabase Data Store
 * Supabase를 사용한 데이터 저장소
 */

// Supabase 설정
const SUPABASE_URL = 'https://uxchzkbcxiurnqhfnzxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4Y2h6a2JjeGl1cm5xaGZuenh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Mjc4OTEsImV4cCI6MjA4NTUwMzg5MX0.JwA6WjEGEWRj9Vn1NYntvbO2vG8TwNmKqU9uhlBhgaM';

// Supabase 클라이언트 초기화
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage Keys (세션용)
const STORAGE_KEYS = {
    CART: 'weverseCart',
    SESSION: 'weverseSession',
    ADMIN_SESSION: 'adminSession',
    LAST_ORDER: 'weverseLastOrder'
};

// Member Ranks
const MEMBER_RANKS = {
    GENERAL: 'general',
    MANAGER: 'manager',
    DIAMOND: 'diamond',
    BLUE_DIAMOND: 'blue_diamond',
    RED_DIAMOND: 'red_diamond',
    CROWN_DIAMOND: 'crown_diamond'
};

// Rank Display Info
const RANK_INFO = {
    [MEMBER_RANKS.GENERAL]: { name: '일반', nameEn: 'General', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)', symbol: null },
    [MEMBER_RANKS.MANAGER]: { name: '매니저', nameEn: 'Manager', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', symbol: null },
    [MEMBER_RANKS.DIAMOND]: { name: '다이아몬드', nameEn: 'Diamond', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)', symbol: 'diamond' },
    [MEMBER_RANKS.BLUE_DIAMOND]: { name: '블루다이아몬드', nameEn: 'Blue Diamond', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', symbol: 'diamond' },
    [MEMBER_RANKS.RED_DIAMOND]: { name: '레드다이아몬드', nameEn: 'Red Diamond', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', symbol: 'diamond' },
    [MEMBER_RANKS.CROWN_DIAMOND]: { name: '크라운다이아몬드', nameEn: 'Crown Diamond', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', symbol: 'crown' }
};

// Default Settings
const DEFAULT_SETTINGS = {
    exchangeRate: 1350,
    pPointRate: 0,
    pPointSettleDays: 0,
    pPointAutoEnabled: false,
    minWithdrawal: 50,
    shippingCompanies: ['CJ대한통운', '한진택배', '롯데택배', '우체국', '로젠택배']
};

/**
 * Supabase Data Store Class
 */
class WeverseSupabaseStore {
    constructor() {
        this.supabase = supabaseClient;
        this.cache = {
            products: null,
            members: null,
            settings: null
        };
    }

    // ==================== 헬퍼 함수 ====================

    // DB 컬럼명 → JS 객체 키 변환 (snake_case → camelCase)
    toCamelCase(obj) {
        if (!obj) return obj;
        if (Array.isArray(obj)) return obj.map(item => this.toCamelCase(item));
        if (typeof obj !== 'object') return obj;

        const result = {};
        for (const key in obj) {
            let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            // 특수 케이스: priceUsd → priceUSD, originalPriceUsd → originalPriceUSD
            camelKey = camelKey.replace(/Usd$/, 'USD');
            result[camelKey] = this.toCamelCase(obj[key]);
        }
        return result;
    }

    // JS 객체 키 → DB 컬럼명 변환 (camelCase → snake_case)
    toSnakeCase(obj) {
        if (!obj) return obj;
        if (Array.isArray(obj)) return obj.map(item => this.toSnakeCase(item));
        if (typeof obj !== 'object') return obj;

        const result = {};
        for (const key in obj) {
            const snakeKey = key.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase());
            result[snakeKey] = obj[key];
        }
        return result;
    }

    // ==================== PRODUCTS ====================

    async getProducts() {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        return data.map(p => this.toCamelCase(p));
    }

    async getProductById(id) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('id', id);

        if (error || !data || data.length === 0) return null;
        return this.toCamelCase(data[0]);
    }

    async getProductByName(name) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .or(`name.ilike.${name},name_ko.eq.${name}`)
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    async getActiveProducts() {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('status', 'active');

        if (error) return [];
        return data.map(p => this.toCamelCase(p));
    }

    async addProduct(product) {
        product.id = product.id || 'WV-' + Date.now().toString().slice(-6);

        // Prepare product data for database (exclude fields that may not exist in DB)
        const dbProduct = {
            id: product.id,
            name: product.name,
            name_ko: product.nameKo || product.name,
            description: product.description || '',
            description_ko: product.descriptionKo || product.description || '',
            price: product.price || 0,
            price_usd: product.priceUSD || product.priceUsd || 0,
            pv: product.pv || 0,
            stock: product.stock || 0,
            status: product.status || 'active',
            badge: product.badge || '',
            image: product.image || 'shop-1.jpg',
            image_data: product.imageData || null,
            detail_page: product.detailPage || '',
            features: product.features || []
        };

        const { data, error } = await this.supabase
            .from('products')
            .insert(dbProduct)
            .select()
            .single();

        if (error) {
            console.error('Error adding product:', error);
            return null;
        }
        return this.toCamelCase(data);
    }

    async updateProduct(id, updates) {
        // Map only valid database columns
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.nameKo !== undefined) dbUpdates.name_ko = updates.nameKo;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.descriptionKo !== undefined) dbUpdates.description_ko = updates.descriptionKo;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.priceUSD !== undefined) dbUpdates.price_usd = updates.priceUSD;
        if (updates.pv !== undefined) dbUpdates.pv = updates.pv;
        if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.badge !== undefined) dbUpdates.badge = updates.badge;
        if (updates.image !== undefined) dbUpdates.image = updates.image;
        if (updates.imageData !== undefined) dbUpdates.image_data = updates.imageData;
        if (updates.detailPage !== undefined) dbUpdates.detail_page = updates.detailPage;
        if (updates.features !== undefined) dbUpdates.features = updates.features;

        const { data, error } = await this.supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            return null;
        }
        return this.toCamelCase(data);
    }

    async deleteProduct(id) {
        const { error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id);

        return !error;
    }

    async updateStock(id, quantity) {
        const product = await this.getProductById(id);
        if (!product) return null;

        const newStock = Math.max(0, product.stock + quantity);
        const newStatus = newStock === 0 ? 'outofstock' : product.status;

        return await this.updateProduct(id, { stock: newStock, status: newStatus });
    }

    // ==================== MEMBERS ====================

    async getMembers() {
        const { data, error } = await this.supabase
            .from('members')
            .select('*')
            .neq('member_type', 'admin')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching members:', error);
            return [];
        }
        return data.map(m => this.toCamelCase(m));
    }

    async getMemberById(id) {
        const { data, error } = await this.supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    async getMemberByEmail(email) {
        const { data, error } = await this.supabase
            .from('members')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    async getMemberByUsername(username) {
        const { data, error } = await this.supabase
            .from('members')
            .select('*')
            .eq('username', username)
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    async addMember(memberData) {
        // Check if username exists
        const existing = await this.getMemberByUsername(memberData.username);
        if (existing) {
            return { error: 'ID already exists' };
        }

        const member = {
            id: 'M' + Date.now().toString().slice(-6) + Math.random().toString(36).slice(-3),
            name: memberData.name,
            username: memberData.username,
            email: memberData.email || '',
            phone: memberData.phone || '',
            password: memberData.password,
            member_type: memberData.memberType || 'consumer',
            rank: memberData.rank || 'general',
            total_spent: 0,
            order_count: 0,
            status: 'active',
            join_date: new Date().toISOString().split('T')[0],
            points: memberData.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 },
            bank_info: { bankName: '', accountNumber: '', accountHolder: '' },
            referrer: memberData.referrer || null
        };

        const { data, error } = await this.supabase
            .from('members')
            .insert(member)
            .select()
            .single();

        if (error) {
            console.error('Error adding member:', error);
            return { error: error.message };
        }
        return this.toCamelCase(data);
    }

    async updateMember(id, updates) {
        const { data, error } = await this.supabase
            .from('members')
            .update(this.toSnakeCase(updates))
            .eq('id', id)
            .select()
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    async updateMemberPassword(id, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            return { error: '비밀번호는 최소 6자 이상이어야 합니다.' };
        }

        const { data, error } = await this.supabase
            .from('members')
            .update({ password: newPassword })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating password:', error);
            return { error: '비밀번호 변경에 실패했습니다.' };
        }
        return { success: true };
    }

    async verifyMemberPassword(id, currentPassword) {
        const { data, error } = await this.supabase
            .from('members')
            .select('password')
            .eq('id', id)
            .single();

        if (error || !data) {
            return { error: '회원 정보를 찾을 수 없습니다.' };
        }

        if (data.password !== currentPassword) {
            return { error: '현재 비밀번호가 일치하지 않습니다.' };
        }

        return { success: true };
    }

    async deleteMember(id) {
        const { error } = await this.supabase
            .from('members')
            .delete()
            .eq('id', id);

        return !error;
    }

    async getMemberStats() {
        const members = await this.getMembers();
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        return {
            total: members.length,
            active: members.filter(m => m.status === 'active').length,
            inactive: members.filter(m => m.status === 'inactive').length,
            dealer: members.filter(m => m.memberType === 'dealer').length,
            consumer: members.filter(m => m.memberType === 'consumer').length,
            newThisMonth: members.filter(m => {
                const joinDate = new Date(m.joinDate);
                return joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear;
            }).length
        };
    }

    // ==================== ORDERS ====================

    async getOrders() {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .order('order_date', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
        return data.map(o => this.toCamelCase(o));
    }

    async getOrderById(id) {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    async getOrdersByStatus(status) {
        const { data, error } = await this.supabase
            .from('orders')
            .select('*')
            .eq('status', status)
            .order('order_date', { ascending: false });

        if (error) return [];
        return data.map(o => this.toCamelCase(o));
    }

    async addOrder(orderData) {
        const order = {
            id: orderData.orderNumber || 'WV' + Date.now().toString().slice(-8),
            customer: {
                name: orderData.shipping?.fullName || orderData.customer?.name,
                memberId: orderData.memberId || orderData.customer?.memberId || null
            },
            items: orderData.items,
            shipping: {
                fullName: orderData.shipping?.fullName || '',
                gender: orderData.shipping?.gender || '',
                phone: orderData.shipping?.phone || '',
                zipcode: orderData.shipping?.zipcode || '',
                address: orderData.shipping?.address || ''
            },
            subtotal: orderData.subtotal,
            shipping_cost: orderData.shippingCost || 0,
            discount: orderData.discountAmount || 0,
            total: orderData.total,
            total_pv: orderData.totalPV || 0,
            payment: orderData.payment,
            payment_method: orderData.paymentMethod,
            status: 'pending',
            order_date: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('orders')
            .insert(order)
            .select()
            .single();

        if (error) {
            console.error('Error adding order:', error);
            return null;
        }

        // Update stock for each item
        for (const item of orderData.items) {
            if (item.productId) {
                await this.updateStock(item.productId, -item.quantity);
            }
        }

        return this.toCamelCase(data);
    }

    async updateOrderStatus(id, status, extras = {}) {
        const order = await this.getOrderById(id);
        if (!order) return null;

        // Prevent duplicate cancellation refund
        if (status === 'cancelled' && order.status !== 'cancelled') {
            await this.refundOrderPoints(order);
        }

        const updates = { status, ...extras };
        if (status === 'delivered') {
            updates.delivery_date = new Date().toISOString().split('T')[0];
        }

        const { data, error } = await this.supabase
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    // Refund points when order is cancelled
    async refundOrderPoints(order) {
        if (!order.payment || !order.payment.details) return;
        if (!order.customer || !order.customer.memberId) return;

        const memberId = order.customer.memberId;
        const details = order.payment.details;

        // Refund W-Pay (rPay)
        if (details.rPay > 0) {
            await this.updateMemberPoints(memberId, 'rPay', details.rPay);
            await this.addPointTransaction({
                memberId,
                type: 'refund',
                pointType: 'rPay',
                amount: details.rPay,
                orderId: order.id,
                description: `주문 취소 환불 #${order.id}`
            });
        }

        // Refund P-Point
        if (details.pPoint > 0) {
            await this.updateMemberPoints(memberId, 'pPoint', details.pPoint);
            await this.addPointTransaction({
                memberId,
                type: 'refund',
                pointType: 'pPoint',
                amount: details.pPoint,
                orderId: order.id,
                description: `주문 취소 환불 #${order.id}`
            });
        }

        // Refund C-Point
        if (details.cPoint > 0) {
            await this.updateMemberPoints(memberId, 'cPoint', details.cPoint);
            await this.addPointTransaction({
                memberId,
                type: 'refund',
                pointType: 'cPoint',
                amount: details.cPoint,
                orderId: order.id,
                description: `주문 취소 환불 #${order.id}`
            });
        }

        // Refund T-Point
        if (details.tPoint > 0) {
            await this.updateMemberPoints(memberId, 'tPoint', details.tPoint);
            await this.addPointTransaction({
                memberId,
                type: 'refund',
                pointType: 'tPoint',
                amount: details.tPoint,
                orderId: order.id,
                description: `주문 취소 환불 #${order.id}`
            });
        }

        // Restore stock for each item
        if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                if (item.productId) {
                    await this.updateStock(item.productId, item.quantity);
                }
            }
        }
    }

    async updateOrderTracking(orderId, trackingNumber, trackingCompany) {
        const updates = {
            tracking_number: trackingNumber,
            tracking_company: trackingCompany
        };

        const order = await this.getOrderById(orderId);
        if (order && order.status === 'processing' && trackingNumber) {
            updates.status = 'shipped';
        }

        return await this.updateOrderStatus(orderId, updates.status || order.status, updates);
    }

    async deleteOrder(id) {
        const { error } = await this.supabase
            .from('orders')
            .delete()
            .eq('id', id);

        return !error;
    }

    async updateOrder(id, updates) {
        const order = await this.getOrderById(id);
        if (!order) return null;

        // Handle cancellation refund
        if (updates.status === 'cancelled' && order.status !== 'cancelled') {
            await this.refundOrderPoints(order);
        }

        // Merge updates with existing data
        const updateData = {};
        if (updates.customer) {
            updateData.customer = { ...order.customer, ...updates.customer };
        }
        if (updates.shipping) {
            // Ensure all shipping fields are explicitly saved
            const existingShipping = order.shipping || {};
            updateData.shipping = {
                fullName: updates.shipping.fullName ?? existingShipping.fullName ?? '',
                gender: updates.shipping.gender ?? existingShipping.gender ?? '',
                phone: updates.shipping.phone ?? existingShipping.phone ?? '',
                zipcode: updates.shipping.zipcode ?? existingShipping.zipcode ?? '',
                address: updates.shipping.address ?? existingShipping.address ?? ''
            };
        }
        if (updates.status) updateData.status = updates.status;
        if (updates.trackingCompany !== undefined) updateData.tracking_company = updates.trackingCompany;
        if (updates.trackingNumber !== undefined) updateData.tracking_number = updates.trackingNumber;

        const { data, error } = await this.supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) return null;
        return this.toCamelCase(data);
    }

    async getOrderStats() {
        const orders = await this.getOrders();
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            processing: orders.filter(o => o.status === 'processing').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)
        };
    }

    // ==================== AUTH ====================

    async login(username, password) {
        const { data, error } = await this.supabase
            .from('members')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) return null;

        const member = this.toCamelCase(data);
        const session = {
            id: member.id,
            name: member.name,
            username: member.username,
            email: member.email,
            memberType: member.memberType,
            rank: member.rank,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        return session;
    }

    logout() {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    getSession() {
        const session = localStorage.getItem(STORAGE_KEYS.SESSION) || sessionStorage.getItem(STORAGE_KEYS.SESSION);
        return session ? JSON.parse(session) : null;
    }

    isLoggedIn() {
        return !!this.getSession();
    }

    // ==================== CART (로컬 스토리지 유지) ====================

    getCart() {
        const cart = localStorage.getItem(STORAGE_KEYS.CART);
        return cart ? JSON.parse(cart) : [];
    }

    addToCart(productName, price, quantity = 1) {
        const cart = this.getCart();
        const existingIndex = cart.findIndex(item => item.name === productName);

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({ name: productName, price, quantity });
        }

        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
        return cart;
    }

    updateCartItem(productName, quantity) {
        const cart = this.getCart();
        const index = cart.findIndex(item => item.name === productName);

        if (index !== -1) {
            if (quantity <= 0) {
                cart.splice(index, 1);
            } else {
                cart[index].quantity = quantity;
            }
            localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
        }
        return cart;
    }

    removeFromCart(productName) {
        const cart = this.getCart();
        const filtered = cart.filter(item => item.name !== productName);
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(filtered));
        return filtered;
    }

    clearCart() {
        localStorage.removeItem(STORAGE_KEYS.CART);
        return [];
    }

    getCartTotal() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getCartCount() {
        const cart = this.getCart();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // ==================== POINTS ====================

    async getMemberPoints(memberId) {
        const member = await this.getMemberById(memberId);
        return member?.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 };
    }

    async updateMemberPoints(memberId, pointType, amount) {
        const member = await this.getMemberById(memberId);
        if (!member) return null;

        const points = member.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 };
        points[pointType] = Math.max(0, (points[pointType] || 0) + amount);

        return await this.updateMember(memberId, { points });
    }

    async addPointTransaction(transactionData) {
        const transaction = {
            id: 'PT' + Date.now().toString().slice(-8),
            member_id: transactionData.memberId,
            type: transactionData.type,
            point_type: transactionData.pointType,
            amount: transactionData.amount,
            description: transactionData.description,
            order_id: transactionData.orderId,
            to_member_id: transactionData.toMemberId,
            from_member_id: transactionData.fromMemberId
        };

        const { data, error } = await this.supabase
            .from('point_transactions')
            .insert(transaction)
            .select()
            .single();

        if (error) {
            console.error('Error adding point transaction:', error);
            return null;
        }
        return this.toCamelCase(data);
    }

    async getPointTransactions() {
        const { data, error } = await this.supabase
            .from('point_transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(t => this.toCamelCase(t));
    }

    async getPointTransactionsByMember(memberId) {
        const { data, error } = await this.supabase
            .from('point_transactions')
            .select('*')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(t => this.toCamelCase(t));
    }

    // W페이 충전
    async chargeRPay(memberId, amount) {
        const result = await this.updateMemberPoints(memberId, 'rPay', amount);
        if (result) {
            await this.addPointTransaction({
                memberId,
                type: 'charge',
                pointType: 'rPay',
                amount,
                description: 'W페이 충전'
            });
        }
        return result;
    }

    // C포인트 부여
    async grantCPoint(memberId, amount, reason = 'C포인트 부여') {
        const result = await this.updateMemberPoints(memberId, 'cPoint', amount);
        if (result) {
            await this.addPointTransaction({
                memberId,
                type: 'grant',
                pointType: 'cPoint',
                amount,
                description: reason
            });
        }
        return result;
    }

    // T포인트 부여
    async grantTPoint(memberId, amount, reason = 'T포인트 부여') {
        const result = await this.updateMemberPoints(memberId, 'tPoint', amount);
        if (result) {
            await this.addPointTransaction({
                memberId,
                type: 'grant',
                pointType: 'tPoint',
                amount,
                description: reason
            });
        }
        return result;
    }

    // P포인트 적립 처리 (PV 기반)
    async processPPointEarning(orderId) {
        const order = await this.getOrderById(orderId);
        if (!order) return { error: '주문을 찾을 수 없습니다.' };
        if (order.pvProcessed) return { error: '이미 처리된 주문입니다.' };

        const member = await this.getMemberById(order.customer?.memberId);
        if (!member || member.memberType !== 'dealer') {
            return { error: '대리점 주문만 P포인트 적립이 가능합니다.' };
        }

        const settings = await this.getSettings();
        const pPointRate = (settings.pPointRate || 50) / 100;
        const pPointAmount = Math.floor((order.totalPV || 0) * pPointRate);

        if (pPointAmount <= 0) return { error: '적립할 PV가 없습니다.' };

        // Update member P포인트
        await this.updateMemberPoints(member.id, 'pPoint', pPointAmount);

        // Add transaction
        await this.addPointTransaction({
            memberId: member.id,
            type: 'pv_earning',
            pointType: 'pPoint',
            amount: pPointAmount,
            orderId: order.id,
            description: `주문 #${order.id} PV 적립 (${order.totalPV} PV × ${pPointRate * 100}%)`
        });

        // Mark order as processed
        await this.supabase
            .from('orders')
            .update({
                pv_processed: true,
                pv_process_date: new Date().toISOString(),
                pv_earned_amount: pPointAmount
            })
            .eq('id', orderId);

        return { success: true, pPointAmount };
    }

    // 포인트 전송
    async transferPoints(fromMemberId, toMemberId, pointType, amount) {
        if (pointType !== 'pPoint' && pointType !== 'cPoint') {
            return { error: '전송 가능한 포인트는 P포인트, C포인트입니다.' };
        }

        const fromMember = await this.getMemberById(fromMemberId);
        if (!fromMember || !fromMember.points || fromMember.points[pointType] < amount) {
            return { error: '포인트 잔액이 부족합니다.' };
        }

        const toMember = await this.getMemberById(toMemberId);
        if (!toMember) {
            return { error: '받는 회원을 찾을 수 없습니다.' };
        }

        // Deduct from sender
        await this.updateMemberPoints(fromMemberId, pointType, -amount);
        await this.addPointTransaction({
            memberId: fromMemberId,
            type: 'transfer_out',
            pointType,
            amount: -amount,
            description: `${toMember.name}에게 전송`,
            toMemberId
        });

        // Add to receiver as T포인트
        await this.updateMemberPoints(toMemberId, 'tPoint', amount);
        await this.addPointTransaction({
            memberId: toMemberId,
            type: 'transfer_in',
            pointType: 'tPoint',
            amount,
            description: `${fromMember.name}로부터 전송받음`,
            fromMemberId
        });

        return { success: true };
    }

    // ==================== WITHDRAWALS ====================

    async getWithdrawals() {
        const { data, error } = await this.supabase
            .from('withdrawals')
            .select('*')
            .order('requested_at', { ascending: false });

        if (error) return [];
        return data.map(w => this.toCamelCase(w));
    }

    async getWithdrawalsByMember(memberId) {
        const { data, error } = await this.supabase
            .from('withdrawals')
            .select('*')
            .eq('member_id', memberId)
            .order('requested_at', { ascending: false });

        if (error) return [];
        return data.map(w => this.toCamelCase(w));
    }

    async getPendingWithdrawals() {
        const { data, error } = await this.supabase
            .from('withdrawals')
            .select('*')
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });

        if (error) return [];
        return data.map(w => this.toCamelCase(w));
    }

    async requestWithdrawal(memberId, amount) {
        const member = await this.getMemberById(memberId);
        if (!member) return { error: 'Member not found' };
        if (member.memberType !== 'dealer') return { error: '대리점만 출금 신청이 가능합니다.' };
        if (!member.bankInfo?.accountNumber) return { error: '은행 정보가 등록되어 있지 않습니다.' };

        const settings = await this.getSettings();
        if (amount < settings.minWithdrawal) {
            return { error: `최소 출금 금액은 $${settings.minWithdrawal}입니다.` };
        }

        if (!member.points || member.points.pPoint < amount) {
            return { error: 'P포인트 잔액이 부족합니다.' };
        }

        // Deduct P포인트
        await this.updateMemberPoints(memberId, 'pPoint', -amount);
        await this.addPointTransaction({
            memberId,
            type: 'withdrawal_request',
            pointType: 'pPoint',
            amount: -amount,
            description: '출금 신청'
        });

        const withdrawal = {
            id: 'WD' + Date.now().toString().slice(-8),
            member_id: memberId,
            member_name: member.name,
            amount,
            amount_krw: amount * settings.exchangeRate,
            bank_info: member.bankInfo,
            status: 'pending'
        };

        const { data, error } = await this.supabase
            .from('withdrawals')
            .insert(withdrawal)
            .select()
            .single();

        if (error) {
            console.error('Error creating withdrawal:', error);
            return { error: error.message };
        }
        return this.toCamelCase(data);
    }

    async processWithdrawal(withdrawalId, action, adminNote = '') {
        const { data: withdrawal, error: fetchError } = await this.supabase
            .from('withdrawals')
            .select('*')
            .eq('id', withdrawalId)
            .single();

        if (fetchError || !withdrawal) return { error: 'Withdrawal not found' };
        if (withdrawal.status !== 'pending') return { error: 'Already processed' };

        const updates = {
            processed_at: new Date().toISOString(),
            note: adminNote
        };

        if (action === 'approve') {
            updates.status = 'approved';
            await this.addPointTransaction({
                memberId: withdrawal.member_id,
                type: 'withdrawal_complete',
                pointType: 'pPoint',
                amount: 0,
                description: `출금 완료 (${withdrawal.amount} USD)`
            });
        } else if (action === 'reject') {
            updates.status = 'rejected';
            // Refund P포인트
            await this.updateMemberPoints(withdrawal.member_id, 'pPoint', withdrawal.amount);
            await this.addPointTransaction({
                memberId: withdrawal.member_id,
                type: 'withdrawal_rejected',
                pointType: 'pPoint',
                amount: withdrawal.amount,
                description: `출금 거절 - 환불: ${adminNote}`
            });
        }

        const { data, error } = await this.supabase
            .from('withdrawals')
            .update(updates)
            .eq('id', withdrawalId)
            .select()
            .single();

        if (error) return { error: error.message };
        return this.toCamelCase(data);
    }

    // ==================== SETTINGS ====================

    async getSettings() {
        const { data, error } = await this.supabase
            .from('settings')
            .select('*')
            .eq('id', 'default')
            .single();

        if (error || !data) return DEFAULT_SETTINGS;
        return {
            exchangeRate: data.exchange_rate,
            pPointRate: data.p_point_rate,
            pPointSettleDays: data.p_point_settle_days,
            pPointAutoEnabled: data.p_point_auto_enabled,
            minWithdrawal: data.min_withdrawal,
            shippingCompanies: data.shipping_companies
        };
    }

    async updateSettings(updates) {
        const { data, error } = await this.supabase
            .from('settings')
            .update({
                exchange_rate: updates.exchangeRate,
                p_point_rate: updates.pPointRate,
                p_point_settle_days: updates.pPointSettleDays,
                p_point_auto_enabled: updates.pPointAutoEnabled,
                min_withdrawal: updates.minWithdrawal,
                shipping_companies: updates.shippingCompanies,
                updated_at: new Date().toISOString()
            })
            .eq('id', 'default')
            .select()
            .single();

        if (error) {
            console.error('Error updating settings:', error);
            return null;
        }
        return await this.getSettings();
    }

    // ==================== DASHBOARD ====================

    async getDashboardStats() {
        const [orders, members, products] = await Promise.all([
            this.getOrders(),
            this.getMembers(),
            this.getProducts()
        ]);

        const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
        const recentOrders = orders.slice(0, 5);

        const productOrderCount = {};
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    productOrderCount[item.name] = (productOrderCount[item.name] || 0) + item.quantity;
                });
            }
        });

        return {
            totalRevenue,
            totalOrders: orders.length,
            totalMembers: members.length,
            totalProducts: products.length,
            recentOrders,
            productOrderCount,
            orderStats: await this.getOrderStats(),
            memberStats: await this.getMemberStats()
        };
    }

    // ==================== SETTLEMENTS ====================

    getSettlements() {
        const data = localStorage.getItem('weverseSettlements');
        return data ? JSON.parse(data) : [];
    }

    getSettlementById(id) {
        const settlements = this.getSettlements();
        return settlements.find(s => s.id === id);
    }

    addSettlement(settlement) {
        const settlements = this.getSettlements();
        settlements.unshift(settlement);
        localStorage.setItem('weverseSettlements', JSON.stringify(settlements));
        return settlement;
    }

    updateSettlement(id, updates) {
        const settlements = this.getSettlements();
        const index = settlements.findIndex(s => s.id === id);
        if (index !== -1) {
            settlements[index] = { ...settlements[index], ...updates };
            localStorage.setItem('weverseSettlements', JSON.stringify(settlements));
            return settlements[index];
        }
        return null;
    }

    deleteSettlement(id) {
        let settlements = this.getSettlements();
        settlements = settlements.filter(s => s.id !== id);
        localStorage.setItem('weverseSettlements', JSON.stringify(settlements));

        let details = this.getSettlementDetails();
        details = details.filter(d => d.settlement_id !== id);
        localStorage.setItem('weverseSettlementDetails', JSON.stringify(details));
        return true;
    }

    getSettlementDetails(settlementId = null) {
        const data = localStorage.getItem('weverseSettlementDetails');
        const details = data ? JSON.parse(data) : [];
        if (settlementId) {
            return details.filter(d => d.settlement_id === settlementId);
        }
        return details;
    }

    addSettlementDetails(details) {
        const allDetails = this.getSettlementDetails();
        allDetails.push(...details);
        localStorage.setItem('weverseSettlementDetails', JSON.stringify(allDetails));
        return details;
    }

    // ==================== PV STATS ====================

    async getMemberPVInPeriod(memberId, startDate, endDate) {
        const orders = await this.getOrders();
        let totalPV = 0;

        orders.forEach(order => {
            if (order.customer?.memberId !== memberId) return;
            if (order.status === 'cancelled') return;

            const orderDate = new Date(order.orderDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            if (orderDate >= start && orderDate <= end) {
                totalPV += order.totalPV || 0;
            }
        });

        return totalPV;
    }

    async getMemberCumulativePV(memberId) {
        const orders = await this.getOrders();
        let totalPV = 0;

        orders.forEach(order => {
            if (order.customer?.memberId !== memberId) return;
            if (order.status === 'cancelled') return;
            totalPV += order.totalPV || 0;
        });

        return totalPV;
    }

    async getDirectReferrals(memberId) {
        const members = await this.getMembers();
        return members.filter(m => m.referrer?.id === memberId);
    }

    async getAllDownlineIds(memberId, visited = new Set()) {
        if (visited.has(memberId)) return [];
        visited.add(memberId);

        const members = await this.getMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const downlineIds = [];
        for (const referral of directReferrals) {
            downlineIds.push(referral.id);
            const subDownline = await this.getAllDownlineIds(referral.id, visited);
            downlineIds.push(...subDownline);
        }

        return downlineIds;
    }

    async getPVStatsForPeriod(startDate, endDate) {
        const orders = await this.getOrders();
        let totalPV = 0;
        let orderCount = 0;

        orders.forEach(order => {
            if (order.status === 'cancelled') return;

            const orderDate = new Date(order.orderDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            if (orderDate >= start && orderDate <= end) {
                totalPV += order.totalPV || 0;
                orderCount++;
            }
        });

        return { totalPV, orderCount };
    }

    async getMemberById(memberId) {
        const members = await this.getMembers();
        return members.find(m => m.id === memberId);
    }
}

// Create global instance
const weverseData = new WeverseSupabaseStore();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { weverseData, STORAGE_KEYS, MEMBER_RANKS, RANK_INFO };
}
