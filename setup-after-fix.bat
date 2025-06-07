@echo off
echo ========================================
echo Setup Qui Est Dispo - Post Bug Fix
echo ========================================
echo.

echo 1. Installation des dependances...
call npm install

echo.
echo 2. Creation du fichier .env.local...
if not exist .env.local (
    copy .env.example .env.local
    echo .env.local cree. Veuillez ajouter vos cles Firebase!
) else (
    echo .env.local existe deja
)

echo.
echo 3. Verification des images PWA...
if not exist public\logo192.png (
    echo ATTENTION: public\logo192.png manquant!
)
if not exist public\logo512.png (
    echo ATTENTION: public\logo512.png manquant!
)

echo.
echo ========================================
echo Configuration terminee!
echo.
echo Prochaines etapes:
echo 1. Editez .env.local avec vos cles Firebase
echo 2. Ajoutez les logos manquants si necessaire
echo 3. Lancez: npm start
echo ========================================
pause
