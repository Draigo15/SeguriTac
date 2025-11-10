# Guía de Tests de Aceptación RNF (1–10)

Esta guía resume qué valida cada test de aceptación de Requerimientos No Funcionales (RNF), cómo lo hace y cómo ejecutarlos todos juntos.

## Ejecución
- Ejecutar todos los RNF de aceptación:
  - `npx jest --testPathPatterns="rnf.*acceptance" --runInBand --verbose`
- Ejecutar un RNF específico (ej. RNF‑5):
  - `npx jest __tests__/rnf5.acceptance.test.js --runInBand --verbose`

## Mapa de Cobertura
- **RNF‑1 Desempeño** (`__tests__/rnf1.acceptance.test.js`)
  - Valida que acciones clave respondan ≤ 3000 ms: envío de reporte, carga de notificaciones, carga inicial del mapa.
  - Usa instrumentación en `src/utils/metrics.ts` y mocks para evitar costos de render pesado.

- **RNF‑2 Seguridad de Datos** (`__tests__/rnf2.acceptance.test.js`)
  - Verifica que datos sensibles no se registren accidentalmente y que sanitización básica se cumpla donde aplica.

- **RNF‑3 Usabilidad** (`__tests__/rnf3.acceptance.test.js`)
  - Comprueba CTA visibles y mensajes de validación claros en pantallas principales (login, reporte) y estados vacíos.

- **RNF‑4 Mantenibilidad** (`__tests__/rnf4.acceptance.test.js`)
  - Revisa estructura modular mínima, presencia de configuraciones (TypeScript/jest) y tamaño mínimo de la suite de pruebas.

- **RNF‑5 Confiabilidad** (`__tests__/rnf5.acceptance.test.js`)
  - Garantiza degradación offline sin crash y recuperación tras reconexión con feedback (error/éxito).

- **RNF‑6 Portabilidad** (`__tests__/rnf6.acceptance.test.js`)
  - Asegura `minSdkVersion >= 26` (Android 8+ / API 26) en configuración nativa.

- **RNF‑7 Escalabilidad** (`__tests__/rnf7.acceptance.test.js`)
  - Valida filtrado por zona en `exportService` sin acoplar consultas ni forzar zona cuando no se especifica.

- **RNF‑8 Tolerancia a Errores** (`__tests__/rnf8.acceptance.test.js`)
  - Comprueba reintentos controlados ante `ERR_ABORTED` y delegación de errores no transitorios en `robustOnSnapshot`.

- **RNF‑9 Seguridad de Sesión** (`__tests__/rnf9.acceptance.test.js` y `backend/__tests__/rnf9.session.acceptance.test.js`)
  - Cliente: elimina claves sensibles con `secureStorage.removeItem`; verifica claves definidas en `appConfig`.
  - Backend: valida emisión, expiración y revocación de token opaco, con respuestas consistentes (`401` tras revocación/expiración).

- **RNF‑10 Accesibilidad** (`__tests__/rnf10.accessibility.acceptance.test.js`)
  - Confirma roles y labels accesibles en CTAs clave (p. ej., `RoleSelectorScreen`).

## Referencias Clave
- Documento de RNF: `docs/REQUERIMIENTOS_NO_FUNCIONALES.md` (detalla criterios, mecanismos y enlaces a fuentes).
- Configuración de pruebas: `jest.config.js` y `jest.setup.js`.
- Instrumentación de métricas: `src/utils/metrics.ts`.
- Servicios implicados: `src/services/firestoreWrapper.ts`, `src/services/secureStorage.ts`, `src/services/exportService.ts`.

## Evidencia de Ejecución
- Los 10 suites RNF se ejecutan y pasan con el comando anterior.
- Métricas de rendimiento (RNF‑1) se registran dentro del umbral definido.