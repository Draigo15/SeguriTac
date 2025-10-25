/**
 * Base de conocimiento especializada para seguridad ciudadana
 * Contiene respuestas estructuradas y procedimientos específicos
 */

export interface SecurityFAQ {
  id: string;
  question: string;
  answer: string;
  category: SecurityCategory;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  requiresImmediate?: boolean;
}

export interface SecurityProcedure {
  id: string;
  name: string;
  description: string;
  steps: string[];
  requiredInfo: string[];
  estimatedTime: string;
  category: SecurityCategory;
}

export interface EmergencyProtocol {
  id: string;
  type: string;
  immediateActions: string[];
  contactInfo: string;
  whenToUse: string[];
  severity: 'critical' | 'high' | 'medium';
}

export type SecurityCategory = 
  | 'robo' 
  | 'violencia' 
  | 'emergencia' 
  | 'accidente' 
  | 'vandalismo' 
  | 'drogas' 
  | 'ruido' 
  | 'trafico' 
  | 'general' 
  | 'proceso' 
  | 'seguridad';

/**
 * Base de conocimiento principal
 */
export class SecurityKnowledgeBase {
  private faqs: SecurityFAQ[] = [
    {
      id: 'robo-001',
      question: '¿Qué hacer si me están robando?',
      answer: '🚨 EMERGENCIA: Si estás siendo robado AHORA, llama inmediatamente al 911. No resistas, entrega lo que pidan. Tu seguridad es lo más importante. Después del incidente, reporta inmediatamente usando la app.',
      category: 'robo',
      keywords: ['robando', 'asaltando', 'amenazando', 'pistola', 'cuchillo', 'ahora'],
      priority: 'high',
      requiresImmediate: true
    },
    {
      id: 'robo-002',
      question: '¿Cómo reportar un robo que ya pasó?',
      answer: 'Para reportar un robo: 1) Ve a "Crear Reporte" 2) Selecciona "Robo/Hurto" 3) Proporciona ubicación exacta 4) Describe lo sucedido con detalles 5) Adjunta fotos si es seguro hacerlo. Las autoridades revisarán tu caso en 2-4 horas.',
      category: 'robo',
      keywords: ['robo', 'hurto', 'robaron', 'quitaron', 'reportar'],
      priority: 'high'
    },
    {
      id: 'violencia-001',
      question: '¿Qué hacer ante violencia doméstica?',
      answer: '🆘 Violencia doméstica es EMERGENCIA. Llama al 911 inmediatamente. Si no puedes hablar, envía mensaje de texto al 911. Busca refugio seguro. Contacta línea nacional: 01-800-108-4053. Tu seguridad es prioridad.',
      category: 'violencia',
      keywords: ['violencia doméstica', 'maltrato', 'golpes', 'pareja', 'esposo', 'esposa'],
      priority: 'high',
      requiresImmediate: true
    },
    {
      id: 'violencia-002',
      question: 'Veo una pelea en la calle',
      answer: 'Si presencias violencia: 1) NO intervengas directamente 2) Llama al 911 si hay armas o lesiones graves 3) Reporta en la app con ubicación exacta 4) Si es seguro, toma fotos/video como evidencia 5) Mantente a distancia segura.',
      category: 'violencia',
      keywords: ['pelea', 'golpeando', 'peleando', 'agresión', 'violencia'],
      priority: 'high'
    },
    {
      id: 'drogas-001',
      question: '¿Cómo reportar venta de drogas?',
      answer: 'Para reportar narcóticos: 1) "Crear Reporte" > "Narcóticos" 2) Ubicación exacta (dirección, referencias) 3) Horarios de actividad 4) Descripción de personas 5) Tu identidad permanece ANÓNIMA. No te acerques al lugar.',
      category: 'drogas',
      keywords: ['drogas', 'narcóticos', 'vendiendo', 'marihuana', 'cocaína', 'dealer'],
      priority: 'medium'
    },
    {
      id: 'emergencia-001',
      question: '¿Cuándo es una emergencia real?',
      answer: 'Es EMERGENCIA si: 🚨 Hay peligro inmediato de vida 🚨 Crimen en progreso 🚨 Accidente grave 🚨 Incendio 🚨 Persona inconsciente. LLAMA 911 INMEDIATAMENTE. Para otros casos, usa la app.',
      category: 'emergencia',
      keywords: ['emergencia', 'urgente', 'inmediato', 'peligro', 'vida', 'muerte'],
      priority: 'high',
      requiresImmediate: true
    },
    {
      id: 'proceso-001',
      question: '¿Cuánto tardan en responder?',
      answer: 'Tiempos de respuesta: 🔴 Emergencias: Inmediato (911) 🟡 Alta prioridad: 30min-2hrs 🟢 Prioridad normal: 2-4hrs 🔵 Baja prioridad: 4-24hrs. Recibirás notificaciones de actualización.',
      category: 'proceso',
      keywords: ['tiempo', 'demora', 'cuánto', 'tardan', 'respuesta', 'cuando'],
      priority: 'medium'
    },
    {
      id: 'seguridad-001',
      question: 'Consejos para caminar seguro de noche',
      answer: '🌙 Seguridad nocturna: ✅ Calles iluminadas ✅ Camina con confianza ✅ Evita distracciones (teléfono) ✅ Comparte ubicación con familia ✅ Lleva silbato ✅ Confía en tu instinto ✅ Evita callejones oscuros.',
      category: 'seguridad',
      keywords: ['noche', 'caminar', 'seguro', 'consejos', 'prevención', 'cuidarse'],
      priority: 'low'
    }
  ];

  private procedures: SecurityProcedure[] = [
    {
      id: 'proc-robo',
      name: 'Procedimiento para reportar robo',
      description: 'Pasos detallados para reportar un robo de manera efectiva',
      steps: [
        'Asegúrate de estar en lugar seguro',
        'Abre la app y ve a "Crear Reporte"',
        'Selecciona "Robo/Hurto"',
        'Proporciona ubicación exacta del incidente',
        'Describe qué fue robado y cómo ocurrió',
        'Incluye descripción de los perpetradores',
        'Adjunta fotos si tienes evidencia',
        'Envía el reporte y guarda el número de referencia'
      ],
      requiredInfo: [
        'Ubicación exacta',
        'Hora aproximada',
        'Descripción de lo robado',
        'Descripción de los perpetradores',
        'Dirección de escape (si la viste)'
      ],
      estimatedTime: '5-10 minutos',
      category: 'robo'
    },
    {
      id: 'proc-emergencia',
      name: 'Protocolo de emergencia',
      description: 'Qué hacer en situaciones de emergencia inmediata',
      steps: [
        'Evalúa si hay peligro inmediato',
        'Si hay peligro: llama 911 INMEDIATAMENTE',
        'Busca lugar seguro',
        'Proporciona ubicación exacta al 911',
        'Sigue instrucciones del operador',
        'No cuelgues hasta que te lo indiquen',
        'Después, reporta en la app para seguimiento'
      ],
      requiredInfo: [
        'Ubicación exacta',
        'Tipo de emergencia',
        'Número de personas involucradas',
        'Si necesitas ambulancia, policía o bomberos'
      ],
      estimatedTime: 'Inmediato',
      category: 'emergencia'
    }
  ];

  private emergencyProtocols: EmergencyProtocol[] = [
    {
      id: 'emergency-911',
      type: 'Emergencia inmediata',
      immediateActions: [
        'Llama 911 inmediatamente',
        'Proporciona ubicación exacta',
        'Describe la situación claramente',
        'Sigue las instrucciones del operador',
        'No cuelgues hasta que te lo indiquen'
      ],
      contactInfo: '911 - Emergencias',
      whenToUse: [
        'Crimen en progreso',
        'Peligro inmediato de vida',
        'Accidente grave',
        'Incendio',
        'Persona inconsciente'
      ],
      severity: 'critical'
    },
    {
      id: 'emergency-violence',
      type: 'Violencia doméstica',
      immediateActions: [
        'Busca lugar seguro inmediatamente',
        'Llama 911 o envía SMS si no puedes hablar',
        'Contacta línea nacional: 01-800-108-4053',
        'Documenta lesiones con fotos',
        'Busca refugio en lugar seguro'
      ],
      contactInfo: '911 o 01-800-108-4053',
      whenToUse: [
        'Maltrato físico',
        'Amenazas de muerte',
        'Violencia psicológica severa',
        'Abuso sexual'
      ],
      severity: 'critical'
    }
  ];

  /**
   * Busca respuesta en la base de conocimiento
   */
  findResponse(message: string): SecurityFAQ | null {
    const lowerMessage = message.toLowerCase();
    
    // Buscar por palabras clave, priorizando emergencias
    const matches = this.faqs.filter(faq => 
      faq.keywords.some(keyword => lowerMessage.includes(keyword))
    );

    if (matches.length === 0) return null;

    // Priorizar emergencias
    const emergencyMatch = matches.find(faq => faq.requiresImmediate);
    if (emergencyMatch) return emergencyMatch;

    // Priorizar por importancia
    const highPriority = matches.filter(faq => faq.priority === 'high');
    if (highPriority.length > 0) {
      return highPriority[0];
    }

    return matches[0];
  }

  /**
   * Obtiene procedimiento por categoría
   */
  getProcedure(category: SecurityCategory): SecurityProcedure | null {
    return this.procedures.find(proc => proc.category === category) || null;
  }

  /**
   * Obtiene protocolo de emergencia
   */
  getEmergencyProtocol(type: string): EmergencyProtocol | null {
    return this.emergencyProtocols.find(protocol => 
      protocol.type.toLowerCase().includes(type.toLowerCase())
    ) || null;
  }

  /**
   * Detecta si el mensaje indica emergencia
   */
  isEmergency(message: string): boolean {
    const emergencyKeywords = [
      'emergencia', 'urgente', 'ayuda', 'ahora', 'inmediato',
      'robando', 'asaltando', 'amenazando', 'pistola', 'cuchillo',
      'golpeando', 'lastimando', 'sangre', 'inconsciente',
      'fuego', 'incendio', 'accidente grave'
    ];

    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Clasifica el tipo de incidente
   */
  classifyIncident(message: string): SecurityCategory {
    const lowerMessage = message.toLowerCase();

    const categoryKeywords = {
      robo: ['robo', 'hurto', 'robaron', 'quitaron', 'asalto'],
      violencia: ['pelea', 'golpes', 'violencia', 'agresión', 'maltrato'],
      emergencia: ['emergencia', 'urgente', 'inmediato', 'peligro'],
      accidente: ['accidente', 'choque', 'atropello', 'lesionado'],
      vandalismo: ['vandalismo', 'grafiti', 'daños', 'destruyeron'],
      drogas: ['drogas', 'narcóticos', 'vendiendo', 'marihuana'],
      ruido: ['ruido', 'música', 'molesto', 'volumen'],
      trafico: ['tráfico', 'semáforo', 'estacionamiento', 'velocidad'],
      seguridad: ['consejos', 'prevención', 'cuidarse', 'seguro']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return category as SecurityCategory;
      }
    }

    return 'general';
  }

  /**
   * Obtiene todas las FAQs por categoría
   */
  getFAQsByCategory(category: SecurityCategory): SecurityFAQ[] {
    return this.faqs.filter(faq => faq.category === category);
  }

  /**
   * Obtiene respuesta de emergencia rápida
   */
  getEmergencyResponse(): string {
    return '🚨 EMERGENCIA DETECTADA 🚨\n\nSi estás en PELIGRO INMEDIATO:\n• Llama 911 AHORA\n• Busca lugar seguro\n• No uses la app, usa el teléfono\n\nSi ya pasó la emergencia:\n• Reporta en la app con todos los detalles\n• Las autoridades te contactarán pronto';
  }
}

// Instancia global de la base de conocimiento
export const securityKnowledgeBase = new SecurityKnowledgeBase();