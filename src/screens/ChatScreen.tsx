import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { useRoute } from '@react-navigation/native';
import { db, auth } from '../services/firebase';
import {
  collection,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { robustOnSnapshot } from '../services/firestoreWrapper';
import { format } from 'date-fns';
import type { FlatList as FlatListType } from 'react-native';
import { useForm, validationRules } from '../hooks/useForm';

import { Ionicons } from '@expo/vector-icons';

const ChatScreen = () => {
  const route = useRoute();
  const { reportId }: any = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [role, setRole] = useState<'autoridad' | 'ciudadano' | null>(null);
  const [sending, setSending] = useState(false);
  
  const {
    values,
    errors,
    touched,
    isValid,
    getFieldProps,
    reset
  } = useForm({
    initialValues: {
      message: ''
    },
    validationRules: {
      message: validationRules.required
    }
  });
  const flatListRef = useRef<FlatListType<any>>(null);
  const [chatClosed, setChatClosed] = useState(false);
  const [welcomeMessageSent, setWelcomeMessageSent] = useState(false);



  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const checkPermissionAndLoadMessages = async () => {
      const currentUser = auth.currentUser;
      console.log('🔍 Usuario actual:', currentUser?.email);
      if (!currentUser || !isMounted) {
        console.log('❌ No hay usuario autenticado o componente desmontado');
        return;
      }

      try {
        const reportRef = doc(db, 'reports', reportId);
        const reportSnap = await getDoc(reportRef);
        console.log('📄 Reporte existe:', reportSnap.exists());

        if (!reportSnap.exists() || !isMounted) {
          console.log('❌ Reporte no encontrado o componente desmontado');
          if (isMounted) setAllowed(false);
          return;
        }

        const reportData = reportSnap.data();
        console.log('📊 Datos del reporte:', { email: reportData.email, chatClosed: reportData.chatClosed });
        if (isMounted) setChatClosed(reportData.chatClosed || false);
        
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const roleFromDB = userData?.role || null;
        console.log('👤 Rol del usuario:', roleFromDB);

        if (isMounted) setRole(roleFromDB);

        const isCreator = reportData.email === currentUser.email;
        const isAuthority = roleFromDB === 'autoridad';
        console.log('🔐 Permisos:', { isCreator, isAuthority, userEmail: currentUser.email, reportEmail: reportData.email });

        if ((isCreator || isAuthority) && isMounted) {
          console.log('✅ Acceso permitido');
          setAllowed(true);

          // Limpiar listener anterior si existe
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }

          const q = query(
            collection(db, 'report_chats', reportId, 'messages'),
            orderBy('timestamp', 'asc')
          );

          unsubscribe = robustOnSnapshot(
            q,
            (snapshot) => {
              if (!isMounted) return;
              // Type guard to ensure we have a QuerySnapshot
              if (!('docs' in snapshot)) return;
              const newMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              console.log('💬 Mensajes cargados:', newMessages.length);
              setMessages(newMessages);
              
              // Chat directo entre ciudadano y autoridades - sin chatbot automático
            },
            (error) => {
              console.error('❌ Error en listener de chat:', error);
              if (!isMounted) return;
              
              // Si hay error de permisos o Target ID duplicado, limpiar el listener
              if (error.code === 'permission-denied' || error.code === 'already-exists') {
                console.log('🚫 Error de permisos o Target ID duplicado - limpiando listener');
                setAllowed(false);
                if (unsubscribe) {
                  unsubscribe();
                  unsubscribe = null;
                }
              }
            },
            { maxRetries: 5, retryDelay: 1000, enableLogging: true }
          );
        } else if (isMounted) {
          console.log('❌ Acceso denegado');
          setAllowed(false);
        }
      } catch (error) {
        console.error('❌ Error en checkPermissionAndLoadMessages:', error);
        if (isMounted) setAllowed(false);
      }
    };

    checkPermissionAndLoadMessages();

    // Cleanup function que se ejecuta cuando el componente se desmonta
    return () => {
      isMounted = false;
      if (unsubscribe) {
        console.log('🧹 Limpiando listener de chat');
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, [reportId]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!role) return;
    const currentUser = auth.currentUser;
    if (!values.message.trim() || !currentUser || !currentUser.email || sending || !isValid) return;

    setSending(true);
    const sender = role || 'ciudadano';
    const messageText = values.message.trim();

    try {
      await addDoc(collection(db, 'report_chats', reportId, 'messages'), {
        text: messageText,
        sender,
        uid: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      reset();
      
      // Chat directo entre autoridad y ciudadano - sin chatbot automático
    } catch (e) {
      console.error('❌ Error al enviar mensaje:', e);
    } finally {
      setSending(false);
    }
  };
  
  const handleCloseChat = async () => {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      chatClosed: true,
    });
    setChatClosed(true);
    console.log('🔒 Chat cerrado manualmente por la autoridad.');
  } catch (error: any) {
    console.error('Error al cerrar chat manualmente:', error);
  }
};

  if (allowed === null) {
    return (
      <View style={styles.container}>
        <Text style={{ margin: 20 }}>Cargando conversación...</Text>
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.container}>
        <Text style={{ margin: 20, color: 'red' }}>
          No tienes permiso para acceder a este chat.
        </Text>
      </View>
    );
  }

  return (
    <AnimatedScreen animationType="rotateZoom" duration={800}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Animated.View entering={FadeInDown.duration(500)} style={{flex: 1}}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({item, index}) => {
            const isUser = item.uid === auth.currentUser?.uid;
            const isAuthority = item.sender === 'autoridad';
            
            return (
              <Animated.View
                entering={isUser ? FadeInUp.delay(index * 100).duration(300) : FadeInDown.delay(index * 100).duration(300)}
                style={[
                  styles.messageContainer,
                  isUser ? styles.myMessage : isAuthority ? styles.authorityMessage : styles.theirMessage,
                ]}
              >
                {isAuthority && (
                  <View style={styles.authorityHeader}>
                    <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
                    <Text style={styles.authorityLabel}>Autoridad</Text>
                  </View>
                )}
                <Animated.Text style={[
                  styles.messageText,
                  isAuthority && styles.authorityMessageText
                ]}>{item.text}</Animated.Text>
                <Animated.Text style={styles.timestamp}>
                  {item.timestamp?.seconds ? format(item.timestamp.toDate(), 'HH:mm') : '...'}
                </Animated.Text>
              </Animated.View>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
        />

      </Animated.View>
      {role === 'autoridad' && !chatClosed && (
  <Animated.View entering={ZoomIn.delay(300).duration(500)}>
    <AnimatedButton
      style={styles.closeChatButton}
      onPress={handleCloseChat}
      animationType="scale"
      iconName="close-circle"
    >
      <Animated.Text style={styles.closeChatButtonText}>Cerrar Chat Manualmente</Animated.Text>
    </AnimatedButton>
  </Animated.View>
)}
      {chatClosed ? (
  <Animated.View entering={FadeInUp.duration(500)} style={styles.closedBanner}>
    <Animated.Text style={styles.closedText}>🔒 El chat fue cerrado. Gracias por comunicarte.</Animated.Text>
  </Animated.View>
) : (
  <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.inputContainer}>
    <TextInput
      placeholder={
        role === 'autoridad'
          ? 'Conversa con el ciudadano...'
          : 'Conversa con la autoridad...'
      }
      {...getFieldProps('message')}
      style={styles.input}
      editable={!sending}
    />
    <AnimatedButton
      onPress={sendMessage}
      style={[styles.sendButton, sending && { backgroundColor: '#999' }]}
      disabled={sending}
      animationType="bounce"
      iconName="send"
    >
      <Animated.Text style={styles.sendButtonText}>
        {sending ? '...' : 'Enviar'}
      </Animated.Text>
    </AnimatedButton>
  </Animated.View>
)}
    </KeyboardAvoidingView>
    </AnimatedScreen>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  messagesList: { padding: 10 },
  messageContainer: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#ADD8E6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },

  authorityMessage: {
    backgroundColor: '#E8F5E8',
    alignSelf: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },

  authorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  authorityLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginLeft: 4,
  },

  authorityMessageText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  messageText: { fontSize: 16 },
  timestamp: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopColor: '#DDD',
    borderTopWidth: 1,
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007BFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  sendButtonText: { color: 'white', fontWeight: 'bold' },
  closeChatButton: {
  backgroundColor: '#E53935',
  padding: 12,
  marginHorizontal: 20,
  borderRadius: 10,
  alignItems: 'center',
  marginBottom: 10,
},
closeChatButtonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 15,
},
closedBanner: {
  padding: 12,
  backgroundColor: '#EEE',
  borderTopColor: '#DDD',
  borderTopWidth: 1,
  alignItems: 'center',
},
closedText: {
    fontStyle: 'italic',
    color: '#555',
  },

});
