/**
 * ViewAllReportsScreen.tsx
 * 
 * REQUISITO IMPLEMENTADO: RF-12 - Gestión de Reportes Propios
 * Procedimiento 4: Visualización de todos los reportes del sistema con filtros avanzados
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Visualización de todos los reportes del sistema (no solo los propios del usuario)
 * - Filtros avanzados por estado del reporte (Todos, Pendiente, En Proceso, Resuelto)
 * - Búsqueda en tiempo real por texto en múltiples campos
 * - Ordenamiento por fecha de creación (más recientes/antiguos)
 * - Navegación a detalles de reportes individuales
 * - Actualización por pull-to-refresh
 * - Interfaz optimizada con animaciones y estados de carga
 * 
 * PROCEDIMIENTOS RF-12 IMPLEMENTADOS:
 * 1. Carga de todos los reportes del sistema desde Firestore
 * 2. Combinación de datos de reportes con información de usuarios
 * 3. Filtrado dinámico por estado y búsqueda textual
 * 4. Ordenamiento configurable por fecha de creación
 * 5. Navegación a vista detallada de reportes
 * 
 * TECNOLOGÍAS UTILIZADAS:
 * - React Native con TypeScript
 * - Firebase Firestore para consultas de datos
 * - React Navigation para navegación
 * - React Native Reanimated para animaciones
 * - Expo Vector Icons para iconografía
 * - Hooks de React (useState, useEffect, useMemo)
 * 
 * CONEXIONES CON OTROS RF:
 * - RF-11: Navegación a detalles de reportes para posible cancelación
 * - RF-13: Acceso desde perfil de ciudadano para ver todos los reportes
 * - RF-14: Base de datos para estadísticas y análisis de reportes
 * 
 * COMPONENTES RELACIONADOS:
 * - ReportDetailScreen: Para visualización detallada de reportes
 * - AnimatedScreen: Para transiciones suaves
 * - MyReportsScreen: Para reportes específicos del usuario
 */

import React, { useEffect, useState, useMemo } from 'react'; // RF-12: Hooks para gestión de estado y efectos
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput, // RF-12: Para búsqueda en tiempo real
  RefreshControl, // RF-12: Para actualización por pull-to-refresh
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore'; // RF-12: Para consultas de todos los reportes
import { db } from '../services/firebase'; // RF-12: Conexión a base de datos
import { useNavigation } from '@react-navigation/native'; // RF-12: Para navegación a detalles
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { 
  colors, 
  fontSizes, 
  spacing,
  commonContainers,
  commonTexts,
  shadows
} from '../theme';
import { Ionicons } from '@expo/vector-icons'; // RF-12: Iconos para estados y tipos de incidentes
import AnimatedScreen from '../components/AnimatedScreen'; // RF-12: Pantalla con animaciones
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'; // RF-12: Animaciones de entrada

/**
 * ViewAllReportsScreen - Componente principal para visualización de todos los reportes
 * 
 * REQUISITO: RF-12 - Gestión de Reportes Propios (Procedimiento 4)
 * Pantalla que permite visualizar todos los reportes del sistema con capacidades avanzadas
 * de filtrado, búsqueda y ordenamiento para administradores y usuarios autorizados.
 * 
 * ESTADOS MANEJADOS:
 * - reports: Lista filtrada de reportes mostrados en la interfaz
 * - allReports: Lista completa de reportes cargados desde Firestore
 * - loading: Estado de carga inicial de datos
 * - refreshing: Estado de actualización por pull-to-refresh
 * - searchText: Texto de búsqueda para filtrar reportes
 * - selectedFilter: Filtro activo por estado de reporte
 * - sortOrder: Orden de clasificación por fecha (newest/oldest)
 * 
 * FUNCIONALIDADES:
 * - Carga de todos los reportes del sistema con información de usuarios
 * - Filtrado dinámico por estado y búsqueda textual en tiempo real
 * - Ordenamiento configurable por fecha de creación
 * - Navegación a vista detallada de reportes individuales
 * - Actualización de datos mediante pull-to-refresh
 * - Interfaz responsiva con animaciones y estados de carga
 * 
 * CONEXIONES:
 * - RF-11: Permite acceso a detalles para cancelación de reportes
 * - RF-13: Accesible desde perfil de ciudadano
 * - RF-14: Fuente de datos para estadísticas del sistema
 */
const ViewAllReportsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ViewAllReports'>>(); // RF-12: Navegación a detalles de reportes
  const [reports, setReports] = useState<any[]>([]); // RF-12: Lista filtrada de reportes para mostrar
  const [allReports, setAllReports] = useState<any[]>([]); // RF-12: Lista completa de reportes del sistema
  const [loading, setLoading] = useState(true); // RF-12: Estado de carga inicial
  const [refreshing, setRefreshing] = useState(false); // RF-12: Estado de actualización por pull-to-refresh
  const [searchText, setSearchText] = useState(''); // RF-12: Texto de búsqueda para filtrar reportes
  const [selectedFilter, setSelectedFilter] = useState('Todos'); // RF-12: Filtro activo por estado de reporte
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest'); // RF-12: Orden de clasificación por fecha

  // RF-12: Opciones de filtro por estado de reporte - Permite filtrar por estado específico
  const filterOptions = ['Todos', 'Pendiente', 'En Proceso', 'Resuelto'];
  // RF-12: Opciones de ordenamiento por fecha - Configuración de orden temporal
  const sortOptions = [
    { key: 'newest', label: 'Más recientes' }, // RF-12: Orden descendente por fecha
    { key: 'oldest', label: 'Más antiguos' } // RF-12: Orden ascendente por fecha
  ];

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
            incidentType: data.incidentType || 'Sin especificar',
            description: data.description || '',
            email: data.email || '',
            status: data.status || 'Pendiente',
            dateFormatted: data.dateFormatted || new Date().toLocaleDateString(),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          });
        });

        // Ordenar por createdAt (timestamp) si existe, sino por dateFormatted
        const sortedReports = loadedReports.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.dateFormatted || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.dateFormatted || 0);
          return dateB.getTime() - dateA.getTime(); // Más recientes primero por defecto
        });

        setAllReports(sortedReports);
        setReports(sortedReports);
      } catch (error: any) {
        console.error('Error al traer datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsAndUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Recargar datos
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
            incidentType: data.incidentType || 'Sin especificar',
            description: data.description || '',
            email: data.email || '',
            status: data.status || 'Pendiente',
            dateFormatted: data.dateFormatted || new Date().toLocaleDateString(),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          });
        });

        // Ordenar por createdAt (timestamp) si existe, sino por dateFormatted
        const sortedReports = loadedReports.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.dateFormatted || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.dateFormatted || 0);
          return dateB.getTime() - dateA.getTime(); // Más recientes primero por defecto
        });

        setAllReports(sortedReports);
        setReports(sortedReports);
      } catch (error: any) {
        console.error('Error al traer datos:', error);
      } finally {
        setRefreshing(false);
      }
    };
    fetchReportsAndUsers();
  };

  const getStatusIcon = (status: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (status) {
      case 'Pendiente':
        return { name: 'time-outline', color: colors.warning };
      case 'En Proceso':
        return { name: 'sync-outline', color: colors.blue500 };
      case 'Resuelto':
        return { name: 'checkmark-circle-outline', color: colors.green500 };
      default:
        return { name: 'help-circle-outline', color: colors.gray500 };
    }
  };

  const getIncidentIcon = (incidentType: string): keyof typeof Ionicons.glyphMap => {
    if (!incidentType) return 'document-text-outline';
    const type = incidentType.toLowerCase();
    if (type.includes('robo')) return 'shield-outline';
    if (type.includes('accidente')) return 'car-outline';
    if (type.includes('vandalismo')) return 'hammer-outline';
    if (type.includes('ruido')) return 'volume-high-outline';
    if (type.includes('droga')) return 'warning-outline';
    if (type.includes('violencia')) return 'alert-circle-outline';
    return 'document-text-outline';
  };

  // RF-12: Lógica de filtrado y ordenamiento combinado para todos los reportes
  // Implementa filtros por estado, búsqueda por texto y ordenamiento por fecha
  const filteredReports = useMemo(() => {
    let filtered = allReports;
    
    // RF-12: Filtrar por estado del reporte
    if (selectedFilter !== 'Todos') {
      filtered = filtered.filter(report => report.status === selectedFilter);
    }
    
    // RF-12: Filtrar por texto de búsqueda en múltiples campos
    if (searchText.trim()) {
      filtered = filtered.filter(report => 
        (report.incidentType && report.incidentType.toLowerCase().includes(searchText.toLowerCase())) ||
        (report.description && report.description.toLowerCase().includes(searchText.toLowerCase())) ||
        (report.email && report.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (report.firstName && report.firstName.toLowerCase().includes(searchText.toLowerCase())) ||
        (report.lastName && report.lastName.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // RF-12: Aplicar ordenamiento por fecha de creación
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.dateFormatted || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.dateFormatted || 0);
      
      if (sortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime(); // RF-12: Más recientes primero
      } else {
        return dateA.getTime() - dateB.getTime(); // RF-12: Más antiguos primero
      }
    });
    
    return sorted;
  }, [allReports, selectedFilter, searchText, sortOrder]);

  const handlePressReport = (report: any) => {
    if (!report || typeof report !== 'object') return;
    navigation.navigate('ReportDetail', { report });
  };

  return (
    <AnimatedScreen animationType="slideHorizontal" duration={800}>
      <View style={styles.darkContainer}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Animated.Text style={[commonTexts.title, { color: colors.white }]}>
            📋 Todos los Reportes
          </Animated.Text>
          <Animated.Text style={styles.subtitle}>
            {allReports.length} reporte{allReports.length !== 1 ? 's' : ''} en total
          </Animated.Text>
        </Animated.View>

        {/* RF-12: Barra de búsqueda para filtrar reportes por texto */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.gray500} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar reportes..."
            placeholderTextColor={colors.gray500}
            value={searchText}
            onChangeText={setSearchText} // RF-12: Actualiza filtro de búsqueda en tiempo real
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.gray500} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* RF-12: Filtros de Estado - Permite filtrar reportes por estado */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Animated.Text style={styles.filterSectionTitle}>Filtrar por Estado</Animated.Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive // RF-12: Estilo activo para filtro seleccionado
                ]}
                onPress={() => setSelectedFilter(filter)} // RF-12: Cambia filtro por estado
              >
                <Animated.Text style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive
                ]}>
                  {filter}
                </Animated.Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* RF-12: Filtros de Ordenamiento - Permite ordenar reportes por fecha */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Animated.Text style={styles.filterSectionTitle}>Ordenar por Fecha</Animated.Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterButton,
                  sortOrder === option.key && styles.filterButtonActive // RF-12: Estilo activo para ordenamiento seleccionado
                ]}
                onPress={() => setSortOrder(option.key as 'newest' | 'oldest')} // RF-12: Cambia ordenamiento por fecha
              >
                <Ionicons 
                  name={option.key === 'newest' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                  size={16} 
                  color={sortOrder === option.key ? colors.primary : colors.white} 
                  style={{ marginRight: 4 }} // RF-12: Icono indicador de dirección de ordenamiento
                />
                <Animated.Text style={[
                  styles.filterText,
                  sortOrder === option.key && styles.filterTextActive
                ]}>
                  {option.label}
                </Animated.Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* RF-12: Contador de reportes filtrados */}
        <Animated.Text 
          entering={FadeInDown.delay(600).duration(600)}
          style={styles.counterText}
        >
          Mostrando {filteredReports.length} de {allReports.length} reportes
        </Animated.Text>

        {loading ? (
          <Animated.View entering={FadeInUp.duration(800)} style={{alignItems: 'center'}}>
            <ActivityIndicator size="large" color={colors.white} style={{ marginTop: 50 }} />
          </Animated.View>
        ) : filteredReports.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(800)} style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color={colors.white} style={{ opacity: 0.6 }} />
            <Animated.Text style={styles.emptyTitle}>
              {allReports.length === 0 ? 'No hay reportes disponibles' : 'No se encontraron reportes'}
            </Animated.Text>
            <Animated.Text style={styles.emptySubtitle}>
              {allReports.length === 0 
                ? 'Los reportes aparecerán aquí cuando se creen'
                : 'Intenta cambiar los filtros de búsqueda'
              }
            </Animated.Text>
          </Animated.View>
        ) : (
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.white]}
                tintColor={colors.white}
              />
            }
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInUp.delay(index * 100).duration(500)}
              >
                <TouchableOpacity
                  style={[
                    styles.reportItem,
                    { borderLeftColor: getStatusIcon(item.status ?? 'Pendiente').color }
                  ]}
                  onPress={() => handlePressReport(item)}
                >
                  <View style={styles.reportHeader}>
                    <View style={styles.reportTitleContainer}>
                      <Ionicons 
                        name={getIncidentIcon(item.incidentType)} 
                        size={20} 
                        color={colors.white} 
                        style={styles.incidentIcon}
                      />
                      <Animated.Text style={styles.reportTitle}>{item.incidentType}</Animated.Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <Ionicons 
                        name={getStatusIcon(item.status ?? 'Pendiente').name} 
                        size={16} 
                        color={getStatusIcon(item.status ?? 'Pendiente').color}
                      />
                      <Animated.Text style={[
                        styles.reportStatus,
                        { color: getStatusIcon(item.status ?? 'Pendiente').color }
                      ]}>
                        {item.status ?? 'Pendiente'}
                      </Animated.Text>
                    </View>
                  </View>
                  
                  <View style={styles.reportInfo}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Animated.Text style={styles.reportDate}>{item.dateFormatted}</Animated.Text>
                    </View>
                    <View style={styles.userContainer}>
                      <Ionicons name="person-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                      <Animated.Text style={styles.reportUser}>
                        {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.email}
                      </Animated.Text>
                    </View>
                  </View>
                  
                  <View style={styles.reportFooter}>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.6)" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        )}
      </View>
    </AnimatedScreen>
  );
};

export default ViewAllReportsScreen;


const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    color: colors.gray800,
  },
  clearButton: {
    padding: spacing.xs,
  },
  filterSectionTitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    opacity: 0.9,
  },
  filtersContainer: {
    marginBottom: spacing.lg,
  },
  filtersContent: {
    paddingHorizontal: spacing.xs,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  filterText: {
    fontSize: fontSizes.sm,
    color: colors.white,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  counterText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    textAlign: 'right',
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.white,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.7,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  reportItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    marginHorizontal: 2,
    borderLeftWidth: 6,
    borderLeftColor: colors.secondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...shadows.sm,
    ...(Platform.OS === 'android' ? { elevation: 0, shadowColor: 'transparent' } : {}),
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  reportTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  incidentIcon: {
    marginRight: spacing.sm,
  },
  reportTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 80,
    justifyContent: 'center',
  },
  reportStatus: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  reportInfo: {
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    marginLeft: 4,
  },
  reportUser: {
    fontSize: fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    marginLeft: 4,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
});
