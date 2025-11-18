import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { mapsConfig } from '../config/mapsConfig';

// FIX: Iconos por defecto (necesario para que Marker se muestre bien en algunos entornos)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: mapsConfig.leafletIcons.defaultRetina,
  iconUrl: mapsConfig.leafletIcons.default,
  shadowUrl: mapsConfig.leafletIcons.shadow,
});

type WebMapProps = {
  latitude: number;
  longitude: number;
  userLatitude?: number;
  userLongitude?: number;
};

const WebMap: React.FC<WebMapProps> = ({ latitude, longitude, userLatitude, userLongitude }) => {
  const position: [number, number] = [latitude, longitude];
  const userPosition: [number, number] | null = 
    userLatitude !== undefined && userLongitude !== undefined 
      ? [userLatitude, userLongitude] 
      : null;

  // Crear icono azul para la ubicación del usuario
  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer
        center={position}
        zoom={mapsConfig.defaultZoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={mapsConfig.tileLayerUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
          // 👇 CORRECCIÓN: `attribution` debe ir como prop aquí
          attribution={mapsConfig.tileLayerAttribution || '&copy; OpenStreetMap contributors'}
        />
        <Marker position={position}>
          <Popup>Ubicación del reporte</Popup>
        </Marker>
        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>Tu ubicación</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default WebMap;
