// 스패너 프로젝트 타입 정의

export interface User {
  name: string
  familyCode: string
}

export interface Spending {
  id: string
  amount: number
  category: string
  memo?: string
  userName: string
  familyCode: string
  createdAt: string
  isRecurring?: boolean // 정기지출 여부
  recurringId?: string // 정기지출 그룹 ID
}

export interface RecurringSpending {
  id: string
  amount: number
  category: string
  memo?: string
  userName: string
  familyCode: string
  dayOfMonth: number // 매월 몇일에 반영할지 (1-31)
  isActive: boolean // 활성화 상태
  createdAt: string
  lastProcessed?: string // 마지막 처리 날짜
}

export interface Family {
  code: string
  users: string[]
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const CATEGORIES = [
  // 식비
  "식비 - 식료품",
  "식비 - 외식",
  "식비 - 카페/음료",
  "식비 - 배달음식",
  "식비 - 간식/디저트",

  // 교통비
  "교통비 - 대중교통",
  "교통비 - 택시",
  "교통비 - 주유비",
  "교통비 - 주차비",
  "교통비 - 톨게이트",

  // 카페/음료 (독립 카테고리)
  "카페 - 커피",
  "카페 - 차/음료",
  "카페 - 디저트",
  "카페 - 브런치",

  // 생활용품
  "생활용품 - 일용품",
  "생활용품 - 청소용품",
  "생활용품 - 화장품",
  "생활용품 - 세탁용품",

  // 쇼핑
  "쇼핑 - 온라인쇼핑",
  "쇼핑 - 백화점",
  "쇼핑 - 마트",
  "쇼핑 - 편의점",

  // 금융
  "금융 - 보험료",
  "금융 - 적금/투자",
  "금융 - 대출이자",
  "금융 - 카드연회비",
  "금융 - 은행수수료",
  "금융 - 세금",

  // 의료비
  "의료비 - 병원비",
  "의료비 - 약값",
  "의료비 - 건강검진",
  "의료비 - 치과",

  // 문화생활
  "문화생활 - 영화",
  "문화생활 - 공연",
  "문화생활 - 여행",
  "문화생활 - 취미",

  // 의류
  "의류 - 옷",
  "의류 - 신발",
  "의류 - 가방",
  "의류 - 액세서리",

  // 주거비
  "주거비 - 월세/관리비",
  "주거비 - 전기요금",
  "주거비 - 가스요금",
  "주거비 - 수도요금",
  "주거비 - 인터넷",

  // 교육
  "교육 - 학원비",
  "교육 - 도서",
  "교육 - 온라인강의",

  // 기타
  "기타",
] as const

export type Category = (typeof CATEGORIES)[number]

export const getCategoryGroup = (category: string): string => {
  if (category.startsWith("식비")) return "식비"
  if (category.startsWith("교통비")) return "교통비"
  if (category.startsWith("카페")) return "카페"
  if (category.startsWith("쇼핑")) return "쇼핑"
  if (category.startsWith("생활용품")) return "생활용품"
  if (category.startsWith("금융")) return "금융"
  if (category.startsWith("의료비")) return "의료비"
  if (category.startsWith("문화생활")) return "문화생활"
  if (category.startsWith("의류")) return "의류"
  if (category.startsWith("주거비")) return "주거비"
  if (category.startsWith("교육")) return "교육"
  return "기타"
}
