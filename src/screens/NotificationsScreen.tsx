import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp?: any;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser?.email) return;

      try {
        const docRef = doc(db, 'user_notifications', currentUser.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setNotifications(data.notifications || []);
        }

        await updateDoc(docRef, { hasUnread: false });
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={styles.notificationItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons
          name="notifications-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.notificationTitle}>{item.title}</Text>
      </View>
      <Text style={styles.notificationBody}>{item.body}</Text>
      {item.timestamp?.toDate && (
        <Text style={styles.notificationTimestamp}>
          {item.timestamp.toDate().toLocaleString('es-PE')}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📬 Notificaciones</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#002B7F" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <Text style={styles.noNotificaciones}>No tienes notificaciones.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#002B7F',
  },
  notificationItem: {
    backgroundColor: '#002B7F',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationBody: {
    fontSize: 15,
    color: '#eee',
    marginTop: 5,
  },
  notificationTimestamp: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 6,
  },
  noNotificaciones: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
});
