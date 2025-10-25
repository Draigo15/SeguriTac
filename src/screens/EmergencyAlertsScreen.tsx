import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { robustOnSnapshot } from '../services/firestoreWrapper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type EmergencyAlert = {
  id: string;
  userName: string;
  description: string;
  timestamp: any;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  status: string;
  userPhone: string;
};

const EmergencyAlertsScreen = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Suscribirse a las alertas de emergencia en tiempo real
    const q = query(
      collection(db, 'reports'),
      where('isEmergency', '==', true),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = robustOnSnapshot(
      q,
      (querySnapshot) => {
        // Type guard to ensure we have a QuerySnapshot
        if (!('docs' in querySnapshot)) return;
        
        const alertsData = querySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as EmergencyAlert[];
        setAlerts(alertsData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error cargando alertas de emergencia:', error);
        setLoading(false);
        Alert.alert('Error', 'No se pudieron cargar las alertas de emergencia');
      },
      { maxRetries: 3, retryDelay: 1000, enableLogging: true }
    );

    return () => unsubscribe();
  }, []);

  const handleAlertPress = (alert: EmergencyAlert) => {
    // Navegar al mapa con la ubicación de la emergencia
    if (alert.location) {
      navigation.navigate('AllReportsMap', {
        initialRegion: {
          latitude: alert.location.latitude,
          longitude: alert.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        focusedReportId: alert.id,
      });
    } else {
      Alert.alert('Sin ubicación', 'Esta alerta no tiene una ubicación registrada');
    }
  };

  const renderAlertItem = ({ item }: { item: EmergencyAlert }) => {
    const date = item.timestamp?.toDate() || new Date();
    const formattedDate = date.toLocaleString();

    return (
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.alertCard}
      >
        <TouchableOpacity
          style={styles.alertContent}
          onPress={() => handleAlertPress(item)}
        >
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={24} color={colors.error} />
            <Text style={styles.alertTitle}>{item.userName}</Text>
          </View>
          
          <Text style={styles.alertDescription}>{item.description}</Text>
          
          <View style={styles.alertFooter}>
            <Text style={styles.alertDate}>{formattedDate}</Text>
            <Text style={styles.alertPhone}>{item.userPhone}</Text>
          </View>

          {item.location && (
            <View style={styles.locationIndicator}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.locationText}>Ver en mapa</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Alertas de Emergencia</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : alerts.length > 0 ? (
          <FlatList
            data={alerts}
            renderItem={renderAlertItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.text} />
            <Text style={styles.emptyText}>No hay alertas de emergencia</Text>
          </View>
        )}
      </View>
    </AnimatedScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertContent: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  alertDescription: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertDate: {
    fontSize: 14,
    color: colors.textLight,
  },
  alertPhone: {
    fontSize: 14,
    color: colors.primary,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
});

export default EmergencyAlertsScreen;