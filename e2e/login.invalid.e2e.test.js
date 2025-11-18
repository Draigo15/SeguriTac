describe('Autenticación - Credenciales inválidas', () => {
  it('muestra error al iniciar sesión con credenciales incorrectas (sin bypass)', async () => {
    // Desactivar bypass E2E para forzar flujo real
    await waitFor(element(by.id('e2e-disable-bypass')))
      .toBeVisible()
      .withTimeout(20000);
    await element(by.id('e2e-disable-bypass')).tap();

    // Ingresar credenciales inválidas
    await element(by.id('login-email')).replaceText('autoridad@ciudad.com');
    await element(by.id('login-password')).replaceText('WrongPass123');
    await element(by.id('login-submit')).tap();

    // Esperar mensaje de error (Toast o texto renderizado)
    try {
      await waitFor(element(by.text('Correo o contraseña incorrectos.')))
        .toBeVisible()
        .withTimeout(10000);
    } catch (e) {
      // Fallback si el backend/red no permite devolver el código específico
      await waitFor(element(by.text('Error de inicio de sesión')))
        .toBeVisible()
        .withTimeout(10000);
    }
  });
});