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

    if (!amount || !category || !userName || !familyCode || !dayOfMonth) {
      return NextResponse.json({ success: false, error: "필수 필드가 누락되었습니다." })
    }

    try {
      let family = await findFamily(familyCode)
      if (!family) {
        console.log("[v0] 가족이 존재하지 않아 새로 생성:", familyCode)
        family = await createFamily(familyCode, userName)
      }
    } catch (familyError) {
      console.error("[v0] 가족 확인/생성 에러:", familyError)
      return NextResponse.json({ success: false, error: "가족 정보 처리 중 오류가 발생했습니다." })
    }

    const recurringSpending = await addRecurringSpending({
      amount: Number(amount),
      category,
      memo,
      userName,
      familyCode,
      dayOfMonth: Number(dayOfMonth),
      isActive: true,
    })

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

    const allData = await getRecurringSpending()
    const familyData = allData.filter((item) => item.familyCode === familyCode && item.isActive)

    return NextResponse.json({ success: true, data: familyData })
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
