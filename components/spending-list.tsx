"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Spending } from "@/lib/types"

interface SpendingListProps {
  spendings: Spending[]
  onRefresh: () => void
}

export default function SpendingList({ spendings, onRefresh }: SpendingListProps) {
  const [filter, setFilter] = useState<string>("all")

  // 날짜별로 정렬 (최신순)
  const sortedSpendings = [...spendings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  // 필터링
  const filteredSpendings = filter === "all" ? sortedSpendings : sortedSpendings.filter((s) => s.category === filter)

  // 카테고리별 합계 계산
  const categoryTotals = spendings.reduce(
    (acc, spending) => {
      acc[spending.category] = (acc[spending.category] || 0) + spending.amount
      return acc
    },
    {} as Record<string, number>,
  )

  // 전체 합계
  const totalAmount = spendings.reduce((sum, s) => sum + s.amount, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("ko-KR")
  }

  if (spendings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">📝</div>
            <p>아직 지출 내역이 없습니다</p>
            <p className="text-sm">첫 지출을 기록해보세요!</p>
          </div>
          <Button onClick={onRefresh} variant="outline">
            새로고침
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 합계 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">이번 달 지출 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-blue-600">{formatAmount(totalAmount)}원</div>
            <div className="text-sm text-gray-500">총 {spendings.length}건</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="flex justify-between p-2 bg-gray-50 rounded">
                <span>{category}</span>
                <span className="font-medium">{formatAmount(amount)}원</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 필터 */}
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 보기</SelectItem>
            {Object.keys(categoryTotals).map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={onRefresh} variant="outline" size="sm">
          새로고침
        </Button>
      </div>

      {/* 지출 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">지출 내역</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredSpendings.map((spending) => (
              <div key={spending.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{formatAmount(spending.amount)}원</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {spending.category}
                      </span>
                    </div>
                    {spending.memo && <div className="text-sm text-gray-600 mb-1">{spending.memo}</div>}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{spending.userName}</span>
                      <span>•</span>
                      <span>{formatDate(spending.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
