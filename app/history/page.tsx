"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, Spending } from "@/lib/types"
import Navigation from "@/components/navigation"
import SpendingList from "@/components/spending-list"

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [spendings, setSpendings] = useState<Spending[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
      fetchSpendings()
    }
  }, [user])

  const fetchSpendings = async () => {
    if (!user) return

    try {
      console.log("[v0] 지출 내역 조회 시작")
      const response = await fetch(`/api/spending?familyCode=${user.familyCode}`)
      const result = await response.json()

      if (result.success) {
        setSpendings(result.data || [])
        console.log("[v0] 지출 내역 조회 완료:", result.data?.length)
      } else {
        console.error("[v0] 지출 내역 조회 실패:", result.error)
      }
    } catch (error) {
      console.error("[v0] 지출 내역 조회 에러:", error)
    } finally {
      setIsLoading(false)
    }
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">지출 내역 📊</h1>
            <p className="text-gray-600">가족의 지출 내역을 확인해보세요</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg">내역을 불러오는 중...</div>
            </div>
          ) : (
            <SpendingList spendings={spendings} onRefresh={fetchSpendings} />
          )}
        </div>
      </main>
    </div>
  )
}
