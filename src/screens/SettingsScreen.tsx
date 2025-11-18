import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import {
  colors,
  spacing,
  fontSizes,
  commonContainers,
  commonTexts,
  borderRadius,
  shadows,
} from '../theme';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type SettingsScreenNav = NativeStackNavigationProp<RootStackParamList>;

interface SettingsData {
  notifications: boolean;
  locationSharing: boolean;
  emergencyAlerts: boolean;
  dataCollection: boolean;
  mfaEnabled: boolean;
}

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNav>();
  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    locationSharing: true,
    emergencyAlerts: true,
    dataCollection: false,
    mfaEnabled: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Cargar configuraciones desde Firestore
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.settings) {
          // Mezclar con valores por defecto para evitar undefined en nuevas claves
          setSettings(prev => ({ ...prev, ...userData.settings }));
        }
      }

      // También cargar configuraciones locales
      const localSettings = await AsyncStorage.getItem('userSettings');
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error: any) {
      console.error('Error al cargar configuraciones:', error);
    }
  };

  const updateSetting = async (key: keyof SettingsData, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));

      // Guardar en Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        await updateDoc(docRef, {
          settings: newSettings,
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Configuración actualizada',
      });
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      Toast.show({
        type: 'error',
        text1: 'Error al guardar configuración',
      });
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Cambiar Contraseña',
      'Se enviará un enlace de restablecimiento a tu correo electrónico.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              const { sendPasswordResetEmail } = await import('firebase/auth');
              if (auth.currentUser?.email) {
                await sendPasswordResetEmail(auth, auth.currentUser.email);
                Toast.show({
                  type: 'success',
                  text1: 'Enlace enviado',
                  text2: 'Revisa tu correo electrónico',
                });
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error al enviar enlace',
              });
            }
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Limpiar Caché',
      '¿Estás seguro de que quieres limpiar el caché de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Toast.show({
                type: 'success',
                text1: 'Caché limpiado',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error al limpiar caché',
              });
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Alert.alert(
      'Política de Privacidad',
      'Aquí se mostraría la política de privacidad de la aplicación.',
      [{ text: 'Entendido' }]
    );
  };

  const openTermsOfService = () => {
    Alert.alert(
      'Términos de Servicio',
      'Aquí se mostrarían los términos de servicio de la aplicación.',
      [{ text: 'Entendido' }]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    rightComponent, 
    delay = 0 
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    delay?: number;
  }) => (
    <Animated.View entering={FadeInUp.delay(delay).duration(600)}>
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Icon name={icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightComponent || (
          <Icon name="chevron-right" size={20} color={colors.gray400} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const SectionHeader = ({ title, delay = 0 }: { title: string; delay?: number }) => (
    <Animated.Text
      entering={FadeInDown.delay(delay).duration(600)}
      style={styles.sectionHeader}
    >
      {title}
    </Animated.Text>
  );

  return (
    <AnimatedScreen animationType="slideVertical" duration={800}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text
          entering={FadeInDown.duration(800)}
          style={commonTexts.title}
        >
          Configuración
        </Animated.Text>

        {/* Notificaciones */}
        <SectionHeader title="Notificaciones" delay={100} />
        
        <SettingItem
          title="Notificaciones Push"
          subtitle="Recibir notificaciones de la aplicación"
          icon="bell-outline"
          delay={200}
          rightComponent={
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={settings.notifications ? colors.white : colors.gray500}
            />
          }
        />

        <SettingItem
          title="Alertas de Emergencia"
          subtitle="Recibir alertas de emergencia en tu área"
          icon="alert-outline"
          delay={250}
          rightComponent={
            <Switch
              value={settings.emergencyAlerts}
              onValueChange={(value) => updateSetting('emergencyAlerts', value)}
              trackColor={{ false: colors.gray300, true: colors.error }}
              thumbColor={settings.emergencyAlerts ? colors.white : colors.gray500}
            />
          }
        />

        {/* Privacidad */}
        <SectionHeader title="Privacidad y Seguridad" delay={300} />
        
        <SettingItem
          title="Verificación en dos pasos"
          subtitle="Solicitar código al iniciar sesión"
          icon="shield-key-outline"
          delay={325}
          rightComponent={
            <Switch
              value={settings.mfaEnabled}
              onValueChange={(value) => updateSetting('mfaEnabled', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={settings.mfaEnabled ? colors.white : colors.gray500}
            />
          }
        />

        <SettingItem
          title="Compartir Ubicación"
          subtitle="Permitir compartir ubicación en reportes"
          icon="map-marker-outline"
          delay={350}
          rightComponent={
            <Switch
              value={settings.locationSharing}
              onValueChange={(value) => updateSetting('locationSharing', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={settings.locationSharing ? colors.white : colors.gray500}
            />
          }
        />

        <SettingItem
          title="Recopilación de Datos"
          subtitle="Permitir recopilación de datos para mejorar la app"
          icon="database-outline"
          delay={400}
          rightComponent={
            <Switch
              value={settings.dataCollection}
              onValueChange={(value) => updateSetting('dataCollection', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={settings.dataCollection ? colors.white : colors.gray500}
            />
          }
        />

        <SettingItem
          title="Cambiar Contraseña"
          subtitle="Actualizar tu contraseña de acceso"
          icon="lock-outline"
          onPress={() => navigation.navigate('ChangePassword')}
          delay={450}
        />

        {/* Cuenta */}
        <SectionHeader title="Mi Cuenta" delay={500} />
        
        <SettingItem
          title="Editar Perfil"
          subtitle="Actualizar información personal"
          icon="account-edit-outline"
          onPress={() => navigation.navigate('CitizenProfile')}
          delay={550}
        />

        {/* Aplicación */}
        <SectionHeader title="Aplicación" delay={600} />
        
        <SettingItem
          title="Limpiar Caché"
          subtitle="Liberar espacio de almacenamiento"
          icon="broom"
          onPress={handleClearCache}
          delay={650}
        />

        <SettingItem
          title="Política de Privacidad"
          subtitle="Leer nuestra política de privacidad"
          icon="shield-account-outline"
          onPress={openPrivacyPolicy}
          delay={700}
        />

        <SettingItem
          title="Términos de Servicio"
          subtitle="Leer términos y condiciones"
          icon="file-document-outline"
          onPress={openTermsOfService}
          delay={750}
        />

        {/* Información de la App */}
        <SectionHeader title="Información" delay={800} />
        
        <SettingItem
          title="Versión de la App"
          subtitle="1.0.0"
          icon="information-outline"
          delay={850}
          rightComponent={<Text style={styles.versionText}>v1.0.0</Text>}
        />

        <Toast />
      </ScrollView>
    </AnimatedScreen>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: spacing.xs / 2,
  },
  settingSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
  },
  versionText: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
    fontWeight: '500',
  },
});