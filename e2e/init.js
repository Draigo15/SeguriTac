const { init, cleanup } = require('detox');
const config = require('../.detoxrc.json');

const configuration = config.configurations['android.emu.debug'];

beforeAll(async () => {
  await init(configuration);
});

afterAll(async () => {
  await cleanup();
});