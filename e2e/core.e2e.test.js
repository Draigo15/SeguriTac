describe('Core - Dashboard y estado base', () => {
  it('muestra el dashboard de autoridad tras el arranque', async () => {
    // La app se lanza en beforeAll (e2e/init.js) y en modo Detox puede hacer bypass de login.
    // Si aún no se muestra el dashboard, intenta pulsar el botón de login.

    try {
      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(10000);
      return;
    } catch (_) {}

    // Intento estándar de acceso si el bypass no ocurrió.
    await waitFor(element(by.id('login-submit')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.id('login-submit')).tap();

    await waitFor(element(by.id('dashboard-authority')))
      .toBeVisible()
      .withTimeout(20000);
  });
});