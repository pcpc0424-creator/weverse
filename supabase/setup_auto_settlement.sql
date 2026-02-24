-- ===========================================
-- WEVERSE 자동 마감 스케줄 설정
-- ===========================================
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요.
-- pg_cron 확장을 사용하여 자동 마감을 스케줄링합니다.

-- 1. pg_cron 확장 활성화 (Supabase Pro 플랜 이상 필요)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. pg_net 확장 활성화 (HTTP 요청용)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ===========================================
-- 주마감 스케줄 (매주 월요일 00:00 KST = 일요일 15:00 UTC)
-- ===========================================
SELECT cron.schedule(
    'weekly-settlement',
    '0 15 * * 0',  -- 매주 일요일 15:00 UTC (한국시간 월요일 00:00)
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-settlement',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_ANON_KEY'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- ===========================================
-- 월마감 스케줄 (매월 1일 00:00 KST = 전날 15:00 UTC)
-- ===========================================
SELECT cron.schedule(
    'monthly-settlement',
    '0 15 1 * *',  -- 매월 1일 15:00 UTC (한국시간 다음날 00:00)
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-settlement',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_ANON_KEY'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- ===========================================
-- 스케줄 확인
-- ===========================================
SELECT * FROM cron.job;

-- ===========================================
-- 스케줄 삭제 (필요시)
-- ===========================================
-- SELECT cron.unschedule('weekly-settlement');
-- SELECT cron.unschedule('monthly-settlement');

-- ===========================================
-- 설정 방법
-- ===========================================
-- 1. Supabase 대시보드에서 프로젝트 설정 확인
--    - Project URL: https://YOUR_PROJECT_REF.supabase.co
--    - Anon Key: Settings > API > anon (public)
--
-- 2. Edge Functions 배포
--    $ cd /var/www/weverse
--    $ supabase functions deploy weekly-settlement
--    $ supabase functions deploy monthly-settlement
--
-- 3. 이 SQL 스크립트에서 YOUR_PROJECT_REF와 YOUR_ANON_KEY를 실제 값으로 교체
--
-- 4. Supabase SQL Editor에서 이 스크립트 실행
--
-- 주의: pg_cron은 Supabase Pro 플랜 이상에서만 사용 가능합니다.
-- Free 플랜에서는 외부 cron 서비스(예: cron-job.org)를 사용하세요.
