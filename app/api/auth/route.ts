import { type NextRequest, NextResponse } from "next/server"
import { findFamily, createFamily, updateFamily } from "@/lib/db"

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

    const { familyCode, userName } = requestData

    console.log("[v0] 인증 요청:", { familyCode, userName })

    if (!familyCode || !userName) {
      return NextResponse.json({ success: false, error: "가족코드와 이름을 입력해주세요" }, { status: 400 })
    }

    let family
    try {
      // 기존 가족 찾기
      family = await findFamily(familyCode)

      if (!family) {
        // 새 가족 생성
        console.log("[v0] 새 가족 생성:", familyCode)
        family = await createFamily(familyCode, userName)
      } else if (!family.users.includes(userName)) {
        // 기존 가족에 사용자 추가
        console.log("[v0] 기존 가족에 사용자 추가:", userName)
        family.users.push(userName)
        await updateFamily(family)
      }
    } catch (dbError) {
      console.error("[v0] 데이터베이스 에러:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "데이터베이스 오류가 발생했습니다",
        },
        { status: 500 },
      )
    }

    console.log("[v0] 인증 성공:", { familyCode, userName })

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
