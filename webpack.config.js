const path = require('path');

const merge = require('webpack-merge');

const HtmlWebPackPlugin = require('html-webpack-plugin');

const babel = require('./webpack/babel');
const devServer = require('./webpack/dev-server');
const fonts = require('./webpack/fonts');
const images = require('./webpack/images');
const html = require('./webpack/html');
const optimization = require('./webpack/optimization');
const eslint = require('./webpack/eslint');
const css = require('./webpack/css');
const sass = require('./webpack/sass');

const isProd = process.env.NODE_ENV === 'production';

const PATH = {
  src: path.join(__dirname, 'source'),
  build: path.join(__dirname, 'build'),
};

const plugins = [
  new HtmlWebPackPlugin({
    template: `${PATH.src}/views/index.html`,
    favicon: `${PATH.src}/images/favicon.ico`,
  }),
];

const rules = [babel(), html(), fonts(), images(), eslint(), css(), sass()];

const common = {
  entry: {
    app: ['./source/scripts/index.jsx'],
  },
  output: {
    path: PATH.build,
    filename: 'bundle.[hash].js',
    chunkFilename: '[name].chunk.[hash].js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: ['node_modules'],
    alias: {
      common: path.resolve(__dirname, 'source/scripts/common'),
    },
  },
  module: {
    rules,
  },
  plugins,
};

const prodConf = merge([common, optimization()]);
const devConf = merge([
  common,
  {
    devtool: 'cheap-module-source-map',
    optimization: {
      namedModules: true,
    },
    performance: {
      hints: false,
    },
  },
  devServer(),
]);

module.exports = () => (isProd ? prodConf : devConf);
