describe('Login autoridad - flujo básico', () => {
  /**
   * Asume que la app arranca en LoginScreen.
   * Usa testIDs añadidos: login-email, login-password, login-submit.
   * Verifica llegada al dashboard con testID dashboard-authority.
   */
  it('permite login y muestra el dashboard de autoridad', async () => {
    await device.launchApp({ newInstance: true });

    await expect(element(by.id('login-email'))).toBeVisible();
    await element(by.id('login-email')).typeText('autoridad@ciudad.com');

    await expect(element(by.id('login-password'))).toBeVisible();
    await element(by.id('login-password')).typeText('Password123!');

    await element(by.id('login-submit')).tap();

    // Espera que el dashboard se muestre
    await waitFor(element(by.id('dashboard-authority')))
      .toBeVisible()
      .withTimeout(10000);
  });
});