import React from 'react';
import { View, Text, Pressable } from 'react-native';

type FeedbackProps = {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
  onDismiss: () => void;
};

const FeedbackComponent: React.FC<FeedbackProps> = ({ visible, type, message, onDismiss }) => {
  if (!visible) return null;

  return (
    <View testID="feedback-container" style={{ padding: 12 }}>
      <Text>{message}</Text>
      {type === 'success' && <View testID="success-icon" />}
      {type === 'error' && <View testID="error-icon" />}
      {type === 'info' && <View testID="info-icon" />}
      <Pressable testID="close-button" onPress={onDismiss}>
        <Text>Cerrar</Text>
      </Pressable>
    </View>
  );
};

export default FeedbackComponent;