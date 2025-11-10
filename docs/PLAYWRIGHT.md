# Playwright

1. Inicia el servidor (`npm run dev` o URL desplegada) y asegúrate de tener un usuario admin disponible.
2. Ejecuta `npx playwright codegen --save-storage=playwright/.auth/admin.json $PLAYWRIGHT_BASE_URL/login`.
3. Inicia sesión manualmente durante el `codegen` y cierra la ventana; el archivo `playwright/.auth/admin.json` quedará con las cookies.
4. En CI, define `PLAYWRIGHT_BASE_URL` apuntando al entorno preview/prod para que los tests usen la misma URL.
