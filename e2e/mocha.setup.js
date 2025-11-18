// Ensure Android SDK is discoverable for Detox on Windows
if (!process.env.ANDROID_SDK_ROOT) {
  const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA || '';
  if (localAppData) {
    process.env.ANDROID_SDK_ROOT = `${localAppData}\\Android\\Sdk`;
  }
}

function normalizeBundleURL(input) {
  const raw = (input || '').trim();
  if (!raw) return 'http://localhost:8081';
  try {
    const url = new URL(raw);
    const hostname = url.hostname || 'localhost';
    const port = url.port || '8081';
    const protocol = url.protocol || 'http:';
    return `${protocol}//${hostname}:${port}`;
  } catch (_) {
    const match = raw.match(/^https?:\/\/([^\/:]+)(?::(\d+))?/);
    const host = (match && match[1]) || 'localhost';
    const port = (match && match[2]) || '8081';
    return `http://${host}:${port}`;
  }
}

// Initialize Detox programmatically for Mocha (bypassing Detox CLI)
const detoxModule = require('detox');
const detox = detoxModule && typeof detoxModule.init === 'function' ? detoxModule : (detoxModule && detoxModule.default ? detoxModule.default : detoxModule);
const path = require('path');
let detoxConfig;
try {
  detoxConfig = require(path.join(process.cwd(), '.detoxrc.json'));
} catch (_) {
  // Fallback to local path
  detoxConfig = require('../.detoxrc.json');
}

// Mocha lifecycle hooks via plugin export
exports.mochaHooks = {
  async beforeAll() {
    await detox.init(detoxConfig, { configuration: 'android.emu.debug' });
    const useDevClient = !!process.env.EXPO_BUNDLE_URL;
    if (useDevClient) {
      const url = normalizeBundleURL(process.env.EXPO_BUNDLE_URL);
      const devClientURL = `seguridadciudadanaapp://expo-development-client/?url=${encodeURIComponent(url)}`;
      console.log('[Detox:mocha] Launching Dev Client with bundle URL:', url);
      console.log('[Detox:mocha] Dev Client deep link:', devClientURL);
      try {
        if (/localhost|127\.0\.0\.1/.test(url)) {
          await device.reverseTcpPort(8081);
          await device.reverseTcpPort(8822);
        }
      } catch (_) {}
      await device.launchApp({ newInstance: true });
      await new Promise((r) => setTimeout(r, 1000));
      try {
        await device.openURL({ url: devClientURL });
      } catch (e) {
        console.warn('[Detox:mocha] Failed to open Dev Client deep link, app should auto-connect to Metro.', e);
      }
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      console.log('[Detox:mocha] Launching app with embedded bundle (no Dev Client)');
      try {
        await device.reverseTcpPort(8822);
      } catch (_) {}
      await device.launchApp({ newInstance: true });
      await new Promise((r) => setTimeout(r, 1500));
    }
  },
  async afterAll() {
    await detox.cleanup();
  }
};