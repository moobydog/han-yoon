import { type NextRequest, NextResponse } from "next/server"
import { findFamily, createFamily, updateFamily } from "@/lib/db"
import { 
  validateFamilyCode, 
  validateUserName, 
  sanitizeString,
  rateLimiter,
  getClientIP,
  sanitizeLogData
} from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting 체크 (인증은 더 엄격하게)
    const clientIP = getClientIP(request)
    if (!rateLimiter.isAllowed(clientIP)) {
      console.warn(`[SECURITY] Rate limit exceeded for auth from IP: ${clientIP}`)
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

    const { familyCode, userName } = requestData

    // 입력값 검증
    if (!familyCode || !userName) {
      console.warn(`[SECURITY] Missing credentials from IP: ${clientIP}`)
      return NextResponse.json({ success: false, error: "가족코드와 이름을 입력해주세요" }, { status: 400 })
    }

    if (!validateFamilyCode(familyCode)) {
      console.warn(`[SECURITY] Invalid family code from IP: ${clientIP}`, { familyCode })
      return NextResponse.json({ success: false, error: "유효하지 않은 가족코드입니다" }, { status: 400 })
    }

    if (!validateUserName(userName)) {
      console.warn(`[SECURITY] Invalid username from IP: ${clientIP}`, { userName })
      return NextResponse.json({ success: false, error: "유효하지 않은 사용자 이름입니다" }, { status: 400 })
    }

    console.log("[v0] 인증 요청:", sanitizeLogData({ familyCode, userName, clientIP }))

    let family
    try {
      // 기존 가족 찾기
      family = await findFamily(sanitizeString(familyCode))

      if (!family) {
        // 새 가족 생성
        console.log("[v0] 새 가족 생성:", sanitizeLogData({ familyCode, clientIP }))
        family = await createFamily(sanitizeString(familyCode), sanitizeString(userName))
      } else if (!family.users.includes(sanitizeString(userName))) {
        // 기존 가족에 사용자 추가
        console.log("[v0] 기존 가족에 사용자 추가:", sanitizeLogData({ userName, clientIP }))
        family.users.push(sanitizeString(userName))
        await updateFamily(family)
      }
    } catch (dbError) {
      console.error("[v0] 데이터베이스 에러:", sanitizeLogData({ error: dbError, clientIP }))
      return NextResponse.json(
        {
          success: false,
          error: "데이터베이스 오류가 발생했습니다",
        },
        { status: 500 },
      )
    }

    console.log("[v0] 인증 성공:", sanitizeLogData({ familyCode, userName, clientIP }))

    return NextResponse.json({
      success: true,
      data: {
        user: { name: userName, familyCode },
        family,
      },
    })
  } catch (error) {
    console.error("[v0] 인증 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
