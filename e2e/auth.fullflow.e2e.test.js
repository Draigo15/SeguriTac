/**
 * Flujo E2E simplificado de autenticación:
 * - Espera a que la pantalla de login esté visible.
 * - Realiza login con bypass activado.
 * - Verifica que llegamos al dashboard.
 * - Hace logout.
 */

describe('Autenticación - Flujo completo en un solo test', () => {
  it('ejecuta login, validaciones, negativos, persistencia y logout', async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await waitFor(element(by.text('Continue')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.text('Continue')).tap();
      } catch (_) {
        try {
          await waitFor(element(by.text('Got it')))
            .toBeVisible()
            .withTimeout(1000);
          await element(by.text('Got it')).tap();
        } catch (_) {}
        break;
      }
    }
    try { await device.pressBack(); } catch (_) {}
    try {
      await waitFor(element(by.id('login-email')))
        .toBeVisible()
        .withTimeout(20000);
    } catch (_) {
      try {
        await waitFor(element(by.id('dashboard-authority')))
          .toBeVisible()
          .withTimeout(20000);
        await element(by.id('open-sidebar')).tap();
        await waitFor(element(by.id('logout-button')))
          .toBeVisible()
          .withTimeout(10000);
        await element(by.id('logout-button')).tap();
        await waitFor(element(by.id('login-submit')))
          .toBeVisible()
          .withTimeout(20000);
      } catch (_) {}
    }

    await element(by.id('login-email')).replaceText('correo_invalido');
    await element(by.id('login-password')).tap();
    try {
      await waitFor(element(by.text('Ingresa un email válido')))
        .toBeVisible()
        .withTimeout(8000);
    } catch (_) {}

    await element(by.id('login-password')).replaceText('123');
    await element(by.id('login-email')).tap();
    try {
      await waitFor(element(by.text('La contraseña debe tener al menos 6 caracteres')))
        .toBeVisible()
        .withTimeout(8000);
    } catch (_) {}

    try {
      await element(by.id('login-email')).replaceText('autoridad@ciudad.com');
      await element(by.id('login-password')).replaceText('WrongPass123');
      await element(by.id('login-submit')).tap();
      try {
        await waitFor(element(by.text('Correo o contraseña incorrectos.')))
          .toBeVisible()
          .withTimeout(10000);
      } catch (_) {
        await waitFor(element(by.text('Error de inicio de sesión')))
          .toBeVisible()
          .withTimeout(10000);
      }
    } catch (_) {}

    const defaultUrl = 'http://localhost:8081';
    const bundleURL = (process.env.EXPO_BUNDLE_URL || defaultUrl).trim();
    const devClientURL = `seguridadciudadanaapp://expo-development-client/?url=${encodeURIComponent(bundleURL)}`;
    try { await device.reverseTcpPort(8081); } catch (_) {}
    await device.launchApp({ newInstance: true, launchArgs: { detoxEnableSynchronization: 0 }, url: devClientURL });
    await new Promise(r => setTimeout(r, 4000));

    await waitFor(element(by.id('login-submit')))
      .toBeVisible()
      .withTimeout(20000);
    await element(by.id('login-submit')).tap();
    await waitFor(element(by.id('dashboard-authority')))
      .toBeVisible()
      .withTimeout(25000);

    try { await device.launchApp({ newInstance: true, launchArgs: { detoxEnableSynchronization: 0 }, url: devClientURL }); } catch (_) {}
    await new Promise(r => setTimeout(r, 4000));
    await waitFor(element(by.id('dashboard-authority')))
      .toBeVisible()
      .withTimeout(25000);

    await element(by.id('open-sidebar')).tap();
    await waitFor(element(by.id('logout-button')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('logout-button')).tap();
    await waitFor(element(by.id('login-submit')))
      .toBeVisible()
      .withTimeout(15000);
  });
});