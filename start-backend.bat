@echo off
chcp 65001 >nul
title 职擎招聘管理平台 - 后端服务

echo ========================================
echo    职擎招聘管理平台 - 后端启动
echo ========================================
echo.

cd /d %~dp0backend

echo 正在启动后端服务...
echo 端口: 8080
echo.

mvn spring-boot:run

if %errorlevel% neq 0 (
    echo.
    echo [错误] 启动失败，请检查错误信息
    pause
)
