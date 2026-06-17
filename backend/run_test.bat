@echo off
cd /d e:\SOLO-Project\annotation-project-19\backend
node test_api.mjs > test_output.txt 2>&1
type test_output.txt
