@echo off
call gradlew.bat compileDebugKotlin > build_result.txt 2>&1
echo DONE >> build_result.txt
