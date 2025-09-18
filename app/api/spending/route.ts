import { type NextRequest, NextResponse } from "next/server"
import { addSpending, getSpendingsByFamilyCodes, deleteSpending } from "@/lib/db"
import { 
  validateFamilyCode, 
  validateUserName, 
  validateAmount, 
  validateDate, 
  validateCategory, 
  validateMemo,
  validateId,
  sanitizeString,
  rateLimiter,
  getClientIP,
  sanitizeLogData,
  CATEGORIES
} from "@/lib/security"

export async function GET(request: NextRequest) {
  try {
    // Rate Limiting 체크
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      )
    }

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
      // 쉼표로 구분된 여러 패밀리코드 (최대 5개로 제한)
      const codes = familyCodes.split(',').slice(0, 5)
      targetFamilyCodes = codes
        .map(code => sanitizeString(code.trim()))
        .filter(code => code && validateFamilyCode(code))
    } else if (familyCode) {
      // 단일 패밀리코드
      const sanitizedCode = sanitizeString(familyCode)
      if (validateFamilyCode(sanitizedCode)) {
        targetFamilyCodes = [sanitizedCode]
      }
    }

    // 유효한 가족코드가 없으면 에러
    if (targetFamilyCodes.length === 0) {
      console.warn(`[SECURITY] Invalid family codes from IP: ${clientIP}`)
      return NextResponse.json(
        { success: false, error: "유효하지 않은 가족코드입니다" },
        { status: 400 },
      )
    }

    console.log("[v0] 지출 목록 조회 요청:", sanitizeLogData({ targetFamilyCodes, clientIP }))

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
    // Rate Limiting 체크
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      )
    }

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

    const { amount, category, memo, userName, familyCode, date, paymentMethod } = requestData
    
    // paymentMethod 기본값 설정
    const safePaymentMethod = (paymentMethod && typeof paymentMethod === 'string') ? paymentMethod : "card"

    // 입력값 검증
    if (!validateAmount(amount)) {
      console.warn(`[SECURITY] Invalid amount from IP: ${clientIP}`, { amount })
      return NextResponse.json(
        { success: false, error: "유효하지 않은 금액입니다" },
        { status: 400 },
      )
    }

    if (!validateCategory(category, CATEGORIES)) {
      console.warn(`[SECURITY] Invalid category from IP: ${clientIP}`, { category })
      return NextResponse.json(
        { success: false, error: "유효하지 않은 카테고리입니다" },
        { status: 400 },
      )
    }

    if (!validateUserName(userName)) {
      console.warn(`[SECURITY] Invalid username from IP: ${clientIP}`, { userName })
      return NextResponse.json(
        { success: false, error: "유효하지 않은 사용자 이름입니다" },
        { status: 400 },
      )
    }

    if (!validateFamilyCode(familyCode)) {
      console.warn(`[SECURITY] Invalid family code from IP: ${clientIP}`, { familyCode })
      return NextResponse.json(
        { success: false, error: "유효하지 않은 가족코드입니다" },
        { status: 400 },
      )
    }

    if (memo && !validateMemo(memo)) {
      console.warn(`[SECURITY] Invalid memo from IP: ${clientIP}`, { memo })
      return NextResponse.json(
        { success: false, error: "메모는 200자 이하여야 합니다" },
        { status: 400 },
      )
    }

    if (date && !validateDate(date)) {
      console.warn(`[SECURITY] Invalid date from IP: ${clientIP}`, { date })
      return NextResponse.json(
        { success: false, error: "유효하지 않은 날짜입니다" },
        { status: 400 },
      )
    }

    console.log("[v0] 지출 저장 요청:", sanitizeLogData({ amount, category, userName, familyCode, clientIP }))

    try {
      const spending = await addSpending({
        amount,
        category: sanitizeString(category),
        memo: memo ? sanitizeString(memo) : undefined,
        userName: sanitizeString(userName),
        familyCode: sanitizeString(familyCode),
        date,
        paymentMethod: safePaymentMethod,
      })

      console.log("[v0] 지출 저장 성공:", sanitizeLogData({ id: spending.id, amount: spending.amount, clientIP }))

      return NextResponse.json({
        success: true,
        data: spending,
      })
    } catch (dbError) {
      console.error("[v0] 데이터베이스 에러:", sanitizeLogData({ error: dbError, clientIP }))
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
    // Rate Limiting 체크
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || !validateId(id)) {
      console.warn(`[SECURITY] Invalid ID from IP: ${clientIP}`, { id })
      return NextResponse.json(
        { success: false, error: "유효하지 않은 지출 ID입니다" },
        { status: 400 },
      )
    }

    console.log("[v0] 지출 삭제 요청:", sanitizeLogData({ id, clientIP }))

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
