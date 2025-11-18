const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const currentPath = path.join(root, 'jest-results.json');
const previousPath = path.join(root, 'jest-results.prev.json');

function readJsonSafe(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`No se pudo leer JSON: ${filePath}`, e.message);
  }
  return null;
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj), 'utf-8');
}

function mapAssertions(results) {
  const map = new Map();
  if (!results || !Array.isArray(results.testResults)) return map;
  for (const suite of results.testResults) {
    const suiteName = suite.name || 'suite';
    for (const a of suite.assertionResults || []) {
      const key = `${a.fullName}`;
      map.set(key, { status: a.status, title: a.title, suite: suiteName });
    }
  }
  return map;
}

function compare(prev, curr) {
  const diffs = { regressions: [], improvements: [], summary: {} };
  if (!prev) return diffs;
  const prevMap = mapAssertions(prev);
  const currMap = mapAssertions(curr);
  for (const [key, prevItem] of prevMap.entries()) {
    const currItem = currMap.get(key);
    if (!currItem) continue; // test missing; ignore
    if (prevItem.status !== currItem.status) {
      if (prevItem.status === 'passed' && currItem.status === 'failed') {
        diffs.regressions.push({ key, from: 'passed', to: 'failed', suite: currItem.suite });
      } else if (prevItem.status === 'failed' && currItem.status === 'passed') {
        diffs.improvements.push({ key, from: 'failed', to: 'passed', suite: currItem.suite });
      }
    }
  }
  diffs.summary = {
    prevPassed: prev.numPassedTests,
    currPassed: curr.numPassedTests,
    prevFailed: prev.numFailedTests,
    currFailed: curr.numFailedTests,
    prevPending: prev.numPendingTests,
    currPending: curr.numPendingTests,
  };
  return diffs;
}

function run() {
  // Copiar resultado actual a previous si existe
  if (fs.existsSync(currentPath)) {
    fs.copyFileSync(currentPath, previousPath);
    console.log(`Baseline anterior copiada a ${path.basename(previousPath)}`);
  } else {
    console.log('No existe jest-results.json previo, se creará baseline nuevo.');
  }

  // Ejecutar jest en modo CI con reporte JSON
  try {
    execSync('npx jest --ci --json --outputFile=jest-results.json --reporters=default', { stdio: 'inherit', cwd: root });
  } catch (e) {
    console.error('Jest finalizó con errores, se continuará para comparar resultados');
  }

  const prev = readJsonSafe(previousPath);
  const curr = readJsonSafe(currentPath);
  if (!curr) {
    console.error('No se pudo leer resultados actuales de Jest.');
    process.exit(2);
  }

  if (!prev) {
    console.log('Baseline no disponible. Se guardó el resultado actual como baseline.');
    fs.copyFileSync(currentPath, previousPath);
    console.log('Resumen actual:', {
      passed: curr.numPassedTests,
      failed: curr.numFailedTests,
      pending: curr.numPendingTests,
      total: curr.numTotalTests,
    });
    process.exit(curr.numFailedTests > 0 ? 1 : 0);
  }

  const diffs = compare(prev, curr);
  console.log('Comparación de regresión:');
  console.log('Resumen:', diffs.summary);
  if (diffs.regressions.length === 0) {
    console.log('Sin regresiones.');
  } else {
    console.log('Regresiones encontradas:');
    for (const r of diffs.regressions) {
      console.log(`- ${r.key} (${r.suite}): ${r.from} -> ${r.to}`);
    }
  }
  if (diffs.improvements.length > 0) {
    console.log('Mejoras encontradas:');
    for (const i of diffs.improvements) {
      console.log(`- ${i.key} (${i.suite}): ${i.from} -> ${i.to}`);
    }
  }

  // Salir con código 1 si hay regresiones
  process.exit(diffs.regressions.length > 0 ? 1 : 0);
}

run();