# Despliegue y Builds (EAS)

Guía para construir y distribuir la app Android con EAS.

## Prerrequisitos
- Cuenta en Expo/EAS y haber iniciado sesión (`npx expo login`).
- `eas-cli` instalado localmente o vía `npx`.
- `eas.json` configurado (perfil `preview` existente; producción opcional).

## Build Android (APK para pruebas internas)
```bash
npx eas build -p android --profile preview
```
- EAS sube el proyecto, instala dependencias y compila.
- Obtendrás un enlace para seguir el progreso y descargar el APK.

## Build Android (AAB para Play Store)
```bash
npx eas build -p android --profile production
```
- Requiere credenciales firmadas. EAS puede gestionar keystore remoto.

## Credenciales y paquete Android
- Con carpeta `android/`, el `android.package` se toma del proyecto nativo.
- EAS usa credenciales remotas por defecto. Revisa el `eas credentials` si necesitas importar/exportar.

## Variables de entorno
- Define variables en `.env.preview` y `.env.production`.
- Carga y uso detallados en `ENVIRONMENT.md`.

## Distribución
- Sube el AAB a Play Console para publicación.
- Para testers internos, distribuye el APK del perfil `preview`.

## Troubleshooting
- Error `ERESOLVE`/peer dependencies en "Install dependencies": alinear versiones en `package.json`, ejecutar `npm install` y reintentar el build.
- Falla por caché: intenta `--clear-cache` o actualizar `eas-cli`.
- Revisar logs: usa el enlace del build que entrega EAS para ver etapas y errores.

## Comandos útiles
```bash
npx eas build:status               # Estado de builds
npx eas build:list                 # Lista de builds
npx eas submit -p android          # Envío a Play Store (AAB)
```