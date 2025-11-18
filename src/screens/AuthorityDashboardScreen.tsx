import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import AnimatedButton from '../components/AnimatedButton';
import Sidebar from '../components/Sidebar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing, commonContainers, commonTexts, shadows, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

type AuthorityDashboardNav = NativeStackNavigationProp<RootStackParamList, 'AuthorityDashboard'>;

const AuthorityDashboardScreen = () => {
  const navigation = useNavigation<AuthorityDashboardNav>();
  const [userName, setUserName] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    todayReports: 0,
    urgentReports: 0,
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const isDetoxE2E = !!Constants.expoConfig?.extra?.detoxE2E;

  useFocusEffect(
    useCallback(() => {
      if (isDetoxE2E) {
        setUserName('Autoridad E2E');
        setStats({
          totalReports: 0,
          pendingReports: 0,
          resolvedReports: 0,
          todayReports: 0,
          urgentReports: 0,
        });
        setRecentReports([]);
        return; // Saltar consultas a Firestore en modo Detox
      }

      loadUserData();
      loadStats();
      loadRecentReports();
    }, [isDetoxE2E])
  );

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await import('firebase/firestore').then(({ doc, getDoc }) => 
          getDoc(doc(db, 'users', currentUser.uid))
        );
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(`${userData.firstName || ''} ${userData.lastName || ''}`.trim());
        } else {
          console.warn('⚠️ Documento de usuario no encontrado');
        }
      }
    } catch (error: any) {
      console.error('❌ Error crítico al cargar datos del usuario:', error);
      // Solo mostrar toast si es un error real de red o permisos
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        Toast.show({
          type: 'error',
          text1: 'Error de conexión',
          text2: 'No se pudieron cargar los datos del usuario'
        });
      }
    }
  };

  const loadStats = async () => {
    try {
      const reportsRef = collection(db, 'reports');
      
      // Total de reportes
      const totalQuery = query(reportsRef);
      const totalSnapshot = await getDocs(totalQuery);
      const totalReports = totalSnapshot.size;

      // Reportes pendientes
      const pendingQuery = query(reportsRef, where('status', '==', 'Pendiente'));
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingReports = pendingSnapshot.size;

      // Reportes resueltos
      const resolvedQuery = query(reportsRef, where('status', '==', 'Resuelto'));
      const resolvedSnapshot = await getDocs(resolvedQuery);
      const resolvedReports = resolvedSnapshot.size;

      // Reportes de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = query(reportsRef, where('timestamp', '>=', today));
      const todaySnapshot = await getDocs(todayQuery);
      const todayReports = todaySnapshot.size;

      // Reportes urgentes (pendientes de tipos críticos)
      const urgentTypes = ['Robo', 'Violencia', 'Accidente', 'Emergencia'];
      let urgentReports = 0;
      
      for (const type of urgentTypes) {
        const urgentQuery = query(
          reportsRef, 
          where('status', '==', 'Pendiente'),
          where('incidentType', '==', type)
        );
        const urgentSnapshot = await getDocs(urgentQuery);
        urgentReports += urgentSnapshot.size;
      }

      setStats({
        totalReports,
        pendingReports,
        resolvedReports,
        todayReports,
        urgentReports,
      });
      
      console.log('✅ Estadísticas cargadas correctamente:', {
        totalReports,
        pendingReports,
        resolvedReports,
        todayReports,
        urgentReports
      });
    } catch (error: any) {
      console.error('❌ Error crítico al cargar estadísticas:', error);
      // Solo mostrar toast para errores reales
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        Toast.show({
          type: 'error',
          text1: 'Error de conexión',
          text2: 'No se pudieron cargar las estadísticas'
        });
      }
    }
  };

  const loadRecentReports = async () => {
    try {
      const reportsRef = collection(db, 'reports');
      const recentQuery = query(
        reportsRef,
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(recentQuery);
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentReports(reports);
      console.log(`✅ ${reports.length} reportes recientes cargados`);
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.warn('⚠️ Permisos insuficientes para reportes recientes (posible entorno E2E/dev):', error);
      } else {
        console.error('❌ Error crítico al cargar reportes recientes:', error);
      }
      // Solo mostrar toast para errores críticos
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        Toast.show({
          type: 'error',
          text1: 'Error de conexión',
          text2: 'No se pudieron cargar los reportes recientes'
        });
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStats(),
      loadRecentReports(),
    ]);
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color, delay }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    delay: number;
  }) => (
    <Animated.View 
      entering={FadeInUp.delay(delay).duration(600)}
      style={[styles.statCard, { borderLeftColor: color }]}
    >
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color={colors.white} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const RecentReportItem = ({ report, index }: { report: any; index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(600 + index * 100).duration(600)}
      style={styles.reportItem}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('ReportDetail', { report })}
        style={styles.reportContent}
      >
        <View style={styles.reportLeft}>
          <View style={[styles.reportStatus, { 
            backgroundColor: report.status === 'Pendiente' ? colors.yellow500 : 
                           report.status === 'Resuelto' ? colors.green500 : colors.blue500 
          }]} />
          <View style={styles.reportInfo}>
            <Text style={styles.reportType} numberOfLines={1}>{report.type}</Text>
            <Text style={styles.reportLocation} numberOfLines={1}>
              {report.location?.latitude && report.location?.longitude 
                ? `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`
                : 'Ubicación no disponible'
              }
            </Text>
            <Text style={styles.reportTime}>
              {report.timestamp?.toDate ? 
                new Date(report.timestamp.toDate()).toLocaleDateString() : 
                report.createdAt?.toDate ? 
                  new Date(report.createdAt.toDate()).toLocaleDateString() :
                  report.dateFormatted || new Date().toLocaleDateString()
              }
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <AnimatedScreen animationType="fade" duration={500}>
      <View style={styles.container} testID="dashboard-authority">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setSidebarVisible(true)}
            testID="open-sidebar"
          >
            <Ionicons name="menu" size={28} color={colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Panel de Autoridad</Text>
            <Text style={styles.subtitle}>Bienvenido, {userName || 'Autoridad'}</Text>
          </View>

          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Estadísticas */}
          <Animated.Text 
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.sectionTitle}
          >
            Estadísticas Generales
          </Animated.Text>

          <View style={styles.statsGrid}>
            <StatCard
              title="Total Reportes"
              value={stats.totalReports}
              icon="document-text"
              color={colors.primary}
              delay={300}
            />
            <StatCard
              title="Pendientes"
              value={stats.pendingReports}
              icon="time"
              color={colors.yellow500}
              delay={350}
            />
            <StatCard
              title="Resueltos"
              value={stats.resolvedReports}
              icon="checkmark-circle"
              color={colors.green500}
              delay={400}
            />
            <StatCard
              title="Hoy"
              value={stats.todayReports}
              icon="today"
              color={colors.blue500}
              delay={450}
            />
            <StatCard
              title="Urgentes"
              value={stats.urgentReports}
              icon="warning"
              color={colors.error}
              delay={500}
            />
          </View>

          {/* Acciones Rápidas */}
          <Animated.Text 
            entering={FadeInDown.delay(550).duration(600)}
            style={styles.sectionTitle}
          >
            Acciones Rápidas
          </Animated.Text>

          <View style={styles.actionsGrid}>
            <Animated.View entering={FadeInUp.delay(600).duration(600)}>
              <AnimatedButton
                title="Ver Todos los Reportes"
                onPress={() => navigation.navigate('ViewAllReports')}
                style={styles.actionButton}
                textStyle={styles.actionButtonText}
                iconColor={colors.white}
                animationType="scale"
                icon="document-text-outline"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(650).duration(600)}>
              <AnimatedButton
                title="Mapa de Reportes"
                onPress={() => navigation.navigate('AllReportsMap')}
                style={styles.actionButton}
                textStyle={styles.actionButtonText}
                iconColor={colors.white}
                animationType="scale"
                icon="map-outline"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(700).duration(600)}>
              <AnimatedButton
                title="Estadísticas Detalladas"
                onPress={() => navigation.navigate('ReportStats')}
                style={styles.actionButton}
                textStyle={styles.actionButtonText}
                iconColor={colors.white}
                animationType="scale"
                icon="bar-chart-outline"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(750).duration(600)}>
              <AnimatedButton
                title="Alertas de Emergencia"
                onPress={() => navigation.navigate('EmergencyAlerts')}
                style={[styles.actionButton, styles.emergencyButton]}
                animationType="scale"
                icon="warning-outline"
              />
            </Animated.View>
          </View>

          {/* Reportes Recientes */}
          <Animated.Text 
            entering={FadeInDown.delay(800).duration(600)}
            style={styles.sectionTitle}
          >
            Reportes Recientes
          </Animated.Text>

          <View style={styles.recentReports}>
            {recentReports.length > 0 ? (
              recentReports.map((report, index) => (
                <RecentReportItem key={report.id} report={report} index={index} />
              ))
            ) : (
              <Animated.View 
                entering={FadeInUp.delay(900).duration(600)}
                style={styles.emptyState}
              >
                <Ionicons name="document-outline" size={48} color={colors.gray400} />
                <Text style={styles.emptyText}>No hay reportes recientes</Text>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Sidebar */}
        <Sidebar
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          userName={userName}
          userType="authority"
        />

        <Toast />
      </View>
    </AnimatedScreen>
  );
};

export default AuthorityDashboardScreen;

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
  },
  menuButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
    marginTop: spacing.xs / 2,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '48%',
    borderLeftWidth: 4,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  statTitle: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
    marginTop: spacing.xs / 2,
  },
  actionsGrid: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  actionButtonText: {
    color: colors.white,
  },
  emergencyButton: {
    backgroundColor: colors.error,
  },
  recentReports: {
    marginBottom: spacing.xl,
  },
  reportItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  reportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  reportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportStatus: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs / 2,
  },
  reportLocation: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
    marginBottom: spacing.xs / 2,
  },
  reportTime: {
    fontSize: fontSizes.xs,
    color: colors.gray400,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.gray300,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
