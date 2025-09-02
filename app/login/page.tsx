"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [familyCode, setFamilyCode] = useState("")
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyCode.trim() || !userName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyCode: familyCode.trim(), userName: userName.trim() }),
      })

      if (!response.ok) {
        console.error("[v0] HTTP 에러:", response.status, response.statusText)
        alert(`서버 오류가 발생했습니다 (${response.status})`)
        return
      }

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error("[v0] 응답 JSON 파싱 에러:", jsonError)
        alert("서버 응답을 처리할 수 없습니다. 다시 시도해주세요.")
        return
      }

      if (result.success) {
        // 로컬스토리지에 사용자 정보 저장
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: userName.trim(),
            familyCode: familyCode.trim(),
          }),
        )
        router.push("/")
      } else {
        alert(result.error || "로그인에 실패했습니다. 다시 시도해주세요.")
      }
    } catch (error) {
      console.error("[v0] 로그인 에러:", error)
      alert("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">부부 가계부에 오신 걸 환영해요! 💑</CardTitle>
          <CardDescription className="text-gray-600">가족코드와 이름을 입력하고 시작하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="가족코드 (예: FAMILY2025)"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value)}
                className="text-center text-lg"
                disabled={isLoading}
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="이름 (예: 민수, 영희)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-center text-lg"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full text-lg py-6"
              disabled={isLoading || !familyCode.trim() || !userName.trim()}
            >
              {isLoading ? "입장 중..." : "시작하기"}
            </Button>
          </form>
          <div className="mt-6 text-sm text-gray-500 text-center">
            <p>💡 처음 사용하시나요?</p>
            <p>새로운 가족코드를 입력하면 자동으로 생성됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
