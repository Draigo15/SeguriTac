if (!process.env.ANDROID_SDK_ROOT) {
  const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA || '';
  if (localAppData) {
    process.env.ANDROID_SDK_ROOT = `${localAppData}\\Android\\Sdk`;
  }
}

jest.setTimeout(300000);

beforeAll(async () => {
  const defaultUrl = 'http://localhost:8081';
  const bundleURL = (process.env.EXPO_BUNDLE_URL || defaultUrl).trim();
  const devClientURL = `exp+seguridadciudadanaapp://expo-development-client/?url=${encodeURIComponent(bundleURL)}`;
  try {
    await device.reverseTcpPort(8081);
  } catch (_) {}
  await device.launchApp({ newInstance: true, launchArgs: { detoxEnableSynchronization: 0 }, url: devClientURL });
  await new Promise(r => setTimeout(r, 15000));
});

afterAll(async () => {
});