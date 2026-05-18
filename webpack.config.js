const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};

  config.resolve.alias['react-native-maps'] = path.resolve(__dirname, 'web-stubs/react-native-maps.js');

  return config;
};
