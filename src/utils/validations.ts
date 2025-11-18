/**
 * Utilidades de validación para la aplicación de Seguridad Ciudadana
 * Centraliza todas las validaciones para mantener consistencia y reutilización
 */

/**
 * Valida si un email tiene el formato correcto
 * @param email - El email a validar
 * @returns true si el email es válido, false en caso contrario
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida si una contraseña cumple con los requisitos mínimos
 * @param password - La contraseña a validar
 * @returns true si la contraseña es válida, false en caso contrario
 */
export const validatePassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // Mínimo 6 caracteres
  return password.length >= 6;
};

/**
 * Valida si un nombre tiene el formato correcto
 * @param name - El nombre a validar
 * @returns true si el nombre es válido, false en caso contrario
 */
export const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmedName = name.trim();
  // Mínimo 2 caracteres, solo letras y espacios
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/;
  return nameRegex.test(trimmedName) && trimmedName.length >= 2;
};

/**
 * Valida si un número de teléfono tiene el formato correcto
 * @param phone - El número de teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Acepta números con o sin espacios, guiones, paréntesis
  // Mínimo 9 dígitos
  const phoneRegex = /^[\d\s\-\(\)\+]{9,}$/;
  const digitsOnly = phone.replace(/[^\d]/g, '');
  
  return phoneRegex.test(phone) && digitsOnly.length >= 9;
};

/**
 * Valida si una descripción de reporte es válida
 * @param description - La descripción a validar
 * @returns true si la descripción es válida, false en caso contrario
 */
export const validateReportDescription = (description: string): boolean => {
  if (!description || typeof description !== 'string') {
    return false;
  }
  
  const trimmedDescription = description.trim();
  // Mínimo 10 caracteres, máximo 500
  return trimmedDescription.length >= 10 && trimmedDescription.length <= 500;
};

/**
 * Valida si un tipo de incidente es válido
 * @param incidentType - El tipo de incidente a validar
 * @returns true si el tipo de incidente es válido, false en caso contrario
 */
export const validateIncidentType = (incidentType: string): boolean => {
  if (!incidentType || typeof incidentType !== 'string') {
    return false;
  }
  
  const validTypes = ['Robo', 'Secuestro', 'Asalto', 'Violencia', 'Accidente', 'Otro'];
  return validTypes.includes(incidentType);
};

/**
 * Valida si las coordenadas de ubicación son válidas
 * @param latitude - La latitud
 * @param longitude - La longitud
 * @returns true si las coordenadas son válidas, false en caso contrario
 */
export const validateLocation = (latitude: number, longitude: number): boolean => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  
  // Validar rangos de latitud y longitud
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

/**
 * Valida si un campo requerido no está vacío
 * @param value - El valor a validar
 * @param fieldName - Nombre del campo (para mensajes de error)
 * @returns objeto con isValid y mensaje de error
 */
export const validateRequired = (value: any, fieldName: string): { isValid: boolean; message: string } => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      isValid: false,
      message: `${fieldName} es requerido`
    };
  }
  
  return {
    isValid: true,
    message: ''
  };
};

/**
 * Valida un formulario de registro completo
 * @param formData - Los datos del formulario
 * @returns objeto con isValid y array de errores
 */
export const validateRegistrationForm = (formData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validateName(formData.firstName)) {
    errors.push('El nombre debe tener al menos 2 caracteres y solo contener letras');
  }
  
  if (!validateName(formData.lastName)) {
    errors.push('El apellido debe tener al menos 2 caracteres y solo contener letras');
  }
  
  if (!validateEmail(formData.email)) {
    errors.push('El email no tiene un formato válido');
  }
  
  if (!validatePassword(formData.password)) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  if (!validatePhone(formData.phone)) {
    errors.push('El número de teléfono no es válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida un formulario de reporte completo
 * @param formData - Los datos del formulario de reporte
 * @returns objeto con isValid y array de errores
 */
export const validateReportForm = (formData: {
  incidentType: string;
  description: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validateIncidentType(formData.incidentType)) {
    errors.push('Debe seleccionar un tipo de incidente válido');
  }
  
  if (!validateReportDescription(formData.description)) {
    errors.push('La descripción debe tener entre 10 y 500 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};