// src/utils/loadWebStyles.native.ts
// Archivo específico para React Native (Android/iOS)
// Este archivo se usa automáticamente en lugar del .ts cuando se ejecuta en plataformas nativas

export const loadWebStyles = () => {
  // No hacer nada en plataformas nativas
  // Este archivo evita que se importe el código web que usa 'document'
  console.log('Web styles not loaded on native platform');
};

// Exportación por defecto
export default loadWebStyles;