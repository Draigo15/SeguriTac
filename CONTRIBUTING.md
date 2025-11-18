# Guía de Contribución – SeguridadCiudadanaApp

Gracias por tu interés en contribuir. Esta guía explica cómo preparar tu entorno, el estilo de código, la convención de commits y el proceso de Pull Request para mantener un flujo de trabajo ordenado y seguro.

## Alcance
- Este documento aplica al proyecto móvil `SeguridadCiudadanaApp` (Expo/React Native). 
- Para el backend, consulta `backend/CONTRIBUTING.md` (si existe) o la documentación del repositorio correspondiente.

## Requisitos previos
- `Node.js 18+` y `npm 9+`
- `Expo CLI` y `EAS CLI` (para builds)
- Emulador Android o dispositivo físico
- Cuenta de GitHub con acceso al repo

## Configuración local
1. Clona el repositorio (carpeta `SeguridadCiudadanaApp`).
2. Instala dependencias: `npm install`.
3. Copia `.env.example` (si existe) a `.env` y completa variables requeridas (ver `ENVIRONMENT.md`).
4. Inicia desarrollo: `npx expo start`.

## Estructura y estilos
- Código en `src/` organizado por `components/`, `screens/`, `services/`, `hooks/`, `navigation/`.
- Mantén nombres descriptivos y consistentes.
- Prefiere funciones puras y hooks reutilizables.
- Evita duplicación; extrae utilidades a `src/utils/`.

## Lint y formato
- Ejecuta `npm run lint` y `npm run format` (si están disponibles).
- No comitees código con errores de lint.

## Pruebas
- Ejecuta `npm test` antes de abrir un PR.
- Añade pruebas unitarias/integración cuando agregues funcionalidades críticas.
- Mantén cubiertas rutas felices y casos de error básicos.

## Commits y ramas
- Usa Conventional Commits:
  - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
  - Ejemplo: `feat(report): agregar filtro por fecha`
- Ramas recomendadas:
  - `feature/<breve-descripcion>`
  - `fix/<breve-descripcion>`
  - `docs/<breve-descripcion>`

## Pull Requests
Antes de abrir un PR, verifica:
- [ ] Compila y corre localmente sin errores.
- [ ] Pruebas pasan (`npm test`).
- [ ] Lint sin errores.
- [ ] Actualizaste documentación si aplica (`README.md`, `docs/`, etc.).
- [ ] Cambios se limitan al alcance del PR.
- Describe el propósito, alcance y cómo probar.

## Seguridad
- No subas secretos ni credenciales (usa `.env`, ver `ENVIRONMENT.md`).
- Revisa `SECURITY.md` para prácticas recomendadas (permisos, almacenamiento, builds).

## Releases y builds
- Para generar APK/AAB, consulta `DEPLOYMENT.md` y usa `eas build`.
- Actualiza `CHANGELOG.md` con cambios relevantes.

## Comunicación
- Usa Issues para reportar bugs y solicitar features.
- Usa discusiones/PR para feedback y revisiones.

¡Gracias por contribuir y ayudar a mejorar la seguridad ciudadana con tecnología!