import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../theme';

interface InfoCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  onPress?: () => void;
  subtitle?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  icon,
  color = colors.secondary,
  onPress,
  subtitle,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.card, onPress && styles.pressable]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color={colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {onPress && (
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 0,
    borderColor: 'transparent',
    ...shadows.sm,
    ...(Platform.OS === 'android' ? { elevation: 0, shadowColor: 'transparent' } : {}),
  },
  pressable: {
    transform: [{ scale: 1 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSizes.sm,
    color: colors.gray300,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  arrow: {
    marginLeft: spacing.sm,
  },
});

export default InfoCard;