module.exports = {
  webpack: {
    configure: webpackConfig => {
      // 🚀 OPTIMISATION BUNDLE: Configuration splitChunks avancée
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            // 🎯 Chunk Firebase (priorité haute)
            firebase: {
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // 🗺️ Chunk Mapbox (très volumineux)
            mapbox: {
              test: /[\\/]node_modules[\\/](mapbox-gl|react-map-gl)[\\/]/,
              name: 'mapbox',
              chunks: 'all',
              priority: 25,
              enforce: true,
            },
            // 🎨 Chunk UI/Animations
            ui: {
              test: /[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // 📦 Chunk vendor général (React, etc.)
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
          },
        };

        // 🚀 Optimisations Runtime
        webpackConfig.optimization.runtimeChunk = {
          name: 'runtime',
        };

        // 🚀 Optimisations ModuleConcatenation
        webpackConfig.optimization.concatenateModules = true;
      }

      return webpackConfig;
    },
  },

  // 🚀 Optimisations Jest pour les tests
  jest: {
    configure: jestConfig => {
      jestConfig.testEnvironment = 'jsdom';
      jestConfig.setupFilesAfterEnv = ['<rootDir>/src/setupTests.js'];
      return jestConfig;
    },
  },
};
