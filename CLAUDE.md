# CLAUDE.md

## 테스트 계정

### 일반 회원
| 이름 | 아이디 | 비밀번호 | 회원 유형 |
|------|--------|----------|-----------|
| 김민준 | `minjun` | `test1234` | 딜러 |
| 이서연 | `seoyeon` | `test1234` | 딜러 |
| 박지훈 | `jihun` | `test1234` | 소비자 |
| 최수아 | `sua` | `test1234` | 소비자 |
| 정예준 | `yejun` | `test1234` | 소비자 |

### 관리자
| 아이디 | 비밀번호 |
|--------|----------|
| `admin` | `admin` |

## 작업 이력

### 2026-02-25: 보상 시스템 버그 수정 및 즉시 승급 기능
**파일:** `js/settlement.js`, `js/supabase.js`, `admin/settlement.html`, `admin/organization.html`, `admin/index.html`, `admin/css/admin.css`

#### 1. 14,400PV 한방매출 즉시 다이아몬드 승급 (신규)
- **주문 시점에 즉시 승급** (주마감 필요 없음)
- `js/supabase.js`의 `addOrder()` 함수에서 14,400PV 이상 주문 감지
- `instantDiamondPromotion()` 함수 추가
- 이미 다이아몬드 이상이면 스킵
- **사용자 승급 알림**: 주문 완료 페이지에서 승급 축하 메시지 표시
  - `pages/checkout.html`: 승급 정보 localStorage 저장 + 디버깅 로그
  - `pages/order-complete.html`: 승급 알림 UI (보라색 박스 + 펄스 애니메이션) + 디버깅 로그
- **관리자 승급 알림 시스템** (신규):
  - `js/supabase.js`: `addPromotionLog()`, `getPromotionLogs()`, `getUnviewedPromotionCount()`, `markPromotionsAsViewed()` 함수 추가
  - `admin/index.html`: 알림 드롭다운에 승급 알림 표시 (별 아이콘, 보라색)
  - `admin/css/admin.css`: `.notification-icon.promotion` 스타일 추가
  - 승급 로그는 localStorage(`weversePromotionLogs`)에 저장됨

#### 2. 엑셀 내보내기 버그 수정
- `exportSettlementDetails()` 함수 async/await 수정
- `weverseData.getMembers()`가 비동기 함수인데 await 없이 호출하던 문제

#### 3. 조직도 PV 표시 안됨 수정
- `order.totalPv` → `order.totalPV` (대소문자 오류)
- Supabase의 `toCamelCase`가 `total_pv`를 `totalPV`로 변환

#### 4. 주마감 시 다이아몬드 승급 조건 보완
- 마감 기간 내 **단일 주문**이 14,400PV 이상이면 승급
- `hasSingleOrderWithPVAtLeast()` 함수 추가
- `evaluateNewRank()`에 `periodStart`, `periodEnd` 파라미터 추가

#### 5. 육성보너스 조건 추가
- **"인센티브 수령자에게만 지급"** 조건 추가
- 본인이 인센티브를 받아야 육성보너스도 받을 수 있음

#### 6. 마이페이지 주문 내역 버그 수정
- **문제**: 다른 계정으로 주문한 내역이 localStorage에 남아 다른 계정에서도 표시됨
- **수정**:
  - `pages/account.html`: 로그인한 본인의 주문만 표시 (session.id로 필터링)
  - `js/supabase.js`: 로그인/로그아웃 시 localStorage의 lastOrder 삭제

---

### 2026-02-23: 수당 검수용 조회 기능 추가
**파일:** `admin/settlement.html`, `js/settlement.js`

- 관리자 마감 관리 페이지에 **수당 검수용 조회** 섹션 추가
- 회원 아이디 + 주문 기간으로 검색
- 해당 회원의 직추천(1레벨) 회원들 대상으로 조회:
  - 주문 건수
  - 기간 내 주문금액
  - 기간 내 주문 PV (추천보너스 계산 기준)
  - 누적 PV
- 조회 결과 **엑셀 내보내기** 기능 포함
- 목적: 마감 후 수당이 맞는지 빠르게 검수

---

### 2026-02-21: 마감 날짜 자동 갱신 기능 추가
**파일:** `admin/settlement.html`

- 주마감/월마감 실행 완료 후 자동으로 다음 기간으로 날짜 갱신
- 주마감: 완료 후 → 다음 주 월~일 자동 설정
- 월마감: 완료 후 → 다음 달 1일~말일 자동 설정

---

### 2026-02-21: 보상 시스템 (마감/승급/수당) 구현
**핵심 파일:**
- `js/settlement.js` - 마감/승급/수당 핵심 로직
- `admin/settlement.html` - 마감 관리 페이지

#### 1. 직급 자동 승급
| 직급 | 조건 |
|------|------|
| 매니저 | 본인 누적 2,200PV 이상 |
| 다이아몬드 | 매니저 + (본인 22,000PV / 직추천 22,000PV / 3개라인 120일 33,000PV / 당일 14,400PV) |
| 블루다이아몬드 | 다이아 + (직추천 다이아 5명 / 3개라인 2개다이아 240일 154,000PV) |
| 레드다이아몬드 | 블루다이아 + 3개라인 2개블루다이아 455일 616,000PV |
| 크라운다이아몬드 | 레드다이아 + 3개라인 레드다이아 455일 3,080,000PV |

#### 2. 수당 종류
- **추천 보너스 (주마감)**: 매니저 이상, 직추천 주간 매출 PV의 30%
- **인센티브 (월마감)**: 다이아 이상, 하선 PV 기준 10~23% (롤업 구조)
- **육성보너스 (월마감)**: 다이아 이상, 직추천 라인 첫 다이아 인센티브의 20%
- **크라운보너스 (월마감)**: 크라운다이아, 당월 전체 PV의 1% / N분배

#### 3. 마감 기능
- **수기 마감**: `admin/settlement.html`에서 기간 선택 후 실행
- **자동 마감**: `supabase/functions/` Edge Functions (배포 필요)
  - 주마감: 매주 월요일 00:00 (KST)
  - 월마감: 매월 1일 00:00 (KST)
- **롤백**: 마감 삭제 시 지급된 P포인트 원복 (직급은 강등 없음)

#### 4. 성능 최적화
- 캐싱 시스템 추가: `initCache()`, `clearCache()`
- PV 계산 함수 동기화 (캐시 사용으로 반복 DB 호출 제거)

#### 5. 생성/수정된 파일
| 파일 | 작업 |
|------|------|
| `js/settlement.js` | **신규** - 마감/승급/수당 로직 |
| `admin/settlement.html` | **신규** - 마감 관리 UI |
| `js/supabase.js` | PV 조회 함수 추가 |
| `supabase_schema.sql` | settlements, settlement_details 테이블 추가 |
| `supabase/functions/weekly-settlement/` | **신규** - 주마감 자동화 |
| `supabase/functions/monthly-settlement/` | **신규** - 월마감 자동화 |
| `supabase/setup_auto_settlement.sql` | **신규** - pg_cron 설정 |
| `admin/*.html` (9개) | 사이드바에 마감 관리 메뉴 추가 |

### 2026-01-31: 포인트 전송 버그 수정
**파일:** `pages/point-transfer.html`

1. **C포인트 선택 버그 수정**
   - `selectPointType` 함수에서 `event` 객체 대신 `element` 파라미터로 변경
   - onclick에서 `this`를 전달하도록 수정

2. **받는 사람 검색 기능 개선**
   - username(아이디)으로도 검색 가능하도록 추가
   - 기존: 이메일, 회원 ID만 검색 가능
   - 변경: 아이디, 이메일, 회원 ID 모두 검색 가능

3. **null 체크 추가**
   - `currentMember`가 없을 때 에러 방지

## 이미지 가져오기

이미지가 필요하면 `scripts/fetch-image.sh` 스크립트를 사용해서 Unsplash에서 가져와. 배너 이미지는 landscape 방향으로, 적절한 영어 키워드로 검색해.

```bash
# 사용 예시
./scripts/fetch-image.sh "mountain landscape" banner.jpg
```
