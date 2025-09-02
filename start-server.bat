@echo off
echo 🚀 Spanner 프로젝트 개발 서버 시작...
echo.

REM 프로젝트 디렉토리로 이동
cd /d "%~dp0"

REM package.json 존재 확인
if not exist "package.json" (
    echo ❌ package.json을 찾을 수 없습니다.
    echo 현재 디렉토리: %CD%
    pause
    exit /b 1
)

echo ✅ 프로젝트 디렉토리 확인됨: %CD%
echo.

REM 의존성 설치 확인
if not exist "node_modules" (
    echo 📦 의존성 설치 중...
    pnpm install
    if errorlevel 1 (
        echo ❌ 의존성 설치 실패
        pause
        exit /b 1
    )
)

echo 🎯 개발 서버 시작...
echo 🌐 URL: http://localhost:3000
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

REM 개발 서버 실행
pnpm dev

pause
