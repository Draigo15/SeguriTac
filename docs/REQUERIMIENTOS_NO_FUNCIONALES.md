# Requerimientos No Funcionales (RNF) — SeguridadCiudadanaApp

Este documento consolida los RNF acordados y su estado de cobertura.

## Seguridad y Privacidad
- Sesión sin JWT: token opaco aleatorio emitido tras OTP y almacenado en Firestore; validación y revocación por endpoints (`/api/auth/session/validate`, `/api/auth/logout`).
  - Estado: Cubierto.
  - Referencias: `backend/index.js`, `backend/API.md`, `backend/ENVIRONMENT.md`.
- OTP por email con hash y expiración 10 min; intentos limitados (5).
  - Estado: Cubierto.
  - Referencias: `backend/index.js`, `backend/API.md`.

### RNF-2 Seguridad
- Descripción detallada:
  - Objetivo: garantizar autenticación robusta y protección de datos sensibles tanto en tránsito (red) como en reposo (dispositivo/servidor).
  - Datos protegidos: identidad de usuario (perfil/rol), estado de sesión, tokens de notificación FCM, y tráfico API.
  - Amenazas mitigadas: exposición de datos en almacenamiento local, intercepción MITM, abuso de endpoints de autenticación, CORS laxo, y encabezados inseguros por defecto.
- Medidas implementadas (este cambio):
  - Almacenamiento seguro en cliente: `SecureStore` para la clave sensible `user` (perfil/rol) con fallback controlado a `AsyncStorage` únicamente cuando no exista `SecureStore` (web/tests). Migraciones aplicadas en pantallas de login, carga de sesión, Home y Sidebar.
  - Endurecimiento del backend: `helmet` (headers seguros; incluye HSTS), CORS restringido por `ALLOWED_ORIGINS`, y rate limiting global y específico para rutas sensibles (OTP, validar sesión, logout).
  - Transporte seguro: validación estricta en `appConfig` que impide `http://` para `api.baseUrl` en producción.
- Alcance de este commit:
  - Cliente: `src/services/secureStorage.ts` y migraciones en `LoginScreen.tsx`, `LoginMethodScreen.tsx`, `AuthLoadingScreen.tsx`, `HomeScreen.tsx`, `components/Sidebar.tsx`, `LoginScreenRefactored.tsx`.
  - Paquetes cliente: `expo-secure-store` añadido como dependencia.
  - Backend: `backend/index.js` actualizado con `helmet`, CORS restringido, `express-rate-limit`; dependencias agregadas en `backend/package.json`.
  - Configuración: validación de HTTPS en `src/config/appConfig.ts`.
- Criterios de aceptación (definidos):
  - Los datos sensibles no se almacenan en texto plano en `AsyncStorage` en dispositivos reales; `SecureStore` es la fuente de verdad para claves sensibles.
  - Las llamadas API desde app a producción usan `https://` exclusivamente; el arranque falla temprano si no se cumple.
  - El backend aplica CORS a orígenes permitidos, headers de seguridad de `helmet` y límites por IP en rutas críticas.
- Pruebas de aceptación:
  - Cliente: `SeguridadCiudadanaApp/__tests__/rnf2.acceptance.test.js` valida uso de `SecureStore` para claves sensibles y configuración HTTPS en producción.
- Estado: Cubierto en desarrollo/staging; pendiente validación final en producción.
  - Validado por revisión de código y pruebas manuales locales. Falta verificación end‑to‑end en build de producción con dispositivo físico y backend desplegado.
- Requisitos adicionales para “Cumplido (producción)”: 
  - Backend con `ALLOWED_ORIGINS` configurado a dominios oficiales y verificación de headers `helmet`/HSTS en el entorno productivo.
  - Verificación en dispositivo físico de que `SecureStore` se usa (sin fallback) y auditoría de que no existen restos sensibles en `AsyncStorage`.
  - Revisión de reglas de Firestore/Storage para mínimos privilegios (referencia en `backend/SECURITY.md`).

### RNF-9 Seguridad de Sesión
- Descripción: invalidar el token de sesión opaco al cerrar sesión o cuando expira, y en cliente eliminar claves sensibles y redirigir a una ruta segura sin historial para evitar volver a pantallas protegidas.
- Mecanismos implementados:
  - Limpieza de sesión: uso de `secureStorage.removeItem` para borrar claves sensibles (p. ej., token/estado de sesión y perfil/rol de usuario) definidas en la configuración.
  - Logout robusto: `components/Sidebar.tsx` ejecuta 1) lectura de rol, 2) `auth.signOut()` de Firebase, 3) eliminación de datos locales (`SecureStore`/fallback controlado) y 4) `navigation.reset()` hacia login/selección de rol.
  - Fuentes de verdad de claves: `src/config/appConfig.ts` define las claves sensibles de almacenamiento utilizadas por `src/services/secureStorage.ts`.
- Criterios de aceptación:
  - Las claves sensibles de sesión están definidas explícitamente en la configuración de la app y no se almacenan en texto plano fuera de `SecureStore` (en dispositivos reales).
  - Al cerrar sesión se eliminan las claves sensibles de forma fiable.
  - La navegación posterior al logout no permite regresar a pantallas protegidas (reset del stack).
- Prueba de aceptación:
  - Backend: `backend/__tests__/rnf9.session.acceptance.test.js` verifica que el flujo OTP emite un token opaco, que `GET /api/auth/session/validate` lo valida, que `POST /api/auth/logout` lo revoca, y que posterior validación retorna 401; además, con `SESSION_TTL_MINUTES=0` el token expira y se revoca al validar.
  - Cliente: `SeguridadCiudadanaApp/__tests__/rnf9.acceptance.test.js` valida la eliminación de claves sensibles mediante `secureStorage.removeItem` y la existencia/consistencia de la clave de token de sesión en `appConfig`.
  - Evidencia: ejecución local exitosa de las pruebas (validación automatizada en desarrollo/CI).
- Referencias: `src/components/Sidebar.tsx`, `src/screens/ProfileScreen.js`, `src/screens/HomeScreen.tsx`, `src/screens/LoginScreenRefactored.tsx`, `src/services/secureStorage.ts`, `src/config/appConfig.ts`.
- Estado: Cubierto. Próximos pasos: añadir prueba E2E en cliente que verifique `navigation.reset()` y ausencia de back‑stack a pantallas protegidas.

## Rendimiento y Escalabilidad
### RNF-1 Desempeño
- Descripción: la aplicación debe mantener interacción fluida en pantallas de reporte, mapa y notificaciones, y responder acciones clave en menos de 3 segundos incluso en dispositivos de gama baja.
- Metas medibles:
  - Arranque en frío (cold start) hasta primer render: p95 < 2500 ms en dispositivos Android con 2–3 GB RAM.
  - Navegación entre pantallas críticas: p95 < 500 ms (transición completa).
  - Envío de reporte (incluye geolocalización y subida de imagen pequeña): p95 < 2500 ms en red 4G.
  - Render de listas (50–200 ítems) con virtualización: fps ≥ 50 y frame time p95 < 20 ms.
  - Consumo de memoria estable: < 200 MB en sesión estándar.
- Estrategia de optimización aplicada:
  - Android: `minSdkVersion=26` y `Proguard/R8` habilitado con shrink de recursos en release.
  - Nuevo Arquitectura RN (Fabric/TurboModules) habilitada (`newArchEnabled=true`).
  - Virtualización de listas y uso de `FlatList/SectionList` en pantallas de reportes.
  - Caché de imágenes y reducción de tamaños de assets estáticos.
  - Evitar trabajo pesado en render (debounce en búsquedas/filtros; memoización de componentes).
- Medición y pruebas:
  - Pruebas en `__tests__/performance.test.js` para latencias de acciones clave.
  - Instrumentación de arranque: log de timestamp en `App.tsx` para calcular tiempo a primer render.
  - Registro de p95 en CI local/manual y verificación periódica.
- Validación por tests (nuevo):
  - Aceptación RNF-1 en `SeguridadCiudadanaApp/__tests__/rnf1.acceptance.test.js` con umbral ≤ 3000 ms sobre acciones clave.
  - Métricas verificadas: `report_submit_ms`, `notifications_load_ms`, `map_load_ms`.
  - Instrumentación adicional: `App.tsx` (cold start), `src/navigation/AppNavigator.tsx` (navegación), `ReportScreen.tsx`, `NotificationsScreen.tsx`, `AllReportsMapScreen.tsx`.
- Estado: Validado por tests (alcance desarrollo/CI). Requiere corroboración en dispositivo real de gama baja para marcar "Cumplido" en producción.
- Referencias: `SeguridadCiudadanaApp/app.config.js`, `SeguridadCiudadanaApp/__tests__/performance.test.js`, `SeguridadCiudadanaApp/__tests__/rnf1.acceptance.test.js`.

### RNF-7 Escalabilidad
- Descripción: la solución debe ser ampliable a múltiples distritos/zonas sin rediseño profundo.
- Estrategia aplicada (este cambio):
  - Particionamiento lógico por zona en consultas: `src/services/exportService.ts` ahora aplica `where('zone', '==', <zona>)` cuando se especifica `filters.zone`, permitiendo aislar datos por distrito/sector sin acoplar rutas de colección.
  - Diseño neutral a múltiples zonas en servicios y filtros (no se fuerza zona cuando no se provee).
- Criterios de aceptación:
  - Si se indica `filters.zone`, las consultas incluyen un constraint por zona.
  - Si no se indica zona, el servicio funciona de forma general (multi‑distrito) sin errores.
- Prueba de aceptación:
  - Cliente: `SeguridadCiudadanaApp/__tests__/rnf7.acceptance.test.js` valida que `exportService.getReportsData` construye consultas con/ sin `where('zone', '==', ...)` según corresponda.
- Estado: Cubierto (nivel de consultas). Próximos pasos: evaluar particionamiento físico por colección/índice por distrito si el volumen por proyecto supera límites de Firestore o SLO definidos.

## Disponibilidad y Resiliencia
- Manejo de errores con códigos y mensajes claros; limpieza de OTP expirados.
  - Estado: Cubierto.
- Estrategia de reintento controlado para notificaciones FCM.
  - Estado: Parcial.

### RNF-5 Confiabilidad
- Descripción detallada:
  - Objetivo: la app debe degradar funcionalmente sin crashear ante fallas de red (offline o intermitencia) y recuperarse de forma transparente cuando vuelva la conexión, informando al usuario con feedback claro.
  - Alcance: envío de reportes, listeners en tiempo real de Firestore, flujo de autenticación y navegación básica. Se prioriza mantener la integridad de datos y evitar estados inconsistentes.
  - Notas de diseño: actualmente Firestore puede ser habilitado/deshabilitado según conectividad (vía NetInfo); la persistencia offline nativa de Firestore RN permanece deshabilitada salvo evaluación específica.
- Criterios de aceptación (definidos):
  - Degradación offline: al intentar enviar un reporte sin conexión, la app no crashea y muestra mensaje de error/estado que permita reintentar.
  - Recuperación tras reconexión: una vez restablecida la conexión, el usuario puede reintentar y completar el envío con confirmación de éxito.
  - Listeners resilientes: las suscripciones en tiempo real se reintentan o re-suscriben al recuperarse la red sin requerir reiniciar la app.
- Pruebas de aceptación:
  - Cliente: `SeguridadCiudadanaApp/__tests__/rnf5.acceptance.test.js` valida la degradación offline en el envío de reportes y la recuperación posterior mostrando toasts de error/éxito.
- Mecanismos implementados:
  - Resiliencia de listeners: `src/services/firestoreWrapper.ts` (por ejemplo, `robustOnSnapshot`) con manejo de errores y reintentos controlados.
  - Gestión de conectividad: `src/services/firebase.ts` (habilitar/deshabilitar red de Firestore según `NetInfo`).
  - Feedback y manejo de errores: `src/services/errorHandling.ts` (`checkNetworkConnection`, `handleNetworkError`, toasts uniformes).
- Metas sugeridas (SLO):
  - Sesiones sin crash ≥ 99.5% mensual (apps RN).
  - Éxito de re-suscripción a listeners tras pérdida de red ≥ 99% en escenarios de reconexión.
  - MTTR para operaciones transitorias de red < 60 s con reintentos.
- Estado: Definido y validado por pruebas (desarrollo/CI). Pendiente ampliar pruebas de listeners en pantallas clave y evaluar, si procede, habilitar persistencia offline de Firestore RN.
  - Referencias: `SeguridadCiudadanaApp/__tests__/rnf5.acceptance.test.js`, `src/services/firestoreWrapper.ts`, `src/services/firebase.ts`, `src/services/errorHandling.ts`.

### RNF-8 Tolerancia a Errores
- Descripción: los listeners y operaciones en tiempo real deben tolerar errores transitorios de red (p. ej., `ERR_ABORTED`) reintentando de forma controlada, sin crashear la app.
- Mecanismos implementados:
  - Wrapper de listeners: `src/services/firestoreWrapper.ts` (`robustOnSnapshot`) con detección de `ERR_ABORTED`, backoff lineal y re-suscripción automática, además de delegación a `onError` para errores no transitorios.
- Criterios de aceptación:
  - Ante `ERR_ABORTED`, se reintenta y el callback de datos (`onNext`) vuelve a ejecutarse tras la re-suscripción.
  - Para errores no transitorios (ej. `permission-denied`), se invoca `onError` sin bucle de reintentos.
- Prueba de aceptación:
  - Cliente: `SeguridadCiudadanaApp/__tests__/rnf8.acceptance.test.js` simula errores transitorios/no transitorios y valida los comportamientos descritos.
- Estado: Cubierto (infraestructura de listeners). Próximos pasos: extender el uso de `robustOnSnapshot` a todas las pantallas con suscripciones y agregar métricas de reintentos/recuperación.

## Usabilidad y Accesibilidad
### RNF-3 Usabilidad
- Descripción detallada:
  - Objetivo: que cualquier ciudadano, sin conocimientos técnicos, pueda entender qué hacer en cada pantalla y completar tareas frecuentes sin ayuda.
  - Principios: simplicidad (menos pasos y opciones por pantalla), consistencia (títulos, botones y patrones de navegación predecibles) y lenguaje claro (sin tecnicismos).
- Alcance (pantallas críticas): Login/Registro, Reporte de incidente, Mapa de reportes, Notificaciones y Home/Sidebar.
- Metas medibles (heurísticas prácticas):
  - CTA primario visible y autoexplicativo en cada pantalla crítica (ej. `Enviar reporte`, `Iniciar sesión`).
  - Validación inline con mensajes de error claros en lenguaje simple; evitar jerga técnica.
  - Estados vacíos con texto orientativo y acción sugerida (ej. "Aún no tienes notificaciones").
  - Feedback inmediato en acciones (> 0 ms y < 200 ms visual: spinner/toast/deshabilitar botón) y confirmación al completar.
  - Navegación consistente: botón "Atrás" o equivalente disponible y coherente entre pantallas.
  - Tocábles mínimos ~44dp de alto y contraste suficiente para legibilidad (alineado a guías de plataforma).
- Criterios de aceptación (esperado en UI real):
  - Los formularios muestran errores junto al campo cuando el dato es inválido o está vacío.
  - Los botones principales están etiquetados con verbos de acción claros y son distinguibles del resto de acciones.
  - En ausencia de datos (lista de reportes/notificaciones), se muestra un estado vacío con texto útil y, si aplica, un CTA.
  - Las pantallas permiten volver atrás sin confusión (gesto/back/chevron visible).
  - Acciones potencialmente destructivas/irreversibles solicitan confirmación.
- Pruebas de aceptación:
  - Estado actual: No existe una prueba de aceptación específica para RNF-3. Hay pruebas relacionadas pero no validan heurísticas de usabilidad:
    - `SeguridadCiudadanaApp/__tests__/ui.test.js` (básica)
    - `SeguridadCiudadanaApp/__tests__/userFlow.acceptance.test.js` (flujo general, no criterios de usabilidad)
  - Propuesta: añadir `SeguridadCiudadanaApp/__tests__/rnf3.acceptance.test.js` con checks en pantallas clave usando `@testing-library/react-native` para:
    - Presencia de CTA principal por pantalla (`getByText`/`getByTestId`).
    - Mensajes de error al enviar formularios vacíos/incorrectos.
    - Representación de estados vacíos (texto/ilustración/CTA sugerida) en Notificaciones/Reportes.
    - Existencia de mecanismo de retroceso (icono/handler de navegación) y títulos consistentes.
- Estado: Parcial (cubierto por diseño y revisión; falta prueba de aceptación y verificación UI en dispositivo).
- Referencias: `SeguridadCiudadanaApp/MANUAL_USUARIO.md`, `src/screens/LoginScreenRefactored.tsx`, `src/screens/ReportScreen.tsx`, `src/screens/AllReportsMapScreen.tsx`, `src/screens/NotificationsScreen.tsx`, `src/components/Sidebar.tsx`.

### RNF-10 Accesibilidad
- Descripción: cumplir criterios prácticos alineados a WCAG AA en pantallas clave (login, reporte, mapa, notificaciones y navegación), incluyendo etiquetas accesibles, roles y orden de foco adecuados.
- Criterios de aceptación:
  - Controles interactivos con `accessibilityLabel`/`accessibilityRole` apropiados y texto descriptivo.
  - Iconos críticos tienen `accessibilityLabel` o `accessible={false}` si son decorativos.
  - Elementos táctiles con área mínima (~44dp) y contraste suficiente (según tema).
  - Navegación por teclado/lector: foco llega a CTA principal y títulos.
- Pruebas de aceptación:
  - Cliente: `SeguridadCiudadanaApp/__tests__/rnf10.accessibility.acceptance.test.js` valida labels y roles accesibles en CTAs clave (ej. RoleSelectorScreen) con `@testing-library/react-native`.
  - Medición de contraste: pendiente (manual/visual o tooling específico en CI).
- Estado: Cubierto (alcance tests de accesibilidad básicos). Pendiente validar contraste y lector de pantalla en dispositivo real para cerrar WCAG AA.
- Referencias: `SeguridadCiudadanaApp/MANUAL_USUARIO.md`, componentes/pantallas en `src/screens/` y `src/components/`.

## Mantenibilidad y Testabilidad
- Pruebas unitarias y de integración principales en `__tests__/`.
  - Estado: Cubierto.
  - Prueba de aceptación: `SeguridadCiudadanaApp/__tests__/rnf4.acceptance.test.js` valida estructura modular (`src/{screens,components,services,navigation}`), presencia de `tsconfig.json` y TypeScript, configuración de Jest/script `test`, y volumen mínimo de pruebas (≥ 5 archivos).
- Convenciones de commits, PR y guía de contribución.
  - Estado: Cubierto.
  - Referencias: `SeguridadCiudadanaApp/CONTRIBUTING.md`.

## Observabilidad y Operación
- Logs de errores en backend; recomendaciones de alertas.
  - Estado: Parcial.
- Variables de entorno documentadas y segregadas.
  - Estado: Cubierto.
  - Referencias: `backend/ENVIRONMENT.md`, `SeguridadCiudadanaApp/ENVIRONMENT.md`.

## Portabilidad y Configuración
- Android `minSdkVersion=26`; permisos y configuración en `app.json`.
  - Estado: Cubierto.
  - Prueba de aceptación: `SeguridadCiudadanaApp/__tests__/rnf6.acceptance.test.js` valida `minSdkVersion >= 26` leyendo `android/gradle.properties` y `android/build.gradle`.

## Cumplimiento y Legal
- Seguridad y privacidad documentadas; soporte y términos.
  - Estado: Cubierto.
  - Referencias: `SeguridadCiudadanaApp/SECURITY.md`, `SeguridadCiudadanaApp/MANUAL_USUARIO.md`.

---

### SLO/SLA sugeridos
- OTP envío/verificación: éxito ≥ 99% mensual; latencia p95 < 1.2s.
- Validación de sesión: latencia p95 < 800ms.
- Notificaciones FCM: éxito ≥ 97% con reintentos controlados.

### Próximos pasos (Parciales → Cubierto)
- Completar WCAG AA en todas pantallas críticas.
- Añadir alertas/monitoreo para endpoints OTP/FCM.
- Implementar reintentos exponenciales en FCM y manejo de tokens inválidos.