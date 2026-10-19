const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships a WebAssembly binary.
config.resolver.assetExts.push('wasm');

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
});

