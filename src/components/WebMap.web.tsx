import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// FIX: Iconos por defecto (necesario para que Marker se muestre bien en algunos entornos)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
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

  // Validar coordenadas antes de renderizar
  const isValidCoordinates = 
    !isNaN(latitude) && !isNaN(longitude) && 
    latitude >= -90 && latitude <= 90 && 
    longitude >= -180 && longitude <= 180;
  
  if (!isValidCoordinates) {
    console.error('❌ WebMap - Coordenadas inválidas:', { latitude, longitude });
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '10px' }}>
        <p style={{ color: '#666' }}>📍 Coordenadas inválidas: lat={latitude}, lng={longitude}</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', borderRadius: '10px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // 👇 CORRECCIÓN: `attribution` debe ir como prop aquí
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
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
