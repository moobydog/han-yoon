"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Income, User } from "@/lib/types"

interface IncomeListProps {
  user: User
  refreshTrigger?: number
  onDelete?: () => void
}

export default function IncomeList({ user, refreshTrigger, onDelete }: IncomeListProps) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadIncomes = async () => {
    try {
      console.log("[v0] 수입 내역 로딩 시작")
      const response = await fetch(`/api/income?familyCodes=${user.familyCode},850324`)
      const result = await response.json()

      if (result.success) {
        console.log("[v0] 수입 내역:", result.data)
        setIncomes(result.data)
      }
    } catch (error) {
      console.error("[v0] 수입 내역 로딩 에러:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 수입 내역을 삭제하시겠습니까?")) {
      return
    }

    try {
      const response = await fetch(`/api/income?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        // 삭제 성공 시 목록에서 제거
        setIncomes(prev => prev.filter(income => income.id !== id))
        
        // 부모 컴포넌트에 삭제 완료 알림
        if (onDelete) {
          onDelete()
        }
        
        alert("수입 내역이 삭제되었습니다!")
      } else {
        throw new Error(result.error || "삭제에 실패했습니다")
      }
    } catch (error) {
      console.error("수입 삭제 에러:", error)
      alert("삭제 중 오류가 발생했습니다: " + (error instanceof Error ? error.message : "알 수 없는 오류"))
    }
  }

  useEffect(() => {
    loadIncomes()
  }, [user.familyCode, refreshTrigger])

  const totalAmount = incomes.reduce((sum, income) => sum + income.amount, 0)

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
            <span className="text-xl">💰</span>
            수입 내역
          </span>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
            총 {totalAmount.toLocaleString()}원
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incomes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💸</div>
            <div className="text-muted-foreground">아직 등록한 수입이 없습니다</div>
            <div className="text-xs text-muted-foreground mt-1">첫 수입을 등록해보세요!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {incomes.map((income, index) => (
              <div
                key={income.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{income.category}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {income.userName}
                    </span>
                  </div>
                  {income.memo && (
                    <div className="text-sm text-muted-foreground mb-1 bg-muted/30 px-2 py-1 rounded">
                      {income.memo}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(income.date || income.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600">+{income.amount.toLocaleString()}원</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(income.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
