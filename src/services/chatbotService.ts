import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Configuración del chatbot inteligente
 */
interface ChatbotConfig {
  useLocalModel: boolean;
  ollamaUrl: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  fallbackToPreset: boolean;
  rateLimitPerHour: number;
}

/**
 * Cache para respuestas del chatbot
 */
class ResponseCache {
  private cache = new Map<string, { response: string; timestamp: number }>();
  private readonly CACHE_DURATION = 3600000; // 1 hora

  get(message: string): string | null {
    const key = this.normalizeMessage(message);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.response;
    }
    
    return null;
  }

  set(message: string, response: string): void {
    const key = this.normalizeMessage(message);
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  getSize(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }

  private normalizeMessage(message: string): string {
    return message.toLowerCase().trim();
  }
}

/**
 * Rate limiter para controlar uso de IA
 */
class RateLimiter {
  private requests = new Map<string, number[]>();

  canMakeRequest(userId: string, limit: number = 10): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Filtrar requests de la última hora
    const recentRequests = userRequests.filter(time => now - time < 3600000);
    
    if (recentRequests.length >= limit) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }

  getRemainingRequests(userId: string, limit: number = 10): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < 3600000);
    return Math.max(0, limit - recentRequests.length);
  }
}

/**
 * Servicio de chatbot inteligente para seguridad ciudadana
 * Combina IA local (Ollama) con respuestas predefinidas como fallback
 */
export const chatbotService = {
  // Configuración del chatbot
  config: {
    useLocalModel: true,
    ollamaUrl: 'http://localhost:11434',
    modelName: 'llama3.1:8b',
    maxTokens: 150,
    temperature: 0.7,
    fallbackToPreset: true,
    rateLimitPerHour: 20
  } as ChatbotConfig,

  // Instancias de cache y rate limiter
  cache: new ResponseCache(),
  rateLimiter: new RateLimiter(),

  /**
   * Prompt especializado para seguridad ciudadana
   */
  securityPrompt: `Eres un asistente virtual especializado en seguridad ciudadana en español.

Instrucciones:
- Responde SIEMPRE en español
- Máximo 100 palabras por respuesta
- Sé empático y profesional
- Si detectas emergencia, recomienda llamar al 911 INMEDIATAMENTE
- Para reportes, guía al usuario a usar la aplicación
- Proporciona consejos de seguridad cuando sea apropiado
- Si no sabes algo específico, deriva a las autoridades

Usuario: {message}

Respuesta:`,

  /**
   * Respuestas predefinidas del chatbot basadas en palabras clave
   */
  responses: {
    // Saludos
    greeting: [
      '¡Hola! Soy el asistente virtual de Seguridad Ciudadana. Estoy aquí para ayudarte mientras esperas respuesta de las autoridades.',
      'Hola, soy tu asistente virtual. ¿En qué puedo ayudarte mientras esperamos respuesta oficial?',
    ],
    
    // Información sobre el proceso
    process: [
      'Tu reporte ha sido enviado correctamente a las autoridades competentes. El tiempo de respuesta promedio es de 2-4 horas.',
      'Las autoridades revisan los reportes por orden de prioridad. Los casos de emergencia se atienden inmediatamente.',
      'Puedes seguir el estado de tu reporte desde la sección "Mis Reportes" en el menú principal.',
    ],
    
    // Emergencias
    emergency: [
      '🚨 Si es una EMERGENCIA INMEDIATA, usa el botón de emergencia en la pantalla principal o llama al 911.',
      '⚠️ Para emergencias que requieren atención inmediata, contacta directamente al 911 o servicios de emergencia.',
      'Si tu situación es urgente, no esperes respuesta del chat. Contacta inmediatamente a los servicios de emergencia.',
    ],
    
    // Información sobre tipos de reportes
    reportTypes: [
      'Los reportes se clasifican en: Robo, Violencia, Accidente, Emergencia, Vandalismo, Drogas, Ruido, Tráfico y Otros.',
      'Cada tipo de reporte tiene diferentes tiempos de respuesta según su prioridad y gravedad.',
    ],
    
    // Consejos de seguridad
    safety: [
      '🛡️ Consejos de seguridad: Mantente en lugares bien iluminados, evita mostrar objetos de valor, y confía en tu instinto.',
      '🚶‍♀️ Para tu seguridad: Camina con confianza, mantente alerta a tu entorno, y comparte tu ubicación con familiares.',
      '📱 Mantén tu teléfono cargado, ten números de emergencia a mano, y conoce las rutas seguras en tu zona.',
    ],
    
    // Información sobre evidencia
    evidence: [
      '📸 La evidencia fotográfica ayuda mucho a las autoridades. Asegúrate de que las imágenes sean claras y relevantes.',
      '📝 Proporciona todos los detalles posibles: hora exacta, ubicación precisa, descripción de personas involucradas.',
      'Si tienes testigos, incluye sus datos de contacto en la descripción del reporte.',
    ],
    
    // Seguimiento
    followUp: [
      'Recibirás notificaciones cuando las autoridades respondan a tu reporte.',
      'Puedes agregar información adicional respondiendo en este chat cuando las autoridades se conecten.',
      'El estado de tu reporte se actualiza automáticamente: Pendiente → En Proceso → Resuelto.',
    ],
    
    // Ayuda general
    help: [
      '❓ Puedo ayudarte con: información sobre el proceso, consejos de seguridad, tipos de reportes, y seguimiento.',
      '🤖 Soy un asistente automático. Para casos específicos, espera la respuesta de las autoridades.',
      'Si necesitas ayuda con la app, ve a Configuración → Ayuda, o contacta soporte técnico.',
    ],
    
    // Respuesta por defecto
    default: [
      'Entiendo tu preocupación. Las autoridades revisarán tu reporte y te responderán pronto.',
      'Gracias por tu mensaje. Mientras esperamos respuesta oficial, ¿hay algo más en lo que pueda ayudarte?',
      'Tu reporte es importante para nosotros. Las autoridades competentes lo están revisando.',
    ],
  },

  /**
   * Palabras clave para identificar el tipo de consulta
   */
  keywords: {
    greeting: ['hola', 'buenos', 'buenas', 'saludos', 'hey'],
    process: ['proceso', 'tiempo', 'demora', 'cuanto', 'cuando', 'respuesta', 'estado'],
    emergency: ['emergencia', 'urgente', 'ayuda', 'rapido', 'inmediato', '911'],
    reportTypes: ['tipo', 'categoria', 'clasificacion', 'reportes'],
    safety: ['seguridad', 'consejos', 'proteccion', 'cuidado', 'prevenir'],
    evidence: ['evidencia', 'foto', 'imagen', 'prueba', 'testigo'],
    followUp: ['seguimiento', 'notificacion', 'actualizar', 'estado'],
    help: ['ayuda', 'como', 'que puedes', 'funciones', 'soporte'],
  },

  /**
   * Procesa mensaje con Ollama (IA local)
   */
  async processWithOllama(message: string): Promise<string> {
    try {
      const prompt = this.securityPrompt.replace('{message}', message);
      
      const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.modelName,
          prompt: prompt,
          stream: false,
          options: {
            num_predict: this.config.maxTokens,
            temperature: this.config.temperature,
            stop: ['Usuario:', 'Respuesta:']
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response?.trim() || this.getPresetResponse(message);
    } catch (error) {
      console.log('Ollama no disponible, usando respuestas predefinidas:', error);
      throw error;
    }
  },

  /**
   * Procesa mensaje del usuario con IA inteligente y fallbacks
   */
  async processMessage(message: string, userId: string = 'anonymous'): Promise<string> {
    try {
      // 1. Verificar cache primero
      const cachedResponse = this.cache.get(message);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Verificar rate limit
      if (!this.rateLimiter.canMakeRequest(userId, this.config.rateLimitPerHour)) {
        const remaining = this.rateLimiter.getRemainingRequests(userId, this.config.rateLimitPerHour);
        return `Has alcanzado el límite de consultas por hora. Podrás hacer ${remaining} consultas más en la próxima hora. Mientras tanto, puedo ayudarte con respuestas básicas.`;
      }

      let response: string;

      // 3. Intentar con IA local (Ollama)
      if (this.config.useLocalModel) {
        try {
          response = await this.processWithOllama(message);
          this.cache.set(message, response);
          return response;
        } catch (error) {
          console.log('🤖 Ollama no disponible, usando respuestas predefinidas');
        }
      }

      // 4. Fallback a respuestas predefinidas
      response = this.getPresetResponse(message);
      this.cache.set(message, response);
      return response;

    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return 'Disculpa, estoy teniendo problemas técnicos. Por favor, contacta directamente a las autoridades si es urgente.';
    }
  },

  /**
   * Obtiene respuesta predefinida basada en palabras clave
   */
  getPresetResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.keywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        const responses = this.responses[category as keyof typeof this.responses];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    return this.responses.default[Math.floor(Math.random() * this.responses.default.length)];
  },

  /**
   * Analiza el mensaje del usuario y determina el tipo de respuesta (método legacy)
   */
  analyzeMessage(message: string): string {
    return this.getPresetResponse(message);
  },

  /**
   * Envía una respuesta inteligente del bot al chat
   */
  async sendBotResponse(reportId: string, userMessage: string, userId: string = 'anonymous'): Promise<void> {
    try {
      // Usar el nuevo sistema inteligente
      const botResponse = await this.processMessage(userMessage, userId);
      
      // Agregar un pequeño delay para simular "typing"
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      await addDoc(collection(db, 'report_chats', reportId, 'messages'), {
        text: botResponse,
        sender: 'chatbot',
        uid: 'chatbot-assistant',
        timestamp: serverTimestamp(),
        isBot: true,
        type: 'intelligent_bot_response',
        metadata: {
          usedAI: this.config.useLocalModel,
          cached: this.cache.get(userMessage) !== null,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('🤖 Respuesta inteligente del bot enviada:', botResponse.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Error al enviar respuesta del chatbot:', error);
      
      // Fallback de emergencia
      try {
        const fallbackResponse = this.getPresetResponse(userMessage);
        await addDoc(collection(db, 'report_chats', reportId, 'messages'), {
          text: fallbackResponse,
          sender: 'chatbot',
          uid: 'chatbot-assistant',
          timestamp: serverTimestamp(),
          isBot: true,
          type: 'fallback_response'
        });
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
      }
    }
  },

  /**
   * Envía mensaje de bienvenida cuando se abre el chat por primera vez
   */
  async sendWelcomeMessage(reportId: string): Promise<void> {
    try {
      const welcomeMessage = this.responses.greeting[0] + ' \n\n' +
        'Mientras esperamos respuesta de las autoridades, puedo ayudarte con:\n' +
        '• Información sobre el proceso\n' +
        '• Consejos de seguridad\n' +
        '• Seguimiento de tu reporte\n' +
        '• Respuestas a preguntas frecuentes\n\n' +
        '¿En qué puedo ayudarte?';
      
      await addDoc(collection(db, 'report_chats', reportId, 'messages'), {
        text: welcomeMessage,
        sender: 'chatbot',
        uid: 'chatbot-assistant',
        timestamp: serverTimestamp(),
        isBot: true,
      });
      
      console.log('🤖 Mensaje de bienvenida del chatbot enviado');
    } catch (error) {
      console.error('❌ Error al enviar mensaje de bienvenida del chatbot:', error);
    }
  },

  /**
   * Verifica si debe responder automáticamente
   */
  shouldRespond(messages: any[], userRole: string): boolean {
    // Solo responder a ciudadanos, no a autoridades
    if (userRole === 'autoridad') return false;
    
    // No responder si ya hay una autoridad activa en el chat
    const hasAuthorityMessage = messages.some(msg => 
      msg.sender === 'autoridad' && 
      msg.timestamp && 
      (Date.now() - msg.timestamp.toDate().getTime()) < 3600000 // 1 hora
    );
    
    if (hasAuthorityMessage) return false;
    
    // Responder si es el primer mensaje del usuario o si han pasado más de 5 minutos
    const userMessages = messages.filter(msg => msg.sender === 'ciudadano');
    if (userMessages.length === 1) return true;
    
    const lastBotMessage = messages
      .filter(msg => msg.sender === 'chatbot')
      .sort((a, b) => b.timestamp?.toDate().getTime() - a.timestamp?.toDate().getTime())[0];
    
    if (!lastBotMessage) return true;
    
    const timeSinceLastBot = Date.now() - lastBotMessage.timestamp.toDate().getTime();
    return timeSinceLastBot > 300000; // 5 minutos
  },

  /**
   * Verifica si Ollama está disponible
   */
  async checkOllamaStatus(): Promise<{
    available: boolean;
    model?: string;
    url?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      
      if (response.ok) {
        return {
          available: true,
          model: this.config.modelName,
          url: this.config.ollamaUrl
        };
      } else {
        return {
          available: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.log('Ollama no está disponible:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  /**
   * Configura el chatbot (permite cambiar configuración en tiempo real)
   */
  updateConfig(newConfig: Partial<ChatbotConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Configuración del chatbot actualizada:', this.config);
  },

  /**
   * Obtiene estadísticas del chatbot
   */
  getStats(userId: string = 'anonymous') {
    return {
      cacheSize: this.cache.getSize(),
      remainingRequests: this.rateLimiter.getRemainingRequests(userId, this.config.rateLimitPerHour),
      ollamaEnabled: this.config.useLocalModel,
      modelName: this.config.modelName,
      rateLimitPerHour: this.config.rateLimitPerHour
    };
  },

  /**
   * Limpia el cache del chatbot
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache del chatbot limpiado');
  },

  /**
   * Mensaje de bienvenida inteligente
   */
  async sendIntelligentWelcomeMessage(reportId: string, userId: string = 'anonymous'): Promise<void> {
    try {
      const welcomeMessage = `Hola, soy tu asistente virtual de seguridad ciudadana con IA. Tu reporte ha sido recibido correctamente. ¿En qué puedo ayudarte mientras esperamos respuesta de las autoridades?`;
      
      await addDoc(collection(db, 'chats', reportId, 'messages'), {
        text: welcomeMessage,
        senderId: 'system',
        senderName: '🤖 Asistente Virtual IA',
        timestamp: serverTimestamp(),
        isBot: true,
        type: 'welcome_message',
        metadata: {
          aiEnabled: this.config.useLocalModel,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('Mensaje de bienvenida inteligente enviado');
    } catch (error) {
      console.error('Error enviando mensaje de bienvenida:', error);
      // Fallback al mensaje de bienvenida original
      await this.sendWelcomeMessage(reportId);
    }
  },
};