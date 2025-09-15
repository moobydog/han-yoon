"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import DeleteConfirmation from "@/components/delete-confirmation"
import type { Spending, User } from "@/lib/types"

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
      const result = await response.json()

      if (result.success) {
        const today = new Date().toISOString().split("T")[0]
        const todayRecords = result.data.filter((record: Spending) => {
          const recordDate = record.date || record.createdAt
          return recordDate && recordDate.startsWith(today)
        })
        console.log("[v0] 오늘 지출 내역:", todayRecords)
        setTodaySpending(todayRecords)
      }
    } catch (error) {
      console.error("[v0] 오늘 지출 내역 로딩 에러:", error)
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
          <div className="overflow-x-auto rounded-lg border border-border">
            {/* 헤더 */}
            <div className="bg-muted/50 px-6 py-4">
              <div className="flex items-center text-sm font-medium text-muted-foreground min-w-[1000px]">
                <div className="w-1/3 min-w-[250px] border-r border-border pr-4">카테고리</div>
                <div className="w-1/6 min-w-[120px] border-r border-border px-4">사용자</div>
                <div className="w-1/4 min-w-[200px] border-r border-border px-4">메모</div>
                <div className="w-1/4 min-w-[300px] text-right pl-4">금액</div>
              </div>
            </div>
            
            {/* 데이터 행들 */}
            <div className="divide-y divide-border">
              {todaySpending.map((record, index) => (
                <div
                  key={record.id}
                  className="px-6 py-4 hover:bg-muted/30 transition-colors duration-200 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center min-w-[1000px]">
                    {/* 카테고리 - 1/3 */}
                    <div className="w-1/3 min-w-[250px] flex items-center gap-3 pr-4 border-r border-border">
                      <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="text-sm font-medium text-foreground truncate">{record.category}</span>
                    </div>
                    
                    {/* 사용자 - 1/6 */}
                    <div className="w-1/6 min-w-[120px] flex items-center px-4 border-r border-border">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full truncate">
                        {record.userName}
                      </span>
                    </div>
                    
                    {/* 메모 - 1/4 */}
                    <div className="w-1/4 min-w-[200px] flex items-center px-4 border-r border-border">
                      {record.memo ? (
                        <span className="text-sm text-muted-foreground truncate">
                          {record.memo}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">-</span>
                      )}
                    </div>
                    
                    {/* 금액과 삭제 버튼 - 1/4 */}
                    <div className="w-1/4 min-w-[300px] flex items-center justify-end gap-3 pl-4">
                      <div className="font-bold text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded border border-red-200 dark:border-red-800 whitespace-nowrap">
                        -{record.amount.toLocaleString()}원
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(record)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 h-8 w-8 flex-shrink-0 border-red-300 bg-red-50 dark:bg-red-900/10"
                        title="삭제하기"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
