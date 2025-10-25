/**
 * Componente de input de texto con validación integrada
 * Utiliza las validaciones centralizadas y estilos comunes del tema
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  commonInputs,
  commonTexts,
  spacing,
  borderRadius,
} from '../theme';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateRequired,
} from '../utils/validations';

export type ValidationType = 'email' | 'password' | 'name' | 'phone' | 'required' | 'none';

interface ValidatedTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  validationType?: ValidationType;
  customValidator?: (value: string) => { isValid: boolean; message: string };
  onValidationChange?: (isValid: boolean, message: string) => void;
  showValidationIcon?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  required?: boolean;
  fieldName?: string;
}

/**
 * Componente de input de texto con validación automática
 */
export const ValidatedTextInput: React.FC<ValidatedTextInputProps> = ({
  label,
  validationType = 'none',
  customValidator,
  onValidationChange,
  showValidationIcon = true,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  required = false,
  fieldName,
  value = '',
  onChangeText,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  /**
   * Valida el valor del input según el tipo de validación
   */
  const validateValue = (inputValue: string): { isValid: boolean; message: string } => {
    // Si hay un validador personalizado, usarlo primero
    if (customValidator) {
      return customValidator(inputValue);
    }

    // Validación de campo requerido
    if (required) {
      const requiredResult = validateRequired(inputValue, fieldName || label || 'Campo');
      if (!requiredResult.isValid) {
        return requiredResult;
      }
    }

    // Si el campo está vacío y no es requerido, es válido
    if (!inputValue.trim() && !required) {
      return { isValid: true, message: '' };
    }

    // Validación según el tipo
    switch (validationType) {
      case 'email':
        return {
          isValid: validateEmail(inputValue),
          message: validateEmail(inputValue) ? '' : 'Email inválido'
        };
      
      case 'password':
        return {
          isValid: validatePassword(inputValue),
          message: validatePassword(inputValue) ? '' : 'La contraseña debe tener al menos 6 caracteres'
        };
      
      case 'name':
        return {
          isValid: validateName(inputValue),
          message: validateName(inputValue) ? '' : 'El nombre debe tener al menos 2 caracteres y solo contener letras'
        };
      
      case 'phone':
        return {
          isValid: validatePhone(inputValue),
          message: validatePhone(inputValue) ? '' : 'Número de teléfono inválido'
        };
      
      case 'required':
        return validateRequired(inputValue, fieldName || label || 'Campo');
      
      default:
        return { isValid: true, message: '' };
    }
  };

  /**
   * Maneja el cambio de texto y ejecuta la validación
   */
  const handleTextChange = (text: string) => {
    onChangeText?.(text);
    
    // Solo validar si el campo ha sido tocado
    if (hasBeenTouched) {
      const result = validateValue(text);
      setValidationResult(result);
      onValidationChange?.(result.isValid, result.message);
    }
  };

  /**
   * Maneja cuando el input pierde el foco
   */
  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
    
    const result = validateValue(value);
    setValidationResult(result);
    onValidationChange?.(result.isValid, result.message);
  };

  /**
   * Maneja cuando el input recibe el foco
   */
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Determinar el estilo del input basado en el estado
  const getInputStyle = () => {
    const baseStyle = [commonInputs.textInput, inputStyle];
    
    if (isFocused) {
      baseStyle.push(commonInputs.textInputFocused);
    } else if (hasBeenTouched && !validationResult.isValid) {
      baseStyle.push(commonInputs.textInputError);
    }
    
    return baseStyle;
  };

  // Determinar el icono de validación
  const getValidationIcon = () => {
    if (!showValidationIcon || !hasBeenTouched) {
      return null;
    }
    
    return (
      <View style={styles.iconContainer}>
        <Ionicons
          name={validationResult.isValid ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={validationResult.isValid ? colors.success : colors.error}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          {...textInputProps}
          style={getInputStyle()}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.gray400}
        />
        {getValidationIcon()}
      </View>
      
      {hasBeenTouched && !validationResult.isValid && (
        <Text style={[commonTexts.errorText, errorStyle]}>
          {validationResult.message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1,
  },
});

export default ValidatedTextInput;