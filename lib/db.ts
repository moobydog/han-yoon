import { createClient } from "./supabase/server"
import type { Spending, Family, RecurringSpending, Income } from "./types"
import { 
  validateFamilyCode, 
  validateUserName, 
  validateAmount, 
  validateDate, 
  validateCategory, 
  validateMemo,
  sanitizeString,
  CATEGORIES,
  INCOME_CATEGORIES
} from "./security"

// 중복된 함수 제거 - security.ts에서 import

// 지출 데이터 읽기
export async function getSpendings(): Promise<Spending[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("spending").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 지출 데이터 조회 에러:", error)
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
      date: row.date,
    }))

    console.log("[v0] 지출 데이터 조회:", spendings.length, "개")
    return spendings
  } catch (error) {
    console.error("[v0] 지출 데이터 조회 실패:", error)
    return []
  }
}

// 가족코드로 지출 데이터 읽기 (DB에서 직접 필터링)
export async function getSpendingsByFamilyCodes(targetFamilyCodes: string[]): Promise<Spending[]> {
  try {
    if (!Array.isArray(targetFamilyCodes) || targetFamilyCodes.length === 0) {
      return []
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("spending")
      .select("*")
      .in("family_code", targetFamilyCodes)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 지출 데이터 조회 에러:", error)
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
      date: row.date,
    }))

    console.log("[v0] 지출 데이터 조회 (DB 필터):", spendings.length, "개")
    return spendings
  } catch (error) {
    console.error("[v0] 지출 데이터 조회 실패 (DB 필터):", error)
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
    // 보안 검증 강화
    if (!validateFamilyCode(spending.familyCode)) {
      throw new Error("유효하지 않은 가족코드입니다")
    }
    if (!validateAmount(spending.amount)) {
      throw new Error("금액은 1원 이상 1억원 이하여야 합니다")
    }
    if (!validateCategory(spending.category, CATEGORIES)) {
      throw new Error("유효하지 않은 카테고리입니다")
    }
    if (!validateUserName(spending.userName)) {
      throw new Error("유효하지 않은 사용자 이름입니다")
    }
    if (spending.memo && !validateMemo(spending.memo)) {
      throw new Error("메모는 200자 이하여야 합니다")
    }
    if (spending.date && !validateDate(spending.date)) {
      throw new Error("유효하지 않은 날짜입니다")
    }

    console.log("[v0] addSpending - 받은 날짜:", spending.date)
    
    // 날짜 처리 로직 개선
    let finalDate: string
    if (spending.date && spending.date.trim() !== '') {
      finalDate = spending.date.trim()
      console.log("[v0] 사용자 지정 날짜 사용:", finalDate)
    } else {
      finalDate = new Date().toISOString().split("T")[0]
      console.log("[v0] 기본 날짜 사용:", finalDate)
    }
    
    const insertData = {
      family_code: sanitizeString(spending.familyCode),
      amount: spending.amount,
      description: spending.memo ? sanitizeString(spending.memo) : "",
      category: sanitizeString(spending.category),
      date: finalDate, // YYYY-MM-DD format
      spender: sanitizeString(spending.userName),
    }
    console.log("[v0] addSpending - 삽입할 데이터:", insertData)
    
    // RLS 우회를 위해 service_role 키 사용 시도
    let supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("[v0] service_role 키 사용")
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    } else {
      console.log("[v0] 일반 클라이언트 사용")
      supabase = await createClient()
    }
    
    const { data, error } = await supabase
      .from("spending")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] 지출 추가 에러:", error)
      throw error
    }

    console.log("[v0] 데이터베이스에서 반환된 데이터:", data)
    console.log("[v0] 데이터베이스에서 반환된 날짜:", data.date)

    const newSpending: Spending = {
      id: data.id,
      amount: data.amount,
      category: data.category,
      memo: data.description,
      userName: data.spender,
      familyCode: data.family_code,
      createdAt: data.created_at,
      date: data.date,
    }

    console.log("[v0] 새 지출 추가:", newSpending)
    return newSpending
  } catch (error) {
    console.error("[v0] 지출 추가 실패:", error)
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
    // 입력값 유효성 검사
    if (!code || code.trim().length === 0) {
      throw new Error("가족코드를 입력해주세요")
    }
    if (!userName || userName.trim().length === 0) {
      throw new Error("사용자 이름을 입력해주세요")
    }
    if (code.trim().length < 3) {
      throw new Error("가족코드는 3자 이상이어야 합니다")
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("families")
      .insert({
        family_code: code.trim(),
        member1: userName.trim(),
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
    
    // 사용자 배열이 비어있지 않은지 확인
    if (!family.users || family.users.length === 0) {
      throw new Error("사용자 정보가 없습니다")
    }

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
      userName: row.spender || "가족", // spender 필드가 있으면 사용, 없으면 기본값
      familyCode: row.family_code,
      dayOfMonth: row.day_of_month,
      isActive: row.is_active || true, // is_active 필드가 있으면 사용, 없으면 기본값
      createdAt: row.created_at,
      lastProcessed: row.last_processed, // last_processed 필드 추가
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
    console.log("[v0] addRecurringSpending 시작:", recurring)
    
    // 가족 확인/생성 로직 단순화
    console.log("[v0] 가족 확인/생성 생략 - 직접 정기지출 저장 시도")
    
    const insertData = {
      family_code: recurring.familyCode,
      amount: recurring.amount,
      description: recurring.memo || "",
      category: recurring.category,
      day_of_month: recurring.dayOfMonth,
      spender: recurring.userName,
      is_active: true, // 명시적으로 추가
    }
    console.log("[v0] 정기지출 삽입 데이터:", insertData)
    
    // 추가 디버깅: Supabase 클라이언트 정보 확인
    console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[v0] Service Role Key 존재:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const { data, error } = await supabase
      .from("recurring_spending")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[v0] 정기지출 추가 에러:", error)
      console.error("[v0] 에러 상세:", JSON.stringify(error, null, 2))
      throw error
    }

    console.log("[v0] 정기지출 데이터베이스 반환:", data)

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
    if (updates.lastProcessed !== undefined) dbUpdates.last_processed = updates.lastProcessed

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

// 지출 삭제 - 보안을 고려한 방법
export async function deleteSpending(id: string): Promise<void> {
  try {
    console.log("[v0] 지출 삭제 시작:", id)
    
    // Supabase 클라이언트 사용 (RLS 정책 적용)
    const supabase = await createClient()
    
    // 삭제 전 데이터 존재 확인
    const { data: existingData, error: checkError } = await supabase
      .from("spending")
      .select("id, family_code")
      .eq("id", id)
      .single()
    
    if (checkError || !existingData) {
      console.error("[v0] 삭제할 데이터가 존재하지 않습니다:", checkError)
      throw new Error("삭제할 데이터가 존재하지 않습니다")
    }
    
    console.log("[v0] 삭제할 데이터 확인:", existingData)
    
    // 삭제 실행
    const { data: deleteData, error } = await supabase
      .from("spending")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("[v0] 지출 삭제 에러:", error)
      throw error
    }

    console.log("[v0] 지출 삭제 성공:", deleteData)
    
    if (deleteData && deleteData.length > 0) {
      console.log("[v0] 실제로 삭제된 데이터:", deleteData.length, "개")
    } else {
      console.log("[v0] 삭제된 데이터가 없습니다.")
    }
    
  } catch (error) {
    console.error("[v0] 지출 삭제 실패:", error)
    throw error
  }
}

// 수입 데이터 읽기
export async function getIncomes(): Promise<Income[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("income").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 수입 데이터 조회 에러:", error)
      return []
    }

    const incomes: Income[] = data.map((row) => ({
      id: row.id,
      amount: row.amount,
      category: row.category,
      memo: row.description,
      userName: row.earner,
      familyCode: row.family_code,
      createdAt: row.created_at,
      date: row.date,
    }))

    console.log("[v0] 수입 데이터 조회:", incomes.length, "개")
    return incomes
  } catch (error) {
    console.error("[v0] 수입 데이터 조회 실패:", error)
    return []
  }
}

// 가족코드로 수입 데이터 읽기 (DB에서 직접 필터링)
export async function getIncomesByFamilyCodes(targetFamilyCodes: string[]): Promise<Income[]> {
  try {
    if (!Array.isArray(targetFamilyCodes) || targetFamilyCodes.length === 0) {
      return []
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("income")
      .select("*")
      .in("family_code", targetFamilyCodes)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 수입 데이터 조회 에러:", error)
      return []
    }

    const incomes: Income[] = data.map((row) => ({
      id: row.id,
      amount: row.amount,
      category: row.category,
      memo: row.description,
      userName: row.earner,
      familyCode: row.family_code,
      createdAt: row.created_at,
      date: row.date,
    }))

    console.log("[v0] 수입 데이터 조회 (DB 필터):", incomes.length, "개")
    return incomes
  } catch (error) {
    console.error("[v0] 수입 데이터 조회 실패 (DB 필터):", error)
    return []
  }
}

// 새 수입 추가
export async function addIncome(income: Omit<Income, "id" | "createdAt">): Promise<Income> {
  try {
    // 보안 검증
    if (!validateFamilyCode(income.familyCode)) {
      throw new Error("유효하지 않은 가족코드입니다")
    }
    if (!validateAmount(income.amount)) {
      throw new Error("금액은 10원 단위로 1원 이상 1억원 이하여야 합니다")
    }
    if (!income.category || income.category.trim().length === 0) {
      throw new Error("카테고리를 선택해주세요")
    }
    if (!income.userName || income.userName.trim().length === 0) {
      throw new Error("사용자 이름이 필요합니다")
    }
    if (income.userName.length > 20) {
      throw new Error("사용자 이름은 20자 이하여야 합니다")
    }
    if (income.memo && income.memo.length > 200) {
      throw new Error("메모는 200자 이하여야 합니다")
    }
    if (income.date && !validateDate(income.date)) {
      throw new Error("유효하지 않은 날짜입니다")
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("income")
      .insert({
        family_code: sanitizeString(income.familyCode),
        amount: income.amount,
        description: sanitizeString(income.memo || ""),
        category: sanitizeString(income.category),
        date: income.date || new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        earner: sanitizeString(income.userName),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] 수입 추가 에러:", error)
      throw error
    }

    const newIncome: Income = {
      id: data.id,
      amount: data.amount,
      category: data.category,
      memo: data.description,
      userName: data.earner,
      familyCode: data.family_code,
      createdAt: data.created_at,
      date: data.date,
    }

    console.log("[v0] 새 수입 추가:", newIncome)
    return newIncome
  } catch (error) {
    console.error("[v0] 수입 추가 실패:", error)
    throw error
  }
}

// 수입 삭제
export async function deleteIncome(id: string): Promise<void> {
  try {
    console.log("[v0] 수입 삭제 시작:", id)
    
    // Supabase 클라이언트 사용 (RLS 정책 적용)
    const supabase = await createClient()
    
    // 삭제 전 데이터 존재 확인
    const { data: existingData, error: checkError } = await supabase
      .from("income")
      .select("id, family_code")
      .eq("id", id)
      .single()
    
    if (checkError || !existingData) {
      console.error("[v0] 삭제할 데이터가 존재하지 않습니다:", checkError)
      throw new Error("삭제할 데이터가 존재하지 않습니다")
    }
    
    console.log("[v0] 삭제할 데이터 확인:", existingData)
    
    const { data: deleteData, error } = await supabase
      .from("income")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      console.error("[v0] 수입 삭제 에러:", error)
      throw error
    }

    console.log("[v0] 수입 삭제 성공:", deleteData)
    
    if (deleteData && deleteData.length > 0) {
      console.log("[v0] 실제로 삭제된 데이터:", deleteData.length, "개")
    } else {
      console.log("[v0] 삭제된 데이터가 없습니다.")
    }
  } catch (error) {
    console.error("[v0] 수입 삭제 실패:", error)
    throw error
  }
}
