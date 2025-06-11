@echo off
echo 🚀 Démarrage de Qui Est Dispo...
echo 💡 Dans PowerShell, utilisez: .\start.bat
echo 💡 Pour arrêter, utilisez: .\stop.bat
echo.

REM Arrêter les processus Node.js existants
echo 🛑 Arrêt des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
)

echo 🌐 Démarrage du serveur de développement...
echo L'application sera accessible sur http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo OU utilisez .\stop.bat dans un autre terminal
echo.

npm start
