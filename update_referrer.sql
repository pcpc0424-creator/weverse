-- =============================================
-- 기존 회원 데이터에 추천인(referrer) 관계 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 조직도 구조:
-- M001 (김민준) - 최상위
--   ├── M002 (이서연) - M001의 산하
--   │   └── M004 (최수아) - M002의 산하
--   └── M003 (박지훈) - M001의 산하
--       └── M005 (정예준) - M003의 산하

-- M002 (이서연)의 추천인을 M001 (김민준)으로 설정
UPDATE members
SET referrer = '{"id": "M001", "username": "minjun", "name": "김민준"}'::jsonb
WHERE id = 'M002';

-- M003 (박지훈)의 추천인을 M001 (김민준)으로 설정
UPDATE members
SET referrer = '{"id": "M001", "username": "minjun", "name": "김민준"}'::jsonb
WHERE id = 'M003';

-- M004 (최수아)의 추천인을 M002 (이서연)으로 설정
UPDATE members
SET referrer = '{"id": "M002", "username": "seoyeon", "name": "이서연"}'::jsonb
WHERE id = 'M004';

-- M005 (정예준)의 추천인을 M003 (박지훈)으로 설정
UPDATE members
SET referrer = '{"id": "M003", "username": "jihun", "name": "박지훈"}'::jsonb
WHERE id = 'M005';

-- 확인 쿼리
SELECT id, name, username, referrer FROM members ORDER BY id;
