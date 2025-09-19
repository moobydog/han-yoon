import { type NextRequest, NextResponse } from "next/server"
import { addSpending, getSpendings, findFamily, createFamily, deleteSpending } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { amount, category, memo, userName, familyCode } = await request.json()

    console.log("[v0] 지출 저장 요청:", { amount, category, memo, userName, familyCode })

    if (!amount || !category || !userName || !familyCode) {
      return NextResponse.json({ success: false, error: "필수 정보가 누락되었습니다" }, { status: 400 })
    }

    try {
      let family = await findFamily(familyCode)
      if (!family) {
        console.log("[v0] 가족이 존재하지 않아 새로 생성:", familyCode)
        family = await createFamily(familyCode, userName)
      } else if (!family.users.includes(userName)) {
        console.log("[v0] 기존 가족에 사용자 추가:", userName)
        // 가족에 사용자 추가 로직은 auth API에서 처리하므로 여기서는 로그만
      }
    } catch (familyError) {
      console.error("[v0] 가족 확인/생성 에러:", familyError)
      return NextResponse.json({ success: false, error: "가족 정보 처리 중 오류가 발생했습니다" }, { status: 500 })
    }

    const spending = await addSpending({
      amount: Number.parseInt(amount),
      category,
      memo,
      userName,
      familyCode,
    })

    console.log("[v0] 지출 저장 완료:", spending)

    return NextResponse.json({
      success: true,
      data: spending,
    })
  } catch (error) {
    console.error("[v0] 지출 저장 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const familyCode = searchParams.get("familyCode")

    if (!familyCode) {
      return NextResponse.json({ success: false, error: "가족코드가 필요합니다" }, { status: 400 })
    }

    const allSpendings = await getSpendings()
    const familySpendings = allSpendings.filter((s) => s.familyCode === familyCode)

    console.log("[v0] 지출 내역 조회:", { familyCode, count: familySpendings.length })

    return NextResponse.json({
      success: true,
      data: familySpendings,
    })
  } catch (error) {
    console.error("[v0] 지출 조회 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "지출 ID가 필요합니다" }, { status: 400 })
    }

    console.log("[v0] 지출 삭제 요청:", id)

    await deleteSpending(id)

    console.log("[v0] 지출 삭제 완료:", id)

    return NextResponse.json({
      success: true,
      message: "지출이 삭제되었습니다",
    })
  } catch (error) {
    console.error("[v0] 지출 삭제 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
