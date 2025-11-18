describe('Autenticación - Persistencia de sesión', () => {
  it('mantiene sesión después de relanzar la app', async () => {
    // Si el dashboard aparece por bypass, seguimos. Si no, hacemos login.
    try {
      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(12000);
    } catch (_) {
      await waitFor(element(by.id('login-submit')))
        .toBeVisible()
        .withTimeout(20000);
      await element(by.id('login-submit')).tap();
      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(25000);
    }

    // Relanzar la app y verificar que sigue autenticado
    const defaultUrl = 'http://127.0.0.1:8081';
    const bundleURL = (process.env.EXPO_BUNDLE_URL || defaultUrl).trim();
    const devClientURL = `seguridadciudadanaapp://expo-development-client/?url=${encodeURIComponent(bundleURL)}`;
    try {
      await device.reverseTcpPort(8081);
    } catch (_) {}
    await device.launchApp({ newInstance: true, launchArgs: { detoxEnableSynchronization: 0 }, url: devClientURL });
    await new Promise(r => setTimeout(r, 4000));

    await waitFor(element(by.id('dashboard-authority')))
      .toBeVisible()
      .withTimeout(25000);
  });
});