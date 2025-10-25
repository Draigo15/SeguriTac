# Entornos y Variables

Este documento explica cómo gestionar variables de entorno para desarrollo y builds en EAS.

## Archivos de entorno
- `.env` (desarrollo local)
- `.env.preview` (builds de prueba internas)
- `.env.production` (builds de producción)

No subas secretos al repositorio.

## Variables comunes (ejemplo)
```env
# Firebase (ejemplo)
EXPO_PUBLIC_FIREBASE_API_KEY=xxxxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:aaaaaaaaaaaaaaaa

# Notificaciones / otros servicios
EXPO_PUBLIC_NOTIFICATIONS_ENABLED=true
```

## Carga en la app
- `env.ts` lee variables expuestas (`EXPO_PUBLIC_*`).
- Usa `process.env.EXPO_PUBLIC_...` en el código.

## Perfiles de build (EAS)
- `preview`: usa `.env.preview`.
- `production`: usa `.env.production`.

## Buenas prácticas
- Prefiere `EXPO_PUBLIC_*` para variables usadas en el cliente.
- No expongas claves privadas; colócalas en el backend.
- Documenta cada variable usada por la app y su propósito.

## Ejemplo de uso en código
```ts
import { apiKey } from './env';
// o
const enabled = process.env.EXPO_PUBLIC_NOTIFICATIONS_ENABLED === 'true';
```