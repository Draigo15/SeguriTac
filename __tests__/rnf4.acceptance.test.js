/**
 * RNF-4 Aceptación: Mantenibilidad (estructura y configuraciones mínimas)
 *
 * Verifica criterios objetivos de mantenibilidad:
 * - Estructura modular presente: src/{screens,components,services,navigation}
 * - Configuración de TypeScript presente (tsconfig.json) y TypeScript en devDependencies
 * - Configuración de pruebas: jest.config.js y script "test" en package.json
 * - Existencia de una suite de pruebas significativa (>= 5 archivos en __tests__)
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

describe('RNF-4 Mantenibilidad - Aceptación', () => {
  test('Estructura modular presente', () => {
    const requiredDirs = [
      path.join(root, 'src', 'screens'),
      path.join(root, 'src', 'components'),
      path.join(root, 'src', 'services'),
      path.join(root, 'src', 'navigation'),
    ];
    const missing = requiredDirs.filter((d) => !exists(d));
    expect(missing).toEqual([]);
  });

  test('TypeScript configurado y presente en devDependencies', () => {
    const tsconfigPath = path.join(root, 'tsconfig.json');
    expect(exists(tsconfigPath)).toBe(true);

    const pkg = readJson(path.join(root, 'package.json'));
    expect(pkg.devDependencies && typeof pkg.devDependencies.typescript).toBe('string');
  });

  test('Configuración de pruebas lista y script test definido', () => {
    const jestConfigPath = path.join(root, 'jest.config.js');
    expect(exists(jestConfigPath)).toBe(true);

    const pkg = readJson(path.join(root, 'package.json'));
    expect(pkg.scripts && typeof pkg.scripts.test).toBe('string');
  });

  test('Suite de pruebas con volumen mínimo', () => {
    const testsDir = path.join(root, '__tests__');
    expect(exists(testsDir)).toBe(true);

    const files = fs.readdirSync(testsDir).filter((f) => f.endsWith('.test.js'));
    expect(files.length).toBeGreaterThanOrEqual(5);
  });
});