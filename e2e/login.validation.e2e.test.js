describe('Login - Validación de formulario', () => {
  it('muestra errores de email y contraseña', async () => {
    await waitFor(element(by.text('Correo electrónico')))
      .toBeVisible()
      .withTimeout(20000);

    // Email inválido
    await element(by.text('Correo electrónico')).replaceText('correo_invalido');
    // Mover foco para disparar validación
    await element(by.text('Contraseña')).tap();

    await waitFor(element(by.text('Ingresa un email válido')))
      .toBeVisible()
      .withTimeout(8000);

    // Contraseña demasiado corta
    await element(by.text('Contraseña')).replaceText('123');
    await element(by.text('Correo electrónico')).tap();

    await waitFor(element(by.text('La contraseña debe tener al menos 6 caracteres')))
      .toBeVisible()
      .withTimeout(8000);
  });
});