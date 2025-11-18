// Stub para react-native/Libraries/Utilities/codegenNativeCommands
// Este módulo es específico de React Native y no existe en web

const codegenNativeCommands = (spec) => {
  // Retorna un objeto con métodos vacíos basado en la especificación
  const commands = {};
  
  if (spec && typeof spec === 'object') {
    Object.keys(spec).forEach(key => {
      commands[key] = () => {
        // Método stub que no hace nada en web
        console.warn(`Native command '${key}' is not available on web platform`);
      };
    });
  }
  
  return commands;
};

export default codegenNativeCommands;