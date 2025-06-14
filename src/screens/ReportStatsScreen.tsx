import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { fontSizes, spacing } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

const ReportStatsScreen = () => {
  const [statusCounts, setStatusCounts] = useState({
    Pendiente: 0,
    'En proceso': 0,
    Resuelto: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const unsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const counts = { Pendiente: 0, 'En proceso': 0, Resuelto: 0 };
      snapshot.forEach((doc) => {
        const rawStatus = doc.data().status;
        const status = (rawStatus ?? 'Pendiente') as keyof typeof counts;
        if (status in counts) counts[status]++;
      });

      setStatusCounts(counts);
      setLoading(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    return loadData();
  }, []);

  const pieData = [
    {
      name: 'Pendiente',
      population: statusCounts['Pendiente'],
      color: '#EF5350',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'En proceso',
      population: statusCounts['En proceso'],
      color: '#FFB300',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Resuelto',
      population: statusCounts['Resuelto'],
      color: '#66BB6A',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.headerCard}>
        <Icon name="bar-chart-outline" size={28} color="#fff" />
        <Text style={styles.title}>Estadísticas de Reportes</Text>
        <Text style={styles.subtitle}>📈 Visualización de estado en tiempo real</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#002B7F" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <>
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>📊 Distribución por Estado</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="16"
              absolute
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>📋 Totales por Estado</Text>
          <BarChart
              data={{
                labels: ['Pendiente', 'En proceso', 'Resuelto'],
                datasets: [
                  {
                    data: [
                      statusCounts['Pendiente'],
                      statusCounts['En proceso'],
                      statusCounts['Resuelto'],
                    ],
                  },
                ],
              }}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              yAxisLabel="" // ✅ obligatorio aunque sea vacío
              yAxisSuffix="" // ✅ obligatorio aunque sea vacío
              verticalLabelRotation={15}
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default ReportStatsScreen;

const chartConfig = {
  backgroundGradientFrom: '#f4f6fa',
  backgroundGradientTo: '#f4f6fa',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 43, 127, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#002B7F',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    padding: spacing.md,
  },
  headerCard: {
    backgroundColor: '#002B7F',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: '#cfd8dc',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loadingText: {
    color: '#555',
    marginTop: spacing.sm,
    fontSize: fontSizes.base,
  },
});
