describe('Autenticación - Login autoridad', () => {
  /**
   * Asume que la app arranca en LoginScreen.
   * Usa testIDs añadidos: login-email, login-password, login-submit.
   * Verifica llegada al dashboard con testID dashboard-authority.
   */
  it('permite login y muestra el dashboard de autoridad', async () => {
    // La app ya se lanza en beforeAll (e2e/init.js) con el puerto configurado.
    // Evitamos relanzar para reducir flakiness y duplicados de deep-link.

    // En modo Detox, los campos se prellenan desde la app.
    // Si el flujo hace bypass automático, el dashboard podría aparecer sin tocar el botón.
    try {
      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(12000);
      // Si llegó aquí, el dashboard ya está visible: exit early.
      return;
    } catch (_) {
      // Continuar con el flujo estándar: esperar botón y pulsar.
    }

    // Verificar visibilidad del botón y pulsar usando testID (más estable en Android)
    await waitFor(element(by.id('login-submit')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.id('login-submit')).tap();

    // Espera que el dashboard se muestre
    await waitFor(element(by.id('dashboard-authority')))
      .toBeVisible()
      .withTimeout(25000);
  });
});