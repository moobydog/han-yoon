"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"

interface NavigationProps {
  user: User
}

export default function Navigation({ user }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <>
      <nav className="bg-background/80 backdrop-blur-md shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold font-space-grotesk bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  스패너
                </h1>
              </div>
              <div className="hidden sm:block">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{user.familyCode}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden sm:block">{user.name}님</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            <Link href="/" className="flex-1">
              <Button
                variant="ghost"
                className={`w-full h-full flex flex-col items-center justify-center gap-1 ${
                  pathname === "/" ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <span className="text-lg">💰</span>
                <span className="text-xs font-medium">지출입력</span>
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button
                variant="ghost"
                className={`w-full h-full flex flex-col items-center justify-center gap-1 ${
                  pathname === "/dashboard" ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <span className="text-lg">📊</span>
                <span className="text-xs font-medium">대시보드</span>
              </Button>
            </Link>
            <Link href="/history" className="flex-1">
              <Button
                variant="ghost"
                className={`w-full h-full flex flex-col items-center justify-center gap-1 ${
                  pathname === "/history" ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <span className="text-lg">📋</span>
                <span className="text-xs font-medium">내역보기</span>
              </Button>
            </Link>
            <Link href="/recurring" className="flex-1">
              <Button
                variant="ghost"
                className={`w-full h-full flex flex-col items-center justify-center gap-1 ${
                  pathname === "/recurring" ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <span className="text-lg">🔄</span>
                <span className="text-xs font-medium">정기지출</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
