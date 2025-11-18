// src/utils/loadWebStyles.web.ts
// Archivo específico para plataforma web
// Este archivo se usa automáticamente cuando se ejecuta en navegadores

export const loadWebStyles = () => {
  // Solo ejecutar en entorno web real
  if (typeof document !== 'undefined') {
    try {
      // Comentado temporalmente debido a conflicto con TailwindCSS
      // const link = document.createElement('link');
      // link.rel = 'stylesheet';
      // link.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
      // if (document.head) {
      //   document.head.appendChild(link);
      // }
    } catch (error) {
      console.warn('Error creating web styles:', error);
    }
  }
};

// Exportación por defecto
export default loadWebStyles;