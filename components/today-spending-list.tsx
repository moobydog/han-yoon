"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SpendingRecord, User } from "@/lib/types"

interface TodaySpendingListProps {
  user: User
  refreshTrigger?: number
}

export default function TodaySpendingList({ user, refreshTrigger }: TodaySpendingListProps) {
  const [todaySpending, setTodaySpending] = useState<SpendingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTodaySpending = async () => {
    try {
      console.log("[v0] 오늘 지출 내역 로딩 시작")
      const response = await fetch(`/api/spending?familyCodes=${user.familyCode},850324`)
      const result = await response.json()

      if (result.success) {
        const today = new Date().toISOString().split("T")[0]
        const todayRecords = result.data.filter((record: SpendingRecord) => {
          const recordDate = record.date || record.createdAt
          return recordDate && recordDate.startsWith(today)
        })
        console.log("[v0] 오늘 지출 내역:", todayRecords)
        setTodaySpending(todayRecords)
      }
    } catch (error) {
      console.error("[v0] 오늘 지출 내역 로딩 에러:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTodaySpending()
  }, [user.familyCode, refreshTrigger])

  const totalAmount = todaySpending.reduce((sum, record) => sum + record.amount, 0)

  if (isLoading) {
    return (
      <Card className="mt-6 glass-effect shadow-lg border-0">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            로딩 중...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6 glass-effect shadow-lg border-0 animate-slide-up">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between font-space-grotesk">
          <span className="flex items-center gap-2 text-foreground">
            <span className="text-xl">📋</span>
            오늘의 지출 내역
          </span>
          <div className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
            총 {totalAmount.toLocaleString()}원
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todaySpending.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💸</div>
            <div className="text-muted-foreground">아직 오늘 등록한 지출이 없습니다</div>
            <div className="text-xs text-muted-foreground mt-1">첫 지출을 등록해보세요!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySpending.map((record, index) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{record.category}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {record.userName}
                    </span>
                  </div>
                  {record.memo && (
                    <div className="text-sm text-muted-foreground mb-1 bg-muted/30 px-2 py-1 rounded">
                      {record.memo}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(record.date || record.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-accent">{record.amount.toLocaleString()}원</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
