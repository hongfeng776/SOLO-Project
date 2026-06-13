@echo off
chcp 65001 >nul
title 职擎招聘管理平台 - 前端服务

echo ========================================
echo    职擎招聘管理平台 - 前端启动
echo ========================================
echo.

cd /d %~dp0frontend

if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo 依赖安装完成！
    echo.
)

echo 正在启动前端开发服务...
echo 端口: 3000
echo.

npm run dev
