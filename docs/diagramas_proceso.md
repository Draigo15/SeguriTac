# Diagramas de Proceso – Autenticación y 2FA

Este documento describe el proceso actual de autenticación de la app y el proceso propuesto con mejoras de 2FA (OTP por email) y "Recordar dispositivo".

## Proceso Actual (Login con OTP por Email)

```mermaid
flowchart TD
    UA[Usuario] --> A1[Login: ingresa email y contraseña]
    A1 --> A2[App: POST /api/auth/login]
    A2 --> A3{Credenciales válidas?}
    A3 -- No --> A4[Mostrar error en login]
    A4 --> A1
    A3 -- Sí --> A5[Navegar a pantalla Verificación OTP Email]
    A5 --> A6[App: POST /api/auth/email-otp/send]
    A6 --> A7[Usuario revisa correo y escribe código]
    A7 --> A8[App: POST /api/auth/email-otp/verify]
    A8 --> A9{Código válido y no expirado?}
    A9 -- No --> A10[Error: código inválido/expirado]
    A10 --> A7
    A9 -- Sí --> A11[Backend marca sesión MFA OK]
    A11 --> A12[App guarda sesión y rol]
    A12 --> A13[Navegar a Home/Dashboard]
```

Notas:
- OTP se envía al email del usuario tras login con contraseña válida.
- La sesión se habilita solo tras verificar el código.

## Proceso Propuesto (Con "Recordar dispositivo" y reglas por rol)

```mermaid
flowchart TD
    U[Usuario] --> B1[Login: email + contraseña]
    B1 --> B2[App: POST /api/auth/login]
    B2 --> B3{¿Dispositivo confiable con token válido?}
    B3 -- Sí --> B10[Backend valida token de dispositivo]
    B10 --> B11[Sesión habilitada]
    B11 --> B12[Navegar a Home/Dashboard]
    B3 -- No --> B4[Enviar OTP por email]
    B4 --> B5[Usuario ingresa código en la app]
    B5 --> B6[App: POST /api/auth/email-otp/verify]
    B6 --> B7{Código válido?}
    B7 -- No --> B5
    B7 -- Sí --> B8{¿Recordar dispositivo?}
    B8 -- Sí --> B9[App: POST /api/auth/device-token/create]
    B9 --> B11
    B8 -- No --> B11

    R[Reglas de rol]:::note --- B2
    R --> RR1[Admin / autoridad: OTP siempre obligatorio]
    R --> RR2[Ciudadano: permitir saltar OTP si dispositivo confiable]

    classDef note fill:#FFF7D6,stroke:#E0C97A,color:#5B4C1E;
```

Notas:
- "Recordar dispositivo" emite un token firmado que se valida en logins futuros.
- Para roles sensibles (admin/autoridad), OTP es obligatorio en cada login o acción de alto riesgo.

## Secuencia de Verificación OTP (Propuesto)

```mermaid
sequenceDiagram
    participant App
    participant Backend
    participant Firestore
    participant SMTP as Servicio de Email

    App->>Backend: POST /api/auth/email-otp/send { email }
    Backend->>Firestore: Crear registro OTP (hash, expires, attempts)
    Backend->>SMTP: Enviar email con código OTP
    Backend-->>App: { status: "sent" }

    App->>Backend: POST /api/auth/email-otp/verify { email, code }
    Backend->>Firestore: Validar hash y vigencia del código
    Backend-->>App: { ok: true, mfa: true }

    App->>Backend: POST /api/auth/device-token/create (si "Recordar dispositivo")
    Backend-->>App: { deviceToken }
```

## Endpoints involucrados
- `POST /api/auth/login`: valida credenciales y determina si requiere MFA.
- `POST /api/auth/email-otp/send`: genera y envía el código al correo.
- `POST /api/auth/email-otp/verify`: verifica código, marca sesión MFA.
- `POST /api/auth/device-token/create`: emite token de dispositivo confiable.

## Consideraciones de seguridad
- Limitar intentos y expiración de OTP.
- Almacenar OTP como hash (no en texto plano).
- Firmar el token de dispositivo y expirar/invalidar en revocaciones.
- Auditar intentos de login, verificación OTP y creación/uso de tokens.

## Próximas extensiones (opcional)
- Añadir diagrama de proceso para acciones sensibles (cambio de rol, edición crítica).
- Incluir Passkeys/WebAuthn para web como mejora a medio plazo.