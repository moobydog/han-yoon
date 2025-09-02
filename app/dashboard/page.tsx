"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"
import Navigation from "@/components/navigation"
import type { User, Spending, Income } from "@/lib/types"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [spendings, setSpendings] = useState<Spending[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      router.push("/login")
    }
  }, [router])

  const loadData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // 현재 선택된 월의 시작일과 끝일 계산
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      console.log(`[v0] 대시보드 데이터 로딩: ${startDate} ~ ${endDate}`)

      // 지출 데이터 로드 (연동 가족 포함)
      const familyCodesParam = `${user.familyCode},850324`
      const spendingResponse = await fetch(`/api/spending?familyCodes=${familyCodesParam}`)
      const spendingResult = await spendingResponse.json()

      // 수입 데이터 로드 (연동 가족 포함)
      const incomeResponse = await fetch(`/api/income?familyCodes=${familyCodesParam}`)
      const incomeResult = await incomeResponse.json()

      if (spendingResult.success) {
        // 선택된 월의 지출만 필터링
        const monthlySpendings = spendingResult.data.filter((spending: Spending) => {
          const spendingDate = spending.date || spending.createdAt
          return spendingDate >= startDate && spendingDate <= endDate
        })
        setSpendings(monthlySpendings)
        console.log(`[v0] ${year}년 ${month}월 지출:`, monthlySpendings.length, "건")
      }

      if (incomeResult.success) {
        // 선택된 월의 수입만 필터링
        const monthlyIncomes = incomeResult.data.filter((income: Income) => {
          const incomeDate = income.date || income.createdAt
          return incomeDate >= startDate && incomeDate <= endDate
        })
        setIncomes(monthlyIncomes)
        console.log(`[v0] ${year}년 ${month}월 수입:`, monthlyIncomes.length, "건")
      }
    } catch (error) {
      console.error("[v0] 대시보드 데이터 로딩 에러:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, selectedMonth])

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setSelectedMonth(newMonth)
  }

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date())
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

  // 통계 계산
  const totalSpending = spendings.reduce((sum, spending) => sum + spending.amount, 0)
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)
  const netAmount = totalIncome - totalSpending

  // 카테고리별 지출 통계
  const spendingByCategory = spendings.reduce((acc, spending) => {
    acc[spending.category] = (acc[spending.category] || 0) + spending.amount
    return acc
  }, {} as Record<string, number>)

  // 카테고리별 수입 통계
  const incomeByCategory = incomes.reduce((acc, income) => {
    acc[income.category] = (acc[income.category] || 0) + income.amount
    return acc
  }, {} as Record<string, number>)

  const monthName = selectedMonth.toLocaleDateString("ko-KR", { 
    year: "numeric", 
    month: "long" 
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mb-4 shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 font-space-grotesk">월별 대시보드</h1>
            <p className="text-muted-foreground">지출과 수입을 한눈에 확인하세요</p>
          </div>

          {/* 월 선택 컨트롤 */}
          <Card className="mb-6 animate-slide-up">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeMonth('prev')}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전 달
                </Button>
                
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-foreground">{monthName}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToCurrentMonth}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    오늘
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeMonth('next')}
                  className="flex items-center gap-2"
                >
                  다음 달
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-muted-foreground">데이터를 불러오는 중...</div>
            </div>
          ) : (
            <>
              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 지출</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {totalSpending.toLocaleString()}원
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {spendings.length}건의 거래
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 수입</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {totalIncome.toLocaleString()}원
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {incomes.length}건의 거래
                    </p>
                  </CardContent>
                </Card>

                <Card className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">순수익</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netAmount >= 0 ? '+' : ''}{netAmount.toLocaleString()}원
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {netAmount >= 0 ? '흑자' : '적자'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 카테고리별 분석 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 지출 카테고리 */}
                <Card className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-red-500">💸</span>
                      지출 카테고리별
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(spendingByCategory).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        이번 달 지출이 없습니다
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(spendingByCategory)
                          .sort(([,a], [,b]) => b - a)
                          .map(([category, amount]) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm text-red-600 font-semibold">
                                {amount.toLocaleString()}원
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 수입 카테고리 */}
                <Card className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-green-500">💰</span>
                      수입 카테고리별
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(incomeByCategory).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        이번 달 수입이 없습니다
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(incomeByCategory)
                          .sort(([,a], [,b]) => b - a)
                          .map(([category, amount]) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm text-green-600 font-semibold">
                                {amount.toLocaleString()}원
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 최근 거래 내역 */}
              <Card className="mt-6 animate-slide-up" style={{ animationDelay: "0.6s" }}>
                <CardHeader>
                  <CardTitle>최근 거래 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  {spendings.length === 0 && incomes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      이번 달 거래 내역이 없습니다
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...spendings, ...incomes]
                        .sort((a, b) => {
                          const dateA = new Date(a.date || a.createdAt)
                          const dateB = new Date(b.date || b.createdAt)
                          return dateB.getTime() - dateA.getTime()
                        })
                        .slice(0, 10)
                        .map((transaction, index) => (
                          <div
                            key={`${'amount' in transaction ? 'spending' : 'income'}-${transaction.id}`}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                'amount' in transaction ? 'bg-red-500' : 'bg-green-500'
                              }`} />
                              <div>
                                <div className="font-medium">{transaction.category}</div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.memo && `${transaction.memo} • `}
                                  {new Date(transaction.date || transaction.createdAt).toLocaleDateString("ko-KR")}
                                </div>
                              </div>
                            </div>
                            <div className={`font-semibold ${
                              'amount' in transaction ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {'amount' in transaction ? '-' : '+'}{transaction.amount.toLocaleString()}원
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}