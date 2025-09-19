"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import IncomeForm from "@/components/income-form"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Income {
  id: number
  amount: number
  category: string
  memo?: string
  userName: string
  familyCode: string
  createdAt: string
}

export default function IncomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchIncomes()
    }
  }, [user, refreshTrigger])

  const fetchIncomes = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/income?familyCode=${user.familyCode}`)
      const result = await response.json()

      if (result.success) {
        setIncomes(result.data || [])
      } else {
        console.error("수입 내역 조회 실패:", result.error)
      }
    } catch (error) {
      console.error("수입 내역 조회 에러:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncomeAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const formatAmount = (amount: number) => amount.toLocaleString("ko-KR")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-bounce-in">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-lg text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-md mx-auto">
          {/* 헤더 섹션 */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4 shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 font-space-grotesk">수입 관리</h1>
            <p className="text-muted-foreground">수입을 기록하고 관리해보세요</p>
          </div>

          {/* 수입 입력 폼 */}
          <div className="animate-slide-up">
            <IncomeForm user={user} onIncomeAdded={handleIncomeAdded} />
          </div>

          {/* 수입 내역 */}
          <div className="animate-slide-up mt-8" style={{ animationDelay: "0.1s" }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-space-grotesk">수입 내역</CardTitle>
                <Button onClick={fetchIncomes} variant="outline" size="sm">
                  새로고침
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">불러오는 중...</p>
                  </div>
                ) : incomes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-muted-foreground">아직 수입 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {incomes.map((income) => (
                      <div key={income.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-green-600">{income.category}</span>
                              <span className="text-xs text-muted-foreground">by {income.userName}</span>
                            </div>
                            {income.memo && <p className="text-sm text-muted-foreground mb-1">{income.memo}</p>}
                            <p className="text-xs text-muted-foreground">{formatDate(income.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">+{formatAmount(income.amount)}원</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
