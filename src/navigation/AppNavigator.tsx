import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Linking } from 'react-native';
import { logMetric } from '../utils/metrics';
import Constants from 'expo-constants';

// Importamos las transiciones personalizadas
import {
  fadeTransition,
  slideHorizontalTransition,
  slideVerticalTransition,
  zoomTransition,
  rotateZoomTransition
} from '../utils/transitions';

import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ReportScreen from '../screens/ReportScreen';
import MyReportsScreen from '../screens/MyReportsScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import RoleSelectorScreen from '../screens/RoleSelectorScreen';
import AuthorityDashboardScreen from '../screens/AuthorityDashboardScreen';
import ViewAllReportsScreen from '../screens/ViewAllReportsScreen';
import ReportStatsScreen from '../screens/ReportStatsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CitizenProfileScreen from '../screens/CitizenProfileScreen';
import AllReportsMapScreen from '../screens/AllReportsMapScreen';
import MyReportsMapScreen from '../screens/MyReportsMapScreen';
import LoginMethodScreen from '../screens/LoginMethodScreen';
import ChatScreen from '../screens/ChatScreen';
import IntelligentChatbotScreen from '../screens/IntelligentChatbotScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import EmergencyAlertsScreen from '../screens/EmergencyAlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CitizenMetricsDashboard from '../screens/CitizenMetricsDashboard';
import IncidentHeatmapScreen from '../screens/IncidentHeatmapScreen';
import DataExportScreen from '../screens/DataExportScreen';
import MFAEmailVerifyScreen from '../screens/MFAEmailVerifyScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const navigationRef = React.useRef<any>(null);
  const prevNavTs = React.useRef<number | null>(null);

  // Helper para extraer parámetros de query de una URL
  const getQueryParam = React.useCallback((url: string, key: string): string | undefined => {
    try {
      const qIndex = url.indexOf('?');
      if (qIndex === -1) return undefined;
      const query = url.substring(qIndex + 1);
      const pairs = query.split('&');
      for (const p of pairs) {
        const [k, v] = p.split('=');
        if (decodeURIComponent(k) === key) {
          return decodeURIComponent(v || '');
        }
      }
      return undefined;
    } catch (_) {
      return undefined;
    }
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // @ts-ignore
        const t0 = (globalThis as any).__APP_START_TS__ || Date.now();
        logMetric('navigation_ready_ms', Date.now() - t0, { initialRoute: 'AuthLoading' });

        // Manejo de deeplink de desarrollo para E2E (navegar directo a Login con rol)
        if (Constants.expoConfig?.extra?.detoxE2E) {
          Linking.getInitialURL()
            .then((url) => {
              if (url && url.includes('login')) {
                const role = getQueryParam(url, 'role') || 'autoridad';
                const disableBypassParam = getQueryParam(url, 'disableBypass');
                const disableBypass = disableBypassParam === '1' || disableBypassParam === 'true';
                // Resetear la navegación para asegurar la ruta inicial determinista
                navigationRef.current?.reset({
                  index: 0,
                  routes: [{ name: 'Login', params: { role, disableBypass } }],
                });
              }
            })
            .catch(() => {/* noop */});
        }
      }}
      onStateChange={() => {
        const now = Date.now();
        const delta = prevNavTs.current ? now - prevNavTs.current : 0;
        prevNavTs.current = now;
        const currentRoute = navigationRef.current?.getCurrentRoute?.();
        const routeName = currentRoute?.name || 'unknown';
        logMetric('navigation_event_delta_ms', delta, { route: routeName });
      }}
    >
      <Stack.Navigator
        initialRouteName={Constants.expoConfig?.extra?.detoxE2E ? 'Login' : (__DEV__ ? 'Login' : 'AuthLoading')}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#002B7F',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false, // ✅ quita la sombra/borde
          // Aplicamos animaciones solo en dispositivos nativos (no web)
          ...(Platform.OS !== 'web' ? slideHorizontalTransition : {}),
          // Añadimos una animación de presentación personalizada
          animation: 'slide_from_right',
          // Habilitamos los gestos para volver atrás
          gestureEnabled: true,
          // Añadimos una transición personalizada para la presentación
          presentation: 'card',
        }}
      >
        <Stack.Screen 
          name="AuthLoading" 
          component={AuthLoadingScreen} 
          options={{ headerShown: false, ...fadeTransition }} 
        />
        <Stack.Screen 
          name="RoleSelector" 
          component={RoleSelectorScreen} 
          options={{ headerShown: false, ...zoomTransition }} 
        />
        <Stack.Screen 
          name="LoginMethod" 
          component={LoginMethodScreen} 
          options={{ ...fadeTransition }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Registro', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="MFAEmailVerify" 
          component={MFAEmailVerifyScreen} 
          options={{ title: 'Verificar Código', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false, ...zoomTransition }} 
        />
        <Stack.Screen 
          name="AuthorityDashboard" 
          component={AuthorityDashboardScreen} 
          options={{ headerShown: false, ...zoomTransition }} 
        />
        <Stack.Screen 
          name="Report" 
          component={ReportScreen} 
          options={{ title: 'Reportar Incidente', ...slideVerticalTransition }} 
        />
        <Stack.Screen 
          name="MyReports" 
          component={MyReportsScreen} 
          options={{ title: 'Mis Reportes', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="ReportDetail" 
          component={ReportDetailScreen} 
          options={{ title: 'Detalle del Reporte', ...zoomTransition }} 
        />
        <Stack.Screen 
          name="ViewAllReports" 
          component={ViewAllReportsScreen} 
          options={{ title: 'Todos los Reportes', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="ReportStats" 
          component={ReportStatsScreen} 
          options={{ title: 'Estadísticas de Reportes', ...slideVerticalTransition }} 
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ title: 'Notificaciones', ...slideVerticalTransition }} 
        />
        <Stack.Screen 
          name="CitizenProfile" 
          component={CitizenProfileScreen} 
          options={{ title: 'Perfil del Ciudadano', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="AllReportsMap" 
          component={AllReportsMapScreen} 
          options={{ title: 'Mapa de Reportes', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="MyReportsMap" 
          component={MyReportsMapScreen} 
          options={{ title: 'Mis Reportes en Mapa', ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ title: 'Chat con Autoridad', ...rotateZoomTransition }} 
        />
        <Stack.Screen 
          name="IntelligentChatbot" 
          component={IntelligentChatbotScreen} 
          options={{ headerShown: false, ...slideVerticalTransition }} 
        />
        <Stack.Screen 
          name="Emergency" 
          component={EmergencyScreen} 
          options={{ 
            headerShown: false, 
            ...fadeTransition,
            gestureEnabled: false // Desactivamos gestos para evitar salir accidentalmente
          }} 
        />
        <Stack.Screen 
          name="EmergencyAlerts" 
          component={EmergencyAlertsScreen} 
          options={{ 
            title: 'Alertas de Emergencia',
            ...slideHorizontalTransition,
            headerStyle: {
              backgroundColor: '#002B7F',
            },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Configuración', ...slideVerticalTransition }} 
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen} 
          options={{ headerShown: false, ...slideVerticalTransition }} 
        />
        <Stack.Screen 
          name="CitizenMetricsDashboard" 
          component={CitizenMetricsDashboard} 
          options={{ headerShown: false, ...zoomTransition }} 
        />
        <Stack.Screen 
          name="IncidentHeatmap" 
          component={IncidentHeatmapScreen} 
          options={{ headerShown: false, ...slideHorizontalTransition }} 
        />
        <Stack.Screen 
          name="DataExport" 
          component={DataExportScreen} 
          options={{ headerShown: false, ...slideVerticalTransition }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
  // Listener de deep links en runtime para entorno E2E
  // Permite manejar device.openURL(...) después del arranque
  React.useEffect(() => {
    if (!Constants.expoConfig?.extra?.detoxE2E) return;

    const handler = (event: { url: string }) => {
      const url = event?.url || '';
      if (url.includes('login')) {
        const role = getQueryParam(url, 'role') || 'autoridad';
        const disableBypassParam = getQueryParam(url, 'disableBypass');
        const disableBypass = disableBypassParam === '1' || disableBypassParam === 'true';
        try {
          // Reset para asegurar navegación determinista
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: 'Login', params: { role, disableBypass } }],
          });
        } catch (_) {/* noop */}
      }
    };

    const sub: any = (Linking as any).addEventListener('url', handler);
    return () => {
      try {
        if (sub?.remove) sub.remove();
        else (Linking as any).removeEventListener?.('url', handler);
      } catch (_) {/* noop */}
    };
  }, [getQueryParam]);
};

export default AppNavigator;
