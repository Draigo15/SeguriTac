type MetricAttrs = Record<string, string | number | boolean | null | undefined>;

export type MetricEntry = {
  name: string;
  value: number;
  at: number;
  attrs?: MetricAttrs;
};

const metricsBuffer: MetricEntry[] = [];

export function logMetric(name: string, value: number, attrs?: MetricAttrs) {
  const entry: MetricEntry = { name, value, at: Date.now(), attrs };
  metricsBuffer.push(entry);
  // Imprime en consola para facilitar inspección en desarrollo y pruebas.
  // Mantiene un formato estable para búsqueda/parseo si se requiere.
  // No afecta producción significativamente.
  // eslint-disable-next-line no-console
  console.log(
    `[METRIC] ${name}=${value}ms` + (attrs ? ` ${JSON.stringify(attrs)}` : '')
  );
}

export function getMetrics(): MetricEntry[] {
  return metricsBuffer.slice();
}

export function clearMetrics() {
  metricsBuffer.length = 0;
}