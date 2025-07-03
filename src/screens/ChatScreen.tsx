import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { FlatList as FlatListType } from 'react-native';

const ChatScreen = () => {
  const route = useRoute();
  const { reportId }: any = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [allowed, setAllowed] = useState<boolean | null>(null); // null = cargando
  const flatListRef = useRef<FlatListType<any>>(null); // ✅ tipado correctamente

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
      const isCreator = reportData.email === currentUser.email;
      const isAuthority = currentUser.email?.includes('@autoridad');

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

  const sendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!input.trim() || !currentUser || !currentUser.email) return;

    const sender = currentUser.email.includes('@autoridad') ? 'autoridad' : 'ciudadano';

    await addDoc(collection(db, 'report_chats', reportId, 'messages'), {
      text: input,
      sender,
      uid: currentUser.uid,
      timestamp: serverTimestamp(),
    });

    setInput('');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Escribe un mensaje..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
});
