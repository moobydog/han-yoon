"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, RecurringSpending } from "@/lib/types"
import Navigation from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCategoryGroup } from "@/lib/types"

export default function RecurringPage() {
  const [user, setUser] = useState<User | null>(null)
  const [recurringList, setRecurringList] = useState<RecurringSpending[]>([])
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
      fetchRecurringList()
    }
  }, [user])

  const fetchRecurringList = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/recurring?familyCode=${user.familyCode}`)
      const result = await response.json()

      if (result.success) {
        setRecurringList(result.data)
      }
    } catch (error) {
      console.error("[v0] 정기지출 조회 에러:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("정기지출을 해지하시겠습니까?")) return

    try {
      const response = await fetch(`/api/recurring?id=${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("정기지출이 해지되었습니다.")
        fetchRecurringList()
      } else {
        alert("해지에 실패했습니다.")
      }
    } catch (error) {
      console.error("[v0] 정기지출 해지 에러:", error)
      alert("해지 중 오류가 발생했습니다.")
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount)
  }

  const getNextProcessDate = (dayOfMonth: number) => {
    const now = new Date()
    const currentDay = now.getDate()
    const nextMonth = currentDay >= dayOfMonth ? now.getMonth() + 1 : now.getMonth()
    const nextYear = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear()
    const adjustedMonth = nextMonth > 11 ? 0 : nextMonth

    return new Date(nextYear, adjustedMonth, dayOfMonth).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">정기지출 관리</h1>
            <p className="text-gray-600">매월 자동으로 반영되는 지출을 관리하세요</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg">로딩 중...</div>
            </div>
          ) : recurringList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500 mb-4">등록된 정기지출이 없습니다</div>
                <Button onClick={() => router.push("/")} variant="outline">
                  지출 입력하러 가기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recurringList.map((recurring) => (
                <Card key={recurring.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryGroup(recurring.category)}
                          </Badge>
                          <span className="text-sm text-gray-600">{recurring.category}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-xl font-bold text-gray-900">{formatAmount(recurring.amount)}원</span>
                          <span className="text-sm text-gray-500">매월 {recurring.dayOfMonth}일</span>
                        </div>
                        {recurring.memo && <div className="text-sm text-gray-600 mb-2">{recurring.memo}</div>}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>등록자: {recurring.userName}</span>
                          <span>다음 반영: {getNextProcessDate(recurring.dayOfMonth)}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(recurring.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          해지
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
              새 정기지출 등록하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
