// 클라이언트 사이드 보안 유틸리티

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return ''
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * 사용자 입력 정리
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>\"'`;\\]/g, '') // 위험한 문자 제거
    .replace(/script/gi, '') // script 태그 제거
    .replace(/javascript/gi, '') // javascript 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .slice(0, 1000) // 최대 길이 제거
}

/**
 * 금액 포맷팅 (XSS 방지)
 */
export function formatAmount(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0'
  return amount.toLocaleString('ko-KR')
}

/**
 * 안전한 innerHTML 설정
 */
export function setSafeInnerHTML(element: HTMLElement, content: string): void {
  element.textContent = content // textContent는 자동으로 이스케이프됨
}

/**
 * URL 검증
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 로컬스토리지 안전한 접근
 */
export function safeLocalStorage() {
  return {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    },
    removeItem: (key: string): boolean => {
      try {
        localStorage.removeItem(key)
        return true
      } catch {
        return false
      }
    }
  }
}

/**
 * 세션 만료 체크
 */
export function isSessionExpired(): boolean {
  const lastActivity = localStorage.getItem('lastActivity')
  if (!lastActivity) return true
  
  const now = Date.now()
  const lastTime = parseInt(lastActivity, 10)
  const sessionTimeout = 30 * 60 * 1000 // 30분
  
  return (now - lastTime) > sessionTimeout
}

/**
 * 세션 갱신
 */
export function updateSession(): void {
  localStorage.setItem('lastActivity', Date.now().toString())
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * CSRF 토큰 생성 (클라이언트)
 */
export function generateClientToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 입력값 길이 제한
 */
export function limitInputLength(input: string, maxLength: number): string {
  if (typeof input !== 'string') return ''
  return input.slice(0, maxLength)
}

/**
 * 숫자만 허용
 */
export function numbersOnly(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[^0-9]/g, '')
}

/**
 * 한글과 영문만 허용
 */
export function koreanEnglishOnly(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[^가-힣a-zA-Z\s]/g, '')
}
