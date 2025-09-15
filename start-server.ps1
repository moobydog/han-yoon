# Spanner 프로젝트 개발 서버 시작 스크립트
Write-Host "🚀 Spanner 프로젝트 개발 서버 시작..." -ForegroundColor Green
Write-Host ""

# 프로젝트 디렉토리로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# package.json 존재 확인
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "현재 디렉토리: $(Get-Location)" -ForegroundColor Yellow
    Read-Host "아무 키나 누르면 종료됩니다"
    exit 1
}

Write-Host "✅ 프로젝트 디렉토리 확인됨: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 의존성 설치 확인
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 의존성 설치 실패" -ForegroundColor Red
        Read-Host "아무 키나 누르면 종료됩니다"
        exit 1
    }
}

Write-Host "🎯 개발 서버 시작..." -ForegroundColor Cyan
Write-Host "🌐 URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "서버를 중지하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow
Write-Host ""

# 개발 서버 실행
pnpm dev
