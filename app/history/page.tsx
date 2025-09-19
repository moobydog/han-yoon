"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, Spending } from "@/lib/types"
import Navigation from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts"
import SpendingListItem from "@/components/spending-list-item"

interface Income {
  id: number
  amount: number
  category: string
  memo?: string
  userName: string
  familyCode: string
  createdAt: string
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [spendings, setSpendings] = useState<Spending[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("overview")
  const router = useRouter()

  useEffect(() => {
    // 로그인 상태 확인
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      router.push("/login")
      return
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      console.log("[v0] 데이터 조회 시작")

      // 지출과 수입 데이터를 병렬로 조회
      const [spendingResponse, incomeResponse] = await Promise.all([
        fetch(`/api/spending?familyCode=${user.familyCode}`),
        fetch(`/api/income?familyCode=${user.familyCode}`),
      ])

      const [spendingResult, incomeResult] = await Promise.all([spendingResponse.json(), incomeResponse.json()])

      if (spendingResult.success) {
        setSpendings(spendingResult.data || [])
      }

      if (incomeResult.success) {
        setIncomes(incomeResult.data || [])
      }

      console.log("[v0] 데이터 조회 완료")
    } catch (error) {
      console.error("[v0] 데이터 조회 에러:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 데이터 계산
  const totalSpending = spendings.reduce((sum, s) => sum + s.amount, 0)
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const netAmount = totalIncome - totalSpending

  // 카테고리별 지출
  const spendingCategoryTotals = spendings.reduce(
    (acc, spending) => {
      acc[spending.category] = (acc[spending.category] || 0) + spending.amount
      return acc
    },
    {} as Record<string, number>,
  )

  // 카테고리별 수입
  const incomeCategoryTotals = incomes.reduce(
    (acc, income) => {
      acc[income.category] = (acc[income.category] || 0) + income.amount
      return acc
    },
    {} as Record<string, number>,
  )

  // 차트 데이터 준비
  const spendingPieData = Object.entries(spendingCategoryTotals).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: ((amount / totalSpending) * 100).toFixed(1),
  }))

  const incomePieData = Object.entries(incomeCategoryTotals).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: ((amount / totalIncome) * 100).toFixed(1),
  }))

  // 최근 7일 데이터
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split("T")[0]
  }).reverse()

  const dailyData = last7Days.map((date) => {
    const daySpending = spendings
      .filter((s) => s.createdAt.split("T")[0] === date)
      .reduce((sum, s) => sum + s.amount, 0)

    const dayIncome = incomes.filter((i) => i.createdAt.split("T")[0] === date).reduce((sum, i) => sum + i.amount, 0)

    return {
      date: new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
      spending: daySpending,
      income: dayIncome,
      net: dayIncome - daySpending,
    }
  })

  // 필터링된 지출
  const filteredSpendings =
    filter === "all"
      ? [...spendings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : [...spendings]
          .filter((s) => s.category === filter)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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

  const spendingColors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"]
  const incomeColors = ["#10b981", "#059669", "#047857", "#065f46", "#064e3b"]

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mb-4 shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 font-space-grotesk">가계부 대시보드</h1>
            <p className="text-muted-foreground">가족의 수입과 지출 현황을 한눈에 확인해보세요</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-bounce-in">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                <div className="text-lg text-muted-foreground">내역을 불러오는 중...</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 요약 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
                <Card className="glass-effect">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">총 수입</p>
                        <p className="text-2xl font-bold text-green-600">+{formatAmount(totalIncome)}원</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <span className="text-xl">💰</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">총 지출</p>
                        <p className="text-2xl font-bold text-red-600">-{formatAmount(totalSpending)}원</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <span className="text-xl">💸</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">순 자산</p>
                        <p className={`text-2xl font-bold ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {netAmount >= 0 ? "+" : ""}
                          {formatAmount(netAmount)}원
                        </p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          netAmount >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                        }`}
                      >
                        <span className="text-xl">{netAmount >= 0 ? "📈" : "📉"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">총 거래</p>
                        <p className="text-2xl font-bold text-foreground">{spendings.length + incomes.length}건</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-xl">📋</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 탭 메뉴 */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">개요</TabsTrigger>
                  <TabsTrigger value="spending">지출 분석</TabsTrigger>
                  <TabsTrigger value="income">수입 분석</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* 최근 7일 수입/지출 추이 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-space-grotesk">최근 7일 수입/지출 추이</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Line
                              type="monotone"
                              dataKey="income"
                              stroke="#10b981"
                              strokeWidth={3}
                              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                              name="수입"
                            />
                            <Line
                              type="monotone"
                              dataKey="spending"
                              stroke="#ef4444"
                              strokeWidth={3}
                              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                              name="지출"
                            />
                            <ChartTooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                      <p className="font-medium mb-2">{label}</p>
                                      {payload.map((entry, index) => (
                                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                                          {entry.name}: {entry.value?.toLocaleString()}원
                                        </p>
                                      ))}
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="spending" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 카테고리별 지출 파이 차트 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-space-grotesk">카테고리별 지출</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={spendingPieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percentage }) => `${name} ${percentage}%`}
                                labelLine={false}
                              >
                                {spendingPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={spendingColors[index % spendingColors.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0]
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium">{data.payload.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {data.value?.toLocaleString()}원 ({data.payload.percentage}%)
                                        </p>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 최근 7일 지출 추이 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-space-grotesk">최근 7일 지출 추이</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                              />
                              <Bar dataKey="spending" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                              <ChartTooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium">{label}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {payload[0].value?.toLocaleString()}원
                                        </p>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="income" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 카테고리별 수입 파이 차트 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-space-grotesk">카테고리별 수입</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={incomePieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percentage }) => `${name} ${percentage}%`}
                                labelLine={false}
                              >
                                {incomePieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={incomeColors[index % incomeColors.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0]
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium">{data.payload.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {data.value?.toLocaleString()}원 ({data.payload.percentage}%)
                                        </p>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 최근 7일 수입 추이 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-space-grotesk">최근 7일 수입 추이</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                              />
                              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                              <ChartTooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium">{label}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {payload[0].value?.toLocaleString()}원
                                        </p>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 지출 내역 (기존 유지) */}
              <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center justify-between mb-4">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 보기</SelectItem>
                      {Object.keys(spendingCategoryTotals).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={fetchData} variant="outline" size="sm">
                    새로고침
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-space-grotesk">지출 내역</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredSpendings.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-muted-foreground">지출 내역이 없습니다</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {filteredSpendings.map((spending) => (
                          <SpendingListItem
                            key={spending.id}
                            spending={spending}
                            onDelete={() => {
                              setSpendings((prev) => prev.filter((s) => s.id !== spending.id))
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
