import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, spacing, fontSizes, borderRadius } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerFallbackProps {
  value: Date;
  mode: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'compact';
  onChange: (event: any, selectedDate?: Date) => void;
}

const DatePickerFallback: React.FC<DatePickerFallbackProps> = ({
  value,
  mode,
  onChange
}) => {
  let DateTimePicker: any = null;
  
  try {
    // Try to import DateTimePicker
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (error) {
    // DateTimePicker not available
  }

  if (DateTimePicker) {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        onChange={onChange}
      />
    );
  }

  // Fallback component for Expo Go
  const formatDate = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString();
    } else if (mode === 'time') {
      return date.toLocaleTimeString();
    } else {
      return date.toLocaleString();
    }
  };

  const handlePress = () => {
    // For web or when DateTimePicker is not available,
    // we could implement a simple date input or show an alert
    if (Platform.OS === 'web') {
      // On web, we could use HTML5 date input
      const input = document.createElement('input');
      input.type = mode === 'time' ? 'time' : 'date';
      input.value = mode === 'time' 
        ? value.toTimeString().slice(0, 5)
        : value.toISOString().slice(0, 10);
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const newDate = new Date(target.value);
        onChange({}, newDate);
      };
      
      input.click();
    } else {
      // For mobile without DateTimePicker, show a simple alert
      alert('DatePicker requires a development build. Please use Expo Dev Client or build the app.');
    }
  };

  return (
    <TouchableOpacity style={styles.fallbackContainer} onPress={handlePress}>
      <View style={styles.fallbackContent}>
        <Ionicons 
          name={mode === 'time' ? 'time-outline' : 'calendar-outline'} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={styles.fallbackText}>
          {formatDate(value)}
        </Text>
        <Text style={styles.fallbackHint}>
          Tap to change
        </Text>
      </View>
      <View style={styles.fallbackWarning}>
        <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
        <Text style={styles.warningText}>
          DatePicker requires development build
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginVertical: spacing.sm,
  },
  fallbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fallbackText: {
    fontSize: fontSizes.base,
    color: colors.gray800,
    marginLeft: spacing.sm,
    flex: 1,
  },
  fallbackHint: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
  },
  fallbackWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  warningText: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    marginLeft: spacing.xs,
    flex: 1,
  },
});

export default DatePickerFallback;