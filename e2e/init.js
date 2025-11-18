// Ensure Android SDK is discoverable for Detox on Windows
if (!process.env.ANDROID_SDK_ROOT) {
  const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA || '';
  if (localAppData) {
    process.env.ANDROID_SDK_ROOT = `${localAppData}\\Android\\Sdk`;
  }
}

// Aumentar timeout para dar más tiempo al Dev Client
jest.setTimeout(120000);

beforeAll(async () => {
  // Simplificado: lanzar la app directamente sin complicaciones
  await device.launchApp({ 
    newInstance: true,
    launchArgs: {
      detoxPrintBusyIdleResources: 'YES'
    }
  });
  
  // Esperar a que la app se estabilice
  await new Promise((resolve) => setTimeout(resolve, 3000));
}, 120000);

afterAll(async () => {
  // Cleanup básico
  await device.terminateApp();
});