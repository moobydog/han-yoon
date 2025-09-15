// 보안 유틸리티 함수들
import { CATEGORIES, INCOME_CATEGORIES } from "./types"

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * SQL 인젝션 방지를 위한 문자열 정리
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>\"'`;\\]/g, '') // 위험한 문자 제거
    .replace(/script/gi, '') // script 태그 제거
    .replace(/javascript/gi, '') // javascript 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .slice(0, 1000) // 최대 길이 제한
}

/**
 * 가족코드 검증 (3-20자 영숫자 허용)
 */
export function validateFamilyCode(code: string): boolean {
  if (typeof code !== 'string') return false
  return /^[0-9a-zA-Z]{3,20}$/.test(code.trim())
}

/**
 * 사용자 이름 검증
 */
export function validateUserName(name: string): boolean {
  if (typeof name !== 'string') return false
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= 20 && /^[가-힣a-zA-Z0-9\s]+$/.test(trimmed)
}

/**
 * 금액 검증
 */
export function validateAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) return false
  return amount > 0 && amount <= 100000000
}

/**
 * 날짜 검증 (YYYY-MM-DD 형식, 미래 날짜 불가)
 */
export function validateDate(dateString: string): boolean {
  if (typeof dateString !== 'string') return false
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false
  
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // 오늘 끝까지 허용
  
  return date instanceof Date && !isNaN(date.getTime()) && date <= today
}

/**
 * 카테고리 검증 (허용된 카테고리만)
 */
export function validateCategory(category: string, allowedCategories: readonly string[]): boolean {
  if (typeof category !== 'string') return false
  return allowedCategories.includes(category.trim())
}

/**
 * 메모 검증
 */
export function validateMemo(memo: string): boolean {
  if (typeof memo !== 'string') return true // 메모는 선택사항
  return memo.length <= 200
}

/**
 * ID 검증 (UUID 형식)
 */
export function validateId(id: string): boolean {
  if (typeof id !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Rate Limiting을 위한 간단한 토큰 버킷
 */
class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>()
  private readonly maxTokens: number
  private readonly refillRate: number

  constructor(maxTokens: number = 10, refillRate: number = 1) {
    this.maxTokens = maxTokens
    this.refillRate = refillRate
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const bucket = this.buckets.get(key) || { tokens: this.maxTokens, lastRefill: now }
    
    // 토큰 리필
    const timePassed = now - bucket.lastRefill
    const tokensToAdd = Math.floor(timePassed / 1000) * this.refillRate
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
    
    if (bucket.tokens > 0) {
      bucket.tokens--
      this.buckets.set(key, bucket)
      return true
    }
    
    this.buckets.set(key, bucket)
    return false
  }
}

export const rateLimiter = new RateLimiter(10, 1) // 10개 요청, 초당 1개 리필

/**
 * IP 주소 추출 (프록시 고려)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  return 'unknown'
}

/**
 * 로그 보안 (민감한 정보 제거)
 */
export function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) return data
  
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth']
  const sanitized = { ...data }
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key])
    }
  }
  
  return sanitized
}

/**
 * CSRF 토큰 생성
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * CSRF 토큰 검증
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  return token === sessionToken
}

// Re-export categories for convenience
export { CATEGORIES, INCOME_CATEGORIES }
