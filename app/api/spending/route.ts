import { type NextRequest, NextResponse } from "next/server"
import { addSpending, getSpendingsByFamilyCodes, deleteSpending } from "@/lib/db"

// 보안 유틸리티 함수들
function validateFamilyCode(code: string): boolean {
  return /^[0-9]{6}$/.test(code)
}

function validateId(id: string): boolean {
  return /^[0-9]+$/.test(id)
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '')
}

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

    // 여러 패밀리코드 처리 및 보안 검증
    let targetFamilyCodes: string[] = []
    if (familyCodes) {
      // 쉼표로 구분된 여러 패밀리코드
      targetFamilyCodes = familyCodes.split(',').map(code => sanitizeInput(code.trim())).filter(code => code && validateFamilyCode(code))
    } else if (familyCode) {
      // 단일 패밀리코드
      const sanitizedCode = sanitizeInput(familyCode)
      if (validateFamilyCode(sanitizedCode)) {
        targetFamilyCodes = [sanitizedCode]
      }
    }

    // 유효한 가족코드가 없으면 에러
    if (targetFamilyCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 가족코드입니다" },
        { status: 400 },
      )
    }

    console.log("[v0] 지출 목록 조회 요청:", { targetFamilyCodes })

    try {
      const familySpendings = await getSpendingsByFamilyCodes(targetFamilyCodes)
      console.log("[v0] 지출 목록 조회 성공:", familySpendings.length, "개")

      return NextResponse.json({
        success: true,
        data: familySpendings,
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
    console.error("[v0] 지출 목록 조회 에러:", error)
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

    console.log("[v0] 지출 저장 요청:", { amount, category, memo, userName, familyCode, date })
    console.log("[v0] 받은 날짜 값:", date, "타입:", typeof date)
    console.log("[v0] 전체 요청 데이터:", JSON.stringify(requestData, null, 2))

    if (!amount || !category || !userName || !familyCode) {
      return NextResponse.json(
        { success: false, error: "필수 정보가 누락되었습니다" },
        { status: 400 },
      )
    }

    try {
      const spending = await addSpending({
        amount,
        category,
        memo,
        userName,
        familyCode,
        date,
      })

      console.log("[v0] 지출 저장 성공:", spending)

      return NextResponse.json({
        success: true,
        data: spending,
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
    console.error("[v0] 지출 저장 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || !validateId(id)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 지출 ID입니다" },
        { status: 400 },
      )
    }

    console.log("[v0] 지출 삭제 요청:", { id })

    try {
      console.log("[v0] 삭제 시작 - ID:", id)
      await deleteSpending(id)

      console.log("[v0] 지출 삭제 성공:", id)

      return NextResponse.json({
        success: true,
        message: "지출이 삭제되었습니다",
      })
    } catch (dbError) {
      console.error("[v0] 데이터베이스 에러:", dbError)
      console.error("[v0] 에러 스택:", dbError instanceof Error ? dbError.stack : 'No stack trace')
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
    console.error("[v0] 지출 삭제 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

