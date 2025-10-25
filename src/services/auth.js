// Servicio de autenticación
import { auth } from '../config/firebase';

/**
 * Obtiene el usuario actualmente autenticado
 * @returns {Object|null} Usuario actual o null si no hay sesión
 */
export const getCurrentUser = () => {
  // En una implementación real, esto obtendría el usuario de Firebase Auth
  // Simulamos la funcionalidad para las pruebas
  return { 
    uid: 'user123', 
    email: 'test@example.com',
    displayName: 'Usuario Test' 
  };
};

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Usuario autenticado
 */
export const signIn = async (email, password) => {
  // En una implementación real, esto autenticaría con Firebase Auth
  // Simulamos la funcionalidad para las pruebas
  if (email === 'test@example.com' && password === 'password123') {
    return Promise.resolve({ 
      uid: 'user123', 
      email: 'test@example.com',
      displayName: 'Usuario Test' 
    });
  }
  
  return Promise.reject(new Error('Credenciales inválidas'));
};

/**
 * Cierra la sesión del usuario actual
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  // En una implementación real, esto cerraría sesión en Firebase Auth
  // Simulamos la funcionalidad para las pruebas
  return Promise.resolve();
};

export default {
  getCurrentUser,
  signIn,
  signOut
};