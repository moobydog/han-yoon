"use client"

import { useEffect } from "react"
import type { User } from "@/lib/types"

interface RecurringProcessorProps {
  user: User
  onProcessComplete?: () => void
}

export default function RecurringProcessor({ user, onProcessComplete }: RecurringProcessorProps) {
  useEffect(() => {
    const processRecurring = async () => {
      try {
        console.log("[v0] 정기지출 자동 처리 시작")

        const response = await fetch("/api/process-recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        const result = await response.json()

        if (result.success && result.data.processed > 0) {
          console.log("[v0] 정기지출 처리 완료:", result.data.processed, "건")
          onProcessComplete?.()
        }
      } catch (error) {
        console.error("[v0] 정기지출 자동 처리 에러:", error)
      }
    }

    processRecurring()
  }, [user.familyCode, onProcessComplete])

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null
}
