@echo off
cd /d "%~dp0"
call backend\monenv\Scripts\activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
