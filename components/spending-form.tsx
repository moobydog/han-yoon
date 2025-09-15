"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { CATEGORIES, PAYMENT_METHODS, type User, type PaymentMethod, getCategoryGroup } from "@/lib/types"

interface SpendingFormProps {
  user: User
  onSpendingAdded?: () => void
}

export default function SpendingForm({ user, onSpendingAdded }: SpendingFormProps) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [memo, setMemo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [dayOfMonth, setDayOfMonth] = useState("1")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")

  const categoryGroups = CATEGORIES.reduce(
    (groups, category) => {
      const group = getCategoryGroup(category)
      if (!groups[group]) groups[group] = []
      groups[group].push(category)
      return groups
    },
    {} as Record<string, string[]>,
  )

  const handleCategorySelect = (selectedCategory: string) => {
    console.log("[v0] 카테고리 선택:", selectedCategory)
    setCategory(selectedCategory)
    // 강제로 상태 업데이트 확인
    setTimeout(() => {
      console.log("[v0] 카테고리 상태 확인:", selectedCategory)
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("[v0] handleSubmit 호출됨!")
    e.preventDefault()
    
    console.log("[v0] 폼 제출 시 상태:", { amount, category, isRecurring, dayOfMonth })
    
    if (!amount.trim()) {
      console.log("[v0] 금액이 없어서 제출 중단")
      return
    }
    
    if (!isRecurring && !category) {
      console.log("[v0] 일반 지출인데 카테고리가 없어서 제출 중단")
      return
    }

    setIsLoading(true)
    try {
      console.log("[v0] 지출 저장 시작:", { amount, category, memo, isRecurring })
      console.log("[v0] 선택된 날짜:", selectedDate)
      console.log("[v0] 정기지출 여부:", isRecurring)
      if (isRecurring) {
        console.log("[v0] 정기지출 매월 반영일:", dayOfMonth)
      }
      
      const endpoint = isRecurring ? "/api/recurring" : "/api/spending"
      // 금액을 정확하게 처리 (parseInt 대신 Number 사용)
      const amountValue = Number(amount.replace(/,/g, '')) // 쉼표 제거 후 숫자 변환
      console.log("[v0] 원본 금액:", amount, "변환된 금액:", amountValue)
      
      const requestBody = isRecurring
        ? {
            amount: amountValue,
            category: category || "기타", // 정기지출일 때 카테고리가 없으면 "기타" 사용
            memo: memo.trim() || undefined,
            userName: user.name,
            familyCode: user.familyCode,
            dayOfMonth: Number.parseInt(dayOfMonth),
            paymentMethod,
          }
        : {
            amount: amountValue,
            category,
            memo: memo.trim() || undefined,
            userName: user.name,
            familyCode: user.familyCode,
            date: selectedDate,
            paymentMethod,
          }

      console.log("[v0] API 요청 본문:", JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      console.log("[v0] API 응답:", result)

      if (result.success) {
        setAmount("")
        setCategory("")
        setMemo("")
        setIsRecurring(false)
        setDayOfMonth("1")
        setSelectedDate(new Date().toISOString().split('T')[0])
        alert(isRecurring ? "정기지출이 등록되었습니다!" : "지출이 저장되었습니다!")
        onSpendingAdded?.()
      } else {
        alert("저장에 실패했습니다. 다시 시도해주세요.")
      }
    } catch (error) {
      console.error("[v0] 지출 저장 에러:", error)
      alert("저장 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="card-spending glass-effect shadow-xl border-0 animate-slide-up hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-xl font-space-grotesk text-foreground flex items-center justify-center gap-2">
          <span className="text-2xl">💸</span>
          지출 입력
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-muted-foreground">카테고리</label>
            <Tabs defaultValue="식비" className="w-full">
              <TabsList className="grid w-full grid-cols-3 gap-1 mb-3 bg-muted/50 p-1">
                <TabsTrigger
                  value="식비"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  🍽️ 식비
                </TabsTrigger>
                <TabsTrigger
                  value="교통비"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  🚗 교통
                </TabsTrigger>
                <TabsTrigger
                  value="카페"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  ☕ 카페
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-3 gap-1 mb-3 bg-muted/50 p-1">
                <TabsTrigger
                  value="쇼핑"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  🛍️ 쇼핑
                </TabsTrigger>
                <TabsTrigger
                  value="생활용품"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  🏠 생활
                </TabsTrigger>
                <TabsTrigger
                  value="금융"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  💳 금융
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-3 gap-1 mb-4 bg-muted/50 p-1">
                <TabsTrigger
                  value="의료비"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  🏥 의료
                </TabsTrigger>
                <TabsTrigger
                  value="문화생활"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  🎭 문화
                </TabsTrigger>
                <TabsTrigger
                  value="기타"
                  className="text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  📦 기타
                </TabsTrigger>
              </TabsList>

              {Object.entries(categoryGroups).map(([group, categories]) => (
                <TabsContent key={group} value={group} className="mt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={category === cat ? "default" : "outline"}
                        className={`text-xs p-3 h-auto whitespace-normal text-left justify-start transition-all duration-200 hover:scale-105 ${
                          category === cat
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-card hover:bg-accent hover:text-accent-foreground border-border"
                        }`}
                        onClick={() => {
                          console.log("[v0] 카테고리 버튼 클릭:", cat)
                          handleCategorySelect(cat)
                        }}
                        disabled={isLoading}
                      >
                        {cat.replace(`${group} - `, "")}
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">금액</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right text-2xl font-bold h-16 pr-12 bg-card border-2 focus:border-primary transition-all duration-200"
                disabled={isLoading}
                min="0"
                step="10"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-medium text-muted-foreground">
                원
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">메모 (선택사항)</label>
            <Input
              type="text"
              placeholder="예: 스타벅스 라떼"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={isLoading}
              className="bg-card border-border focus:border-primary transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">결제 방법</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <Button
                  key={method.value}
                  type="button"
                  variant={paymentMethod === method.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                  disabled={isLoading}
                  className="flex items-center gap-2 h-10"
                >
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-sm">{method.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {!isRecurring && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">지출 날짜</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isLoading}
                className="bg-card border-border focus:border-primary transition-all duration-200"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <label className="text-sm font-medium text-foreground">정기지출</label>
              <p className="text-xs text-muted-foreground">매월 자동으로 반영됩니다</p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              disabled={isLoading}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {isRecurring && (
            <div className="space-y-2 animate-slide-up">
              <label className="block text-sm font-medium text-muted-foreground">매월 반영일</label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth} disabled={isLoading}>
                <SelectTrigger className="bg-card border-border focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      매월 {day}일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="submit"
            onClick={(e) => {
              console.log("[v0] 버튼 클릭됨!")
              console.log("[v0] 버튼 클릭 시 상태:", { amount, category, isRecurring, dayOfMonth })
            }}
            className="w-full text-lg py-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={(() => {
              // 최후의 수단: 버튼 활성화 조건 완전 제거 (임시)
              const disabled = isLoading || !amount.trim()
              console.log("[v0] 버튼 활성화 상태 (단순화):", {
                isLoading,
                amount: amount.trim(),
                category,
                isRecurring,
                dayOfMonth,
                disabled
              })
              return disabled
            })()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                저장 중...
              </div>
            ) : (
              <span>{isRecurring ? "정기지출 등록" : "저장하기"}</span>
            )}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground text-center bg-muted/20 p-3 rounded-lg">
          {isRecurring ? "정기지출은 매월 자동으로 반영됩니다" : "저장하면 가족 모두가 바로 확인할 수 있어요"}
        </div>
      </CardContent>
    </Card>
  )
}
