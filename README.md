# spanner

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/moobydogdx-gmailcoms-projects/v0-spanner)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/palcou9TnWC)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## 🚀 로컬 개발 환경 설정

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# 개발 환경 설정
NODE_ENV=development
```

### 3. Supabase 프로젝트 설정
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 다음 테이블들을 생성해야 합니다:
   - `spending` (지출 내역)
   - `families` (가족 정보)
   - `recurring_spending` (정기지출)

### 4. 개발 서버 실행 (3가지 방법)

#### 방법 1: 자동 실행 스크립트 (권장)
```bash
# Windows 배치 파일
start-server.bat

# PowerShell 스크립트
.\start-server.ps1
```

#### 방법 2: 수동 실행
```bash
# 프로젝트 디렉토리로 이동
cd v0-spanner-han-yoon--main

# 서버 실행
pnpm dev
```

#### 방법 3: 절대 경로로 실행
```bash
# 어느 위치에서든 실행 가능
pnpm --prefix "C:\Users\GSENR\Desktop\가계부\v0-spanner-han-yoon--main" dev
```

## Deployment

Your project is live at:

**[https://vercel.com/moobydogdx-gmailcoms-projects/v0-spanner](https://vercel.com/moobydogdx-gmailcoms-projects/v0-spanner)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/palcou9TnWC](https://v0.app/chat/projects/palcou9TnWC)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## 📋 프로젝트 구조

```
v0-spanner-han-yoon--main/
├── app/                    # Next.js App Router
│   ├── api/               # API 엔드포인트
│   ├── login/             # 로그인 페이지
│   ├── history/           # 지출 내역 페이지
│   └── recurring/         # 정기지출 관리
├── components/            # React 컴포넌트
│   ├── ui/               # UI 컴포넌트 (shadcn/ui)
│   ├── spending-form.tsx # 지출 입력 폼
│   └── navigation.tsx    # 네비게이션
├── lib/                  # 유틸리티 및 타입
│   ├── types.ts          # TypeScript 타입 정의
│   ├── db.ts             # 데이터베이스 함수
│   └── supabase/         # Supabase 클라이언트
└── styles/               # CSS 스타일
```

## 🧪 테스트 방법

1. **환경 설정 완료 후**:
   ```bash
   pnpm dev
   ```

2. **브라우저에서 확인**:
   - http://localhost:3000 접속
   - 가족코드와 이름 입력하여 로그인
   - 지출 입력 및 조회 테스트

## ⚠️ 주의사항

- Supabase 프로젝트 설정이 완료되어야 정상 동작
- 환경 변수 파일(.env.local)은 반드시 생성해야 함
- 데이터베이스 스키마가 코드와 일치해야 함
