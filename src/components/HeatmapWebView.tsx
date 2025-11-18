import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing, fontSizes, borderRadius } from '../theme';

// Conditional import for WebView
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (error) {
  // WebView not available (likely in Expo Go)
  console.log('WebView not available, using fallback component');
}

interface HeatmapWebViewProps {
  html: string;
  style?: any;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

const HeatmapWebView: React.FC<HeatmapWebViewProps> = ({ 
  html, 
  style, 
  onLoadStart, 
  onLoadEnd 
}) => {
  // If WebView is available, use it
  if (WebView) {
    return (
      <WebView
        source={{ html }}
        style={style}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
      />
    );
  }

  // Fallback component for Expo Go
  return (
    <View style={[styles.fallbackContainer, style]}>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackTitle}>🗺️ Mapa de Calor</Text>
        <Text style={styles.fallbackSubtitle}>Funcionalidad no disponible en Expo Go</Text>
        <Text style={styles.fallbackDescription}>
          Para ver el mapa de calor interactivo, necesitas usar un development build.
        </Text>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Para habilitar esta función:</Text>
          <Text style={styles.instructionItem}>1. Ejecuta: npx eas build --profile development --platform android</Text>
          <Text style={styles.instructionItem}>2. Instala el APK generado</Text>
          <Text style={styles.instructionItem}>3. Ejecuta: npx expo start --dev-client</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  fallbackContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 350,
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  fallbackTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: fontSizes.md,
    color: colors.warning,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  fallbackDescription: {
    fontSize: fontSizes.base,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  instructionsContainer: {
    backgroundColor: colors.blue100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    color: colors.blue600,
    marginBottom: spacing.sm,
  },
  instructionItem: {
    fontSize: fontSizes.xs,
    color: colors.blue500,
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default HeatmapWebView;