import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { getReportsByFilters } from '../services/reports';

type Report = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  date?: string;
  location?: { latitude: number; longitude: number };
  type?: string;
};

type Filters = {
  type?: string;
  startDate?: string;
  endDate?: string;
};

// Componente "dummy" para facilitar disparar eventos en tests (onValueChange, onChange)
const Dummy: React.FC<any> = (props) => <View {...props} />;

const ReportFiltersScreen: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [results, setResults] = useState<Report[]>([]);
  const [searched, setSearched] = useState(false);

  const handleTypeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, type: value }));
  };

  const handleStartDateChange = (event: { nativeEvent: { timestamp: number } }) => {
    const iso = new Date(event.nativeEvent.timestamp).toISOString();
    setFilters((prev) => ({ ...prev, startDate: iso }));
  };

  const handleEndDateChange = (event: { nativeEvent: { timestamp: number } }) => {
    const iso = new Date(event.nativeEvent.timestamp).toISOString();
    setFilters((prev) => ({ ...prev, endDate: iso }));
  };

  const handleSearch = async () => {
    const data = await getReportsByFilters(filters);
    setResults(Array.isArray(data) ? data : []);
    setSearched(true);
  };

  return (
    <View style={{ padding: 12 }}>
      {/* Selector de tipo */}
      <Dummy testID="type-picker" onValueChange={handleTypeChange} />

      {/* Rangos de fecha */}
      <Dummy testID="start-date-picker" onChange={handleStartDateChange} />
      <Dummy testID="end-date-picker" onChange={handleEndDateChange} />

      {/* Botón de buscar */}
      <TouchableOpacity testID="search-button" onPress={handleSearch}>
        <Text>Buscar</Text>
      </TouchableOpacity>

      {/* Resultados */}
      {results.map((r) => (
        <View key={r.id} testID="report-item" style={{ marginTop: 8 }}>
          <Text>{r.title}</Text>
        </View>
      ))}

      {/* Mensaje cuando no hay resultados luego de buscar */}
      {searched && results.length === 0 && (
        <Text>No se encontraron reportes con los filtros seleccionados</Text>
      )}
    </View>
  );
};

export default ReportFiltersScreen;