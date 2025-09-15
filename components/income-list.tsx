"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import DeleteConfirmation from "@/components/delete-confirmation"
import type { Income, User } from "@/lib/types"

interface IncomeListProps {
  user: User
  refreshTrigger?: number
  onDelete?: () => void
}

export default function IncomeList({ user, refreshTrigger, onDelete }: IncomeListProps) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    record: Income | null
    isDeleting: boolean
  }>({
    isOpen: false,
    record: null,
    isDeleting: false
  })

  const loadIncomes = async () => {
    try {
      console.log("[v0] 수입 내역 로딩 시작")
      const response = await fetch(`/api/income?familyCodes=${user.familyCode}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        console.log("[v0] 수입 내역:", result.data)
        setIncomes(result.data)
      } else {
        console.warn("[v0] 수입 내역 로딩 실패:", result.error)
        setIncomes([])
      }
    } catch (error) {
      console.error("[v0] 수입 내역 로딩 에러:", error)
      setIncomes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (record: Income) => {
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
      const response = await fetch(`/api/income?id=${deleteConfirm.record.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // 로컬 상태에서 제거
        setIncomes(prev => 
          prev.filter(income => income.id !== deleteConfirm.record!.id)
        )
        
        // 부모 컴포넌트에 삭제 완료 알림
        onDelete?.()
        
        console.log("[v0] 수입 삭제 성공:", deleteConfirm.record.id)
      } else {
        const result = await response.json()
        alert(result.error || "삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error("[v0] 수입 삭제 에러:", error)
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

  useEffect(() => {
    loadIncomes()
  }, [user.familyCode, refreshTrigger])

  const totalAmount = incomes.reduce((sum, income) => sum + income.amount, 0)

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
            <span className="text-xl">💰</span>
            수입 내역
          </span>
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
            총 {totalAmount.toLocaleString()}원
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incomes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💸</div>
            <div className="text-muted-foreground">아직 등록한 수입이 없습니다</div>
            <div className="text-xs text-muted-foreground mt-1">첫 수입을 등록해보세요!</div>
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
              {incomes.map((income, index) => (
                <div
                  key={income.id}
                  className="px-6 py-4 hover:bg-muted/30 transition-colors duration-200 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center min-w-[1000px]">
                    {/* 카테고리 - 1/3 */}
                    <div className="w-1/3 min-w-[250px] flex items-center gap-3 pr-4 border-r border-border">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-sm font-medium text-foreground truncate">{income.category}</span>
                    </div>
                    
                    {/* 사용자 - 1/6 */}
                    <div className="w-1/6 min-w-[120px] flex items-center px-4 border-r border-border">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full truncate">
                        {income.userName}
                      </span>
                    </div>
                    
                    {/* 메모 - 1/4 */}
                    <div className="w-1/4 min-w-[200px] flex items-center px-4 border-r border-border">
                      {income.memo ? (
                        <span className="text-sm text-muted-foreground truncate">
                          {income.memo}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">-</span>
                      )}
                    </div>
                    
                    {/* 금액과 삭제 버튼 - 1/4 */}
                    <div className="w-1/4 min-w-[300px] flex items-center justify-end gap-3 pl-4">
                      <div className="font-bold text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded border border-green-200 dark:border-green-800 whitespace-nowrap">
                        +{income.amount.toLocaleString()}원
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(income)}
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
        title="수입 삭제"
        description="이 수입 내역을 삭제하시겠습니까?"
        itemName={deleteConfirm.record ? `${deleteConfirm.record.category} - +${deleteConfirm.record.amount.toLocaleString()}원` : undefined}
        isLoading={deleteConfirm.isDeleting}
      />
    </Card>
  )
}
