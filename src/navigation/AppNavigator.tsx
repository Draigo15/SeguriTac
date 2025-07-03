import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
        }}
      >
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RoleSelector" component={RoleSelectorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginMethod" component={LoginMethodScreen} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AuthorityDashboard" component={AuthorityDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Reportar Incidente' }} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} options={{ title: 'Mis Reportes' }} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Detalle del Reporte' }} />
        <Stack.Screen name="ViewAllReports" component={ViewAllReportsScreen} options={{ title: 'Todos los Reportes' }} />
        <Stack.Screen name="ReportStats" component={ReportStatsScreen} options={{ title: 'Estadísticas de Reportes' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
        <Stack.Screen name="CitizenProfile" component={CitizenProfileScreen} options={{ title: 'Perfil del Ciudadano' }} />
        <Stack.Screen name="AllReportsMap" component={AllReportsMapScreen} options={{ title: 'Mapa de Reportes' }} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
