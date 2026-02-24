# WEVERSE 자동 마감 설정 가이드

## 개요
- **주마감**: 매주 월요일 00:00 (KST) - 추천보너스 정산 + 직급 승급
- **월마감**: 매월 1일 00:00 (KST) - 인센티브 + 육성보너스 + 크라운보너스 정산

## 필수 조건
- Supabase Pro 플랜 이상 (pg_cron 사용을 위해)
- 또는 외부 cron 서비스 사용 (Free 플랜)

---

## 방법 1: Supabase Edge Functions + pg_cron (Pro 플랜)

### 1단계: Supabase CLI 설치
```bash
npm install -g supabase
```

### 2단계: Edge Functions 배포
```bash
cd /var/www/weverse

# Supabase 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# 함수 배포
supabase functions deploy weekly-settlement
supabase functions deploy monthly-settlement
```

### 3단계: pg_cron 스케줄 설정
1. Supabase 대시보드 > SQL Editor 열기
2. `setup_auto_settlement.sql` 내용 복사
3. `YOUR_PROJECT_REF`와 `YOUR_ANON_KEY`를 실제 값으로 교체
4. 실행

---

## 방법 2: 외부 Cron 서비스 (Free 플랜)

### cron-job.org 사용
1. https://cron-job.org 가입
2. 새 cronjob 생성:

**주마감 (매주 월요일 00:00 KST)**
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-settlement`
- 스케줄: `0 15 * * 0` (UTC 기준)
- Method: POST
- Headers:
  - Authorization: `Bearer YOUR_ANON_KEY`
  - Content-Type: `application/json`

**월마감 (매월 1일 00:00 KST)**
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-settlement`
- 스케줄: `0 15 1 * *` (UTC 기준)
- Method: POST
- Headers:
  - Authorization: `Bearer YOUR_ANON_KEY`
  - Content-Type: `application/json`

---

## 방법 3: GitHub Actions (무료)

`.github/workflows/auto-settlement.yml` 파일 생성:

```yaml
name: Auto Settlement

on:
  schedule:
    # 주마감: 매주 일요일 15:00 UTC (한국시간 월요일 00:00)
    - cron: '0 15 * * 0'
    # 월마감: 매월 1일 15:00 UTC
    - cron: '0 15 1 * *'
  workflow_dispatch:

jobs:
  settlement:
    runs-on: ubuntu-latest
    steps:
      - name: Weekly Settlement
        if: github.event.schedule == '0 15 * * 0'
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/weekly-settlement

      - name: Monthly Settlement
        if: github.event.schedule == '0 15 1 * *'
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/monthly-settlement
```

GitHub Secrets에 추가:
- `SUPABASE_PROJECT_REF`: 프로젝트 참조 ID
- `SUPABASE_ANON_KEY`: Anon 키

---

## 테스트

### 수동 실행 (테스트용)
```bash
# 주마감 테스트
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-settlement

# 월마감 테스트
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-settlement
```

---

## 로그 확인
Supabase 대시보드 > Edge Functions > Logs에서 실행 로그 확인

---

## 문제 해결

### pg_cron 사용 불가
- Free 플랜에서는 pg_cron을 사용할 수 없습니다.
- 외부 cron 서비스 또는 GitHub Actions를 사용하세요.

### Edge Function 타임아웃
- 기본 타임아웃은 60초입니다.
- 회원 수가 많으면 배치 처리가 필요할 수 있습니다.

### 인증 오류
- Authorization 헤더에 `Bearer ` 접두사가 있는지 확인하세요.
- Anon Key가 올바른지 확인하세요.
