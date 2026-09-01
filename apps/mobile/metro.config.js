const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const appNodeModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [appNodeModules, path.resolve(monorepoRoot, 'node_modules')],
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg', 'cjs'],
  unstable_enablePackageExports: false,
  resolveRequest: (context, moduleName, platform) => {
    // In this pnpm monorepo the web app uses react@19 while mobile uses react@18.
    // Metro can accidentally bundle both; force all react imports to the mobile copy.
    if (moduleName === 'react' || moduleName.startsWith('react/')) {
      const subpath =
        moduleName === 'react' ? 'index.js' : `${moduleName.slice('react/'.length)}.js`;

      return {
        type: 'sourceFile',
        filePath: path.join(appNodeModules, 'react', subpath),
      };
    }

    if (platform !== 'web' && (moduleName === 'react-dom' || moduleName.startsWith('react-dom/'))) {
      return { type: 'empty' };
    }

    if (defaultResolveRequest) {
      return defaultResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
