"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import type { Spending } from "@/lib/types"

interface SpendingListItemProps {
  spending: Spending
  onDelete: () => void
}

export default function SpendingListItem({ spending, onDelete }: SpendingListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log("[v0] 지출 삭제 요청:", spending.id)
      const response = await fetch(`/api/spending?id=${spending.id}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        console.log("[v0] 지출 삭제 완료:", spending.id)
        onDelete()
      } else {
        console.error("[v0] 지출 삭제 실패:", result.error)
        alert("지출 삭제에 실패했습니다: " + result.error)
      }
    } catch (error) {
      console.error("[v0] 지출 삭제 에러:", error)
      alert("지출 삭제 중 오류가 발생했습니다")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatAmount = (amount: number) => amount.toLocaleString("ko-KR")

  return (
    <div className="p-4 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-lg font-semibold text-foreground">{formatAmount(spending.amount)}원</span>
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">
              {spending.category}
            </span>
          </div>
          {spending.memo && <div className="text-sm text-muted-foreground mb-2">{spending.memo}</div>}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span className="font-medium">{spending.userName}</span>
            <span>•</span>
            <span>{formatDate(spending.createdAt)}</span>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>지출 내역을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-2">
                  <p>다음 지출 내역이 영구적으로 삭제됩니다:</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="font-semibold">
                      {spending.category} - {formatAmount(spending.amount)}원
                    </div>
                    {spending.memo && <div className="text-sm text-muted-foreground">{spending.memo}</div>}
                    <div className="text-xs text-muted-foreground">{spending.userName}</div>
                  </div>
                  <p className="text-sm">이 작업은 되돌릴 수 없습니다.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
