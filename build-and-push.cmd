@echo off
set IMAGE=time4action/t4a-partner-portal-ui

docker build . -t %IMAGE%
IF ERRORLEVEL 1 (
    echo Docker build failed
    exit /b 1
)

docker push %IMAGE%
IF ERRORLEVEL 1 (
    echo Docker push failed
    exit /b 1
)

echo Build and push completed successfully
