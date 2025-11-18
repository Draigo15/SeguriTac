jest.setTimeout(300000);

describe('Smoke', () => {
  it('launches', async () => {
    await device.setOrientation('portrait');
  });
});