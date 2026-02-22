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
        console.log('[Settlement] 캐시 초기화 중...');
        this._cachedMembers = await this.dataStore.getMembers();
        this._cachedOrders = await this.dataStore.getOrders();
        console.log('[Settlement] 캐시 초기화 완료 - 회원:', this._cachedMembers.length, '주문:', this._cachedOrders.length);
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
     * ④ 당일 14,400PV (한방 매출)
     */
    checkDiamondPromotion(memberId, currentRank, checkDate = null) {
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
        const downlineLines = this.getDownlinePVByLine(memberId, 120, checkDate);
        const qualifiedDownlines = downlineLines.filter(l => l.pv >= 3300);
        if (qualifiedDownlines.length >= 3) {
            const totalDownlinePV = qualifiedDownlines.reduce((sum, l) => sum + l.pv, 0);
            if (totalDownlinePV >= 33000) return true;
        }

        // ④ 당일 14,400PV (한방 매출)
        const today = checkDate || this.formatDate(new Date());
        const dailyPV = this.getMemberPVInPeriod(memberId, today, today);
        if (dailyPV >= 14400) return true;

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
            // 각 라인에서 레드다이아+ 배출 확인
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

            if (linesWithRedDiamond >= 1) {
                const totalPV = qualifiedLines.reduce((sum, l) => sum + l.pv, 0);
                if (totalPV >= 3080000) return true;
            }
        }

        return false;
    }

    /**
     * 회원의 새 직급 평가 (현재 직급에서 승급 가능한 최고 직급 반환)
     */
    evaluateNewRank(memberId, currentRank, checkDate = null) {
        // 강등 없음 - 현재 직급에서 승급만 가능
        let newRank = currentRank;

        // 순서대로 승급 조건 확인
        if (currentRank === RANKS.GENERAL) {
            if (this.checkManagerPromotion(memberId)) {
                newRank = RANKS.MANAGER;
            }
        }

        if (newRank === RANKS.MANAGER) {
            if (this.checkDiamondPromotion(memberId, RANKS.MANAGER, checkDate)) {
                newRank = RANKS.DIAMOND;
            }
        }

        if (newRank === RANKS.DIAMOND) {
            if (this.checkBlueDiamondPromotion(memberId, RANKS.DIAMOND, checkDate)) {
                newRank = RANKS.BLUE_DIAMOND;
            }
        }

        if (newRank === RANKS.BLUE_DIAMOND) {
            if (this.checkRedDiamondPromotion(memberId, RANKS.BLUE_DIAMOND, checkDate)) {
                newRank = RANKS.RED_DIAMOND;
            }
        }

        if (newRank === RANKS.RED_DIAMOND) {
            if (this.checkCrownDiamondPromotion(memberId, RANKS.RED_DIAMOND, checkDate)) {
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
        if (!this.isRankAtLeast(memberRank, RANKS.MANAGER)) return 0;

        const directRefPV = this.getDirectReferralPVInPeriod(memberId, startDate, endDate);
        return Math.floor(directRefPV * 0.30);
    }

    /**
     * 인센티브 계산 (월마감) - 롤업 구조
     * 대상: 다이아몬드 이상
     * 재원: 본인 매출 제외 하선 전체 매출 PV
     * 롤업 조건: 최대실적 라인 제외, 나머지 라인 합계 기준
     */
    calculateIncentive(memberId, memberRank, startDate, endDate) {
        // 다이아몬드 이상만 대상
        if (!this.isRankAtLeast(memberRank, RANKS.DIAMOND)) {
            return { incentive: 0, rollupTo: null };
        }

        // 하선 전체 PV (본인 제외)
        const downlineIds = this.getAllDownlineIds(memberId);
        let totalDownlinePV = 0;
        for (const id of downlineIds) {
            totalDownlinePV += this.getMemberPVInPeriod(id, startDate, endDate);
        }

        // 라인별 PV 계산 (직추천 라인별)
        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

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

        // 2개 라인 이상 필요
        if (linesPV.length < 2) {
            return { incentive: 0, rollupTo: memberId, totalPV: totalDownlinePV };
        }

        // 최대 실적 라인 제외한 합계
        linesPV.sort((a, b) => b.pv - a.pv);
        const pvExcludingMax = linesPV.slice(1).reduce((sum, l) => sum + l.pv, 0);

        // 롤업 조건 확인 (PV 구간별)
        const minPV = INCENTIVE_PV_THRESHOLDS[memberRank] || 0;
        if (pvExcludingMax < minPV) {
            // 롤업 - 상위 라인으로
            const member = members.find(m => m.id === memberId);
            const referrerId = member?.referrer?.id || null;
            return { incentive: 0, rollupTo: referrerId, totalPV: totalDownlinePV };
        }

        // 인센티브 계산
        const rate = INCENTIVE_RATES[memberRank] || 0;
        const incentive = Math.floor(totalDownlinePV * rate);

        return { incentive, rollupTo: null, totalPV: totalDownlinePV };
    }

    /**
     * 차등 인센티브 계산 (하선 직급에 따른 차등 지급)
     */
    calculateDifferentialRate(sponsorRank, downlineRank) {
        const sponsorRate = INCENTIVE_RATES[sponsorRank] || 0;
        const downlineRate = INCENTIVE_RATES[downlineRank] || 0;

        // 하선이 동일 직급 이상이면 차액만 지급
        if (this.isRankAtLeast(downlineRank, sponsorRank)) return 0;

        return sponsorRate - downlineRate;
    }

    /**
     * 육성보너스 계산 (월마감)
     * 대상: 다이아몬드 이상
     * 재원: 추천 산하 라인별 첫번째 다이아+가 수령하는 인센티브의 20%
     */
    calculateNurturingBonus(memberId, memberRank, settlementDetails) {
        // 다이아몬드 이상만 대상
        if (!this.isRankAtLeast(memberRank, RANKS.DIAMOND)) return 0;

        const members = this.getCachedMembers();
        const directReferrals = members.filter(m => m.referrer?.id === memberId);

        let totalNurturingBonus = 0;

        for (const referral of directReferrals) {
            // 각 라인에서 첫 번째 다이아+ 찾기
            const firstDiamond = this.findFirstDiamondInLine(referral.id);

            if (firstDiamond) {
                // 해당 회원의 인센티브 조회
                const detail = settlementDetails.find(d => d.member_id === firstDiamond.id);
                if (detail && detail.incentive > 0) {
                    totalNurturingBonus += Math.floor(detail.incentive * 0.20);
                }
            }
        }

        return totalNurturingBonus;
    }

    /**
     * 라인에서 첫 번째 다이아몬드+ 회원 찾기
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
     * 주마감 실행 (추천 보너스 + 승급)
     */
    async executeWeeklySettlement(periodStart, periodEnd) {
        console.log('[Settlement] 주마감 시작');

        // 캐시 초기화 (한 번만 데이터 로드)
        await this.initCache();

        const settlementId = this.generateId('WST');
        console.log('[Settlement] ID 생성:', settlementId);

        const members = this.getCachedMembers();
        const orders = this.getCachedOrders();

        console.log('[Settlement] 회원 수:', members.length);
        console.log('[Settlement] 주문 수:', orders.length);

        const details = [];
        let totalPV = 0;
        let totalReferralBonus = 0;
        let membersPromoted = 0;

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
        console.log('[Settlement] 기간 내 총 PV:', totalPV);

        // 각 회원 처리
        const processableMembers = members.filter(m => m.id !== 'ADMIN' && m.rank !== 'admin');
        console.log('[Settlement] 처리 대상 회원 수:', processableMembers.length);

        let memberIndex = 0;
        for (const member of processableMembers) {
            memberIndex++;

            // 10명마다 로그 출력 (성능 향상)
            if (memberIndex % 10 === 0 || memberIndex === processableMembers.length) {
                console.log(`[Settlement] 회원 처리 중 (${memberIndex}/${processableMembers.length})`);
            }

            try {
                // 모든 PV 계산은 이제 동기 함수 (캐시 사용)
                const personalPV = this.getMemberPVInPeriod(member.id, periodStart, periodEnd);
                const cumulativePV = this.getMemberCumulativePV(member.id);
                const directRefPV = this.getDirectReferralPVInPeriod(member.id, periodStart, periodEnd);

                // 추천 보너스 계산 (동기)
                const referralBonus = this.calculateReferralBonus(
                    member.id, member.rank, periodStart, periodEnd
                );

                // 승급 평가 (동기)
                const newRank = this.evaluateNewRank(member.id, member.rank, periodEnd);
                const promoted = newRank !== member.rank;
                if (promoted) membersPromoted++;

                // 상세 기록 생성
                const detail = {
                    id: this.generateId('WSD'),
                    settlement_id: settlementId,
                    member_id: member.id,
                    rank_before: member.rank,
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

                // 직급 업데이트 (비동기 - DB 저장)
                if (promoted) {
                    await this.dataStore.updateMember(member.id, { rank: newRank });
                }

                // P포인트 지급 (비동기 - DB 저장)
                if (referralBonus > 0) {
                    await this.grantBonusAsPoints(member.id, referralBonus, '주마감 추천보너스', 'pPoint');
                }
            } catch (error) {
                console.error(`[Settlement] 회원 처리 오류 (${member.name || member.id}):`, error);
            }
        }

        console.log('[Settlement] 모든 회원 처리 완료');
        console.log('[Settlement] 총 추천 보너스:', totalReferralBonus);
        console.log('[Settlement] 승급 회원 수:', membersPromoted);

        // 캐시 클리어
        this.clearCache();

        // 마감 이력 저장
        console.log('[Settlement] 마감 이력 저장 중...');
        const settlement = {
            id: settlementId,
            type: 'weekly',
            period_start: periodStart,
            period_end: periodEnd,
            status: 'completed',
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

        try {
            await this.saveSettlement(settlement);
            console.log('[Settlement] 마감 이력 저장 완료');

            console.log('[Settlement] 마감 상세 저장 중...');
            await this.saveSettlementDetails(details);
            console.log('[Settlement] 마감 상세 저장 완료');
        } catch (error) {
            console.error('[Settlement] 저장 오류:', error);
        }

        console.log('[Settlement] 주마감 완료!');
        return { settlement, details };
    }

    /**
     * 월마감 실행 (인센티브 + 육성보너스 + 크라운보너스)
     */
    async executeMonthlySettlement(periodStart, periodEnd) {
        console.log('[Settlement] 월마감 시작');

        // 캐시 초기화 (한 번만 데이터 로드)
        await this.initCache();

        const settlementId = this.generateId('MST');
        const members = this.getCachedMembers();
        const orders = this.getCachedOrders();

        console.log('[Settlement] 회원 수:', members.length);
        console.log('[Settlement] 주문 수:', orders.length);

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
        console.log('[Settlement] 기간 내 총 PV:', totalPV);

        // 처리 대상 회원
        const processableMembers = members.filter(m => m.id !== 'ADMIN' && m.rank !== 'admin');
        console.log('[Settlement] 처리 대상 회원 수:', processableMembers.length);

        // 1단계: 인센티브 계산
        console.log('[Settlement] 1단계: 인센티브 계산');
        let memberIndex = 0;
        for (const member of processableMembers) {
            memberIndex++;
            if (memberIndex % 10 === 0 || memberIndex === processableMembers.length) {
                console.log(`[Settlement] 인센티브 계산 중 (${memberIndex}/${processableMembers.length})`);
            }

            // 동기 함수 호출 (캐시 사용)
            const personalPV = this.getMemberPVInPeriod(member.id, periodStart, periodEnd);
            const cumulativePV = this.getMemberCumulativePV(member.id);
            const groupPV = this.getDownlinePVInPeriod(member.id, periodStart, periodEnd);

            // 인센티브 계산 (동기)
            const incentiveResult = this.calculateIncentive(
                member.id, member.rank, periodStart, periodEnd
            );

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
                incentive: incentiveResult.incentive,
                rollup_to: incentiveResult.rollupTo,
                nurturing_bonus: 0,
                crown_bonus: 0,
                total_bonus: incentiveResult.incentive,
                created_at: new Date().toISOString()
            };

            details.push(detail);
            totalIncentive += incentiveResult.incentive;
        }

        // 2단계: 육성보너스 계산 (인센티브 계산 후)
        console.log('[Settlement] 2단계: 육성보너스 계산');
        for (const detail of details) {
            const member = members.find(m => m.id === detail.member_id);
            if (!member) continue;

            // 동기 함수 호출
            const nurturingBonus = this.calculateNurturingBonus(
                detail.member_id, member.rank, details
            );

            detail.nurturing_bonus = nurturingBonus;
            detail.total_bonus += nurturingBonus;
            totalNurturingBonus += nurturingBonus;
        }

        // 3단계: 크라운다이아 보너스 계산
        console.log('[Settlement] 3단계: 크라운다이아 보너스 계산');
        const crownBonuses = this.calculateCrownBonus(periodStart, periodEnd);
        for (const cb of crownBonuses) {
            const detail = details.find(d => d.member_id === cb.memberId);
            if (detail) {
                detail.crown_bonus = cb.bonus;
                detail.total_bonus += cb.bonus;
                totalCrownBonus += cb.bonus;
            }
        }

        // 포인트 지급 (비동기 - DB 저장)
        console.log('[Settlement] 포인트 지급 중...');
        for (const detail of details) {
            if (detail.total_bonus > 0) {
                await this.grantBonusAsPoints(
                    detail.member_id,
                    detail.total_bonus,
                    '월마감 수당',
                    'pPoint'
                );
            }
        }

        // 캐시 클리어
        this.clearCache();

        // 마감 이력 저장
        const settlement = {
            id: settlementId,
            type: 'monthly',
            period_start: periodStart,
            period_end: periodEnd,
            status: 'completed',
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

        console.log('[Settlement] 월마감 완료!');
        console.log('[Settlement] 총 인센티브:', totalIncentive);
        console.log('[Settlement] 총 육성보너스:', totalNurturingBonus);
        console.log('[Settlement] 총 크라운보너스:', totalCrownBonus);

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

    // ==================== 마감 롤백 ====================

    /**
     * 마감 롤백
     */
    async rollbackSettlement(settlementId) {
        const settlement = await this.getSettlementById(settlementId);
        if (!settlement) {
            return { error: '마감 이력을 찾을 수 없습니다.' };
        }

        if (settlement.status === 'rolled_back') {
            return { error: '이미 롤백된 마감입니다.' };
        }

        const details = await this.getSettlementDetails(settlementId);

        // 포인트 차감 (지급된 보너스 원복)
        for (const detail of details) {
            if (detail.total_bonus > 0) {
                const member = await this.dataStore.getMemberById(detail.member_id);
                if (!member) continue;

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

            // 직급 변경 원복 (주마감의 경우) - 강등 없음 원칙에 따라 롤백하지 않음
            // 직급은 최고 도달 직급을 유지
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
        // 먼저 롤백
        const rollbackResult = await this.rollbackSettlement(settlementId);
        if (rollbackResult.error) {
            return rollbackResult;
        }

        // 마감 이력 삭제
        let settlements = this.getSettlements();
        settlements = settlements.filter(s => s.id !== settlementId);
        localStorage.setItem(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));

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
