describe('Core - Reportes ciudadano: crear, filtrar y cancelar', () => {
  it('crea un reporte, lo filtra en Mis Reportes y lo cancela', async () => {
    const description = `Prueba E2E ciudadano ${Date.now()}: Robo en mercado`;
    // Arranque y sincronización con fallback de login
    try {
      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(10000);
    } catch (_) {
      await waitFor(element(by.id('login-submit')))
        .toBeVisible()
        .withTimeout(15000);
      await element(by.id('login-submit')).tap();

      await waitFor(element(by.id('dashboard-authority')))
        .toBeVisible()
        .withTimeout(20000);
    }

    try { await device.enableSynchronization(); } catch (_) {}

    // Navegar a crear reporte
    let navigatedToReport = false;
    try {
      await element(by.text('Crear Reporte')).tap();
      navigatedToReport = true;
    } catch (e1) {
      // Fallback por deep link directo a Report
      try {
        await device.openURL({ url: 'exp+seguridadciudadanaapp://report' });
        navigatedToReport = true;
      } catch (e2) {}
    }

    // Verifica estar en la pantalla de reporte
    if (!navigatedToReport) {
      // Como último recurso, intenta el botón de acceso rápido por texto
      await element(by.text('Reportar Incidente')).tap();
    }

    // Seleccionar tipo de incidente
    try {
      await element(by.id('incident-type-picker')).tap();
    } catch (_) {
      // Si el picker no tiene testID, abrir por texto del label
      await element(by.text('Selecciona un tipo...')).tap();
    }
    await waitFor(element(by.text('Robo'))).toBeVisible().withTimeout(5000);
    await element(by.text('Robo')).tap();

    // Completar descripción
    await element(by.id('report-description-input')).replaceText(description);

    // Enviar reporte y confirmar alerta
    await element(by.text('Enviar Reporte')).tap();
    await waitFor(element(by.text('¿Enviar reporte?'))).toBeVisible().withTimeout(5000);
    await element(by.text('Enviar')).tap();

    // Esperar navegación a Mis Reportes
    await waitFor(element(by.id('reports-search-input'))).toBeVisible().withTimeout(20000);

    // Filtrar por la descripción única del reporte
    await element(by.id('reports-search-input')).replaceText(description);

    // Esperar a que aparezca el item filtrado
    await waitFor(element(by.id('report-item'))).toBeVisible().withTimeout(10000);

    // Cancelar el reporte desde la lista
    await element(by.id('cancel-report-button')).tap();

    // Confirmar en el diálogo de cancelación
    await waitFor(element(by.id('cancel-dialog'))).toBeVisible().withTimeout(5000);
    await element(by.id('confirm-cancel-button')).tap();

    // Confirmar alerta de éxito
    await waitFor(element(by.text('Reporte cancelado'))).toBeVisible().withTimeout(5000);
    await element(by.text('OK')).tap();

    // Verificar que ya no aparece el item tras filtrar
    try {
      await expect(element(by.id('report-item'))).not.toExist();
    } catch (_) {
      // Como fallback, limpiar búsqueda y verificar que el item no coincide por texto
      await element(by.id('reports-search-input')).clearText();
      await element(by.id('reports-search-input')).replaceText(description);
      await expect(element(by.id('report-item'))).not.toExist();
    }
  });
});