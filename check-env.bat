@echo off
chcp 65001 >nul
echo ========================================
echo   奇影内容运营管理平台 - 环境检查
echo ========================================
echo.

where node >nul 2>&1
if %errorlevel%==0 (
    echo [√] Node.js: 
    node -v
) else (
    echo [X] 未检测到Node.js，请先安装Node.js 16+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

where mysql >nul 2>&1
if %errorlevel%==0 (
    echo [√] MySQL客户端已检测到
) else (
    echo [!] 未检测到MySQL客户端，确保MySQL服务已启动
)

where redis-cli >nul 2>&1
if %errorlevel%==0 (
    echo [√] Redis客户端已检测到
) else (
    echo [!] 未检测到Redis客户端，确保Redis服务已启动
)

echo.
echo ========================================
echo   环境检查完成！
echo ========================================
pause
