/**
 * WEVERSE Settlement System
 * 마감/승급/수당 정산 핵심 로직
 */

// 직급 상수
const RANKS = {
    GENERAL: 'general',
    MANAGER: 'manager',
    DIAMOND: 'diamond',
    BLUE_DIAMOND: 'blue_diamond',
    RED_DIAMOND: 'red_diamond',
    CROWN_DIAMOND: 'crown_diamond'
};

// 직급 순서 (승급 비교용)
const RANK_ORDER = {
    [RANKS.GENERAL]: 0,
    [RANKS.MANAGER]: 1,
    [RANKS.DIAMOND]: 2,
    [RANKS.BLUE_DIAMOND]: 3,
    [RANKS.RED_DIAMOND]: 4,
    [RANKS.CROWN_DIAMOND]: 5
};

// 직급 표시명
const RANK_NAMES = {
    [RANKS.GENERAL]: '일반',
    [RANKS.MANAGER]: '매니저',
    [RANKS.DIAMOND]: '다이아몬드',
    [RANKS.BLUE_DIAMOND]: '블루다이아몬드',
    [RANKS.RED_DIAMOND]: '레드다이아몬드',
    [RANKS.CROWN_DIAMOND]: '크라운다이아몬드'
};

// 인센티브 지급률 테이블
const INCENTIVE_RATES = {
    [RANKS.DIAMOND]: 0.10,        // 10%
    [RANKS.BLUE_DIAMOND]: 0.17,   // 17%
    [RANKS.RED_DIAMOND]: 0.21,    // 21%
    [RANKS.CROWN_DIAMOND]: 0.23   // 23%
};

// 인센티브 PV 구간
const INCENTIVE_PV_THRESHOLDS = {
    [RANKS.DIAMOND]: 2200,
    [RANKS.BLUE_DIAMOND]: 4400,
    [RANKS.RED_DIAMOND]: 13200,
    [RANKS.CROWN_DIAMOND]: 26400
};

// Storage Keys
const SETTLEMENT_STORAGE_KEYS = {
    SETTLEMENTS: 'weverseSettlements',
    SETTLEMENT_DETAILS: 'weverseSettlementDetails'
};

/**
 * Settlement System Class
 */
class WeverseSettlement {
    constructor() {
        this.dataStore = typeof weverseData !== 'undefined' ? weverseData : null;
        // 캐시 (마감 실행 시 한 번만 데이터 로드)
        this._cachedMembers = null;
        this._cachedOrders = null;
    }

    /**
     * 캐시 초기화
     */
    async initCache() {
        this._cachedMembers = await this.dataStore.getMembers();
        this._cachedOrders = await this.dataStore.getOrders();
    }

    /**
     * 캐시 클리어
     */
    clearCache() {
        this._cachedMembers = null;
        this._cachedOrders = null;
    }

    /**
     * 캐시된 회원 목록 반환
     */
    getCachedMembers() {
        return this._cachedMembers || [];
    }

    /**
     * 캐시된 주문 목록 반환
     */
    getCachedOrders() {
        return this._cachedOrders || [];
    }

    // ==================== 유틸리티 ====================

    /**
     * UUID 생성
     */
    generateId(prefix = 'ST') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 날짜 포맷 (YYYY-MM-DD)
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * 직급 비교 (a가 b보다 높으면 양수)
     */
    compareRanks(a, b) {
        return (RANK_ORDER[a] || 0) - (RANK_ORDER[b] || 0);
    }

    /**
     * 직급이 특정 직급 이상인지 확인
     */
    isRankAtLeast(rank, minRank) {
        return this.compareRanks(rank, minRank) >= 0;
    }

    // ==================== PV 조회 (캐시 사용) ====================

    /**
     * 회원의 기간별 PV 합계 조회
     */
    getMemberPVInPeriod(memberId, startDate, endDate) {
        const orders = this.getCachedOrders();
        let totalPV = 0;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        orders.forEach(order => {
            if (order.customer?.memberId !== memberId) return;
            if (order.status === 'cancelled') return;

            const orderDate = new Date(order.orderDate);
            if (orderDate >= start && orderDate <= end) {
                totalPV += order.totalPV || 0;
            }
        });

        return totalPV;
    }

    /**
     * 회원의 누적 PV 조회
     */
    getMemberCumulativePV(memberId) {
        const orders = this.getCachedOrders();
        let totalPV = 0;

        orders.forEach(order => {
            if (order.customer?.memberId !== memberId) return;
            if (order.status === 'cancelled') return;
            totalPV += order.totalPV || 0;
        });

        return totalPV;
    }

    /**
     * 직추천 회원들의 기간별 PV 합계
     */
    getDirectReferralPVInPeriod(memberId, startDate, endDate) {
        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        let totalPV = 0;
        for (const referral of directReferrals) {
            totalPV += this.getMemberPVInPeriod(referral.id, startDate, endDate);
        }

        return totalPV;
    }

    /**
     * 직추천 회원들의 누적 PV 합계
     */
    getDirectReferralCumulativePV(memberId) {
        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        let totalPV = 0;
        for (const referral of directReferrals) {
            totalPV += this.getMemberCumulativePV(referral.id);
        }

        return totalPV;
    }

    /**
     * 라인별 직추천 PV 조회 (각 직추천 회원의 누적 PV 배열)
     */
    getDirectReferralPVByLine(memberId) {
        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const linesPV = [];
        for (const referral of directReferrals) {
            const linePV = this.getMemberCumulativePV(referral.id);
            linesPV.push({ memberId: referral.id, name: referral.name, pv: linePV });
        }

        return linesPV.sort((a, b) => b.pv - a.pv);
    }

    /**
     * 하선 전체 PV 조회 (특정 기간, 특정 일수 이내)
     */
    getDownlinePVInDays(memberId, days, startDate = null) {
        const endDate = startDate ? new Date(startDate) : new Date();
        const start = new Date(endDate);
        start.setDate(start.getDate() - days);

        return this.getDownlinePVInPeriod(memberId, this.formatDate(start), this.formatDate(endDate));
    }

    /**
     * 하선 전체 PV 조회 (기간별)
     */
    getDownlinePVInPeriod(memberId, startDate, endDate) {
        const downlineIds = this.getAllDownlineIds(memberId);
        let totalPV = 0;

        for (const downlineId of downlineIds) {
            totalPV += this.getMemberPVInPeriod(downlineId, startDate, endDate);
        }

        return totalPV;
    }

    /**
     * 모든 하선 회원 ID 조회 (재귀, 동기)
     */
    getAllDownlineIds(memberId, visited = new Set()) {
        if (visited.has(memberId)) return [];
        visited.add(memberId);

        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const downlineIds = [];
        for (const referral of directReferrals) {
            downlineIds.push(referral.id);
            const subDownline = this.getAllDownlineIds(referral.id, visited);
            downlineIds.push(...subDownline);
        }

        return downlineIds;
    }

    /**
     * 독립 조직(다이아몬드+) 제외한 하선 ID 조회
     * 다이아몬드 이상 회원을 만나면 해당 회원과 그 하선은 제외
     */
    getDownlineIdsExcludingIndependent(memberId, visited = new Set()) {
        if (visited.has(memberId)) return { includedIds: [], independentMembers: [] };
        visited.add(memberId);

        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const includedIds = [];
        const independentMembers = []; // 독립 조직장 목록 (다이아몬드+)

        for (const referral of directReferrals) {
            // 다이아몬드 이상이면 독립 조직으로 처리
            if (this.isRankAtLeast(referral.rank, RANKS.DIAMOND)) {
                independentMembers.push(referral);
                // 독립 조직장과 그 하선은 includedIds에 포함하지 않음
            } else {
                // 일반/매니저는 포함
                includedIds.push(referral.id);
                // 하선 재귀 탐색
                const subResult = this.getDownlineIdsExcludingIndependent(referral.id, visited);
                includedIds.push(...subResult.includedIds);
                independentMembers.push(...subResult.independentMembers);
            }
        }

        return { includedIds, independentMembers };
    }

    /**
     * 라인별 하선 PV 조회 (각 직추천 라인별 산하 전체 PV)
     */
    getDownlinePVByLine(memberId, days = null, endDate = null) {
        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const linesPV = [];
        for (const referral of directReferrals) {
            let linePV = 0;

            if (days) {
                linePV = this.getDownlinePVInDays(referral.id, days, endDate);
                linePV += this.getMemberPVInPeriod(referral.id,
                    this.formatDate(new Date(new Date(endDate || new Date()).setDate(new Date(endDate || new Date()).getDate() - days))),
                    this.formatDate(new Date(endDate || new Date()))
                );
            } else {
                // 전체 기간
                const downlineIds = this.getAllDownlineIds(referral.id);
                for (const id of downlineIds) {
                    linePV += this.getMemberCumulativePV(id);
                }
                linePV += this.getMemberCumulativePV(referral.id);
            }

            linesPV.push({ memberId: referral.id, name: referral.name, pv: linePV });
        }

        return linesPV.sort((a, b) => b.pv - a.pv);
    }

    // ==================== 직급 승급 조건 (동기) ====================

    /**
     * 매니저 승급 조건 확인
     * 조건: 본인 누적 구매 2,200PV 이상
     */
    checkManagerPromotion(memberId) {
        const cumulativePV = this.getMemberCumulativePV(memberId);
        return cumulativePV >= 2200;
    }

    /**
     * 다이아몬드 승급 조건 확인
     * 조건 (매니저 상태에서 아래 중 하나):
     * ① 본인 누적 22,000PV
     * ② 직추천 누적 22,000PV (라인별 최소 3,300PV)
     * ③ 직하선 3개+ 라인, 120일 산하 합산 33,000PV (라인별 최소 3,300PV)
     * ④ 당일 14,400PV (한방 매출) - 마감 기간 내 단일 주문이 14,400PV 이상
     */
    checkDiamondPromotion(memberId, currentRank, periodStart = null, periodEnd = null) {
        // 매니저 이상이어야 함
        if (!this.isRankAtLeast(currentRank, RANKS.MANAGER)) return false;

        // ① 본인 누적 22,000PV
        const cumulativePV = this.getMemberCumulativePV(memberId);
        if (cumulativePV >= 22000) return true;

        // ② 직추천 누적 22,000PV (라인별 최소 3,300PV)
        const directRefLines = this.getDirectReferralPVByLine(memberId);
        const qualifiedLines = directRefLines.filter(l => l.pv >= 3300);
        if (qualifiedLines.length >= 1) {
            const totalDirectRefPV = qualifiedLines.reduce((sum, l) => sum + l.pv, 0);
            if (totalDirectRefPV >= 22000) return true;
        }

        // ③ 직하선 3개+ 라인, 120일 산하 합산 33,000PV (라인별 최소 3,300PV)
        const downlineLines = this.getDownlinePVByLine(memberId, 120, periodEnd);
        const qualifiedDownlines = downlineLines.filter(l => l.pv >= 3300);
        if (qualifiedDownlines.length >= 3) {
            const totalDownlinePV = qualifiedDownlines.reduce((sum, l) => sum + l.pv, 0);
            if (totalDownlinePV >= 33000) return true;
        }

        // ④ 당일 14,400PV (한방 매출) - 마감 기간 내 단일 주문이 14,400PV 이상
        if (periodStart && periodEnd) {
            // 마감 기간 내 단일 주문이 14,400PV 이상인 경우
            if (this.hasSingleOrderWithPVAtLeast(memberId, 14400, periodStart, periodEnd)) {
                return true;
            }
        } else {
            // 기존 호환성: 특정 날짜 하루 체크
            const today = periodEnd || this.formatDate(new Date());
            const dailyPV = this.getMemberPVInPeriod(memberId, today, today);
            if (dailyPV >= 14400) return true;
        }

        return false;
    }

    /**
     * 마감 기간 내 단일 주문이 특정 PV 이상인지 확인
     * @param {string} memberId - 회원 ID
     * @param {number} minPV - 최소 PV
     * @param {string} startDate - 시작일 (YYYY-MM-DD)
     * @param {string} endDate - 종료일 (YYYY-MM-DD)
     * @returns {boolean} 조건 충족 여부
     */
    hasSingleOrderWithPVAtLeast(memberId, minPV, startDate, endDate) {
        const orders = this.getCachedOrders();
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        for (const order of orders) {
            if (order.customer?.memberId !== memberId) continue;
            if (order.status === 'cancelled') continue;

            const orderDate = new Date(order.orderDate);
            if (orderDate >= start && orderDate <= end) {
                const orderPV = order.totalPV || 0;
                if (orderPV >= minPV) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 블루다이아몬드 승급 조건 확인
     * 조건 (다이아 상태에서):
     * ① 직추천 다이아+ 5명 배출
     * ② 직하선 3개+ 라인에서 2개+ 다이아 배출 & 240일 산하 154,000PV (라인별 최소 15,400PV)
     */
    checkBlueDiamondPromotion(memberId, currentRank, checkDate = null) {
        // 다이아몬드 이상이어야 함
        if (!this.isRankAtLeast(currentRank, RANKS.DIAMOND)) return false;

        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        // ① 직추천 다이아+ 5명 배출
        const diamondPlusReferrals = directReferrals.filter(m =>
            this.isRankAtLeast(m.rank, RANKS.DIAMOND)
        );
        if (diamondPlusReferrals.length >= 5) return true;

        // ② 직하선 3개+ 라인에서 2개+ 다이아 배출 & 240일 산하 154,000PV
        const downlineLines = this.getDownlinePVByLine(memberId, 240, checkDate);
        const qualifiedLines = downlineLines.filter(l => l.pv >= 15400);

        if (qualifiedLines.length >= 3) {
            // 각 라인에서 다이아+ 배출 확인
            let linesWithDiamond = 0;
            for (const line of directReferrals) {
                const lineDownlineIds = this.getAllDownlineIds(line.id);
                lineDownlineIds.unshift(line.id); // 직추천 본인 포함

                const hasDiamond = lineDownlineIds.some(id => {
                    const member = members.find(m => m.id === id);
                    return member && this.isRankAtLeast(member.rank, RANKS.DIAMOND);
                });

                if (hasDiamond) linesWithDiamond++;
            }

            if (linesWithDiamond >= 2) {
                const totalPV = qualifiedLines.reduce((sum, l) => sum + l.pv, 0);
                if (totalPV >= 154000) return true;
            }
        }

        return false;
    }

    /**
     * 레드다이아몬드 승급 조건 확인
     * 조건 (블루다이아 상태에서):
     * 직하선 3개+ 라인에서 2개+ 블루다이아 배출 & 455일 산하 616,000PV (라인별 최소 61,600PV)
     */
    checkRedDiamondPromotion(memberId, currentRank, checkDate = null) {
        // 블루다이아몬드 이상이어야 함
        if (!this.isRankAtLeast(currentRank, RANKS.BLUE_DIAMOND)) return false;

        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const downlineLines = this.getDownlinePVByLine(memberId, 455, checkDate);
        const qualifiedLines = downlineLines.filter(l => l.pv >= 61600);

        if (qualifiedLines.length >= 3) {
            // 각 라인에서 블루다이아+ 배출 확인
            let linesWithBlueDiamond = 0;
            for (const line of directReferrals) {
                const lineDownlineIds = this.getAllDownlineIds(line.id);
                lineDownlineIds.unshift(line.id);

                const hasBlueDiamond = lineDownlineIds.some(id => {
                    const member = members.find(m => m.id === id);
                    return member && this.isRankAtLeast(member.rank, RANKS.BLUE_DIAMOND);
                });

                if (hasBlueDiamond) linesWithBlueDiamond++;
            }

            if (linesWithBlueDiamond >= 2) {
                const totalPV = qualifiedLines.reduce((sum, l) => sum + l.pv, 0);
                if (totalPV >= 616000) return true;
            }
        }

        return false;
    }

    /**
     * 크라운다이아몬드 승급 조건 확인
     * 조건 (레드다이아 상태에서):
     * 직하선 3개+ 라인에서 레드다이아 배출 & 455일 산하 3,080,000PV (라인별 최소 308,000PV)
     */
    checkCrownDiamondPromotion(memberId, currentRank, checkDate = null) {
        // 레드다이아몬드 이상이어야 함
        if (!this.isRankAtLeast(currentRank, RANKS.RED_DIAMOND)) return false;

        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const downlineLines = this.getDownlinePVByLine(memberId, 455, checkDate);
        const qualifiedLines = downlineLines.filter(l => l.pv >= 308000);

        if (qualifiedLines.length >= 3) {
            // 각 라인에서 레드다이아+ 배출 확인 (3개 라인 필요)
            let linesWithRedDiamond = 0;
            for (const line of directReferrals) {
                const lineDownlineIds = this.getAllDownlineIds(line.id);
                lineDownlineIds.unshift(line.id);

                const hasRedDiamond = lineDownlineIds.some(id => {
                    const member = members.find(m => m.id === id);
                    return member && this.isRankAtLeast(member.rank, RANKS.RED_DIAMOND);
                });

                if (hasRedDiamond) linesWithRedDiamond++;
            }

            // 3개 라인에서 레드다이아 배출 필요
            if (linesWithRedDiamond >= 3) {
                const totalPV = qualifiedLines.reduce((sum, l) => sum + l.pv, 0);
                if (totalPV >= 3080000) return true;
            }
        }

        return false;
    }

    /**
     * 회원의 새 직급 평가 (현재 직급에서 승급 가능한 최고 직급 반환)
     * @param {string} memberId - 회원 ID
     * @param {string} currentRank - 현재 직급
     * @param {string} periodStart - 마감 기간 시작일 (YYYY-MM-DD)
     * @param {string} periodEnd - 마감 기간 종료일 (YYYY-MM-DD)
     */
    evaluateNewRank(memberId, currentRank, periodStart = null, periodEnd = null) {
        // rank가 없거나 잘못된 값이면 'general'로 기본 처리
        const normalizedRank = currentRank && RANK_ORDER.hasOwnProperty(currentRank)
            ? currentRank
            : RANKS.GENERAL;

        // 강등 없음 - 현재 직급에서 승급만 가능
        let newRank = normalizedRank;

        // 순서대로 승급 조건 확인 (한 번의 마감에서 여러 단계 승급 가능)
        // 일반 → 매니저
        if (newRank === RANKS.GENERAL || !RANK_ORDER.hasOwnProperty(newRank)) {
            if (this.checkManagerPromotion(memberId)) {
                newRank = RANKS.MANAGER;
            }
        }

        // 매니저 → 다이아몬드
        if (newRank === RANKS.MANAGER) {
            if (this.checkDiamondPromotion(memberId, RANKS.MANAGER, periodStart, periodEnd)) {
                newRank = RANKS.DIAMOND;
            }
        }

        // 다이아몬드 → 블루다이아몬드
        if (newRank === RANKS.DIAMOND) {
            if (this.checkBlueDiamondPromotion(memberId, RANKS.DIAMOND, periodEnd)) {
                newRank = RANKS.BLUE_DIAMOND;
            }
        }

        // 블루다이아몬드 → 레드다이아몬드
        if (newRank === RANKS.BLUE_DIAMOND) {
            if (this.checkRedDiamondPromotion(memberId, RANKS.BLUE_DIAMOND, periodEnd)) {
                newRank = RANKS.RED_DIAMOND;
            }
        }

        // 레드다이아몬드 → 크라운다이아몬드
        if (newRank === RANKS.RED_DIAMOND) {
            if (this.checkCrownDiamondPromotion(memberId, RANKS.RED_DIAMOND, periodEnd)) {
                newRank = RANKS.CROWN_DIAMOND;
            }
        }

        return newRank;
    }

    // ==================== 수당 계산 (동기) ====================

    /**
     * 추천 보너스 계산 (주마감)
     * 대상: 매니저 이상
     * 재원: 본인 직추천 회원의 주간 매출 PV
     * 지급률: 30%
     */
    calculateReferralBonus(memberId, memberRank, startDate, endDate) {
        // 매니저 이상만 대상
        if (!this.isRankAtLeast(memberRank, RANKS.MANAGER)) {
            return 0;
        }

        const directRefPV = this.getDirectReferralPVInPeriod(memberId, startDate, endDate);
        return Math.floor(directRefPV * 0.30);
    }

    /**
     * 월마감 전체 인센티브 계산 (수정된 로직)
     *
     * 계산 순서:
     * 1. 각 회원의 롤업 여부 확인
     * 2. 순수 발생PV 계산 (총PV - 인센티브 수령 하선의 라인PV)
     * 3. 본인 인센티브 = 순수 발생PV × 본인 비율
     * 4. 차등 인센티브 = 직추천의 순수 발생PV × (본인 비율 - 하선 비율)
     */
    calculateAllIncentives(startDate, endDate) {
        const members = this.getCachedMembers();
        const processableMembers = members.filter(m =>
            m.id !== 'ADMIN' && m.rank !== 'admin' &&
            this.isRankAtLeast(m.rank, RANKS.DIAMOND)
        );

        // 결과 저장 객체
        const results = {};

        // 초기화
        for (const member of processableMembers) {
            results[member.id] = {
                memberId: member.id,
                rank: member.rank,
                baseIncentive: 0,
                differentialIncentives: [],
                totalDifferentialIncentive: 0,
                totalIncentive: 0,
                isRolledUp: false,
                rolledUpPV: 0,
                generatedPV: 0,      // 총 하선 PV
                netGeneratedPV: 0    // 순수 발생PV (인센티브 수령 하선 제외)
            };
        }

        // 1단계: 각 회원의 롤업 여부 확인 및 총 PV 계산
        for (const member of processableMembers) {
            const rollupCheck = this.checkRollupCondition(member.id, member.rank, startDate, endDate);
            results[member.id].isRolledUp = rollupCheck.isRolledUp;
            results[member.id].generatedPV = rollupCheck.totalDownlinePV;

            if (rollupCheck.isRolledUp) {
                results[member.id].rolledUpPV = rollupCheck.totalDownlinePV;
            }
        }

        // 2단계: 순수 발생PV 계산 (Bottom-up 방식)
        // 먼저 트리 깊이별로 정렬 (깊은 노드부터 처리)
        const memberDepths = {};
        for (const member of processableMembers) {
            memberDepths[member.id] = this.getMemberDepth(member.id);
        }
        const sortedMembers = [...processableMembers].sort((a, b) =>
            memberDepths[b.id] - memberDepths[a.id]
        );

        // 깊은 노드부터 순수 발생PV 계산
        for (const member of sortedMembers) {
            const totalPV = results[member.id].generatedPV;

            // 모든 다이아+ 하선의 순수PV 합계 차감 (직추천뿐 아니라 모든 하선)
            const allDownlineIds = this.getAllDownlineIds(member.id);
            let pvToSubtract = 0;
            for (const downlineId of allDownlineIds) {
                if (results[downlineId]) {
                    // 다이아+ 하선의 순수PV 차감 (인센티브 받든 롤업되든)
                    pvToSubtract += results[downlineId].netGeneratedPV || 0;
                }
            }

            results[member.id].netGeneratedPV = totalPV - pvToSubtract;

            // 본인 인센티브 계산 (순수 발생PV × 본인 비율)
            if (!results[member.id].isRolledUp) {
                const myRate = INCENTIVE_RATES[member.rank] || 0;
                results[member.id].baseIncentive = Math.round(results[member.id].netGeneratedPV * myRate);
            }
        }

        // 3단계: 차등 인센티브 계산 (각 회원의 순수 발생PV를 상위에게 전달)
        for (const member of processableMembers) {
            const memberResult = results[member.id];

            if (memberResult.isRolledUp) {
                // 롤업된 회원: 순수 발생PV가 상위 직급자에게 전달 (전액)
                this.distributeRolledUpPV(
                    member.id,
                    memberResult.netGeneratedPV,
                    startDate,
                    endDate,
                    results
                );
            } else {
                // 롤업 안된 회원: 순수 발생PV에 대해 상위에게 차등 인센티브 분배
                this.distributeDifferentialIncentives(
                    member.id,
                    member.rank,
                    memberResult.netGeneratedPV,
                    results
                );
            }
        }

        // 4단계: 총 인센티브 계산
        for (const memberId in results) {
            const r = results[memberId];
            r.totalDifferentialIncentive = r.differentialIncentives.reduce((sum, d) => sum + d.amount, 0);
            r.totalIncentive = r.baseIncentive + r.totalDifferentialIncentive;
        }

        return results;
    }

    /**
     * 라인에 인센티브 수령자가 있는지 확인
     * (본인 또는 하선 중 롤업되지 않은 다이아+ 회원이 있으면 true)
     */
    lineHasIncentiveRecipient(memberId, results) {
        // 본인이 인센티브 수령자인지
        if (results[memberId] && !results[memberId].isRolledUp) {
            return true;
        }

        // 하선 중 인센티브 수령자 확인
        const members = this.getCachedMembers();
        const downlineIds = this.getAllDownlineIds(memberId);

        for (const id of downlineIds) {
            if (results[id] && !results[id].isRolledUp) {
                return true;
            }
        }

        return false;
    }

    /**
     * 라인 전체 PV 계산 (회원 본인 + 모든 하선)
     */
    getLineTotalPV(memberId, startDate, endDate) {
        let totalPV = this.getMemberPVInPeriod(memberId, startDate, endDate);
        const downlineIds = this.getAllDownlineIds(memberId);

        for (const id of downlineIds) {
            totalPV += this.getMemberPVInPeriod(id, startDate, endDate);
        }

        return totalPV;
    }

    /**
     * 회원의 트리 깊이 계산 (루트에서부터의 거리)
     */
    getMemberDepth(memberId) {
        const members = this.getCachedMembers();
        let depth = 0;
        let currentId = memberId;

        while (currentId) {
            const member = members.find(m => m.id === currentId);
            if (!member || !member.referrer?.id) {
                break;
            }
            currentId = member.referrer.id;
            depth++;
        }

        return depth;
    }

    /**
     * 롤업 조건 확인
     * 조건: 2개 라인 이상 & 최대 실적 라인 제외 합계가 PV 구간 이상
     */
    checkRollupCondition(memberId, memberRank, startDate, endDate) {
        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        // 하선 전체 PV 계산
        const allDownlineIds = this.getAllDownlineIds(memberId);
        let totalDownlinePV = 0;
        for (const id of allDownlineIds) {
            totalDownlinePV += this.getMemberPVInPeriod(id, startDate, endDate);
        }

        // 2개 라인 미만이면 롤업
        if (directReferrals.length < 2) {
            return { isRolledUp: true, totalDownlinePV };
        }

        // 라인별 PV 계산
        const linesPV = [];
        for (const referral of directReferrals) {
            const lineIds = this.getAllDownlineIds(referral.id);
            lineIds.unshift(referral.id);

            let linePV = 0;
            for (const id of lineIds) {
                linePV += this.getMemberPVInPeriod(id, startDate, endDate);
            }
            linesPV.push({ memberId: referral.id, pv: linePV });
        }

        // 최대 실적 라인 제외한 합계
        linesPV.sort((a, b) => b.pv - a.pv);
        const pvExcludingMax = linesPV.slice(1).reduce((sum, l) => sum + l.pv, 0);

        // PV 구간별 롤업 조건
        const minPV = INCENTIVE_PV_THRESHOLDS[memberRank] || 0;
        const isRolledUp = pvExcludingMax < minPV;

        return { isRolledUp, totalDownlinePV, pvExcludingMax, minPV };
    }

    /**
     * 롤업된 PV를 상위 직급자에게 분배
     */
    distributeRolledUpPV(memberId, rolledUpPV, startDate, endDate, results) {
        const members = this.getCachedMembers();
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        // 상위 라인을 따라 올라가며 첫 번째 롤업 안된 상위 직급자 찾기
        let currentId = member.referrer?.id;
        let prevRank = null; // 이전 직급 (차등 계산용)

        while (currentId) {
            const upperMember = members.find(m => m.id === currentId);
            if (!upperMember) break;

            // 다이아몬드 이상인지 확인
            if (!this.isRankAtLeast(upperMember.rank, RANKS.DIAMOND)) {
                currentId = upperMember.referrer?.id;
                continue;
            }

            // 해당 상위가 롤업인지 확인
            if (results[currentId] && results[currentId].isRolledUp) {
                currentId = upperMember.referrer?.id;
                continue;
            }

            // 롤업 안된 상위 직급자 발견 - 전액 지급
            const upperRate = INCENTIVE_RATES[upperMember.rank] || 0;
            const incentiveAmount = Math.round(rolledUpPV * upperRate);

            if (results[currentId]) {
                results[currentId].differentialIncentives.push({
                    fromMemberId: memberId,
                    type: 'rollup',
                    pv: rolledUpPV,
                    rate: upperRate,
                    amount: incentiveAmount
                });
            }

            // 이 상위 직급자보다 더 상위에게도 차등 지급
            this.distributeDifferentialToUpperRanks(
                currentId,
                upperMember.rank,
                rolledUpPV,
                memberId,
                results
            );

            break;
        }
    }

    /**
     * 차등 인센티브를 상위 직급자들에게 순차 분배
     */
    distributeDifferentialIncentives(memberId, memberRank, generatedPV, results) {
        // 본인보다 상위 직급자들에게 차등 인센티브 지급
        this.distributeDifferentialToUpperRanks(memberId, memberRank, generatedPV, memberId, results);
    }

    /**
     * 상위 직급자들에게 차등 인센티브 분배 (재귀적)
     */
    distributeDifferentialToUpperRanks(startMemberId, startRank, pv, originMemberId, results) {
        const members = this.getCachedMembers();
        const startMember = members.find(m => m.id === startMemberId);
        if (!startMember) return;

        let currentId = startMember.referrer?.id;
        let prevRank = startRank;

        while (currentId) {
            const upperMember = members.find(m => m.id === currentId);
            if (!upperMember) break;

            // 다이아몬드 이상인지 확인
            if (!this.isRankAtLeast(upperMember.rank, RANKS.DIAMOND)) {
                currentId = upperMember.referrer?.id;
                continue;
            }

            // 상위가 롤업된 경우 건너뛰기
            if (results[currentId] && results[currentId].isRolledUp) {
                currentId = upperMember.referrer?.id;
                continue;
            }

            // 차등률 계산 (상위 비율 - 이전 비율)
            const upperRate = INCENTIVE_RATES[upperMember.rank] || 0;
            const prevRate = INCENTIVE_RATES[prevRank] || 0;
            const diffRate = upperRate - prevRate;

            if (diffRate > 0 && results[currentId]) {
                const diffAmount = Math.round(pv * diffRate);
                results[currentId].differentialIncentives.push({
                    fromMemberId: originMemberId,
                    type: 'differential',
                    pv: pv,
                    rate: diffRate,
                    prevRank: prevRank,
                    amount: diffAmount
                });
            }

            // 다음 상위로 이동
            prevRank = upperMember.rank;
            currentId = upperMember.referrer?.id;
        }
    }

    /**
     * 월마감 전체 육성보너스 계산 (새로운 로직)
     *
     * 육성보너스 규칙:
     * 1. 직추천 라인의 첫 다이아+ 본인 인센티브 × 20%
     * 2. 해당 라인에서 중간 직급자가 받은 차등 인센티브 × 20% (추가!)
     *
     * @param {Object} incentiveResults - calculateAllIncentives의 결과
     */
    calculateAllNurturingBonuses(incentiveResults) {
        const members = this.getCachedMembers();
        const nurturingResults = {};

        // 초기화
        for (const memberId in incentiveResults) {
            nurturingResults[memberId] = {
                memberId,
                nurturingBonusDetails: [],
                totalNurturingBonus: 0
            };
        }

        // 각 다이아몬드+ 회원에 대해 육성보너스 계산
        for (const memberId in incentiveResults) {
            const memberResult = incentiveResults[memberId];

            // 롤업된 회원은 육성보너스 없음
            if (memberResult.isRolledUp) continue;

            // 본인 인센티브가 없으면 육성보너스도 없음
            if (memberResult.totalIncentive <= 0) continue;

            const member = members.find(m => m.id === memberId);
            if (!member) continue;

            // 직추천 회원들 조회
            const directReferrals = members.filter(m => m.referrer?.id === memberId);

            for (const referral of directReferrals) {
                // 해당 라인에서 육성보너스 대상 계산
                const lineNurturing = this.calculateLineNurturingBonus(
                    memberId,
                    member.rank,
                    referral.id,
                    incentiveResults
                );

                if (lineNurturing.totalBonus > 0) {
                    nurturingResults[memberId].nurturingBonusDetails.push({
                        lineStartId: referral.id,
                        ...lineNurturing
                    });
                    nurturingResults[memberId].totalNurturingBonus += lineNurturing.totalBonus;
                }
            }
        }

        return nurturingResults;
    }

    /**
     * 특정 라인에서 발생하는 육성보너스 계산
     */
    calculateLineNurturingBonus(sponsorId, sponsorRank, lineStartId, incentiveResults) {
        const members = this.getCachedMembers();

        // 라인에서 첫 다이아+ 찾기 (롤업 안된 회원)
        const firstDiamond = this.findFirstActiveDiamondInLine(lineStartId, incentiveResults);

        if (!firstDiamond) {
            return { totalBonus: 0, details: [] };
        }

        const details = [];
        let totalBonus = 0;

        // 1. 첫 다이아+ 본인 인센티브의 20%
        const firstDiamondResult = incentiveResults[firstDiamond.id];
        if (firstDiamondResult && firstDiamondResult.baseIncentive > 0) {
            const bonus = Math.round(firstDiamondResult.baseIncentive * 0.20);
            details.push({
                type: 'base_incentive',
                fromMemberId: firstDiamond.id,
                baseAmount: firstDiamondResult.baseIncentive,
                bonus
            });
            totalBonus += bonus;
        }

        // 2. 해당 라인의 중간 직급자들이 받은 차등 인센티브의 20%
        //    (본인보다 직급이 낮고, 해당 라인에 속하는 회원들이 받은 차등)
        const lineMembers = this.getAllDownlineIds(lineStartId);
        lineMembers.unshift(lineStartId);

        for (const lineMemberId of lineMembers) {
            const lineMemberResult = incentiveResults[lineMemberId];
            if (!lineMemberResult) continue;

            // 해당 회원이 받은 차등 인센티브 중, 본인보다 직급이 낮은 회원으로부터 받은 것
            for (const diff of lineMemberResult.differentialIncentives) {
                // 차등 인센티브를 받은 회원이 이 라인에 속하고,
                // 스폰서(본인)보다 직급이 낮은 경우만 해당
                const lineMember = members.find(m => m.id === lineMemberId);
                if (!lineMember) continue;

                // 스폰서보다 직급이 낮은 회원이 받은 차등만 육성보너스 대상
                if (this.compareRanks(lineMember.rank, sponsorRank) < 0) {
                    const bonus = Math.round(diff.amount * 0.20);
                    if (bonus > 0) {
                        details.push({
                            type: 'differential_incentive',
                            fromMemberId: lineMemberId,
                            originalFrom: diff.fromMemberId,
                            diffAmount: diff.amount,
                            bonus
                        });
                        totalBonus += bonus;
                    }
                }
            }
        }

        return { totalBonus, details, firstDiamondId: firstDiamond.id };
    }

    /**
     * 라인에서 첫 번째 활성(롤업 안된) 다이아몬드+ 회원 찾기
     */
    findFirstActiveDiamondInLine(startMemberId, incentiveResults) {
        const members = this.getCachedMembers();
        const queue = [startMemberId];
        const visited = new Set();

        while (queue.length > 0) {
            const currentId = queue.shift();
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const member = members.find(m => m.id === currentId);
            if (member && this.isRankAtLeast(member.rank, RANKS.DIAMOND)) {
                // 롤업 안된 회원인지 확인
                const result = incentiveResults[currentId];
                if (result && !result.isRolledUp && result.totalIncentive > 0) {
                    return member;
                }
            }

            // 다음 하선 추가
            const directReferrals = members.filter(m => m.referrer?.id === currentId);
            directReferrals.forEach(r => queue.push(r.id));
        }

        return null;
    }

    /**
     * 라인에서 첫 번째 다이아몬드+ 회원 찾기 (기존 호환용)
     */
    findFirstDiamondInLine(startMemberId) {
        const members = this.getCachedMembers();
        const queue = [startMemberId];
        const visited = new Set();

        while (queue.length > 0) {
            const currentId = queue.shift();
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const member = members.find(m => m.id === currentId);
            if (member && this.isRankAtLeast(member.rank, RANKS.DIAMOND)) {
                return member;
            }

            // 다음 하선 추가
            const directReferrals = members.filter(m => m.referrer?.id === currentId);
            directReferrals.forEach(r => queue.push(r.id));
        }

        return null;
    }

    // ==================== 기존 호환 함수 (deprecated) ====================

    /**
     * @deprecated 새로운 calculateAllIncentives 사용 권장
     */
    calculateIncentive(memberId, memberRank, startDate, endDate) {
        // 기존 호환성을 위해 유지
        if (!this.isRankAtLeast(memberRank, RANKS.DIAMOND)) {
            return { incentive: 0, rollupTo: null, differentialIncentive: 0 };
        }
        const rollupCheck = this.checkRollupCondition(memberId, memberRank, startDate, endDate);
        if (rollupCheck.isRolledUp) {
            const members = this.getCachedMembers();
            const member = members.find(m => m.id === memberId);
            return { incentive: 0, rollupTo: member?.referrer?.id, totalPV: rollupCheck.totalDownlinePV, differentialIncentive: 0 };
        }
        const myRate = INCENTIVE_RATES[memberRank] || 0;
        const incentive = Math.floor(rollupCheck.totalDownlinePV * myRate);
        return { incentive, rollupTo: null, totalPV: rollupCheck.totalDownlinePV, differentialIncentive: 0 };
    }

    /**
     * @deprecated 새로운 calculateAllNurturingBonuses 사용 권장
     */
    calculateNurturingBonus(memberId, memberRank, settlementDetails) {
        if (!this.isRankAtLeast(memberRank, RANKS.DIAMOND)) return 0;
        const myDetail = settlementDetails.find(d => d.member_id === memberId);
        if (!myDetail || myDetail.incentive <= 0) return 0;

        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);
        let totalNurturingBonus = 0;

        for (const referral of directReferrals) {
            const firstDiamond = this.findFirstDiamondInLine(referral.id);
            if (firstDiamond) {
                const detail = settlementDetails.find(d => d.member_id === firstDiamond.id);
                if (detail && detail.incentive > 0) {
                    totalNurturingBonus += Math.floor(detail.incentive * 0.20);
                }
            }
        }
        return totalNurturingBonus;
    }

    /**
     * 크라운다이아 보너스 계산 (월마감)
     * 대상: 크라운다이아몬드
     * 재원: 당월 전체 매출 PV의 1%
     * 지급: 크라운다이아 인원수로 1/N 분배
     */
    calculateCrownBonus(startDate, endDate) {
        const members = this.getCachedMembers();
        const crownMembers = members.filter(m => m.rank === RANKS.CROWN_DIAMOND);

        if (crownMembers.length === 0) return [];

        // 당월 전체 매출 PV 계산
        const orders = this.getCachedOrders();
        let totalMonthPV = 0;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        orders.forEach(order => {
            if (order.status === 'cancelled') return;
            const orderDate = new Date(order.orderDate);
            if (orderDate >= start && orderDate <= end) {
                totalMonthPV += order.totalPV || 0;
            }
        });

        // 1% 풀을 N으로 분배
        const bonusPool = Math.floor(totalMonthPV * 0.01);
        const bonusPerMember = Math.floor(bonusPool / crownMembers.length);

        return crownMembers.map(m => ({
            memberId: m.id,
            bonus: bonusPerMember
        }));
    }

    // ==================== 마감 실행 ====================

    /**
     * 주마감 실행 (추천 보너스 + 승급) - 승인 대기 상태로 저장
     * 실제 승급/포인트 지급은 approveSettlement()에서 처리
     */
    async executeWeeklySettlement(periodStart, periodEnd) {
        // 캐시 초기화 (한 번만 데이터 로드)
        await this.initCache();

        const settlementId = this.generateId('WST');
        const members = this.getCachedMembers();
        const orders = this.getCachedOrders();

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 59, 999);

        const details = [];
        let totalPV = 0;
        let totalReferralBonus = 0;
        let membersPromoted = 0;

        // 전체 PV 계산
        orders.forEach(order => {
            if (order.status === 'cancelled') return;
            const orderDate = new Date(order.orderDate);
            if (orderDate >= start && orderDate <= end) {
                totalPV += order.totalPV || 0;
            }
        });

        // 각 회원 처리
        const processableMembers = members.filter(m => m.id !== 'ADMIN' && m.rank !== 'admin');

        for (const member of processableMembers) {
            try {
                // 모든 PV 계산은 이제 동기 함수 (캐시 사용)
                const personalPV = this.getMemberPVInPeriod(member.id, periodStart, periodEnd);
                const cumulativePV = this.getMemberCumulativePV(member.id);
                const directRefPV = this.getDirectReferralPVInPeriod(member.id, periodStart, periodEnd);

                // 승급 평가 (동기) - 먼저 승급 여부를 판단
                const currentRank = member.rank || RANKS.GENERAL;
                const newRank = this.evaluateNewRank(member.id, currentRank, periodStart, periodEnd);
                const promoted = newRank !== currentRank;
                if (promoted) {
                    membersPromoted++;
                }

                // 추천 보너스 계산 (동기) - 승급 후 직급으로 계산
                const referralBonus = this.calculateReferralBonus(
                    member.id, newRank, periodStart, periodEnd
                );

                // 상세 기록 생성
                const detail = {
                    id: this.generateId('WSD'),
                    settlement_id: settlementId,
                    member_id: member.id,
                    rank_before: currentRank,
                    rank_after: newRank,
                    personal_pv: personalPV,
                    cumulative_pv: cumulativePV,
                    direct_referral_pv: directRefPV,
                    referral_bonus: referralBonus,
                    incentive: 0,
                    nurturing_bonus: 0,
                    crown_bonus: 0,
                    total_bonus: referralBonus,
                    created_at: new Date().toISOString()
                };

                details.push(detail);
                totalReferralBonus += referralBonus;

                // 캐시 업데이트 (다른 회원의 블루다이아몬드 등 승급 조건 체크에 필요)
                // 실제 DB 업데이트는 승인 시 처리
                if (promoted) {
                    const cachedMember = this._cachedMembers.find(m => m.id === member.id);
                    if (cachedMember) {
                        cachedMember.rank = newRank;
                    }
                }

                // 승인 대기 상태이므로 포인트 지급하지 않음
            } catch (error) {
                console.error(`[Settlement] 회원 처리 오류 (${member.name || member.id}):`, error);
            }
        }

        // 캐시 클리어
        this.clearCache();

        // 마감 이력 저장 (승인 대기 상태)
        const settlement = {
            id: settlementId,
            type: 'weekly',
            period_start: periodStart,
            period_end: periodEnd,
            status: 'pending',  // 승인 대기 상태
            total_pv: totalPV,
            total_bonus: totalReferralBonus,
            total_referral_bonus: totalReferralBonus,
            total_incentive: 0,
            total_nurturing_bonus: 0,
            total_crown_bonus: 0,
            members_processed: details.length,
            members_promoted: membersPromoted,
            created_at: new Date().toISOString()
        };

        await this.saveSettlement(settlement);
        await this.saveSettlementDetails(details);

        return { settlement, details };
    }

    /**
     * 월마감 실행 (인센티브 + 육성보너스 + 크라운보너스) - 승인 대기 상태로 저장
     * 실제 포인트 지급은 approveSettlement()에서 처리
     *
     * 새로운 계산 로직 사용:
     * - calculateAllIncentives: 모든 회원의 인센티브 + 차등 인센티브 계산
     * - calculateAllNurturingBonuses: 육성보너스 계산 (차등 인센티브의 20% 포함)
     */
    async executeMonthlySettlement(periodStart, periodEnd) {
        // 캐시 초기화 (한 번만 데이터 로드)
        await this.initCache();

        const settlementId = this.generateId('MST');
        const members = this.getCachedMembers();
        const orders = this.getCachedOrders();

        const details = [];
        let totalPV = 0;
        let totalIncentive = 0;
        let totalNurturingBonus = 0;
        let totalCrownBonus = 0;

        // 전체 PV 계산
        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 59, 999);

        orders.forEach(order => {
            if (order.status === 'cancelled') return;
            const orderDate = new Date(order.orderDate);
            if (orderDate >= start && orderDate <= end) {
                totalPV += order.totalPV || 0;
            }
        });

        // 처리 대상 회원
        const processableMembers = members.filter(m => m.id !== 'ADMIN' && m.rank !== 'admin');

        // ========== 새로운 계산 로직 ==========

        // 1단계: 모든 인센티브 계산 (본인 + 차등)
        console.log('[월마감] 인센티브 계산 시작...');
        const incentiveResults = this.calculateAllIncentives(periodStart, periodEnd);

        // 2단계: 육성보너스 계산
        console.log('[월마감] 육성보너스 계산 시작...');
        const nurturingResults = this.calculateAllNurturingBonuses(incentiveResults);

        // 3단계: 크라운다이아 보너스 계산
        console.log('[월마감] 크라운 보너스 계산 시작...');
        const crownBonuses = this.calculateCrownBonus(periodStart, periodEnd);
        const crownBonusMap = {};
        for (const cb of crownBonuses) {
            crownBonusMap[cb.memberId] = cb.bonus;
            totalCrownBonus += cb.bonus;
        }

        // 4단계: 모든 회원에 대해 상세 기록 생성
        for (const member of processableMembers) {
            const personalPV = this.getMemberPVInPeriod(member.id, periodStart, periodEnd);
            const cumulativePV = this.getMemberCumulativePV(member.id);
            const groupPV = this.getDownlinePVInPeriod(member.id, periodStart, periodEnd);

            // 인센티브 결과
            const incResult = incentiveResults[member.id] || {
                totalIncentive: 0,
                baseIncentive: 0,
                totalDifferentialIncentive: 0,
                isRolledUp: false,
                differentialIncentives: []
            };

            // 육성보너스 결과
            const nurResult = nurturingResults[member.id] || {
                totalNurturingBonus: 0,
                nurturingBonusDetails: []
            };

            // 크라운 보너스
            const crownBonus = crownBonusMap[member.id] || 0;

            const incentive = incResult.totalIncentive;
            const nurturingBonus = nurResult.totalNurturingBonus;
            const totalBonus = incentive + nurturingBonus + crownBonus;

            const detail = {
                id: this.generateId('MSD'),
                settlement_id: settlementId,
                member_id: member.id,
                rank_before: member.rank,
                rank_after: member.rank,
                personal_pv: personalPV,
                cumulative_pv: cumulativePV,
                group_pv: groupPV,
                referral_bonus: 0,
                incentive: incentive,
                base_incentive: incResult.baseIncentive,
                differential_incentive: incResult.totalDifferentialIncentive,
                is_rolled_up: incResult.isRolledUp,
                nurturing_bonus: nurturingBonus,
                crown_bonus: crownBonus,
                total_bonus: totalBonus,
                // 디버깅용 상세 정보
                incentive_details: incResult.differentialIncentives,
                nurturing_details: nurResult.nurturingBonusDetails,
                created_at: new Date().toISOString()
            };

            details.push(detail);
            totalIncentive += incentive;
            totalNurturingBonus += nurturingBonus;
        }

        // 디버깅 로그
        console.log('[월마감] 계산 완료');
        console.log(`  - 전체 PV: ${totalPV.toLocaleString()}`);
        console.log(`  - 총 인센티브: ${totalIncentive.toLocaleString()}`);
        console.log(`  - 총 육성보너스: ${totalNurturingBonus.toLocaleString()}`);
        console.log(`  - 총 크라운보너스: ${totalCrownBonus.toLocaleString()}`);

        // 캐시 클리어
        this.clearCache();

        // 마감 이력 저장 (승인 대기 상태)
        const settlement = {
            id: settlementId,
            type: 'monthly',
            period_start: periodStart,
            period_end: periodEnd,
            status: 'pending',  // 승인 대기 상태
            total_pv: totalPV,
            total_bonus: totalIncentive + totalNurturingBonus + totalCrownBonus,
            total_referral_bonus: 0,
            total_incentive: totalIncentive,
            total_nurturing_bonus: totalNurturingBonus,
            total_crown_bonus: totalCrownBonus,
            members_processed: details.length,
            members_promoted: 0,
            created_at: new Date().toISOString()
        };

        await this.saveSettlement(settlement);
        await this.saveSettlementDetails(details);

        return { settlement, details };
    }

    /**
     * 보너스를 포인트로 지급
     */
    async grantBonusAsPoints(memberId, amount, description, pointType = 'pPoint') {
        if (!this.dataStore || amount <= 0) return;

        const member = await this.dataStore.getMemberById(memberId);
        if (!member) return;

        const points = member.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 };
        points[pointType] = (points[pointType] || 0) + amount;

        await this.dataStore.updateMember(memberId, { points });

        // 포인트 거래 기록
        await this.dataStore.addPointTransaction({
            memberId,
            pointType,
            type: 'settlement_bonus',
            amount,
            description
        });
    }

    // ==================== 마감 승인/거부 ====================

    /**
     * 마감 승인 (실제 승급 및 포인트 지급 처리)
     * pending 상태의 마감을 approved로 변경하고 실제 처리 수행
     */
    async approveSettlement(settlementId) {
        const settlement = await this.getSettlementById(settlementId);

        if (!settlement) {
            return { error: '마감 이력을 찾을 수 없습니다.' };
        }

        if (settlement.status !== 'pending') {
            return { error: '승인 대기 상태의 마감만 승인할 수 있습니다.' };
        }

        const details = await this.getSettlementDetails(settlementId);

        // 주마감인 경우: 직급 업데이트 + 추천보너스 지급
        if (settlement.type === 'weekly') {
            for (const detail of details) {
                try {
                    // 직급 업데이트 (승급이 있는 경우)
                    if (detail.rank_before !== detail.rank_after) {
                        await this.dataStore.updateMember(detail.member_id, { rank: detail.rank_after });
                    }

                    // P포인트 지급 (추천보너스)
                    if (detail.referral_bonus > 0) {
                        await this.grantBonusAsPoints(
                            detail.member_id,
                            detail.referral_bonus,
                            `주마감 추천보너스 (${settlement.period_start} ~ ${settlement.period_end})`,
                            'pPoint'
                        );
                    }
                } catch (error) {
                    console.error(`[Settlement] 승인 처리 오류 (회원 ${detail.member_id}):`, error);
                }
            }
        }

        // 월마감인 경우: 인센티브 + 육성보너스 + 크라운보너스 지급
        if (settlement.type === 'monthly') {
            for (const detail of details) {
                try {
                    // P포인트 지급 (총 보너스)
                    if (detail.total_bonus > 0) {
                        await this.grantBonusAsPoints(
                            detail.member_id,
                            detail.total_bonus,
                            `월마감 수당 (${settlement.period_start} ~ ${settlement.period_end})`,
                            'pPoint'
                        );
                    }
                } catch (error) {
                    console.error(`[Settlement] 승인 처리 오류 (회원 ${detail.member_id}):`, error);
                }
            }
        }

        // 마감 상태 업데이트
        await this.updateSettlementStatus(settlementId, 'approved');

        // 승인 시간 기록
        const settlements = this.getSettlements();
        const index = settlements.findIndex(s => s.id === settlementId);
        if (index !== -1) {
            settlements[index].approved_at = new Date().toISOString();
            localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
        }

        return { success: true, message: '마감이 승인되었습니다. 승급 및 포인트 지급이 완료되었습니다.' };
    }

    /**
     * 마감 거부 (승급 및 포인트 지급 없이 상태만 변경)
     */
    async rejectSettlement(settlementId) {
        const settlement = await this.getSettlementById(settlementId);

        if (!settlement) {
            return { error: '마감 이력을 찾을 수 없습니다.' };
        }

        if (settlement.status !== 'pending') {
            return { error: '승인 대기 상태의 마감만 거부할 수 있습니다.' };
        }

        // 마감 상태 업데이트 (거부됨)
        await this.updateSettlementStatus(settlementId, 'rejected');

        // 거부 시간 기록
        const settlements = this.getSettlements();
        const index = settlements.findIndex(s => s.id === settlementId);
        if (index !== -1) {
            settlements[index].rejected_at = new Date().toISOString();
            localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
        }

        return { success: true, message: '마감이 거부되었습니다. 승급 및 포인트 지급이 취소되었습니다.' };
    }

    // ==================== 마감 롤백 ====================

    /**
     * 마감 롤백 (승인된 마감만 롤백 가능)
     */
    async rollbackSettlement(settlementId) {
        const settlement = await this.getSettlementById(settlementId);

        if (!settlement) {
            return { error: '마감 이력을 찾을 수 없습니다.' };
        }

        if (settlement.status === 'rolled_back') {
            return { error: '이미 롤백된 마감입니다.' };
        }

        if (settlement.status === 'pending') {
            return { error: '승인 대기 상태의 마감은 롤백할 수 없습니다. 거부를 사용해주세요.' };
        }

        if (settlement.status === 'rejected') {
            return { error: '거부된 마감은 롤백할 수 없습니다.' };
        }

        const details = await this.getSettlementDetails(settlementId);

        // 포인트 차감 (지급된 보너스 원복)
        for (const detail of details) {
            const member = await this.dataStore.getMemberById(detail.member_id);
            if (!member) continue;

            // 포인트 차감
            if (detail.total_bonus > 0) {
                const points = member.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 };
                points.pPoint = Math.max(0, (points.pPoint || 0) - detail.total_bonus);

                await this.dataStore.updateMember(detail.member_id, { points });

                // 포인트 거래 기록
                await this.dataStore.addPointTransaction({
                    memberId: detail.member_id,
                    pointType: 'pPoint',
                    type: 'settlement_rollback',
                    amount: -detail.total_bonus,
                    description: `마감 롤백 (${settlementId})`
                });
            }

            // 직급 변경 원복 (마감 이전 상태로 복원)
            if (detail.rank_before !== detail.rank_after) {
                await this.dataStore.updateMember(detail.member_id, { rank: detail.rank_before });
            }
        }

        // 마감 상태 업데이트
        await this.updateSettlementStatus(settlementId, 'rolled_back');

        return { success: true, message: '마감이 롤백되었습니다.' };
    }

    // ==================== 저장소 관리 ====================

    /**
     * 마감 이력 저장
     */
    async saveSettlement(settlement) {
        const settlements = this.getSettlements();
        settlements.unshift(settlement);
        localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
        return settlement;
    }

    /**
     * 마감 상세 저장
     */
    async saveSettlementDetails(details) {
        const allDetails = this.getAllSettlementDetails();
        allDetails.push(...details);
        localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENT_DETAILS, JSON.stringify(allDetails));
        return details;
    }

    /**
     * 모든 마감 이력 조회
     */
    getSettlements() {
        const data = localStorage.getItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS);
        return data ? JSON.parse(data) : [];
    }

    /**
     * 특정 마감 이력 조회
     */
    async getSettlementById(settlementId) {
        const settlements = this.getSettlements();
        return settlements.find(s => s.id === settlementId);
    }

    /**
     * 마감 상세 조회
     */
    async getSettlementDetails(settlementId) {
        const allDetails = this.getAllSettlementDetails();
        return allDetails.filter(d => d.settlement_id === settlementId);
    }

    /**
     * 모든 마감 상세 조회
     */
    getAllSettlementDetails() {
        const data = localStorage.getItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENT_DETAILS);
        return data ? JSON.parse(data) : [];
    }

    /**
     * 마감 상태 업데이트
     */
    async updateSettlementStatus(settlementId, status) {
        const settlements = this.getSettlements();
        const index = settlements.findIndex(s => s.id === settlementId);
        if (index !== -1) {
            settlements[index].status = status;
            if (status === 'rolled_back') {
                settlements[index].rolled_back_at = new Date().toISOString();
            }
            localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
        }
    }

    /**
     * 마감 삭제
     */
    async deleteSettlement(settlementId) {
        // 마감 상태 확인
        const settlements = this.getSettlements();
        const settlement = settlements.find(s => s.id === settlementId);

        if (settlement) {
            // pending, rejected 상태는 포인트 지급이 안 됐으므로 바로 삭제
            // approved 상태만 롤백 후 삭제
            if (settlement.status === 'approved') {
                const rollbackResult = await this.rollbackSettlement(settlementId);
                if (rollbackResult.error && rollbackResult.error !== '이미 롤백된 마감입니다.') {
                    return rollbackResult;
                }
            }
        }

        // 마감 이력 삭제
        let allSettlements = this.getSettlements();
        allSettlements = allSettlements.filter(s => s.id !== settlementId);
        localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(allSettlements));

        // 마감 상세 삭제
        let allDetails = this.getAllSettlementDetails();
        allDetails = allDetails.filter(d => d.settlement_id !== settlementId);
        localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENT_DETAILS, JSON.stringify(allDetails));

        return { success: true, message: '마감이 삭제되었습니다.' };
    }

    // ==================== 검수용 조회 ====================

    /**
     * 직추천(1레벨) 회원들의 기간별 주문 데이터 조회 (검수용)
     * @param {string} memberId - 조회 대상 회원 ID
     * @param {string} startDate - 시작일 (YYYY-MM-DD)
     * @param {string} endDate - 종료일 (YYYY-MM-DD)
     * @returns {Promise<Array>} 직추천 회원별 주문 데이터 배열
     */
    async getDirectReferralsOrderData(memberId, startDate, endDate) {
        // 캐시 초기화
        await this.initCache();

        const members = this.getCachedMembers();
        const orders = this.getCachedOrders();

        // 직추천 회원 목록 조회
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const results = [];

        for (const referral of directReferrals) {
            // 기간 내 주문 조회
            const referralOrders = orders.filter(order => {
                if (order.customer?.memberId !== referral.id) return false;
                if (order.status === 'cancelled') return false;
                const orderDate = new Date(order.orderDate);
                return orderDate >= start && orderDate <= end;
            });

            // 기간 내 주문금액 합계
            const periodOrderAmount = referralOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

            // 기간 내 주문 PV 합계
            const periodPV = referralOrders.reduce((sum, order) => sum + (order.totalPV || 0), 0);

            // 누적 PV (전체 기간)
            const cumulativePV = this.getMemberCumulativePV(referral.id);

            // 주문 건수
            const orderCount = referralOrders.length;

            results.push({
                memberId: referral.id,
                username: referral.username || '-',
                name: referral.name || '-',
                rank: referral.rank || 'general',
                periodOrderAmount,
                periodPV,
                cumulativePV,
                orderCount
            });
        }

        // 캐시 클리어
        this.clearCache();

        // PV 기준 내림차순 정렬
        return results.sort((a, b) => b.periodPV - a.periodPV);
    }

    /**
     * 회원 검색 (아이디로)
     * @param {string} username - 검색할 아이디
     * @returns {Promise<Object|null>} 회원 정보 또는 null
     */
    async findMemberByUsername(username) {
        const members = await this.dataStore.getMembers();
        return members.find(m => m.username === username) || null;
    }

    // ==================== 기간 헬퍼 ====================

    /**
     * 주간 기간 계산 (지난 주 월요일 ~ 일요일)
     */
    getLastWeekPeriod() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const lastSunday = new Date(today);
        lastSunday.setDate(today.getDate() - dayOfWeek);

        const lastMonday = new Date(lastSunday);
        lastMonday.setDate(lastSunday.getDate() - 6);

        return {
            start: this.formatDate(lastMonday),
            end: this.formatDate(lastSunday)
        };
    }

    /**
     * 월간 기간 계산 (지난 달 1일 ~ 말일)
     */
    getLastMonthPeriod() {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);

        return {
            start: this.formatDate(lastMonth),
            end: this.formatDate(lastDay)
        };
    }

    /**
     * 이번 주 기간 계산 (이번 주 월요일 ~ 오늘)
     */
    getCurrentWeekPeriod() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        return {
            start: this.formatDate(monday),
            end: this.formatDate(today)
        };
    }

    /**
     * 이번 달 기간 계산 (이번 달 1일 ~ 오늘)
     */
    getCurrentMonthPeriod() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        return {
            start: this.formatDate(firstDay),
            end: this.formatDate(today)
        };
    }
}

// 전역 인스턴스 생성
const weverseSettlement = new WeverseSettlement();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { weverseSettlement, RANKS, RANK_NAMES, RANK_ORDER };
}
