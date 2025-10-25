import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebase';
import { format } from 'date-fns';
import type { FlatList as FlatListType } from 'react-native';
import { chatbotService } from '../services/chatbotService';
import { intentClassifier } from '../services/intentClassifier';
import { securityKnowledgeBase } from '../services/knowledgeBase';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  fontSizes,
  borderRadius,
  shadows,
} from '../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type IntelligentChatbotScreenNav = NativeStackNavigationProp<RootStackParamList, 'IntelligentChatbot'>;

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  metadata?: {
    isAI?: boolean;
    fromCache?: boolean;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    intent?: string;
    confidence?: number;
  };
}

const IntelligentChatbotScreen = () => {
  const navigation = useNavigation<IntelligentChatbotScreenNav>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatbotStats, setChatbotStats] = useState({
    totalMessages: 0,
    aiResponses: 0,
    cachedResponses: 0,
  });
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const flatListRef = useRef<FlatListType<ChatMessage>>(null);

  useEffect(() => {
    // Verificar estado de Ollama
    const checkOllama = async () => {
      try {
        const status = await chatbotService.checkOllamaStatus();
        setOllamaStatus(status.available ? 'available' : 'unavailable');
      } catch (error) {
        setOllamaStatus('unavailable');
      }
    };
    
    checkOllama();
    
    // Mensaje de bienvenida del chatbot
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      text: '¡Hola! Soy tu asistente virtual de seguridad ciudadana. Puedo ayudarte con información sobre prevención, procedimientos de emergencia, tipos de reportes y mucho más. ¿En qué puedo asistirte hoy?',
      sender: 'bot',
      timestamp: new Date(),
      metadata: {
        isAI: true,
        urgencyLevel: 'low',
        intent: 'greeting',
        confidence: 1.0,
      },
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!input.trim() || !currentUser || sending) return;

    setSending(true);
    const messageText = input.trim();
    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      setIsTyping(true);
      
      // Clasificar la intención del mensaje
      const classification = intentClassifier.classify(messageText);
      console.log('🧠 Clasificación de intención:', classification);
      
      // Procesar mensaje con el chatbot inteligente
      const response = await chatbotService.processMessage(messageText);
      
      // Verificar si la respuesta viene del cache
      const cachedResponse = chatbotService.cache?.get(messageText);
      const isFromCache = cachedResponse !== null;
      
      // Crear mensaje de respuesta del bot
        const botMessage: ChatMessage = {
          id: 'bot-' + Date.now(),
          text: response,
          sender: 'bot',
          timestamp: new Date(),
          metadata: {
            isAI: !isFromCache && chatbotService.config.useLocalModel,
            fromCache: isFromCache,
            urgencyLevel: classification?.urgencyLevel || 'low',
            intent: classification?.primaryIntent?.name || 'general',
            confidence: classification?.primaryIntent?.confidence || 0.5,
          },
        };

      // Delay para simular escritura natural
      const urgencyLevel = classification?.urgencyLevel || 'low';
      const delay = urgencyLevel === 'critical' ? 800 : 
                   urgencyLevel === 'high' ? 1500 : 2000;
      
      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        
        // Actualizar estadísticas
        setChatbotStats(prev => ({
          totalMessages: prev.totalMessages + 1,
          aiResponses: prev.aiResponses + (botMessage.metadata?.isAI ? 1 : 0),
          cachedResponses: prev.cachedResponses + (botMessage.metadata?.fromCache ? 1 : 0),
        }));
      }, delay);
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setIsTyping(false);
      
      // Mensaje de error
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        text: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta nuevamente.',
        sender: 'bot',
        timestamp: new Date(),
        metadata: {
          isAI: false,
          urgencyLevel: 'low',
          intent: 'error',
        },
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage]);
      }, 1000);
    }
    
    setSending(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isBot = item.sender === 'bot';
    
    return (
      <Animated.View
        entering={FadeInUp.duration(300)}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isBot && (
          <View style={styles.botHeader}>
            <Ionicons name="star" size={16} color="#4A90E2" />
            <Text style={styles.botLabel}>Asistente IA</Text>
            {item.metadata?.isAI && (
              <View style={styles.aiIndicator}>
                <Ionicons name="bulb" size={12} color="#FF6B35" />
                <Text style={styles.aiLabel}>IA</Text>
              </View>
            )}
            {item.metadata?.fromCache && (
              <Ionicons name="flash-outline" size={12} color="#4CAF50" style={{marginLeft: 4}} />
            )}
          </View>
        )}
        <Animated.Text style={[
          styles.messageText,
          isBot && styles.botMessageText,
        ]}>
          {item.text}
        </Animated.Text>
        {isBot && item.metadata?.urgencyLevel && (
          <View style={styles.urgencyIndicator}>
            <Text style={[
              styles.urgencyText,
              item.metadata.urgencyLevel === 'critical' && styles.criticalUrgency,
              item.metadata.urgencyLevel === 'high' && styles.highUrgency
            ]}>
              {item.metadata.urgencyLevel === 'critical' ? '🚨 Crítico' : 
               item.metadata.urgencyLevel === 'high' ? '⚠️ Alta' : 
               item.metadata.urgencyLevel === 'medium' ? '🟡 Media' : '🟢 Baja'}
            </Text>
          </View>
        )}
        <Animated.Text style={styles.timestamp}>
          {format(item.timestamp, 'HH:mm')}
        </Animated.Text>
      </Animated.View>
    );
  };

  return (
    <AnimatedScreen animationType="slideUp" duration={300}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Asistente Virtual</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.headerSubtitle}>Seguridad Ciudadana</Text>
              <View style={[styles.statusIndicator, 
                ollamaStatus === 'available' && styles.statusAvailable,
                ollamaStatus === 'unavailable' && styles.statusUnavailable,
                ollamaStatus === 'checking' && styles.statusChecking
              ]}>
                <Text style={styles.statusText}>
                  {ollamaStatus === 'available' && '🤖 IA Avanzada'}
                  {ollamaStatus === 'unavailable' && '📚 Modo Básico'}
                  {ollamaStatus === 'checking' && '⏳ Verificando...'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>{chatbotStats.totalMessages}</Text>
            <Text style={styles.statsLabel}>mensajes</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        {/* Typing Indicator */}
        {isTyping && (
          <Animated.View 
            entering={FadeInUp.duration(300)} 
            style={styles.typingIndicator}
          >
            <View style={styles.typingDots}>
              <Animated.View 
                entering={FadeInUp.delay(0).duration(600)} 
                style={styles.typingDot} 
              />
              <Animated.View 
                entering={FadeInUp.delay(200).duration(600)} 
                style={styles.typingDot} 
              />
              <Animated.View 
                entering={FadeInUp.delay(400).duration(600)} 
                style={styles.typingDot} 
              />
            </View>
            <Text style={styles.typingText}>El asistente está escribiendo...</Text>
          </Animated.View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu pregunta sobre seguridad..."
            placeholderTextColor={colors.gray400}
            multiline
            maxLength={500}
          />
          <AnimatedButton
            style={[
              styles.sendButton,
              (!input.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
            animationType="scale"
          >
            <Ionicons 
              name={sending ? "hourglass" : "send"} 
              size={20} 
              color={(!input.trim() || sending) ? colors.gray400 : colors.white} 
            />
          </AnimatedButton>
        </View>
      </KeyboardAvoidingView>
    </AnimatedScreen>
  );
};

export default IntelligentChatbotScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIndicator: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusAvailable: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusUnavailable: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  statusChecking: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
  },
  statusText: {
    fontSize: fontSizes.xs,
    color: colors.white,
    fontWeight: '500',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: colors.white,
  },
  statsLabel: {
    fontSize: fontSizes.xs,
    color: colors.gray300,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    marginVertical: spacing.xs,
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: colors.secondary,
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  botLabel: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginLeft: spacing.xs,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.sm,
  },
  aiLabel: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 2,
  },
  messageText: {
    fontSize: fontSizes.md,
    color: colors.white,
    lineHeight: 20,
  },
  botMessageText: {
    color: colors.gray800,
  },
  urgencyIndicator: {
    marginTop: spacing.xs,
  },
  urgencyText: {
    fontSize: fontSizes.xs,
    fontWeight: 'bold',
  },
  criticalUrgency: {
    color: '#D32F2F',
  },
  highUrgency: {
    color: '#F57C00',
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.gray400,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.gray800,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
});