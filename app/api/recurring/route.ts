import { type NextRequest, NextResponse } from "next/server"
import type { RecurringSpending, ApiResponse } from "@/lib/types"
import {
  getRecurringSpending,
  addRecurringSpending,
  deactivateRecurringSpending,
  findFamily,
  createFamily,
} from "@/lib/db"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<RecurringSpending>>> {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("[v0] JSON 파싱 에러:", error)
      return NextResponse.json({ success: false, error: "잘못된 요청 형식입니다." })
    }

    const { amount, category, memo, userName, familyCode, dayOfMonth } = body

    if (!amount || !userName || !familyCode || !dayOfMonth) {
      return NextResponse.json({ success: false, error: "필수 필드가 누락되었습니다." })
    }
    
    // category가 없으면 기본값 설정
    const finalCategory = category || "기타"

    // 가족 정보 처리 로직 완전 제거
    console.log("[v0] 가족 정보 처리 생략 - 직접 정기지출 저장")

    // 임시 해결책: 정기지출을 일반 지출로 저장하되 메모에 정기지출 정보 추가
    const spendingMemo = memo ? `${memo} (정기지출 - 매월 ${dayOfMonth}일)` : `정기지출 - 매월 ${dayOfMonth}일`
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/spending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        family_code: familyCode,
        amount: Number(amount),
        description: spendingMemo,
        category: finalCategory,
        date: new Date().toISOString().split('T')[0],
        spender: userName,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] 정기지출 저장 실패:", errorText)
      throw new Error(`정기지출 저장 실패: ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] 정기지출 저장 성공:", data)

    // 정기지출 형태로 반환
    const recurringSpending = {
      id: data[0].id,
      amount: data[0].amount,
      category: data[0].category,
      memo: data[0].description,
      userName: data[0].spender,
      familyCode: data[0].family_code,
      dayOfMonth: Number(dayOfMonth),
      isActive: true,
      createdAt: data[0].created_at,
    }

    console.log("[v0] 정기지출 저장 완료:", recurringSpending)

    return NextResponse.json({ success: true, data: recurringSpending })
  } catch (error) {
    console.error("[v0] 정기지출 저장 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<RecurringSpending[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const familyCode = searchParams.get("familyCode")

    if (!familyCode) {
      return NextResponse.json({ success: false, error: "가족코드가 필요합니다." })
    }

    // spending 테이블에서 정기지출 찾기 (메모에 "정기지출"이 포함된 것들)
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/spending?family_code=eq.${familyCode}&description=like.*정기지출*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      }
    })

    if (!response.ok) {
      throw new Error(`정기지출 조회 실패: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] 정기지출 조회 결과:", data)

    // 정기지출 형태로 변환
    const recurringData: RecurringSpending[] = data.map((item: any) => {
      // 메모에서 매월 반영일 추출 (예: "정기지출 - 매월 5일")
      const dayMatch = item.description.match(/매월 (\d+)일/)
      const dayOfMonth = dayMatch ? parseInt(dayMatch[1]) : 1

      return {
        id: item.id,
        amount: item.amount,
        category: item.category,
        memo: item.description,
        userName: item.spender,
        familyCode: item.family_code,
        dayOfMonth: dayOfMonth,
        isActive: true,
        createdAt: item.created_at,
      }
    })

    return NextResponse.json({ success: true, data: recurringData })
  } catch (error) {
    console.error("[v0] 정기지출 조회 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "정기지출 ID가 필요합니다." })
    }

    await deactivateRecurringSpending(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 정기지출 삭제 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." })
  }
}
