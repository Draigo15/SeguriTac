import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import Ionicons from 'react-native-vector-icons/Ionicons';


const ViewAllReportsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ViewAllReports'>>();
  const [reports, setReports] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchReportsAndUsers = async () => {
      try {
        const [reportsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, 'reports')),
          getDocs(collection(db, 'users')),
        ]);

        const users: Record<string, { firstName: string; lastName: string }> = {};
        usersSnap.forEach((doc) => {
          const data = doc.data();
          users[data.email] = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
          };
        });

        const loadedReports: any[] = [];
        reportsSnap.forEach((doc) => {
          const data = doc.data();
          const user = users[data.email] || {};
          loadedReports.push({
            id: doc.id,
            ...data,
            firstName: user.firstName,
            lastName: user.lastName,
          });
        });

        const sortedReports = loadedReports.sort((a, b) =>
          new Date(b.dateFormatted).getTime() - new Date(a.dateFormatted).getTime()
        );

        setAllReports(sortedReports);
        setReports(sortedReports);
      } catch (error) {
        console.error('Error al traer datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsAndUsers();
  }, []);

  useEffect(() => {
    const normalize = (text: string) => (text || '').trim().toLowerCase();

    const filtered = allReports.filter((report) => {
      const matchStatus = statusFilter
        ? normalize(report.status) === normalize(statusFilter)
        : true;

      const matchSearch = [
        report.incidentType,
        report.description,
        report.email,
        report.firstName,
        report.lastName,
      ].join(' ').toLowerCase().includes(searchText.toLowerCase());

      return matchStatus && matchSearch;
    });

    setReports(filtered);
  }, [searchText, statusFilter, allReports]);

  const handlePressReport = (report: any) => {
    if (!report || typeof report !== 'object') return;
    navigation.navigate('ReportDetail', { report });
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase().trim()) {
      case 'pendiente': return '#e53935';
      case 'en proceso': return '#fbc02d';
      case 'resuelto': return '#43a047';
      default: return '#9e9e9e';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Todos los Reportes</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por tipo, descripción o nombre..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
          dropdownIconColor="#000"
        >
          <Picker.Item label="Todos los estados" value="" />
          <Picker.Item label="Pendiente" value="pendiente" />
          <Picker.Item label="En proceso" value="en proceso" />
          <Picker.Item label="Resuelto" value="resuelto" />
        </Picker>
      </View>

      <Text style={styles.counterText}>
        Mostrando {reports.length} reporte{reports.length === 1 ? '' : 's'}
      </Text>

      {reports.length === 0 ? (
        <Text style={styles.noReports}>No hay reportes que coincidan con los filtros.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Animatable.View animation="fadeInUp" duration={400} delay={100}>
              <TouchableOpacity
                style={styles.reportItem}
                onPress={() => handlePressReport(item)}
              >
                <View style={styles.reportContent}>
                  <View>
                    <Text style={styles.reportTitle}>{item.incidentType}</Text>
                    <Text style={styles.reportDate}>{item.dateFormatted}</Text>
                    <Text style={styles.reportUser}>
                      {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.email}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{(item.status || 'Pendiente').toUpperCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animatable.View>
          )}
        />
      )}
    </View>
  );
};

export default ViewAllReportsScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B7F',
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#002B7F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    color: '#000',
    padding: spacing.md,
    borderRadius: 10,
    fontSize: fontSizes.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  counterText: {
    color: '#fff',
    fontSize: fontSizes.base,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  noReports: {
    color: '#ddd',
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: fontSizes.base,
  },
  reportItem: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  reportContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: fontSizes.sm,
    color: '#555',
  },
  reportUser: {
    fontSize: fontSizes.xs,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: 10,
  paddingHorizontal: 12,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: '#ccc',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
},
searchIcon: {
  marginRight: 8,
},
searchInput: {
  flex: 1,
  fontSize: fontSizes.base,
  color: '#000',
  paddingVertical: 8,
},
});
