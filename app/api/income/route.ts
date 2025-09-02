import { type NextRequest, NextResponse } from "next/server"
import { addIncome, getIncomesByFamilyCodes, deleteIncome } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const familyCode = searchParams.get('familyCode')
    const familyCodes = searchParams.get('familyCodes')

    // familyCode 또는 familyCodes 중 하나는 필요
    if (!familyCode && !familyCodes) {
      return NextResponse.json(
        { success: false, error: "가족코드가 필요합니다" },
        { status: 400 },
      )
    }

    // 여러 패밀리코드 처리
    let targetFamilyCodes: string[] = []
    if (familyCodes) {
      // 쉼표로 구분된 여러 패밀리코드
      targetFamilyCodes = familyCodes.split(',').map(code => code.trim()).filter(code => code)
    } else if (familyCode) {
      // 단일 패밀리코드
      targetFamilyCodes = [familyCode]
    }

    console.log("[v0] 수입 목록 조회 요청:", { targetFamilyCodes })

    try {
      const familyIncomes = await getIncomesByFamilyCodes(targetFamilyCodes)
      console.log("[v0] 수입 목록 조회 성공:", familyIncomes.length, "개")

      return NextResponse.json({
        success: true,
        data: familyIncomes,
      })
    } catch (dbError) {
      console.error("[v0] 데이터베이스 에러:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : '알 수 없는 오류'
      return NextResponse.json(
        {
          success: false,
          error: `데이터베이스 오류: ${errorMessage}`,
          details: process.env.NODE_ENV === 'development' ? dbError : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] 수입 목록 조회 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let requestData
    try {
      requestData = await request.json()
    } catch (jsonError) {
      console.error("[v0] JSON 파싱 에러:", jsonError)
      return NextResponse.json(
        {
          success: false,
          error: "잘못된 요청 형식입니다",
        },
        { status: 400 },
      )
    }

    const { amount, category, memo, userName, familyCode, date } = requestData

    console.log("[v0] 수입 저장 요청:", { amount, category, memo, userName, familyCode, date })

    if (!amount || !category || !userName || !familyCode) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다" },
        { status: 400 },
      )
    }

    try {
      const income = await addIncome({
        amount,
        category,
        memo,
        userName,
        familyCode,
        date,
      })

      console.log("[v0] 수입 저장 성공:", income)

      return NextResponse.json({
        success: true,
        data: income,
      })
    } catch (dbError) {
      console.error("[v0] 데이터베이스 에러:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : '알 수 없는 오류'
      return NextResponse.json(
        {
          success: false,
          error: `데이터베이스 오류: ${errorMessage}`,
          details: process.env.NODE_ENV === 'development' ? dbError : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] 수입 저장 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: "삭제할 수입 ID가 필요합니다" },
        { status: 400 },
      )
    }

    console.log("[v0] 수입 삭제 요청:", { id })

    try {
      await deleteIncome(id)

      console.log("[v0] 수입 삭제 성공:", id)

      return NextResponse.json({
        success: true,
        message: "수입이 삭제되었습니다",
      })
    } catch (dbError) {
      console.error("[v0] 데이터베이스 에러:", dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : '알 수 없는 오류'
      return NextResponse.json(
        {
          success: false,
          error: `데이터베이스 오류: ${errorMessage}`,
          details: process.env.NODE_ENV === 'development' ? dbError : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] 수입 삭제 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
