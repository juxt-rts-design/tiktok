@echo off
echo 🚀 Démarrage de TikTok Juxt_RTS pour mobile...
echo.
echo 📱 Votre application sera accessible depuis votre téléphone à :
echo    http://192.168.1.67:5173
echo.
echo 🔧 Assurez-vous que votre PC et téléphone sont sur le même Wi-Fi !
echo.

echo 🔄 Démarrage du backend...
start "Backend" cmd /k "cd Backend && npm run dev"

echo ⏳ Attente du démarrage du backend...
timeout /t 5 /nobreak > nul

echo 🔄 Démarrage du frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ Les deux serveurs sont en cours de démarrage...
echo.
echo 📱 Testez la connectivité :
echo    - PC: http://localhost:5173
echo    - Mobile: http://192.168.1.67:5173
echo.
echo 🔍 Pour tester la connectivité, exécutez: test-connection.bat
echo.
pause
