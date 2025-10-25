import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#002B7F',     // fondo
  secondary: '#0055CC',   // botones
  white: '#FFFFFF',
  
  text: '#FFFFFF',        // texto sobre fondo oscuro
  textLight: '#9ca3af',    // texto secundario/gris claro
  background: '#03276C',

  // Grises
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#9e9e9e',
  gray600: '#BCC5D3', 
  gray800: '#1f2937',
  gray900: '#111827',

  // Azules
  blue100: '#E3F2FD',
  blue500: '#2196f3',
  blue600: '#1e88e5',

  // Rojos
  red500: '#ef4444',
  error: '#ef4444',
  
  // Verdes
  green500: '#10b981',
  success: '#10b981',
  
  // Amarillos
  yellow500: '#f59e0b',
  warning: '#f59e0b',
};

export const spacing = {
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 48,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 26,
  xxl: 30,
};

export const borderRadius = {
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Estilos comunes para contenedores
export const commonContainers = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  authContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBackground: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.md,
  },
  lightContainer: {
    flex: 1,
    backgroundColor: colors.blue100,
    padding: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
});

// Estilos comunes para textos
export const commonTexts = StyleSheet.create({
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  authTitle: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.white,
  },
  loginTitle: {
    color: colors.white,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    fontSize: fontSizes.lg,
  },
  headerText: {
    fontSize: fontSizes.md,
    color: colors.white,
    fontWeight: '600',
  },
  linkText: {
    color: '#E0F7FA',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  linkTextBold: {
    color: '#E0F7FA',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  subtitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  bodyText: {
    fontSize: fontSizes.base,
    color: colors.text,
    lineHeight: 24,
  },
  caption: {
    fontSize: fontSizes.sm,
    color: colors.textLight,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

// Estilos comunes para inputs
export const commonInputs = StyleSheet.create({
  textInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.base,
    padding: spacing.md,
    fontSize: fontSizes.base,
    color: colors.gray900,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginBottom: spacing.md,
  },
  textInputFocused: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  textInputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  authInput: {
    flex: 1,
    height: 48,
    fontSize: fontSizes.base,
    color: colors.gray900,
  },
  loginInput: {
    width: '100%',
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
});

// Estilos comunes para botones
export const commonButtons = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  authButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.md,
  },
  loginButton: {
    width: '100%',
    backgroundColor: colors.secondary,
    marginTop: spacing.sm,
  },
  homeButton: {
    marginBottom: spacing.md,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginTop: spacing.sm,
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  dangerButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonDisabled: {
    backgroundColor: colors.gray400,
  },
  buttonText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.secondary,
  },
});

// Estilos comunes para listas
export const commonLists = StyleSheet.create({
  listItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.base,
    ...shadows.sm,
  },
  listItemTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  listItemSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
  },
});

// Estilos para estados de carga
export const commonLoading = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.text,
    marginTop: spacing.md,
  },
});

// Estilos comunes para logos e imágenes
export const commonImages = StyleSheet.create({
  authLogo: {
    width: 220,
    height: 220,
    marginBottom: spacing.md,
  },
  loginLogo: {
    width: 260,
    height: 260,
    marginBottom: spacing.md,
  },
  homeLogo: {
    width: 220,
    height: 220,
    marginTop: 80,
    marginBottom: 20,
  },
});

// Estilos comunes para layouts específicos
export const commonLayouts = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 50,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: colors.error,
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    zIndex: 100,
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 8,
    width: 10,
    height: 10,
  },
});
