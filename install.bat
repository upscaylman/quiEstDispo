@echo off
echo 🤝 Installation de Qui Est Dispo...
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé.
    echo Veuillez télécharger et installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Installer les dépendances
echo 📦 Installation des dépendances...
npm install

if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo.
echo ✅ Installation terminée avec succès!
echo.
echo 🚀 Pour démarrer l'application :
echo    npm start
echo.
echo 📱 L'application sera accessible sur http://localhost:3000
echo.
pause
