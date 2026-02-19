const nodeExternals = require('webpack-node-externals');
const { join } = require('path');

module.exports = (options) => {
  return {
    ...options,
    externals: [nodeExternals()],
    output: {
      ...options.output,
      path: join(__dirname, 'dist'),
      filename: 'main.js',
      libraryTarget: 'commonjs2',
    },
  };
};
