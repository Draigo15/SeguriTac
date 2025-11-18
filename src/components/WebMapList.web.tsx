import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configuración segura para íconos por defecto (si fueran necesarios)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Íconos personalizados por estado
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getIconByStatus = (status: string) => {
  switch (status) {
    case 'Resuelto':
      return greenIcon;
    case 'En proceso':
      return orangeIcon;
    default:
      return redIcon;
  }
};

type Report = {
  id: string;
  location: { latitude: number; longitude: number };
  incidentType: string;
  status: string;
};

type Props = {
  reports: Report[];
};

const WebMapList: React.FC<Props> = ({ reports }) => {
  const center = reports.length
    ? [reports[0].location.latitude, reports[0].location.longitude]
    : [-16.5, -68.15];

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center as [number, number]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reports.length === 0 ? (
          <Popup position={center as [number, number]}>
            <div style={{ textAlign: 'center' }}>
              <strong>No hay reportes para mostrar</strong>
            </div>
          </Popup>
        ) : (
          reports.map((report) => {
            const { location, incidentType, status, id } = report;

            const isValidCoord =
              typeof location.latitude === 'number' &&
              typeof location.longitude === 'number';

            if (!isValidCoord) return null;

            return (
              <Marker
                key={id}
                position={[location.latitude, location.longitude]}
                icon={getIconByStatus(status)}
              >
                <Popup>
                  <strong>{incidentType}</strong>
                  <br />
                  Estado: {status}
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
};

export default WebMapList;
