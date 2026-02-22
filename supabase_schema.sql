-- =============================================
-- WEVERSE Supabase Database Schema
-- =============================================

-- 1. Members (회원) 테이블
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    password TEXT NOT NULL,
    member_type TEXT DEFAULT 'consumer',
    rank TEXT DEFAULT 'general',
    total_spent INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    last_order DATE,
    points JSONB DEFAULT '{"rPay": 0, "pPoint": 0, "cPoint": 0, "tPoint": 0}'::jsonb,
    bank_info JSONB DEFAULT '{"bankName": "", "accountNumber": "", "accountHolder": ""}'::jsonb,
    referrer JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products (상품) 테이블
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ko TEXT,
    description TEXT,
    description_ko TEXT,
    category TEXT,
    category_ko TEXT,
    price INTEGER DEFAULT 0,
    price_usd INTEGER DEFAULT 0,
    pv INTEGER DEFAULT 0,
    original_price INTEGER,
    original_price_usd INTEGER,
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    badge TEXT,
    image TEXT,
    image_data TEXT,
    detail_page TEXT,
    features JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders (주문) 테이블
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer JSONB NOT NULL,
    items JSONB NOT NULL,
    shipping JSONB,
    subtotal INTEGER DEFAULT 0,
    shipping_cost INTEGER DEFAULT 0,
    discount INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    total_pv INTEGER DEFAULT 0,
    pv_processed BOOLEAN DEFAULT FALSE,
    pv_process_date DATE,
    payment JSONB,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    order_date TIMESTAMPTZ DEFAULT NOW(),
    delivery_date DATE,
    tracking_number TEXT,
    tracking_company TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Point Transactions (포인트 거래) 테이블
CREATE TABLE point_transactions (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    point_type TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    description TEXT,
    order_id TEXT,
    to_member_id TEXT,
    from_member_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Withdrawals (출금) 테이블
CREATE TABLE withdrawals (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT,
    amount NUMERIC DEFAULT 0,
    amount_krw NUMERIC DEFAULT 0,
    bank_info JSONB,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by TEXT,
    note TEXT
);

-- 6. Settings (설정) 테이블
CREATE TABLE settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    exchange_rate INTEGER DEFAULT 1350,
    p_point_rate INTEGER DEFAULT 0,
    p_point_settle_days INTEGER DEFAULT 0,
    p_point_auto_enabled BOOLEAN DEFAULT FALSE,
    min_withdrawal INTEGER DEFAULT 50,
    shipping_companies JSONB DEFAULT '["CJ대한통운", "한진택배", "롯데택배", "우체국", "로젠택배"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) 설정
-- =============================================

-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 대해 anon 사용자 접근 허용 (개발용)
-- 실제 서비스에서는 더 세밀한 정책 필요

CREATE POLICY "Allow all for members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for point_transactions" ON point_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for withdrawals" ON withdrawals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 기본 설정 삽입
INSERT INTO settings (id) VALUES ('default');

-- 기본 상품 데이터
INSERT INTO products (id, name, name_ko, description, description_ko, category, category_ko, price, price_usd, pv, stock, status, badge, image, detail_page, features) VALUES
('WV-NB-001', 'New-BornAid', '뉴본에이드', 'Fermented enzyme supplement', '발효 효소 영양제', 'health', '건강', 89000, 89, 45, 156, 'active', 'Best', 'shop-1.jpg', 'products/new-bornaid.html', '[{"title": "Fermented Enzymes", "desc": "Natural fermentation process for better absorption"}]'),
('WV-AG-002', 'Alpha GPC', '알파 GPC', 'Brain health supplement', '두뇌 건강 영양제', 'supplements', '영양제', 129000, 129, 65, 89, 'active', '', 'shop-2.jpg', 'products/alpha-gpc.html', '[{"title": "Cognitive Support", "desc": "Enhances memory and cognitive function"}]'),
('WV-NL-003', 'Nano Lutein', '나노 루테인', 'Eye health supplement', '눈 건강 영양제', 'vitamins', '비타민', 79000, 79, 40, 234, 'active', 'New', 'shop-3.jpg', 'products/nano-lutein.html', '[{"title": "Nano Technology", "desc": "Enhanced absorption with nano-sized particles"}]'),
('WV-SP-004', 'Super ProstaAid', '슈퍼 프로스타에이드', 'Prostate health supplement', '전립선 건강 영양제', 'health', '건강', 99000, 99, 50, 67, 'active', '', 'shop-4.jpg', 'products/super-prostaid.html', '[{"title": "Prostate Support", "desc": "Comprehensive prostate health formula"}]'),
('WV-JC-005', 'Joint Care', '조인트 케어', 'Joint health supplement', '관절 건강 영양제', 'health', '건강', 69000, 69, 35, 178, 'active', '', 'shop-5.jpg', 'products/joint-care.html', '[{"title": "Glucosamine Sulfate", "desc": "Clinically proven ingredient for joint health"}]'),
('WV-PP-006', 'Premium Package', '프리미엄 패키지', 'All-in-one health package', '올인원 건강 패키지', 'package', '세트', 299000, 299, 150, 45, 'active', 'Premium', 'shop-6.jpg', 'products/premium-package.html', '[{"title": "Complete Package", "desc": "Includes all 5 premium health supplements"}]');

-- 기본 회원 데이터 (테스트용)
-- 조직도: M001 (김민준) → M002 (이서연), M003 (박지훈)
--         M002 (이서연) → M004 (최수아)
--         M003 (박지훈) → M005 (정예준)
INSERT INTO members (id, name, username, email, phone, password, member_type, rank, total_spent, order_count, status, join_date, points, bank_info, referrer) VALUES
('M001', '김민준', 'minjun', 'minjun.kim@example.com', '010-1234-5678', 'test1234', 'dealer', 'crown_diamond', 1250000, 15, 'active', '2023-06-15', '{"rPay": 50000, "pPoint": 125, "cPoint": 50, "tPoint": 20}', '{"bankName": "신한은행", "accountNumber": "110-123-456789", "accountHolder": "김민준"}', NULL),
('M002', '이서연', 'seoyeon', 'seoyeon.lee@example.com', '010-2345-6789', 'test1234', 'dealer', 'red_diamond', 890000, 10, 'active', '2023-08-22', '{"rPay": 30000, "pPoint": 89, "cPoint": 30, "tPoint": 10}', '{"bankName": "국민은행", "accountNumber": "123-45-678901", "accountHolder": "이서연"}', '{"id": "M001", "username": "minjun", "name": "김민준"}'),
('M003', '박지훈', 'jihun', 'jihun.park@example.com', '010-3456-7890', 'test1234', 'consumer', 'diamond', 450000, 5, 'active', '2023-10-05', '{"rPay": 10000, "pPoint": 0, "cPoint": 0, "tPoint": 15}', '{"bankName": "", "accountNumber": "", "accountHolder": ""}', '{"id": "M001", "username": "minjun", "name": "김민준"}'),
('M004', '최수아', 'sua', 'sua.choi@example.com', '010-4567-8901', 'test1234', 'consumer', 'manager', 189000, 2, 'active', '2023-12-01', '{"rPay": 5000, "pPoint": 0, "cPoint": 0, "tPoint": 5}', '{"bankName": "", "accountNumber": "", "accountHolder": ""}', '{"id": "M002", "username": "seoyeon", "name": "이서연"}'),
('M005', '정예준', 'yejun', 'yejun.jung@example.com', '010-5678-9012', 'test1234', 'consumer', 'general', 89000, 1, 'inactive', '2024-01-02', '{"rPay": 0, "pPoint": 0, "cPoint": 0, "tPoint": 0}', '{"bankName": "", "accountNumber": "", "accountHolder": ""}', '{"id": "M003", "username": "jihun", "name": "박지훈"}');

-- 관리자 계정
INSERT INTO members (id, name, username, password, member_type, rank, status) VALUES
('ADMIN', '관리자', 'admin', 'admin', 'admin', 'admin', 'active');

-- =============================================
-- 7. Settlements (마감 이력) 테이블
-- =============================================
CREATE TABLE settlements (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,                    -- 'weekly' | 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT DEFAULT 'completed',       -- 'completed' | 'rolled_back'
    total_pv INTEGER DEFAULT 0,
    total_bonus INTEGER DEFAULT 0,
    total_referral_bonus INTEGER DEFAULT 0,
    total_incentive INTEGER DEFAULT 0,
    total_nurturing_bonus INTEGER DEFAULT 0,
    total_crown_bonus INTEGER DEFAULT 0,
    members_processed INTEGER DEFAULT 0,
    members_promoted INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rolled_back_at TIMESTAMPTZ,
    note TEXT
);

-- 8. Settlement Details (마감 상세) 테이블
CREATE TABLE settlement_details (
    id TEXT PRIMARY KEY,
    settlement_id TEXT REFERENCES settlements(id) ON DELETE CASCADE,
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    rank_before TEXT,                      -- 마감 전 직급
    rank_after TEXT,                       -- 마감 후 직급
    personal_pv INTEGER DEFAULT 0,         -- 본인 PV
    cumulative_pv INTEGER DEFAULT 0,       -- 누적 PV
    group_pv INTEGER DEFAULT 0,            -- 그룹 PV
    direct_referral_pv INTEGER DEFAULT 0,  -- 직추천 PV
    referral_bonus INTEGER DEFAULT 0,      -- 추천보너스
    incentive INTEGER DEFAULT 0,           -- 인센티브
    nurturing_bonus INTEGER DEFAULT 0,     -- 육성보너스
    crown_bonus INTEGER DEFAULT 0,         -- 크라운보너스
    total_bonus INTEGER DEFAULT 0,         -- 총 보너스
    rollup_to TEXT,                        -- 롤업된 상위회원 ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for settlements" ON settlements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for settlement_details" ON settlement_details FOR ALL USING (true) WITH CHECK (true);

-- 인덱스 생성
CREATE INDEX idx_settlements_type ON settlements(type);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX idx_settlement_details_settlement_id ON settlement_details(settlement_id);
CREATE INDEX idx_settlement_details_member_id ON settlement_details(member_id);
