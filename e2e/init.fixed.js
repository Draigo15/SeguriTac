jest.setTimeout(300000);

beforeAll(async () => {
  const defaultUrl = 'http://localhost:8081';
  const bundleURL = (process.env.EXPO_BUNDLE_URL || defaultUrl).trim();
  const params = new URLSearchParams({ role: 'ciudadano', disableBypass: '1' }).toString();
  const devClientURL = `seguridadciudadanaapp://expo-development-client/?url=${encodeURIComponent(bundleURL)}&${params}`;
  try {
    await device.reverseTcpPort(8081);
  } catch (_) {}
  await device.launchApp({ newInstance: true, launchArgs: { detoxEnableSynchronization: 0 }, url: devClientURL });
  try {
    await new Promise(r => setTimeout(r, 5000));
  } catch (_) {}
  await new Promise(r => setTimeout(r, 25000));
});

afterAll(async () => {
});