import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { mapsConfig, getLeafletIconByStatus } from '../config/mapsConfig';

// Configuración segura para íconos por defecto
L.Icon.Default.mergeOptions({
  iconRetinaUrl: mapsConfig.leafletIcons.defaultRetina,
  iconUrl: mapsConfig.leafletIcons.default,
  shadowUrl: mapsConfig.leafletIcons.shadow,
});

// Función para crear íconos personalizados por estado
const createIcon = (iconUrl: string) => new L.Icon({
  iconUrl,
  shadowUrl: mapsConfig.leafletIcons.shadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getIconByStatus = (status: string) => {
  const iconUrl = getLeafletIconByStatus(status) || mapsConfig.leafletIcons.default;
  return createIcon(iconUrl);
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
    : [mapsConfig.defaultRegion.latitude, mapsConfig.defaultRegion.longitude];

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center as [number, number]}
        zoom={mapsConfig.defaultZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution={mapsConfig.tileLayerAttribution || '&copy; OpenStreetMap contributors'}
          url={mapsConfig.tileLayerUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
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
