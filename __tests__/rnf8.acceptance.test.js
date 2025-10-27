/**
 * RNF-8 Tolerancia a Errores — Prueba de aceptación
 *
 * Verifica que el wrapper `robustOnSnapshot` reintenta de forma controlada
 * ante errores transitorios tipo `ERR_ABORTED` y logra re-suscribirse sin
 * crashear, invocando finalmente el callback de datos (`onNext`).
 */

// Asegurar que __DEV__ exista antes de importar el wrapper
// para evitar ReferenceError en tiempo de importación
// eslint-disable-next-line no-undef
global.__DEV__ = false;

jest.useFakeTimers();

describe('RNF-8 Tolerancia a Errores - Aceptación', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('robustOnSnapshot reintenta ante ERR_ABORTED y entrega datos', async () => {
    const unsubscribeMock = jest.fn();

    // Mock de firebase/firestore con onSnapshot que falla 1ª vez y luego tiene éxito
    const onSnapshotMock = jest
      .fn()
      // 1ª suscripción: invoca callback de error inmediatamente
      .mockImplementationOnce((_query, onNext, onError) => {
        onError && onError({ code: 'aborted', message: 'net::ERR_ABORTED' });
        return unsubscribeMock;
      })
      // 2ª suscripción: invoca callback de datos con un snapshot simulado
      .mockImplementationOnce((_query, onNext) => {
        onNext({ docs: [], size: 0 });
        return unsubscribeMock;
      });

    jest.doMock('firebase/firestore', () => ({
      onSnapshot: onSnapshotMock,
    }));
    // Evitar dependencia de expo/* al importar firebase.ts
    jest.doMock('../src/services/firebase', () => ({ db: {} }));
    jest.doMock('../src/services/errorHandling', () => ({
      handleFirebaseError: (e) => (e && e.message) || String(e),
      logError: jest.fn(),
      createAppError: (_type, message, _err, _where) => ({ message }),
      ErrorType: { FIREBASE: 'FIREBASE', NETWORK: 'NETWORK' },
    }));

    const { robustOnSnapshot } = require('../src/services/firestoreWrapper');

    const queryLike = { type: 'query' };
    const onNext = jest.fn();
    const onError = jest.fn();

    robustOnSnapshot(queryLike, onNext, onError, { maxRetries: 2, retryDelay: 100 });

    // Avanzar temporizadores para permitir el reintento programado
    jest.advanceTimersByTime(150);

    expect(onSnapshotMock).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({ size: 0 }));
  });

  test('robustOnSnapshot delega a onError en errores no transitorios', () => {
    const unsubscribeMock = jest.fn();
    const onSnapshotMock = jest.fn().mockImplementation((_q, _onNext, onError) => {
      onError && onError({ code: 'permission-denied', message: 'denied' });
      return unsubscribeMock;
    });

    jest.doMock('firebase/firestore', () => ({
      onSnapshot: onSnapshotMock,
    }));
    jest.doMock('../src/services/firebase', () => ({ db: {} }));
    jest.doMock('../src/services/errorHandling', () => ({
      handleFirebaseError: (e) => (e && e.message) || String(e),
      logError: jest.fn(),
      createAppError: (_type, message, _err, _where) => ({ message }),
      ErrorType: { FIREBASE: 'FIREBASE', NETWORK: 'NETWORK' },
    }));

    const { robustOnSnapshot } = require('../src/services/firestoreWrapper');

    const onNext = jest.fn();
    const onError = jest.fn();

    robustOnSnapshot({ type: 'query' }, onNext, onError, { maxRetries: 2, retryDelay: 100 });

    // Avanzar tiempo para verificar que no se reintenta
    jest.advanceTimersByTime(500);

    expect(onSnapshotMock).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'permission-denied' }));
  });
});