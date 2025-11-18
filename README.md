# SeguridadCiudadanaApp

Aplicación móvil para reporte y atención de incidentes de seguridad ciudadana. Incluye flujo de reporte geolocalizado, despacho a fuerzas de respuesta y seguimiento en tiempo real.

## Características
- Reporte de incidentes con texto, fotos y ubicación.
- Notificaciones y seguimiento de estado.
- Integración con Firebase/servicios backend.
- Perfiles de build con EAS (preview/producción).

## Requisitos
- Node.js 18+ y npm 9+
- Expo CLI y EAS CLI (opcional para builds)
- Android SDK/Emulador (para pruebas locales)

## Instalación
```bash
npm install
```

## Ejecución en desarrollo
```bash
npx expo start
# o
npm run start
```
- Escanea el QR con la app Expo Go o arranca un emulador Android.

## Tests
```bash
npm test
```
- Ver estructura de pruebas en `__tests__/` y configuración en `jest.config.js`.

## Builds y publicación
- Guía completa en `DEPLOYMENT.md`.
- Perfiles definidos en `eas.json` (p. ej. `preview`).

## Entorno
- Variables y perfiles documentados en `ENVIRONMENT.md`.
- Archivo `.env` y perfiles `.env.preview`/`.env.production` (no subir secretos).

## Estructura del proyecto
- `App.tsx`, `src/` (screens, hooks, services, navigation)
- `android/` (proyecto nativo y paquete `android.package`)
- `docs/` (diagramas y documentación)
- `__tests__/` (tests de UI, integración y unitarios)

## Documentación
- Índice en `docs/README.md`.
- Diagramas de proceso: `docs/diagramas_proceso_general.md` y `docs/diagramas_proceso.md`.
- Manual de usuario: `MANUAL_USUARIO.md`.
- Chatbot inteligente: `CHATBOT_INTELIGENTE.md`.
- Documentación de pruebas: `documentacion_pruebas.md`.
- Guía de colaboración: `CONTRIBUTING.md`.
- Seguridad del proyecto: `SECURITY.md`.
 - Requerimientos no funcionales: `docs/REQUERIMIENTOS_NO_FUNCIONALES.md`.

## Problemas comunes
- Conflictos de dependencias npm: revisar `package.json` y ejecutar `npm install`.
- Error EAS en "Install dependencies": resolver peer dependencies y reintentar.

## Licencia
- Define tu licencia en la raíz del repositorio si aplica.