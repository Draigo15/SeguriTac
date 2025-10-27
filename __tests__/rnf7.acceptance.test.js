/**
 * RNF-7 Aceptación: Escalabilidad (multi-zona/distrito sin rediseño)
 *
 * Verifica que las consultas de datos acepten particionamiento lógico por `zone`
 * y que la ruta de colección no esté acoplada a un distrito específico.
 */

jest.mock('expo-file-system', () => ({}));
jest.mock('expo-sharing', () => ({}));

describe('RNF-7 Escalabilidad - Aceptación', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('ExportService aplica filtro por zone cuando se especifica', async () => {
    const whereMock = jest.fn((field, op, value) => ({ type: 'where', field, op, value }));
    const orderByMock = jest.fn((field, dir) => ({ type: 'orderBy', field, dir }));
    const collectionMock = jest.fn((db, name) => ({ type: 'collection', name }));
    const queryMock = jest.fn((coll, ...constraints) => ({ type: 'query', coll, constraints }));
    const getDocsMock = jest.fn(async () => ({ forEach: () => {} }));

    jest.doMock('firebase/firestore', () => ({
      collection: collectionMock,
      getDocs: getDocsMock,
      query: queryMock,
      where: whereMock,
      orderBy: orderByMock,
      Timestamp: { fromDate: (d) => d },
    }));

    jest.doMock('../src/services/firebase', () => ({ db: {} }));

    const { exportService } = require('../src/services/exportService');

    await exportService.getReportsData({ zone: 'Lima-Centro' });

    // Debe usar la colección base 'reports' (no hardcode por distrito)
    expect(collectionMock).toHaveBeenCalledWith({}, 'reports');

    // Debe incluir where('zone','==','Lima-Centro') entre los constraints
    const built = queryMock.mock.calls[0].slice(1);
    const hasZoneWhere = built.some(
      (c) => c && c.type === 'where' && c.field === 'zone' && c.op === '==' && c.value === 'Lima-Centro'
    );
    expect(hasZoneWhere).toBe(true);

    // Debe mantener orderBy por createdAt para eficiencia
    const hasOrderBy = built.some((c) => c && c.type === 'orderBy' && c.field === 'createdAt');
    expect(hasOrderBy).toBe(true);
  });

  test('ExportService no fuerza zona cuando no se especifica (flexible multi-distrito)', async () => {
    const whereMock = jest.fn((field, op, value) => ({ type: 'where', field, op, value }));
    const orderByMock = jest.fn((field, dir) => ({ type: 'orderBy', field, dir }));
    const collectionMock = jest.fn((db, name) => ({ type: 'collection', name }));
    const queryMock = jest.fn((coll, ...constraints) => ({ type: 'query', coll, constraints }));
    const getDocsMock = jest.fn(async () => ({ forEach: () => {} }));

    jest.doMock('firebase/firestore', () => ({
      collection: collectionMock,
      getDocs: getDocsMock,
      query: queryMock,
      where: whereMock,
      orderBy: orderByMock,
      Timestamp: { fromDate: (d) => d },
    }));

    jest.doMock('../src/services/firebase', () => ({ db: {} }));

    const { exportService } = require('../src/services/exportService');

    await exportService.getReportsData();

    // Debe usar 'reports' como colección base
    expect(collectionMock).toHaveBeenCalledWith({}, 'reports');

    // Debe construir consulta con orderBy pero sin where de zone
    const built = queryMock.mock.calls[0].slice(1);
    const hasZoneWhere = built.some((c) => c && c.type === 'where' && c.field === 'zone');
    expect(hasZoneWhere).not.toBe(true);
  });
});