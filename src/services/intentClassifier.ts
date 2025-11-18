/**
 * Clasificador de intenciones para el chatbot de seguridad ciudadana
 * Analiza mensajes y determina la intención del usuario
 */

import { SecurityCategory } from './knowledgeBase';

export interface Intent {
  name: string;
  confidence: number;
  category: SecurityCategory;
  isEmergency: boolean;
  requiresImmediate: boolean;
  suggestedAction: string;
}

export interface ClassificationResult {
  primaryIntent: Intent;
  alternativeIntents: Intent[];
  entities: ExtractedEntity[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'urgent';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExtractedEntity {
  type: 'location' | 'time' | 'person' | 'object' | 'number';
  value: string;
  confidence: number;
}

/**
 * Clasificador de intenciones basado en reglas y patrones
 */
export class IntentClassifier {
  private intentPatterns = {
    // Emergencias críticas
    emergency_immediate: {
      patterns: [
        /\b(me están|están) (robando|asaltando|amenazando)\b/i,
        /\b(ayuda|auxilio|socorro)\s+(ahora|ya|inmediato)\b/i,
        /\b(pistola|cuchillo|arma)\b/i,
        /\b(golpeando|lastimando|herido)\s+(ahora|en este momento)\b/i
      ],
      category: 'emergencia' as SecurityCategory,
      isEmergency: true,
      requiresImmediate: true,
      suggestedAction: 'call_911'
    },

    // Reportes de robos
    report_theft: {
      patterns: [
        /\b(me robaron|robaron|hurto|asalto)\b/i,
        /\b(quitaron|llevaron)\s+(mi|el|la)\s+(celular|cartera|bolsa|auto)\b/i,
        /\breportar\s+(robo|hurto)\b/i
      ],
      category: 'robo' as SecurityCategory,
      isEmergency: false,
      requiresImmediate: false,
      suggestedAction: 'create_report'
    },

    // Violencia
    report_violence: {
      patterns: [
        /\b(pelea|golpes|violencia|agresión)\b/i,
        /\b(maltrato|abuso)\s+(doméstico|familiar)\b/i,
        /\b(amenazas|intimidación)\b/i
      ],
      category: 'violencia' as SecurityCategory,
      isEmergency: true,
      requiresImmediate: false,
      suggestedAction: 'assess_safety'
    },

    // Narcóticos
    report_drugs: {
      patterns: [
        /\b(drogas|narcóticos|vendiendo)\s+(drogas|marihuana|cocaína)\b/i,
        /\b(dealer|traficante)\b/i,
        /\breportar\s+(drogas|narcóticos)\b/i
      ],
      category: 'drogas' as SecurityCategory,
      isEmergency: false,
      requiresImmediate: false,
      suggestedAction: 'create_report'
    },

    // Accidentes
    report_accident: {
      patterns: [
        /\b(accidente|choque|atropello)\b/i,
        /\b(lesionado|herido|ambulancia)\b/i
      ],
      category: 'accidente' as SecurityCategory,
      isEmergency: true,
      requiresImmediate: true,
      suggestedAction: 'call_emergency'
    },

    // Vandalismo
    report_vandalism: {
      patterns: [
        /\b(vandalismo|grafiti|daños|destruyeron)\b/i,
        /\b(rompieron|dañaron)\s+(propiedad|auto|ventana)\b/i
      ],
      category: 'vandalismo' as SecurityCategory,
      isEmergency: false,
      requiresImmediate: false,
      suggestedAction: 'create_report'
    },

    // Consultas de proceso
    ask_process: {
      patterns: [
        /\b(cómo|como)\s+(reportar|denunciar)\b/i,
        /\b(cuánto|cuanto)\s+(tiempo|demora|tardan)\b/i,
        /\b(proceso|procedimiento|pasos)\b/i
      ],
      category: 'proceso' as SecurityCategory,
      isEmergency: false,
      requiresImmediate: false,
      suggestedAction: 'provide_info'
    },

    // Consejos de seguridad
    ask_safety: {
      patterns: [
        /\b(consejos|tips|recomendaciones)\s+(seguridad|prevención)\b/i,
        /\b(cómo|como)\s+(cuidarse|protegerse|estar seguro)\b/i,
        /\b(prevenir|evitar)\s+(robos|asaltos)\b/i
      ],
      category: 'seguridad' as SecurityCategory,
      isEmergency: false,
      requiresImmediate: false,
      suggestedAction: 'provide_tips'
    },

    // Saludos
    greeting: {
      patterns: [
        /\b(hola|buenos|buenas|saludos)\b/i,
        /\b(qué tal|como estas|como está)\b/i
      ],
      category: 'general' as SecurityCategory,
      isEmergency: false,
      requiresImmediate: false,
      suggestedAction: 'greet'
    },

    // Ayuda general
    ask_help: {
      patterns: [
        /\b(ayuda|help|asistencia)\b/i,
        /\b(qué puedes|que puedes)\s+(hacer|ayudar)\b/i,
        /\b(funciones|opciones)\b/i
      ],
      category: 'general' as SecurityCategory,
      isEmergency: false,
      requiresImmediate: false,
      suggestedAction: 'show_help'
    }
  };

  /**
   * Clasifica un mensaje y determina la intención
   */
  classify(message: string): ClassificationResult {
    const intents = this.analyzeIntents(message);
    const entities = this.extractEntities(message);
    const sentiment = this.analyzeSentiment(message);
    const urgencyLevel = this.determineUrgency(intents, sentiment);

    return {
      primaryIntent: intents[0],
      alternativeIntents: intents.slice(1),
      entities,
      sentiment,
      urgencyLevel
    };
  }

  /**
   * Analiza todas las posibles intenciones en el mensaje
   */
  private analyzeIntents(message: string): Intent[] {
    const results: Intent[] = [];

    for (const [intentName, config] of Object.entries(this.intentPatterns)) {
      let maxConfidence = 0;
      
      for (const pattern of config.patterns) {
        const match = message.match(pattern);
        if (match) {
          // Calcular confianza basada en la longitud del match y contexto
          const confidence = this.calculateConfidence(match, message);
          maxConfidence = Math.max(maxConfidence, confidence);
        }
      }

      if (maxConfidence > 0) {
        results.push({
          name: intentName,
          confidence: maxConfidence,
          category: config.category,
          isEmergency: config.isEmergency,
          requiresImmediate: config.requiresImmediate,
          suggestedAction: config.suggestedAction
        });
      }
    }

    // Ordenar por confianza descendente
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calcula la confianza de un match
   */
  private calculateConfidence(match: RegExpMatchArray, fullMessage: string): number {
    let confidence = 0.7; // Base confidence

    // Aumentar confianza si el match es una palabra completa
    if (match[0].length > 3) {
      confidence += 0.1;
    }

    // Aumentar confianza si hay múltiples palabras clave
    const keywordCount = (fullMessage.match(/\b(robo|violencia|emergencia|ayuda|reportar)\b/gi) || []).length;
    confidence += Math.min(keywordCount * 0.05, 0.2);

    // Reducir confianza si el mensaje es muy largo (posible ruido)
    if (fullMessage.length > 200) {
      confidence -= 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * Extrae entidades del mensaje
   */
  private extractEntities(message: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Extraer ubicaciones
    const locationPatterns = [
      /\b(calle|avenida|av|boulevard|blvd)\s+([\w\s]+?)\b/gi,
      /\b(colonia|col|fraccionamiento|fracc)\s+([\w\s]+?)\b/gi,
      /\b(cerca de|junto a|frente a)\s+([\w\s]+?)\b/gi
    ];

    locationPatterns.forEach(pattern => {
      const matches = [...message.matchAll(pattern)];
      matches.forEach(match => {
        entities.push({
          type: 'location',
          value: match[0],
          confidence: 0.8
        });
      });
    });

    // Extraer tiempos
    const timePatterns = [
      /\b(hace|ayer|hoy|ahora|en este momento)\b/gi,
      /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi,
      /\b(mañana|tarde|noche|madrugada)\b/gi
    ];

    timePatterns.forEach(pattern => {
      const matches = [...message.matchAll(pattern)];
      matches.forEach(match => {
        entities.push({
          type: 'time',
          value: match[0],
          confidence: 0.7
        });
      });
    });

    // Extraer objetos robados
    const objectPatterns = [
      /\b(celular|teléfono|móvil|iphone|samsung)\b/gi,
      /\b(cartera|bolsa|mochila|maleta)\b/gi,
      /\b(auto|carro|vehículo|moto|bicicleta)\b/gi,
      /\b(dinero|efectivo|tarjetas)\b/gi
    ];

    objectPatterns.forEach(pattern => {
      const matches = [...message.matchAll(pattern)];
      matches.forEach(match => {
        entities.push({
          type: 'object',
          value: match[0],
          confidence: 0.9
        });
      });
    });

    return entities;
  }

  /**
   * Analiza el sentimiento del mensaje
   */
  private analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' | 'urgent' {
    const urgentWords = ['urgente', 'inmediato', 'ahora', 'ya', 'rápido', 'emergencia'];
    const negativeWords = ['mal', 'terrible', 'horrible', 'miedo', 'asustado', 'preocupado'];
    const positiveWords = ['bien', 'gracias', 'perfecto', 'excelente', 'bueno'];

    const lowerMessage = message.toLowerCase();

    if (urgentWords.some(word => lowerMessage.includes(word))) {
      return 'urgent';
    }

    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Determina el nivel de urgencia
   */
  private determineUrgency(
    intents: Intent[], 
    sentiment: 'positive' | 'negative' | 'neutral' | 'urgent'
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (intents.length === 0) return 'low';

    const primaryIntent = intents[0];

    // Emergencias inmediatas son críticas
    if (primaryIntent.requiresImmediate) {
      return 'critical';
    }

    // Emergencias generales son altas
    if (primaryIntent.isEmergency) {
      return 'high';
    }

    // Sentimiento urgente aumenta prioridad
    if (sentiment === 'urgent') {
      return primaryIntent.isEmergency ? 'critical' : 'high';
    }

    // Reportes de crímenes son prioridad media
    if (['robo', 'violencia', 'drogas'].includes(primaryIntent.category)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Verifica si el mensaje indica una emergencia inmediata
   */
  isImmediateEmergency(message: string): boolean {
    const result = this.classify(message);
    return result.urgencyLevel === 'critical' || result.primaryIntent.requiresImmediate;
  }

  /**
   * Obtiene sugerencias de acción basadas en la clasificación
   */
  getSuggestedActions(classification: ClassificationResult): string[] {
    const actions: string[] = [];

    switch (classification.primaryIntent.suggestedAction) {
      case 'call_911':
        actions.push('Llamar al 911 inmediatamente');
        actions.push('Buscar lugar seguro');
        break;
      case 'call_emergency':
        actions.push('Llamar servicios de emergencia');
        actions.push('Proporcionar primeros auxilios si es seguro');
        break;
      case 'create_report':
        actions.push('Crear reporte en la aplicación');
        actions.push('Proporcionar todos los detalles posibles');
        break;
      case 'assess_safety':
        actions.push('Evaluar si estás en lugar seguro');
        actions.push('Considerar llamar al 911 si hay peligro inmediato');
        break;
      case 'provide_info':
        actions.push('Consultar información en la aplicación');
        break;
      case 'provide_tips':
        actions.push('Revisar consejos de seguridad');
        break;
      case 'greet':
        actions.push('Responder saludo');
        actions.push('Ofrecer asistencia');
        break;
      case 'show_help':
        actions.push('Mostrar opciones de ayuda disponibles');
        break;
    }

    return actions;
  }
}

// Instancia global del clasificador
export const intentClassifier = new IntentClassifier();