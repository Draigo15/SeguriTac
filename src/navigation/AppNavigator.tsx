import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

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
import LoginMethodScreen from '../screens/LoginMethodScreen';
import ChatScreen from '../screens/ChatScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import EmergencyAlertsScreen from '../screens/EmergencyAlertsScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AuthLoading"
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
          name="Chat" 
          component={ChatScreen} 
          options={{ ...rotateZoomTransition }} 
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
