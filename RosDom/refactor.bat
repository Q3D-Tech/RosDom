@echo off
set "main=C:\Programs\RosDom\app\src\main\java"
set "test=C:\Programs\RosDom\app\src\test\java"
set "androidTest=C:\Programs\RosDom\app\src\androidTest\java"

if exist "%main%\com\example\rosdom" (
    mkdir "%main%\ru\rosdom"
    xcopy "%main%\com\example\rosdom" "%main%\ru\rosdom" /s /i /y
    rmdir /S /Q "%main%\com"
)
if exist "%test%\com\example\rosdom" (
    mkdir "%test%\ru\rosdom"
    xcopy "%test%\com\example\rosdom" "%test%\ru\rosdom" /s /i /y
    rmdir /S /Q "%test%\com"
)
if exist "%androidTest%\com\example\rosdom" (
    mkdir "%androidTest%\ru\rosdom"
    xcopy "%androidTest%\com\example\rosdom" "%androidTest%\ru\rosdom" /s /i /y
    rmdir /S /Q "%androidTest%\com"
)
echo Done moving.
