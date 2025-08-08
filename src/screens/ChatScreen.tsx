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
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { FlatList as FlatListType } from 'react-native';

const ChatScreen = () => {
  const route = useRoute();
  const { reportId }: any = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [role, setRole] = useState<'autoridad' | 'ciudadano' | null>(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatListType<any>>(null);

  const [chatClosed, setChatClosed] = useState(false);


  useEffect(() => {
    const checkPermissionAndLoadMessages = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const reportRef = doc(db, 'reports', reportId);
      const reportSnap = await getDoc(reportRef);

      if (!reportSnap.exists()) {
        setAllowed(false);
        return;
      }

      const reportData = reportSnap.data();
      setChatClosed(reportData.chatClosed || false);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
const userData = userDoc.exists() ? userDoc.data() : null;
const roleFromDB = userData?.role || null;

setRole(roleFromDB);

const isCreator = reportData.email === currentUser.email;
const isAuthority = roleFromDB === 'autoridad';

      if (isCreator || isAuthority) {
        setAllowed(true);

        const q = query(
          collection(db, 'report_chats', reportId, 'messages'),
          orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
      } else {
        setAllowed(false);
      }
    };

    checkPermissionAndLoadMessages();
  }, [reportId]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!role) return;
    const currentUser = auth.currentUser;
    if (!input.trim() || !currentUser || !currentUser.email || sending) return;

    setSending(true);
    const sender = role || 'ciudadano';

    try {
      await addDoc(collection(db, 'report_chats', reportId, 'messages'), {
        text: input.trim(),
        sender,
        uid: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      setInput('');
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
  } catch (error) {
    console.error('Error al cerrar chat manualmente:', error);
  }
};

  const renderItem = ({ item }: any) => {
    const isUser = item.uid === auth.currentUser?.uid;
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp?.seconds ? format(item.timestamp.toDate(), 'HH:mm') : '...'}
        </Text>
      </View>
    );
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
            return (
              <Animated.View
                entering={isUser ? FadeInUp.delay(index * 100).duration(300) : FadeInDown.delay(index * 100).duration(300)}
                style={[
                  styles.messageContainer,
                  isUser ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Animated.Text style={styles.messageText}>{item.text}</Animated.Text>
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
      value={input}
      onChangeText={setInput}
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
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
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
