// Supabase Edge Function: 주간 자동 마감
// 매주 월요일 00:00 (KST) 실행

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

function isRankAtLeast(rank: string, minRank: string): boolean {
  return (RANK_ORDER[rank] || 0) >= (RANK_ORDER[minRank] || 0)
}

function generateId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 지난 주 기간 계산 (월요일 ~ 일요일)
function getLastWeekPeriod(): { start: string, end: string } {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const lastSunday = new Date(today)
  lastSunday.setDate(today.getDate() - dayOfWeek)

  const lastMonday = new Date(lastSunday)
  lastMonday.setDate(lastSunday.getDate() - 6)

  return {
    start: formatDate(lastMonday),
    end: formatDate(lastSunday)
  }
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const period = getLastWeekPeriod()
    console.log(`주마감 시작: ${period.start} ~ ${period.end}`)

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

    const settlementId = generateId('WST')
    const details: any[] = []
    let totalPV = 0
    let totalReferralBonus = 0
    let membersPromoted = 0

    // 전체 PV 계산
    orders?.forEach(order => {
      totalPV += order.total_pv || 0
    })

    // 각 회원 처리
    for (const member of (members || [])) {
      // 개인 PV 계산
      const personalPV = orders
        ?.filter(o => o.customer_member_id === member.id)
        .reduce((sum, o) => sum + (o.total_pv || 0), 0) || 0

      // 직추천 회원 PV 계산
      const directReferrals = members?.filter(m => m.referrer_id === member.id) || []
      const directRefPV = directReferrals.reduce((sum, ref) => {
        return sum + (orders
          ?.filter(o => o.customer_member_id === ref.id)
          .reduce((s, o) => s + (o.total_pv || 0), 0) || 0)
      }, 0)

      // 추천 보너스 계산 (매니저 이상만)
      let referralBonus = 0
      if (isRankAtLeast(member.rank, RANKS.MANAGER)) {
        referralBonus = Math.floor(directRefPV * 0.30)
      }

      // 누적 PV (전체 주문에서 계산)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total_pv')
        .eq('customer_member_id', member.id)
        .neq('status', 'cancelled')

      const cumulativePV = allOrders?.reduce((sum, o) => sum + (o.total_pv || 0), 0) || 0

      // 승급 평가 (매니저 조건: 누적 2,200PV 이상)
      let newRank = member.rank
      if (member.rank === RANKS.GENERAL && cumulativePV >= 2200) {
        newRank = RANKS.MANAGER
        membersPromoted++

        // 직급 업데이트
        await supabase
          .from('members')
          .update({ rank: newRank })
          .eq('id', member.id)
      }

      // 상세 기록 생성
      const detail = {
        id: generateId('WSD'),
        settlement_id: settlementId,
        member_id: member.id,
        rank_before: member.rank,
        rank_after: newRank,
        personal_pv: personalPV,
        cumulative_pv: cumulativePV,
        direct_referral_pv: directRefPV,
        referral_bonus: referralBonus,
        total_bonus: referralBonus,
        created_at: new Date().toISOString()
      }

      details.push(detail)
      totalReferralBonus += referralBonus

      // P포인트 지급
      if (referralBonus > 0) {
        const currentPoints = member.points || { rPay: 0, pPoint: 0, cPoint: 0, tPoint: 0 }
        currentPoints.pPoint = (currentPoints.pPoint || 0) + referralBonus

        await supabase
          .from('members')
          .update({ points: currentPoints })
          .eq('id', member.id)

        // 포인트 거래 기록
        await supabase
          .from('point_transactions')
          .insert({
            id: generateId('PT'),
            member_id: member.id,
            point_type: 'pPoint',
            type: 'settlement_bonus',
            amount: referralBonus,
            description: '주마감 추천보너스',
            created_at: new Date().toISOString()
          })
      }
    }

    // 마감 이력 저장
    const settlement = {
      id: settlementId,
      type: 'weekly',
      period_start: period.start,
      period_end: period.end,
      status: 'completed',
      total_pv: totalPV,
      total_bonus: totalReferralBonus,
      total_referral_bonus: totalReferralBonus,
      members_processed: details.length,
      members_promoted: membersPromoted,
      created_at: new Date().toISOString()
    }

    await supabase.from('settlements').insert(settlement)
    await supabase.from('settlement_details').insert(details)

    console.log(`주마감 완료: 처리 ${details.length}명, 승급 ${membersPromoted}명, 보너스 $${totalReferralBonus}`)

    return new Response(
      JSON.stringify({ success: true, settlement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('주마감 오류:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
