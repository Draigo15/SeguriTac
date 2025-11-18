const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configuración específica para web y resolución de plataformas
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Configurar extensiones de archivo para resolución automática por plataforma
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.ts', 'native.ts', 'web.js', 'native.js', 'web.tsx', 'native.tsx'];

// Configurar alias solo para web - no interferir con plataformas nativas
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  // Solo aplicar alias en web, no en plataformas nativas
};

// Configurar resolverMainFields
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configuración específica para resolver módulos problemáticos SOLO en web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Solo aplicar redirecciones en plataforma web
  if (platform === 'web') {
    // Redirigir react-native-maps a nuestro stub solo en web
    if (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/')) {
      return {
        filePath: path.resolve(__dirname, 'src/utils/webMapStub.js'),
        type: 'sourceFile',
      };
    }
    
    // Redirigir codegenNativeCommands a nuestro stub solo en web
    if (moduleName === 'react-native/Libraries/Utilities/codegenNativeCommands') {
      return {
        filePath: path.resolve(__dirname, 'src/utils/codegenNativeCommandsStub.js'),
        type: 'sourceFile',
      };
    }
  }
  
  // Para plataformas nativas (ios, android, native), usar el resolver por defecto
  // Esto permite que react-native-maps funcione normalmente en Expo Go
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;