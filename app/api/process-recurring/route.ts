import { type NextRequest, NextResponse } from "next/server"
import type { RecurringSpending, ApiResponse } from "@/lib/types"
import { addSpending, getRecurringSpending, updateRecurringSpending, findFamily, createFamily } from "@/lib/db"

// 이번 달에 처리해야 할 정기지출 확인
function shouldProcessThisMonth(recurring: RecurringSpending): boolean {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  // 아직 처리일이 되지 않았으면 처리하지 않음
  if (currentDay < recurring.dayOfMonth) {
    return false
  }

  // 마지막 처리 날짜 확인
  if (recurring.lastProcessed) {
    const lastProcessed = new Date(recurring.lastProcessed)
    const lastProcessedYear = lastProcessed.getFullYear()
    const lastProcessedMonth = lastProcessed.getMonth()

    // 이미 이번 달에 처리했으면 처리하지 않음
    if (lastProcessedYear === currentYear && lastProcessedMonth === currentMonth) {
      return false
    }
  }

  return true
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ processed: number }>>> {
  try {
    console.log("[v0] 정기지출 자동 반영 시작")

    const recurringData = await getRecurringSpending()
    const activeRecurring = recurringData.filter((r) => r.isActive)

    console.log("[v0] 정기지출 데이터 조회:", activeRecurring.length, "개")

    let processedCount = 0

    for (const recurring of activeRecurring) {
      if (shouldProcessThisMonth(recurring)) {
        try {
          let family = await findFamily(recurring.familyCode)
          if (!family) {
            console.log("[v0] 정기지출 처리 중 가족이 존재하지 않아 새로 생성:", recurring.familyCode)
            family = await createFamily(recurring.familyCode, recurring.userName)
          }

          const spending = await addSpending({
            amount: recurring.amount,
            category: recurring.category,
            memo: `[정기] ${recurring.memo || ""}`.trim(),
            userName: recurring.userName,
            familyCode: recurring.familyCode,
            isRecurring: true,
            recurringId: recurring.id,
            paymentMethod: recurring.paymentMethod || "card",
          })

          await updateRecurringSpending(recurring.id, {
            lastProcessed: new Date().toISOString(),
          })

          processedCount++
          console.log("[v0] 정기지출 처리 완료:", {
            id: recurring.id,
            amount: recurring.amount,
            category: recurring.category,
            userName: recurring.userName,
          })
        } catch (error) {
          console.error("[v0] 정기지출 처리 실패:", recurring.id, error)
        }
      }
    }

    console.log("[v0] 정기지출 자동 반영 완료:", { processedCount })

    return NextResponse.json({
      success: true,
      data: { processed: processedCount },
    })
  } catch (error) {
    console.error("[v0] 정기지출 자동 반영 에러:", error)
    return NextResponse.json({
      success: false,
      error: "정기지출 처리 중 오류가 발생했습니다.",
    })
  }
}
