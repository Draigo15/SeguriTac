describe('Autenticación - Logout vía sidebar', () => {
  it('cierra sesión desde el sidebar y vuelve a Login', async () => {
    // Intento de detectar dashboard rápido
    try {
      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(12000);
    } catch (_) {
      // Si no, realizar login mediante botón
      await waitFor(element(by.id('login-submit')))
        .toBeVisible()
        .withTimeout(20000);
      await element(by.id('login-submit')).tap();
      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(25000);
    }

    // Abrir sidebar y pulsar logout
    await element(by.id('open-sidebar')).tap();
    await waitFor(element(by.id('logout-button')))
      .toBeVisible()
      .withTimeout(8000);
    await element(by.id('logout-button')).tap();

    // Verificar retorno a Login
    await waitFor(element(by.id('login-submit')))
      .toBeVisible()
      .withTimeout(15000);
  });
});