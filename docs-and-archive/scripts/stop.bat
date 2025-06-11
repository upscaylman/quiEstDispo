@echo off
echo 🛑 Arrêt de Qui Est Dispo...
echo.

echo 📦 Arrêt des processus Node.js...
taskkill /F /IM node.exe >nul 2>&1

echo ✅ Tous les processus ont été arrêtés !
echo.
pause 