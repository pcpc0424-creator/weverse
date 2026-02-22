/**
 * WEVERSE Shared Data Store
 * 관리자 페이지와 쇼핑몰이 공유하는 데이터 저장소
 */

// Data Version - increment this when data structure changes
const DATA_VERSION = 10;

// Storage Keys
const STORAGE_KEYS = {
    PRODUCTS: 'weverseProducts',
    ORDERS: 'weverseOrders',
    MEMBERS: 'weverseMembers',
    CART: 'weverseCart',
    SESSION: 'weverseSession',
    ADMIN_SESSION: 'adminSession',
    LAST_ORDER: 'weverseLastOrder',
    DATA_VERSION: 'weverseDataVersion',
    POINT_TRANSACTIONS: 'weversePointTransactions',
    WITHDRAWALS: 'weverseWithdrawals',
    SETTINGS: 'weverseSettings'
};

// Member Ranks (위버스 전용 등급)
const MEMBER_RANKS = {
    GENERAL: 'general',              // 일반
    MANAGER: 'manager',              // 매니저
    DIAMOND: 'diamond',              // 다이아몬드
    BLUE_DIAMOND: 'blue_diamond',    // 블루다이아몬드
    RED_DIAMOND: 'red_diamond',      // 레드다이아몬드
    CROWN_DIAMOND: 'crown_diamond'   // 크라운다이아몬드
};

// Rank Display Info (UI 표시용)
const RANK_INFO = {
    [MEMBER_RANKS.GENERAL]: {
        name: '일반',
        nameEn: 'General',
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        symbol: null
    },
    [MEMBER_RANKS.MANAGER]: {
        name: '매니저',
        nameEn: 'Manager',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        symbol: null
    },
    [MEMBER_RANKS.DIAMOND]: {
        name: '다이아몬드',
        nameEn: 'Diamond',
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.1)',
        symbol: 'diamond'
    },
    [MEMBER_RANKS.BLUE_DIAMOND]: {
        name: '블루다이아몬드',
        nameEn: 'Blue Diamond',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        symbol: 'diamond'
    },
    [MEMBER_RANKS.RED_DIAMOND]: {
        name: '레드다이아몬드',
        nameEn: 'Red Diamond',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        symbol: 'diamond'
    },
    [MEMBER_RANKS.CROWN_DIAMOND]: {
        name: '크라운다이아몬드',
        nameEn: 'Crown Diamond',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        symbol: 'crown'
    }
};

// Default Settings
const DEFAULT_SETTINGS = {
    exchangeRate: 1350,        // USD → KRW
    pPointRate: 0,             // P포인트 적립률 (%) - 위버스: 자동 적립 비활성화, 관리자 수기 지급만
    pPointSettleDays: 0,       // P포인트 적립일 - 위버스: 사용 안함
    pPointAutoEnabled: false,  // P포인트 자동 적립 활성화 여부 - 위버스: 비활성화
    minWithdrawal: 50,         // 최소 출금 금액 (USD)
    shippingCompanies: ['CJ대한통운', '한진택배', '롯데택배', '우체국', '로젠택배']
};

// Default Products Data
const DEFAULT_PRODUCTS = [
    {
        id: 'WV-NB-001',
        name: 'New-BornAid',
        nameKo: '뉴본에이드',
        description: 'Fermented enzyme supplement',
        descriptionKo: '발효 효소 영양제',
        category: 'health',
        categoryKo: '건강',
        price: 89000,
        priceUSD: 89,
        pv: 45,
        stock: 156,
        status: 'active',
        badge: 'Best',
        image: 'shop-1.jpg',
        detailPage: 'products/new-bornaid.html',
        features: [
            { title: 'Fermented Enzymes', desc: 'Natural fermentation process for better absorption' },
            { title: 'Digestive Health', desc: 'Supports healthy digestion and gut function' },
            { title: 'Natural Ingredients', desc: '100% natural ingredients with no artificial additives' },
            { title: 'Daily Wellness', desc: 'Perfect for daily health maintenance routine' }
        ],
        createdAt: '2024-01-01'
    },
    {
        id: 'WV-AG-002',
        name: 'Alpha GPC',
        nameKo: '알파 GPC',
        description: 'Brain health supplement',
        descriptionKo: '두뇌 건강 영양제',
        category: 'supplements',
        categoryKo: '영양제',
        price: 129000,
        priceUSD: 129,
        pv: 65,
        stock: 89,
        status: 'active',
        badge: '',
        image: 'shop-2.jpg',
        detailPage: 'products/alpha-gpc.html',
        features: [
            { title: 'Cognitive Support', desc: 'Enhances memory and cognitive function' },
            { title: 'Brain Nutrition', desc: 'Essential nutrients for brain health' },
            { title: 'Focus Enhancement', desc: 'Improves concentration and mental clarity' },
            { title: 'Neuroprotection', desc: 'Supports long-term brain health' }
        ],
        createdAt: '2024-01-05'
    },
    {
        id: 'WV-NL-003',
        name: 'Nano Lutein',
        nameKo: '나노 루테인',
        description: 'Eye health supplement',
        descriptionKo: '눈 건강 영양제',
        category: 'vitamins',
        categoryKo: '비타민',
        price: 79000,
        priceUSD: 79,
        pv: 40,
        stock: 234,
        status: 'active',
        badge: 'New',
        image: 'shop-3.jpg',
        detailPage: 'products/nano-lutein.html',
        features: [
            { title: 'Nano Technology', desc: 'Enhanced absorption with nano-sized particles' },
            { title: 'Eye Protection', desc: 'Protects eyes from blue light damage' },
            { title: 'Vision Support', desc: 'Maintains clear and healthy vision' },
            { title: 'Antioxidant', desc: 'Powerful antioxidant properties' }
        ],
        createdAt: '2024-01-10'
    },
    {
        id: 'WV-SP-004',
        name: 'Super ProstaAid',
        nameKo: '슈퍼 프로스타에이드',
        description: 'Prostate health supplement',
        descriptionKo: '전립선 건강 영양제',
        category: 'health',
        categoryKo: '건강',
        price: 99000,
        priceUSD: 99,
        pv: 50,
        stock: 67,
        status: 'active',
        badge: '',
        image: 'shop-4.jpg',
        detailPage: 'products/super-prostaid.html',
        features: [
            { title: 'Prostate Support', desc: 'Comprehensive prostate health formula' },
            { title: 'Natural Herbs', desc: 'Blend of proven herbal ingredients' },
            { title: 'Urinary Health', desc: 'Supports healthy urinary function' },
            { title: 'Hormonal Balance', desc: 'Helps maintain hormonal balance' }
        ],
        createdAt: '2024-01-15'
    },
    {
        id: 'WV-JC-005',
        name: 'Joint Care',
        nameKo: '조인트 케어',
        description: 'Joint health supplement',
        descriptionKo: '관절 건강 영양제',
        category: 'health',
        categoryKo: '건강',
        price: 69000,
        priceUSD: 69,
        pv: 35,
        stock: 178,
        status: 'active',
        badge: '',
        image: 'shop-5.jpg',
        detailPage: 'products/joint-care.html',
        features: [
            { title: 'Glucosamine Sulfate', desc: 'Clinically proven ingredient for joint health' },
            { title: 'Cartilage Regeneration', desc: 'Supports cartilage repair and maintenance' },
            { title: 'Arthritis Treatment', desc: 'Hospital prescribed grade formula' },
            { title: 'Joint Protection', desc: 'Preventive care for healthy joints' }
        ],
        createdAt: '2024-01-20'
    },
    {
        id: 'WV-PP-006',
        name: 'Premium Package',
        nameKo: '프리미엄 패키지',
        description: 'All-in-one health package',
        descriptionKo: '올인원 건강 패키지',
        category: 'package',
        categoryKo: '세트',
        price: 299000,
        priceUSD: 299,
        pv: 150,
        originalPrice: 465000,
        originalPriceUSD: 465,
        stock: 45,
        status: 'active',
        badge: 'Premium',
        image: 'shop-6.jpg',
        detailPage: 'products/premium-package.html',
        features: [
            { title: 'Complete Package', desc: 'Includes all 5 premium health supplements' },
            { title: 'Value Bundle', desc: 'Save over 35% compared to individual purchase' },
            { title: 'Gift Ready', desc: 'Beautiful packaging perfect for gifting' },
            { title: 'Full Course', desc: '3-month supply for comprehensive health care' }
        ],
        createdAt: '2024-01-25'
    }
];

// Default Members Data
const DEFAULT_MEMBERS = [
    {
        id: 'M001',
        name: '김민준',
        username: 'minjun',
        email: 'minjun.kim@example.com',
        phone: '010-1234-5678',
        password: 'test1234',
        memberType: 'dealer',
        rank: 'crown_diamond',  // 크라운다이아몬드
        totalSpent: 1250000,
        orderCount: 15,
        status: 'active',
        joinDate: '2023-06-15',
        lastOrder: '2024-01-10',
        points: { rPay: 50000, pPoint: 125, cPoint: 50, tPoint: 20 },
        bankInfo: { bankName: '신한은행', accountNumber: '110-123-456789', accountHolder: '김민준' }
    },
    {
        id: 'M002',
        name: '이서연',
        username: 'seoyeon',
        email: 'seoyeon.lee@example.com',
        phone: '010-2345-6789',
        password: 'test1234',
        memberType: 'dealer',
        rank: 'red_diamond',    // 레드다이아몬드
        totalSpent: 890000,
        orderCount: 10,
        status: 'active',
        joinDate: '2023-08-22',
        lastOrder: '2024-01-08',
        points: { rPay: 30000, pPoint: 89, cPoint: 30, tPoint: 10 },
        bankInfo: { bankName: '국민은행', accountNumber: '123-45-678901', accountHolder: '이서연' }
    },
    {
        id: 'M003',
        name: '박지훈',
        username: 'jihun',
        email: 'jihun.park@example.com',
        phone: '010-3456-7890',
        password: 'test1234',
        memberType: 'consumer',
        rank: 'diamond',        // 다이아몬드
        totalSpent: 450000,
        orderCount: 5,
        status: 'active',
        joinDate: '2023-10-05',
        lastOrder: '2024-01-05',
        points: { rPay: 10000, pPoint: 0, cPoint: 0, tPoint: 15 },
        bankInfo: { bankName: '', accountNumber: '', accountHolder: '' }
    },
    {
        id: 'M004',
        name: '최수아',
        username: 'sua',
        email: 'sua.choi@example.com',
        phone: '010-4567-8901',
        password: 'test1234',
        memberType: 'consumer',
        rank: 'manager',        // 매니저
        totalSpent: 189000,
        orderCount: 2,
        status: 'active',
        joinDate: '2023-12-01',
        lastOrder: '2024-01-03',
        points: { rPay: 5000, pPoint: 0, cPoint: 0, tPoint: 5 },
        bankInfo: { bankName: '', accountNumber: '', accountHolder: '' }
    },
    {
        id: 'M005',
        name: '정예준',
        username: 'yejun',
        email: 'yejun.jung@example.com',
        phone: '010-5678-9012',
        password: 'test1234',
        memberType: 'consumer',
        rank: 'general',        // 일반
        totalSpent: 89000,
        orderCount: 1,
        status: 'inactive',
        joinDate: '2024-01-02',
        lastOrder: '2024-01-02',
        points: { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 },
        bankInfo: { bankName: '', accountNumber: '', accountHolder: '' }
    }
];

// Default Orders Data
const DEFAULT_ORDERS = [
    {
        id: 'WV24011001',
        customer: {
            name: '김민준',
            email: 'minjun.kim@example.com',
            phone: '010-1234-5678',
            memberId: 'M001'
        },
        items: [
            { productId: 'WV-NB-001', name: 'New-BornAid', quantity: 2, price: 89000, pv: 45 },
            { productId: 'WV-AG-002', name: 'Alpha GPC', quantity: 1, price: 129000, pv: 65 }
        ],
        shipping: {
            address: '서울시 강남구 테헤란로 123',
            city: '서울',
            zipcode: '06234',
            country: 'South Korea'
        },
        subtotal: 307000,
        shippingCost: 0,
        discount: 0,
        total: 307000,
        totalPV: 155,
        pvProcessed: true,
        pvProcessDate: '2024-01-26',
        payment: {
            method: 'card',
            details: { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0, card: 307000, bank: 0 }
        },
        paymentMethod: 'card',
        status: 'delivered',
        orderDate: '2024-01-10T09:30:00',
        deliveryDate: '2024-01-12',
        trackingNumber: 'KR9876543210',
        trackingCompany: 'CJ대한통운'
    },
    {
        id: 'WV24010901',
        customer: {
            name: '이서연',
            email: 'seoyeon.lee@example.com',
            phone: '010-2345-6789',
            memberId: 'M002'
        },
        items: [
            { productId: 'WV-PP-006', name: 'Premium Package', quantity: 1, price: 299000, pv: 150 }
        ],
        shipping: {
            address: '부산시 해운대구 해운대로 456',
            city: '부산',
            zipcode: '48094',
            country: 'South Korea'
        },
        subtotal: 299000,
        shippingCost: 0,
        discount: 29900,
        total: 269100,
        totalPV: 150,
        pvProcessed: false,
        pvProcessDate: null,
        payment: {
            method: 'combined',
            details: { rPay: 50000, pPoint: 0, cPoint: 0, tPoint: 0, card: 219100, bank: 0 }
        },
        paymentMethod: 'combined',
        status: 'shipped',
        orderDate: '2024-01-09T14:20:00',
        trackingNumber: 'KR1234567890',
        trackingCompany: '한진택배'
    },
    {
        id: 'WV24010801',
        customer: {
            name: '박지훈',
            email: 'jihun.park@example.com',
            phone: '010-3456-7890',
            memberId: 'M003'
        },
        items: [
            { productId: 'WV-JC-005', name: 'Joint Care', quantity: 3, price: 69000, pv: 35 }
        ],
        shipping: {
            address: '대전시 유성구 대학로 789',
            city: '대전',
            zipcode: '34141',
            country: 'South Korea'
        },
        subtotal: 207000,
        shippingCost: 0,
        discount: 0,
        total: 207000,
        totalPV: 105,
        pvProcessed: false,
        pvProcessDate: null,
        payment: {
            method: 'bank',
            details: { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0, card: 0, bank: 207000 }
        },
        paymentMethod: 'bank',
        status: 'processing',
        orderDate: '2024-01-08T11:45:00',
        trackingNumber: '',
        trackingCompany: ''
    },
    {
        id: 'WV24010701',
        customer: {
            name: '최수아',
            email: 'sua.choi@example.com',
            phone: '010-4567-8901',
            memberId: 'M004'
        },
        items: [
            { productId: 'WV-NL-003', name: 'Nano Lutein', quantity: 2, price: 79000, pv: 40 }
        ],
        shipping: {
            address: '인천시 연수구 송도대로 321',
            city: '인천',
            zipcode: '21990',
            country: 'South Korea'
        },
        subtotal: 158000,
        shippingCost: 0,
        discount: 0,
        total: 158000,
        totalPV: 80,
        pvProcessed: false,
        pvProcessDate: null,
        payment: {
            method: 'card',
            details: { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0, card: 158000, bank: 0 }
        },
        paymentMethod: 'card',
        status: 'pending',
        orderDate: '2024-01-07T16:00:00',
        trackingNumber: '',
        trackingCompany: ''
    },
    {
        id: 'WV24010601',
        customer: {
            name: '정예준',
            email: 'yejun.jung@example.com',
            phone: '010-5678-9012',
            memberId: 'M005'
        },
        items: [
            { productId: 'WV-NB-001', name: 'New-BornAid', quantity: 1, price: 89000, pv: 45 }
        ],
        shipping: {
            address: '광주시 서구 상무대로 654',
            city: '광주',
            zipcode: '61949',
            country: 'South Korea'
        },
        subtotal: 89000,
        shippingCost: 0,
        discount: 0,
        total: 89000,
        totalPV: 45,
        pvProcessed: false,
        pvProcessDate: null,
        payment: {
            method: 'card',
            details: { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0, card: 89000, bank: 0 }
        },
        paymentMethod: 'card',
        status: 'cancelled',
        orderDate: '2024-01-06T10:30:00',
        trackingNumber: '',
        trackingCompany: '',
        cancelReason: '고객 요청'
    }
];

/**
 * Data Store Class
 */
class WeverseDataStore {
    constructor() {
        this.init();
    }

    // Initialize data store
    init() {
        // Check data version
        const storedVersion = parseInt(localStorage.getItem(STORAGE_KEYS.DATA_VERSION)) || 0;
        if (storedVersion < DATA_VERSION) {
            console.log('Data version updated, updating data structure...');

            // Migrate products: keep existing products but add missing detailPage field
            const existingProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
            const migratedProducts = existingProducts.map(product => {
                // Find matching default product to get detailPage
                const defaultProduct = DEFAULT_PRODUCTS.find(d => d.id === product.id || d.name === product.name);
                if (!product.detailPage && defaultProduct) {
                    product.detailPage = defaultProduct.detailPage;
                }
                // Generate detailPage from name if still missing
                if (!product.detailPage) {
                    product.detailPage = 'products/' + product.name.toLowerCase().replace(/\s+/g, '-') + '.html';
                }
                return product;
            });

            // Add any new default products that don't exist
            DEFAULT_PRODUCTS.forEach(defaultProduct => {
                const exists = migratedProducts.find(p => p.id === defaultProduct.id);
                if (!exists) {
                    migratedProducts.push(defaultProduct);
                }
            });

            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(migratedProducts));

            // For members: merge existing with defaults, add missing fields (like username)
            const existingMembers = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || [];
            const mergedMembers = [...DEFAULT_MEMBERS];

            // Add existing members that are not in defaults (by id)
            existingMembers.forEach(member => {
                const existsInDefault = DEFAULT_MEMBERS.find(d => d.id === member.id);
                if (!existsInDefault) {
                    // Add username if missing (generate from name or email)
                    if (!member.username) {
                        member.username = member.email
                            ? member.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')
                            : member.name.replace(/\s/g, '').toLowerCase();
                    }
                    // Add rank if missing (default: general)
                    if (!member.rank) {
                        member.rank = 'general';
                    }
                    mergedMembers.push(member);
                }
            });

            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(mergedMembers));
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
            localStorage.setItem(STORAGE_KEYS.DATA_VERSION, DATA_VERSION.toString());
        }

        // Initialize products if not exists
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
        }
        // Initialize members if not exists (but don't overwrite existing)
        if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
        }
        // Initialize orders if not exists (but don't overwrite existing)
        if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
        }
        // Initialize settings if not exists
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        }
        // Initialize point transactions if not exists
        if (!localStorage.getItem(STORAGE_KEYS.POINT_TRANSACTIONS)) {
            localStorage.setItem(STORAGE_KEYS.POINT_TRANSACTIONS, JSON.stringify([]));
        }
        // Initialize withdrawals if not exists
        if (!localStorage.getItem(STORAGE_KEYS.WITHDRAWALS)) {
            localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
        }
    }

    // Reset to default data (manual reset only)
    resetData() {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.POINT_TRANSACTIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
    }

    // ==================== PRODUCTS ====================

    getProducts() {
        const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
    }

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    }

    getProductByName(name) {
        const products = this.getProducts();
        return products.find(p => p.name.toLowerCase() === name.toLowerCase() || p.nameKo === name);
    }

    getActiveProducts() {
        return this.getProducts().filter(p => p.status === 'active');
    }

    getProductsByCategory(category) {
        return this.getProducts().filter(p => p.category === category || p.categoryKo === category);
    }

    addProduct(product) {
        const products = this.getProducts();
        product.id = product.id || 'WV-' + Date.now().toString().slice(-6);
        product.createdAt = new Date().toISOString().split('T')[0];
        products.push(product);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return product;
    }

    updateProduct(id, updates) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            return products[index];
        }
        return null;
    }

    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
        return true;
    }

    updateStock(id, quantity) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index].stock = Math.max(0, products[index].stock + quantity);
            if (products[index].stock === 0) {
                products[index].status = 'outofstock';
            }
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            return products[index];
        }
        return null;
    }

    // ==================== ORDERS ====================

    getOrders() {
        const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
        return data ? JSON.parse(data) : DEFAULT_ORDERS;
    }

    getOrderById(id) {
        const orders = this.getOrders();
        return orders.find(o => o.id === id);
    }

    getOrdersByStatus(status) {
        return this.getOrders().filter(o => o.status === status);
    }

    getOrdersByCustomer(email) {
        return this.getOrders().filter(o => o.customer.email === email);
    }

    addOrder(orderData) {
        const orders = this.getOrders();
        const order = {
            id: orderData.orderNumber || 'WV' + Date.now().toString().slice(-8),
            customer: {
                name: orderData.shipping.fullName,
                memberId: null
            },
            items: orderData.items.map(item => ({
                productId: this.getProductByName(item.name)?.id || null,
                name: item.name,
                quantity: item.quantity,
                price: item.price * 1000 // Convert to KRW
            })),
            shipping: {
                address: orderData.shipping.address,
                city: orderData.shipping.city,
                state: orderData.shipping.state,
                zipcode: orderData.shipping.zipcode,
                country: orderData.shipping.country
            },
            subtotal: orderData.subtotal * 1000,
            shippingCost: orderData.shippingCost * 1000,
            discount: orderData.discountAmount * 1000,
            total: orderData.total * 1000,
            paymentMethod: orderData.paymentMethod,
            status: 'pending',
            orderDate: orderData.orderDate || new Date().toISOString()
        };

        // Update member info if logged in
        const session = this.getSession();
        if (session) {
            order.customer.memberId = session.id;
            this.updateMemberOrderStats(session.email, order.total);
        }

        // Reduce stock
        order.items.forEach(item => {
            if (item.productId) {
                this.updateStock(item.productId, -item.quantity);
            }
        });

        orders.unshift(order);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        return order;
    }

    updateOrderStatus(id, status) {
        const orders = this.getOrders();
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].status = status;
            if (status === 'shipped') {
                orders[index].trackingNumber = 'KR' + Date.now().toString().slice(-10);
            }
            if (status === 'delivered') {
                orders[index].deliveryDate = new Date().toISOString().split('T')[0];
            }
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
            return orders[index];
        }
        return null;
    }

    deleteOrder(id) {
        const orders = this.getOrders();
        const filtered = orders.filter(o => o.id !== id);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
        return true;
    }

    getOrderStats() {
        const orders = this.getOrders();
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

    // ==================== MEMBERS ====================

    getMembers() {
        const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
        return data ? JSON.parse(data) : DEFAULT_MEMBERS;
    }

    getMemberById(id) {
        const members = this.getMembers();
        return members.find(m => m.id === id);
    }

    getMemberByEmail(email) {
        const members = this.getMembers();
        return members.find(m => m.email === email);
    }

    getMemberByUsername(username) {
        const members = this.getMembers();
        return members.find(m => m.username === username);
    }

    addMember(memberData) {
        const members = this.getMembers();

        // Check if username already exists
        if (memberData.username && members.find(m => m.username === memberData.username)) {
            return { error: 'ID already exists' };
        }

        // Check if email already exists (if email provided)
        if (memberData.email && members.find(m => m.email === memberData.email)) {
            return { error: 'Email already exists' };
        }

        const member = {
            id: 'M' + (members.length + 1).toString().padStart(3, '0'),
            name: memberData.name,
            username: memberData.username,
            email: memberData.email || '',
            phone: memberData.phone || '',
            password: memberData.password, // Note: In production, this should be hashed
            memberType: memberData.memberType || 'consumer', // 기본값: 소비자
            rank: memberData.rank || 'general', // 기본 등급: 일반
            totalSpent: 0,
            orderCount: 0,
            status: 'active',
            joinDate: new Date().toISOString().split('T')[0],
            lastOrder: null,
            points: { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 },
            bankInfo: { bankName: '', accountNumber: '', accountHolder: '' }
        };

        members.push(member);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
        return member;
    }

    updateMember(id, updates) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            members[index] = { ...members[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
            return members[index];
        }
        return null;
    }

    updateMemberOrderStats(email, orderTotal) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.email === email);
        if (index !== -1) {
            members[index].totalSpent += orderTotal;
            members[index].orderCount += 1;
            members[index].lastOrder = new Date().toISOString().split('T')[0];

            // Update tier based on total spent
            if (members[index].totalSpent >= 1000000) {
                members[index].tier = 'VIP';
            } else if (members[index].totalSpent >= 500000) {
                members[index].tier = 'Gold';
            } else if (members[index].totalSpent >= 200000) {
                members[index].tier = 'Silver';
            }

            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
            return members[index];
        }
        return null;
    }

    deleteMember(id) {
        const members = this.getMembers();
        const filtered = members.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
        return true;
    }

    getMemberStats() {
        const members = this.getMembers();
        return {
            total: members.length,
            active: members.filter(m => m.status === 'active').length,
            inactive: members.filter(m => m.status === 'inactive').length,
            dealer: members.filter(m => m.memberType === 'dealer').length,
            consumer: members.filter(m => m.memberType === 'consumer').length,
            newThisMonth: members.filter(m => {
                const joinDate = new Date(m.joinDate);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
            }).length
        };
    }

    // ==================== AUTH ====================

    login(email, password) {
        const member = this.getMemberByEmail(email);
        if (member && member.password === password) {
            const session = {
                id: member.id,
                name: member.name,
                email: member.email,
                tier: member.tier,
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            return session;
        }
        return null;
    }

    logout() {
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    getSession() {
        const session = sessionStorage.getItem(STORAGE_KEYS.SESSION) || localStorage.getItem(STORAGE_KEYS.SESSION);
        return session ? JSON.parse(session) : null;
    }

    isLoggedIn() {
        return !!this.getSession();
    }

    // ==================== CART ====================

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
            cart.push({ name: productName, price: price, quantity: quantity });
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

    // ==================== DASHBOARD STATS ====================

    getDashboardStats() {
        const orders = this.getOrders();
        const members = this.getMembers();
        const products = this.getProducts();

        const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
        const totalOrders = orders.length;
        const totalMembers = members.length;
        const totalProducts = products.length;

        // Get recent orders (last 5)
        const recentOrders = orders.slice(0, 5);

        // Get top products by order count
        const productOrderCount = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productOrderCount[item.name] = (productOrderCount[item.name] || 0) + item.quantity;
            });
        });

        return {
            totalRevenue,
            totalOrders,
            totalMembers,
            totalProducts,
            recentOrders,
            productOrderCount,
            orderStats: this.getOrderStats(),
            memberStats: this.getMemberStats()
        };
    }

    // ==================== SETTINGS ====================

    getSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    }

    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        return newSettings;
    }

    // ==================== POINTS MANAGEMENT ====================

    getMemberPoints(memberId) {
        const member = this.getMemberById(memberId);
        if (!member) return null;
        return member.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 };
    }

    updateMemberPoints(memberId, pointType, amount) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === memberId);
        if (index === -1) return null;

        // Ensure points object exists
        if (!members[index].points) {
            members[index].points = { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 };
        }

        members[index].points[pointType] = Math.max(0, (members[index].points[pointType] || 0) + amount);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
        return members[index];
    }

    // W페이 충전
    chargeRPay(memberId, amount) {
        const result = this.updateMemberPoints(memberId, 'rPay', amount);
        if (result) {
            this.addPointTransaction({
                memberId,
                type: 'charge',
                pointType: 'rPay',
                amount,
                description: 'W페이 충전'
            });
        }
        return result;
    }

    // W페이 사용
    useRPay(memberId, amount) {
        const member = this.getMemberById(memberId);
        if (!member || !member.points || member.points.rPay < amount) {
            return { error: 'W페이 잔액이 부족합니다.' };
        }
        const result = this.updateMemberPoints(memberId, 'rPay', -amount);
        if (result) {
            this.addPointTransaction({
                memberId,
                type: 'use',
                pointType: 'rPay',
                amount: -amount,
                description: 'W페이 사용'
            });
        }
        return result;
    }

    // C포인트 부여 (관리자)
    grantCPoint(memberId, amount, description = 'C포인트 부여') {
        const result = this.updateMemberPoints(memberId, 'cPoint', amount);
        if (result) {
            this.addPointTransaction({
                memberId,
                type: 'grant',
                pointType: 'cPoint',
                amount,
                description
            });
        }
        return result;
    }

    // T포인트 부여 (관리자)
    grantTPoint(memberId, amount, description = 'T포인트 부여') {
        const result = this.updateMemberPoints(memberId, 'tPoint', amount);
        if (result) {
            this.addPointTransaction({
                memberId,
                type: 'grant',
                pointType: 'tPoint',
                amount,
                description
            });
        }
        return result;
    }

    // P포인트 적립 처리 (주문 배송완료 후 n일 경과)
    processPPointEarning(orderId) {
        const orders = this.getOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return { error: 'Order not found' };

        const order = orders[orderIndex];
        if (order.pvProcessed) return { error: 'Already processed' };
        if (order.status !== 'delivered') return { error: 'Order not delivered' };

        // Calculate P포인트 based on PV and settings
        const settings = this.getSettings();
        const pPointAmount = order.totalPV * (settings.pPointRate / 100);

        // Find member
        const memberId = order.customer?.memberId;
        if (!memberId) return { error: 'Member not found' };

        const member = this.getMemberById(memberId);
        if (!member || member.memberType !== 'dealer') {
            return { error: 'Only dealers can earn P-Points' };
        }

        // Grant P포인트
        this.updateMemberPoints(memberId, 'pPoint', pPointAmount);
        this.addPointTransaction({
            memberId,
            type: 'earn',
            pointType: 'pPoint',
            amount: pPointAmount,
            description: `주문 ${orderId} P포인트 적립`,
            orderId
        });

        // Update order
        orders[orderIndex].pvProcessed = true;
        orders[orderIndex].pvProcessDate = new Date().toISOString().split('T')[0];
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        return { success: true, pPointAmount };
    }

    // 포인트 전송 (P/C포인트 → T포인트)
    transferPoints(fromMemberId, toMemberId, pointType, amount) {
        if (pointType !== 'pPoint' && pointType !== 'cPoint') {
            return { error: '전송 가능한 포인트는 P포인트, C포인트입니다.' };
        }

        const fromMember = this.getMemberById(fromMemberId);
        if (!fromMember || !fromMember.points || fromMember.points[pointType] < amount) {
            return { error: '포인트 잔액이 부족합니다.' };
        }

        const toMember = this.getMemberById(toMemberId);
        if (!toMember) {
            return { error: '받는 회원을 찾을 수 없습니다.' };
        }

        // Deduct from sender
        this.updateMemberPoints(fromMemberId, pointType, -amount);
        this.addPointTransaction({
            memberId: fromMemberId,
            type: 'transfer_out',
            pointType,
            amount: -amount,
            description: `${toMember.name}에게 전송`,
            toMemberId
        });

        // Add to receiver as T포인트
        this.updateMemberPoints(toMemberId, 'tPoint', amount);
        this.addPointTransaction({
            memberId: toMemberId,
            type: 'transfer_in',
            pointType: 'tPoint',
            amount,
            description: `${fromMember.name}로부터 전송받음`,
            fromMemberId
        });

        return { success: true };
    }

    // ==================== POINT TRANSACTIONS ====================

    getPointTransactions() {
        const data = localStorage.getItem(STORAGE_KEYS.POINT_TRANSACTIONS);
        return data ? JSON.parse(data) : [];
    }

    getPointTransactionsByMember(memberId) {
        return this.getPointTransactions().filter(t => t.memberId === memberId);
    }

    addPointTransaction(transactionData) {
        const transactions = this.getPointTransactions();
        const transaction = {
            id: 'PT' + Date.now().toString().slice(-8),
            ...transactionData,
            createdAt: new Date().toISOString()
        };
        transactions.unshift(transaction);
        localStorage.setItem(STORAGE_KEYS.POINT_TRANSACTIONS, JSON.stringify(transactions));
        return transaction;
    }

    // ==================== WITHDRAWALS ====================

    getWithdrawals() {
        const data = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
        return data ? JSON.parse(data) : [];
    }

    getWithdrawalsByMember(memberId) {
        return this.getWithdrawals().filter(w => w.memberId === memberId);
    }

    getPendingWithdrawals() {
        return this.getWithdrawals().filter(w => w.status === 'pending');
    }

    requestWithdrawal(memberId, amount) {
        const member = this.getMemberById(memberId);
        if (!member) return { error: 'Member not found' };
        if (member.memberType !== 'dealer') return { error: '대리점만 출금 신청이 가능합니다.' };
        if (!member.bankInfo || !member.bankInfo.accountNumber) {
            return { error: '은행 정보가 등록되어 있지 않습니다.' };
        }

        const settings = this.getSettings();
        if (amount < settings.minWithdrawal) {
            return { error: `최소 출금 금액은 $${settings.minWithdrawal}입니다.` };
        }

        if (!member.points || member.points.pPoint < amount) {
            return { error: 'P포인트 잔액이 부족합니다.' };
        }

        // Deduct P포인트
        this.updateMemberPoints(memberId, 'pPoint', -amount);
        this.addPointTransaction({
            memberId,
            type: 'withdrawal_request',
            pointType: 'pPoint',
            amount: -amount,
            description: '출금 신청'
        });

        // Create withdrawal request
        const withdrawals = this.getWithdrawals();
        const withdrawal = {
            id: 'WD' + Date.now().toString().slice(-8),
            memberId,
            memberName: member.name,
            amount,
            amountKRW: amount * settings.exchangeRate,
            bankInfo: { ...member.bankInfo },
            status: 'pending',
            requestedAt: new Date().toISOString(),
            processedAt: null,
            processedBy: null,
            note: ''
        };
        withdrawals.unshift(withdrawal);
        localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));

        return withdrawal;
    }

    processWithdrawal(withdrawalId, action, adminNote = '') {
        const withdrawals = this.getWithdrawals();
        const index = withdrawals.findIndex(w => w.id === withdrawalId);
        if (index === -1) return { error: 'Withdrawal not found' };

        const withdrawal = withdrawals[index];
        if (withdrawal.status !== 'pending') return { error: 'Already processed' };

        if (action === 'approve') {
            withdrawals[index].status = 'approved';
            withdrawals[index].processedAt = new Date().toISOString();
            withdrawals[index].note = adminNote;

            this.addPointTransaction({
                memberId: withdrawal.memberId,
                type: 'withdrawal_complete',
                pointType: 'pPoint',
                amount: 0,
                description: `출금 완료 (${withdrawal.amount} USD)`
            });
        } else if (action === 'reject') {
            withdrawals[index].status = 'rejected';
            withdrawals[index].processedAt = new Date().toISOString();
            withdrawals[index].note = adminNote;

            // Refund P포인트
            this.updateMemberPoints(withdrawal.memberId, 'pPoint', withdrawal.amount);
            this.addPointTransaction({
                memberId: withdrawal.memberId,
                type: 'withdrawal_rejected',
                pointType: 'pPoint',
                amount: withdrawal.amount,
                description: `출금 거절 - 환불: ${adminNote}`
            });
        }

        localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
        return withdrawals[index];
    }

    // ==================== ORDER EXTENSIONS ====================

    updateOrderTracking(orderId, trackingNumber, trackingCompany) {
        const orders = this.getOrders();
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return null;

        orders[index].trackingNumber = trackingNumber;
        orders[index].trackingCompany = trackingCompany;
        if (trackingNumber && orders[index].status === 'processing') {
            orders[index].status = 'shipped';
        }
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        return orders[index];
    }

    // Calculate total PV for an order
    calculateOrderPV(items) {
        const products = this.getProducts();
        let totalPV = 0;
        items.forEach(item => {
            const product = products.find(p => p.id === item.productId || p.name === item.name);
            if (product && product.pv) {
                totalPV += product.pv * item.quantity;
            }
        });
        return totalPV;
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

        // Also delete related details
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

    // Get member's PV in a specific period
    getMemberPVInPeriod(memberId, startDate, endDate) {
        const orders = this.getOrders();
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

    // Get member's cumulative (all-time) PV
    getMemberCumulativePV(memberId) {
        const orders = this.getOrders();
        let totalPV = 0;

        orders.forEach(order => {
            if (order.customer?.memberId !== memberId) return;
            if (order.status === 'cancelled') return;
            totalPV += order.totalPV || 0;
        });

        return totalPV;
    }

    // Get all direct referrals of a member
    getDirectReferrals(memberId) {
        const members = this.getMembers();
        return members.filter(m => m.referrer?.id === memberId);
    }

    // Get all downline members recursively
    getAllDownlineIds(memberId, visited = new Set()) {
        if (visited.has(memberId)) return [];
        visited.add(memberId);

        const members = this.getMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const downlineIds = [];
        for (const referral of directReferrals) {
            downlineIds.push(referral.id);
            const subDownline = this.getAllDownlineIds(referral.id, visited);
            downlineIds.push(...subDownline);
        }

        return downlineIds;
    }

    // Get total PV stats for period
    getPVStatsForPeriod(startDate, endDate) {
        const orders = this.getOrders();
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

    // Update member's password
    async updateMemberPassword(memberId, newPassword) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === memberId);
        if (index !== -1) {
            members[index].password = newPassword;
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
            return true;
        }
        return false;
    }
}

// Create global instance
const weverseData = new WeverseDataStore();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { weverseData, STORAGE_KEYS };
}
