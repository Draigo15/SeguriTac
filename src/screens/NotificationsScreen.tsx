import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { 
  colors, 
  spacing, 
  fontSizes,
  commonContainers,
  commonTexts
} from '../theme';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { logMetric } from '../utils/metrics';

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
  const t0 = Date.now();
  const currentUser = auth.currentUser;
  if (!currentUser?.email) return;

  try {
    const docRef = doc(db, 'user_notifications', currentUser.email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setNotifications(data.notifications || []);

      // ✅ Solo actualizamos si el documento existe
      await updateDoc(docRef, { hasUnread: false });
    } else {
      setNotifications([]);
    }

    // Métrica de carga de notificaciones
    logMetric('notifications_load_ms', Date.now() - t0, {
      count: (docSnap.data()?.notifications || []).length || 0,
    });
  } catch (error: any) {
    console.error('Error al cargar notificaciones:', error);
    logMetric('notifications_load_error_ms', Date.now() - t0, {});
    Toast.show({
      type: 'error',
      text1: 'Error al cargar notificaciones',
      text2: error.message || 'Ocurrió un problema al recuperar tus datos.',
    });
  } finally {
    setLoading(false);
  }
};

    fetchNotifications();
  }, []);

  const renderItem = ({ item, index }: { item: NotificationItem, index: number }) => (
    <Animated.View 
      style={styles.notificationItem}
      entering={FadeInDown.delay(index * 100).springify()}
    >
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
    </Animated.View>
  );

  return (
    <AnimatedScreen animationType="slideUp" duration={500}>
      <View style={styles.container}>
        <Animated.Text 
          style={styles.header}
          entering={FadeInUp.duration(600)}
        >
          📬 Notificaciones
        </Animated.Text>
        {loading ? (
          <ActivityIndicator size="large" color="#002B7F" style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <Animated.Text 
            style={styles.noNotificaciones}
            entering={FadeInUp.delay(300).duration(500)}
          >
            No tienes notificaciones.
          </Animated.Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        )}
      </View>
    </AnimatedScreen>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  header: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: colors.primary,
  },
  notificationItem: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  notificationTitle: {
    fontSize: fontSizes.base,
    fontWeight: 'bold',
    color: colors.white,
  },
  notificationBody: {
    fontSize: fontSizes.sm,
    color: colors.gray200,
    marginTop: spacing.xs,
  },
  notificationTimestamp: {
    fontSize: fontSizes.xs,
    color: colors.gray300,
    marginTop: spacing.xs,
  },
  noNotificaciones: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    color: colors.gray600,
    marginTop: spacing.xxl,
  },
});
