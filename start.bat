@echo off
chcp 65001 >nul
echo ========================================
echo   奇影内容运营管理平台 - 一键启动
echo ========================================
echo.

if not exist "backend\node_modules" (
    echo [!] 后端依赖未安装，正在安装...
    cd backend && call npm install && cd ..
    if errorlevel 1 goto error
)

if not exist "frontend\node_modules" (
    echo [!] 前端依赖未安装，正在安装...
    cd frontend && call npm install && cd ..
    if errorlevel 1 goto error
)

echo [OK] 依赖检查完成
echo.
echo 正在启动前后端服务...
echo.

call npx concurrently -n "后端,前端" -c "blue.bold,green.bold" ^
  "cd backend && npm run dev" ^
  "cd frontend && npm run dev"

goto end

:error
echo.
echo [ERROR] 依赖安装失败，请检查网络或手动执行 npm install
pause
exit /b 1

:end
pause
