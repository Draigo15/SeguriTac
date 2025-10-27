/**
 * RNF-6 Aceptación: Portabilidad (Android 8+ / API 26)
 * Verifica que la configuración de Android establezca minSdkVersion >= 26.
 */

const fs = require('fs');
const path = require('path');

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function parseMinSdkFromGradleProperties(text) {
  // Busca una línea como: android.minSdkVersion=26
  const match = text.match(/android\.minSdkVersion\s*=\s*(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

function parseDefaultMinSdkFromBuildGradle(text) {
  // Busca fallback como: '?: \"26\"' en la asignación Integer.parseInt(...)
  const match = text.match(/Integer\.parseInt\(findProperty\('android\.minSdkVersion'\)\s*\?:\s*'([0-9]+)'\)/);
  if (match) return parseInt(match[1], 10);
  // Alternativamente, una línea directa: minSdkVersion 26
  const direct = text.match(/minSdkVersion\s+(\d+)/);
  if (direct) return parseInt(direct[1], 10);
  return null;
}

describe('RNF-6 Portabilidad - Aceptación', () => {
  test('minSdkVersion >= 26 en configuración de Android', () => {
    const root = path.resolve(__dirname, '..');
    const gradlePropsPath = path.join(root, 'android', 'gradle.properties');
    const buildGradlePath = path.join(root, 'android', 'build.gradle');

    const gradlePropsText = readFileSafe(gradlePropsPath);
    const buildGradleText = readFileSafe(buildGradlePath);

    const propValue = parseMinSdkFromGradleProperties(gradlePropsText);
    const defaultValue = parseDefaultMinSdkFromBuildGradle(buildGradleText);

    // Efectivo: si la propiedad existe, debe ser >= 26; si no, el default debe ser >= 26
    const effective = propValue ?? defaultValue;
    expect(typeof effective).toBe('number');
    expect(effective).toBeGreaterThanOrEqual(26);
  });
});