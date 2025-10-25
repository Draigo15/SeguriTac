import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const ReportDetailScreen = ({ route, navigation }) => {
  const { reportId } = route?.params || { reportId: '1' };
  
  const handleStatusChange = (newStatus) => {
    // Lógica para cambiar el estado
    console.log(`Cambiando estado a: ${newStatus}`);
  };

  return (
    <View style={styles.container} testID="report-detail-screen">
      <Text style={styles.title} testID="report-title">Robo en calle principal</Text>
      <Text style={styles.status} testID="report-status">pendiente</Text>
      <Button
        testID="change-status-button"
        title="Cambiar Estado"
        onPress={() => handleStatusChange('en_proceso')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
  },
});

export default ReportDetailScreen;