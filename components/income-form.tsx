"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { User } from "@/lib/types"

interface IncomeFormProps {
  user: User
  onIncomeAdded?: () => void
}

const INCOME_CATEGORIES = ["급여", "부업", "투자수익", "용돈", "상여금", "환급", "판매수익", "기타수입"]

export default function IncomeForm({ user, onIncomeAdded }: IncomeFormProps) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [memo, setMemo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [dayOfMonth, setDayOfMonth] = useState("1")

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount.trim() || !category) return

    setIsLoading(true)
    try {
      console.log("[v0] 수입 저장 시작:", { amount, category, memo, isRecurring })

      const endpoint = isRecurring ? "/api/recurring-income" : "/api/income"
      const requestBody = isRecurring
        ? {
            amount: Number.parseInt(amount),
            category,
            memo: memo.trim() || undefined,
            userName: user.name,
            familyCode: user.familyCode,
            dayOfMonth: Number.parseInt(dayOfMonth),
          }
        : {
            amount: Number.parseInt(amount),
            category,
            memo: memo.trim() || undefined,
            userName: user.name,
            familyCode: user.familyCode,
          }

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
        alert(isRecurring ? "정기수입이 등록되었습니다!" : "수입이 저장되었습니다!")
        onIncomeAdded?.()
      } else {
        alert("저장에 실패했습니다. 다시 시도해주세요.")
      }
    } catch (error) {
      console.error("[v0] 수입 저장 에러:", error)
      alert("저장 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-effect shadow-xl border-0 animate-slide-up">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-xl font-space-grotesk text-foreground">수입 입력</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">금액</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right text-2xl font-bold h-16 pr-12 bg-card border-2 focus:border-green-500 transition-all duration-200"
                disabled={isLoading}
                min="0"
                step="100"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-medium text-muted-foreground">
                원
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-muted-foreground">카테고리</label>
            <div className="grid grid-cols-2 gap-2">
              {INCOME_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={category === cat ? "default" : "outline"}
                  className={`text-xs p-3 h-auto whitespace-normal text-left justify-start transition-all duration-200 hover:scale-105 ${
                    category === cat
                      ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                      : "bg-card hover:bg-accent hover:text-accent-foreground border-border"
                  }`}
                  onClick={() => handleCategorySelect(cat)}
                  disabled={isLoading}
                >
                  {cat === "급여" && "💰 "}
                  {cat === "부업" && "💼 "}
                  {cat === "투자수익" && "📈 "}
                  {cat === "용돈" && "💵 "}
                  {cat === "상여금" && "🎁 "}
                  {cat === "환급" && "💸 "}
                  {cat === "판매수익" && "🛒 "}
                  {cat === "기타수입" && "📦 "}
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">메모 (선택사항)</label>
            <Input
              type="text"
              placeholder="예: 월급, 프리랜서 수입"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={isLoading}
              className="bg-card border-border focus:border-green-500 transition-all duration-200"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <label className="text-sm font-medium text-foreground">정기수입</label>
              <p className="text-xs text-muted-foreground">매월 자동으로 반영됩니다</p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              disabled={isLoading}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          {isRecurring && (
            <div className="space-y-2 animate-slide-up">
              <label className="block text-sm font-medium text-muted-foreground">매월 반영일</label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth} disabled={isLoading}>
                <SelectTrigger className="bg-card border-border focus:border-green-500">
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
            className="w-full text-lg py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !amount.trim() || !category}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                저장 중...
              </div>
            ) : (
              <span>{isRecurring ? "정기수입 등록" : "저장하기"}</span>
            )}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground text-center bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
          {isRecurring ? "정기수입은 매월 자동으로 반영됩니다" : "저장하면 가족 모두가 바로 확인할 수 있어요"}
        </div>
      </CardContent>
    </Card>
  )
}
