-- 테스트 산하 회원 추가 스크립트
-- 김영희(testa, ID: T002) 계정의 산하로 많은 회원 추가

-- 1단계 산하 (김영희 직추천) - 10명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D1_01', '테스트산하1-1', 'down1_1', 'down1_1@test.com', 'test1234', 'dealer', 'general', 'active', '2026-01-15', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_02', '테스트산하1-2', 'down1_2', 'down1_2@test.com', 'test1234', 'dealer', 'manager', 'active', '2026-01-16', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_03', '테스트산하1-3', 'down1_3', 'down1_3@test.com', 'test1234', 'consumer', 'general', 'active', '2026-01-17', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_04', '테스트산하1-4', 'down1_4', 'down1_4@test.com', 'test1234', 'dealer', 'general', 'active', '2026-01-18', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_05', '테스트산하1-5', 'down1_5', 'down1_5@test.com', 'test1234', 'consumer', 'general', 'active', '2026-01-19', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_06', '테스트산하1-6', 'down1_6', 'down1_6@test.com', 'test1234', 'dealer', 'diamond', 'active', '2026-01-20', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_07', '테스트산하1-7', 'down1_7', 'down1_7@test.com', 'test1234', 'dealer', 'general', 'active', '2026-01-21', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_08', '테스트산하1-8', 'down1_8', 'down1_8@test.com', 'test1234', 'consumer', 'general', 'active', '2026-01-22', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_09', '테스트산하1-9', 'down1_9', 'down1_9@test.com', 'test1234', 'dealer', 'manager', 'active', '2026-01-23', '{"id": "T002", "name": "김영희", "username": "testa"}'),
('TEST_D1_10', '테스트산하1-10', 'down1_10', 'down1_10@test.com', 'test1234', 'consumer', 'general', 'active', '2026-01-24', '{"id": "T002", "name": "김영희", "username": "testa"}')
ON CONFLICT (id) DO NOTHING;

-- 2단계 산하 (1-1의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D2_01', '테스트산하2-1', 'down2_1', 'down2_1@test.com', 'test1234', 'dealer', 'general', 'active', '2026-01-25', '{"id": "TEST_D1_01", "name": "테스트산하1-1", "username": "down1_1"}'),
('TEST_D2_02', '테스트산하2-2', 'down2_2', 'down2_2@test.com', 'test1234', 'consumer', 'general', 'active', '2026-01-26', '{"id": "TEST_D1_01", "name": "테스트산하1-1", "username": "down1_1"}'),
('TEST_D2_03', '테스트산하2-3', 'down2_3', 'down2_3@test.com', 'test1234', 'dealer', 'manager', 'active', '2026-01-27', '{"id": "TEST_D1_01", "name": "테스트산하1-1", "username": "down1_1"}'),
('TEST_D2_04', '테스트산하2-4', 'down2_4', 'down2_4@test.com', 'test1234', 'consumer', 'general', 'active', '2026-01-28', '{"id": "TEST_D1_01", "name": "테스트산하1-1", "username": "down1_1"}'),
('TEST_D2_05', '테스트산하2-5', 'down2_5', 'down2_5@test.com', 'test1234', 'dealer', 'general', 'active', '2026-01-29', '{"id": "TEST_D1_01", "name": "테스트산하1-1", "username": "down1_1"}')
ON CONFLICT (id) DO NOTHING;

-- 2단계 산하 (1-2의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D2_06', '테스트산하2-6', 'down2_6', 'down2_6@test.com', 'test1234', 'dealer', 'general', 'active', '2026-01-30', '{"id": "TEST_D1_02", "name": "테스트산하1-2", "username": "down1_2"}'),
('TEST_D2_07', '테스트산하2-7', 'down2_7', 'down2_7@test.com', 'test1234', 'consumer', 'general', 'active', '2026-01-31', '{"id": "TEST_D1_02", "name": "테스트산하1-2", "username": "down1_2"}'),
('TEST_D2_08', '테스트산하2-8', 'down2_8', 'down2_8@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-01', '{"id": "TEST_D1_02", "name": "테스트산하1-2", "username": "down1_2"}'),
('TEST_D2_09', '테스트산하2-9', 'down2_9', 'down2_9@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-02', '{"id": "TEST_D1_02", "name": "테스트산하1-2", "username": "down1_2"}'),
('TEST_D2_10', '테스트산하2-10', 'down2_10', 'down2_10@test.com', 'test1234', 'dealer', 'diamond', 'active', '2026-02-03', '{"id": "TEST_D1_02", "name": "테스트산하1-2", "username": "down1_2"}')
ON CONFLICT (id) DO NOTHING;

-- 2단계 산하 (1-6의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D2_11', '테스트산하2-11', 'down2_11', 'down2_11@test.com', 'test1234', 'dealer', 'manager', 'active', '2026-02-04', '{"id": "TEST_D1_06", "name": "테스트산하1-6", "username": "down1_6"}'),
('TEST_D2_12', '테스트산하2-12', 'down2_12', 'down2_12@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-05', '{"id": "TEST_D1_06", "name": "테스트산하1-6", "username": "down1_6"}'),
('TEST_D2_13', '테스트산하2-13', 'down2_13', 'down2_13@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-06', '{"id": "TEST_D1_06", "name": "테스트산하1-6", "username": "down1_6"}'),
('TEST_D2_14', '테스트산하2-14', 'down2_14', 'down2_14@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-07', '{"id": "TEST_D1_06", "name": "테스트산하1-6", "username": "down1_6"}'),
('TEST_D2_15', '테스트산하2-15', 'down2_15', 'down2_15@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-08', '{"id": "TEST_D1_06", "name": "테스트산하1-6", "username": "down1_6"}')
ON CONFLICT (id) DO NOTHING;

-- 3단계 산하 (2-1의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D3_01', '테스트산하3-1', 'down3_1', 'down3_1@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-09', '{"id": "TEST_D2_01", "name": "테스트산하2-1", "username": "down2_1"}'),
('TEST_D3_02', '테스트산하3-2', 'down3_2', 'down3_2@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-10', '{"id": "TEST_D2_01", "name": "테스트산하2-1", "username": "down2_1"}'),
('TEST_D3_03', '테스트산하3-3', 'down3_3', 'down3_3@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-11', '{"id": "TEST_D2_01", "name": "테스트산하2-1", "username": "down2_1"}'),
('TEST_D3_04', '테스트산하3-4', 'down3_4', 'down3_4@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-12', '{"id": "TEST_D2_01", "name": "테스트산하2-1", "username": "down2_1"}'),
('TEST_D3_05', '테스트산하3-5', 'down3_5', 'down3_5@test.com', 'test1234', 'dealer', 'manager', 'active', '2026-02-13', '{"id": "TEST_D2_01", "name": "테스트산하2-1", "username": "down2_1"}')
ON CONFLICT (id) DO NOTHING;

-- 3단계 산하 (2-3의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D3_06', '테스트산하3-6', 'down3_6', 'down3_6@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-14', '{"id": "TEST_D2_03", "name": "테스트산하2-3", "username": "down2_3"}'),
('TEST_D3_07', '테스트산하3-7', 'down3_7', 'down3_7@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-15', '{"id": "TEST_D2_03", "name": "테스트산하2-3", "username": "down2_3"}'),
('TEST_D3_08', '테스트산하3-8', 'down3_8', 'down3_8@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-16', '{"id": "TEST_D2_03", "name": "테스트산하2-3", "username": "down2_3"}'),
('TEST_D3_09', '테스트산하3-9', 'down3_9', 'down3_9@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-17', '{"id": "TEST_D2_03", "name": "테스트산하2-3", "username": "down2_3"}'),
('TEST_D3_10', '테스트산하3-10', 'down3_10', 'down3_10@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-18', '{"id": "TEST_D2_03", "name": "테스트산하2-3", "username": "down2_3"}')
ON CONFLICT (id) DO NOTHING;

-- 3단계 산하 (2-10의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D3_11', '테스트산하3-11', 'down3_11', 'down3_11@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-19', '{"id": "TEST_D2_10", "name": "테스트산하2-10", "username": "down2_10"}'),
('TEST_D3_12', '테스트산하3-12', 'down3_12', 'down3_12@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-20', '{"id": "TEST_D2_10", "name": "테스트산하2-10", "username": "down2_10"}'),
('TEST_D3_13', '테스트산하3-13', 'down3_13', 'down3_13@test.com', 'test1234', 'dealer', 'manager', 'active', '2026-02-21', '{"id": "TEST_D2_10", "name": "테스트산하2-10", "username": "down2_10"}'),
('TEST_D3_14', '테스트산하3-14', 'down3_14', 'down3_14@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-22', '{"id": "TEST_D2_10", "name": "테스트산하2-10", "username": "down2_10"}'),
('TEST_D3_15', '테스트산하3-15', 'down3_15', 'down3_15@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-23', '{"id": "TEST_D2_10", "name": "테스트산하2-10", "username": "down2_10"}')
ON CONFLICT (id) DO NOTHING;

-- 3단계 산하 (2-11의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D3_16', '테스트산하3-16', 'down3_16', 'down3_16@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-19', '{"id": "TEST_D2_11", "name": "테스트산하2-11", "username": "down2_11"}'),
('TEST_D3_17', '테스트산하3-17', 'down3_17', 'down3_17@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-20', '{"id": "TEST_D2_11", "name": "테스트산하2-11", "username": "down2_11"}'),
('TEST_D3_18', '테스트산하3-18', 'down3_18', 'down3_18@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-21', '{"id": "TEST_D2_11", "name": "테스트산하2-11", "username": "down2_11"}'),
('TEST_D3_19', '테스트산하3-19', 'down3_19', 'down3_19@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-22', '{"id": "TEST_D2_11", "name": "테스트산하2-11", "username": "down2_11"}'),
('TEST_D3_20', '테스트산하3-20', 'down3_20', 'down3_20@test.com', 'test1234', 'dealer', 'diamond', 'active', '2026-02-23', '{"id": "TEST_D2_11", "name": "테스트산하2-11", "username": "down2_11"}')
ON CONFLICT (id) DO NOTHING;

-- 4단계 산하 (3-1의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D4_01', '테스트산하4-1', 'down4_1', 'down4_1@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-20', '{"id": "TEST_D3_01", "name": "테스트산하3-1", "username": "down3_1"}'),
('TEST_D4_02', '테스트산하4-2', 'down4_2', 'down4_2@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-21', '{"id": "TEST_D3_01", "name": "테스트산하3-1", "username": "down3_1"}'),
('TEST_D4_03', '테스트산하4-3', 'down4_3', 'down4_3@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-22', '{"id": "TEST_D3_01", "name": "테스트산하3-1", "username": "down3_1"}'),
('TEST_D4_04', '테스트산하4-4', 'down4_4', 'down4_4@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-22', '{"id": "TEST_D3_05", "name": "테스트산하3-5", "username": "down3_5"}'),
('TEST_D4_05', '테스트산하4-5', 'down4_5', 'down4_5@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-23', '{"id": "TEST_D3_05", "name": "테스트산하3-5", "username": "down3_5"}')
ON CONFLICT (id) DO NOTHING;

-- 4단계 산하 (3-13의 산하) - 5명
INSERT INTO members (id, name, username, email, password, member_type, rank, status, join_date, referrer) VALUES
('TEST_D4_06', '테스트산하4-6', 'down4_6', 'down4_6@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-20', '{"id": "TEST_D3_13", "name": "테스트산하3-13", "username": "down3_13"}'),
('TEST_D4_07', '테스트산하4-7', 'down4_7', 'down4_7@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-21', '{"id": "TEST_D3_13", "name": "테스트산하3-13", "username": "down3_13"}'),
('TEST_D4_08', '테스트산하4-8', 'down4_8', 'down4_8@test.com', 'test1234', 'dealer', 'general', 'active', '2026-02-22', '{"id": "TEST_D3_13", "name": "테스트산하3-13", "username": "down3_13"}'),
('TEST_D4_09', '테스트산하4-9', 'down4_9', 'down4_9@test.com', 'test1234', 'consumer', 'general', 'active', '2026-02-22', '{"id": "TEST_D3_20", "name": "테스트산하3-20", "username": "down3_20"}'),
('TEST_D4_10', '테스트산하4-10', 'down4_10', 'down4_10@test.com', 'test1234', 'dealer', 'manager', 'active', '2026-02-23', '{"id": "TEST_D3_20", "name": "테스트산하3-20", "username": "down3_20"}')
ON CONFLICT (id) DO NOTHING;

-- 총 추가 회원: 10 + 15 + 20 + 10 = 55명
-- 홍길동 산하 총: 55명

-- 확인 쿼리
-- SELECT COUNT(*) as total_downlines FROM members WHERE referrer IS NOT NULL AND id LIKE 'TEST_D%';
