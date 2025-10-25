import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
  incidentType: string;
  timestamp: Date;
}

export interface ZoneRisk {
  zone: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  incidentCount: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  topIncidentTypes: { type: string; count: number }[];
}

export interface TrendData {
  zone: string;
  data: {
    date: string;
    count: number;
  }[];
}

class HeatmapService {
  /**
   * Obtiene puntos de calor basados en reportes de incidentes
   */
  async getHeatmapPoints(timeRange?: { start: Date; end: Date }): Promise<HeatmapPoint[]> {
    try {
      const q = timeRange 
        ? query(
            collection(db, 'reports'),
            where('createdAt', '>=', Timestamp.fromDate(timeRange.start)),
            where('createdAt', '<=', Timestamp.fromDate(timeRange.end))
          )
        : collection(db, 'reports');

      const snapshot = await getDocs(q);
      const points: HeatmapPoint[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (data.location && data.location.latitude && data.location.longitude) {
          points.push({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            weight: this.calculateWeight(data),
            incidentType: data.incidentType || 'Otros',
            timestamp: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
          });
        }
      });

      return points;
    } catch (error) {
      console.error('Error obteniendo puntos de heatmap:', error);
      return [];
    }
  }

  /**
   * Calcula el peso de un punto basado en la prioridad y tipo de incidente
   */
  private calculateWeight(reportData: any): number {
    let weight = 1;

    // Aumentar peso por prioridad
    if (reportData.priority === 'urgent' || reportData.urgent === true) {
      weight += 2;
    }

    // Aumentar peso por tipo de incidente
    const highRiskTypes = ['Robo', 'Asalto', 'Violencia', 'Emergencia'];
    if (highRiskTypes.includes(reportData.incidentType)) {
      weight += 1.5;
    }

    // Aumentar peso por estado (reportes sin resolver)
    if (reportData.status === 'Pendiente') {
      weight += 0.5;
    }

    return Math.min(weight, 5); // Máximo peso de 5
  }

  /**
   * Identifica zonas de riesgo basadas en clustering de incidentes
   */
  async getZoneRisks(radius: number = 1000): Promise<ZoneRisk[]> {
    try {
      const points = await this.getHeatmapPoints();
      const zones: ZoneRisk[] = [];
      const processedPoints = new Set<number>();

      points.forEach((point, index) => {
        if (processedPoints.has(index)) return;

        const nearbyPoints = points.filter((otherPoint, otherIndex) => {
          if (index === otherIndex || processedPoints.has(otherIndex)) return false;
          
          const distance = this.calculateDistance(
            point.latitude,
            point.longitude,
            otherPoint.latitude,
            otherPoint.longitude
          );
          
          return distance <= radius;
        });

        if (nearbyPoints.length >= 2) { // Mínimo 3 puntos para formar una zona
          const allPoints = [point, ...nearbyPoints];
          const incidentCounts: { [key: string]: number } = {};
          
          allPoints.forEach(p => {
            incidentCounts[p.incidentType] = (incidentCounts[p.incidentType] || 0) + 1;
            const pointIndex = points.indexOf(p);
            if (pointIndex !== -1) processedPoints.add(pointIndex);
          });

          const centerLat = allPoints.reduce((sum, p) => sum + p.latitude, 0) / allPoints.length;
          const centerLng = allPoints.reduce((sum, p) => sum + p.longitude, 0) / allPoints.length;
          
          const totalWeight = allPoints.reduce((sum, p) => sum + p.weight, 0);
          const riskLevel = this.calculateRiskLevel(allPoints.length, totalWeight);

          const topIncidentTypes = Object.entries(incidentCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type, count]) => ({ type, count }));

          zones.push({
            zone: `Zona ${zones.length + 1}`,
            riskLevel,
            incidentCount: allPoints.length,
            coordinates: {
              latitude: centerLat,
              longitude: centerLng,
            },
            radius,
            topIncidentTypes,
          });
        }
      });

      return zones.sort((a, b) => {
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      });
    } catch (error) {
      console.error('Error identificando zonas de riesgo:', error);
      return [];
    }
  }

  /**
   * Calcula la distancia entre dos puntos en metros
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Calcula el nivel de riesgo basado en cantidad y peso de incidentes
   */
  private calculateRiskLevel(incidentCount: number, totalWeight: number): 'low' | 'medium' | 'high' | 'critical' {
    const avgWeight = totalWeight / incidentCount;
    
    if (incidentCount >= 10 && avgWeight >= 3) return 'critical';
    if (incidentCount >= 7 || avgWeight >= 2.5) return 'high';
    if (incidentCount >= 4 || avgWeight >= 2) return 'medium';
    return 'low';
  }

  /**
   * Obtiene datos de tendencias por zona en un período de tiempo
   */
  async getTrendsByZone(zones: ZoneRisk[], days: number = 30): Promise<TrendData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const q = query(
        collection(db, 'reports'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const trendsData: TrendData[] = zones.map(zone => {
        const zoneTrends: { [date: string]: number } = {};
        
        // Inicializar todos los días con 0
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
          const dateStr = date.toISOString().split('T')[0];
          zoneTrends[dateStr] = 0;
        }

        // Contar reportes por día en esta zona
        reports.forEach(report => {
          if (report.location && report.location.latitude && report.location.longitude) {
            const distance = this.calculateDistance(
              zone.coordinates.latitude,
              zone.coordinates.longitude,
              report.location.latitude,
              report.location.longitude
            );

            if (distance <= zone.radius) {
              const reportDate = report.createdAt?.toDate?.() || new Date(report.createdAt || Date.now());
              const dateStr = reportDate.toISOString().split('T')[0];
              if (zoneTrends[dateStr] !== undefined) {
                zoneTrends[dateStr]++;
              }
            }
          }
        });

        return {
          zone: zone.zone,
          data: Object.entries(zoneTrends)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }))
        };
      });

      return trendsData;
    } catch (error) {
      console.error('Error obteniendo tendencias por zona:', error);
      return [];
    }
  }
}

export const heatmapService = new HeatmapService();