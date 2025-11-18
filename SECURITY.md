# Política de Seguridad – SeguridadCiudadanaApp

Este documento resume cómo reportar vulnerabilidades y las prácticas recomendadas para proteger la aplicación móvil y los datos de los usuarios.

## Reporte de vulnerabilidades
- Email de contacto: `security@seguridadciudadana.app` (o el correo del equipo responsable).
- Incluye descripción, pasos de reproducción, impacto y evidencia (sin exponer datos sensibles).
- Usar divulgación responsable; no publicar detalles antes de coordinar la corrección.

## Alcance
- Aplicación móvil Expo/React Native (`SeguridadCiudadanaApp`).
- Integraciones con servicios externos (Firebase, Expo, FCM, etc.).
- Backend se documenta en su propio `SECURITY.md` (en el repo del servidor).

## Versiones soportadas
- Se da prioridad a la versión estable publicada y al último `preview`.
- Las versiones antiguas podrían no recibir actualizaciones de seguridad.

## Prácticas recomendadas (desarrollo)
- No subir secretos al repositorio: usar `.env` y EAS `secrets`.
- Rotar claves de servicios y credenciales periódicamente.
- Mantener dependencias actualizadas; evita paquetes sin mantenimiento.
- Revisar permisos en Android/iOS: solo solicitar lo necesario (ubicación, cámara, notificaciones).
- Evitar almacenar datos sensibles en texto plano.
- Activar `minify/obfuscation` en builds de producción cuando aplique.

## Entorno y secretos
- Ver `ENVIRONMENT.md` para variables utilizadas en desarrollo y builds.
- En EAS, configurar `secrets` y perfiles (`preview`, `production`).
- En CI/CD, proteger variables y limitar acceso por roles.

## Transporte y almacenamiento
- Comunicación con backend vía HTTPS.
- No guardar contraseñas ni tokens en texto plano.
- Usar almacenamiento seguro para sesiones/tokens (SecureStore o equivalente).

## Permisos del dispositivo
- Ubicación: explicar uso al usuario y pedir consentimiento.
- Cámara/galería: limitar a captura de evidencia.
- Notificaciones: permitir configuración granular en la app.

## Manejo de incidentes
- Confirmar recepción del reporte de vulnerabilidad en 72 horas.
- Clasificar severidad (crítica/alta/media/baja).
- Mitigar, parchear y publicar actualización.
- Documentar en `CHANGELOG.md` las correcciones relevantes.

## Privacidad y datos
- Minimizar datos recolectados y respetar normativas locales (p. ej., protección de datos).
- Anonimizar información sensible cuando sea posible.
- Informar a los usuarios sobre finalidades y uso de datos.

## Controles adicionales (recomendados)
- Auditoría de dependencias (p. ej., `npm audit` y herramientas adicionales).
- Revisión de código enfocada en seguridad (amenazas comunes: XSS en WebViews, escalación de permisos, uso indebido de APIs).
- Monitoreo de errores en producción (p. ej., Sentry) sin filtrar datos sensibles.

## Recursos
- `ENVIRONMENT.md` y `DEPLOYMENT.md` para configuración segura.
- Guía de contribución: `CONTRIBUTING.md`.
- Documentación de backend (seguridad del servidor) en su propio repositorio.