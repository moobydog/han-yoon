import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const { amount, category, memo, userName, familyCode } = await request.json()

    // 입력값 검증
    if (!amount || !category || !userName || !familyCode) {
      return NextResponse.json({ success: false, error: "필수 정보가 누락되었습니다." }, { status: 400 })
    }

    // Supabase 클라이언트 생성
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // 수입 데이터 삽입
    const { data, error } = await supabase
      .from("income")
      .insert([
        {
          amount,
          category,
          memo,
          user_name: userName,
          family_code: familyCode,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("수입 저장 에러:", error)
      return NextResponse.json({ success: false, error: "수입 저장에 실패했습니다." }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("API 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const familyCode = searchParams.get("familyCode")

    if (!familyCode) {
      return NextResponse.json({ success: false, error: "가족 코드가 필요합니다." }, { status: 400 })
    }

    // Supabase 클라이언트 생성
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // 수입 데이터 조회
    const { data, error } = await supabase
      .from("income")
      .select("*")
      .eq("family_code", familyCode)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("수입 조회 에러:", error)
      return NextResponse.json({ success: false, error: "수입 조회에 실패했습니다." }, { status: 500 })
    }

    // 데이터 형식 변환
    const formattedData = data?.map((item) => ({
      id: item.id,
      amount: item.amount,
      category: item.category,
      memo: item.memo,
      userName: item.user_name,
      familyCode: item.family_code,
      createdAt: item.created_at,
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error("API 에러:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
