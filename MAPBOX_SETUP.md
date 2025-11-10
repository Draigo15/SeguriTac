# Configuración de Mapbox (Alternativa Premium)

## Instalación

```bash
npm install @rnmapbox/maps
```

## Configuración

### 1. Obtener API Key
- Registrarse en [mapbox.com](https://mapbox.com)
- Crear un token de acceso
- Gratis hasta 50,000 requests/mes

### 2. Configurar en .env
```env
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZXhhbXBsZSJ9...
```

### 3. Configurar en app.config.js
```javascript
export default {
  expo: {
    plugins: [
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsImpl: 'mapbox',
          RNMapboxMapsDownloadToken: process.env.MAPBOX_ACCESS_TOKEN,
        },
      ],
    ],
  },
};
```

### 4. Componente de ejemplo
```typescript
import Mapbox from '@rnmapbox/maps';

// Configurar token
Mapbox.setAccessToken(process.env.MAPBOX_ACCESS_TOKEN);

const MapboxMap = ({ latitude, longitude }) => {
  return (
    <Mapbox.MapView style={{ flex: 1 }}>
      <Mapbox.Camera
        centerCoordinate={[longitude, latitude]}
        zoomLevel={14}
      />
      <Mapbox.PointAnnotation
        id="marker"
        coordinate={[longitude, latitude]}
      />
    </Mapbox.MapView>
  );
};
```

## Ventajas de Mapbox
- ✅ Mapas offline
- ✅ Navegación turn-by-turn
- ✅ Estilos personalizables
- ✅ Excelente rendimiento
- ✅ Soporte 3D

## Desventajas
- ❌ Requiere API key
- ❌ Costo después de 50k requests
- ❌ Más complejo de configurar