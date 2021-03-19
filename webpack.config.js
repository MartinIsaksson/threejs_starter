const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/'
  },
  plugins:
    [
      new CopyWebpackPlugin(
        { patterns: [{ from: path.resolve(__dirname, 'static') }] })
    ],
  devServer: {
    port: 9000,
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      // Images
      {
        test: /\.(jpg|png|gif|svg)$/,
        use:
          [
            {
              loader: 'file-loader',
              options:
              {
                outputPath: 'assets/images/'
              }
            }
          ]
      },

      // Shaders
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: "ts-shader-loader"
        // use: [
        //   'raw-loader',
        //   'glslify-loader'
        // ]
      }
    ]
  },
  watchOptions: {
    ignored: /node_modules/
  }
}
