const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [{ test: /\.ts$/, use: { loader: "ts-loader", options: { transpileOnly: true } } }]
  },
  resolve: { extensions: [".ts", ".js"] },
  externals: {
    skyrimPlatform: "commonjs2 skyrimPlatform"
  },
  output: {
    filename: "skyguide.js",
    path: path.resolve(__dirname, "dist")
  },
  target: "node"
};
