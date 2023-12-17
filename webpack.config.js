const path = require('path');

module.exports = {
  // Set the mode to 'development' or 'production'.
  mode: 'development',

  // Entry file where Webpack starts bundling.
  entry: './src/index.js', // Update with your entry file.

  // Output configuration for the bundle.
  output: {
    path: path.resolve(__dirname, 'dist'), // Directory where the bundle will be placed.
    filename: 'bundle.js', // Name of the bundled file.
  },

  // Configuration for modules (Loaders, Resolvers).
  module: {
    rules: [
      // Rules for JS and other file types go here.
    ],
  },

  // Optional: Configuration for development server.
  devServer: {
    static: './dist',
  },
};
