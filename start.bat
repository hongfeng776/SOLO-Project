@echo off
chcp 65001 >nul
title 职擎招聘管理平台 - 一键启动

echo ========================================
echo    职擎招聘管理平台 - 一键启动脚本
echo ========================================
echo.

echo [1/3] 检查环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo [警告] 未检测到 Maven，请确保已配置 Maven 环境
    echo        或将 mvn 命令加入 PATH 环境变量
)

echo.
echo [2/3] 启动后端服务...
echo       端口: 8080
start "职擎招聘-后端" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

timeout /t 3 /nobreak >nul

echo.
echo [3/3] 启动前端服务...
echo       端口: 3000
start "职擎招聘-前端" cmd /k "cd /d %~dp0frontend && if not exist node_modules (npm install) else (npm run dev)"

echo.
echo ========================================
echo    启动完成！
echo    前端地址: http://localhost:3000
echo    后端地址: http://localhost:8080
echo ========================================
echo.
echo 默认账号: admin / admin
echo.
echo 按任意键退出本窗口（服务将继续运行）...
pause >nul
