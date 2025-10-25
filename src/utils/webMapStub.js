// Stub completo para react-native-maps en web
import React from 'react';
import { View, Text } from 'react-native';

// Mock de codegenNativeCommands para evitar errores
const codegenNativeCommands = () => ({});

// Componente MapView stub
const MapView = ({ children, ...props }) => {
  return (
    <View style={[{ flex: 1, backgroundColor: '#f0f0f0' }, props.style]}>
      <Text style={{ textAlign: 'center', marginTop: 20 }}>Mapa no disponible en web</Text>
      {children}
    </View>
  );
};

// Componente Marker stub
const Marker = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Componente Heatmap stub
const Heatmap = ({ ...props }) => {
  return <View />;
};

// Componente Polyline stub
const Polyline = ({ ...props }) => {
  return <View />;
};

// Componente Polygon stub
const Polygon = ({ ...props }) => {
  return <View />;
};

// Componente Circle stub
const Circle = ({ ...props }) => {
  return <View />;
};

const Overlay = () => null;

// Componente Callout stub
const Callout = ({ children, ...props }) => {
  return <View>{children}</View>;
};

const CalloutSubview = () => null;

// Componentes nativos stub con comandos mock
const MapMarkerNativeComponent = React.forwardRef((props, ref) => {
  return <View ref={ref} />;
});

// Agregar comandos mock al componente
MapMarkerNativeComponent.Commands = {
  showCallout: () => {},
  hideCallout: () => {},
  redrawCallout: () => {},
};

const MapPolylineNativeComponent = React.forwardRef((props, ref) => {
  return <View ref={ref} />;
});

const MapPolygonNativeComponent = React.forwardRef((props, ref) => {
  return <View ref={ref} />;
});

const MapCircleNativeComponent = React.forwardRef((props, ref) => {
  return <View ref={ref} />;
});

const MapHeatmapNativeComponent = React.forwardRef((props, ref) => {
  return <View ref={ref} />;
});

const MapCalloutNativeComponent = React.forwardRef((props, ref) => {
  return <View ref={ref} />;
});

const MapCalloutSubviewNativeComponent = () => null;
const MapOverlayNativeComponent = () => null;
const MapUrlTileNativeComponent = () => null;
const MapWMSTileNativeComponent = () => null;
const MapLocalTileNativeComponent = () => null;
const MapGeojsonNativeComponent = () => null;

// Constantes
const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = 'default';

// Exportación por defecto
export default MapView;

// Exportaciones nombradas
export {
  MapView,
  Marker,
  Heatmap,
  Polyline,
  Polygon,
  Circle,
  Overlay,
  Callout,
  CalloutSubview,
  MapMarkerNativeComponent,
  MapPolylineNativeComponent,
  MapPolygonNativeComponent,
  MapCircleNativeComponent,
  MapHeatmapNativeComponent,
  MapCalloutNativeComponent,
  MapCalloutSubviewNativeComponent,
  MapOverlayNativeComponent,
  MapUrlTileNativeComponent,
  MapWMSTileNativeComponent,
  MapLocalTileNativeComponent,
  MapGeojsonNativeComponent,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  codegenNativeCommands,
};