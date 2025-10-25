/**
 * Utilidad para probar el chatbot inteligente de seguridad ciudadana
 * Incluye casos de prueba y validaciones
 */

import { chatbotService } from '../services/chatbotService';
import { intentClassifier } from '../services/intentClassifier';
import { securityKnowledgeBase } from '../services/knowledgeBase';

export interface TestCase {
  id: string;
  input: string;
  expectedCategory: string;
  expectedUrgency: 'low' | 'medium' | 'high' | 'critical';
  expectedAction: string;
  description: string;
}

export interface TestResult {
  testCase: TestCase;
  classification: any;
  response: string;
  passed: boolean;
  issues: string[];
  executionTime: number;
}

/**
 * Casos de prueba para el chatbot
 */
export const testCases: TestCase[] = [
  // Emergencias críticas
  {
    id: 'emergency-001',
    input: 'Me están robando ahora, tienen una pistola',
    expectedCategory: 'emergencia',
    expectedUrgency: 'critical',
    expectedAction: 'call_911',
    description: 'Emergencia inmediata - robo en progreso con arma'
  },
  {
    id: 'emergency-002',
    input: 'Ayuda urgente, mi esposo me está golpeando',
    expectedCategory: 'violencia',
    expectedUrgency: 'critical',
    expectedAction: 'call_911',
    description: 'Violencia doméstica en progreso'
  },
  {
    id: 'emergency-003',
    input: 'Hay un accidente grave, una persona está inconsciente',
    expectedCategory: 'accidente',
    expectedUrgency: 'critical',
    expectedAction: 'call_emergency',
    description: 'Accidente con lesiones graves'
  },

  // Reportes de alta prioridad
  {
    id: 'report-001',
    input: 'Me robaron el celular hace una hora en la calle 5 de mayo',
    expectedCategory: 'robo',
    expectedUrgency: 'high',
    expectedAction: 'create_report',
    description: 'Reporte de robo reciente'
  },
  {
    id: 'report-002',
    input: 'Vi una pelea muy violenta en el parque central',
    expectedCategory: 'violencia',
    expectedUrgency: 'high',
    expectedAction: 'assess_safety',
    description: 'Reporte de violencia pública'
  },
  {
    id: 'report-003',
    input: 'Hay personas vendiendo drogas en la esquina de mi casa',
    expectedCategory: 'drogas',
    expectedUrgency: 'medium',
    expectedAction: 'create_report',
    description: 'Reporte de narcóticos'
  },

  // Consultas de proceso
  {
    id: 'process-001',
    input: '¿Cómo puedo reportar un robo?',
    expectedCategory: 'proceso',
    expectedUrgency: 'low',
    expectedAction: 'provide_info',
    description: 'Consulta sobre procedimientos'
  },
  {
    id: 'process-002',
    input: '¿Cuánto tiempo tardan en responder a un reporte?',
    expectedCategory: 'proceso',
    expectedUrgency: 'low',
    expectedAction: 'provide_info',
    description: 'Consulta sobre tiempos de respuesta'
  },

  // Consejos de seguridad
  {
    id: 'safety-001',
    input: '¿Qué consejos me das para caminar seguro de noche?',
    expectedCategory: 'seguridad',
    expectedUrgency: 'low',
    expectedAction: 'provide_tips',
    description: 'Solicitud de consejos de seguridad'
  },
  {
    id: 'safety-002',
    input: '¿Cómo puedo prevenir que me roben?',
    expectedCategory: 'seguridad',
    expectedUrgency: 'low',
    expectedAction: 'provide_tips',
    description: 'Consulta sobre prevención'
  },

  // Saludos y ayuda general
  {
    id: 'general-001',
    input: 'Hola, ¿cómo estás?',
    expectedCategory: 'general',
    expectedUrgency: 'low',
    expectedAction: 'greet',
    description: 'Saludo básico'
  },
  {
    id: 'general-002',
    input: '¿Qué puedes hacer para ayudarme?',
    expectedCategory: 'general',
    expectedUrgency: 'low',
    expectedAction: 'show_help',
    description: 'Solicitud de ayuda general'
  },

  // Casos edge
  {
    id: 'edge-001',
    input: 'xyz123 mensaje sin sentido 456',
    expectedCategory: 'general',
    expectedUrgency: 'low',
    expectedAction: 'show_help',
    description: 'Mensaje sin sentido'
  },
  {
    id: 'edge-002',
    input: '',
    expectedCategory: 'general',
    expectedUrgency: 'low',
    expectedAction: 'show_help',
    description: 'Mensaje vacío'
  }
];

/**
 * Ejecuta una prueba individual
 */
export async function runSingleTest(testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  
  try {
    // Clasificar la intención
    const classification = intentClassifier.classify(testCase.input);
    
    // Simular respuesta del chatbot
    const response = await simulateChatbotResponse(testCase.input);
    
    // Validar resultados
    let passed = true;
    
    // Verificar categoría
    if (classification.primaryIntent.category !== testCase.expectedCategory) {
      issues.push(`Categoría incorrecta: esperado '${testCase.expectedCategory}', obtenido '${classification.primaryIntent.category}'`);
      passed = false;
    }
    
    // Verificar urgencia
    if (classification.urgencyLevel !== testCase.expectedUrgency) {
      issues.push(`Urgencia incorrecta: esperado '${testCase.expectedUrgency}', obtenido '${classification.urgencyLevel}'`);
      passed = false;
    }
    
    // Verificar acción sugerida
    if (classification.primaryIntent.suggestedAction !== testCase.expectedAction) {
      issues.push(`Acción incorrecta: esperado '${testCase.expectedAction}', obtenido '${classification.primaryIntent.suggestedAction}'`);
      passed = false;
    }
    
    // Verificar que hay respuesta
    if (!response || response.trim().length === 0) {
      issues.push('No se generó respuesta');
      passed = false;
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      testCase,
      classification,
      response,
      passed,
      issues,
      executionTime
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    return {
      testCase,
      classification: null,
      response: '',
      passed: false,
      issues: [`Error durante la prueba: ${error}`],
      executionTime
    };
  }
}

/**
 * Simula la respuesta del chatbot sin usar Firebase
 */
async function simulateChatbotResponse(message: string): Promise<string> {
  try {
    // Verificar si es emergencia
    if (securityKnowledgeBase.isEmergency(message)) {
      return securityKnowledgeBase.getEmergencyResponse();
    }
    
    // Buscar en la base de conocimiento
    const faq = securityKnowledgeBase.findResponse(message);
    if (faq) {
      return faq.answer;
    }
    
    // Clasificar y obtener procedimiento
    const category = securityKnowledgeBase.classifyIncident(message);
    const procedure = securityKnowledgeBase.getProcedure(category);
    
    if (procedure) {
      return `Para ${procedure.name}:\n\n${procedure.steps.slice(0, 3).map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nTiempo estimado: ${procedure.estimatedTime}`;
    }
    
    // Respuesta por defecto
    return 'Hola, soy tu asistente virtual de seguridad ciudadana. ¿En qué puedo ayudarte hoy?';
    
  } catch (error) {
    return 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';
  }
}

/**
 * Ejecuta todas las pruebas
 */
export async function runAllTests(): Promise<{
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageTime: number;
    successRate: number;
  };
}> {
  console.log('🧪 Iniciando pruebas del chatbot...');
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`Ejecutando: ${testCase.id} - ${testCase.description}`);
    const result = await runSingleTest(testCase);
    results.push(result);
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calcular estadísticas
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const averageTime = results.reduce((sum, r) => sum + r.executionTime, 0) / total;
  const successRate = (passed / total) * 100;
  
  const summary = {
    total,
    passed,
    failed,
    averageTime: Math.round(averageTime),
    successRate: Math.round(successRate * 100) / 100
  };
  
  return { results, summary };
}

/**
 * Genera reporte de pruebas en formato legible
 */
export function generateTestReport(results: TestResult[], summary: any): string {
  let report = '📊 REPORTE DE PRUEBAS DEL CHATBOT\n';
  report += '=' .repeat(50) + '\n\n';
  
  // Resumen
  report += '📈 RESUMEN:\n';
  report += `Total de pruebas: ${summary.total}\n`;
  report += `✅ Exitosas: ${summary.passed}\n`;
  report += `❌ Fallidas: ${summary.failed}\n`;
  report += `⏱️ Tiempo promedio: ${summary.averageTime}ms\n`;
  report += `📊 Tasa de éxito: ${summary.successRate}%\n\n`;
  
  // Pruebas fallidas
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    report += '❌ PRUEBAS FALLIDAS:\n';
    report += '-'.repeat(30) + '\n';
    
    failedTests.forEach(test => {
      report += `\n🔴 ${test.testCase.id}: ${test.testCase.description}\n`;
      report += `   Entrada: "${test.testCase.input}"\n`;
      test.issues.forEach(issue => {
        report += `   • ${issue}\n`;
      });
    });
    report += '\n';
  }
  
  // Pruebas exitosas por categoría
  const successfulTests = results.filter(r => r.passed);
  const categories = [...new Set(successfulTests.map(r => r.testCase.expectedCategory))];
  
  report += '✅ PRUEBAS EXITOSAS POR CATEGORÍA:\n';
  report += '-'.repeat(35) + '\n';
  
  categories.forEach(category => {
    const categoryTests = successfulTests.filter(r => r.testCase.expectedCategory === category);
    report += `\n🟢 ${category.toUpperCase()}: ${categoryTests.length} pruebas\n`;
    categoryTests.forEach(test => {
      report += `   • ${test.testCase.description} (${test.executionTime}ms)\n`;
    });
  });
  
  // Estadísticas de rendimiento
  report += '\n⚡ RENDIMIENTO:\n';
  report += '-'.repeat(20) + '\n';
  const times = results.map(r => r.executionTime);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  report += `Tiempo mínimo: ${minTime}ms\n`;
  report += `Tiempo máximo: ${maxTime}ms\n`;
  report += `Tiempo promedio: ${summary.averageTime}ms\n`;
  
  return report;
}

/**
 * Ejecuta pruebas y muestra resultados en consola
 */
export async function testChatbot(): Promise<void> {
  try {
    const { results, summary } = await runAllTests();
    const report = generateTestReport(results, summary);
    
    console.log(report);
    
    // Guardar reporte en archivo si es posible
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const reportPath = path.join(__dirname, '../../chatbot_test_report.txt');
        fs.writeFileSync(reportPath, report);
        console.log(`\n📄 Reporte guardado en: ${reportPath}`);
      } catch (error) {
        console.log('\n⚠️ No se pudo guardar el reporte en archivo');
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

/**
 * Prueba específica para verificar Ollama
 */
export async function testOllamaConnection(): Promise<boolean> {
  try {
    console.log('🔍 Verificando conexión con Ollama...');
    
    const status = await chatbotService.checkOllamaStatus();
    
    if (status.available) {
      console.log('✅ Ollama está disponible');
      console.log(`📊 Modelo: ${status.model}`);
      console.log(`🔗 URL: ${status.url}`);
      return true;
    } else {
      console.log('❌ Ollama no está disponible');
      console.log(`❓ Razón: ${status.error}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error al verificar Ollama:', error);
    return false;
  }
}

// Exportar función principal para uso fácil
export default testChatbot;