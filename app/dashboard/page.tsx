"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2 } from "lucide-react"
import Navigation from "@/components/navigation"
import ThemeToggle from "@/components/theme-toggle"
import TodaySpendingList from "@/components/today-spending-list"
import IncomeList from "@/components/income-list"
import DeleteConfirmation from "@/components/delete-confirmation"
import type { User, Spending, Income } from "@/lib/types"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [spendings, setSpendings] = useState<Spending[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    record: Spending | Income | null
    isDeleting: boolean
  }>({
    isOpen: false,
    record: null,
    isDeleting: false
  })
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

      // 지출 데이터 로드 (현재 가족만)
      const familyCodesParam = user.familyCode
      const spendingResponse = await fetch(`/api/spending?familyCodes=${familyCodesParam}`)
      const spendingResult = await spendingResponse.json()

      // 수입 데이터 로드 (현재 가족만)
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

  const handleDeleteClick = (record: Spending | Income) => {
    setDeleteConfirm({
      isOpen: true,
      record: record,
      isDeleting: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.record) return

    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }))

    try {
      const isSpending = 'amount' in deleteConfirm.record
      const endpoint = isSpending ? '/api/spending' : '/api/income'
      
      console.log(`[v0] ${isSpending ? '지출' : '수입'} 삭제 시작:`, deleteConfirm.record.id)
      
      const response = await fetch(`${endpoint}?id=${deleteConfirm.record.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        console.log(`[v0] ${isSpending ? '지출' : '수입'} 삭제 성공:`, deleteConfirm.record.id)
        loadData() // 데이터 새로고침
      } else {
        const result = await response.json()
        alert(result.error || "삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error(`[v0] ${'amount' in deleteConfirm.record ? '지출' : '수입'} 삭제 에러:`, error)
      alert("삭제 중 오류가 발생했습니다.")
    } finally {
      setDeleteConfirm({
        isOpen: false,
        record: null,
        isDeleting: false
      })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      record: null,
      isDeleting: false
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
      <ThemeToggle />
      <Navigation user={user} />
      
      <main className="container mx-auto px-6 py-6 pb-20 max-w-[1400px]">
        <div className="max-w-6xl mx-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="card-spending animate-slide-up hover-lift border-l-4 border-l-red-500" style={{ animationDelay: "0.1s" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-xl">💸</span>
                      총 지출
                    </CardTitle>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {totalSpending.toLocaleString()}원
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      {spendings.length}건의 거래
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-income animate-slide-up hover-lift border-l-4 border-l-green-500" style={{ animationDelay: "0.2s" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      총 수입
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {totalIncome.toLocaleString()}원
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {incomes.length}건의 거래
                    </p>
                  </CardContent>
                </Card>

                <Card className={`card-dashboard animate-slide-up hover-lift border-l-4 ${netAmount >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`} style={{ animationDelay: "0.3s" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      순수익
                    </CardTitle>
                    <DollarSign className={`h-5 w-5 ${netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold mb-1 ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netAmount >= 0 ? '+' : ''}{netAmount.toLocaleString()}원
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${netAmount >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {netAmount >= 0 ? '흑자' : '적자'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 카테고리별 분석 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 지출 카테고리 */}
                <Card className="animate-slide-up border-l-4 border-l-red-500" style={{ animationDelay: "0.4s" }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">💸</span>
                      지출 카테고리별
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(spendingByCategory).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="text-4xl mb-3">📊</div>
                        <div>이번 달 지출이 없습니다</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(spendingByCategory)
                          .sort(([,a], [,b]) => b - a)
                          .map(([category, amount], index) => {
                            const percentage = (amount / totalSpending) * 100
                            return (
                              <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground">{category}</span>
                                  <span className="text-sm text-red-600 font-semibold">
                                    {amount.toLocaleString()}원
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${percentage}%`,
                                      animationDelay: `${index * 0.1}s`
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 수입 카테고리 */}
                <Card className="animate-slide-up border-l-4 border-l-green-500" style={{ animationDelay: "0.5s" }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">💰</span>
                      수입 카테고리별
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(incomeByCategory).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="text-4xl mb-3">📊</div>
                        <div>이번 달 수입이 없습니다</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(incomeByCategory)
                          .sort(([,a], [,b]) => b - a)
                          .map(([category, amount], index) => {
                            const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0
                            return (
                              <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-foreground">{category}</span>
                                  <span className="text-sm text-green-600 font-semibold">
                                    {amount.toLocaleString()}원
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${percentage}%`,
                                      animationDelay: `${index * 0.1}s`
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 최근 거래 내역 */}
              <Card className="mt-6 animate-slide-up border-l-4 border-l-blue-500" style={{ animationDelay: "0.6s" }}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">📋</span>
                    최근 거래 내역
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {spendings.length === 0 && incomes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-3">📊</div>
                      <div>이번 달 거래 내역이 없습니다</div>
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
                            className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    'amount' in transaction ? 'bg-red-500' : 'bg-green-500'
                                  }`} />
                                  <div className="font-medium text-foreground">{transaction.category}</div>
                                </div>
                                {transaction.memo && (
                                  <div className="text-sm text-muted-foreground mb-1">
                                    {transaction.memo}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(transaction.date || transaction.createdAt).toLocaleDateString("ko-KR")}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className={`text-right font-bold text-lg ${
                                  'amount' in transaction ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {'amount' in transaction ? '-' : '+'}{transaction.amount.toLocaleString()}원
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(transaction)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-8 w-8 border-red-300 bg-red-50"
                                  title="삭제하기"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 오늘의 지출 내역 */}
              {user && (
                <TodaySpendingList 
                  user={user} 
                  refreshTrigger={refreshTrigger}
                  onSpendingDeleted={() => setRefreshTrigger(prev => prev + 1)}
                />
              )}

              {/* 수입 내역 */}
              {user && (
                <IncomeList 
                  user={user} 
                  refreshTrigger={refreshTrigger}
                  onDelete={() => setRefreshTrigger(prev => prev + 1)}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmation
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={deleteConfirm.isDeleting}
        title={deleteConfirm.record && 'amount' in deleteConfirm.record ? "지출 삭제" : "수입 삭제"}
        message={`${deleteConfirm.record?.amount.toLocaleString()}원 ${deleteConfirm.record && 'amount' in deleteConfirm.record ? '지출' : '수입'}을 삭제하시겠습니까?`}
      />
    </div>
  )
}