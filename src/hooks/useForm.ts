import { useState, useCallback, useRef, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

export interface FormField {
  value: string;
  error?: string;
  touched: boolean;
  valid: boolean;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  message?: string;
}

export interface FormConfig<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule>>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  submitOnEnter?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  handleChange: (field: keyof T) => (value: string) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => () => Promise<void>;
  reset: () => void;
  setSubmitting: (submitting: boolean) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  getFieldProps: (field: keyof T) => {
    value: any;
    onChangeText: (value: string) => void;
    onBlur: () => void;
    error: string | undefined;
  };
}

/**
 * Hook optimizado para manejo de formularios en móvil
 * 
 * Características:
 * - Validación en tiempo real optimizada
 * - Gestión automática del teclado
 * - Soporte para validaciones personalizadas
 * - Optimización de re-renders
 * - Integración con componentes de React Native
 * - Manejo de estados de carga y errores
 */
export function useForm<T extends Record<string, any>>(
  config: FormConfig<T>
): UseFormReturn<T> {
  const {
    initialValues,
    validationRules = {},
    validateOnChange = false,
    validateOnBlur = true,
    submitOnEnter = false,
  } = config;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialValuesRef = useRef(initialValues);
  const keyboardDidShowListener = useRef<any>(null);
  const keyboardDidHideListener = useRef<any>(null);

  // Validar un campo específico
  const validateField = useCallback(
    (field: keyof T): boolean => {
      const value = values[field];
      const rules = validationRules && field in validationRules ? (validationRules as Record<keyof T, ValidationRule>)[field] : undefined;

      if (!rules) return true;

      // Validación requerida
      if (rules.required && (!value || String(value).trim() === '')) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} es requerido`,
        }));
        return false;
      }

      // Validación de longitud mínima
      if (rules.minLength && value && value.toString().length < rules.minLength) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} debe tener al menos ${rules.minLength} caracteres`,
        }));
        return false;
      }

      // Validación de longitud máxima
      if (rules.maxLength && value && value.toString().length > rules.maxLength) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} no puede tener más de ${rules.maxLength} caracteres`,
        }));
        return false;
      }

      // Validación de patrón
      if (rules.pattern && value && !rules.pattern.test(value.toString())) {
        setErrors(prev => ({
          ...prev,
          [field]: rules.message || `${String(field)} tiene un formato inválido`,
        }));
        return false;
      }

      // Validación personalizada
      if (rules.custom && value) {
        const customError = rules.custom(value.toString());
        if (customError) {
          setErrors(prev => ({
            ...prev,
            [field]: customError,
          }));
          return false;
        }
      }

      // Si llegamos aquí, el campo es válido
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    },
    [values, validationRules]
  );

  // Validar todo el formulario
  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(validationRules).forEach(fieldKey => {
      const field = fieldKey as keyof T;
      const isFieldValid = validateField(field);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }, [validateField, validationRules]);

  // Establecer valor de un campo
  const setValue = useCallback(
    (field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);

      if (validateOnChange) {
        // Usar setTimeout para evitar validaciones excesivas
        setTimeout(() => validateField(field), 100);
      }
    },
    [validateOnChange, validateField]
  );

  // Manejar cambio de campo
  const handleChange = useCallback(
    (field: keyof T) => (value: string) => {
      setValue(field, value);
    },
    [setValue]
  );

  // Manejar blur de campo
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      
      if (validateOnBlur) {
        validateField(field);
      }
    },
    [validateOnBlur, validateField]
  );

  // Establecer error de un campo
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Limpiar error de un campo
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Limpiar todos los errores
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void> | void) => async () => {
      try {
        setIsSubmitting(true);
        
        // Marcar todos los campos como tocados
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof T, boolean>>
        );
        setTouched(allTouched);

        // Validar formulario
        const isFormValid = validateForm();
        
        if (!isFormValid) {
          setIsSubmitting(false);
          return;
        }

        // Ocultar teclado en móvil
        if (Platform.OS !== 'web') {
          Keyboard.dismiss();
        }

        // Ejecutar función de envío
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm]
  );

  // Resetear formulario
  const reset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, []);

  // Establecer estado de envío
  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  // Obtener props para un campo
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field] || '',
      onChangeText: handleChange(field),
      onBlur: handleBlur(field),
      error: touched[field] ? errors[field] : undefined,
    }),
    [values, handleChange, handleBlur, touched, errors]
  );

  // Calcular si el formulario es válido
  const isValid = Object.keys(errors).length === 0;

  // Efecto para manejar el teclado en móvil
  useEffect(() => {
    if (Platform.OS !== 'web') {
      keyboardDidShowListener.current = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          // Lógica cuando se muestra el teclado
        }
      );

      keyboardDidHideListener.current = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          // Lógica cuando se oculta el teclado
        }
      );

      return () => {
        keyboardDidShowListener.current?.remove();
        keyboardDidHideListener.current?.remove();
      };
    }
  }, []);

  // Efecto para manejar envío con Enter (si está habilitado)
  useEffect(() => {
    if (submitOnEnter && Platform.OS !== 'web') {
      // En móvil, esto se manejaría a través de los props del TextInput
      // returnKeyType="done" y onSubmitEditing
    }
  }, [submitOnEnter]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    setValue,
    setError,
    clearError,
    clearErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setSubmitting,
    validateField,
    validateForm,
    getFieldProps,
  };
}

export default useForm;

// Utilidades adicionales para validaciones comunes
export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Ingresa un email válido',
  },
  phone: {
    pattern: /^[+]?[0-9]{9,15}$/,
    message: 'Ingresa un número de teléfono válido',
  },
  password: {
    minLength: 6,
    message: 'La contraseña debe tener al menos 6 caracteres',
  },
  required: {
    required: true,
    message: 'Este campo es requerido',
  },
};

// Hook especializado para formularios de reporte
export function useReportForm() {
  return useForm({
    initialValues: {
      description: '',
      incidentType: '',
    },
    validationRules: {
      description: { required: true, minLength: 10, maxLength: 500 },
      incidentType: { required: true },
    },
    validateOnBlur: true,
  });
}

// Hook especializado para formularios de autenticación
export function useAuthForm() {
  return useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validationRules: {
      email: validationRules.email,
      password: validationRules.password,
    },
    validateOnBlur: true,
  });
}