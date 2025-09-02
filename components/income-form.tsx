"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { INCOME_CATEGORIES } from "@/lib/types"

interface IncomeFormProps {
  familyCode: string
  userName: string
  onSuccess?: () => void
}

export default function IncomeForm({ familyCode, userName, onSuccess }: IncomeFormProps) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [memo, setMemo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !category) {
      setError("금액과 카테고리를 모두 입력해주세요")
      return
    }

    // 금액을 정확하게 처리 (parseInt 대신 Number 사용)
    const amountNum = Number(amount.replace(/,/g, '')) // 쉼표 제거 후 숫자 변환
    console.log("[v0] 수입 원본 금액:", amount, "변환된 금액:", amountNum)
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("올바른 금액을 입력해주세요")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNum,
          category,
          memo: memo.trim() || undefined,
          userName,
          familyCode,
          date: selectedDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "수입 등록에 실패했습니다")
      }

      if (data.success) {
        // 폼 초기화
        setAmount("")
        setCategory("")
        setMemo("")
        setSelectedDate(new Date().toISOString().split('T')[0])
        setError(null)
        
        // 성공 콜백 호출
        if (onSuccess) {
          onSuccess()
        }
        
        alert("수입이 등록되었습니다!")
      } else {
        throw new Error(data.error || "수입 등록에 실패했습니다")
      }
    } catch (err) {
      console.error("수입 등록 에러:", err)
      setError(err instanceof Error ? err.message : "수입 등록에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>수입 등록</CardTitle>
        <CardDescription>
          새로운 수입을 등록하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              금액 (원)
            </label>
            <Input
              id="amount"
              type="number"
              placeholder="수입 금액을 입력하세요"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              카테고리
            </label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="수입 카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="memo" className="text-sm font-medium">
              메모 (선택사항)
            </label>
            <Input
              id="memo"
              type="text"
              placeholder="수입에 대한 메모를 입력하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              수입 날짜
            </label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "등록 중..." : "수입 등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
