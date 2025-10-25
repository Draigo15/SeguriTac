# 🤖 Chatbot Inteligente - Asistente Virtual de Seguridad Ciudadana

## 📋 Propósito y Funcionalidad

El **Chatbot Inteligente** es un asistente virtual especializado diseñado para ayudar a los **ciudadanos** con:

### 🎯 Funciones Principales

1. **Información sobre la Aplicación**
   - Cómo crear reportes
   - Tipos de reportes disponibles
   - Tiempos de respuesta esperados
   - Seguimiento de reportes
   - Uso de funciones de la app

2. **Asesoría sobre Incidentes de Seguridad**
   - Procedimientos para diferentes tipos de incidentes
   - Consejos de seguridad preventiva
   - Clasificación de emergencias
   - Protocolos de actuación

3. **Respuesta a Emergencias**
   - Detección automática de situaciones de emergencia
   - Redirección inmediata al 911
   - Protocolos específicos (violencia doméstica, robos, etc.)
   - Información de contactos de emergencia

## 🔄 Diferencia con ChatScreen

| Característica | Chatbot Inteligente | ChatScreen |
|---|---|---|
| **Propósito** | Asistente virtual para ciudadanos | Comunicación directa autoridad-ciudadano |
| **Usuarios** | Solo ciudadanos | Ciudadanos + Autoridades |
| **Tipo de respuestas** | Automáticas con IA/predefinidas | Humanas en tiempo real |
| **Disponibilidad** | 24/7 automático | Depende de disponibilidad de autoridades |
| **Función** | Información, guía, emergencias | Seguimiento específico de reportes |

## 🧠 Tecnología Implementada

### Sistema Híbrido de Respuestas

1. **IA Local (Ollama)** - Respuestas inteligentes personalizadas
2. **Base de Conocimientos** - Respuestas predefinidas especializadas
3. **Sistema de Fallback** - Garantiza funcionamiento sin IA

### Categorías de Conocimiento

- **Robo/Hurto**: Procedimientos, prevención, reportes
- **Violencia**: Doméstica, callejera, protocolos de emergencia
- **Emergencias**: Detección, redirección al 911
- **Narcóticos**: Reportes anónimos, procedimientos
- **Accidentes**: Primeros auxilios, reportes
- **Vandalismo**: Documentación, reportes
- **Ruido**: Procedimientos, horarios
- **Tráfico**: Infracciones, accidentes
- **Seguridad General**: Consejos preventivos
- **Proceso**: Funcionamiento de la app

## 📊 Características Técnicas

### Funcionalidades Avanzadas

- ✅ **Cache inteligente** - Respuestas rápidas para preguntas frecuentes
- ✅ **Rate limiting** - Control de uso por usuario
- ✅ **Detección de emergencias** - Redirección automática al 911
- ✅ **Clasificación de intenciones** - Respuestas contextuales
- ✅ **Indicador de estado** - Muestra disponibilidad de IA
- ✅ **Respuestas graduales** - Según urgencia del caso

### Niveles de Urgencia

- 🔴 **Crítica**: Emergencias inmediatas → 911
- 🟡 **Alta**: Situaciones graves → Respuesta prioritaria
- 🟢 **Media**: Consultas importantes → Respuesta estándar
- 🔵 **Baja**: Información general → Respuesta informativa

## 💬 Ejemplos de Uso

### Consultas Típicas de Ciudadanos

**Sobre la App:**
- "¿Cómo reporto un robo?"
- "¿Cuánto tardan en responder?"
- "¿Puedo hacer reportes anónimos?"

**Sobre Seguridad:**
- "Consejos para caminar seguro de noche"
- "¿Qué hacer si veo una pelea?"
- "¿Cómo prevenir robos en casa?"

**Emergencias:**
- "Me están robando" → Redirección inmediata al 911
- "Hay un accidente grave" → Protocolo de emergencia
- "Violencia doméstica" → Contactos especializados

## 🎯 Objetivo Principal

**Proporcionar asistencia inmediata y especializada a ciudadanos** mientras esperan respuesta oficial de las autoridades, mejorando la experiencia del usuario y proporcionando información valiosa sobre seguridad ciudadana.

## 🔧 Estado Actual

✅ **Completamente funcional** con:
- Sistema de respuestas híbrido (IA + predefinidas)
- Base de conocimientos especializada
- Detección de emergencias
- Interfaz intuitiva con indicadores de estado
- Manejo robusto de errores
- Fallback automático cuando Ollama no está disponible

---

*El Chatbot Inteligente complementa pero NO reemplaza la comunicación directa con autoridades a través del ChatScreen.*