// Supabase Edge Function: 월간 자동 마감
// 매월 1일 00:00 (KST) 실행

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 직급 상수
const RANKS = {
  GENERAL: 'general',
  MANAGER: 'manager',
  DIAMOND: 'diamond',
  BLUE_DIAMOND: 'blue_diamond',
  RED_DIAMOND: 'red_diamond',
  CROWN_DIAMOND: 'crown_diamond'
}

const RANK_ORDER: Record<string, number> = {
  [RANKS.GENERAL]: 0,
  [RANKS.MANAGER]: 1,
  [RANKS.DIAMOND]: 2,
  [RANKS.BLUE_DIAMOND]: 3,
  [RANKS.RED_DIAMOND]: 4,
  [RANKS.CROWN_DIAMOND]: 5
}

const INCENTIVE_RATES: Record<string, number> = {
  [RANKS.DIAMOND]: 0.10,
  [RANKS.BLUE_DIAMOND]: 0.17,
  [RANKS.RED_DIAMOND]: 0.21,
  [RANKS.CROWN_DIAMOND]: 0.23
}

function isRankAtLeast(rank: string, minRank: string): boolean {
  return (RANK_ORDER[rank] || 0) >= (RANK_ORDER[minRank] || 0)
}

function generateId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 지난 달 기간 계산 (1일 ~ 말일)
function getLastMonthPeriod(): { start: string, end: string } {
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)

  return {
    start: formatDate(lastMonth),
    end: formatDate(lastDay)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const period = getLastMonthPeriod()
    console.log(`월마감 시작: ${period.start} ~ ${period.end}`)

    // 회원 조회
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .neq('id', 'ADMIN')
      .neq('rank', 'admin')

    if (membersError) throw membersError

    // 주문 조회
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'cancelled')
      .gte('order_date', period.start)
      .lte('order_date', period.end)

    if (ordersError) throw ordersError

    const settlementId = generateId('MST')
    const details: any[] = []
    let totalPV = 0
    let totalIncentive = 0
    let totalNurturingBonus = 0
    let totalCrownBonus = 0

    // 전체 PV 계산
    orders?.forEach(order => {
      totalPV += order.total_pv || 0
    })

    // 하선 ID 조회 함수
    function getAllDownlineIds(memberId: string, visited = new Set<string>()): string[] {
      if (visited.has(memberId)) return []
      visited.add(memberId)

      const directReferrals = members?.filter(m => m.referrer_id === memberId) || []
      const downlineIds: string[] = []

      for (const ref of directReferrals) {
        downlineIds.push(ref.id)
        downlineIds.push(...getAllDownlineIds(ref.id, visited))
      }

      return downlineIds
    }

    // 회원별 PV 계산 함수
    function getMemberPV(memberId: string): number {
      return orders
        ?.filter(o => o.customer_member_id === memberId)
        .reduce((sum, o) => sum + (o.total_pv || 0), 0) || 0
    }

    // 1단계: 인센티브 계산
    for (const member of (members || [])) {
      const personalPV = getMemberPV(member.id)

      // 하선 PV 계산
      const downlineIds = getAllDownlineIds(member.id)
      const groupPV = downlineIds.reduce((sum, id) => sum + getMemberPV(id), 0)

      // 인센티브 계산 (다이아몬드 이상만)
      let incentive = 0
      if (isRankAtLeast(member.rank, RANKS.DIAMOND)) {
        const rate = INCENTIVE_RATES[member.rank] || 0
        incentive = Math.floor(groupPV * rate)
      }

      const detail = {
        id: generateId('MSD'),
        settlement_id: settlementId,
        member_id: member.id,
        rank_before: member.rank,
        rank_after: member.rank,
        personal_pv: personalPV,
        group_pv: groupPV,
        incentive: incentive,
        nurturing_bonus: 0,
        crown_bonus: 0,
        total_bonus: incentive,
        created_at: new Date().toISOString()
      }

      details.push(detail)
      totalIncentive += incentive
    }

    // 2단계: 육성보너스 (직추천 라인의 첫 다이아+ 인센티브의 20%)
    for (const detail of details) {
      const member = members?.find(m => m.id === detail.member_id)
      if (!member || !isRankAtLeast(member.rank, RANKS.DIAMOND)) continue

      const directReferrals = members?.filter(m => m.referrer_id === member.id) || []

      let nurturingBonus = 0
      for (const ref of directReferrals) {
        // 라인에서 첫 다이아+ 찾기
        const lineMembers = [ref.id, ...getAllDownlineIds(ref.id)]
        const firstDiamond = lineMembers.find(id => {
          const m = members?.find(mem => mem.id === id)
          return m && isRankAtLeast(m.rank, RANKS.DIAMOND)
        })

        if (firstDiamond) {
          const diamondDetail = details.find(d => d.member_id === firstDiamond)
          if (diamondDetail && diamondDetail.incentive > 0) {
            nurturingBonus += Math.floor(diamondDetail.incentive * 0.20)
          }
        }
      }

      detail.nurturing_bonus = nurturingBonus
      detail.total_bonus += nurturingBonus
      totalNurturingBonus += nurturingBonus
    }

    // 3단계: 크라운다이아 보너스 (전체 PV의 1% / N)
    const crownMembers = members?.filter(m => m.rank === RANKS.CROWN_DIAMOND) || []
    if (crownMembers.length > 0) {
      const bonusPool = Math.floor(totalPV * 0.01)
      const bonusPerMember = Math.floor(bonusPool / crownMembers.length)

      for (const crown of crownMembers) {
        const detail = details.find(d => d.member_id === crown.id)
        if (detail) {
          detail.crown_bonus = bonusPerMember
          detail.total_bonus += bonusPerMember
          totalCrownBonus += bonusPerMember
        }
      }
    }

    // 포인트 지급
    for (const detail of details) {
      if (detail.total_bonus > 0) {
        const member = members?.find(m => m.id === detail.member_id)
        if (member) {
          const currentPoints = member.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 }
          currentPoints.pPoint = (currentPoints.pPoint || 0) + detail.total_bonus

          await supabase
            .from('members')
            .update({ points: currentPoints })
            .eq('id', member.id)

          await supabase
            .from('point_transactions')
            .insert({
              id: generateId('PT'),
              member_id: member.id,
              point_type: 'pPoint',
              type: 'settlement_bonus',
              amount: detail.total_bonus,
              description: '월마감 수당',
              created_at: new Date().toISOString()
            })
        }
      }
    }

    // 마감 이력 저장
    const settlement = {
      id: settlementId,
      type: 'monthly',
      period_start: period.start,
      period_end: period.end,
      status: 'completed',
      total_pv: totalPV,
      total_bonus: totalIncentive + totalNurturingBonus + totalCrownBonus,
      total_incentive: totalIncentive,
      total_nurturing_bonus: totalNurturingBonus,
      total_crown_bonus: totalCrownBonus,
      members_processed: details.length,
      created_at: new Date().toISOString()
    }

    await supabase.from('settlements').insert(settlement)
    await supabase.from('settlement_details').insert(details)

    console.log(`월마감 완료: 처리 ${details.length}명, 인센티브 $${totalIncentive}`)

    return new Response(
      JSON.stringify({ success: true, settlement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('월마감 오류:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
