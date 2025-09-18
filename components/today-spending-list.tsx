"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import DeleteConfirmation from "@/components/delete-confirmation"
import type { Spending, User } from "@/lib/types"
import { getPaymentMethodIcon, getPaymentMethodLabel } from "@/lib/types"

interface TodaySpendingListProps {
  user: User
  refreshTrigger?: number
  onSpendingDeleted?: () => void
}

export default function TodaySpendingList({ user, refreshTrigger, onSpendingDeleted }: TodaySpendingListProps) {
  const [todaySpending, setTodaySpending] = useState<Spending[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    record: Spending | null
    isDeleting: boolean
  }>({
    isOpen: false,
    record: null,
    isDeleting: false
  })

  const loadTodaySpending = async () => {
    try {
      console.log("[v0] 오늘 지출 내역 로딩 시작")
      const response = await fetch(`/api/spending?familyCodes=${user.familyCode}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        const today = new Date().toISOString().split("T")[0]
        const todayRecords = result.data.filter((record: Spending) => {
          const recordDate = record.date || record.createdAt
          return recordDate && recordDate.startsWith(today)
        })
        console.log("[v0] 오늘 지출 내역:", todayRecords)
        setTodaySpending(todayRecords)
      } else {
        console.warn("[v0] 오늘 지출 내역 로딩 실패:", result.error)
        setTodaySpending([])
      }
    } catch (error) {
      console.error("[v0] 오늘 지출 내역 로딩 에러:", error)
      setTodaySpending([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTodaySpending()
  }, [user.familyCode, refreshTrigger])

  const totalAmount = todaySpending.reduce((sum, record) => sum + record.amount, 0)

  const handleDeleteClick = (record: Spending) => {
    setDeleteConfirm({
      isOpen: true,
      record,
      isDeleting: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.record) return

    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }))

    try {
      const response = await fetch(`/api/spending?id=${deleteConfirm.record.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // 로컬 상태에서 제거
        setTodaySpending(prev => 
          prev.filter(record => record.id !== deleteConfirm.record!.id)
        )
        
        // 부모 컴포넌트에 삭제 완료 알림
        onSpendingDeleted?.()
        
        console.log("[v0] 지출 삭제 성공:", deleteConfirm.record.id)
      } else {
        const result = await response.json()
        alert(result.error || "삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error("[v0] 지출 삭제 에러:", error)
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

  if (isLoading) {
    return (
      <Card className="mt-6 glass-effect shadow-lg border-0">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            로딩 중...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6 glass-effect shadow-lg border-0 animate-slide-up">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between font-space-grotesk">
          <span className="flex items-center gap-2 text-foreground">
            <span className="text-xl">📋</span>
            오늘의 지출 내역
          </span>
          <div className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
            총 {totalAmount.toLocaleString()}원
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todaySpending.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💸</div>
            <div className="text-muted-foreground">아직 오늘 등록한 지출이 없습니다</div>
            <div className="text-xs text-muted-foreground mt-1">첫 지출을 등록해보세요!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySpending.map((record, index) => (
              <div
                key={record.id}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* 왼쪽: 카테고리와 메모 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="text-sm font-medium text-foreground truncate">
                        {record.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{getPaymentMethodIcon(record.paymentMethod || "card")}</span>
                        <span>{getPaymentMethodLabel(record.paymentMethod || "card")}</span>
                      </span>
                    </div>
                    
                    {record.memo && (
                      <div className="text-sm text-muted-foreground truncate mb-1">
                        {record.memo}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {record.userName}
                      </span>
                    </div>
                  </div>
                  
                  {/* 오른쪽: 금액과 삭제 버튼 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-lg text-red-600 dark:text-red-400">
                        -{record.amount.toLocaleString()}원
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(record)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 h-8 w-8 border-red-300 bg-red-50 dark:bg-red-900/10"
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
      
      <DeleteConfirmation
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="지출 삭제"
        description="이 지출 내역을 삭제하시겠습니까?"
        itemName={deleteConfirm.record ? `${deleteConfirm.record.category} - ${deleteConfirm.record.amount.toLocaleString()}원` : undefined}
        isLoading={deleteConfirm.isDeleting}
      />
    </Card>
  )
}
