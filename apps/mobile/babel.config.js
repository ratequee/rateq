module.exports = function (api) {
  api.cache(true);
  return {
    // require.resolve so pnpm/EAS can find the preset (not hoisted by bare name)
    presets: [
      [require.resolve('babel-preset-expo'), { jsxImportSource: 'nativewind' }],
      require.resolve('nativewind/babel'),
    ],
  };
};
