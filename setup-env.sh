#!/bin/bash

# Supabase 환경변수 설정
echo "NEXT_PUBLIC_SUPABASE_URL=https://slzmedgobojxehtajjxw.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsem1lZGdvYm9qeGVodGFqanh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwODIxOTcsImV4cCI6MjA3MTY1ODE5N30.DC4xkfK6Coe6Q7etl30Yqd4eKES9fXVXCtFuOA2uWDM" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsem1lZGdvYm9qeGVodGFqanh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA4MjE5NywiZXhwIjoyMDcxNjU4MTk3fQ.YOUR_SERVICE_ROLE_KEY_HERE" >> .env.local
echo "CUSTOM_KEY=your-custom-security-key" >> .env.local

echo "✅ 환경변수 파일이 생성되었습니다."
echo "⚠️  SUPABASE_SERVICE_ROLE_KEY는 실제 서비스 키로 교체해야 합니다."
