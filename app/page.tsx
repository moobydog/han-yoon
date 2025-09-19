"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import SpendingForm from "@/components/spending-form"
import Navigation from "@/components/navigation"
import TodaySpendingList from "@/components/today-spending-list"
import RecurringProcessor from "@/components/recurring-processor"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      router.push("/login")
    }
  }, [router])

  const handleSpendingAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleRecurringProcessed = () => {
    setRefreshTrigger((prev) => prev + 1)
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
      <RecurringProcessor user={user} onProcessComplete={handleRecurringProcessed} />
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-md mx-auto">
          {/* 헤더 섹션 */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mb-4 shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 font-space-grotesk">안녕하세요, {user.name}님!</h1>
            <p className="text-muted-foreground">오늘의 지출을 간편하게 기록해보세요</p>
          </div>

          {/* 지출 입력 폼 */}
          <div className="animate-slide-up">
            <SpendingForm user={user} onSpendingAdded={handleSpendingAdded} />
          </div>

          {/* 오늘의 지출 내역 */}
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <TodaySpendingList user={user} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  )
}
