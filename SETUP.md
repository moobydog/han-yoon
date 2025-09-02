# 🚀 Spanner 프로젝트 설정 가이드

## 📋 사전 요구사항

- Node.js 18+ 설치
- pnpm 설치 (`npm install -g pnpm`)
- Supabase 계정

## 🔧 단계별 설정

### 1단계: 의존성 설치
```bash
pnpm install
```

### 2단계: Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름: `spanner` (또는 원하는 이름)
4. 데이터베이스 비밀번호 설정 (기억해두세요!)
5. 지역 선택 (가까운 지역 선택)
6. "Create new project" 클릭

### 3단계: 데이터베이스 스키마 설정

1. Supabase 대시보드에서 "SQL Editor" 클릭
2. `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
3. "Run" 클릭하여 실행

### 4단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 개발 환경 설정
NODE_ENV=development
```

**Supabase URL과 API 키 찾는 방법:**
1. Supabase 대시보드 → Settings → API
2. Project URL 복사 → `NEXT_PUBLIC_SUPABASE_URL`에 붙여넣기
3. anon public 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 붙여넣기

### 5단계: 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 접속

## 🧪 테스트 방법

### 기본 테스트
1. 가족코드: `FAMILY2025`
2. 이름: `민수` 또는 `영희`
3. 로그인 후 지출 입력 테스트

### 지출 입력 테스트
1. 금액: `15000`
2. 카테고리: `식비 - 외식`
3. 메모: `점심 식사`
4. "저장" 클릭

### 정기지출 테스트
1. "정기지출" 탭 클릭
2. 정기지출 정보 입력
3. 매월 반영될 날짜 설정

## 🔍 문제 해결

### 일반적인 오류들

#### 1. "Supabase client not found" 오류
- `.env.local` 파일이 올바르게 생성되었는지 확인
- 환경 변수 이름이 정확한지 확인

#### 2. "Table doesn't exist" 오류
- `supabase-schema.sql`이 올바르게 실행되었는지 확인
- Supabase 대시보드에서 테이블 존재 여부 확인

#### 3. "Permission denied" 오류
- RLS 정책이 올바르게 설정되었는지 확인
- Supabase 대시보드 → Authentication → Policies 확인

#### 4. 개발 서버 실행 오류
- Node.js 버전 확인 (18+ 필요)
- `pnpm install` 재실행
- `node_modules` 삭제 후 재설치

### 로그 확인 방법

1. 브라우저 개발자 도구 → Console
2. 터미널에서 Next.js 로그 확인
3. Supabase 대시보드 → Logs

## 📱 기능 테스트 체크리스트

- [ ] 로그인 페이지 접속
- [ ] 가족코드/이름 입력 및 로그인
- [ ] 메인 페이지 로딩
- [ ] 지출 입력 폼 표시
- [ ] 지출 저장 및 확인
- [ ] 지출 내역 조회
- [ ] 정기지출 등록
- [ ] 네비게이션 메뉴 동작
- [ ] 반응형 디자인 확인

## 🚀 배포 준비

### Vercel 배포
1. GitHub 저장소와 연결
2. 환경 변수 설정 (Vercel 대시보드에서)
3. 자동 배포 활성화

### 환경 변수 (프로덕션)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NODE_ENV=production
```

## 📞 지원

문제가 발생하면:
1. 이 가이드의 문제 해결 섹션 확인
2. Supabase 공식 문서 참조
3. Next.js 공식 문서 참조
4. GitHub Issues에 문제 보고
