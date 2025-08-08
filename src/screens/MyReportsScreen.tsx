import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';

const MyReportsScreen = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    const q = query(
      collection(db, 'reports'),
      where('email', '==', userEmail),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userReports: any[] = [];
      querySnapshot.forEach((doc) => {
        userReports.push({ id: doc.id, ...doc.data() });
      });
      setReports(userReports);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handlePressReport = (report: any) => {
    // @ts-ignore
    navigation.navigate('ReportDetail', { report });
  };

  return (
    <AnimatedScreen animationType="slideHorizontal" duration={800}>
    <View style={styles.container}>
      <Animated.Text 
        entering={FadeInDown.duration(800)}
        style={styles.title}
      >
        📄 Mis Reportes
      </Animated.Text>

      {loading ? (
        <Animated.View entering={FadeInUp.duration(800)} style={{alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#002B7F" style={{ marginTop: 50 }} />
        </Animated.View>
      ) : reports.length === 0 ? (
        <Animated.Text 
          entering={FadeInUp.duration(800)}
          style={styles.noReports}
        >
          No tienes reportes aún.
        </Animated.Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp.delay(index * 100).duration(500)}
            >
              <AnimatedButton
                style={styles.reportItem}
                animationType="scale"
                onPress={() => {
                  if (
                    item &&
                    item.incidentType &&
                    item.dateFormatted &&
                    item.description &&
                    item.status &&
                    item.location &&
                    typeof item.location.latitude === 'number' &&
                    typeof item.location.longitude === 'number'
                  ) {
                    handlePressReport(item);
                  } else {
                    alert('⚠️ Este reporte está incompleto o mal formateado.');
                  }
                }}
              >
                <Animated.Text style={styles.reportTitle}>📌 {item.incidentType}</Animated.Text>
                <Animated.Text style={styles.reportDate}>🗓 {item.dateFormatted}</Animated.Text>
                <Animated.Text style={styles.reportStatus}>
                  Estado: {item.status ?? 'Pendiente'}
                </Animated.Text>
              </AnimatedButton>
            </Animated.View>
          )}
        />
      )}
    </View>
    </AnimatedScreen>
  );
};

export default MyReportsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#002B7F',
    marginBottom: 20,
    textAlign: 'center',
  },
  noReports: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 50,
  },
  reportItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#2196f3',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002B7F',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: '#444',
  },
  reportStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
