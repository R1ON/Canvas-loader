module.exports = () => ({
  devServer: {
    contentBase: ['./source/images'],
    historyApiFallback: true,
    // hot: true,
    compress: true,
    overlay: true,
    port: 9000,
    publicPath: '/',
    // quiet: true,
    clientLogLevel: 'error',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});
