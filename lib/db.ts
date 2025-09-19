import { createClient } from "./supabase/server"
import type { Spending, Family, RecurringSpending } from "./types"

// 지출 데이터 읽기
export async function getSpendings(): Promise<Spending[]> {
  try {
    const supabase = await createClient()

    console.log("[v0] 지출 데이터 조회 시작 - Supabase 클라이언트 생성 완료")

    const { data, error } = await supabase.from("spending").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 지출 데이터 조회 에러:", error)
      console.error("[v0] 에러 세부사항:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return []
    }

    if (!data) {
      console.log("[v0] 지출 데이터 조회 결과: null 또는 undefined")
      return []
    }

    const spendings: Spending[] = data.map((row) => ({
      id: row.id,
      amount: row.amount,
      category: row.category,
      memo: row.description,
      userName: row.spender,
      familyCode: row.family_code,
      createdAt: row.created_at,
    }))

    console.log("[v0] 지출 데이터 조회:", spendings.length, "개")
    return spendings
  } catch (error) {
    console.error("[v0] 지출 데이터 조회 실패:", error)
    if (error instanceof Error && error.message.includes("profiles")) {
      console.error("[v0] PROFILES 테이블 에러 감지 - 이 앱은 profiles 테이블을 사용하지 않습니다")
      console.error("[v0] 에러 스택:", error.stack)
    }
    return []
  }
}

// 지출 데이터 저장 (deprecated - use addSpending instead)
export async function saveSpendings(newSpendings: Spending[]): Promise<void> {
  console.log("[v0] saveSpendings는 더 이상 사용되지 않습니다. addSpending을 사용하세요.")
}

// 새 지출 추가
export async function addSpending(spending: Omit<Spending, "id" | "createdAt">): Promise<Spending> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("spending")
      .insert({
        family_code: spending.familyCode,
        amount: spending.amount,
        description: spending.memo || "",
        category: spending.category,
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        spender: spending.userName,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] 지출 추가 에러:", error)
      throw error
    }

    const newSpending: Spending = {
      id: data.id,
      amount: data.amount,
      category: data.category,
      memo: data.description,
      userName: data.spender,
      familyCode: data.family_code,
      createdAt: data.created_at,
    }

    console.log("[v0] 새 지출 추가:", newSpending)
    return newSpending
  } catch (error) {
    console.error("[v0] 지출 추가 실패:", error)
    throw error
  }
}

// 지출 삭제
export async function deleteSpending(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("spending").delete().eq("id", id)

    if (error) {
      console.error("[v0] 지출 삭제 에러:", error)
      throw error
    }

    console.log("[v0] 지출 삭제:", id)
  } catch (error) {
    console.error("[v0] 지출 삭제 실패:", error)
    throw error
  }
}

// 가족 데이터 읽기
export async function getFamilies(): Promise<Family[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("families").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 가족 데이터 조회 에러:", error)
      return []
    }

    const families: Family[] = data.map((row) => ({
      code: row.family_code,
      users: [row.member1, row.member2],
      createdAt: row.created_at,
    }))

    console.log("[v0] 가족 데이터 조회:", families.length, "개")
    return families
  } catch (error) {
    console.error("[v0] 가족 데이터 조회 실패:", error)
    return []
  }
}

// 가족 데이터 저장 (deprecated - use createFamily instead)
export async function saveFamilies(newFamilies: Family[]): Promise<void> {
  console.log("[v0] saveFamilies는 더 이상 사용되지 않습니다. createFamily를 사용하세요.")
}

// 가족코드로 가족 찾기
export async function findFamily(code: string): Promise<Family | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("families").select("*").eq("family_code", code).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        console.log("[v0] 가족 찾기 결과:", code, "-> 없음")
        return null
      }
      console.error("[v0] 가족 찾기 에러:", error)
      return null
    }

    const family: Family = {
      code: data.family_code,
      users: [data.member1, data.member2],
      createdAt: data.created_at,
    }

    console.log("[v0] 가족 찾기 결과:", code, "-> 찾음")
    return family
  } catch (error) {
    console.error("[v0] 가족 찾기 실패:", error)
    return null
  }
}

// 새 가족 생성
export async function createFamily(code: string, userName: string): Promise<Family> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("families")
      .insert({
        family_code: code,
        member1: userName,
        member2: "", // Will be updated when second member joins
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] 가족 생성 에러:", error)
      throw error
    }

    const newFamily: Family = {
      code: data.family_code,
      users: [data.member1, data.member2].filter(Boolean),
      createdAt: data.created_at,
    }

    console.log("[v0] 새 가족 생성:", newFamily)
    return newFamily
  } catch (error) {
    console.error("[v0] 가족 생성 실패:", error)
    throw error
  }
}

// 가족 정보 업데이트
export async function updateFamily(family: Family): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("families")
      .update({
        member1: family.users[0] || "",
        member2: family.users[1] || "",
      })
      .eq("family_code", family.code)

    if (error) {
      console.error("[v0] 가족 정보 업데이트 에러:", error)
      throw error
    }

    console.log("[v0] 가족 정보 업데이트:", family)
  } catch (error) {
    console.error("[v0] 가족 정보 업데이트 실패:", error)
    throw error
  }
}

// 정기지출 데이터 읽기
export async function getRecurringSpending(): Promise<RecurringSpending[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("recurring_spending")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 정기지출 데이터 조회 에러:", error)
      return []
    }

    const recurringSpending: RecurringSpending[] = data.map((row) => ({
      id: row.id,
      amount: row.amount,
      category: row.category,
      memo: row.description,
      userName: "", // Will need to be handled differently
      familyCode: row.family_code,
      dayOfMonth: row.day_of_month,
      isActive: true, // Default to active
      createdAt: row.created_at,
    }))

    console.log("[v0] 정기지출 데이터 조회:", recurringSpending.length, "개")
    return recurringSpending
  } catch (error) {
    console.error("[v0] 정기지출 데이터 조회 실패:", error)
    return []
  }
}

// 정기지출 데이터 저장 (deprecated - use addRecurringSpending instead)
export async function saveRecurringSpending(newRecurringSpending: RecurringSpending[]): Promise<void> {
  console.log("[v0] saveRecurringSpending는 더 이상 사용되지 않습니다. addRecurringSpending을 사용하세요.")
}

// 새 정기지출 추가
export async function addRecurringSpending(
  recurring: Omit<RecurringSpending, "id" | "createdAt">,
): Promise<RecurringSpending> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("recurring_spending")
      .insert({
        family_code: recurring.familyCode,
        amount: recurring.amount,
        description: recurring.memo || "",
        category: recurring.category,
        day_of_month: recurring.dayOfMonth,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] 정기지출 추가 에러:", error)
      throw error
    }

    const newRecurring: RecurringSpending = {
      id: data.id,
      amount: data.amount,
      category: data.category,
      memo: data.description,
      userName: recurring.userName,
      familyCode: data.family_code,
      dayOfMonth: data.day_of_month,
      isActive: true,
      createdAt: data.created_at,
    }

    console.log("[v0] 새 정기지출 추가:", newRecurring)
    return newRecurring
  } catch (error) {
    console.error("[v0] 정기지출 추가 실패:", error)
    throw error
  }
}

// 정기지출 업데이트
export async function updateRecurringSpending(id: string, updates: Partial<RecurringSpending>): Promise<void> {
  try {
    const supabase = await createClient()
    const dbUpdates: any = {}

    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.memo !== undefined) dbUpdates.description = updates.memo
    if (updates.dayOfMonth !== undefined) dbUpdates.day_of_month = updates.dayOfMonth

    const { error } = await supabase.from("recurring_spending").update(dbUpdates).eq("id", id)

    if (error) {
      console.error("[v0] 정기지출 업데이트 에러:", error)
      throw error
    }

    console.log("[v0] 정기지출 업데이트:", id, updates)
  } catch (error) {
    console.error("[v0] 정기지출 업데이트 실패:", error)
    throw error
  }
}

// 정기지출 비활성화 (삭제)
export async function deactivateRecurringSpending(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("recurring_spending").delete().eq("id", id)

    if (error) {
      console.error("[v0] 정기지출 삭제 에러:", error)
      throw error
    }

    console.log("[v0] 정기지출 삭제:", id)
  } catch (error) {
    console.error("[v0] 정기지출 삭제 실패:", error)
    throw error
  }
}
