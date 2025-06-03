module.exports = {
  fileURLToPath: jest.fn(() => '/mock/test.js'),
  pathToFileURL: jest.fn(() => ({ href: 'file:///mock/test.js' }))
};